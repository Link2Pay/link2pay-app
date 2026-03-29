import express from 'express';
import { z } from 'zod';
import { authenticateWallet } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { privacyPoolService } from '../services/privacy/privacyPoolService';
import { prisma } from '../services/prismaClient';

const router = express.Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const generateProofSchema = z.object({
  body: z.object({
    invoiceId: z.string().cuid(),
    secret: z.string().regex(/^\d+$/),
    nullifier: z.string().regex(/^\d+$/),
    paymentAmount: z.string().regex(/^\d+(\.\d+)?$/),
    serviceAddress: z.string().regex(/^G[A-Z0-9]{55}$/),
  }),
});

const getMerkleProofSchema = z.object({
  params: z.object({
    leafIndex: z.string().regex(/^\d+$/).transform(Number),
  }),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/privacy/generate-proof
 * Generate zero-knowledge proof for private x402 payment
 */
router.post(
  '/generate-proof',
  authenticateWallet,
  validateRequest(generateProofSchema),
  async (req, res) => {
    try {
      const { invoiceId, secret, nullifier, paymentAmount, serviceAddress } = req.body;
      const wallet = req.wallet!;

      // Verify invoice belongs to user
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          freelancerWallet: wallet,
          isPrivate: true,
        },
        include: {
          privacyDeposit: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          error: 'Invoice not found or not a private invoice',
        });
      }

      if (!invoice.privacyDeposit) {
        return res.status(400).json({
          error: 'No privacy deposit found for this invoice',
        });
      }

      if (invoice.privacyDeposit.status !== 'CONFIRMED') {
        return res.status(400).json({
          error: 'Deposit not yet confirmed',
        });
      }

      // Generate proof
      const result = await privacyPoolService.generatePaymentProof({
        invoiceId,
        secret,
        nullifier,
        paymentAmount,
        serviceAddress,
      });

      res.json({
        proof: result.proof,
        publicSignals: result.publicSignals,
        nullifierHash: result.nullifierHash,
      });
    } catch (error) {
      console.error('Error generating proof:', error);
      res.status(500).json({
        error: 'Failed to generate proof',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/privacy/merkle-proof/:leafIndex
 * Get Merkle proof for commitment at leaf index
 */
router.get(
  '/merkle-proof/:leafIndex',
  validateRequest(getMerkleProofSchema),
  async (req, res) => {
    try {
      const { leafIndex } = req.params;

      const proof = await privacyPoolService.getMerkleProof(Number(leafIndex));

      res.json({
        leafIndex: Number(leafIndex),
        pathElements: proof.pathElements,
        pathIndices: proof.pathIndices,
      });
    } catch (error) {
      console.error('Error getting Merkle proof:', error);
      res.status(500).json({
        error: 'Failed to get Merkle proof',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/privacy/merkle-root
 * Get current Merkle root
 */
router.get('/merkle-root', async (req, res) => {
  try {
    const commitments = await privacyPoolService.getCommitments();
    const root = await privacyPoolService.computeMerkleRoot(commitments);

    res.json({
      root,
      commitmentCount: commitments.length,
    });
  } catch (error) {
    console.error('Error getting Merkle root:', error);
    res.status(500).json({
      error: 'Failed to get Merkle root',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/privacy/score
 * Get privacy score and anonymity metrics
 */
router.get('/score', async (req, res) => {
  try {
    const score = await privacyPoolService.calculatePrivacyScore();

    res.json(score);
  } catch (error) {
    console.error('Error calculating privacy score:', error);
    res.status(500).json({
      error: 'Failed to calculate privacy score',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/privacy/deposits
 * Get user's privacy deposits
 */
router.get('/deposits', authenticateWallet, async (req, res) => {
  try {
    const wallet = req.wallet!;

    const deposits = await prisma.privacyDeposit.findMany({
      where: {
        invoice: {
          freelancerWallet: wallet,
        },
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            currency: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      deposits: deposits.map(d => ({
        id: d.id,
        invoiceId: d.invoiceId,
        invoiceNumber: d.invoice.invoiceNumber,
        amount: d.amount.toString(),
        currency: d.currency,
        commitment: d.commitment,
        leafIndex: d.leafIndex,
        status: d.status,
        depositTxHash: d.depositTxHash,
        withdrawTxHash: d.withdrawTxHash,
        createdAt: d.createdAt,
        withdrawnAt: d.withdrawnAt,
      })),
    });
  } catch (error) {
    console.error('Error getting deposits:', error);
    res.status(500).json({
      error: 'Failed to get deposits',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/privacy/compute-commitment
 * Compute commitment hash (for frontend validation)
 */
router.post('/compute-commitment', async (req, res) => {
  try {
    const { amount, secret, nullifier, recipientWallet } = req.body;

    if (!amount || !secret || !nullifier || !recipientWallet) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const commitment = await privacyPoolService.computeCommitment(
      amount,
      secret,
      nullifier,
      recipientWallet
    );

    res.json({ commitment });
  } catch (error) {
    console.error('Error computing commitment:', error);
    res.status(500).json({
      error: 'Failed to compute commitment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
