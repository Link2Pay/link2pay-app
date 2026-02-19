import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { validateBody } from '../middleware/validation';

const router = Router();

const nonceSchema = z.object({
  walletAddress: z
    .string()
    .min(56)
    .max(56)
    .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address'),
});

/**
 * POST /api/auth/nonce
 * Issue a one-time nonce for wallet signature authentication.
 *
 * Flow:
 *  1. Frontend requests a nonce for its wallet address
 *  2. Backend returns nonce + the message template to sign
 *  3. Frontend signs the message with Freighter
 *  4. Frontend includes wallet + nonce + signature in subsequent requests
 */
router.post(
  '/nonce',
  validateBody(nonceSchema),
  (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    const nonce = authService.issueNonce(walletAddress);
    const message = authService.buildMessage(walletAddress, nonce);

    res.json({
      nonce,
      message,
      expiresIn: 300, // seconds
    });
  }
);

export default router;
