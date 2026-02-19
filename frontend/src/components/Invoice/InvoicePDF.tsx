import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { Invoice } from '../../types';
import { CURRENCY_SYMBOLS } from '../../config';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  brandRow: {
    flexDirection: 'column',
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#6366f1',
    marginTop: 3,
    fontFamily: 'Helvetica-Bold',
  },
  statusBadge: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Title
  titleSection: {
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  invoiceDesc: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 1.4,
  },
  // Parties
  partiesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  partyBox: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  partyCompany: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 8.5,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  partyWallet: {
    fontSize: 7,
    color: '#9ca3af',
    marginTop: 4,
    fontFamily: 'Helvetica',
  },
  // Meta row (dates)
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metaItem: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9.5,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 1,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colRate: { flex: 1.5, textAlign: 'right' },
  colAmt: { flex: 1.5, textAlign: 'right' },
  tableCell: {
    fontSize: 9.5,
    color: '#374151',
  },
  tableCellMono: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#374151',
  },
  // Totals
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  totalsBox: {
    width: 220,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  totalsLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#374151',
  },
  totalsFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#6366f1',
  },
  totalsFinalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalsFinalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  // Payment link
  paymentSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  paymentLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  paymentUrl: {
    fontSize: 8.5,
    color: '#2563eb',
    fontFamily: 'Helvetica',
  },
  paymentHelp: {
    fontSize: 7.5,
    color: '#60a5fa',
    marginTop: 3,
  },
  // Notes
  notesSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  notesLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: '#9ca3af',
  },
  footerBrand: {
    fontSize: 7.5,
    color: '#6366f1',
    fontFamily: 'Helvetica-Bold',
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: string, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const num = parseFloat(amount);
  if (currency === 'XLM') return `${num.toFixed(2)} ${symbol}`;
  return `${symbol}${num.toFixed(2)}`;
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

interface InvoicePDFProps {
  invoice: Invoice;
  paymentLink: string;
}

export function InvoicePDFDocument({ invoice, paymentLink }: InvoicePDFProps) {
  const hasTax = !!invoice.taxRate && parseFloat(invoice.taxRate) > 0;
  const hasDiscount = !!invoice.discount && parseFloat(invoice.discount) > 0;

  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber}`}
      author={invoice.freelancerName || invoice.freelancerWallet}
      subject={invoice.title}
      creator="Link2Pay"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Link2Pay</Text>
            <Text style={styles.brandTagline}>Stellar Blockchain Invoicing</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* ── Invoice Title ── */}
        <View style={styles.titleSection}>
          <Text style={styles.invoiceTitle}>{invoice.title}</Text>
          {invoice.description ? (
            <Text style={styles.invoiceDesc}>{invoice.description}</Text>
          ) : null}
        </View>

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          {/* From */}
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>From</Text>
            {invoice.freelancerName ? (
              <Text style={styles.partyName}>{invoice.freelancerName}</Text>
            ) : null}
            {invoice.freelancerCompany ? (
              <Text style={styles.partyCompany}>{invoice.freelancerCompany}</Text>
            ) : null}
            {invoice.freelancerEmail ? (
              <Text style={styles.partyDetail}>{invoice.freelancerEmail}</Text>
            ) : null}
            <Text style={styles.partyWallet}>
              {invoice.freelancerWallet.slice(0, 12)}...{invoice.freelancerWallet.slice(-6)}
            </Text>
          </View>

          {/* To */}
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Bill To</Text>
            <Text style={styles.partyName}>{invoice.clientName}</Text>
            {invoice.clientCompany ? (
              <Text style={styles.partyCompany}>{invoice.clientCompany}</Text>
            ) : null}
            <Text style={styles.partyDetail}>{invoice.clientEmail}</Text>
            {invoice.clientAddress ? (
              <Text style={styles.partyDetail}>{invoice.clientAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Meta (dates) ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Currency</Text>
            <Text style={styles.metaValue}>{invoice.currency}</Text>
          </View>
          {invoice.status === 'PAID' && invoice.paidAt ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Paid On</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.paidAt)}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Line Items Table ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmt]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.tableCellMono, styles.colQty]}>
                {parseFloat(String(item.quantity))}
              </Text>
              <Text style={[styles.tableCellMono, styles.colRate]}>
                {parseFloat(String(item.rate)).toFixed(2)}
              </Text>
              <Text style={[styles.tableCellMono, styles.colAmt]}>
                {parseFloat(String(item.amount)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {parseFloat(invoice.subtotal).toFixed(2)} {invoice.currency}
              </Text>
            </View>
            {hasTax ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({invoice.taxRate}%)</Text>
                <Text style={styles.totalsValue}>
                  {parseFloat(invoice.taxAmount || '0').toFixed(2)} {invoice.currency}
                </Text>
              </View>
            ) : null}
            {hasDiscount ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.totalsValue}>
                  -{parseFloat(invoice.discount || '0').toFixed(2)} {invoice.currency}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalsFinalRow}>
              <Text style={styles.totalsFinalLabel}>Total Due</Text>
              <Text style={styles.totalsFinalValue}>{fmt(invoice.total, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {/* ── Payment Link ── */}
        {invoice.status !== 'PAID' ? (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>Pay Online</Text>
            <Text style={styles.paymentUrl}>{paymentLink}</Text>
            <Text style={styles.paymentHelp}>
              Click or paste this link in your browser to pay securely via Stellar.
            </Text>
          </View>
        ) : null}

        {/* ── Notes ── */}
        {invoice.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by{' '}
            <Text style={styles.footerBrand}>Link2Pay</Text>
            {' '}· Stellar Blockchain Invoicing
          </Text>
          <Text style={styles.footerText}>
            {invoice.invoiceNumber} · {fmtDate(invoice.createdAt)}
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ─── Utility: generate and download PDF ──────────────────────────────────────

export async function downloadInvoicePDF(invoice: Invoice, paymentLink: string): Promise<void> {
  const doc = <InvoicePDFDocument invoice={invoice} paymentLink={paymentLink} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoice.invoiceNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Utility: generate PDF blob for email attachment flow ─────────────────────

export async function getInvoicePDFBlob(invoice: Invoice, paymentLink: string): Promise<Blob> {
  const doc = <InvoicePDFDocument invoice={invoice} paymentLink={paymentLink} />;
  return pdf(doc).toBlob();
}
