import * as StellarSdk from '@stellar/stellar-sdk';
import crypto from 'crypto';

// ─── In-memory nonce store ────────────────────────────────────────────────────
// Maps walletAddress → { nonce, expiresAt }
// In production with multiple server instances, replace with Redis.

interface NonceEntry {
  nonce: string;
  expiresAt: number; // unix ms
}

interface SessionEntry {
  walletAddress: string;
  expiresAt: number; // unix ms
}

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Cleanup interval: remove expired nonces every minute
const nonceStore = new Map<string, NonceEntry>();
const sessionStore = new Map<string, SessionEntry>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of nonceStore.entries()) {
    if (entry.expiresAt < now) nonceStore.delete(key);
  }
  for (const [key, entry] of sessionStore.entries()) {
    if (entry.expiresAt < now) sessionStore.delete(key);
  }
}, 60_000);

// ─── AuthService ─────────────────────────────────────────────────────────────

export class AuthService {
  /**
   * Issue a fresh nonce for the given wallet address.
   * The frontend must include this nonce in the message it signs.
   */
  issueNonce(walletAddress: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    nonceStore.set(walletAddress, {
      nonce,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });
    return nonce;
  }

  /**
   * Verify a Stellar keypair signature over the canonical message:
   *   "link2pay-auth:{walletAddress}:{nonce}"
   *
   * Returns true only if:
   *  1. A valid nonce was previously issued for this wallet
   *  2. The nonce has not expired
   *  3. The ed25519 signature is valid for the message and public key
   *
   * Supports two signing methods:
   *  - Freighter v5+ signMessage: signs the raw UTF-8 bytes of the message
   *  - Freighter v2 signBlob: receives base64(message) and signs those bytes
   *    (i.e. the base64 string's UTF-8 representation)
   *
   * The nonce is consumed on success to prevent replay attacks.
   */
  verifySignature(
    walletAddress: string,
    nonce: string,
    signatureHex: string
  ): boolean {
    const entry = nonceStore.get(walletAddress);

    if (!entry) return false;
    if (entry.nonce !== nonce) return false;
    if (Date.now() > entry.expiresAt) {
      nonceStore.delete(walletAddress);
      return false;
    }

    const message = this.buildMessage(walletAddress, nonce);

    try {
      const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);
      const signatureBuffer = Buffer.from(signatureHex, 'hex');

      // Attempt 1: raw UTF-8 message (Freighter v5+ signMessage)
      const valid = keypair.verify(Buffer.from(message, 'utf8'), signatureBuffer);
      if (valid) {
        nonceStore.delete(walletAddress);
        return true;
      }

      // Attempt 2: base64-encoded message (Freighter v2 signBlob)
      const messageBase64 = Buffer.from(message, 'utf8').toString('base64');
      const validBlob = keypair.verify(Buffer.from(messageBase64, 'utf8'), signatureBuffer);
      if (validBlob) {
        nonceStore.delete(walletAddress);
        return true;
      }

      // Attempt 3: SHA-256(message) — Privy signRawHash signs a hash, not raw bytes
      const sha256Msg = crypto.createHash('sha256').update(Buffer.from(message, 'utf8')).digest();
      const validSha256 = keypair.verify(sha256Msg, signatureBuffer);
      if (validSha256) {
        nonceStore.delete(walletAddress);
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * The canonical message the frontend must sign.
   * Exposed so the frontend can construct the exact same string.
   */
  buildMessage(walletAddress: string, nonce: string): string {
    return `link2pay-auth:${walletAddress}:${nonce}`;
  }

  /**
   * Decode a Privy access token and verify basic claims (iss, aud, exp).
   * Does NOT verify the JWT cryptographic signature — acceptable for hackathon use.
   * For production, verify against Privy's JWKS at
   * https://auth.privy.io/api/v1/apps/{appId}/public-key
   */
  parsePrivyToken(token: string, appId: string): { sub: string; exp: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      if (payload.iss !== 'privy.io') return null;
      const aud: string[] = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(appId)) return null;
      if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
      if (!payload.sub) return null;

      return { sub: payload.sub, exp: payload.exp };
    } catch {
      return null;
    }
  }

  /**
   * Issue a short-lived bearer token after successful wallet signature auth.
   */
  issueSessionToken(walletAddress: string): { sessionToken: string; expiresIn: number } {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessionStore.set(sessionToken, {
      walletAddress,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return {
      sessionToken,
      expiresIn: Math.floor(SESSION_TTL_MS / 1000),
    };
  }

  /**
   * Validate bearer token and return the associated wallet if valid.
   */
  verifySessionToken(sessionToken: string): string | null {
    const entry = sessionStore.get(sessionToken);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      sessionStore.delete(sessionToken);
      return null;
    }
    return entry.walletAddress;
  }
}

export const authService = new AuthService();
