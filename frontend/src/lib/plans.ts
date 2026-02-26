export type PlanTier = 'free' | 'pro' | 'business';

export type PlanCapability =
  | 'projects'
  | 'apiKeys'
  | 'webhooks'
  | 'analytics'
  | 'exports'
  | 'team'
  | 'branding'
  | 'customDomain'
  | 'links.reusable'
  | 'links.variableAmount'
  | 'links.customExpiry'
  | 'links.redirectUrl';

const PLAN_ORDER: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  business: 2,
};

const CAPABILITY_MIN_TIER: Record<PlanCapability, PlanTier> = {
  projects: 'pro',
  apiKeys: 'pro',
  webhooks: 'pro',
  analytics: 'pro',
  exports: 'business',
  team: 'business',
  branding: 'pro',
  customDomain: 'business',
  'links.reusable': 'pro',
  'links.variableAmount': 'pro',
  'links.customExpiry': 'pro',
  'links.redirectUrl': 'pro',
};

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};

export const PLAN_HISTORY_RETENTION: Record<PlanTier, string> = {
  free: '3 hours',
  pro: '30 days',
  business: '12 months',
};

export const PLAN_PROJECT_LIMIT: Record<PlanTier, string> = {
  free: '1 project',
  pro: 'Up to 5 projects',
  business: 'Unlimited projects',
};

export function normalizePlanTier(value?: string | null): PlanTier {
  if (!value) return 'free';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'pro') return 'pro';
  if (normalized === 'business') return 'business';
  return 'free';
}

export function getPlanLabel(tier: PlanTier): string {
  return PLAN_LABELS[tier];
}

export function tierAtLeast(current: PlanTier, required: PlanTier): boolean {
  return PLAN_ORDER[current] >= PLAN_ORDER[required];
}

export function requiredTierForCapability(capability: PlanCapability): PlanTier {
  return CAPABILITY_MIN_TIER[capability];
}

export function hasCapability(tier: PlanTier, capability: PlanCapability): boolean {
  return tierAtLeast(tier, CAPABILITY_MIN_TIER[capability]);
}
