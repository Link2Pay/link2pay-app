import { Router, Request, Response } from 'express';
import { profileService } from '../services/profileService';
import { requireWallet, saveProfileSchema, validateBody } from '../middleware/validation';
import { requireKycForBrebKeyChange } from '../middleware/requireKyc';
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

export default router;
