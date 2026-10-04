const Encounter = require('../models/Encounter');
const Vital = require('../models/Vital');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const Invoice = require('../models/Invoice');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get or create encounter
// @route   POST /api/v1/clinical/encounters
// @access  Private
exports.createOrGetEncounter = async (req, res, next) => {
  try {
    const { patient, appointment, doctor, department, encounterType, chiefComplaint } = req.body;

    let encounter;
    if (appointment) {
      encounter = await Encounter.findOne({ appointment, tenant: req.tenantId });
    }

    if (!encounter) {
      const count = await Encounter.countDocuments({ tenant: req.tenantId });
      const encSeq = String(count + 1).padStart(4, '0');
      const encounterNumber = `ENC-${new Date().getFullYear()}-${encSeq}`;

      encounter = await Encounter.create({
        tenant: req.tenantId,
        branch: req.branchId || req.user.branch,
        patient,
        appointment,
        doctor: doctor || req.user._id,
        department: department || req.user.department,
        encounterNumber,
        encounterType: encounterType || 'OPD',
        chiefComplaint,
        status: 'In-Progress'
      });
    }

    const populated = await Encounter.findById(encounter._id)
      .populate('patient', 'uhid fullName age gender phone allergies chronicConditions bloodGroup')
      .populate('doctor', 'name doctorProfile')
      .populate('department', 'name');

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single encounter with clinical workspace data
// @route   GET /api/v1/clinical/encounters/:id
// @access  Private
exports.getEncounterById = async (req, res, next) => {
  try {
    const encounter = await Encounter.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    })
      .populate('patient')
      .populate('doctor', 'name doctorProfile')
      .populate('department', 'name');

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, encounter.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to view clinical records from another branch.'
      });
    }

    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId || encounter.patient?._id?.toString() !== ownPatientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only view your own medical records'
        });
      }
    }

    // Fetch vitals and prescriptions for this encounter
    const vitals = await Vital.find({ encounter: encounter._id, tenant: req.tenantId }).sort({ createdAt: -1 });
    const prescriptions = await Prescription.find({ encounter: encounter._id, tenant: req.tenantId });

    res.status(200).json({
      success: true,
      data: {
        encounter,
        vitals,
        prescriptions
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update encounter clinical notes & finalize
// @route   PUT /api/v1/clinical/encounters/:id
// @access  Private
exports.updateEncounter = async (req, res, next) => {
  try {
    const {
      chiefComplaint,
      historyOfPresentIllness,
      examinationFindings,
      systemicReview,
      clinicalNotes,
      followUpDate,
      followUpInstructions,
      status
    } = req.body;

    const encounter = await Encounter.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });

    if (!encounter) {
      return res.status(404).json({ success: false, error: 'Encounter not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, encounter.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to modify clinical records from another branch.'
      });
    }

    encounter.chiefComplaint = chiefComplaint || encounter.chiefComplaint;
    encounter.historyOfPresentIllness = historyOfPresentIllness || encounter.historyOfPresentIllness;
    encounter.examinationFindings = examinationFindings || encounter.examinationFindings;
    encounter.systemicReview = systemicReview || encounter.systemicReview;
    encounter.clinicalNotes = clinicalNotes || encounter.clinicalNotes;
    encounter.followUpDate = followUpDate || encounter.followUpDate;
    encounter.followUpInstructions = followUpInstructions || encounter.followUpInstructions;

    if (status) {
      encounter.status = status;
      if (status === 'Completed') {
        encounter.finalizedAt = new Date();

        // Clinical -> Financial Workflow: Automatically create consultation invoice if not yet billed
        const existingInvoice = await Invoice.findOne({
          encounter: encounter._id,
          tenant: req.tenantId
        });

        if (!existingInvoice) {
          let consultationFee = 500;
          let appointmentDoc = null;
          if (encounter.appointment) {
            appointmentDoc = await Appointment.findById(encounter.appointment);
            if (appointmentDoc?.consultationFee) {
              consultationFee = appointmentDoc.consultationFee;
            }
          }

          if (consultationFee === 500 && encounter.doctor) {
            const doctorUser = await User.findById(encounter.doctor);
            if (doctorUser?.doctorProfile?.consultationFee) {
              consultationFee = doctorUser.doctorProfile.consultationFee;
            }
          }

          const count = await Invoice.countDocuments({ tenant: req.tenantId });
          const invSeq = String(count + 1).padStart(4, '0');
          const invoiceNumber = `INV-${new Date().getFullYear()}-${invSeq}`;

          let createdInvoice = await Invoice.create({
            tenant: req.tenantId,
            branch: encounter.branch || req.branchId || req.user.branch,
            patient: encounter.patient,
            encounter: encounter._id,
            invoiceNumber,
            billingType: 'OPD Consultation',
            items: [
              {
                description: 'Outpatient Specialist Consultation',
                department: 'OPD',
                serviceCategory: 'Consultation',
                quantity: 1,
                unitPrice: consultationFee,
                totalAmount: consultationFee
              }
            ],
            subtotal: consultationFee,
            grandTotal: consultationFee,
            paidAmount: 0,
            balanceDue: consultationFee,
            status: 'Finalized',
            generatedBy: req.user._id
          });

          if (appointmentDoc) {
            appointmentDoc.status = 'Completed';
            await appointmentDoc.save();
          }

          await encounter.save();

          return res.status(200).json({
            success: true,
            data: encounter,
            invoice: createdInvoice
          });
        }
      }
    }

    await encounter.save();

    res.status(200).json({
      success: true,
      data: encounter
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record patient vitals
// @route   POST /api/v1/clinical/vitals
// @access  Private
exports.recordVitals = async (req, res, next) => {
  try {
    const {
      patient,
      encounter,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      pulse,
      temperature,
      respiratoryRate,
      spo2,
      height,
      weight,
      bloodSugarRandom,
      painScore,
      remarks
    } = req.body;

    const vital = await Vital.create({
      tenant: req.tenantId,
      branch: req.user.branch,
      patient,
      encounter,
      recordedBy: req.user._id,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      pulse,
      temperature,
      respiratoryRate,
      spo2,
      height,
      weight,
      bloodSugarRandom,
      painScore,
      remarks
    });

    res.status(201).json({
      success: true,
      message: 'Vitals recorded successfully',
      data: vital
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vitals history for a patient
// @route   GET /api/v1/clinical/vitals/:patientId
// @access  Private
exports.getPatientVitals = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId || req.params.patientId !== ownPatientId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only view your own vitals'
        });
      }
    }

    const vitals = await Vital.find({
      patient: req.params.patientId,
      tenant: req.tenantId
    })
      .populate('recordedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vitals.length,
      data: vitals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create e-Prescription
// @route   POST /api/v1/clinical/prescriptions
// @access  Private
exports.createPrescription = async (req, res, next) => {
  try {
    const {
      patient,
      encounter,
      diagnosis,
      medications,
      dietAdvice,
      generalAdvice
    } = req.body;

    const count = await Prescription.countDocuments({ tenant: req.tenantId });
    const rxSeq = String(count + 1).padStart(4, '0');
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${rxSeq}`;

    const prescription = await Prescription.create({
      tenant: req.tenantId,
      branch: req.branchId || req.user.branch,
      patient,
      encounter,
      doctor: req.user._id,
      prescriptionNumber,
      diagnosis,
      medications: medications || [],
      dietAdvice,
      generalAdvice,
      isFinalized: true,
      signedAt: new Date()
    });

    // Populate
    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'uhid fullName age gender phone')
      .populate('doctor', 'name doctorProfile');

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Generate e-Prescription',
      module: 'Clinical / EMR',
      entityId: prescription._id.toString(),
      entityType: 'Prescription',
      details: `Prescription ${prescriptionNumber} issued with ${medications?.length || 0} drugs for ${populated.patient?.fullName}`
    });

    res.status(201).json({
      success: true,
      message: 'Prescription finalized and signed',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get encounters list with filters
// @route   GET /api/v1/clinical/encounters
// @access  Private
exports.getEncounters = async (req, res, next) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const query = { tenant: req.tenantId };

    if (req.branchId) {
      query.$or = [{ branch: req.branchId }, { branch: null }, { branch: { $exists: false } }];
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (patientId) {
      query.patient = patientId;
    }

    if (doctorId) {
      query.doctor = doctorId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const encounters = await Encounter.find(query)
      .populate('patient', 'uhid fullName age gender phone')
      .populate('doctor', 'name doctorProfile')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: encounters.length,
      data: encounters
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get prescriptions list with filters
// @route   GET /api/v1/clinical/prescriptions
// @access  Private
exports.getPrescriptions = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.query;
    const query = { tenant: req.tenantId };

    if (req.branchId) {
      query.$or = [{ branch: req.branchId }, { branch: null }, { branch: { $exists: false } }];
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (patientId) {
      query.patient = patientId;
    }

    if (doctorId) {
      query.doctor = doctorId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'uhid fullName age gender phone')
      .populate('doctor', 'name doctorProfile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (err) {
    next(err);
  }
};
