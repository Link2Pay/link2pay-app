//
// KYC provider selector — picks the active merchant-verification provider from
// config (KYC_PROVIDER). Defaults to the mock provider so the gate is fully
// functional out of the box.
//

import { config } from '../config';
import { KycProvider } from './KycProvider';
import { mockKycProvider } from './providers/MockKycProvider';
import { diditKycProvider } from './providers/DiditKycProvider';

export * from './KycProvider';
export { MOCK_VERIFICATION_URL } from './providers/MockKycProvider';

const PROVIDERS: Record<string, KycProvider> = {
  mock: mockKycProvider,
  didit: diditKycProvider,
};

/** The active KYC provider for this process. */
export const kycProvider: KycProvider =
  PROVIDERS[config.kyc.provider] ?? mockKycProvider;
