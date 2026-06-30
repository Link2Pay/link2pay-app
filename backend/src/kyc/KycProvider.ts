//
// KycProvider — unified interface for merchant identity-verification providers.
//
// This gates the SELLER at signup (before a wallet may create invoices). It is
// deliberately the same shape as AnchorAdapter: one interface, swappable
// implementations selected by env. The off-ramp payer's KYC is NOT handled here
// — that is the anchor's legal responsibility, done in its SEP-24 flow.
//

export type KycVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface KycProfileHints {
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
}

export interface StartVerificationParams {
  /** The merchant's Stellar wallet (their identity in Link2Pay). */
  walletAddress: string;
  /** Known profile fields, passed to prefill the provider's form. */
  profile: KycProfileHints;
  /** Where the provider should return the user after they finish. */
  returnUrl: string;
}

export interface StartVerificationResult {
  /** Provider-side session/verification id — persisted as BusinessProfile.kycRef. */
  ref: string;
  /** Hosted URL the merchant opens to complete verification. */
  verificationUrl: string;
}

export interface KycProvider {
  /** Unique identifier for the provider (also stored as kycProvider). */
  readonly id: 'mock' | 'didit';

  /**
   * Begin a verification session for a merchant. Returns the provider ref to
   * persist and the hosted URL the merchant completes verification at.
   */
  startVerification(params: StartVerificationParams): Promise<StartVerificationResult>;

  /**
   * Poll the provider for the current status of a verification session.
   * Used to refresh PENDING merchants without relying on webhooks (so the
   * flow works on localhost without a public callback URL).
   */
  getStatus(ref: string): Promise<KycVerificationStatus>;

  /**
   * Parse and authenticate a provider webhook. Returns the ref + resolved
   * status, or null if the payload is malformed or the signature is invalid.
   * Optional: providers without webhooks (mock) omit this.
   */
  parseWebhook?(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): { ref: string; status: KycVerificationStatus } | null;
}
