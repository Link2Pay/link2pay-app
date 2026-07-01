import { Router, Request, Response } from 'express';
import { KycStatus } from '@prisma/client';
import { kycService } from '../services/kycService';
import { kycProvider, KycVerificationStatus } from '../kyc';
import { requireWallet } from '../middleware/validation';
import { log } from '../utils/logger';

const router = Router();

/** Provider 3-state → Prisma enum (shared with the webhook path). */
function toEnum(s: KycVerificationStatus): KycStatus {
  if (s === 'VERIFIED') return KycStatus.VERIFIED;
  if (s === 'REJECTED') return KycStatus.REJECTED;
  return KycStatus.PENDING;
}

/**
 * GET /api/kyc/status
 * Current merchant verification status for the authenticated wallet.
 */
router.get('/status', requireWallet, async (req: Request, res: Response) => {
  try {
    const view = await kycService.getStatus(req.walletAddress as string);
    res.json(view);
  } catch (error: any) {
    log.error('KYC status error', { error: error?.message });
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

/**
 * POST /api/kyc/start
 * Begin (or resume) a verification session. Returns the hosted verification
 * URL (real providers) or the mock sentinel for the inline simulated flow.
 */
router.post('/start', requireWallet, async (req: Request, res: Response) => {
  try {
    const result = await kycService.startKyc(req.walletAddress as string);
    res.json(result);
  } catch (error: any) {
    log.error('KYC start error', { error: error?.message });
    res.status(500).json({ error: 'Failed to start verification' });
  }
});

/**
 * POST /api/kyc/mock/complete
 * Mock-provider only: one-click approve/decline that drives the demo. Rejected
 * with 400 when a real provider is active (the service guards this).
 * Body: { approve?: boolean } — defaults to approve.
 */
router.post('/mock/complete', requireWallet, async (req: Request, res: Response) => {
  try {
    const approve = req.body?.approve !== false;
    const view = await kycService.completeMock(req.walletAddress as string, approve);
    res.json(view);
  } catch (error: any) {
    if (String(error?.message).startsWith('MOCK_COMPLETE_DISABLED')) {
      return res.status(400).json({ error: 'Mock completion is disabled for the active provider' });
    }
    log.error('KYC mock complete error', { error: error?.message });
    res.status(500).json({ error: 'Failed to complete verification' });
  }
});

/**
 * POST /api/kyc/webhook
 * Provider callback (real providers). No wallet auth — authenticated by the
 * provider's signature over the raw request body. Status polling is the primary
 * mechanism, so this is a best-effort accelerator.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!kycProvider.parseWebhook) {
      return res.status(404).json({ error: 'Webhooks not supported by active provider' });
    }
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8')
      ?? JSON.stringify(req.body ?? {});
    const parsed = kycProvider.parseWebhook(rawBody, req.headers);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid webhook' });
    }
    await kycService.applyStatusByRef(parsed.ref, toEnum(parsed.status));
    res.json({ ok: true });
  } catch (error: any) {
    log.error('KYC webhook error', { error: error?.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
