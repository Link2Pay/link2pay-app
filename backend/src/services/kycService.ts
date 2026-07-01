import { KycStatus } from '@prisma/client';
import prisma from '../db';
import { config } from '../config';
import { log } from '../utils/logger';
import { kycProvider, KycVerificationStatus } from '../kyc';

export interface KycStatusView {
  status: KycStatus;
  provider: string | null;
  verifiedAt: string | null;
  /** Whether the gate is active this process (KYC_ENFORCED). */
  enforced: boolean;
}

export interface StartKycResult {
  status: KycStatus;
  provider: string;
  ref?: string;
  verificationUrl?: string;
}

/** Provider 3-state → Prisma enum (UNVERIFIED is never a provider outcome). */
function toEnum(s: KycVerificationStatus): KycStatus {
  switch (s) {
    case 'VERIFIED':
      return KycStatus.VERIFIED;
    case 'REJECTED':
      return KycStatus.REJECTED;
    default:
      return KycStatus.PENDING;
  }
}

export class KycService {
  /** Ensure a BusinessProfile row exists so KYC fields can be written. */
  private async ensureProfile(walletAddress: string) {
    return prisma.businessProfile.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });
  }

  /** True once the merchant behind this wallet is VERIFIED. */
  async isVerified(walletAddress: string): Promise<boolean> {
    const profile = await prisma.businessProfile.findUnique({
      where: { walletAddress },
      select: { kycStatus: true },
    });
    return profile?.kycStatus === KycStatus.VERIFIED;
  }

  /**
   * Current KYC status for a wallet. For a PENDING real-provider session this
   * also polls the provider once and persists any change, so the gate clears
   * without depending on webhooks (works on localhost).
   */
  async getStatus(walletAddress: string): Promise<KycStatusView> {
    let profile = await prisma.businessProfile.findUnique({
      where: { walletAddress },
    });

    if (
      profile &&
      profile.kycStatus === KycStatus.PENDING &&
      profile.kycRef &&
      kycProvider.id !== 'mock'
    ) {
      try {
        const remote = toEnum(await kycProvider.getStatus(profile.kycRef));
        if (remote !== profile.kycStatus) {
          profile = await this.applyStatusByWallet(walletAddress, remote);
        }
      } catch (error) {
        log.warn('KYC status refresh failed', {
          walletAddress,
          error: (error as Error)?.message,
        });
      }
    }

    return {
      status: profile?.kycStatus ?? KycStatus.UNVERIFIED,
      provider: profile?.kycProvider ?? null,
      verifiedAt: profile?.kycVerifiedAt?.toISOString() ?? null,
      enforced: config.kyc.enforced,
    };
  }

  /**
   * Begin (or resume) a verification session for a merchant. Idempotent when
   * already VERIFIED. Persists provider + ref and flips status to PENDING.
   */
  async startKyc(walletAddress: string): Promise<StartKycResult> {
    const profile = await this.ensureProfile(walletAddress);
    if (profile.kycStatus === KycStatus.VERIFIED) {
      return {
        status: KycStatus.VERIFIED,
        provider: profile.kycProvider ?? kycProvider.id,
      };
    }

    const result = await kycProvider.startVerification({
      walletAddress,
      profile: {
        legalName: profile.legalName,
        email: profile.email,
        phone: profile.phone,
        country: profile.country,
      },
      returnUrl: `${config.frontendUrl}/dashboard/profile-options?kyc=return`,
    });

    await prisma.businessProfile.update({
      where: { walletAddress },
      data: {
        kycStatus: KycStatus.PENDING,
        kycProvider: kycProvider.id,
        kycRef: result.ref,
      },
    });

    return {
      status: KycStatus.PENDING,
      provider: kycProvider.id,
      ref: result.ref,
      verificationUrl: result.verificationUrl,
    };
  }

  /** Apply a resolved status to the profile owning a provider ref (webhook). */
  async applyStatusByRef(ref: string, status: KycStatus) {
    const profile = await prisma.businessProfile.findFirst({
      where: { kycRef: ref },
      select: { walletAddress: true },
    });
    if (!profile) {
      log.warn('KYC webhook for unknown ref', { ref });
      return null;
    }
    return this.applyStatusByWallet(profile.walletAddress, status);
  }

  /** Persist a status for a wallet, stamping kycVerifiedAt on VERIFIED. */
  async applyStatusByWallet(walletAddress: string, status: KycStatus) {
    return prisma.businessProfile.update({
      where: { walletAddress },
      data: {
        kycStatus: status,
        kycVerifiedAt: status === KycStatus.VERIFIED ? new Date() : null,
      },
    });
  }

  /**
   * Mock-only: explicit completion driven by the UI's one-click approve/decline.
   * Guarded to the mock provider so it can never short-circuit a real flow.
   */
  async completeMock(
    walletAddress: string,
    approve: boolean
  ): Promise<KycStatusView> {
    if (kycProvider.id !== 'mock') {
      throw new Error('MOCK_COMPLETE_DISABLED: active KYC provider is not mock');
    }
    await this.ensureProfile(walletAddress);
    await this.applyStatusByWallet(
      walletAddress,
      approve ? KycStatus.VERIFIED : KycStatus.REJECTED
    );
    return this.getStatus(walletAddress);
  }
}

export const kycService = new KycService();
