const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Encounter = require('../models/Encounter');
const Patient = require('../models/Patient');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get appointments with filters
// @route   GET /api/v1/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    const { doctor, date, status, branch } = req.query;
    const query = { tenant: req.tenantId };

    if (doctor && doctor !== 'all') {
      query.doctor = doctor;
    }

    // Branch Isolation: Sub-branch can ONLY see its own branch data!
    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));

    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    if (req.user?.role === 'patient') {
      query.patient = req.user.patient;
    } else if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'uhid fullName phone age gender bloodGroup')
      .populate('doctor', 'name doctorProfile')
      .populate('department', 'name code')
      .populate('branch', 'name code')
      .sort({ appointmentDate: 1, tokenNumber: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Book a new appointment
// @route   POST /api/v1/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const {
      patient,
      doctor,
      department,
      branch,
      appointmentDate,
      slotTime,
      type,
      priority,
      reasonForVisit,
      consultationFee
    } = req.body;

    const apptDate = new Date(appointmentDate || Date.now());
    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Resolve doctor User document
    let doctorId = doctor;
    let doctorUser = null;
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      doctorUser = await User.findById(doctorId);
    }
    if (!doctorUser) {
      // Fallback to active doctor in branch or tenant
      const doctorQuery = { tenant: req.tenantId, role: 'doctor', status: 'active' };
      if (req.branchId) doctorQuery.branch = req.branchId;
      doctorUser = await User.findOne(doctorQuery);
      if (!doctorUser) {
        doctorUser = await User.findOne({ tenant: req.tenantId, role: 'doctor', status: 'active' });
      }
      if (doctorUser) {
        doctorId = doctorUser._id;
      }
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        error: 'No active clinician found for appointment scheduling. Please assign a doctor.'
      });
    }

    // Calculate sequential token number for this doctor on this day
    const existingCount = await Appointment.countDocuments({
      tenant: req.tenantId,
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    });
    const tokenNumber = existingCount + 1;

    let effectivePatient = patient;
    if (req.user?.role === 'patient') {
      if (!req.user.patient) {
        return res.status(403).json({ success: false, error: 'Patient profile not linked to user account' });
      }
      effectivePatient = req.user.patient;
    }

    const appointment = await Appointment.create({
      tenant: req.tenantId,
      branch: req.branchId || branch || doctorUser?.branch || req.user.branch,
      patient: effectivePatient,
      doctor: doctorId,
      department: department || doctorUser?.department,
      appointmentDate: apptDate,
      slotTime: slotTime || '10:00 AM',
      tokenNumber,
      type: type || 'New Consultation',
      priority: priority || 'Normal',
      reasonForVisit,
      consultationFee: consultationFee || doctorUser?.doctorProfile?.consultationFee || 500,
      status: 'Scheduled',
      bookedBy: req.user._id
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'uhid fullName phone age gender')
      .populate('doctor', 'name doctorProfile')
      .populate('department', 'name');

    // Audit
    await AuditLog.create({
      tenant: req.tenantId,
      branch: appointment.branch,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Book Appointment',
      module: 'Appointments',
      entityId: appointment._id.toString(),
      entityType: 'Appointment',
      details: `Appointment booked for ${populated.patient?.fullName} with Dr. ${populated.doctor?.name} (Token #${tokenNumber})`
    });

    // Asynchronously dispatch appointment confirmation notification
    const notificationService = require('../services/notification/NotificationService');
    const patientPhone = populated.patient?.phone;
    if (patientPhone) {
      notificationService.sendNotification({
        tenantId: req.tenantId,
        eventName: 'Appointment Confirmation',
        channel: 'SMS',
        recipient: patientPhone,
        data: {
          patientName: populated.patient.fullName,
          doctorName: populated.doctor?.name,
          appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString(),
          appointmentTime: appointment.slotTime,
          tokenNumber: appointment.tokenNumber,
          hospitalName: req.user?.tenant?.name || 'Hospital Vision'
        }
      }).catch(notifErr => console.warn('[Appointment Notification Error]:', notifErr.message));
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update appointment status (Check-in, In-Consultation, Completed, etc.)
// @route   PUT /api/v1/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      tenant: req.tenantId
    });

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const { verifyBranchAccess } = require('../middleware/authMiddleware');
    if (!verifyBranchAccess(req, appointment.branch)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have authorization to access or modify records from another branch.'
      });
    }

    appointment.status = status;

    if (status === 'Checked-In') {
      appointment.checkInTime = new Date();

      // Ensure corresponding Encounter exists for clinical consultation
      let encounter = await Encounter.findOne({
        appointment: appointment._id,
        tenant: req.tenantId
      });

      if (!encounter) {
        const count = await Encounter.countDocuments({ tenant: req.tenantId });
        const encSeq = String(count + 1).padStart(4, '0');
        const encounterNumber = `ENC-${new Date().getFullYear()}-${encSeq}`;

        encounter = await Encounter.create({
          tenant: req.tenantId,
          branch: appointment.branch,
          patient: appointment.patient,
          appointment: appointment._id,
          doctor: appointment.doctor,
          department: appointment.department,
          encounterNumber,
          encounterType: 'OPD',
          chiefComplaint: appointment.reasonForVisit,
          status: 'In-Progress'
        });
      }
    }

    if (status === 'In-Consultation') {
      appointment.consultationStartTime = new Date();
    }

    if (status === 'Completed') {
      appointment.consultationEndTime = new Date();
    }

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'uhid fullName phone age gender')
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

// @desc    Get live OPD waiting queue & token board
// @route   GET /api/v1/appointments/queue
// @access  Private
exports.getLiveQueue = async (req, res, next) => {
  try {
    const { doctor, branch } = req.query;
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      tenant: req.tenantId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['Scheduled', 'Checked-In', 'In-Consultation', 'Completed'] }
    };

    if (doctor && doctor !== 'all') {
      query.doctor = doctor;
    }

    const effectiveBranch = req.isSubBranch
      ? req.branchId
      : (req.branchId || (branch && branch !== 'all' ? branch : null));
    if (effectiveBranch) {
      query.branch = effectiveBranch;
    }

    const queue = await Appointment.find(query)
      .populate('patient', 'uhid fullName phone age gender')
      .populate('doctor', 'name doctorProfile')
      .populate('department', 'name')
      .sort({ priority: -1, tokenNumber: 1 });

    const waiting = queue.filter(q => q.status === 'Checked-In' || q.status === 'Scheduled');
    const inConsultation = queue.filter(q => q.status === 'In-Consultation');
    const completed = queue.filter(q => q.status === 'Completed');

    res.status(200).json({
      success: true,
      totalToday: queue.length,
      waitingCount: waiting.length,
      inConsultationCount: inConsultation.length,
      completedCount: completed.length,
      data: {
        waiting,
        inConsultation,
        completed
      }
    });
  } catch (err) {
    next(err);
  }
};
