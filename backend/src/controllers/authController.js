const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');

// @desc    Login user & get JWT token
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('tenant', 'name legalName slug subscription status branding settings email phone address hospitalType website')
      .populate('branch', 'name code bedCapacity address phone email branchType isMain')
      .populate('department', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password incorrect.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated or suspended. Please contact administrator.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    // Log login audit
    await AuditLog.create({
      tenant: user.tenant?._id,
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'User Sign In',
      module: 'Auth / Security',
      details: `Successful sign-in from ${user.email} (${user.role})`
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenant: user.tenant,
        branch: user.branch,
        department: user.department,
        doctorProfile: user.doctorProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Patient Portal OTP / Phone Login
// @route   POST /api/v1/auth/patient-login
// @access  Public
exports.patientLogin = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide phone number registered with the hospital'
      });
    }

    // In production, OTP is strictly required
    if (process.env.NODE_ENV === 'production' && (!otp || !otp.toString().trim())) {
      return res.status(400).json({
        success: false,
        error: 'OTP verification code is required'
      });
    }

    // Locate patient record by phone
    const patient = await Patient.findOne({ phone: phone.trim() })
      .populate('tenant', 'name legalName branding settings email phone address hospitalType website');

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'No patient record found matching this mobile number. Please register at front desk.'
      });
    }

    // Find or create virtual patient user for portal session
    let user = await User.findOne({ email: `${phone.trim()}@patient.hospitalvision.local` });

    if (!user) {
      user = await User.create({
        name: patient.fullName,
        email: `${phone.trim()}@patient.hospitalvision.local`,
        phone: patient.phone,
        password: 'PatientPortal2026!',
        role: 'patient',
        patient: patient._id,
        tenant: patient.tenant?._id || patient.tenant,
        status: 'active'
      });
    } else if (!user.patient || user.patient.toString() !== patient._id.toString()) {
      user.patient = patient._id;
      await user.save();
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      patient: {
        id: patient._id,
        _id: patient._id,
        uhid: patient.uhid,
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        tenant: patient.tenant
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('tenant')
      .populate('branch')
      .populate('department')
      .populate('patient');

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile (Name, email, phone, avatar)
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, error: 'Email is already in use by another user' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    await AuditLog.create({
      tenant: user.tenant?._id,
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'Profile Details Updated',
      module: 'Auth / Security',
      details: `Administrator ${user.name} (${user.email}) updated profile information`
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        tenant: user.tenant,
        branch: user.branch
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user password
// @route   PUT /api/v1/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      tenant: user.tenant?._id,
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'Password Changed',
      module: 'Auth / Security',
      details: `Administrator ${user.name} (${user.email}) updated their account password`
    });

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token
    });
  } catch (err) {
    next(err);
  }
};

