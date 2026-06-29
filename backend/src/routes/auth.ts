import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { config } from '../config';

const router = Router();

const stellarAddressField = z
  .string()
  .min(56)
  .max(56)
  .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address');

const nonceSchema = z.object({ walletAddress: stellarAddressField });

const sessionSchema = z.object({
  walletAddress: stellarAddressField,
  nonce: z.string().regex(/^[a-fA-F0-9]{32}$/, 'Invalid nonce format'),
  signature: z
    .string()
    .min(64)
    .max(4096)
    .regex(/^[a-fA-F0-9]+$/, 'Invalid signature format'),
});

const privySessionSchema = z.object({
  privyToken: z.string().min(1),
  walletAddress: stellarAddressField,
});

router.post('/nonce', validateBody(nonceSchema), (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  const nonce = authService.issueNonce(walletAddress);
  const message = authService.buildMessage(walletAddress, nonce);
  res.json({ nonce, message, expiresIn: 300 });
});

router.post('/session', validateBody(sessionSchema), (req: Request, res: Response) => {
  const { walletAddress, nonce, signature } = req.body;
  const valid = authService.verifySignature(walletAddress, nonce, signature);
  if (!valid) {
    return res.status(401).json({
      error: 'Invalid or expired signature. Request a new nonce from POST /api/auth/nonce',
    });
  }
  res.json(authService.issueSessionToken(walletAddress));
});

/**
 * POST /api/auth/privy-session
 * Exchange a Privy access token for a short-lived bearer session token.
 * Skips nonce signing — identity is proved by the Privy JWT.
 */
router.post('/privy-session', validateBody(privySessionSchema), (req: Request, res: Response) => {
  const { privyToken, walletAddress } = req.body;

  if (!config.privyAppId) {
    return res.status(503).json({ error: 'Privy auth is not configured on this server' });
  }

  const parsed = authService.parsePrivyToken(privyToken, config.privyAppId);
  if (!parsed) {
    return res.status(401).json({ error: 'Invalid or expired Privy token' });
  }

  res.json(authService.issueSessionToken(walletAddress));
});

export default router;
