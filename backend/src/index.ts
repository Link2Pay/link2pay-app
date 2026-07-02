import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import invoiceRoutes from './routes/invoices';
import linkRoutes from './routes/links';
import paymentRoutes from './routes/payments';
import clientRoutes from './routes/clients';
import profileRoutes from './routes/profile';
import authRoutes from './routes/auth';
import priceRoutes from './routes/prices';
import offrampRoutes from './routes/offramp';
import kycRoutes from './routes/kyc';
import walletRoutes from './routes/wallet';
import waitlistRoutes from './routes/waitlist';
import { watcherService } from './services/watcherService';

const app = express();

// Render and similar platforms run behind a reverse proxy.
// Trust the first proxy hop so rate-limits and logs use the real client IP.
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

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
        frameSrc: ["'self'", 'https://anchor-ref-ui-testanchor.stellar.org', `https://${config.anchor.homeDomain}`],
        childSrc: ["'self'", 'https://anchor-ref-ui-testanchor.stellar.org', `https://${config.anchor.homeDomain}`],
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
// Production locks CORS to the configured FRONTEND_URL. In development we allow
// any localhost / 127.0.0.1 origin regardless of port, because the Vite dev
// server frequently auto-bumps its port (5173 -> 5174 -> 5180 ...) and chasing
// it via env every time is brittle.
const localhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOrigin: CorsOptions['origin'] =
  config.nodeEnv === 'production'
    ? [config.frontendUrl]
    : (origin, callback) => {
        if (!origin || origin === config.frontendUrl || localhostOrigin.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin}`));
        }
      };

app.use(
  cors({
    origin: corsOrigin,
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
// Capture the raw body so signed webhooks (e.g. KYC provider callbacks) can be
// verified via HMAC over the exact bytes received.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
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

// Payment link routes (pivot-friendly API aliases)
app.use('/api/links', linkRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Saved client routes
app.use('/api/clients', clientRoutes);

// Business profile routes
app.use('/api/profile', profileRoutes);

// Merchant KYC routes (seller onboarding gate for fiat off-ramp)
app.use('/api/kyc', kycRoutes);

// Off-ramp routes (Bre-B)
app.use('/api/invoices', offrampRoutes);

// Wallet routes (read-only balance lookups)
app.use('/api/wallet', walletRoutes);

// Waitlist for coming-soon fiat rails (Pix / Transferência 3.0)
app.use('/api/waitlist', waitlistRoutes);

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
