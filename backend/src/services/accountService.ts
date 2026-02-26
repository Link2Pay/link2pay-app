import crypto from 'crypto';
import { WalletProvider } from '@prisma/client';
import prisma from '../db';
import { config } from '../config';

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;

type SessionClaims = {
  sub: string;
  iat: number;
  exp: number;
};

type PublicWallet = {
  walletAddress: string;
  provider: WalletProvider;
  providerEmail: string | null;
  isPrimary: boolean;
};

export type PublicUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  wallets: PublicWallet[];
};

export class AccountError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

function toPublicUser(user: {
  id: string;
  email: string | null;
  displayName: string | null;
  wallets: Array<{
    walletAddress: string;
    provider: WalletProvider;
    providerEmail: string | null;
    isPrimary: boolean;
  }>;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    wallets: user.wallets.map((wallet) => ({
      walletAddress: wallet.walletAddress,
      provider: wallet.provider,
      providerEmail: wallet.providerEmail,
      isPrimary: wallet.isPrimary,
    })),
  };
}

export class AccountService {
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString('hex');
    const derived = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
    return `${salt}:${derived}`;
  }

  verifyPassword(password: string, stored: string): boolean {
    const [salt, existingHash] = stored.split(':');
    if (!salt || !existingHash) return false;
    const derived = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
    const a = Buffer.from(derived, 'hex');
    const b = Buffer.from(existingHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  issueToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const claims: SessionClaims = {
      sub: userId,
      iat: now,
      exp: now + config.auth.sessionTtlSeconds,
    };

    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64UrlEncode(JSON.stringify(claims));
    const signature = base64UrlEncode(
      crypto
        .createHmac('sha256', config.auth.tokenSecret)
        .update(`${header}.${payload}`)
        .digest()
    );
    return `${header}.${payload}.${signature}`;
  }

  verifyToken(token: string): SessionClaims | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expected = base64UrlEncode(
      crypto
        .createHmac('sha256', config.auth.tokenSecret)
        .update(`${header}.${payload}`)
        .digest()
    );

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return null;
    }

    try {
      const claims = JSON.parse(base64UrlDecode(payload)) as SessionClaims;
      if (!claims?.sub || typeof claims.exp !== 'number') return null;
      if (Math.floor(Date.now() / 1000) >= claims.exp) return null;
      return claims;
    } catch {
      return null;
    }
  }

  readBearerToken(authorization?: string): string | null {
    if (!authorization) return null;
    const [scheme, token] = authorization.split(' ');
    if (!scheme || !token) return null;
    if (scheme.toLowerCase() !== 'bearer') return null;
    return token;
  }

  async getUserById(userId: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!user) return null;
    return toPublicUser(user);
  }

  async getUserByEmail(email: string): Promise<{
    id: string;
    email: string | null;
    passwordHash: string | null;
    displayName: string | null;
    wallets: PublicWallet[];
  } | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;

    const user = await prisma.user.findUnique({
      where: { email: normalized },
      include: {
        wallets: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      wallets: user.wallets.map((wallet) => ({
        walletAddress: wallet.walletAddress,
        provider: wallet.provider,
        providerEmail: wallet.providerEmail,
        isPrimary: wallet.isPrimary,
      })),
    };
  }

  async resolveWalletForUser(
    userId: string,
    preferredWallet?: string | null
  ): Promise<string | null> {
    const wallets = await prisma.userWallet.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: { walletAddress: true },
    });

    if (wallets.length === 0) return null;

    if (preferredWallet) {
      const matched = wallets.find((wallet) => wallet.walletAddress === preferredWallet);
      if (!matched) return null;
      return matched.walletAddress;
    }

    return wallets[0].walletAddress;
  }

  async createUser(params: {
    email?: string | null;
    passwordHash?: string | null;
    displayName?: string | null;
  }): Promise<PublicUser> {
    const created = await prisma.user.create({
      data: {
        email: normalizeEmail(params.email),
        passwordHash: params.passwordHash || null,
        displayName: params.displayName?.trim() || null,
      },
      include: {
        wallets: true,
      },
    });
    return toPublicUser(created);
  }

  async linkWallet(params: {
    userId: string;
    walletAddress: string;
    provider: WalletProvider;
    providerEmail?: string | null;
    makePrimary?: boolean;
  }): Promise<PublicUser> {
    const { userId, walletAddress, provider, providerEmail, makePrimary } = params;

    const existingWallet = await prisma.userWallet.findUnique({
      where: { walletAddress },
      select: { userId: true },
    });
    if (existingWallet && existingWallet.userId !== userId) {
      throw new AccountError('Wallet is already linked to another account', 409);
    }

    await prisma.$transaction(async (tx) => {
      const hasAnyWallet = await tx.userWallet.count({ where: { userId } });
      const shouldBePrimary = makePrimary || hasAnyWallet === 0;

      if (shouldBePrimary) {
        await tx.userWallet.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      await tx.userWallet.upsert({
        where: { walletAddress },
        update: {
          provider,
          providerEmail: normalizeEmail(providerEmail),
          isPrimary: shouldBePrimary,
        },
        create: {
          userId,
          walletAddress,
          provider,
          providerEmail: normalizeEmail(providerEmail),
          isPrimary: shouldBePrimary,
        },
      });
    });

    const user = await this.getUserById(userId);
    if (!user) {
      throw new AccountError('Account not found', 404);
    }
    return user;
  }

  async touchLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async setPassword(params: {
    userId: string;
    newPassword: string;
    currentPassword?: string;
    email?: string | null;
  }): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });
    if (!user) {
      throw new AccountError('Account not found', 404);
    }

    if (user.passwordHash) {
      if (!params.currentPassword) {
        throw new AccountError('Current password is required', 400);
      }
      if (!this.verifyPassword(params.currentPassword, user.passwordHash)) {
        throw new AccountError('Current password is invalid', 401);
      }
    }

    const normalizedEmail = normalizeEmail(params.email);
    if (normalizedEmail) {
      const collision = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (collision && collision.id !== params.userId) {
        throw new AccountError('Email is already used by another account', 409);
      }
    }

    await prisma.user.update({
      where: { id: params.userId },
      data: {
        passwordHash: this.hashPassword(params.newPassword),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
    });

    const updated = await this.getUserById(params.userId);
    if (!updated) {
      throw new AccountError('Account not found', 404);
    }
    return updated;
  }
}

export const accountService = new AccountService();
