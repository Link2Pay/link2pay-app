import { config } from '../config';
import { clearAuthToken, getAuthHeaders } from './auth';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import toast from 'react-hot-toast';
import type {
  Invoice,
  PublicInvoice,
  CreateInvoiceData,
  PayIntentResponse,
  CreatePaymentLinkData,
  PaymentLink,
  PaymentLinkStatus,
  DashboardStats,
  SavedClient,
  SaveClientData,
} from '../types';

const API_BASE = config.apiUrl + '/api';
const API_REQUEST_TIMEOUT_MS = 20_000;
const USER_TOAST_COOLDOWN_MS = 12_000;
const lastToastAtByKey = new Map<string, number>();

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

function notifyUserError(key: string, message: string): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const last = lastToastAtByKey.get(key);
  if (last && now - last < USER_TOAST_COOLDOWN_MS) return;

  lastToastAtByKey.set(key, now);
  toast.error(message, {
    id: `api-error-${key}`,
    duration: 5500,
  });
}

/**
 * Core fetch wrapper.
 *
 * When `walletAddress` is provided the request is authenticated:
 *   - With session token: adds Authorization Bearer + x-wallet-address
 *   - Without session token: signs nonce via Freighter and injects wallet headers
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  walletAddress?: string,
  retryOnAuthError = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const { token, activeWallet, clearSession } = useAuthStore.getState();
  const resolvedWalletAddress = walletAddress || activeWallet || undefined;
  const usingSessionToken = Boolean(token);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    if (resolvedWalletAddress) {
      headers['x-wallet-address'] = resolvedWalletAddress;
    }
  } else if (resolvedWalletAddress) {
    const { signMessage } = useWalletStore.getState();
    try {
      const authHeaders = await getAuthHeaders(resolvedWalletAddress, signMessage);
      Object.assign(headers, authHeaders);
    } catch (error: any) {
      notifyUserError(
        'wallet-auth',
        error?.message || 'Authentication failed. Please reconnect your wallet.'
      );
      throw error;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      notifyUserError(
        'request-timeout',
        'Request timed out. Please check your connection and try again.'
      );
      throw new ApiError('Request timed out. Please try again.', 408);
    }
    notifyUserError('network-error', 'Network error. Please check your connection.');
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && usingSessionToken) {
      clearSession();
      clearAuthToken();
    }

    if (response.status === 401 && !usingSessionToken && resolvedWalletAddress && retryOnAuthError) {
      clearAuthToken();
      return request<T>(path, options, resolvedWalletAddress, false);
    }

    if (response.status === 401) {
      notifyUserError('auth-expired', 'Session expired. Please reconnect your wallet.');
    }

    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data?.details
    );
  }

  return data as T;
}

// ─── Invoice API ──────────────────────────────────────────────────

export async function createInvoice(
  data: CreateInvoiceData,
  walletAddress?: string
): Promise<Invoice> {
  return request<Invoice>(
    '/invoices',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    walletAddress
  );
}

export async function listInvoices(
  walletAddress?: string,
  status?: string,
  limit = 50,
  offset = 0
): Promise<{ invoices: Invoice[]; total: number }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return request<{ invoices: Invoice[]; total: number }>(
    `/invoices?${params.toString()}`,
    {},
    walletAddress
  );
}

export async function getInvoice(id: string): Promise<PublicInvoice> {
  return request<PublicInvoice>(`/invoices/${id}`);
}

export async function getOwnerInvoice(
  id: string,
  walletAddress?: string
): Promise<Invoice> {
  return request<Invoice>(`/invoices/${id}/owner`, {}, walletAddress);
}

export async function updateInvoice(
  id: string,
  data: Partial<CreateInvoiceData>,
  walletAddress?: string
): Promise<Invoice> {
  return request<Invoice>(
    `/invoices/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    walletAddress
  );
}

export async function sendInvoice(
  id: string,
  walletAddress?: string
): Promise<Invoice> {
  return request<Invoice>(
    `/invoices/${id}/send`,
    { method: 'POST' },
    walletAddress
  );
}

export async function deleteInvoice(
  id: string,
  walletAddress?: string
): Promise<void> {
  return request<void>(
    `/invoices/${id}`,
    { method: 'DELETE' },
    walletAddress
  );
}

export async function getDashboardStats(
  walletAddress?: string
): Promise<DashboardStats> {
  return request<DashboardStats>('/invoices/stats', {}, walletAddress);
}

// Payment Link API ---------------------------------------------------

export async function createLink(
  data: CreatePaymentLinkData,
  walletAddress?: string
): Promise<PaymentLink> {
  return request<PaymentLink>(
    '/links',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    walletAddress
  );
}

export async function getLink(id: string): Promise<PaymentLink> {
  return request<PaymentLink>(`/links/${id}`);
}

export async function getLinkStatus(id: string): Promise<PaymentLinkStatus> {
  return request<PaymentLinkStatus>(`/links/${id}/status`);
}

// Client API ---------------------------------------------------

export async function listSavedClients(
  walletAddress?: string
): Promise<SavedClient[]> {
  return request<SavedClient[]>('/clients', {}, walletAddress);
}

export async function saveClient(
  data: SaveClientData,
  walletAddress?: string
): Promise<SavedClient> {
  return request<SavedClient>(
    '/clients',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    walletAddress
  );
}

export async function updateClientFavorite(
  clientId: string,
  isFavorite: boolean,
  walletAddress?: string
): Promise<SavedClient> {
  return request<SavedClient>(
    `/clients/${clientId}/favorite`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isFavorite }),
    },
    walletAddress
  );
}

// ─── Payment API ──────────────────────────────────────────────────

export async function createPayIntent(
  invoiceId: string,
  senderPublicKey: string,
  networkPassphraseOverride?: string
): Promise<PayIntentResponse> {
  const networkPassphrase = networkPassphraseOverride || useNetworkStore.getState().networkPassphrase;
  return request<PayIntentResponse>(`/payments/${invoiceId}/pay-intent`, {
    method: 'POST',
    body: JSON.stringify({ senderPublicKey, networkPassphrase }),
  });
}

export async function submitPayment(
  invoiceId: string,
  signedTransactionXdr: string
): Promise<{ success: boolean; transactionHash: string; ledger: number }> {
  return request('/payments/submit', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, signedTransactionXdr }),
  });
}

export async function confirmPayment(
  invoiceId: string,
  transactionHash: string
): Promise<any> {
  return request('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, transactionHash }),
  });
}

export async function getXlmPrice(): Promise<{ usd: number }> {
  return request<{ usd: number }>('/prices/xlm');
}

export async function getPaymentStatus(
  invoiceId: string
): Promise<{
  invoiceId: string;
  status: string;
  transactionHash: string | null;
  ledgerNumber: number | null;
  paidAt: string | null;
  payerWallet: string | null;
}> {
  return request(`/payments/${invoiceId}/status`);
}
