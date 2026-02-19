import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// Cache price for 60 seconds to avoid hammering the external API
let priceCache: { usd: number; updatedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

const priceLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { error: 'Too many price requests' },
});

/**
 * GET /api/prices/xlm
 * Returns current XLM price in USD from CoinGecko (free tier, no key needed).
 * Response is cached for 60 seconds server-side.
 */
router.get('/xlm', priceLimiter, async (_req: Request, res: Response) => {
  try {
    // Return cached price if still fresh
    if (priceCache && Date.now() - priceCache.updatedAt < CACHE_TTL_MS) {
      return res.json({ usd: priceCache.usd, cached: true });
    }

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    const data = await response.json() as { stellar?: { usd?: number } };
    const usd = data?.stellar?.usd;

    if (typeof usd !== 'number') {
      throw new Error('Unexpected price response format');
    }

    priceCache = { usd, updatedAt: Date.now() };
    res.json({ usd, cached: false });
  } catch (error: any) {
    // Return last known price if available, otherwise 503
    if (priceCache) {
      return res.json({ usd: priceCache.usd, cached: true, stale: true });
    }
    res.status(503).json({ error: 'Price feed temporarily unavailable' });
  }
});

export default router;
