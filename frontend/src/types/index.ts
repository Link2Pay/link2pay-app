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
  lineItems: { description: string; quantity: number; rate: number }[];
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
