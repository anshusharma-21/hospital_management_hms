// Ensure tenant isolation
const enforceTenant = (req, res, next) => {
  // If user is super_admin without tenant context, allowed for platform operations
  if (['super_admin', 'saas_admin'].includes(req.user?.role) && !req.tenantId) {
    return next();
  }

  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Tenant context is missing. Action cannot be verified for isolation.'
    });
  }

  next();
};

module.exports = { enforceTenant };
