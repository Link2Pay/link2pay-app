export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export type Currency = 'XLM' | 'USDC' | 'EURC';

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  freelancerWallet: string;
  freelancerName?: string | null;
  freelancerEmail?: string | null;
  freelancerCompany?: string | null;
  clientName: string;
  clientEmail: string;
  clientCompany?: string | null;
  clientAddress?: string | null;
  clientWallet?: string | null;
  title: string;
  description?: string | null;
  notes?: string | null;
  subtotal: string;
  taxRate?: string | null;
  taxAmount?: string | null;
  discount?: string | null;
  total: string;
  currency: Currency;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string | null;
  paidAt?: string | null;
  transactionHash?: string | null;
  ledgerNumber?: number | null;
  payerWallet?: string | null;
  lineItems: LineItem[];
}

export interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  freelancerName?: string | null;
  freelancerCompany?: string | null;
  clientName: string;
  clientCompany?: string | null;
  title: string;
  description?: string | null;
  notes?: string | null;
  subtotal: string;
  taxRate?: string | null;
  taxAmount?: string | null;
  discount?: string | null;
  total: string;
  currency: Currency;
  createdAt: string;
  dueDate?: string | null;
  paidAt?: string | null;
  transactionHash?: string | null;
  lineItems: {
    description: string;
    quantity: string;
    rate: string;
    amount: string;
  }[];
}

export interface CreateInvoiceData {
  freelancerWallet: string;
  freelancerName?: string;
  freelancerEmail?: string;
  freelancerCompany?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  title: string;
  description?: string;
  notes?: string;
  currency: Currency;
  taxRate?: number;
  discount?: number;
  dueDate?: string;
  saveClient?: boolean;
  favoriteClient?: boolean;
  lineItems: { description: string; quantity: number; rate: number }[];
}

export interface SavedClient {
  id: string;
  freelancerWallet: string;
  name: string;
  email: string;
  company?: string | null;
  address?: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveClientData {
  name: string;
  email: string;
  company?: string;
  address?: string;
  isFavorite?: boolean;
}

export interface PayIntentResponse {
  invoiceId: string;
  transactionXdr: string;
  sep7Uri: string;
  destination: string;
  amount: string;
  asset: { code: string; issuer?: string | null };
  memo: string;
  networkPassphrase: string;
  timeout: number;
}

export interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalRevenue: string;
  pendingAmount: string;
}
