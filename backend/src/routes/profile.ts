import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { profileService } from '../services/profileService';
import { requireWallet, saveProfileSchema, validateBody } from '../middleware/validation';
import { requireKycForBrebKeyChange } from '../middleware/requireKyc';
import { scanSessionService } from '../services/scanSessionService';
import { log } from '../utils/logger';

const router = Router();

/**
 * GET /api/profile
 * Return the business profile for the authenticated wallet (or null).
 */
router.get('/', requireWallet, async (req: Request, res: Response) => {
  try {
    const walletAddress = req.walletAddress as string;
    const profile = await profileService.getProfile(walletAddress);
    res.json(profile);
  } catch (error: any) {
    log.error('Get profile error', { error: error?.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profile
 * Create or update the business profile for the authenticated wallet.
 */
router.put(
  '/',
  requireWallet,
  validateBody(saveProfileSchema),
  requireKycForBrebKeyChange,
  async (req: Request, res: Response) => {
    try {
      const walletAddress = req.walletAddress as string;
      const profile = await profileService.upsertProfile(walletAddress, req.body);
      res.json(profile);
    } catch (error: any) {
      log.error('Save profile error', { error: error?.message });
      res.status(500).json({ error: 'Failed to save profile' });
    }
  }
);

// ─── Scan-session handoff ("continue on phone" for the Bre-B QR scan) ────
// Desktop (authenticated) mints a token; the phone posts the scanned llave
// anonymously — the 256-bit single-use token is the credential; desktop
// polls and receives the llave exactly once. The value only fills an input:
// saving still goes through PUT /profile and its KYC guard.

const scanResultLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan attempts, please try again later' },
});

const scanResultSchema = z.object({
  llave: z.string().trim().min(1).max(200),
});

router.post('/scan-session', requireWallet, (req: Request, res: Response) => {
  const walletAddress = req.walletAddress as string;
  res.status(201).json(scanSessionService.create(walletAddress));
});

router.get('/scan-session/:token', requireWallet, (req: Request, res: Response) => {
  const walletAddress = req.walletAddress as string;
  const result = scanSessionService.take(req.params.token, walletAddress);
  if (result.status === 'gone') return res.status(404).json(result);
  return res.json(result);
});

router.post(
  '/scan-session/:token/result',
  scanResultLimiter,
  validateBody(scanResultSchema),
  (req: Request, res: Response) => {
    const outcome = scanSessionService.submitResult(req.params.token, req.body.llave);
    if (outcome === 'ok') return res.status(204).end();
    if (outcome === 'already_set') return res.status(409).json({ error: 'Result already submitted' });
    return res.status(404).json({ error: 'Scan session not found or expired' });
  }
);

export default router;
