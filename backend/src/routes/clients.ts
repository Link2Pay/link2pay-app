import { Router, Request, Response } from 'express';
import { clientService } from '../services/clientService';
import {
  requireWallet,
  saveClientSchema,
  updateClientFavoriteSchema,
  validateBody,
} from '../middleware/validation';
import { log } from '../utils/logger';

const router = Router();

/**
 * GET /api/clients
 * List saved clients for authenticated wallet
 */
router.get('/', requireWallet, async (req: Request, res: Response) => {
  try {
    const walletAddress = req.walletAddress as string;
    const clients = await clientService.listClients(walletAddress);
    res.json(clients);
  } catch (error: any) {
    log.error('List clients error', { error: error?.message });
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

/**
 * POST /api/clients
 * Save or update a client for authenticated wallet
 */
router.post(
  '/',
  requireWallet,
  validateBody(saveClientSchema),
  async (req: Request, res: Response) => {
    try {
      const walletAddress = req.walletAddress as string;
      const client = await clientService.upsertClient(walletAddress, req.body);
      res.status(201).json(client);
    } catch (error: any) {
      log.error('Save client error', { error: error?.message });
      res.status(500).json({ error: 'Failed to save client' });
    }
  }
);

/**
 * PATCH /api/clients/:id/favorite
 * Update favorite state for a saved client
 */
router.patch(
  '/:id/favorite',
  requireWallet,
  validateBody(updateClientFavoriteSchema),
  async (req: Request, res: Response) => {
    try {
      const walletAddress = req.walletAddress as string;
      const updated = await clientService.updateFavorite(
        req.params.id,
        walletAddress,
        req.body.isFavorite
      );
      res.json(updated);
    } catch (error: any) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({ error: error.message });
      }
      log.error('Update favorite client error', { error: error?.message });
      res.status(500).json({ error: 'Failed to update client' });
    }
  }
);

export default router;
