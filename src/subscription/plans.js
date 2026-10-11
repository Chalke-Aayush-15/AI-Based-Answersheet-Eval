// ── Subscription Plans Configuration ──────────────────────────────
// Each plan defines which sidebar tabs / features are accessible.

export const PLANS = {
  free_trial: {
    id: 'free_trial',
    name: 'Free Trial',
    tagline: '5-day full access — evaluate up to 100 answer sheets',
    price: 0,
    priceLabel: 'Free',
    durationDays: 5,
    badge: '⏱️',
    color: '#6B7280',
    accentColor: '#9CA3AF',
    bgGradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
    borderColor: '#E5E7EB',
    allowedTabs: ['home', 'subjects', 'evaluation', 'pdf', 'analytics', 'settings'],
    features: [
      { text: 'Full AI Evaluation Engine', included: true },
      { text: 'Subject Manager', included: true },
      { text: 'PDF OCR Tools', included: true },
      { text: 'Analytics Dashboard', included: true },
      { text: 'Email Reports', included: true },
      { text: 'Up to 100 answer sheets', included: true },
      { text: 'Standard Support', included: true },
      { text: 'Unlimited Students', included: true },
    ],
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for individual educators',
    price: 4.99,
    priceLabel: '₹149/month',
    durationDays: null, // ongoing
    badge: '🥈',
    color: '#64748B',
    accentColor: '#94A3B8',
    bgGradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    borderColor: '#CBD5E1',
    allowedTabs: ['home', 'subjects', 'evaluation', 'pdf', 'analytics', 'settings'],
    features: [
      { text: 'Full AI Evaluation Engine', included: true },
      { text: 'Subject Manager', included: true },
      { text: 'PDF OCR Tools', included: true },
      { text: 'Analytics Dashboard', included: true },
      { text: 'Email Reports', included: true },
      { text: 'Up to 500 answer sheets/month', included: true },
      { text: 'Standard Support', included: true },
      { text: 'Unlimited Students', included: true },
    ],
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    tagline: 'Ideal for departments & small institutions',
    price: 12.99,
    priceLabel: '₹399/month',
    durationDays: null,
    badge: '🥇',
    color: '#D97706',
    accentColor: '#F59E0B',
    bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    borderColor: '#FCD34D',
    allowedTabs: ['home', 'subjects', 'evaluation', 'pdf', 'analytics', 'settings'],
    features: [
      { text: 'Full AI Evaluation Engine', included: true },
      { text: 'Subject Manager', included: true },
      { text: 'PDF OCR Tools', included: true },
      { text: 'Analytics Dashboard', included: true },
      { text: 'Email Reports', included: true },
      { text: 'Up to 2000 answer sheets/month', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Unlimited Students', included: true },
    ],
    popular: true,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom solutions for large institutions',
    price: 0,
    priceLabel: 'Custom Pricing',
    durationDays: null,
    badge: '💼',
    color: '#10B981',
    accentColor: '#34D399',
    bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    borderColor: '#A7F3D0',
    allowedTabs: ['home', 'subjects', 'evaluation', 'pdf', 'analytics', 'settings', 'integrations'],
    features: [
      { text: 'Full AI Evaluation Engine', included: true },
      { text: 'Subject Manager', included: true },
      { text: 'PDF OCR Tools', included: true },
      { text: 'Analytics Dashboard', included: true },
      { text: 'Email Reports', included: true },
      { text: 'Unlimited answer sheets', included: true },
      { text: 'Priority Support + Dedicated CSM', included: true },
      { text: 'Unlimited Students', included: true },
      { text: 'LMS Integrations (Canvas, Moodle, etc.)', included: true },
      { text: 'API Access', included: true },
      { text: 'SSO & Custom Branding', included: true },
    ],
  },
};

const LEGACY_PLAN_IDS = { silver: 'starter', gold: 'professional' };

export function normalizePlanId(planId) {
  return LEGACY_PLAN_IDS[planId] || planId;
}

// Tab access labels for display
export const TAB_META = {
  home:         { label: 'Home',              icon: '⌂' },
  subjects:    { label: 'Subject Manager',   icon: '📚' },
  evaluation:  { label: 'Evaluation Engine', icon: '🎯' },
  pdf:         { label: 'PDF OCR Tools',     icon: '📄' },
  analytics:   { label: 'Analytics',         icon: '📊' },
  settings:    { label: 'Settings',          icon: '⚙️' },
  integrations: { label: 'LMS Integrations', icon: '🔌' },
};

// Check if a plan can access a given tab
export function canAccess(planId, tabId) {
  const plan = PLANS[planId];
  if (!plan) return false;
  return plan.allowedTabs.includes(tabId);
}

// Check if trial has expired
export function isTrialExpired(activatedAt) {
  if (!activatedAt) return false;
  const now = Date.now();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  return now - activatedAt > fiveDays;
}

// Get days remaining for trial
export function trialDaysRemaining(activatedAt) {
  if (!activatedAt) return 5;
  const now = Date.now();
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  const elapsed = now - activatedAt;
  return Math.max(0, Math.ceil((fiveDays - elapsed) / (24 * 60 * 60 * 1000)));
}
