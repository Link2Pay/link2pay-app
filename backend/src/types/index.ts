export interface CreateInvoiceInput {
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
  currency: 'XLM' | 'USDC' | 'EURC';
  taxRate?: number;
  discount?: number;
  dueDate?: string;
  saveClient?: boolean;
  favoriteClient?: boolean;
  lineItems: LineItemInput[];
}

export interface LineItemInput {
  description: string;
  quantity: number;
  rate: number;
}

export interface PayIntentResponse {
  invoiceId: string;
  transactionXdr: string;
  sep7Uri: string;
  destination: string;
  amount: string;
  asset: { code: string; issuer?: string };
  memo: string;
  networkPassphrase: string;
  timeout: number;
}

export interface PaymentConfirmation {
  invoiceId: string;
  transactionHash: string;
  ledgerNumber: number;
  fromWallet: string;
  toWallet: string;
  amount: string;
  asset: string;
}

export interface InvoicePublicView {
  id: string;
  invoiceNumber: string;
  status: string;
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
  currency: string;
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

export interface SaveClientInput {
  name: string;
  email: string;
  company?: string;
  address?: string;
  isFavorite?: boolean;
}

export interface UpdateClientFavoriteInput {
  isFavorite: boolean;
}
