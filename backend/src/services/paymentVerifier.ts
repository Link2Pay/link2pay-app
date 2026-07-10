// Shared crypto invoice payment verification — used by /submit, /confirm,
// and the watcher to enforce identical memo, asset, amount, time, and
// uniqueness constraints. The off-ramp verifier is separate (it checks the
// anchor deposit address + anchor memo instead of the freelancer wallet +
// invoice number).
//
// SEC-03: an on-chain transfer may settle an invoice only when it is
// uniquely and verifiably attributable to that invoice.

export interface VerifiableInvoice {
  id: string;
  invoiceNumber: string;
  freelancerWallet: string;
  networkPassphrase: string;
  total: string;
  currency: string;
  createdAt: Date;
}

export interface VerifiedPayment {
  from: string;
  to: string;
  amount: string;
  assetCode: string;
  assetIssuer: string | null;
}

export interface VerifyTxDetails {
  hash: string;
  ledger: number;
  successful: boolean;
  memo: string | null | undefined;
  memoType: string | null | undefined;
  createdAt: string;
  sourceAccount: string;
  payments: VerifiedPayment[];
}

export interface VerificationError {
  status: number;
  message: string;
}

/**
 * Verify that `tx` settles `invoice` for crypto (non-BRE_B) invoices.
 *
 * Requirements (all mandatory — any failure returns a generic error):
 *   1. tx succeeded on-chain
 *   2. tx.memo exactly equals invoice.invoiceNumber
 *   3. memo type is 'text' (Horizon text memo)
 *   4. A payment op pays invoice.freelancerWallet
 *   5. The op uses the canonical issuer (or native XLM)
 *   6. Paid amount >= expected amount
 *   7. tx createdAt >= invoice createdAt (no historic/replay transfers)
 *
 * Returns the matching payment op on success, or null with an error object.
 */
export function verifyInvoicePayment(
  invoice: VerifiableInvoice,
  tx: VerifyTxDetails,
  canonicalIssuer: string | undefined,
  alreadyUsedTxHash: boolean
): { payment: VerifiedPayment } | VerificationError {
  // 1. Successful
  if (!tx.successful) {
    return { status: 400, message: 'Transaction not successful' };
  }

  // 2. Memo must match invoice number
  if (!tx.memo || tx.memo !== invoice.invoiceNumber) {
    return { status: 400, message: 'Transaction memo does not match this invoice' };
  }

  // 3. Memo type must be text
  if (tx.memoType !== 'text') {
    return { status: 400, message: 'Transaction memo type is not text' };
  }

  // 4 & 5: payment op matches destination + canonical asset
  const matchingPayment = tx.payments.find(
    (p: VerifiedPayment) =>
      p.to === invoice.freelancerWallet &&
      assetMatches(p, invoice.currency, canonicalIssuer)
  );

  if (!matchingPayment) {
    return { status: 400, message: 'Transaction does not pay this invoice' };
  }

  // 6. Paid amount >= expected amount
  const paidAmount = parseFloat(matchingPayment.amount);
  const expectedAmount = parseFloat(invoice.total);
  if (paidAmount < expectedAmount) {
    return { status: 400, message: 'Underpayment' };
  }

  // 7. Transfer timestamp >= invoice creation (allow 60s clock skew)
  const txTime = new Date(tx.createdAt).getTime();
  const invTime = invoice.createdAt.getTime() - 60_000; // 60s tolerance
  if (txTime < invTime) {
    return { status: 400, message: 'Transaction predates invoice' };
  }

  // 8. Uniqueness (caller passes the pre-check result)
  if (alreadyUsedTxHash) {
    return { status: 400, message: 'Transaction already recorded' };
  }

  return { payment: matchingPayment };
}

function assetMatches(
  payment: VerifiedPayment,
  currency: string,
  canonicalIssuer?: string
): boolean {
  if (payment.assetCode !== currency) return false;
  if (currency === 'XLM') return !payment.assetIssuer; // native
  return payment.assetIssuer === canonicalIssuer;
}
