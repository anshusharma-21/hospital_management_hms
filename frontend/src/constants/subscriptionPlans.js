/**
 * Hospital Vision SaaS — Canonical Subscription Plans & Bed Capacity Configuration
 * Single source of truth for frontend plan tiers, options, and limits.
 */

export const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    planName: 'Starter (Up to 25 Beds)',
    displayName: 'Basic Plan',
    subTitle: 'Clinics & Nursing Homes',
    onboardingLabel: 'Basic Plan (Up to 25 Beds) — ₹19,000/mo',
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
    badge: 'Basic'
  },
  professional: {
    id: 'professional',
    planName: 'Professional (Up to 100 Beds)',
    displayName: 'Professional Plan',
    subTitle: 'Multi-Specialty Hospitals',
    onboardingLabel: 'Professional Plan (Up to 100 Beds) — ₹49,000/mo',
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
      'Everything in Basic',
      'Inpatient (IPD) Bed Management',
      'Nursing Station & MAR Charts',
      'Diagnostic Lab & Barcode Station',
      'Radiology Modality Worklist',
      'Operating Theatre Scheduling'
    ],
    badge: 'Most Popular',
    isPopular: true
  },
  enterprise: {
    id: 'enterprise',
    planName: 'Enterprise (500+ Beds)',
    displayName: 'Business Plan',
    subTitle: 'Hospital Groups & Chains',
    onboardingLabel: 'Business Plan (500+ Beds) — ₹99,000/mo',
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
    badge: 'Business'
  }
};

export const ONBOARDING_PLAN_OPTIONS = [
  {
    value: SUBSCRIPTION_PLANS.starter.planName,
    label: SUBSCRIPTION_PLANS.starter.onboardingLabel,
    defaultBeds: SUBSCRIPTION_PLANS.starter.defaultBeds
  },
  {
    value: SUBSCRIPTION_PLANS.professional.planName,
    label: SUBSCRIPTION_PLANS.professional.onboardingLabel,
    defaultBeds: SUBSCRIPTION_PLANS.professional.defaultBeds
  },
  {
    value: SUBSCRIPTION_PLANS.enterprise.planName,
    label: SUBSCRIPTION_PLANS.enterprise.onboardingLabel,
    defaultBeds: SUBSCRIPTION_PLANS.enterprise.defaultBeds
  }
];

export const PLAN_TIERS_LIST = [
  SUBSCRIPTION_PLANS.starter,
  SUBSCRIPTION_PLANS.professional,
  SUBSCRIPTION_PLANS.enterprise
];
