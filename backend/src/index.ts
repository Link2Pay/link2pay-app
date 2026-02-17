import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import invoiceRoutes from './routes/invoices';
import paymentRoutes from './routes/payments';
import { watcherService } from './services/watcherService';

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-wallet-address', 'Authorization'],
    credentials: true,
  })
);

// ─── Rate Limiting ──────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const payIntentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: { error: 'Too many pay intent requests' },
});

app.use('/api/', generalLimiter);
app.use('/api/payments/*/pay-intent', payIntentLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ─────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: config.stellar.network,
    version: '1.0.0',
  });
});

// Invoice routes
app.use('/api/invoices', invoiceRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// ─── Error Handling ─────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: config.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message,
    });
  }
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start Server ───────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║          StellarPay Backend API v1.0.0           ║
╠══════════════════════════════════════════════════╣
║  Server:    http://localhost:${config.port}              ║
║  Network:   ${config.stellar.network.padEnd(36)}║
║  Horizon:   ${config.stellar.horizonUrl.substring(0, 36).padEnd(36)}║
║  Env:       ${config.nodeEnv.padEnd(36)}║
╚══════════════════════════════════════════════════╝
  `);

  // Start the payment watcher
  if (config.nodeEnv !== 'test') {
    watcherService.start().catch((err) => {
      console.error('Failed to start watcher:', err);
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  watcherService.stop();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  watcherService.stop();
  server.close(() => {
    process.exit(0);
  });
});

export default app;
