import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { accountService, AccountError } from '../services/accountService';
import { validateBody } from '../middleware/validation';
import prisma from '../db';
import { WalletProvider } from '@prisma/client';

const router = Router();

const walletAddressSchema = z
  .string()
  .min(56)
  .max(56)
  .regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address');

const nonceSchema = z.object({
  walletAddress: walletAddressSchema,
});

const emailSchema = z.string().email();

const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(120).optional(),
  walletAddress: walletAddressSchema.optional(),
  provider: z.nativeEnum(WalletProvider).optional(),
  providerEmail: emailSchema.optional(),
  nonce: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

const walletLoginSchema = z.object({
  walletAddress: walletAddressSchema,
  provider: z.nativeEnum(WalletProvider).default(WalletProvider.FREIGHTER),
  email: emailSchema.optional(),
  displayName: z.string().min(1).max(120).optional(),
  providerEmail: emailSchema.optional(),
  nonce: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
});

const linkWalletSchema = z.object({
  walletAddress: walletAddressSchema,
  provider: z.nativeEnum(WalletProvider).default(WalletProvider.FREIGHTER),
  providerEmail: emailSchema.optional(),
  nonce: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
  makePrimary: z.boolean().optional(),
});

const linkPasswordSchema = z.object({
  password: z.string().min(8).max(128),
  currentPassword: z.string().min(8).max(128).optional(),
  email: emailSchema.optional(),
});

type SessionPayload = {
  token: string;
  user: NonNullable<Awaited<ReturnType<typeof accountService.getUserById>>>;
  activeWallet: string | null;
};

function getSessionUserId(req: Request): string | null {
  const token = accountService.readBearerToken(req.headers.authorization as string | undefined);
  if (!token) return null;
  const claims = accountService.verifyToken(token);
  return claims?.sub || null;
}

async function buildSessionPayload(userId: string): Promise<SessionPayload> {
  const user = await accountService.getUserById(userId);
  if (!user) {
    throw new AccountError('Account not found', 404);
  }
  const activeWallet = await accountService.resolveWalletForUser(userId);
  return {
    token: accountService.issueToken(userId),
    user,
    activeWallet,
  };
}

/**
 * POST /api/auth/nonce
 * Issue a one-time nonce for wallet signature authentication.
 *
 * Flow:
 *  1. Frontend requests a nonce for its wallet address
 *  2. Backend returns nonce + the message template to sign
 *  3. Frontend signs the message with Freighter
 *  4. Frontend includes wallet + nonce + signature in subsequent requests
 */
router.post(
  '/nonce',
  validateBody(nonceSchema),
  (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    const nonce = authService.issueNonce(walletAddress);
    const message = authService.buildMessage(walletAddress, nonce);

    res.json({
      nonce,
      message,
      expiresIn: 300, // seconds
    });
  }
);

router.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        displayName,
        walletAddress,
        provider,
        providerEmail,
        nonce,
        signature,
      } = req.body;

      const existing = await accountService.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email is already registered' });
      }

      const walletProvider = provider || WalletProvider.FREIGHTER;
      if (walletAddress && walletProvider === WalletProvider.FREIGHTER) {
        if (!nonce || !signature) {
          return res.status(400).json({
            error: 'Nonce and signature are required to link a Freighter wallet',
          });
        }
        const valid = authService.verifySignature(walletAddress, nonce, signature);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid or expired wallet signature' });
        }
      }

      if (walletAddress && walletProvider === WalletProvider.ACCESLY && !providerEmail && !email) {
        return res.status(400).json({
          error: 'Provider email is required when linking an Accesly wallet',
        });
      }

      const createdUser = await accountService.createUser({
        email,
        passwordHash: accountService.hashPassword(password),
        displayName,
      });

      if (walletAddress) {
        await accountService.linkWallet({
          userId: createdUser.id,
          walletAddress,
          provider: walletProvider,
          providerEmail: providerEmail || email,
          makePrimary: true,
        });
      }

      await accountService.touchLastLogin(createdUser.id);
      const session = await buildSessionPayload(createdUser.id);

      res.status(201).json(session);
    } catch (error: any) {
      if (error instanceof AccountError) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: error?.message || 'Failed to register account' });
    }
  }
);

router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await accountService.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = accountService.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await accountService.touchLastLogin(user.id);
    const session = await buildSessionPayload(user.id);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to login' });
  }
});

router.post(
  '/wallet-login',
  validateBody(walletLoginSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        walletAddress,
        provider,
        email,
        displayName,
        providerEmail,
        nonce,
        signature,
      } = req.body;

      if (provider === WalletProvider.FREIGHTER) {
        if (!nonce || !signature) {
          return res.status(400).json({
            error: 'Nonce and signature are required for Freighter wallet login',
          });
        }
        const valid = authService.verifySignature(walletAddress, nonce, signature);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid or expired wallet signature' });
        }
      }

      if (provider === WalletProvider.ACCESLY && !email && !providerEmail) {
        return res.status(400).json({ error: 'Email is required for Accesly login' });
      }

      const existingWallet = await prisma.userWallet.findUnique({
        where: { walletAddress },
        include: {
          user: true,
        },
      });

      let userId: string;
      if (existingWallet) {
        userId = existingWallet.userId;

        // Keep provider metadata fresh for linked wallet.
        await prisma.userWallet.update({
          where: { walletAddress },
          data: {
            provider,
            providerEmail: providerEmail || email || null,
          },
        });

        if (email && !existingWallet.user.email) {
          const normalized = email.toLowerCase();
          const collision = await prisma.user.findUnique({
            where: { email: normalized },
            select: { id: true },
          });
          if (!collision || collision.id === existingWallet.userId) {
            await prisma.user.update({
              where: { id: existingWallet.userId },
              data: { email: normalized },
            });
          }
        }
      } else {
        const userByEmail = email ? await accountService.getUserByEmail(email) : null;

        const targetUserId = userByEmail
          ? userByEmail.id
          : (
              await accountService.createUser({
                email: email || null,
                displayName,
              })
            ).id;

        const hasLinkedWallets = userByEmail ? userByEmail.wallets.length > 0 : false;

        await accountService.linkWallet({
          userId: targetUserId,
          walletAddress,
          provider,
          providerEmail: providerEmail || email,
          makePrimary: !hasLinkedWallets,
        });
        userId = targetUserId;
      }

      await accountService.touchLastLogin(userId);
      const session = await buildSessionPayload(userId);
      res.json(session);
    } catch (error: any) {
      if (error instanceof AccountError) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: error?.message || 'Failed to login with wallet' });
    }
  }
);

router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await accountService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Session is invalid' });
    }

    const activeWallet = await accountService.resolveWalletForUser(userId);
    res.json({ user, activeWallet });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch account' });
  }
});

router.post(
  '/link-wallet',
  validateBody(linkWalletSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { walletAddress, provider, providerEmail, nonce, signature, makePrimary } = req.body;

      if (provider === WalletProvider.FREIGHTER) {
        if (!nonce || !signature) {
          return res.status(400).json({
            error: 'Nonce and signature are required to link a Freighter wallet',
          });
        }
        const valid = authService.verifySignature(walletAddress, nonce, signature);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid or expired wallet signature' });
        }
      }

      if (provider === WalletProvider.ACCESLY && !providerEmail) {
        return res.status(400).json({
          error: 'Provider email is required to link an Accesly wallet',
        });
      }

      const user = await accountService.linkWallet({
        userId,
        walletAddress,
        provider,
        providerEmail,
        makePrimary,
      });
      const activeWallet = await accountService.resolveWalletForUser(userId);
      res.json({ user, activeWallet });
    } catch (error: any) {
      if (error instanceof AccountError) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: error?.message || 'Failed to link wallet' });
    }
  }
);

router.post(
  '/link-password',
  validateBody(linkPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { password, currentPassword, email } = req.body;
      const user = await accountService.setPassword({
        userId,
        newPassword: password,
        currentPassword,
        email,
      });
      res.json({ user });
    } catch (error: any) {
      if (error instanceof AccountError) {
        return res.status(error.status).json({ error: error.message });
      }
      res.status(500).json({ error: error?.message || 'Failed to link password login' });
    }
  }
);

export default router;
