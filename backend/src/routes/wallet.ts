import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { stellarService } from '../services/stellarService';
import { log } from '../utils/logger';

const router = Router();

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

const balancesLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { error: 'Too many balance requests' },
});

/**
 * GET /api/wallet/:publicKey/balances
 * Read-only account balances for a Stellar address (Freighter, Privy
 * embedded wallet, etc). No auth required — this is public ledger data.
 */
router.get('/:publicKey/balances', balancesLimiter, async (req: Request, res: Response) => {
  const { publicKey } = req.params;
  if (!STELLAR_ADDRESS_RE.test(publicKey)) {
    return res.status(400).json({ error: 'Invalid Stellar address' });
  }

  const networkPassphrase =
    typeof req.query.networkPassphrase === 'string' ? req.query.networkPassphrase : undefined;

  try {
    const balances = await stellarService.getBalances(publicKey, networkPassphrase);
    res.json({ publicKey, balances });
  } catch (error: any) {
    if (error?.message === 'ACCOUNT_NOT_FOUND') {
      // Unfunded/not-yet-activated account — zero balance, not an error.
      return res.json({ publicKey, balances: [] });
    }
    log.error('Get wallet balances error', { publicKey, error: error?.message });
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

export default router;
