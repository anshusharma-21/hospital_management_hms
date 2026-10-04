const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Encounter = require('../models/Encounter');
const Vital = require('../models/Vital');
const Prescription = require('../models/Prescription');
const LabOrder = require('../models/LabOrder');
const RadiologyOrder = require('../models/RadiologyOrder');
const Admission = require('../models/Admission');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const EmergencyEncounter = require('../models/EmergencyEncounter');
const InsurancePolicy = require('../models/InsurancePolicy');
const AuditLog = require('../models/AuditLog');
const Feedback = require('../models/Feedback');

// @desc    Search / list patients with pagination and filters
// @route   GET /api/v1/patients
// @access  Private
exports.getPatients = async (req, res, next) => {
  try {
    // If authenticated user is a patient, strictly restrict to their own patient record
    if (req.user?.role === 'patient') {
      let patientId = req.user.patient;
      if (!patientId && req.user.phone) {
        const pat = await Patient.findOne({ tenant: req.tenantId, phone: req.user.phone });
        if (pat) patientId = pat._id;
      }

      if (!patientId) {
        return res.status(200).json({ success: true, count: 0, total: 0, page: 1, pages: 1, data: [] });
      }

      const patient = await Patient.findOne({ _id: patientId, tenant: req.tenantId })
        .populate('primaryBranch', 'name code');

      return res.status(200).json({
        success: true,
        count: patient ? 1 : 0,
        total: patient ? 1 : 0,
        page: 1,
        pages: 1,
        data: patient ? [patient] : []
      });
    }

    const { search, gender, branch, page = 1, limit = 20 } = req.query;
    const query = { tenant: req.tenantId };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { uhid: searchRegex },
        { fullName: searchRegex },
        { phone: searchRegex },
        { nationalId: searchRegex }
      ];
    }

    if (gender && gender !== 'all') {
      query.gender = gender;
    }

    // Branch Isolation: Sub-branches can ONLY view patients registered at their branch!
    // Main branch / Org Admin can view all or filter by specific branch.
    if (req.isSubBranch) {
      query.primaryBranch = req.branchId;
    } else if (branch && branch !== 'all') {
      query.primaryBranch = branch;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('primaryBranch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: patients
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register a new patient with duplicate check and auto UHID
// @route   POST /api/v1/patients
// @access  Private
exports.createPatient = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      age,
      gender,
      bloodGroup,
      maritalStatus,
      phone,
      alternatePhone,
      email,
      address,
      emergencyContact,
      nationalId,
      abhaId,
      allergies,
      chronicConditions,
      insuranceDetails,
      primaryBranch
    } = req.body;

    // Check for duplicate phone or nationalId in this tenant
    const existing = await Patient.findOne({
      tenant: req.tenantId,
      $or: [
        { phone: phone.trim() },
        ...(nationalId ? [{ nationalId: nationalId.trim() }] : [])
      ]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        error: `Potential duplicate patient found with matching phone/ID: ${existing.fullName} (UHID: ${existing.uhid})`,
        existingPatient: {
          id: existing._id,
          uhid: existing.uhid,
          fullName: existing.fullName,
          phone: existing.phone
        }
      });
    }

    // Generate UHID: HV-YYYY-XXXX
    const count = await Patient.countDocuments({ tenant: req.tenantId });
    const currentYear = new Date().getFullYear();
    const uhidSequence = String(count + 1).padStart(4, '0');
    const uhid = `HV-${currentYear}-${uhidSequence}`;

    const patient = await Patient.create({
      tenant: req.tenantId,
      primaryBranch: req.branchId || primaryBranch || req.user.branch,
      uhid,
      firstName,
      lastName,
      dob,
      age,
      gender,
      bloodGroup: bloodGroup || 'Unknown',
      maritalStatus: maritalStatus || 'Single',
      phone: phone.trim(),
      alternatePhone,
      email,
      address,
      emergencyContact,
      nationalId,
      abhaId,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      insuranceDetails,
      registeredBy: req.user._id
    });

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      branch: patient.primaryBranch,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Register Patient',
      module: 'Patients',
      entityId: patient._id.toString(),
      entityType: 'Patient',
      details: `New patient registered: ${patient.fullName} (UHID: ${uhid})`
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get authenticated patient profile
// @route   GET /api/v1/patients/me
// @access  Private
exports.getPatientMe = async (req, res, next) => {
  try {
    let patientId = req.user.patient;
    if (!patientId && req.user.phone) {
      const pat = await Patient.findOne({ tenant: req.tenantId, phone: req.user.phone });
      if (pat) {
        patientId = pat._id;
        req.user.patient = pat._id;
      }
    }

    if (!patientId) {
      return res.status(404).json({ success: false, error: 'Patient profile not found for this account' });
    }

    const patient = await Patient.findOne({
      _id: patientId,
      tenant: req.tenantId
    }).populate('primaryBranch', 'name code address phone');

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get patient profile by ID
// @route   GET /api/v1/patients/:id
// @access  Private
exports.getPatientById = async (req, res, next) => {
  try {
    if (req.params.id === 'me') {
      return exports.getPatientMe(req, res, next);
    }

    // Role patient can only access their own record
    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId || req.params.id !== ownPatientId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only view your own medical records' });
      }
    }

    const patient = await Patient.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    }).populate('primaryBranch', 'name code address phone');

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update patient details
// @route   PUT /api/v1/patients/:id
// @access  Private
exports.updatePatient = async (req, res, next) => {
  try {
    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId || req.params.id !== ownPatientId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only update your own medical record' });
      }
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get complete longitudinal patient timeline
// @route   GET /api/v1/patients/:id/timeline
// @access  Private
exports.getPatientTimeline = async (req, res, next) => {
  try {
    let patientId = req.params.id;

    if (patientId === 'me' || req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (req.user?.role === 'patient' && patientId !== 'me' && patientId !== ownPatientId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only view your own medical records' });
      }
      patientId = ownPatientId;
    }

    if (!patientId) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const patient = await Patient.findOne({ _id: patientId, tenant: req.tenantId });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Concurrently fetch all historical records for this patient
    const [
      appointments,
      encounters,
      vitals,
      prescriptions,
      labOrders,
      radiologyOrders,
      admissions,
      invoices
    ] = await Promise.all([
      Appointment.find({ patient: patientId, tenant: req.tenantId })
        .populate('doctor', 'name doctorProfile')
        .populate('department', 'name')
        .sort({ appointmentDate: -1 }),

      Encounter.find({ patient: patientId, tenant: req.tenantId })
        .populate('doctor', 'name doctorProfile')
        .populate('department', 'name')
        .sort({ createdAt: -1 }),

      Vital.find({ patient: patientId, tenant: req.tenantId })
        .populate('recordedBy', 'name role')
        .sort({ createdAt: -1 }),

      Prescription.find({ patient: patientId, tenant: req.tenantId })
        .populate('doctor', 'name doctorProfile')
        .sort({ createdAt: -1 }),

      LabOrder.find({ patient: patientId, tenant: req.tenantId })
        .populate('doctor', 'name')
        .sort({ createdAt: -1 }),

      RadiologyOrder.find({ patient: patientId, tenant: req.tenantId })
        .populate('doctor', 'name')
        .populate('radiologist', 'name')
        .sort({ createdAt: -1 }),

      Admission.find({ patient: patientId, tenant: req.tenantId })
        .populate('attendingDoctor', 'name')
        .populate('bed', 'bedNumber ward roomNumber')
        .sort({ admissionDate: -1 }),

      Invoice.find({ patient: patientId, tenant: req.tenantId })
        .sort({ createdAt: -1 })
    ]);

    // Build unified chronological timeline events
    const timeline = [];

    appointments.forEach(a => {
      timeline.push({
        id: a._id,
        type: 'APPOINTMENT',
        title: `Appointment with Dr. ${a.doctor?.name || 'Physician'} (${a.type})`,
        timestamp: a.appointmentDate,
        status: a.status,
        details: `Slot: ${a.slotTime}, Token: #${a.tokenNumber}. Status: ${a.status}`,
        meta: { doctor: a.doctor?.name, department: a.department?.name, token: a.tokenNumber }
      });
    });

    encounters.forEach(e => {
      timeline.push({
        id: e._id,
        type: 'ENCOUNTER',
        title: `Clinical Encounter (${e.encounterType}) - Dr. ${e.doctor?.name}`,
        timestamp: e.createdAt,
        status: e.status,
        details: e.chiefComplaint || 'Clinical consultation conducted',
        meta: { complaint: e.chiefComplaint, notes: e.clinicalNotes, followUp: e.followUpDate }
      });
    });

    vitals.forEach(v => {
      timeline.push({
        id: v._id,
        type: 'VITALS',
        title: `Vitals Recorded: BP ${v.bloodPressureSystolic || 120}/${v.bloodPressureDiastolic || 80}, Pulse ${v.pulse || 72} bpm`,
        timestamp: v.createdAt,
        details: `SpO2: ${v.spo2 || 98}%, Temp: ${v.temperature || 98.6}°F, BMI: ${v.bmi || 22.4}`,
        meta: { bp: `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`, pulse: v.pulse, spo2: v.spo2 }
      });
    });

    prescriptions.forEach(p => {
      timeline.push({
        id: p._id,
        type: 'PRESCRIPTION',
        title: `e-Prescription (${p.prescriptionNumber}) - Dr. ${p.doctor?.name}`,
        timestamp: p.signedAt || p.createdAt,
        details: `${p.medications?.length || 0} medications prescribed. Diagnosis: ${p.diagnosis || 'Clinical Rx'}`,
        meta: { medications: p.medications, count: p.medications?.length }
      });
    });

    labOrders.forEach(l => {
      timeline.push({
        id: l._id,
        type: 'LAB_ORDER',
        title: `Laboratory Diagnostics (${l.orderNumber})`,
        timestamp: l.createdAt,
        status: l.overallStatus,
        details: `${l.tests?.map(t => t.testName).join(', ')}. Barcode: ${l.sampleBarcode || 'N/A'}`,
        meta: { tests: l.tests, barcode: l.sampleBarcode, critical: l.criticalAlert }
      });
    });

    radiologyOrders.forEach(r => {
      timeline.push({
        id: r._id,
        type: 'RADIOLOGY',
        title: `Radiology Imaging: ${r.modality} (${r.bodyPart})`,
        timestamp: r.createdAt,
        status: r.status,
        details: r.impression || `Indication: ${r.clinicalIndication || 'Diagnostic imaging'}`,
        meta: { modality: r.modality, bodyPart: r.bodyPart, critical: r.criticalFinding }
      });
    });

    admissions.forEach(adm => {
      timeline.push({
        id: adm._id,
        type: 'ADMISSION',
        title: `Inpatient Stay: ${adm.admissionNumber} (${adm.bed?.bedNumber || 'Bed Assigned'})`,
        timestamp: adm.admissionDate,
        status: adm.status,
        details: `Admitted under Dr. ${adm.attendingDoctor?.name || 'Staff'}. Diagnosis: ${adm.diagnosisAtAdmission || 'Inpatient care'}`,
        meta: { bed: adm.bed?.bedNumber, dischargeDate: adm.dischargeDate }
      });
    });

    invoices.forEach(inv => {
      timeline.push({
        id: inv._id,
        type: 'BILLING',
        title: `Invoice Generated (${inv.invoiceNumber}) - ₹${inv.grandTotal}`,
        timestamp: inv.createdAt,
        status: inv.status,
        details: `Paid: ₹${inv.paidAmount}, Due: ₹${inv.balanceDue}. Items: ${inv.items?.length || 0}`,
        meta: { total: inv.grandTotal, paid: inv.paidAmount, balance: inv.balanceDue }
      });
    });

    // Sort all events descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      patient,
      count: timeline.length,
      timeline,
      aggregates: {
        totalEncounters: encounters.length,
        totalPrescriptions: prescriptions.length,
        totalLabOrders: labOrders.length,
        totalInvoices: invoices.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Safely merge duplicate patient record into primary surviving patient
// @route   POST /api/v1/patients/merge
// @access  Private (hospital_admin, org_admin, super_admin)
exports.mergePatients = async (req, res, next) => {
  try {
    const primaryPatientId = req.body.primaryPatientId || req.body.targetPatientId || req.body.targetId;
    const secondaryPatientId = req.body.secondaryPatientId || req.body.sourcePatientId || req.body.sourceId;
    const reason = req.body.reason;

    if (!primaryPatientId || !secondaryPatientId) {
      return res.status(400).json({ success: false, error: 'Both primary/target and secondary/source patient IDs are required for merge' });
    }

    if (primaryPatientId.toString() === secondaryPatientId.toString()) {
      return res.status(400).json({ success: false, error: 'Source and target patient cannot be the exact same record' });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'A mandatory merge reason/rationale is required for clinical audit compliance' });
    }

    const [primaryPatient, secondaryPatient] = await Promise.all([
      Patient.findById(primaryPatientId),
      Patient.findById(secondaryPatientId)
    ]);

    if (!primaryPatient || !secondaryPatient) {
      return res.status(404).json({ success: false, error: 'One or both patient records not found' });
    }

    if (primaryPatient.tenant.toString() !== req.tenantId.toString() || secondaryPatient.tenant.toString() !== req.tenantId.toString()) {
      return res.status(400).json({ success: false, error: 'Both patient records must belong to the same hospital organization' });
    }

    if (secondaryPatient.isMerged) {
      return res.status(400).json({ success: false, error: `Source patient is already merged into another record (UHID: ${secondaryPatient.uhid})` });
    }

    // Safely re-link historical operational and clinical records to primary patient
    const updateQuery = { tenant: req.tenantId };
    const [
      apptsUpdated,
      encsUpdated,
      rxsUpdated,
      labsUpdated,
      radsUpdated,
      admissionsUpdated,
      invoicesUpdated,
      paymentsUpdated,
      vitalsUpdated,
      emergenciesUpdated,
      insurancesUpdated
    ] = await Promise.all([
      Appointment.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      Encounter.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      Prescription.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      LabOrder.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      RadiologyOrder.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      Admission.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      Invoice.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      Payment.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      Vital.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      EmergencyEncounter.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } }),
      InsurancePolicy.updateMany({ patient: secondaryPatient._id, ...updateQuery }, { $set: { patient: primaryPatient._id } })
    ]);

    // Consolidate allergies and chronic conditions without duplicates
    if (secondaryPatient.allergies && secondaryPatient.allergies.length > 0) {
      const existingAllergens = new Set((primaryPatient.allergies || []).map(a => a.allergen?.toLowerCase()));
      secondaryPatient.allergies.forEach(a => {
        if (a.allergen && !existingAllergens.has(a.allergen.toLowerCase())) {
          primaryPatient.allergies.push(a);
        }
      });
    }

    if (secondaryPatient.chronicConditions && secondaryPatient.chronicConditions.length > 0) {
      const existingConditions = new Set((primaryPatient.chronicConditions || []).map(c => c.toLowerCase()));
      secondaryPatient.chronicConditions.forEach(c => {
        if (c && !existingConditions.has(c.toLowerCase())) {
          primaryPatient.chronicConditions.push(c);
        }
      });
    }

    // Append merge tracking to primary patient
    primaryPatient.mergedFrom = primaryPatient.mergedFrom || [];
    primaryPatient.mergedFrom.push({
      patient: secondaryPatient._id,
      uhid: secondaryPatient.uhid,
      mergedAt: new Date(),
      mergedBy: req.user._id,
      reason: reason.trim()
    });
    await primaryPatient.save();

    // Deactivate secondary patient record safely (preserving historical identity without deleting)
    secondaryPatient.isMerged = true;
    secondaryPatient.mergedInto = primaryPatient._id;
    secondaryPatient.mergedAt = new Date();
    secondaryPatient.mergedBy = req.user._id;
    secondaryPatient.mergeReason = reason.trim();
    secondaryPatient.status = 'inactive';
    await secondaryPatient.save();

    const reLinkedCount = (
      apptsUpdated.modifiedCount +
      encsUpdated.modifiedCount +
      rxsUpdated.modifiedCount +
      labsUpdated.modifiedCount +
      radsUpdated.modifiedCount +
      admissionsUpdated.modifiedCount +
      invoicesUpdated.modifiedCount +
      paymentsUpdated.modifiedCount +
      vitalsUpdated.modifiedCount +
      emergenciesUpdated.modifiedCount +
      insurancesUpdated.modifiedCount
    );

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Patient Record Merge',
      module: 'Patients',
      entityId: primaryPatient._id.toString(),
      entityType: 'Patient',
      details: `Merged duplicate patient record ${secondaryPatient.fullName} (${secondaryPatient.uhid}) into surviving record ${primaryPatient.fullName} (${primaryPatient.uhid}). Re-linked ${reLinkedCount} historical records. Reason: ${reason}`
    });

    res.status(200).json({
      success: true,
      message: `Patient ${secondaryPatient.uhid} merged into ${primaryPatient.uhid}. ${reLinkedCount} clinical/billing records consolidated.`,
      primaryPatient,
      reLinkedRecordsCount: reLinkedCount,
      relocationCounts: {
        appointments: apptsUpdated.modifiedCount,
        encounters: encsUpdated.modifiedCount,
        invoices: invoicesUpdated.modifiedCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit patient feedback or support request
// @route   POST /api/v1/patients/feedback
// @access  Private
exports.submitFeedback = async (req, res, next) => {
  try {
    const { category, rating, feedbackText, branch } = req.body;
    let patientId = req.user.patient;
    if (!patientId && req.user.phone) {
      const pat = await Patient.findOne({ tenant: req.tenantId, phone: req.user.phone });
      if (pat) patientId = pat._id;
    }

    if (!patientId) {
      return res.status(403).json({ success: false, error: 'Only registered patients can submit feedback' });
    }

    const patient = await Patient.findOne({ _id: patientId, tenant: req.tenantId });
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient record not found' });
    }

    const feedback = await Feedback.create({
      tenant: req.tenantId,
      branch: branch || patient.primaryBranch || undefined,
      patient: patientId,
      category: category || 'General Feedback',
      rating: Number(rating) || 5,
      feedbackText: feedbackText?.trim(),
      status: 'Submitted',
      submittedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for your feedback!',
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get patient feedback & support requests
// @route   GET /api/v1/patients/feedback
// @access  Private
exports.getPatientFeedback = async (req, res, next) => {
  try {
    const query = { tenant: req.tenantId };

    if (req.user?.role === 'patient') {
      let patientId = req.user.patient;
      if (!patientId && req.user.phone) {
        const pat = await Patient.findOne({ tenant: req.tenantId, phone: req.user.phone });
        if (pat) patientId = pat._id;
      }
      if (!patientId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      query.patient = patientId;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    const feedbacks = await Feedback.find(query)
      .populate('patient', 'uhid fullName phone')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (err) {
    next(err);
  }
};

