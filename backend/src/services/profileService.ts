import { Currency, PayoutMethod } from '@prisma/client';
import { SaveProfileInput, BusinessProfileView } from '../types';
import prisma from '../db';

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// Distinguish "field omitted" (undefined → leave untouched on update, default
// to null on create) from "field explicitly cleared" ('' → set null). Prisma
// drops `undefined` values from both update and create.
function set(value?: string | null): string | null | undefined {
  return value === undefined ? undefined : clean(value);
}

function toView(profile: {
  walletAddress: string;
  displayName: string | null;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  defaultCurrency: Currency;
  defaultPayoutMethod: PayoutMethod;
  defaultPayoutAlias: string | null;
}): BusinessProfileView {
  return {
    walletAddress: profile.walletAddress,
    displayName: profile.displayName,
    legalName: profile.legalName,
    taxId: profile.taxId,
    email: profile.email,
    phone: profile.phone,
    addressLine: profile.addressLine,
    city: profile.city,
    country: profile.country,
    logoUrl: profile.logoUrl,
    defaultCurrency: profile.defaultCurrency,
    defaultPayoutMethod: profile.defaultPayoutMethod,
    defaultPayoutAlias: profile.defaultPayoutAlias,
  };
}

export class ProfileService {
  /**
   * Get the business profile for a wallet, or null if none saved yet.
   */
  async getProfile(walletAddress: string): Promise<BusinessProfileView | null> {
    const profile = await prisma.businessProfile.findUnique({
      where: { walletAddress },
    });
    return profile ? toView(profile) : null;
  }

  /**
   * Create or update the business profile for a wallet.
   * Only the provided fields are written; omitted fields are left untouched
   * on update so a partial save doesn't wipe existing data.
   */
  async upsertProfile(
    walletAddress: string,
    input: SaveProfileInput
  ): Promise<BusinessProfileView> {
    const data = {
      displayName: set(input.displayName),
      legalName: set(input.legalName),
      taxId: set(input.taxId),
      email: set(input.email),
      phone: set(input.phone),
      addressLine: set(input.addressLine),
      city: set(input.city),
      country: set(input.country),
      logoUrl: set(input.logoUrl),
      defaultPayoutAlias: set(input.defaultPayoutAlias),
      ...(input.defaultCurrency && {
        defaultCurrency: input.defaultCurrency as Currency,
      }),
      ...(input.defaultPayoutMethod && {
        defaultPayoutMethod: input.defaultPayoutMethod as PayoutMethod,
      }),
    };

    const profile = await prisma.businessProfile.upsert({
      where: { walletAddress },
      update: data,
      create: { walletAddress, ...data },
    });

    return toView(profile);
  }
}

export const profileService = new ProfileService();
