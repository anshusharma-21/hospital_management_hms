/**
 * Hospital Vision SaaS — Canonical Subscription Plans & Bed Capacity Configuration
 * Single source of truth for subscription plan tiers, limits, and normalization.
 */

const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    planName: 'Starter (Up to 25 Beds)',
    displayName: 'Starter Clinic / Nursing Home',
    onboardingLabel: 'Starter (Up to 25 Beds) — ₹19,000/mo',
    price: '₹19,000',
    priceAmount: 19000,
    period: '/ month',
    beds: 'Up to 25 Beds',
    defaultBeds: 25,
    branches: '1 Branch',
    defaultBranches: 1,
    users: 'Up to 15 Users',
    defaultUsers: 15,
    maxBeds: 25,
    maxBranches: 1,
    maxUsers: 15,
    features: [
      'One Patient → One Record (UHID)',
      'OPD Queue & Appointments',
      'Clinical EMR & e-Prescriptions',
      'Billing & Cashier Module',
      'Pharmacy Point-of-Sale'
    ],
    badge: 'Clinics'
  },
  professional: {
    id: 'professional',
    planName: 'Professional (Up to 100 Beds)',
    displayName: 'Professional Multi-Specialty',
    onboardingLabel: 'Professional (Up to 100 Beds) — ₹49,000/mo',
    price: '₹49,000',
    priceAmount: 49000,
    period: '/ month',
    beds: 'Up to 100 Beds',
    defaultBeds: 100,
    branches: 'Up to 3 Branches',
    defaultBranches: 3,
    users: 'Up to 50 Users',
    defaultUsers: 50,
    maxBeds: 100,
    maxBranches: 3,
    maxUsers: 50,
    features: [
      'Everything in Starter',
      'Inpatient (IPD) Bed Management',
      'Nursing Station & MAR Charts',
      'Diagnostic Lab & Barcode Station',
      'Radiology Modality Worklist',
      'Operating Theatre Scheduling'
    ],
    badge: 'Popular',
    isPopular: true
  },
  enterprise: {
    id: 'enterprise',
    planName: 'Enterprise (500+ Beds)',
    displayName: 'Enterprise Hospital Group',
    onboardingLabel: 'Enterprise (500+ Beds) — ₹99,000/mo',
    price: '₹99,000',
    priceAmount: 99000,
    period: '/ month',
    beds: '500+ Beds',
    defaultBeds: 500,
    branches: 'Unlimited Branches',
    defaultBranches: 99,
    users: 'Unlimited Users',
    defaultUsers: 500,
    maxBeds: 500,
    maxBranches: 99,
    maxUsers: 500,
    features: [
      'Everything in Professional',
      'Multi-Branch Consolidated Ledger',
      'ICU High-Acuity Telemetry',
      'Custom Document Templates',
      'Fine-Grained RBAC Custom Matrix',
      '24x7 Dedicated SaaS Engineer SLA'
    ],
    badge: 'Enterprise'
  },
  custom: {
    id: 'custom',
    planName: 'Custom',
    displayName: 'Custom Institutional Plan',
    onboardingLabel: 'Custom Plan — Contact Sales',
    price: 'Custom',
    priceAmount: 0,
    period: '/ month',
    beds: 'Custom Quota',
    defaultBeds: 100,
    branches: 'Custom',
    defaultBranches: 10,
    users: 'Custom',
    defaultUsers: 100,
    maxBeds: 100,
    maxBranches: 10,
    maxUsers: 100,
    features: [
      'Custom Module Provisioning',
      'Dedicated Infrastructure',
      'Enterprise SLA'
    ],
    badge: 'Custom'
  }
};

const ALLOWED_PLAN_ENUMS = [
  // Canonical names
  'Starter (Up to 25 Beds)',
  'Professional (Up to 100 Beds)',
  'Enterprise (500+ Beds)',
  'Basic (Up to 25 Beds)',
  'Business (500+ Beds)',
  'Custom',
  // Canonical codes
  'starter',
  'professional',
  'enterprise',
  'basic',
  'business',
  'custom',
  // Preserved legacy stored values
  'Basic',
  'Professional',
  'Business'
];

/**
 * Normalizes any plan representation (codes, legacy labels, errant onboarding strings)
 * into its canonical plan representation while preserving existing stored legacy values.
 */
const normalizePlan = (plan) => {
  if (!plan || typeof plan !== 'string') {
    return SUBSCRIPTION_PLANS.professional.planName;
  }
  const trimmed = plan.trim();
  const lower = trimmed.toLowerCase();

  // Preserved legacy exact enums
  if (trimmed === 'Basic') return 'Basic';
  if (trimmed === 'Business') return 'Business';
  if (trimmed === 'Professional') return 'Professional';
  if (trimmed === 'Custom' || lower === 'custom') return 'Custom';

  // Starter / Basic variants (handles "starter", "basic", "Basic (Up to 25 Beds)", "Starter (Up to 25 Beds)")
  if (
    lower === 'starter' ||
    lower.includes('starter') ||
    lower === 'basic' ||
    lower.includes('basic') ||
    lower.includes('30 beds') ||
    lower.includes('25 beds')
  ) {
    return SUBSCRIPTION_PLANS.starter.planName;
  }

  // Enterprise / Business variants (handles "enterprise", "business", "Business (500+ Beds)", "Enterprise (500+ Beds)")
  if (
    lower === 'enterprise' ||
    lower.includes('enterprise') ||
    lower === 'business' ||
    lower.includes('business') ||
    lower.includes('500 beds') ||
    lower.includes('500+')
  ) {
    return SUBSCRIPTION_PLANS.enterprise.planName;
  }

  // Professional variants
  if (
    lower === 'professional' ||
    lower.includes('professional') ||
    lower.includes('100 beds')
  ) {
    return SUBSCRIPTION_PLANS.professional.planName;
  }

  return trimmed;
};

/**
 * Returns canonical plan tier object for a given plan string or code
 */
const getPlanConfig = (plan) => {
  const normalized = normalizePlan(plan);
  if (normalized === SUBSCRIPTION_PLANS.starter.planName || normalized === 'starter') {
    return SUBSCRIPTION_PLANS.starter;
  }
  if (normalized === SUBSCRIPTION_PLANS.enterprise.planName || normalized === 'enterprise') {
    return SUBSCRIPTION_PLANS.enterprise;
  }
  if (normalized === SUBSCRIPTION_PLANS.custom.planName || normalized === 'custom') {
    return SUBSCRIPTION_PLANS.custom;
  }
  if (normalized === 'Basic') {
    return { ...SUBSCRIPTION_PLANS.starter, id: 'basic', planName: 'Basic', defaultBeds: 50 };
  }
  return SUBSCRIPTION_PLANS.professional;
};

/**
 * Returns canonical default licensed max beds for a plan
 */
const getPlanDefaultBeds = (plan) => {
  const config = getPlanConfig(plan);
  return config?.defaultBeds || 100;
};

module.exports = {
  SUBSCRIPTION_PLANS,
  ALLOWED_PLAN_ENUMS,
  normalizePlan,
  getPlanConfig,
  getPlanDefaultBeds
};
