import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { kycService } from '../services/kycService';
import { log } from '../utils/logger';

//
// requireKycForFiat — gate that enforces merchant identity verification ONLY
// for fiat off-ramp invoices (payoutMethod === 'BRE_B'). Crypto invoices carry
// no requirement and pass straight through.
//
// MUST be mounted after requireWallet (needs req.walletAddress) and after
// validateBody (needs the parsed req.body.payoutMethod).
//
export async function requireKycForFiat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Gate disabled for this process.
  if (!config.kyc.enforced) return next();

  // Crypto (or unspecified → defaults to crypto): no KYC required.
  if (req.body?.payoutMethod !== 'BRE_B') return next();

  const walletAddress = req.walletAddress;
  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    if (await kycService.isVerified(walletAddress)) {
      return next();
    }
    const { status } = await kycService.getStatus(walletAddress);
    return res.status(403).json({
      error: 'KYC_REQUIRED',
      kycStatus: status,
      message:
        'Identity verification is required to receive fiat (Bre-B) payouts.',
    });
  } catch (error) {
    log.error('requireKycForFiat error', {
      walletAddress,
      error: (error as Error)?.message,
    });
    return res.status(500).json({ error: 'KYC check failed' });
  }
}
