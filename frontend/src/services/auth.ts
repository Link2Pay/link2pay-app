import { config } from '../config';

const API_BASE = config.apiUrl + '/api';

// ─── Token cache ──────────────────────────────────────────────────────────────
// Stores the nonce+signature pair so we don't re-sign on every request.
// The token is valid for ~5 minutes (matches backend TTL).

interface AuthToken {
  walletAddress: string;
  nonce: string;
  signature: string;
  expiresAt: number; // ms
}

let cachedToken: AuthToken | null = null;

// Refresh the token 30 seconds before it expires to avoid races
const REFRESH_BUFFER_MS = 30_000;

// In-flight promise: if a nonce fetch+sign is already in progress, share it
// instead of issuing a second nonce that would overwrite the first on the backend.
let inflightPromise: Promise<AuthToken> | null = null;

function isTokenValid(token: AuthToken | null): boolean {
  if (!token) return false;
  return Date.now() < token.expiresAt - REFRESH_BUFFER_MS;
}

/**
 * Obtain a fresh nonce from the backend and sign it with Freighter.
 * The resulting token is cached and reused until close to expiry.
 *
 * Concurrent callers that arrive while a nonce fetch is in progress will
 * share the same promise — preventing race conditions where two simultaneous
 * requests each fetch their own nonce and one overwrites the other on the
 * backend before the first can be verified.
 *
 * @param walletAddress — Stellar public key
 * @param signMessage   — Function from walletStore that calls Freighter.signMessage
 */
export async function getAuthHeaders(
  walletAddress: string,
  signMessage: (msg: string) => Promise<string>
): Promise<Record<string, string>> {
  // Return cached token if still valid for the same wallet
  if (cachedToken && cachedToken.walletAddress === walletAddress && isTokenValid(cachedToken)) {
    return buildHeaders(cachedToken);
  }

  // If a fetch is already in flight (for any caller), wait for it
  if (inflightPromise) {
    const token = await inflightPromise;
    return buildHeaders(token);
  }

  // Start a new fetch+sign and share it with any concurrent callers
  inflightPromise = (async (): Promise<AuthToken> => {
    try {
      const response = await fetch(`${API_BASE}/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to get auth nonce');
      }

      const { nonce, message, expiresIn } = await response.json();

      // Sign the message with Freighter
      const signature = await signMessage(message);

      const token: AuthToken = {
        walletAddress,
        nonce,
        signature,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      cachedToken = token;
      return token;
    } finally {
      inflightPromise = null;
    }
  })();

  const token = await inflightPromise;
  return buildHeaders(token);
}

/** Clear cached token (call on wallet disconnect) */
export function clearAuthToken(): void {
  cachedToken = null;
}

function buildHeaders(token: AuthToken): Record<string, string> {
  return {
    'x-wallet-address': token.walletAddress,
    'x-auth-nonce': token.nonce,
    'x-auth-signature': token.signature,
  };
}
