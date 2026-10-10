/**
 * Shared Validation & Sanitization Utilities for Hospital Vision OS
 * Enforces strict phone, email, and input standards across the application.
 */

/**
 * Sanitizes phone number input:
 * - Only allow numbers (0-9)
 * - First digit must be 6, 7, 8, or 9 (Indian mobile standard; cannot start with 0, 1, 2, 3, 4, 5)
 * - Max length is fixed at 10 digits
 */
export const sanitizePhoneInput = (val) => {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';

  // First digit cannot start with 0, 1, 2, 3, 4, 5
  if (!['6', '7', '8', '9'].includes(digits[0])) {
    return '';
  }

  return digits.slice(0, 10);
};

/**
 * Validates if the phone number is a strictly valid 10-digit mobile number.
 */
export const isValidPhoneNumber = (val) => {
  if (!val) return false;
  const digits = String(val).trim().replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits);
};

/**
 * Returns a human-friendly phone validation error message if invalid.
 */
export const getPhoneErrorMessage = (val, fieldLabel = 'Mobile number') => {
  if (!val || !String(val).trim()) {
    return `${fieldLabel} is required`;
  }
  const digits = String(val).trim().replace(/\D/g, '');
  if (digits.length === 0) {
    return `${fieldLabel} must contain numbers only`;
  }
  if (!['6', '7', '8', '9'].includes(digits[0])) {
    return `${fieldLabel} must start with 6, 7, 8, or 9`;
  }
  if (digits.length !== 10) {
    return `${fieldLabel} must be exactly 10 digits (currently ${digits.length})`;
  }
  return null;
};

/**
 * Validates standard email address format.
 */
export const isValidEmail = (val) => {
  if (!val || typeof val !== 'string') return false;
  // RFC 5322 compliant email regex
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(val.trim());
};

/**
 * Returns an email error message if invalid.
 */
export const getEmailErrorMessage = (val, fieldLabel = 'Email address') => {
  if (!val || !String(val).trim()) {
    return `${fieldLabel} is required`;
  }
  if (!isValidEmail(val)) {
    return `Please enter a valid ${fieldLabel.toLowerCase()} (e.g. name@hospital.com)`;
  }
  return null;
};
