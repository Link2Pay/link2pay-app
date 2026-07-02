import * as StellarSdk from '@stellar/stellar-sdk';
import crypto from 'crypto';
import { log } from '../utils/logger';

// ─── Privy JWKS (ES256 verification key) ──────────────────────────────────────
// Privy signs app access tokens with ES256. Fetch the app's public verification
// keys from its JWKS endpoint and cache them; select by the token's `kid` so key
// rotation is handled by a single forced refetch.
const PRIVY_JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour
let privyJwksCache: { keys: crypto.JsonWebKey[]; fetchedAt: number } | null = null;

async function getPrivyJwks(appId: string, forceRefresh = false): Promise<crypto.JsonWebKey[]> {
  if (!forceRefresh && privyJwksCache && Date.now() - privyJwksCache.fetchedAt < PRIVY_JWKS_TTL_MS) {
    return privyJwksCache.keys;
  }
  const res = await fetch(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`);
  if (!res.ok) throw new Error(`PRIVY_JWKS_FETCH_FAILED_${res.status}`);
  const data = (await res.json()) as { keys?: crypto.JsonWebKey[] };
  privyJwksCache = { keys: data.keys || [], fetchedAt: Date.now() };
  return privyJwksCache.keys;
}

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
   * Verify a Privy access token: ES256 signature against the app's JWKS, plus
   * the iss/aud/exp claims. Returns the Privy user id (`sub`) or null. Fails
   * closed — a token that can't be cryptographically verified is rejected, so a
   * forged token (the app id is public) can no longer mint a session.
   *
   * NOTE: the Stellar wallet is not a token claim, so the caller's walletAddress
   * is still trusted here. Binding the session to the token's user (to stop an
   * authenticated user requesting a session for someone else's wallet) needs the
   * Privy server SDK + app secret to look up the user's linked wallets.
   */
  async verifyPrivyToken(token: string, appId: string): Promise<{ sub: string; exp: number } | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      if (header.alg !== 'ES256') return null;
      if (payload.iss !== 'privy.io') return null;
      const aud: string[] = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(appId)) return null;
      if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
      if (!payload.sub) return null;

      const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
      const signature = Buffer.from(parts[2], 'base64url'); // raw r||s (P-1363)

      const tryVerify = async (forceRefresh: boolean): Promise<boolean> => {
        const keys = await getPrivyJwks(appId, forceRefresh);
        const jwk = header.kid ? keys.find((k) => (k as { kid?: string }).kid === header.kid) : keys[0];
        if (!jwk) return false;
        const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        return crypto.verify('sha256', signingInput, { key: pub, dsaEncoding: 'ieee-p1363' }, signature);
      };

      // Retry once with a forced JWKS refetch to survive key rotation.
      let ok = await tryVerify(false);
      if (!ok) ok = await tryVerify(true);
      if (!ok) return null;

      return { sub: payload.sub, exp: payload.exp };
    } catch (e) {
      log.error('[Auth] Privy token verification failed', { error: (e as Error)?.message });
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
