import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { FundingLink } from '@prisma/client';
import prisma from '../db';
import {
  activateFundingLinkSchema,
  createFundingLinkSchema,
  requireWallet,
  sweepFundingLinkSchema,
  validateBody,
} from '../middleware/validation';
import { resolveSweepStatus, serverFor, verifyEscrowFunded } from '../services/fundingLinkService';
import { log } from '../utils/logger';

const router = Router();

// Abandoned pre-registrations (browser closed before the escrow tx was
// submitted) are deleted on the owner's next list read after this window.
const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

const createFundingLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.walletAddress || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Funding link creation limit reached. Maximum 30 links per hour per wallet.' },
});

function toView(link: FundingLink) {
  return {
    id: link.id,
    status: link.status,
    asset: link.asset,
    amount: link.amount.toString(),
    escrowAccount: link.escrowAccount,
    networkPassphrase: link.networkPassphrase,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    claimedBy: link.claimedBy,
    claimTxHash: link.claimTxHash,
    createdAt: link.createdAt.toISOString(),
  };
}

/** Horizon-verified sweep reconciliation; returns the (possibly updated) link. */
async function reconcile(link: FundingLink): Promise<FundingLink> {
  if (link.status !== 'ACTIVE' && link.status !== 'PENDING') return link;
  const sweep = await resolveSweepStatus(serverFor(link.networkPassphrase), link);
  if (!sweep) return link;
  return prisma.fundingLink.update({
    where: { id: link.id },
    data: { status: sweep.status, claimedBy: sweep.claimedBy, claimTxHash: sweep.claimTxHash },
  });
}

/**
 * POST /api/funding-links
 * Pre-register a link as PENDING before the escrow transaction is submitted,
 * so a mid-flight crash never orphans a link from the dashboard.
 */
router.post(
  '/',
  requireWallet,
  createFundingLinkLimiter,
  validateBody(createFundingLinkSchema),
  async (req: Request, res: Response) => {
    try {
      const { asset, amount, escrowAccount, networkPassphrase, expiresAt } = req.body;
      const expiry = expiresAt ? new Date(expiresAt) : null;
      if (expiry && expiry.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'expiresAt must be in the future' });
      }
      const link = await prisma.fundingLink.create({
        data: {
          creatorWallet: req.walletAddress as string,
          escrowAccount,
          asset,
          amount,
          networkPassphrase,
          expiresAt: expiry,
        },
      });
      res.status(201).json({ id: link.id });
    } catch (error: any) {
      log.error('Create funding link error', { error: error?.message });
      res.status(500).json({ error: 'Failed to create funding link' });
    }
  }
);

/**
 * PATCH /api/funding-links/:id/activate
 * Owner reports the escrow-creation tx. Only Horizon is trusted: the link
 * activates when the escrow account actually holds the funds.
 */
router.patch(
  '/:id/activate',
  requireWallet,
  validateBody(activateFundingLinkSchema),
  async (req: Request, res: Response) => {
    try {
      const link = await prisma.fundingLink.findUnique({ where: { id: req.params.id } });
      if (!link || link.creatorWallet !== req.walletAddress) {
        return res.status(404).json({ error: 'Funding link not found' });
      }
      if (link.status !== 'PENDING') return res.json(toView(link));
      const funded = await verifyEscrowFunded(serverFor(link.networkPassphrase), {
        escrowAccount: link.escrowAccount,
        asset: link.asset as 'XLM' | 'USDC',
        amount: link.amount.toString(),
        networkPassphrase: link.networkPassphrase,
      });
      if (!funded) {
        return res.status(409).json({ error: 'Escrow account is not funded yet' });
      }
      const updated = await prisma.fundingLink.update({
        where: { id: link.id },
        data: { status: 'ACTIVE', creationTxHash: req.body.creationTxHash },
      });
      res.json(toView(updated));
    } catch (error: any) {
      log.error('Activate funding link error', { linkId: req.params.id, error: error?.message });
      res.status(500).json({ error: 'Failed to activate funding link' });
    }
  }
);

/**
 * GET /api/funding-links
 * Owner's list. Self-heals: PENDING rows whose escrow is actually funded flip
 * to ACTIVE (activate PATCH lost), stale unfunded PENDING rows are deleted,
 * and swept escrows are reconciled to CLAIMED/RECLAIMED.
 */
router.get('/', requireWallet, async (req: Request, res: Response) => {
  try {
    const rows = await prisma.fundingLink.findMany({
      where: { creatorWallet: req.walletAddress as string },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const links: FundingLink[] = [];
    for (const row of rows) {
      let link = row;
      if (link.status === 'PENDING') {
        const funded = await verifyEscrowFunded(serverFor(link.networkPassphrase), {
          escrowAccount: link.escrowAccount,
          asset: link.asset as 'XLM' | 'USDC',
          amount: link.amount.toString(),
          networkPassphrase: link.networkPassphrase,
        });
        if (funded) {
          link = await prisma.fundingLink.update({ where: { id: link.id }, data: { status: 'ACTIVE' } });
        } else if (Date.now() - link.createdAt.getTime() > STALE_PENDING_MS) {
          await prisma.fundingLink.delete({ where: { id: link.id } });
          continue;
        }
      }
      links.push(await reconcile(link));
    }
    res.json({ links: links.map(toView) });
  } catch (error: any) {
    log.error('List funding links error', { error: error?.message });
    res.status(500).json({ error: 'Failed to list funding links' });
  }
});

/**
 * GET /api/funding-links/:id
 * Public claim-page metadata. No creator PII beyond what the chain shows.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const link = await prisma.fundingLink.findUnique({ where: { id: req.params.id } });
    if (!link) return res.status(404).json({ error: 'Funding link not found' });
    res.json(toView(await reconcile(link)));
  } catch (error: any) {
    log.error('Get funding link error', { linkId: req.params.id, error: error?.message });
    res.status(500).json({ error: 'Failed to fetch funding link' });
  }
});

/**
 * POST /api/funding-links/:id/claimed — public claim report.
 * POST /api/funding-links/:id/reclaimed — owner reclaim report.
 * Both ignore the client's word and re-derive the outcome from Horizon.
 */
router.post('/:id/claimed', validateBody(sweepFundingLinkSchema), async (req: Request, res: Response) => {
  try {
    const link = await prisma.fundingLink.findUnique({ where: { id: req.params.id } });
    if (!link) return res.status(404).json({ error: 'Funding link not found' });
    res.json(toView(await reconcile(link)));
  } catch (error: any) {
    log.error('Report funding link claim error', { linkId: req.params.id, error: error?.message });
    res.status(500).json({ error: 'Failed to update funding link' });
  }
});

router.post(
  '/:id/reclaimed',
  requireWallet,
  validateBody(sweepFundingLinkSchema),
  async (req: Request, res: Response) => {
    try {
      const link = await prisma.fundingLink.findUnique({ where: { id: req.params.id } });
      if (!link || link.creatorWallet !== req.walletAddress) {
        return res.status(404).json({ error: 'Funding link not found' });
      }
      res.json(toView(await reconcile(link)));
    } catch (error: any) {
      log.error('Report funding link reclaim error', { linkId: req.params.id, error: error?.message });
      res.status(500).json({ error: 'Failed to update funding link' });
    }
  }
);

export default router;
