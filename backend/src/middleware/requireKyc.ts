import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { kycService } from '../services/kycService';
import { log } from '../utils/logger';
import prisma from '../db';

//
// requireFiatEnabled — environment wall for fiat payouts. On testnet the
// anchor is simulated, so a fiat invoice would only pretend to settle COP;
// this environment refuses to create them. Driven by config.fiat.enabled
// (FIAT_ENABLED env, defaulting to mainnet-only). Crypto passes through.
//
// MUST be mounted after validateBody (needs the parsed req.body.payoutMethod).
//
export function requireFiatEnabled(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (config.fiat.enabled) return next();
  if (req.body?.payoutMethod !== 'BRE_B') return next();

  return res.status(403).json({
    error: 'FIAT_DISABLED',
    message:
      'Fiat (Bre-B) payouts are not available on this environment. Use the production app for fiat.',
  });
}

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

//
// requireKycForInvoiceType — gate that enforces merchant identity verification
// for BUSINESS_INVOICE and SERVICE_INVOICE links, regardless of payout method
// (unlike requireKycForFiat, crypto does NOT bypass this one). DIRECT_PAYMENT
// carries no requirement and passes straight through.
//
// MUST be mounted after requireWallet (needs req.walletAddress) and after
// validateBody (needs the parsed req.body.invoiceType).
//
export async function requireKycForInvoiceType(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Gate disabled for this process.
  if (!config.kyc.enforced) return next();

  const invoiceType = req.body?.invoiceType;
  if (invoiceType !== 'BUSINESS_INVOICE' && invoiceType !== 'SERVICE_INVOICE') {
    return next();
  }

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
        'Debes completar la verificación de identidad (KYC) para crear este tipo de factura',
    });
  } catch (error) {
    log.error('requireKycForInvoiceType error', {
      walletAddress,
      error: (error as Error)?.message,
    });
    return res.status(500).json({ error: 'KYC check failed' });
  }
}

//
// requireBreBKeyForFiat — gate that enforces the merchant has a saved Bre-B
// payout key (BusinessProfile.defaultPayoutAlias, the "correct field" this
// project already uses for the alias — see profileService/ProfileOptions)
// before a BRE_B invoice can be created. Crypto invoices carry no requirement.
//
// MUST be mounted after requireWallet (needs req.walletAddress) and after
// validateBody (needs the parsed req.body.payoutMethod).
//
export async function requireBreBKeyForFiat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.body?.payoutMethod !== 'BRE_B') return next();

  const walletAddress = req.walletAddress;
  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { walletAddress },
      select: { defaultPayoutAlias: true },
    });
    if (profile?.defaultPayoutAlias) {
      return next();
    }
    return res.status(403).json({
      error: 'BREB_KEY_REQUIRED',
      message:
        'Debes agregar una llave Bre-B en tu perfil de negocio para recibir pagos en pesos',
    });
  } catch (error) {
    log.error('requireBreBKeyForFiat error', {
      walletAddress,
      error: (error as Error)?.message,
    });
    return res.status(500).json({ error: 'Bre-B key check failed' });
  }
}
