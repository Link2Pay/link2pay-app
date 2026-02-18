import { Router, Request, Response } from 'express';
import { clientService } from '../services/clientService';
import {
  requireWallet,
  saveClientSchema,
  updateClientFavoriteSchema,
  validateBody,
} from '../middleware/validation';

const router = Router();

/**
 * GET /api/clients
 * List saved clients for authenticated wallet
 */
router.get('/', requireWallet, async (req: Request, res: Response) => {
  try {
    const walletAddress = (req as any).walletAddress;
    const clients = await clientService.listClients(walletAddress);
    res.json(clients);
  } catch (error: any) {
    console.error('List clients error:', error);
    res.status(500).json({ error: error.message });
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
      const walletAddress = (req as any).walletAddress;
      const client = await clientService.upsertClient(walletAddress, req.body);
      res.status(201).json(client);
    } catch (error: any) {
      console.error('Save client error:', error);
      res.status(500).json({ error: error.message });
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
      const walletAddress = (req as any).walletAddress;
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
      console.error('Update favorite client error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
