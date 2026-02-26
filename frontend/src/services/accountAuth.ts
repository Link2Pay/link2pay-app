import { config } from '../config';
import { getAuthHeaders } from './auth';
import { useWalletStore } from '../store/walletStore';
import type { AuthUser } from '../store/authStore';

const AUTH_API = `${config.apiUrl}/api/auth`;

export type AccountSession = {
  token: string;
  user: AuthUser;
  activeWallet: string | null;
};

class AccountAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AccountAuthError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${AUTH_API}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AccountAuthError(
      payload?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return payload as T;
}

async function buildFreighterProof(walletAddress: string): Promise<{
  nonce: string;
  signature: string;
}> {
  const { signMessage } = useWalletStore.getState();
  const headers = await getAuthHeaders(walletAddress, signMessage);
  return {
    nonce: headers['x-auth-nonce'],
    signature: headers['x-auth-signature'],
  };
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<AccountSession> {
  return request<AccountSession>('/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function loginWithEmail(params: {
  email: string;
  password: string;
}): Promise<AccountSession> {
  return request<AccountSession>('/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function loginWithFreighterWallet(params: {
  walletAddress: string;
  email?: string;
  displayName?: string;
}): Promise<AccountSession> {
  const proof = await buildFreighterProof(params.walletAddress);
  return request<AccountSession>('/wallet-login', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'FREIGHTER',
      walletAddress: params.walletAddress,
      email: params.email,
      displayName: params.displayName,
      nonce: proof.nonce,
      signature: proof.signature,
    }),
  });
}

export async function loginWithAccesly(params: {
  walletAddress: string;
  email: string;
  displayName?: string;
}): Promise<AccountSession> {
  return request<AccountSession>('/wallet-login', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'ACCESLY',
      walletAddress: params.walletAddress,
      email: params.email,
      providerEmail: params.email,
      displayName: params.displayName,
    }),
  });
}

export async function linkFreighterWallet(
  token: string,
  params: { walletAddress: string; makePrimary?: boolean }
): Promise<{ user: AuthUser; activeWallet: string | null }> {
  const proof = await buildFreighterProof(params.walletAddress);
  return request<{ user: AuthUser; activeWallet: string | null }>(
    '/link-wallet',
    {
      method: 'POST',
      body: JSON.stringify({
        provider: 'FREIGHTER',
        walletAddress: params.walletAddress,
        makePrimary: params.makePrimary,
        nonce: proof.nonce,
        signature: proof.signature,
      }),
    },
    token
  );
}

export async function linkAcceslyWallet(
  token: string,
  params: { walletAddress: string; email: string; makePrimary?: boolean }
): Promise<{ user: AuthUser; activeWallet: string | null }> {
  return request<{ user: AuthUser; activeWallet: string | null }>(
    '/link-wallet',
    {
      method: 'POST',
      body: JSON.stringify({
        provider: 'ACCESLY',
        walletAddress: params.walletAddress,
        providerEmail: params.email,
        makePrimary: params.makePrimary,
      }),
    },
    token
  );
}

export async function linkPassword(
  token: string,
  params: { password: string; currentPassword?: string; email?: string }
): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>(
    '/link-password',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    token
  );
}

export async function getCurrentAccount(
  token: string
): Promise<{ user: AuthUser; activeWallet: string | null }> {
  return request<{ user: AuthUser; activeWallet: string | null }>('/me', {}, token);
}

