import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Zod schemas for request validation

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive().max(999999),
  rate: z.number().min(0).max(999999999),
});

export const createInvoiceSchema = z.object({
  freelancerWallet: z
    .string()
    .min(56)
    .max(56)
    .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
  freelancerName: z.string().max(200).optional(),
  freelancerEmail: z.string().email().optional(),
  freelancerCompany: z.string().max(200).optional(),
  freelancerTaxId: z.string().max(50).optional(),
  freelancerAddress: z.string().max(500).optional(),
  freelancerPhone: z.string().max(50).optional(),
  freelancerLogoUrl: z.string().url().max(500).optional(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email(),
  clientCompany: z.string().max(200).optional(),
  clientAddress: z.string().max(500).optional(),
  clientTaxId: z.string().max(50).optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  currency: z.enum(['XLM', 'USDC', 'EURC']),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional(),
  networkPassphrase: z
    .string()
    .refine(
      (val) =>
        val === 'Test SDF Network ; September 2015' ||
        val === 'Public Global Stellar Network ; September 2015',
      { message: 'Invalid network passphrase' }
    )
    .optional(),
  saveClient: z.boolean().optional(),
  favoriteClient: z.boolean().optional(),
  payoutMethod: z.enum(['CRYPTO', 'BRE_B']).optional(),
  payoutAlias: z.string().min(1).max(200).optional(),
  invoiceType: z.enum(['DIRECT_PAYMENT', 'BUSINESS_INVOICE', 'SERVICE_INVOICE']).optional(),
  // Open-amount invoices carry no line items — the payer enters the amount at
  // pay time. Otherwise at least one line item is required (enforced below).
  isOpenAmount: z.boolean().optional(),
  lineItems: z.array(lineItemSchema).max(50).optional(),
}).superRefine((data, ctx) => {
  if (!data.isOpenAmount && (!data.lineItems || data.lineItems.length < 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one line item is required',
      path: ['lineItems'],
    });
  }
  if (data.payoutMethod === 'BRE_B' && data.currency !== 'USDC') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Bre-B payouts require USDC invoices',
      path: ['currency'],
    });
  }
});

export const createPaymentLinkSchema = z.object({
  amount: z.coerce.number().positive().max(999999999),
  asset: z.enum(['XLM', 'USDC', 'EURC']),
  activateNewAccounts: z.boolean().optional(),
  networkPassphrase: z
    .string()
    .refine(
      (val) =>
        val === 'Test SDF Network ; September 2015' ||
        val === 'Public Global Stellar Network ; September 2015',
      { message: 'Invalid network passphrase' }
    )
    .optional(),
  recipientWallet: z
    .string()
    .min(56)
    .max(56)
    .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address')
    .optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z
    .object({
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(2000).optional(),
      reference: z.string().max(120).optional(),
      payerName: z.string().max(200).optional(),
      payerEmail: z.string().email().optional(),
    })
    .optional(),
});

export const saveClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  isFavorite: z.boolean().optional(),
});

export const updateClientFavoriteSchema = z.object({
  isFavorite: z.boolean(),
});

// Business profile — all fields optional so the form can be saved incrementally.
// Empty strings are allowed for email/logoUrl so a previously-set value can be cleared.
export const saveProfileSchema = z.object({
  displayName: z.string().max(200).optional(),
  legalName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  addressLine: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal('')),
  defaultCurrency: z.enum(['XLM', 'USDC', 'EURC']).optional(),
  defaultPayoutMethod: z.enum(['CRYPTO', 'BRE_B']).optional(),
  defaultPayoutAlias: z.string().max(200).optional(),
});

export const payIntentSchema = z.object({
  senderPublicKey: z
    .string()
    .min(56)
    .max(56)
    .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address')
    .optional(),
  // Payer-supplied amount — only used (and required) for open-amount invoices.
  amount: z.coerce.number().positive().max(999999999).optional(),
  networkPassphrase: z
    .string()
    .min(1)
    .refine(
      (val) =>
        val === 'Test SDF Network ; September 2015' ||
        val === 'Public Global Stellar Network ; September 2015',
      { message: 'Invalid network passphrase' }
    ),
});

export const submitPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  signedTransactionXdr: z.string().min(1),
});

export const confirmPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  transactionHash: z.string().min(64).max(64),
});

export const offrampQuoteSchema = z.object({
  sellAmount: z.string().min(1),
  payoutAlias: z.string().min(1).max(200),
});

export const offrampInitiateSchema = z.object({
  quoteId: z.string().min(1),
});

// Payer-driven amount for an open-amount Bre-B invoice (public checkout).
export const offrampOpenAmountSchema = z.object({
  sellAmount: z.coerce.number().positive().max(999999999),
});

export const offrampSubmitPaymentSchema = z.object({
  signedTransactionXdr: z.string().min(1),
});

// Demand capture for fiat rails that aren't live yet. Only the walled rails are
// accepted — Bre-B is already live and doesn't need a waitlist.
export const waitlistSchema = z.object({
  email: z.string().email().max(200),
  rail: z.enum(['PIX', 'TRANSFERENCIA_30']),
  country: z.string().max(4).optional(),
  wallet: z.string().max(80).optional(),
});

export const createFundingLinkSchema = z.object({
  asset: z.enum(['XLM', 'USDC']),
  amount: z.number().positive().max(1_000_000),
  escrowAccount: z.string().regex(/^G[A-Z2-7]{55}$/),
  networkPassphrase: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

export const activateFundingLinkSchema = z.object({
  creationTxHash: z.string().regex(/^[0-9a-f]{64}$/),
});

export const sweepFundingLinkSchema = z.object({
  txHash: z.string().regex(/^[0-9a-f]{64}$/).optional(),
});

/**
 * Middleware factory for validating request body with Zod
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware for cryptographic wallet authentication.
 *
 * Preferred auth:
 *   Authorization: Bearer <sessionToken>
 *
 * Legacy fallback headers:
 *   x-wallet-address  — Stellar public key (G...)
 *   x-auth-nonce      — Nonce previously issued by POST /api/auth/nonce
 *   x-auth-signature  — Hex-encoded ed25519 signature over the canonical
 *                       message "link2pay-auth:{wallet}:{nonce}"
 *
 * The signature proves the requester controls the private key corresponding
 * to the public wallet address, preventing impersonation attacks.
 *
 * If bearer auth is missing, all three legacy headers are required.
 */
export function requireWallet(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization as string | undefined;
  if (authorization?.startsWith('Bearer ')) {
    const sessionToken = authorization.slice('Bearer '.length).trim();
    const walletFromSession = authService.verifySessionToken(sessionToken);
    if (!walletFromSession) {
      return res.status(401).json({
        error: 'Invalid or expired session token. Re-authenticate your wallet.',
      });
    }

    req.walletAddress = walletFromSession;
    return next();
  }

  const walletAddress = req.headers['x-wallet-address'] as string | undefined;
  const nonce = req.headers['x-auth-nonce'] as string | undefined;
  const signature = req.headers['x-auth-signature'] as string | undefined;

  if (!walletAddress || !/^G[A-Z2-7]{55}$/.test(walletAddress)) {
    return res
      .status(401)
      .json({ error: 'Valid wallet address required (x-wallet-address)' });
  }

  if (!nonce || !signature) {
    return res.status(401).json({
      error: 'Authentication required. Provide x-auth-nonce and x-auth-signature headers. Request a nonce from POST /api/auth/nonce',
    });
  }

  // Full cryptographic verification — no unauthenticated fallback.
  const valid = authService.verifySignature(walletAddress, nonce, signature);
  if (!valid) {
    return res.status(401).json({
      error: 'Invalid or expired signature. Request a new nonce from POST /api/auth/nonce',
    });
  }

  req.walletAddress = walletAddress;
  next();
}
