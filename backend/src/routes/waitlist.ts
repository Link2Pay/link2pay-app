import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { waitlistService } from '../services/waitlistService';
import { validateBody, waitlistSchema } from '../middleware/validation';
import { log } from '../utils/logger';

const router = Router();

// Public, unauthenticated endpoint — key the limit by IP to bound spam.
const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

/**
 * POST /api/waitlist
 * Capture a merchant's interest in a coming-soon fiat rail (Pix / Transferência 3.0).
 */
router.post('/', waitlistLimiter, validateBody(waitlistSchema), async (req: Request, res: Response) => {
  try {
    await waitlistService.add(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    log.error('[Waitlist] failed to save entry', { error: (err as Error).message });
    res.status(500).json({ error: 'Could not join the waitlist. Please try again.' });
  }
});

export default router;
