const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Branch = require('../models/Branch');
const Department = require('../models/Department');
const User = require('../models/User');
const Patient = require('../models/Patient');
const FeatureFlag = require('../models/FeatureFlag');
const AuditLog = require('../models/AuditLog');
const bulkImportService = require('../services/import/BulkImportService');
const tenantLifecycleService = require('../services/privacy/TenantLifecycleService');
const fhirConverterService = require('../services/interop/FHIRConverterService');
const hrmsService = require('../services/hrms/HRMSService');
const aiService = require('../services/ai/AIService');
const { normalizePlan, getPlanConfig, getPlanDefaultBeds } = require('../constants/subscriptionPlans');


// @desc    Get all hospital tenants (SaaS Admin)
// @route   GET /api/v1/tenants
// @access  Private (super_admin, saas_admin)
exports.getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    
    // Enrich with branches and user counts
    const enrichedTenants = await Promise.all(
      tenants.map(async (t) => {
        const branchCount = await Branch.countDocuments({ tenant: t._id });
        const userCount = await User.countDocuments({ tenant: t._id });
        return {
          ...t.toObject(),
          branchCount,
          userCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedTenants.length,
      data: enrichedTenants
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Onboard a new hospital tenant
// @route   POST /api/v1/tenants
// @access  Private (super_admin, saas_admin)
exports.createTenant = async (req, res, next) => {
  let createdTenant = null;
  try {
    const rawName = req.body.name;
    const resolvedName = typeof rawName === 'string' ? rawName.trim() : '';

    // Prefer frontend-provided slug when valid, otherwise generate safely from hospital name
    const rawSlug = req.body.slug || resolvedName;
    const slug = typeof rawSlug === 'string'
      ? rawSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : '';

    const legalName = (req.body.legalName || resolvedName || '').trim();
    const hospitalType = req.body.hospitalType || 'Multi-Specialty';
    const email = req.body.email || req.body.adminEmail || req.body.adminUser?.email;
    const phone = req.body.phone || req.body.adminPhone || req.body.adminUser?.phone;
    const address = req.body.address || {};

    const rawSubscriptionPlan = req.body.subscriptionPlan || req.body.subscription?.plan || 'Professional (Up to 100 Beds)';
    const subscriptionPlan = normalizePlan(rawSubscriptionPlan);
    const planConfig = getPlanConfig(subscriptionPlan);

    // 1. Tenant Licensed Max Beds (comes from subscription/license configuration)
    const reqSubscriptionMaxBeds = req.body.subscription?.maxBeds !== undefined
      ? Number(req.body.subscription.maxBeds)
      : undefined;
    const licensedMaxBeds = (reqSubscriptionMaxBeds !== undefined && !isNaN(reqSubscriptionMaxBeds) && reqSubscriptionMaxBeds > 0)
      ? reqSubscriptionMaxBeds
      : (planConfig?.defaultBeds || 100);

    // 2. Initial Branch Bed Capacity (physical capacity of that specific branch)
    const rawBranchCapacity = req.body.initialBranch?.bedCapacity !== undefined
      ? req.body.initialBranch.bedCapacity
      : req.body.initialBedCapacity;
    const parsedBranchCapacity = rawBranchCapacity !== undefined ? Number(rawBranchCapacity) : NaN;
    const branchBedCapacity = (!isNaN(parsedBranchCapacity) && parsedBranchCapacity > 0)
      ? parsedBranchCapacity
      : (licensedMaxBeds >= 100 ? 80 : licensedMaxBeds);

    // Validate: Initial branch capacity cannot exceed tenant licensed capacity
    if (branchBedCapacity > licensedMaxBeds) {
      return res.status(400).json({
        success: false,
        error: `Initial branch bed capacity (${branchBedCapacity}) cannot exceed tenant licensed bed capacity (${licensedMaxBeds}).`
      });
    }

    const rawBranchName = req.body.mainBranchName || req.body.initialBranch?.name;
    const mainBranchName = typeof rawBranchName === 'string' && rawBranchName.trim()
      ? rawBranchName.trim()
      : (resolvedName ? `${resolvedName} Main Campus` : 'Main Campus');

    const rawBranchCode = req.body.mainBranchCode || req.body.initialBranch?.code;
    const mainBranchCode = typeof rawBranchCode === 'string' && rawBranchCode.trim()
      ? rawBranchCode.trim().toUpperCase()
      : 'MAIN';

    const hasEmergency = req.body.initialBranch?.hasEmergency !== undefined ? Boolean(req.body.initialBranch.hasEmergency) : true;
    const hasICU = req.body.initialBranch?.hasICU !== undefined ? Boolean(req.body.initialBranch.hasICU) : true;
    const hasOT = req.body.initialBranch?.hasOT !== undefined ? Boolean(req.body.initialBranch.hasOT) : true;

    const rawAdminName = req.body.adminName || req.body.adminUser?.name;
    const adminName = typeof rawAdminName === 'string' && rawAdminName.trim()
      ? rawAdminName.trim()
      : (resolvedName ? `${resolvedName} Hospital Administrator` : 'Hospital Administrator');

    const adminEmailRaw = req.body.adminEmail || req.body.adminUser?.email;
    const adminPassword = req.body.adminPassword || req.body.adminUser?.password;

    // Validate required fields BEFORE creating Tenant document
    if (!resolvedName) {
      return res.status(400).json({ success: false, error: 'Hospital organization name is required' });
    }
    if (!slug) {
      return res.status(400).json({ success: false, error: 'Hospital URL slug is required' });
    }
    if (!adminEmailRaw || typeof adminEmailRaw !== 'string' || !adminEmailRaw.trim()) {
      return res.status(400).json({ success: false, error: 'Admin login email is required' });
    }
    if (!adminPassword || typeof adminPassword !== 'string' || !adminPassword.trim()) {
      return res.status(400).json({ success: false, error: 'Admin temporary password is required' });
    }
    if (adminPassword.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Admin password must be at least 6 characters' });
    }
    if (!mainBranchName) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    if (!mainBranchCode) {
      return res.status(400).json({ success: false, error: 'Branch code is required' });
    }

    const adminEmail = adminEmailRaw.trim().toLowerCase();

    // Pre-check for duplicate slug to give immediate, clean error before creating anything
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Hospital with this URL slug already exists.'
      });
    }

    // Pre-check for duplicate admin email
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `A user with email '${adminEmail}' already exists.`
      });
    }

    // Step 1: Create Tenant
    createdTenant = await Tenant.create({
      name: resolvedName,
      slug,
      legalName: legalName || resolvedName,
      hospitalType,
      email: email ? String(email).trim() : adminEmail,
      phone: phone ? String(phone).trim() : undefined,
      address,
      subscription: {
        plan: subscriptionPlan,
        maxBeds: licensedMaxBeds,
        maxBranches: req.body.subscription?.maxBranches || planConfig?.defaultBranches || 3,
        maxUsers: req.body.subscription?.maxUsers || planConfig?.defaultUsers || 50,
        billingCycle: req.body.subscription?.billingCycle || 'annual',
        status: req.body.subscription?.status || 'active'
      },
      status: 'active'
    });

    // Step 2: Create Main Branch
    const branch = await Branch.create({
      tenant: createdTenant._id,
      name: mainBranchName,
      code: mainBranchCode,
      branchType: 'Main Hospital',
      isMain: true,
      bedCapacity: branchBedCapacity,
      hasEmergency,
      hasICU,
      hasOT
    });

    // Step 3: Create Default Departments
    const depts = [
      { name: 'General Medicine & OPD', code: 'OPD-GEN', departmentType: 'Clinical' },
      { name: 'Cardiology', code: 'CARD', departmentType: 'Clinical' },
      { name: 'Emergency & Trauma Care', code: 'EMG', departmentType: 'Clinical' },
      { name: 'In-Patient Department (IPD)', code: 'IPD', departmentType: 'Clinical' },
      { name: 'Laboratory Diagnostics', code: 'LAB', departmentType: 'Diagnostic' },
      { name: 'Radiology & Imaging', code: 'RAD', departmentType: 'Diagnostic' },
      { name: 'Hospital Pharmacy', code: 'PHARM', departmentType: 'Support' },
      { name: 'Billing & Cashier', code: 'BILL', departmentType: 'Administrative' }
    ];

    for (const d of depts) {
      await Department.create({
        tenant: createdTenant._id,
        branch: branch._id,
        name: d.name,
        code: d.code,
        departmentType: d.departmentType
      });
    }

    // Step 4: Create Hospital Admin User
    const adminUser = await User.create({
      tenant: createdTenant._id,
      branch: branch._id,
      name: adminName,
      email: adminEmail,
      phone: phone ? String(phone).trim() : undefined,
      password: adminPassword,
      role: 'hospital_admin',
      status: 'active'
    });

    // Step 5: Initialize Default Feature Flags
    const defaultFlags = [
      'module_laboratory',
      'module_radiology',
      'module_pharmacy',
      'module_ipd_wards',
      'module_emergency',
      'module_ot',
      'module_insurance_tpa',
      'module_patient_portal',
      'module_ai_assistant',
      'module_crm_corporate'
    ];

    for (const flagKey of defaultFlags) {
      await FeatureFlag.create({
        tenant: createdTenant._id,
        moduleKey: flagKey,
        isEnabled: true
      });
    }

    // Step 6: Audit log
    await AuditLog.create({
      tenant: createdTenant._id,
      user: req.user?._id,
      userName: req.user?.name || 'SaaS Super Admin',
      userRole: req.user?.role || 'super_admin',
      action: 'Tenant Onboarding',
      module: 'SaaS Platform',
      details: `New hospital tenant '${resolvedName}' onboarded successfully with Main branch.`
    });

    res.status(201).json({
      success: true,
      message: 'Hospital Tenant onboarded successfully',
      data: {
        tenant: createdTenant,
        branch,
        adminUser: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role }
      }
    });
  } catch (err) {
    // Compensating Rollback: Clean up any partial documents created during this attempt
    if (createdTenant?._id) {
      try {
        await Promise.allSettled([
          Tenant.findByIdAndDelete(createdTenant._id),
          Branch.deleteMany({ tenant: createdTenant._id }),
          Department.deleteMany({ tenant: createdTenant._id }),
          User.deleteMany({ tenant: createdTenant._id }),
          FeatureFlag.deleteMany({ tenant: createdTenant._id }),
          AuditLog.deleteMany({ tenant: createdTenant._id, action: 'Tenant Onboarding' })
        ]);
      } catch (cleanupErr) {
        console.error('[TenantOnboarding Rollback Error]:', cleanupErr);
      }
    }

    // Handle Mongo duplicate key errors cleanly
    if (err.code === 11000) {
      const isSlug = err.keyPattern?.slug || (err.keyValue && 'slug' in err.keyValue) || (err.message && err.message.includes('slug'));
      const isEmail = err.keyPattern?.email || (err.keyValue && 'email' in err.keyValue) || (err.message && err.message.includes('email'));
      if (isSlug) {
        return res.status(400).json({
          success: false,
          error: 'Hospital with this URL slug already exists.'
        });
      }
      if (isEmail) {
        return res.status(400).json({
          success: false,
          error: 'A user with this email address already exists.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'A hospital with duplicate unique fields already exists.'
      });
    }

    next(err);
  }
};

// @desc    Delete tenant and cascade cleanup (SaaS Super Admin only)
// @route   DELETE /api/v1/tenants/:id
// @access  Private (super_admin, saas_admin)
exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    // Protect active seeded/production tenants unless force is explicitly set
    const userCount = await User.countDocuments({ tenant: tenant._id });
    if (userCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        error: `Cannot delete tenant '${tenant.name}' because it contains ${userCount} active user(s).`
      });
    }

    // Execute strictly tenant-scoped cascade cleanup
    const tenantScopedModels = [
      'Branch', 'Department', 'User', 'FeatureFlag', 'AuditLog',
      'Bed', 'Patient', 'Appointment', 'Encounter', 'Admission',
      'Invoice', 'Payment', 'Prescription', 'LabOrder', 'RadiologyOrder',
      'Medicine', 'OTRecord', 'EmergencyEncounter', 'NursingRecord', 'Vital',
      'InsurancePolicy', 'CRMLead', 'CorporateAccount', 'DocumentTemplate',
      'DocumentRegistry', 'NotificationTemplate', 'ApprovalRequest', 'Feedback',
      'BarcodeReference'
    ];

    const deletePromises = tenantScopedModels.map(async (modelName) => {
      try {
        const Model = mongoose.models[modelName] || require(`../models/${modelName}`);
        if (Model && typeof Model.deleteMany === 'function') {
          return Model.deleteMany({ tenant: tenant._id });
        }
      } catch (_) {
        // Silently skip if model is not registered or cannot be loaded
      }
    });

    await Promise.allSettled([
      Tenant.findByIdAndDelete(tenant._id),
      ...deletePromises
    ]);

    res.status(200).json({
      success: true,
      message: `Tenant '${tenant.name}' and all associated records deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single tenant details
// @route   GET /api/v1/tenants/:id
// @access  Private
exports.getTenantById = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    const branches = await Branch.find({ tenant: tenant._id });
    const departments = await Department.find({ tenant: tenant._id });
    const users = await User.find({ tenant: tenant._id }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        tenant,
        branches,
        departments,
        users
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update tenant details/branding/subscription
// @route   PUT /api/v1/tenants/:id
// @access  Private (hospital_admin, super_admin)
exports.updateTenant = async (req, res, next) => {
  try {
    if (req.body.subscription && req.body.subscription.plan) {
      req.body.subscription.plan = normalizePlan(req.body.subscription.plan);
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Manage branches for a tenant
// @route   GET /api/v1/tenants/:id/branches
// @access  Private
exports.getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({ tenant: req.params.id });

    // Isolation: Sub-branch staff cannot see the main branch or other branches.
    // They are restricted to their assigned branch.
    // Main branch users and organization/platform admins see all branches!
    if (!req.isUserFromMainBranch && req.user?.branch) {
      const userBranchId = (req.user.branch._id || req.user.branch).toString();
      const filtered = branches.filter(b => b._id.toString() === userBranchId);
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    res.status(200).json({ success: true, count: branches.length, data: branches });
  } catch (err) {
    next(err);
  }
};

// @desc    Add branch to tenant
// @route   POST /api/v1/tenants/:id/branches
// @access  Private
exports.createBranch = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    // Role check: Main branch users (Org Admins, Main Branch Admins, Main Branch management) can create branches.
    // Sub-branch users are explicitly forbidden!
    const isPlatformAdmin = ['super_admin', 'saas_admin'].includes(req.user?.role);
    const isOrgAdminUser = ['hospital_admin', 'org_admin'].includes(req.user?.role) || isPlatformAdmin;
    const canCreate = isOrgAdminUser || req.isUserFromMainBranch;

    if (!canCreate) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only the Main Branch administration can create or configure sub-branches.'
      });
    }

    // Tenant isolation: Hospital Admins can only create branches for their own tenant
    const userTenantId = req.user?.tenant?._id ? req.user.tenant._id.toString() : (req.user?.tenant ? req.user.tenant.toString() : (req.tenantId ? req.tenantId.toString() : null));
    if (!isPlatformAdmin && userTenantId !== tenantId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You cannot create branches for another hospital organization.'
      });
    }

    // Enforce Tenant subscription maxBranches limit
    const maxBranches = tenant.subscription?.maxBranches;
    if (typeof maxBranches === 'number' && maxBranches > 0) {
      const currentBranchCount = await Branch.countDocuments({ tenant: tenantId, status: { $ne: 'deleted' } });
      if (currentBranchCount >= maxBranches) {
        return res.status(400).json({
          success: false,
          error: `Cannot create branch. Hospital subscription limit of ${maxBranches} branch(es) reached.`
        });
      }
    }

    const {
      name,
      code,
      branchType,
      phone,
      email,
      address,
      bedCapacity,
      hasEmergency,
      hasICU,
      hasOT
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Branch code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check duplicate branch code within this tenant
    const existingBranch = await Branch.findOne({ tenant: tenantId, code: normalizedCode });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        error: `Branch with code '${normalizedCode}' already exists for this hospital.`
      });
    }

    // Canonical allowed enum values from Branch model
    const ALLOWED_BRANCH_TYPES = ['Main Hospital', 'Satellite Clinic', 'Diagnostic Center', 'Day Care Center'];

    let resolvedBranchType = branchType;

    // Normalize legacy/errant 'Tertiary Care Center' value to canonical 'Satellite Clinic'
    if (resolvedBranchType === 'Tertiary Care Center') {
      resolvedBranchType = 'Satellite Clinic';
    }

    // If branchType is not provided or empty, safely derive it
    if (!resolvedBranchType || typeof resolvedBranchType !== 'string' || !resolvedBranchType.trim()) {
      const hasMainHospital = await Branch.exists({ tenant: tenantId, branchType: 'Main Hospital' });
      resolvedBranchType = hasMainHospital ? 'Satellite Clinic' : 'Main Hospital';
    } else {
      resolvedBranchType = resolvedBranchType.trim();
      if (!ALLOWED_BRANCH_TYPES.includes(resolvedBranchType)) {
        return res.status(400).json({
          success: false,
          error: `'${resolvedBranchType}' is not a valid branch type. Allowed types: ${ALLOWED_BRANCH_TYPES.join(', ')}`
        });
      }
    }

    let parentBranchId = null;
    if (resolvedBranchType !== 'Main Hospital') {
      const mainBranch = await Branch.findOne({
        tenant: tenantId,
        $or: [{ isMain: true }, { branchType: 'Main Hospital' }, { code: 'MAIN' }]
      });
      if (mainBranch) {
        parentBranchId = mainBranch._id;
      }
    }

    // Enforce Tenant subscription bedCapacity limits
    const tenantLicensedMaxBeds = Number(tenant.subscription?.maxBeds) || 100;
    const isBedCapacityExplicit = bedCapacity !== undefined && bedCapacity !== null && bedCapacity !== '';
    const requestedBedCapacity = isBedCapacityExplicit && !isNaN(Number(bedCapacity))
      ? Number(bedCapacity)
      : (resolvedBranchType === 'Diagnostic Center' ? 0 : 50);

    if (requestedBedCapacity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Branch bed capacity cannot be negative.'
      });
    }

    if (requestedBedCapacity > tenantLicensedMaxBeds) {
      return res.status(400).json({
        success: false,
        error: `Branch bed capacity (${requestedBedCapacity}) cannot exceed tenant licensed capacity (${tenantLicensedMaxBeds}).`
      });
    }

    // Check SUM of all existing active branches
    const existingBranches = await Branch.find({ tenant: tenantId, status: { $ne: 'deleted' } });
    const currentAllocatedBeds = existingBranches.reduce((sum, b) => sum + (Number(b.bedCapacity) || 0), 0);

    if (requestedBedCapacity > 0 && (currentAllocatedBeds + requestedBedCapacity > tenantLicensedMaxBeds)) {
      return res.status(400).json({
        success: false,
        error: `Total branch bed capacity (${currentAllocatedBeds + requestedBedCapacity}) exceeds tenant licensed capacity (${tenantLicensedMaxBeds}). Current allocated: ${currentAllocatedBeds}, requested: ${requestedBedCapacity}, remaining: ${Math.max(0, tenantLicensedMaxBeds - currentAllocatedBeds)}.`
      });
    }

    const branch = await Branch.create({
      tenant: tenantId,
      name: name.trim(),
      code: normalizedCode,
      branchType: resolvedBranchType,
      isMain: (resolvedBranchType === 'Main Hospital'),
      parentBranch: parentBranchId,
      phone: phone ? phone.trim() : undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      address: address || {},
      bedCapacity: requestedBedCapacity,
      hasEmergency: hasEmergency !== undefined ? Boolean(hasEmergency) : true,
      hasICU: hasICU !== undefined ? Boolean(hasICU) : true,
      hasOT: hasOT !== undefined ? Boolean(hasOT) : true
    });

    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return res.status(400).json({ success: false, error: message });
    }
    next(err);
  }
};

// @desc    Get departments
// @route   GET /api/v1/tenants/:id/departments
// @access  Private
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ tenant: req.params.id }).populate('headOfDepartment', 'name email');
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
};

// @desc    Create department
// @route   POST /api/v1/tenants/:id/departments
// @access  Private
exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create({
      tenant: req.params.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
};

// @desc    Get staff users
// @route   GET /api/v1/tenants/:id/users
// @access  Private
exports.getTenantUsers = async (req, res, next) => {
  try {
    const query = { tenant: req.params.id };
    // Sub-branch users only see staff of their own sub-branch
    if (req.isSubBranch && !req.isUserFromMainBranch) {
      query.branch = req.branchId;
    }
    const users = await User.find(query)
      .select('-password')
      .populate('branch', 'name code')
      .populate('department', 'name code');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new staff user
// @route   POST /api/v1/tenants/:id/users
// @access  Private
exports.createTenantUser = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    const isPlatformAdmin = ['super_admin', 'saas_admin'].includes(req.user?.role);

    // Tenant isolation check
    const userTenantId = req.user?.tenant?._id ? req.user.tenant._id.toString() : (req.user?.tenant ? req.user.tenant.toString() : (req.tenantId ? req.tenantId.toString() : null));
    if (!isPlatformAdmin && userTenantId !== tenantId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You cannot create staff for another hospital organization.'
      });
    }

    // Branch Admin restrictions
    if (req.user?.role === 'branch_admin') {
      if (['super_admin', 'saas_admin', 'hospital_admin', 'org_admin'].includes(req.body.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Branch Admin cannot create organization-level administrator accounts.'
        });
      }

      const adminBranchId = req.user.branch?._id ? req.user.branch._id.toString() : req.user.branch?.toString();
      if (!adminBranchId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Branch Admin has no assigned branch.'
        });
      }
      // Branch Admin can only assign staff to their own branch
      req.body.branch = adminBranchId;
    }

    // A Branch Admin role MUST be assigned to a specific branch
    if (req.body.role === 'branch_admin' && !req.body.branch) {
      return res.status(400).json({
        success: false,
        error: 'A Branch Admin must be assigned to a specific branch.'
      });
    }

    // Cross-tenant branch assignment check: ensure assigned branch belongs to this tenant
    if (req.body.branch) {
      const branchDoc = await Branch.findById(req.body.branch);
      if (!branchDoc) {
        return res.status(400).json({
          success: false,
          error: 'Specified branch does not exist.'
        });
      }
      if (branchDoc.tenant.toString() !== tenantId.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Access denied. Assigned branch does not belong to this hospital organization.'
        });
      }
    }

    const user = await User.create({
      tenant: tenantId,
      ...req.body
    });
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==================== BULK IMPORT ====================
exports.previewBulkImport = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    const { branchId, category, rows } = req.body;
    const preview = await bulkImportService.previewImport({
      tenantId,
      branchId,
      category,
      rows
    });
    res.status(200).json({ success: true, ...preview });
  } catch (err) {
    next(err);
  }
};

exports.commitBulkImport = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    const { branchId, category, validRows } = req.body;
    const result = await bulkImportService.commitImport({
      tenantId,
      branchId,
      category,
      validRows,
      importedBy: req.user
    });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ==================== TENANT OFFBOARDING & PRIVACY ====================
exports.initiateTenantOffboarding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, gracePeriodDays, retentionMonths } = req.body;
    const result = await tenantLifecycleService.initiateOffboarding({
      tenantId: id,
      initiatedBy: req.user,
      reason,
      gracePeriodDays,
      retentionMonths
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.exportTenantData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await tenantLifecycleService.exportTenantData({
      tenantId: id,
      requestedBy: req.user
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.purgeTenantData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confirmationToken } = req.body;
    const result = await tenantLifecycleService.purgeTenantData({
      tenantId: id,
      authorizedBy: req.user,
      confirmationToken
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ==================== ABDM / FHIR READINESS ====================
exports.exportFhirPatientBundle = async (req, res, next) => {
  try {
    const { patientId, consentArtifact } = req.body;
    const patient = await Patient.findOne({ _id: patientId, tenant: req.tenantId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found in current hospital organization.' });
    }

    const result = await fhirConverterService.exportPatientBundleWithConsent({
      tenantId: req.tenantId,
      patient,
      consentArtifact,
      authorizedBy: req.user
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ==================== HRMS INTEGRATION ====================
exports.syncHrmsStaff = async (req, res, next) => {
  try {
    const { department } = req.body;
    const result = await hrmsService.syncStaff({
      tenantId: req.tenantId,
      department,
      requestedBy: req.user
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

