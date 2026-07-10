import { shortenAddress } from './format';

// Quick direct-payment links are created without a real recipient — the form
// stores this sentinel pair (see InvoiceForm). Real identity arrives at pay
// time as the payer's wallet.
const ANONYMOUS_CLIENT_NAME = 'Payer';
const ANONYMOUS_CLIENT_EMAIL = 'payer@link2pay.io';

interface ClientFields {
  clientName: string;
  clientEmail?: string | null;
  clientWallet?: string | null;
  payerWallet?: string | null;
}

export function isAnonymousClient(invoice: Pick<ClientFields, 'clientName' | 'clientEmail'>): boolean {
  return (
    invoice.clientName === ANONYMOUS_CLIENT_NAME &&
    (invoice.clientEmail ?? '') === ANONYMOUS_CLIENT_EMAIL
  );
}

/**
 * Who to show as an invoice's counterparty:
 * - the real client name when the merchant entered one
 * - the payer's shortened wallet once an anonymous link is paid
 * - null for unpaid anonymous links — callers omit the row/label entirely
 */
export function displayClientName(invoice: ClientFields): string | null {
  if (!isAnonymousClient(invoice)) return invoice.clientName;
  const wallet = invoice.payerWallet || invoice.clientWallet;
  return wallet ? shortenAddress(wallet, 6, 4) : null;
}

/**
 * Full wallet address of the invoice's counterparty, for explorer links —
 * the payer's wallet once paid, otherwise the client wallet stored at
 * creation. Null when neither is known (e.g. unpaid anonymous link).
 */
export function counterpartyWallet(invoice: ClientFields): string | null {
  return invoice.payerWallet || invoice.clientWallet || null;
}
