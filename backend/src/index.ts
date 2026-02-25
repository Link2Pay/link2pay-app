import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import invoiceRoutes from './routes/invoices';
import paymentRoutes from './routes/payments';
import clientRoutes from './routes/clients';
import authRoutes from './routes/auth';
import priceRoutes from './routes/prices';
import { watcherService } from './services/watcherService';

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    // Enforce HTTPS — prevents protocol downgrade attacks (HSTS)
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevent MIME-type sniffing
    xContentTypeOptions: true,
    // Deny framing — clickjacking protection
    frameguard: { action: 'deny' },
    // Disable X-Powered-By to avoid fingerprinting
    hidePoweredBy: true,
    // Referrer policy — don't leak origin on cross-origin requests
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Restrict access to browser features
    permittedCrossDomainPolicies: false,
  })
);
app.use(
  cors({
    origin: [
      config.frontendUrl,
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:3000',
      'https://localhost:5173',
      'https://localhost:4173',
      'https://localhost:3000',
      'https://127.0.0.1:5173',
      'https://127.0.0.1:4173',
      'https://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'x-wallet-address',
      'x-auth-nonce',
      'x-auth-signature',
      'Authorization',
    ],
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

// Auth routes (nonce issuance)
app.use('/api/auth', authRoutes);

// Price feed
app.use('/api/prices', priceRoutes);

// Invoice routes
app.use('/api/invoices', invoiceRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Saved client routes
app.use('/api/clients', clientRoutes);

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
║          Link2Pay Backend API v1.0.0             ║
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
