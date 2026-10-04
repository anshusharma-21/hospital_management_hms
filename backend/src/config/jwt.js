// Centralized JWT configuration with production security enforcement

const getJwtSecret = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET;

  if (isProduction && (!secret || secret === 'hospital_vision_dev_jwt_secret_only_local_2026')) {
    const errorMsg = '[FATAL CONFIG ERROR] JWT_SECRET must be explicitly defined in production environment. Refusing to start with insecure or missing secret.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Development/Test fallback explicitly identified for local testing only
  return secret || 'hospital_vision_dev_jwt_secret_only_local_2026';
};

const getJwtExpire = () => {
  return process.env.JWT_EXPIRE || '30d';
};

module.exports = { getJwtSecret, getJwtExpire };
