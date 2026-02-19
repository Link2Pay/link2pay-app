import * as StellarSdk from '@stellar/stellar-sdk';
import crypto from 'crypto';

// ─── In-memory nonce store ────────────────────────────────────────────────────
// Maps walletAddress → { nonce, expiresAt }
// In production with multiple server instances, replace with Redis.

interface NonceEntry {
  nonce: string;
  expiresAt: number; // unix ms
}

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup interval: remove expired nonces every minute
const nonceStore = new Map<string, NonceEntry>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of nonceStore.entries()) {
    if (entry.expiresAt < now) nonceStore.delete(key);
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
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signatureHex, 'hex');
      const valid = keypair.verify(messageBuffer, signatureBuffer);

      if (valid) {
        // Consume the nonce — cannot be reused
        nonceStore.delete(walletAddress);
      }

      return valid;
    } catch {
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
}

export const authService = new AuthService();
