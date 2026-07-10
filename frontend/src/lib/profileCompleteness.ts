import type { BusinessProfile } from '../types';

const REQUIRED_PROFILE_FIELDS = ['displayName', 'email', 'phone', 'country'] as const;

export function isProfileComplete(profile: BusinessProfile | null | undefined): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = profile[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}
