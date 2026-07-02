export interface CreateInvoiceInput {
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
  currency: 'XLM' | 'USDC' | 'EURC';
  taxRate?: number;
  discount?: number;
  dueDate?: string;
  networkPassphrase?: string;
  saveClient?: boolean;
  favoriteClient?: boolean;
  payoutMethod?: 'CRYPTO' | 'BRE_B';
  payoutAlias?: string;
  invoiceType?: 'DIRECT_PAYMENT' | 'BUSINESS_INVOICE' | 'SERVICE_INVOICE';
  isOpenAmount?: boolean;
  lineItems?: LineItemInput[];
}

export interface LineItemInput {
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoicePublicView {
  id: string;
  invoiceNumber: string;
  status: string;
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
  currency: string;
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
  invoiceType?: string | null;
  isOpenAmount: boolean;
  lineItems: {
    description: string;
    quantity: string;
    rate: string;
    amount: string;
  }[];
}

export interface SaveClientInput {
  name: string;
  email: string;
  company?: string;
  address?: string;
  isFavorite?: boolean;
}

export interface SaveProfileInput {
  displayName?: string;
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  defaultCurrency?: 'XLM' | 'USDC' | 'EURC';
  defaultPayoutMethod?: 'CRYPTO' | 'BRE_B';
  defaultPayoutAlias?: string;
}

export interface BusinessProfileView {
  walletAddress: string;
  displayName: string | null;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  defaultPayoutMethod: string;
  defaultPayoutAlias: string | null;
}
