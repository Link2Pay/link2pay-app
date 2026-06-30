export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'AWAITING_ANCHOR'
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'PAID'
  | 'SETTLING'
  | 'SETTLED_FIAT'
  | 'ANCHOR_ERROR'
  | 'NEEDS_KYC'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export type Currency = 'XLM' | 'USDC' | 'EURC';

export type InvoiceType = 'DIRECT_PAYMENT' | 'BUSINESS_INVOICE' | 'SERVICE_INVOICE';

export type LinkStatus =
  | 'CREATED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED';

export interface LineItem {
  id?: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  freelancerWallet: string;
  freelancerName?: string | null;
  freelancerEmail?: string | null;
  freelancerCompany?: string | null;
  freelancerTaxId?: string | null;
  freelancerAddress?: string | null;
  freelancerPhone?: string | null;
  freelancerLogoUrl?: string | null;
  clientName: string;
  clientEmail: string;
  clientCompany?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
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
  networkPassphrase?: string | null;
  payoutMethod?: string | null;
  payoutAlias?: string | null;
  quoteId?: string | null;
  quoteBuyAmount?: string | null;
  anchorTxId?: string | null;
  receiptTxHash?: string | null;
  invoiceType?: InvoiceType | null;
  isOpenAmount?: boolean;
  lineItems: LineItem[];
}

export interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  freelancerName?: string | null;
  freelancerEmail?: string | null;
  freelancerCompany?: string | null;
  freelancerTaxId?: string | null;
  freelancerAddress?: string | null;
  freelancerPhone?: string | null;
  freelancerLogoUrl?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientCompany?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
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
  networkPassphrase: string;
  payoutMethod?: string | null;
  payoutAlias?: string | null;
  anchorTxId?: string | null;
  quoteBuyAmount?: string | null;
  receiptTxHash?: string | null;
  invoiceType?: InvoiceType | null;
  isOpenAmount?: boolean;
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
  freelancerTaxId?: string;
  freelancerAddress?: string;
  freelancerPhone?: string;
  freelancerLogoUrl?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  clientTaxId?: string;
  title: string;
  description?: string;
  notes?: string;
  currency: Currency;
  taxRate?: number;
  discount?: number;
  dueDate?: string;
  networkPassphrase?: string;
  saveClient?: boolean;
  favoriteClient?: boolean;
  payoutMethod?: 'CRYPTO' | 'BRE_B';
  payoutAlias?: string;
  invoiceType?: InvoiceType;
  isOpenAmount?: boolean;
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

export interface BusinessProfile {
  walletAddress: string;
  displayName?: string | null;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  defaultCurrency: Currency;
  defaultPayoutMethod: 'CRYPTO' | 'BRE_B';
  defaultPayoutAlias?: string | null;
}

export interface SaveProfileData {
  displayName?: string;
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  defaultCurrency?: Currency;
  defaultPayoutMethod?: 'CRYPTO' | 'BRE_B';
  defaultPayoutAlias?: string;
}

export interface PayIntentResponse {
  invoiceId: string;
  transactionXdr: string | null;
  sep7Uri: string;
  amount: string;
  asset: { code: string; issuer?: string | null };
  memo: string;
  networkPassphrase: string;
  timeout: number;
}

export interface CreatePaymentLinkData {
  amount: number;
  asset: Currency;
  activateNewAccounts?: boolean;
  recipientWallet?: string;
  expiresAt?: string;
  networkPassphrase?: string;
  metadata?: {
    title?: string;
    description?: string;
    reference?: string;
    payerName?: string;
    payerEmail?: string;
  };
}

export interface PaymentLink {
  id: string;
  status: LinkStatus;
  checkoutUrl: string;
  amount: string;
  asset: Currency;
  createdAt: string;
  expiresAt: string | null;
  metadata: {
    title: string;
    description: string | null;
    reference: string | null;
    payerName: string | null;
    payerEmail: string | null;
  };
  transactionHash?: string | null;
  confirmedAt?: string | null;
  legacyInvoiceId?: string;
  legacyInvoiceNumber?: string;
}

export interface PaymentLinkStatus {
  id: string;
  status: LinkStatus;
  transactionHash: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
}

export interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalRevenue: string;
  pendingAmount: string;
}
