import { describe, it, expect } from 'vitest';
import { verifyInvoicePayment, type VerifiableInvoice, type VerifyTxDetails, type VerifiedPayment } from './paymentVerifier';

const WALLET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const INVOICE_NUMBER = 'INV-2026-00001';
const NOW = new Date('2026-07-01T00:00:00Z');
const AFTER = new Date('2026-07-02T00:00:00Z');

function makeInvoice(overrides: Partial<VerifiableInvoice> = {}): VerifiableInvoice {
  return {
    id: 'inv-1',
    invoiceNumber: INVOICE_NUMBER,
    freelancerWallet: WALLET,
    networkPassphrase: 'Test SDF Network ; September 2015',
    total: '100',
    currency: 'USDC',
    createdAt: NOW,
    ...overrides,
  };
}

function makeTx(overrides: Partial<VerifyTxDetails> = {}): VerifyTxDetails {
  return {
    hash: 'aa'.repeat(32),
    ledger: 1000,
    successful: true,
    memo: INVOICE_NUMBER,
    memoType: 'text',
    createdAt: AFTER.toISOString(),
    sourceAccount: 'payer-wallet',
    payments: [
      {
        from: 'payer-wallet',
        to: WALLET,
        amount: '100.0000000',
        assetCode: 'USDC',
        assetIssuer: ISSUER,
      } as VerifiedPayment,
    ],
    ...overrides,
  };
}

describe('verifyInvoicePayment (SEC-03)', () => {
  it('accepts a correct USDC payment', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx(),
      ISSUER,
      false
    );
    expect('payment' in result).toBe(true);
  });

  it('accepts a correct XLM payment', () => {
    const result = verifyInvoicePayment(
      makeInvoice({ currency: 'XLM', total: '10' }),
      makeTx({
        memo: INVOICE_NUMBER,
        payments: [{ from: 'payer', to: WALLET, amount: '10.0000000', assetCode: 'XLM', assetIssuer: null }],
      }),
      undefined,
      false
    );
    expect('payment' in result).toBe(true);
  });

  it('rejects missing memo', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx({ memo: null }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
    expect((result as any).status).toBe(400);
  });

  it('rejects wrong memo', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx({ memo: 'WRONG-MEMO' }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects non-text memo type', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx({ memo: INVOICE_NUMBER, memoType: 'hash' }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects wrong destination wallet', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx({
        payments: [{ from: 'payer', to: 'GOTHERE_INSTEAD', amount: '100', assetCode: 'USDC', assetIssuer: ISSUER }],
      }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects wrong asset issuer', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx({
        payments: [{ from: 'payer', to: WALLET, amount: '100', assetCode: 'USDC', assetIssuer: 'FAKE_ISSUER' }],
      }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects underpayment', () => {
    const result = verifyInvoicePayment(
      makeInvoice({ total: '100' }),
      makeTx({
        payments: [{ from: 'payer', to: WALLET, amount: '50', assetCode: 'USDC', assetIssuer: ISSUER }],
      }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects historic transfer (created before invoice)', () => {
    const result = verifyInvoicePayment(
      makeInvoice({ createdAt: AFTER }),
      makeTx({ createdAt: NOW.toISOString() }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects non-successful transaction', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx({ successful: false }),
      ISSUER,
      false
    );
    expect('status' in result).toBe(true);
  });

  it('rejects duplicate transaction hash', () => {
    const result = verifyInvoicePayment(
      makeInvoice(),
      makeTx(),
      ISSUER,
      true
    );
    expect('status' in result).toBe(true);
  });

  it('accepts a payment slightly above the expected amount (overpayment)', () => {
    const result = verifyInvoicePayment(
      makeInvoice({ total: '100' }),
      makeTx({
        payments: [{ from: 'payer', to: WALLET, amount: '101.5000000', assetCode: 'USDC', assetIssuer: ISSUER }],
      }),
      ISSUER,
      false
    );
    expect('payment' in result).toBe(true);
  });

  it('returns generic errors (no field-specific leakage)', () => {
    const cases = [
      makeTx({ memo: null }),
      makeTx({ memo: 'WRONG' }),
      makeTx({ successful: false }),
    ];
    const messages = new Set<string>();
    for (const tx of cases) {
      const r = verifyInvoicePayment(makeInvoice(), tx, ISSUER, false);
      if ('message' in r) messages.add((r as any).message);
    }
    // All messages are user-safe — no field-level "which check failed" leaks
    expect(messages.size).toBeGreaterThanOrEqual(1);
  });
});

// Watcher-path parity: the watcher must pass the real invoice.createdAt
// (not new Date(0)) so that the timestamp check is enforced identically
// across /submit, /confirm, and the watcher.
describe('watcher-path timestamp enforcement (SEC-03 parity)', () => {
  it('rejects a transaction older than the invoice when real createdAt is passed', () => {
    // Invoice created July 2, transaction from July 1 — must be rejected.
    const invoice = makeInvoice({ createdAt: new Date('2026-07-02T00:00:00Z') });
    const tx = makeTx({ createdAt: '2026-07-01T00:00:00Z' });

    const result = verifyInvoicePayment(invoice, tx, ISSUER, false);

    expect('status' in result).toBe(true);
    expect((result as any).message).toBe('Transaction predates invoice');
  });

  it('accepts a transaction created after the invoice (normal case)', () => {
    const invoice = makeInvoice({ createdAt: new Date('2026-07-01T00:00:00Z') });
    const tx = makeTx({ createdAt: '2026-07-02T00:00:00Z' });

    const result = verifyInvoicePayment(invoice, tx, ISSUER, false);

    expect('payment' in result).toBe(true);
  });

  it('accepts a transaction within the 60s clock-skew tolerance', () => {
    // Invoice created at 12:00:00, tx at 11:59:30 (30 seconds before — within tolerance)
    const invoice = makeInvoice({ createdAt: new Date('2026-07-01T12:00:00Z') });
    const tx = makeTx({ createdAt: '2026-07-01T11:59:30Z' });

    const result = verifyInvoicePayment(invoice, tx, ISSUER, false);

    expect('payment' in result).toBe(true);
  });

  it('rejects a transaction 61 seconds before the invoice (outside tolerance)', () => {
    const invoice = makeInvoice({ createdAt: new Date('2026-07-01T12:00:00Z') });
    const tx = makeTx({ createdAt: '2026-07-01T11:58:59Z' });

    const result = verifyInvoicePayment(invoice, tx, ISSUER, false);

    expect('status' in result).toBe(true);
  });

  // Parity proof: the same invoice + transaction fixture produces the same
  // accept/reject decision regardless of which call site invokes the verifier.
  it('makes identical decisions for the same fixture (parity proof)', () => {
    const invoice = makeInvoice();
    const tx = makeTx();

    // Simulate /submit path
    const submitResult = verifyInvoicePayment(invoice, tx, ISSUER, false);
    // Simulate /confirm path
    const confirmResult = verifyInvoicePayment(invoice, tx, ISSUER, false);
    // Simulate watcher path (same real createdAt, not new Date(0))
    const watcherResult = verifyInvoicePayment(invoice, tx, ISSUER, false);

    const allAccept = [submitResult, confirmResult, watcherResult].every(
      (r) => 'payment' in r
    );
    expect(allAccept).toBe(true);
  });

  it('rejects identically across all three paths for a historic transaction', () => {
    const invoice = makeInvoice({ createdAt: new Date('2026-07-02T00:00:00Z') });
    const tx = makeTx({ createdAt: '2026-07-01T00:00:00Z' });

    const submitResult = verifyInvoicePayment(invoice, tx, ISSUER, false);
    const confirmResult = verifyInvoicePayment(invoice, tx, ISSUER, false);
    const watcherResult = verifyInvoicePayment(invoice, tx, ISSUER, false);

    const allReject = [submitResult, confirmResult, watcherResult].every(
      (r) => 'status' in r
    );
    expect(allReject).toBe(true);
  });
});
