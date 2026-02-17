import { config } from '../config';
import type {
  Invoice,
  CreateInvoiceData,
  PayIntentResponse,
  DashboardStats,
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
    headers['x-wallet-address'] = walletAddress;
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
  status?: string
): Promise<Invoice[]> {
  const query = status ? `?status=${status}` : '';
  return request<Invoice[]>(`/invoices${query}`, {}, walletAddress);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return request<Invoice>(`/invoices/${id}`);
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

// ─── Payment API ──────────────────────────────────────────────────

export async function createPayIntent(
  invoiceId: string,
  senderPublicKey: string
): Promise<PayIntentResponse> {
  return request<PayIntentResponse>(`/payments/${invoiceId}/pay-intent`, {
    method: 'POST',
    body: JSON.stringify({ senderPublicKey }),
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

export async function getPaymentStatus(
  invoiceId: string
): Promise<{
  invoiceId: string;
  status: string;
  transactionHash: string | null;
  ledgerNumber: number | null;
  paidAt: string | null;
}> {
  return request(`/payments/${invoiceId}/status`);
}
