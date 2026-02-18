import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Zod schemas for request validation

export const lineItemSchema = z.object({
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
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email(),
  clientCompany: z.string().max(200).optional(),
  clientAddress: z.string().max(500).optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  currency: z.enum(['XLM', 'USDC', 'EURC']),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional(),
  saveClient: z.boolean().optional(),
  favoriteClient: z.boolean().optional(),
  lineItems: z.array(lineItemSchema).min(1).max(50),
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

export const payIntentSchema = z.object({
  senderPublicKey: z
    .string()
    .min(56)
    .max(56)
    .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
});

export const submitPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  signedTransactionXdr: z.string().min(1),
});

export const confirmPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  transactionHash: z.string().min(64).max(64),
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
 * Middleware for wallet authentication (simple version)
 * In production, this should verify a signed message
 */
export function requireWallet(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const walletAddress = req.headers['x-wallet-address'] as string;
  if (!walletAddress || !/^G[A-Z2-7]{55}$/.test(walletAddress)) {
    return res.status(401).json({ error: 'Valid wallet address required' });
  }
  (req as any).walletAddress = walletAddress;
  next();
}
