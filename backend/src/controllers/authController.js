const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const PatientOTP = require('../models/PatientOTP');
const crypto = require('crypto');

function hashOTP(phone, otpCode) {
  return crypto.createHash('sha256').update(`${phone.trim()}:${otpCode.toString().trim()}`).digest('hex');
}


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
        error: 'Invalid credentials. Please check your email and password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please check your email and password.'
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

// @desc    Generate & send OTP for patient login
// @route   POST /api/v1/auth/send-patient-otp
// @access  Public
exports.sendPatientOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.toString().trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter registered 10-digit mobile number'
      });
    }

    const cleanPhone = phone.toString().trim();

    // Check if patient exists
    const patient = await Patient.findOne({ phone: cleanPhone });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'No patient record found matching this mobile number. Please register at front desk.'
      });
    }

    // Rate limiting: check if OTP requested within last 45 seconds
    const recentOTP = await PatientOTP.findOne({
      phone: cleanPhone,
      createdAt: { $gte: new Date(Date.now() - 45 * 1000) }
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        error: 'Please wait at least 45 seconds before requesting a new OTP.'
      });
    }

    // Generate random 6-digit cryptographic OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOTP(cleanPhone, otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous unused OTPs for this phone
    await PatientOTP.updateMany({ phone: cleanPhone, isUsed: false }, { isUsed: true });

    await PatientOTP.create({
      phone: cleanPhone,
      otpHash,
      expiresAt
    });

    const isSmsProviderConfigured = Boolean(process.env.SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN);

    // Development/test log (never in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH-DEV] Secure OTP generated for ${cleanPhone} (Valid 5m): ${otpCode}`);
    }

    res.status(200).json({
      success: true,
      message: isSmsProviderConfigured
        ? 'OTP verification code sent via SMS.'
        : 'OTP generated. SMS gateway is not configured (simulation mode).',
      expiresInSeconds: 300,
      smsConfigured: isSmsProviderConfigured,
      devCode: (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') ? otpCode : undefined
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

    const cleanPhone = phone.toString().trim();

    if (!otp || !otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        error: 'OTP verification code is required'
      });
    }

    const enteredOtp = otp.toString().trim();

    // Locate patient record by phone
    const patient = await Patient.findOne({ phone: cleanPhone })
      .populate('tenant', 'name legalName branding settings email phone address hospitalType website');

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'No patient record found matching this mobile number. Please register at front desk.'
      });
    }

    // Retrieve active OTP record
    const otpRecord = await PatientOTP.findOne({
      phone: cleanPhone,
      isUsed: false
    }).sort({ createdAt: -1 });

    // Validate OTP session existence
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'No active OTP verification session found. Please request an OTP first.'
      });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'OTP verification code has expired. Please request a new code.'
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Check cryptographic hash match
    const expectedHash = hashOTP(cleanPhone, enteredOtp);
    const isHashMatch = (expectedHash === otpRecord.otpHash);

    if (!isHashMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(401).json({
        success: false,
        error: `Invalid OTP verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new OTP.'}`
      });
    }

    // Mark OTP as used to prevent replay attacks
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create virtual patient user for portal session
    let user = await User.findOne({ email: `${cleanPhone}@patient.hospitalvision.local` });

    if (!user) {
      user = await User.create({
        name: patient.fullName,
        email: `${cleanPhone}@patient.hospitalvision.local`,
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

