import { config } from '../config';

const API_BASE = config.apiUrl + '/api';
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
const AUTH_SIGN_TIMEOUT_MS = 20_000;

// ─── Session cache ────────────────────────────────────────────────────────────
// Stores the bearer session token to avoid re-signing on every request.

interface AuthSession {
  walletAddress: string;
  sessionToken: string;
  expiresAt: number; // ms
}

let cachedSession: AuthSession | null = null;

// Refresh 30 seconds before expiry to avoid races
const REFRESH_BUFFER_MS = 30_000;

// In-flight session creation promises by wallet
const inflightByWallet = new Map<string, Promise<AuthSession>>();

function isSessionValid(session: AuthSession | null): boolean {
  if (!session) return false;
  return Date.now() < session.expiresAt - REFRESH_BUFFER_MS;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Obtain a bearer session token and return auth headers.
 *
 * Two paths:
 *  - Privy: exchange a Privy access token for a session token via /api/auth/privy-session
 *  - Freighter: nonce-sign flow via /api/auth/nonce + /api/auth/session
 *
 * The session token is cached and shared across concurrent callers.
 */
export async function getAuthHeaders(
  walletAddress: string,
  signMessage: (msg: string) => Promise<string>,
  getPrivyToken?: (() => Promise<string | null>) | null
): Promise<Record<string, string>> {
  if (cachedSession?.walletAddress === walletAddress && isSessionValid(cachedSession)) {
    return buildHeaders(cachedSession);
  }

  const inflight = inflightByWallet.get(walletAddress);
  if (inflight) {
    return buildHeaders(await inflight);
  }

  const createSessionPromise = getPrivyToken
    ? createPrivySession(walletAddress, getPrivyToken)
    : createFreighterSession(walletAddress, signMessage);

  inflightByWallet.set(walletAddress, createSessionPromise);
  const session = await createSessionPromise;
  return buildHeaders(session);
}

async function createPrivySession(
  walletAddress: string,
  getPrivyToken: () => Promise<string | null>
): Promise<AuthSession> {
  try {
    const privyToken = await getPrivyToken();
    if (!privyToken) throw new Error('Not authenticated with Privy');

    const response = await fetchWithTimeout(
      `${API_BASE}/auth/privy-session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyToken, walletAddress }),
      },
      AUTH_REQUEST_TIMEOUT_MS
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.sessionToken || !data?.expiresIn) {
      throw new Error(data?.error || 'Privy auth failed');
    }

    const session: AuthSession = {
      walletAddress,
      sessionToken: data.sessionToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    };
    cachedSession = session;
    return session;
  } finally {
    inflightByWallet.delete(walletAddress);
  }
}

async function createFreighterSession(
  walletAddress: string,
  signMessage: (msg: string) => Promise<string>
): Promise<AuthSession> {
  try {
    const nonceResponse = await fetchWithTimeout(
      `${API_BASE}/auth/nonce`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      },
      AUTH_REQUEST_TIMEOUT_MS
    );

    if (!nonceResponse.ok) throw new Error('Failed to get auth nonce');

    const { nonce, message } = await nonceResponse.json();

    const signature = await withTimeout(
      signMessage(message),
      AUTH_SIGN_TIMEOUT_MS,
      'Wallet signature timed out. Please unlock Freighter and try again.'
    );

    const sessionResponse = await fetchWithTimeout(
      `${API_BASE}/auth/session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, nonce, signature }),
      },
      AUTH_REQUEST_TIMEOUT_MS
    );

    const sessionData = await sessionResponse.json().catch(() => null);
    if (!sessionResponse.ok || !sessionData?.sessionToken || !sessionData?.expiresIn) {
      throw new Error(sessionData?.error || 'Failed to create auth session');
    }

    const session: AuthSession = {
      walletAddress,
      sessionToken: sessionData.sessionToken,
      expiresAt: Date.now() + sessionData.expiresIn * 1000,
    };
    cachedSession = session;
    return session;
  } finally {
    inflightByWallet.delete(walletAddress);
  }
}

/** Clear cached auth session (call on wallet disconnect) */
export function clearAuthToken(): void {
  cachedSession = null;
  inflightByWallet.clear();
}

function buildHeaders(session: AuthSession): Record<string, string> {
  return {
    Authorization: `Bearer ${session.sessionToken}`,
  };
}
