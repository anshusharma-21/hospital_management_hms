const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getJwtSecret } = require('../config/jwt');

// Protect routes via JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).populate('tenant', 'name slug subscription status branding settings');

    if (!user) {
      return res.status(401).json({ success: false, error: 'User account not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'User account has been deactivated or suspended' });
    }

    req.user = user;
    const defaultTenantId = user.tenant?._id ? user.tenant._id.toString() : user.tenant ? user.tenant.toString() : null;
    req.tenantId = defaultTenantId;
    
    // Allow SaaS admins to pass header x-tenant-id for support impersonation
    if (['super_admin', 'saas_admin'].includes(user.role) && req.headers['x-tenant-id']) {
      const targetTenantId = req.headers['x-tenant-id'].toString().trim();

      if (targetTenantId && targetTenantId !== defaultTenantId) {
        req.tenantId = targetTenantId;
        req.isCrossTenantAccess = true;

        // Asynchronously record cross-tenant access log without blocking request execution
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
        const requestPath = req.originalUrl || req.url || '';
        const isValidTenantId = mongoose.Types.ObjectId.isValid(targetTenantId);

        AuditLog.create({
          tenant: isValidTenantId ? targetTenantId : undefined,
          user: user._id,
          userName: user.name,
          userRole: user.role,
          action: 'Super Admin Cross-Tenant Access',
          module: 'SaaS Platform',
          entityType: 'Tenant',
          entityId: targetTenantId,
          details: `Super Admin ${user.name} (${user.email}) accessed tenant ${targetTenantId} via x-tenant-id header [${req.method} ${requestPath}]`,
          ipAddress: clientIp,
          timestamp: new Date()
        }).catch(auditErr => {
          console.error('[AuditLog Warning] Could not record cross-tenant access log:', auditErr.message);
        });
      } else if (targetTenantId) {
        req.tenantId = targetTenantId;
      }
    }

    // Active Branch Context Handling (Server-side validation & tenant isolation)
    const Branch = require('../models/Branch');
    const clientBranchId = req.headers['x-branch-id'];
    const isPlatformAdmin = ['super_admin', 'saas_admin'].includes(user.role);
    const isOrgAdminUser = ['hospital_admin', 'org_admin'].includes(user.role) || isPlatformAdmin;

    const userAssignedBranchId = user.branch
      ? (user.branch._id ? user.branch._id.toString() : user.branch.toString())
      : null;

    let userAssignedBranchDoc = null;
    if (userAssignedBranchId && mongoose.Types.ObjectId.isValid(userAssignedBranchId)) {
      userAssignedBranchDoc = await Branch.findById(userAssignedBranchId);
    }

    // A user is considered a "Main Branch User" if they are an Org/Platform Admin OR their assigned branch is the Main Hospital
    const isUserFromMainBranch = isOrgAdminUser || Boolean(
      userAssignedBranchDoc && (
        userAssignedBranchDoc.isMain ||
        userAssignedBranchDoc.branchType === 'Main Hospital' ||
        userAssignedBranchDoc.code === 'MAIN'
      )
    );

    if (clientBranchId) {
      const trimmedBranchId = clientBranchId.toString().trim();
      if (!mongoose.Types.ObjectId.isValid(trimmedBranchId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid active branch context specified.'
        });
      }

      const branchDoc = await Branch.findById(trimmedBranchId);
      if (!branchDoc) {
        return res.status(404).json({
          success: false,
          error: 'Specified active branch does not exist.'
        });
      }

      const branchTenantId = branchDoc.tenant ? branchDoc.tenant.toString() : null;
      if (req.tenantId && branchTenantId !== req.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. The specified branch does not belong to your hospital organization.'
        });
      }

      if (branchDoc.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'The selected branch is currently inactive.'
        });
      }

      // SECURITY ENFORCEMENT & HIERARCHY ACCESS:
      // 1. If user is from the Main Branch (or Org Admin):
      //    They CAN operate on the Main Branch AND switch into any Sub-Branch ("wo branches m v ja skta")!
      // 2. If user is assigned to a Sub-Branch:
      //    They CANNOT access the Main Branch or another branch ("wo main k kux data nhi dekh skte")!
      if (!isUserFromMainBranch && userAssignedBranchId && userAssignedBranchId !== branchDoc._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Sub-branch staff cannot access main branch or other branch data.'
        });
      }

      if (!isOrgAdminUser && user.role === 'branch_admin' && !userAssignedBranchId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Branch Admin account has no assigned branch.'
        });
      }

      req.branchId = branchDoc._id.toString();
      req.activeBranch = branchDoc;
    } else {
      // Default to user's assigned branch if not explicitly specified
      req.branchId = userAssignedBranchId;
      if (userAssignedBranchDoc) {
        req.activeBranch = userAssignedBranchDoc;
      } else if (userAssignedBranchId) {
        req.activeBranch = await Branch.findById(userAssignedBranchId);
      }
    }

    const currentBranch = req.activeBranch;
    req.isMainBranch = Boolean(
      currentBranch && (
        currentBranch.isMain ||
        currentBranch.branchType === 'Main Hospital' ||
        currentBranch.code === 'MAIN'
      )
    );
    req.isSubBranch = !req.isMainBranch;
    req.isUserFromMainBranch = isUserFromMainBranch;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }
};

// Check if user has organization-wide administrative privileges
const isOrgAdmin = (user) => {
  if (!user) return false;
  return ['super_admin', 'saas_admin', 'hospital_admin', 'org_admin'].includes(user.role);
};

// Check if user has permission to access a specific branch resource (Direct-ID / IDOR protection)
const verifyBranchAccess = (req, resourceBranchId) => {
  if (!resourceBranchId) return true;
  if (!req.user) return false;
  if (isOrgAdmin(req.user)) return true;

  const targetBranch = (resourceBranchId && resourceBranchId._id) ? resourceBranchId._id.toString() : resourceBranchId.toString();
  const rawAllowed = req.branchId || req.user?.branch;
  const allowedBranch = rawAllowed ? (rawAllowed._id ? rawAllowed._id.toString() : rawAllowed.toString()) : null;

  return targetBranch === allowedBranch;
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route.`
      });
    }

    next();
  };
};

module.exports = { protect, authorize, isOrgAdmin, verifyBranchAccess };
