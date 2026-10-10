const mongoose = require('mongoose');
const Bed = require('../models/Bed');
const Admission = require('../models/Admission');
const NursingRecord = require('../models/NursingRecord');
const EmergencyEncounter = require('../models/EmergencyEncounter');
const OTRecord = require('../models/OTRecord');
const Patient = require('../models/Patient');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// ==================== BEDS & WARDS ====================

// @desc    Get all beds (Bed Board)
// @route   GET /api/v1/ipd/beds
// @access  Private
exports.getBeds = async (req, res, next) => {
  try {
    const { ward, status, floor, branch } = req.query;
    const query = { tenant: req.tenantId };

    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));
    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    if (ward && ward !== 'all') query.ward = ward;
    if (status && status !== 'all') query.status = status;
    if (floor && floor !== 'all') query.floor = floor;

    const beds = await Bed.find(query)
      .populate('currentPatient', 'uhid fullName age gender phone bloodGroup')
      .populate('currentAdmission')
      .sort({ ward: 1, roomNumber: 1, bedNumber: 1 });

    const total = beds.length;
    const occupied = beds.filter(b => b.status === 'Occupied').length;
    const available = beds.filter(b => b.status === 'Available').length;
    const cleaning = beds.filter(b => b.status === 'Cleaning' || b.status === 'Maintenance').length;

    res.status(200).json({
      success: true,
      count: beds.length,
      occupancyStats: {
        total,
        occupied,
        available,
        cleaning,
        occupancyRatePercent: total > 0 ? Math.round((occupied / total) * 100) : 0
      },
      data: beds
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update bed status manually (Cleaning, Maintenance, Available)
// @route   PUT /api/v1/ipd/beds/:id/status
// @access  Private
exports.updateBedStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const bed = await Bed.findOne({ _id: req.params.id, tenant: req.tenantId });

    if (!bed) {
      return res.status(404).json({ success: false, error: 'Bed not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, bed.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to modify beds from another branch.'
      });
    }

    bed.status = status;
    if (status === 'Available') {
      bed.currentPatient = null;
      bed.currentAdmission = null;
      bed.lastSanitizedAt = new Date();
    }
    await bed.save();

    res.status(200).json({ success: true, data: bed });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new hospital bed
// @route   POST /api/v1/ipd/beds
// @access  Private
exports.createBed = async (req, res, next) => {
  try {
    const {
      bedNumber,
      roomNumber,
      ward,
      wardType,
      floor,
      building,
      ratePerDay,
      status,
      branch
    } = req.body;

    if (!bedNumber || !roomNumber || !ward || !floor) {
      return res.status(400).json({
        success: false,
        error: 'Bed number, room number, ward, and floor are required'
      });
    }

    const tenantId = req.tenantId || req.user?.tenant?._id || req.user?.tenant;
    let targetBranch = (branch && typeof branch === 'object' ? branch._id : branch) || req.branchId || req.user?.branch?._id || req.user?.branch;

    if (!targetBranch) {
      return res.status(400).json({
        success: false,
        error: 'Target branch is required to provision hospital beds'
      });
    }

    const validWardTypes = ['General Male', 'General Female', 'Semi-Private', 'Private Deluxe', 'ICU', 'NICU', 'Emergency', 'Post-Op / Recovery'];
    const normalizedWardType = validWardTypes.includes(wardType) ? wardType : 'General Male';

    let normalizedStatus = status || 'Available';
    if (normalizedStatus.includes('Available')) normalizedStatus = 'Available';
    else if (normalizedStatus.includes('Cleaning')) normalizedStatus = 'Cleaning';
    else if (normalizedStatus.includes('Maintenance')) normalizedStatus = 'Maintenance';
    else if (normalizedStatus.includes('Blocked')) normalizedStatus = 'Blocked';
    else if (normalizedStatus.includes('Reserved')) normalizedStatus = 'Reserved';
    else if (normalizedStatus.includes('Occupied')) normalizedStatus = 'Occupied';

    const existingBed = await Bed.findOne({
      tenant: tenantId,
      branch: targetBranch,
      bedNumber: bedNumber.trim().toUpperCase()
    });

    if (existingBed) {
      return res.status(400).json({
        success: false,
        error: `Bed ${bedNumber.trim().toUpperCase()} already exists in this hospital branch`
      });
    }

    const newBed = await Bed.create({
      tenant: tenantId,
      branch: targetBranch,
      bedNumber: bedNumber.trim().toUpperCase(),
      roomNumber: roomNumber.trim(),
      ward: ward.trim(),
      wardType: normalizedWardType,
      floor: floor.trim(),
      building: building?.trim() || 'Main Tower',
      ratePerDay: Number(ratePerDay) || 1500,
      status: normalizedStatus,
      lastSanitizedAt: normalizedStatus === 'Available' ? new Date() : undefined
    });

    res.status(201).json({ success: true, data: newBed });
  } catch (err) {
    next(err);
  }
};

// ==================== ADMISSIONS ====================

// @desc    Get admitted patients list
// @route   GET /api/v1/ipd/admissions
// @access  Private
exports.getAdmissions = async (req, res, next) => {
  try {
    const { status, branch, patient } = req.query;
    const query = { tenant: req.tenantId };

    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      query.patient = ownPatientId;
      if (status && status !== 'all') {
        query.status = status;
      }
    } else {
      if (patient) {
        query.patient = patient;
      }
      if (status && status !== 'all') {
        query.status = status;
      } else if (!status) {
        query.status = 'Admitted';
      }
    }

    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));
    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    const admissions = await Admission.find(query)
      .populate('patient', 'uhid fullName age gender phone bloodGroup allergies')
      .populate('attendingDoctor', 'name doctorProfile')
      .populate('bed', 'bedNumber ward roomNumber floor ratePerDay')
      .sort({ admissionDate: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      data: admissions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single admission with discharge details
// @route   GET /api/v1/ipd/admissions/:id
// @access  Private
exports.getAdmissionById = async (req, res, next) => {
  try {
    const admission = await Admission.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    })
      .populate('patient', 'uhid fullName age gender phone bloodGroup allergies')
      .populate('attendingDoctor', 'name doctorProfile')
      .populate('bed', 'bedNumber ward roomNumber floor ratePerDay');

    if (!admission) {
      return res.status(404).json({ success: false, error: 'Admission record not found' });
    }

    if (req.user?.role === 'patient') {
      const ownPatientId = req.user.patient ? req.user.patient.toString() : null;
      if (!ownPatientId || admission.patient?._id?.toString() !== ownPatientId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only view your own admission records' });
      }
    } else {
      const { verifyBranchAccess } = require('../middleware/authMiddleware');
      if (!verifyBranchAccess(req, admission.branch)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have authorization to view admission records from another branch.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: admission
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admit patient to IPD bed
// @route   POST /api/v1/ipd/admissions
// @access  Private
exports.admitPatient = async (req, res, next) => {
  try {
    const {
      patient,
      bedId,
      attendingDoctor,
      department,
      admissionType,
      diagnosisAtAdmission,
      admittingRemarks,
      initialDeposit
    } = req.body;

    // Check bed availability
    const bed = await Bed.findOne({ _id: bedId, tenant: req.tenantId });
    if (!bed) {
      return res.status(404).json({ success: false, error: 'Bed not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, bed.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to admit patients in another branch.'
      });
    }

    if (bed.status !== 'Available') {
      return res.status(400).json({
        success: false,
        error: `Bed ${bed.bedNumber} is currently ${bed.status}. Please select an available bed.`
      });
    }

    const count = await Admission.countDocuments({ tenant: req.tenantId });
    const admSeq = String(count + 1).padStart(4, '0');
    const admissionNumber = `ADM-${new Date().getFullYear()}-${admSeq}`;

    const admission = await Admission.create({
      tenant: req.tenantId,
      branch: bed.branch || req.branchId || req.user.branch,
      patient,
      admissionNumber,
      attendingDoctor,
      department,
      bed: bed._id,
      admissionDate: new Date(),
      admissionType: admissionType || 'Elective',
      diagnosisAtAdmission,
      admittingRemarks,
      initialDeposit: Number(initialDeposit) || 0,
      status: 'Admitted'
    });

    // Mark bed as Occupied
    bed.status = 'Occupied';
    bed.currentPatient = patient;
    bed.currentAdmission = admission._id;
    await bed.save();

    const populated = await Admission.findById(admission._id)
      .populate('patient', 'uhid fullName phone age gender')
      .populate('attendingDoctor', 'name')
      .populate('bed', 'bedNumber ward roomNumber');

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Admit Patient',
      module: 'IPD / Wards',
      entityId: admission._id.toString(),
      entityType: 'Admission',
      details: `Admitted ${populated.patient?.fullName} to ${populated.bed?.bedNumber} under Dr. ${populated.attendingDoctor?.name}`
    });

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully to bed',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Transfer bed
// @route   PUT /api/v1/ipd/admissions/:id/transfer-bed
// @access  Private
exports.transferBed = async (req, res, next) => {
  try {
    const { newBedId, reason } = req.body;

    const admission = await Admission.findOne({ _id: req.params.id, tenant: req.tenantId });
    if (!admission) {
      return res.status(404).json({ success: false, error: 'Admission record not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, admission.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to transfer beds for another branch.'
      });
    }

    const targetBed = await Bed.findOne({ _id: newBedId, tenant: req.tenantId });
    if (!targetBed || targetBed.status !== 'Available') {
      return res.status(400).json({ success: false, error: 'Target bed is not available' });
    }

    // Free old bed
    const oldBed = await Bed.findById(admission.bed);
    if (oldBed) {
      oldBed.status = 'Cleaning';
      oldBed.currentPatient = null;
      oldBed.currentAdmission = null;
      await oldBed.save();
    }

    // Allocate new bed
    targetBed.status = 'Occupied';
    targetBed.currentPatient = admission.patient;
    targetBed.currentAdmission = admission._id;
    await targetBed.save();

    admission.bed = targetBed._id;
    await admission.save();

    res.status(200).json({
      success: true,
      message: `Transferred to ${targetBed.bedNumber}. Old bed set to Cleaning.`,
      admission
    });
  } catch (err) {
    next(err);
  }
};

// ==================== NURSING STATION ====================

// @desc    Get nursing records for an admission
// @route   GET /api/v1/ipd/nursing-records/:admissionId
// @access  Private
exports.getNursingRecords = async (req, res, next) => {
  try {
    const admission = await Admission.findOne({
      _id: req.params.admissionId,
      tenant: req.tenantId
    });
    if (!admission) {
      return res.status(404).json({ success: false, error: 'Admission not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, admission.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to access records from another branch.'
      });
    }

    const records = await NursingRecord.find({
      admission: req.params.admissionId,
      tenant: req.tenantId
    })
      .populate('nurse', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record shift nursing tasks, MAR & notes
// @route   POST /api/v1/ipd/nursing-records
// @access  Private
exports.createNursingRecord = async (req, res, next) => {
  try {
    const {
      admission,
      patient,
      shift,
      medicationAdministration,
      intakeOutput,
      nursingNotes,
      carePlanTasks,
      shiftHandoverNotes
    } = req.body;

    const record = await NursingRecord.create({
      tenant: req.tenantId,
      branch: req.user.branch,
      admission,
      patient,
      nurse: req.user._id,
      shift: shift || 'Morning Shift (07:00 - 15:00)',
      medicationAdministration: medicationAdministration || [],
      intakeOutput: intakeOutput || {},
      nursingNotes,
      carePlanTasks: carePlanTasks || [],
      shiftHandoverNotes
    });

    res.status(201).json({
      success: true,
      message: 'Nursing chart & MAR entry saved',
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// ==================== DISCHARGE WORKFLOW ====================

// @desc    Update department clearance for discharge
// @route   PUT /api/v1/ipd/admissions/:id/clearance
// @access  Private
exports.updateClearance = async (req, res, next) => {
  try {
    const { departmentKey, cleared } = req.body; // e.g. 'clinical', 'nursing', 'pharmacy', 'lab', 'billing'

    const admission = await Admission.findOne({ _id: req.params.id, tenant: req.tenantId });
    if (!admission) {
      return res.status(404).json({ success: false, error: 'Admission not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, admission.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to update records for another branch.'
      });
    }

    if (admission.departmentClearances[departmentKey]) {
      admission.departmentClearances[departmentKey].cleared = cleared;
      admission.departmentClearances[departmentKey].clearedBy = req.user._id;
      admission.departmentClearances[departmentKey].clearedAt = new Date();
      await admission.save();
    }

    res.status(200).json({
      success: true,
      data: admission.departmentClearances
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Finalize patient discharge & release bed
// @route   POST /api/v1/ipd/admissions/:id/discharge
// @access  Private
exports.finalizeDischarge = async (req, res, next) => {
  try {
    const { dischargeSummary, conditionAtDischarge } = req.body;

    const admission = await Admission.findOne({ _id: req.params.id, tenant: req.tenantId })
      .populate('patient', 'fullName uhid');

    if (!admission) {
      return res.status(404).json({ success: false, error: 'Admission not found' });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({ success: false, error: 'Patient is already discharged' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, admission.branch)) {
      return res.status(403).json({ success: false, error: 'Unauthorized branch discharge clearance' });
    }

    admission.status = 'Discharged';
    admission.dischargeDate = new Date();
    admission.dischargeSummary = {
      ...dischargeSummary,
      conditionAtDischarge: conditionAtDischarge || 'Stable / Recovered'
    };
    await admission.save();

    // Release bed to Cleaning
    const bed = await Bed.findById(admission.bed);
    if (bed) {
      bed.status = 'Cleaning';
      bed.currentPatient = null;
      bed.currentAdmission = null;
      await bed.save();
    }

    // Audit log
    await AuditLog.create({
      tenant: req.tenantId,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Discharge Patient',
      module: 'IPD / Wards',
      entityId: admission._id.toString(),
      entityType: 'Admission',
      details: `Discharged ${admission.patient?.fullName} (${admission.admissionNumber}). Bed ${bed?.bedNumber} released for sanitization.`
    });

    res.status(200).json({
      success: true,
      message: 'Patient discharged successfully & bed released for cleaning',
      admission
    });
  } catch (err) {
    next(err);
  }
};

// ==================== EMERGENCY ====================

// @desc    Get emergency triage queue
// @route   GET /api/v1/ipd/emergency
// @access  Private
exports.getEmergencyQueue = async (req, res, next) => {
  try {
    const queue = await EmergencyEncounter.find({
      tenant: req.tenantId,
      status: { $in: ['Triage Completed', 'Under Resuscitation', 'Stabilized / Observing'] }
    })
      .populate('patient', 'uhid fullName age gender phone bloodGroup')
      .populate('attendingPhysician', 'name')
      .sort({ triageLevel: 1, arrivalTime: 1 });

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Rapid emergency arrival & triage
// @route   POST /api/v1/ipd/emergency
// @access  Private
exports.createEmergencyEncounter = async (req, res, next) => {
  try {
    const {
      patient,
      triageLevel,
      modeOfArrival,
      chiefComplaint,
      glasgowComaScale,
      attendingPhysician
    } = req.body;

    const count = await EmergencyEncounter.countDocuments({ tenant: req.tenantId });
    const emgSeq = String(count + 1).padStart(4, '0');
    const emergencyNumber = `EMG-${new Date().getFullYear()}-${emgSeq}`;

    const emergency = await EmergencyEncounter.create({
      tenant: req.tenantId,
      branch: req.branchId || req.user.branch,
      patient,
      emergencyNumber,
      triageLevel: triageLevel || 'Level 2: Yellow (Urgent / High Risk)',
      modeOfArrival: modeOfArrival || 'Walk-in',
      chiefComplaint,
      glasgowComaScale: glasgowComaScale || 15,
      attendingPhysician: attendingPhysician || req.user._id,
      assignedNurse: req.user._id,
      status: 'Triage Completed'
    });

    const populated = await EmergencyEncounter.findById(emergency._id)
      .populate('patient', 'uhid fullName age gender phone')
      .populate('attendingPhysician', 'name');

    res.status(201).json({
      success: true,
      message: 'Emergency patient triaged successfully',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// ==================== OPERATION THEATRE ====================

// @desc    Get OT schedule
// @route   GET /api/v1/ipd/ot
// @access  Private
exports.getOTSchedule = async (req, res, next) => {
  try {
    const { status, theatreRoom, branch } = req.query;
    const query = { tenant: req.tenantId };
    if (status && status !== 'all') query.status = status;
    if (theatreRoom && theatreRoom !== 'all') query.theatreRoom = theatreRoom;

    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));
    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    const schedule = await OTRecord.find(query)
      .populate('patient', 'uhid fullName age gender')
      .populate('leadSurgeon', 'name doctorProfile')
      .populate('anaesthetist', 'name')
      .sort({ scheduledStartTime: 1 });

    res.status(200).json({
      success: true,
      count: schedule.length,
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Book / Record surgical OT procedure
// @route   POST /api/v1/ipd/ot
// @access  Private
exports.createOTRecord = async (req, res, next) => {
  try {
    const {
      patient,
      patientUhid,
      theatreRoom,
      procedureName,
      leadSurgeon,
      anaesthetist,
      scheduledStartTime,
      durationMinutes,
      anaesthesiaType,
      preOpChecklist
    } = req.body;

    let targetPatientId = patient;
    if (!targetPatientId && patientUhid) {
      const p = await Patient.findOne({ tenant: req.tenantId, uhid: patientUhid.trim() });
      if (p) targetPatientId = p._id;
    } else if (typeof targetPatientId === 'string' && !mongoose.Types.ObjectId.isValid(targetPatientId)) {
      const p = await Patient.findOne({ tenant: req.tenantId, uhid: targetPatientId.trim() });
      if (p) targetPatientId = p._id;
    }

    if (!targetPatientId) {
      return res.status(400).json({ success: false, error: 'Valid patient record or UHID required' });
    }

    // Resolve surgeon and anaesthetist
    let surgeonId = leadSurgeon;
    let anaesthetistId = anaesthetist;
    if (!surgeonId || !mongoose.Types.ObjectId.isValid(surgeonId)) {
      const doc = await User.findOne({ tenant: req.tenantId, role: { $in: ['doctor', 'hospital_admin'] } });
      surgeonId = doc ? doc._id : req.user._id;
    }
    if (!anaesthetistId || !mongoose.Types.ObjectId.isValid(anaesthetistId)) {
      const staff = await User.findOne({ tenant: req.tenantId, _id: { $ne: surgeonId } });
      anaesthetistId = staff ? staff._id : req.user._id;
    }

    // Map theatre room
    const theatreMap = {
      'OT-1': 'OT-1 (Major Cardiac / Neuro)',
      'OT-2': 'OT-2 (Orthopedic / Joint Replacement)',
      'OT-3': 'OT-3 (General & Laparoscopy)',
      'OT-4': 'OT-4 (Obstetrics & Gynecology)',
      'OT-5': 'OT-5 (Ophthalmology & Minor)'
    };
    const resolvedTheatre = theatreMap[theatreRoom] || theatreRoom || 'OT-3 (General & Laparoscopy)';

    const count = await OTRecord.countDocuments({ tenant: req.tenantId });
    const otSeq = String(count + 1).padStart(4, '0');
    const otBookingNumber = `OT-${new Date().getFullYear()}-${otSeq}`;

    const startTime = scheduledStartTime ? new Date(scheduledStartTime) : new Date();
    const duration = Number(durationMinutes) || 120;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const ot = await OTRecord.create({
      tenant: req.tenantId,
      branch: req.branchId || req.user.branch,
      patient: targetPatientId,
      otBookingNumber,
      theatreRoom: resolvedTheatre,
      procedureName: procedureName || 'Elective Procedure',
      leadSurgeon: surgeonId,
      anaesthetist: anaesthetistId,
      scrubNurse: req.user._id,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      anaesthesiaType: anaesthesiaType || 'General Anaesthesia (GA)',
      preOpChecklist: preOpChecklist || {},
      status: 'Scheduled'
    });

    const populated = await OTRecord.findById(ot._id)
      .populate('patient', 'uhid fullName age gender')
      .populate('leadSurgeon', 'name doctorProfile')
      .populate('anaesthetist', 'name');

    res.status(201).json({
      success: true,
      message: 'Surgical case scheduled on OT board',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};
