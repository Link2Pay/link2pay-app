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
        return true;
      }

      // Attempt 2: base64-encoded message (Freighter v2 signBlob)
      const messageBase64 = Buffer.from(message, 'utf8').toString('base64');
      const validBlob = keypair.verify(Buffer.from(messageBase64, 'utf8'), signatureBuffer);
      if (validBlob) {
        return true;
      }

      // Neither Freighter attempt matched — fall through to Attempt 3
    } catch (e) {
      // Not a hex signature — may be an Accesly XDR signature, fall through
    }

    // Attempt 3: Accesly signed XDR (base64-encoded Stellar transaction envelope).
    // Accesly custodial wallets sign a Stellar manageData transaction containing
    // the nonce. The frontend passes the full signed XDR as the signature value.
    try {
      if (this.verifyXdrSignature(walletAddress, nonce, signatureHex)) {
        return true;
      }
    } catch {
      // Not a valid XDR
    }

    return false;
  }

  /**
   * Verifies a Stellar ed25519 transaction signature produced by Accesly.
   *
   * Parses the signed XDR envelope, validates:
   *  1. Source account matches walletAddress
   *  2. Single manageData operation with name 'link2pay-auth' and value = nonce
   *  3. At least one valid ed25519 signature over the transaction hash
   *
   * Tries both testnet and mainnet passphrases.
   */
  private verifyXdrSignature(
    walletAddress: string,
    nonce: string,
    signedXdrBase64: string
  ): boolean {
    const PASSPHRASES = [
      'Test SDF Network ; September 2015',
      'Public Global Stellar Network ; September 2015',
    ];

    for (const passphrase of PASSPHRASES) {
      try {
        const tx = new StellarSdk.Transaction(signedXdrBase64, passphrase);

        if (tx.source !== walletAddress) continue;
        if (tx.operations.length !== 1) continue;

        const op = tx.operations[0] as StellarSdk.Operation.ManageData;
        if (op.type !== 'manageData') continue;
        if (op.name !== 'link2pay-auth') continue;

        // op.value is a Buffer; compare as UTF-8 string to the nonce
        const opNonce = op.value?.toString('utf8') ?? '';
        if (opNonce !== nonce) continue;

        const txHash = tx.hash();
        const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);

        for (const sig of tx.signatures) {
          if (keypair.verify(txHash, sig.signature())) {
            return true;
          }
        }
      } catch {
        // Try the other passphrase or invalid XDR — continue
      }
    }

    return false;
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
