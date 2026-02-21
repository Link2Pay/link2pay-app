import { config } from '../config';
import { getAuthHeaders } from './auth';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import type {
  Invoice,
  PublicInvoice,
  CreateInvoiceData,
  PayIntentResponse,
  DashboardStats,
  SavedClient,
  SaveClientData,
} from '../types';

const API_BASE = config.apiUrl + '/api';

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

/**
 * Core fetch wrapper.
 *
 * When `walletAddress` is provided the request is authenticated:
 *   1. Fetches a nonce from POST /api/auth/nonce  (cached ~5 min)
 *   2. Signs the nonce message via Freighter       (cached ~5 min)
 *   3. Injects x-wallet-address, x-auth-nonce, x-auth-signature
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  walletAddress?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (walletAddress) {
    const { signMessage } = useWalletStore.getState();
    const authHeaders = await getAuthHeaders(walletAddress, signMessage);
    Object.assign(headers, authHeaders);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
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
  walletAddress: string
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
  walletAddress: string,
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
  walletAddress: string
): Promise<Invoice> {
  return request<Invoice>(`/invoices/${id}/owner`, {}, walletAddress);
}

export async function updateInvoice(
  id: string,
  data: Partial<CreateInvoiceData>,
  walletAddress: string
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
  walletAddress: string
): Promise<Invoice> {
  return request<Invoice>(
    `/invoices/${id}/send`,
    { method: 'POST' },
    walletAddress
  );
}

export async function deleteInvoice(
  id: string,
  walletAddress: string
): Promise<void> {
  return request<void>(
    `/invoices/${id}`,
    { method: 'DELETE' },
    walletAddress
  );
}

export async function getDashboardStats(
  walletAddress: string
): Promise<DashboardStats> {
  return request<DashboardStats>('/invoices/stats', {}, walletAddress);
}

// Client API ---------------------------------------------------

export async function listSavedClients(
  walletAddress: string
): Promise<SavedClient[]> {
  return request<SavedClient[]>('/clients', {}, walletAddress);
}

export async function saveClient(
  data: SaveClientData,
  walletAddress: string
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
  walletAddress: string
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
