/**
 * Fixtures SOLO PARA DESARROLLO de la página de detalle de link (`InvoiceDetail`,
 * vista owner de `/dashboard/links/:id`).
 *
 * Se consumen únicamente desde `getOwnerInvoice()` detrás de `import.meta.env.DEV`
 * y con `import()` dinámico, por lo que este archivo NO se empaqueta en el build de
 * producción. Permiten previsualizar el detalle sin backend ni wallet conectada en
 * la ruta dev `/dev/links/mock-*`.
 *
 * Regla anti-red: los escenarios no deben disparar polling/efectos automáticos.
 * `ReceiverOffRamp` (Bre-B) solo llama al backend en clicks, así que es seguro;
 * aun así el escenario se deja en AWAITING_PAYMENT.
 */
import type { Invoice } from '../types';

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const MOCK_WALLET = 'GDMOCKFREELANCERWALLETADDRESSXXXXXXXXXXXXXXXXXXXXXXXX7Q';
const MOCK_PAYER = 'GDMOCKPAYERWALLETADDRESSYYYYYYYYYYYYYYYYYYYYYYYYYYY4T';

// Invoice base válido (owner, Direct Payment, crypto USDC, pendiente de pago).
const base: Invoice = {
  id: 'mock-pending',
  invoiceNumber: 'L2P-MOCK-0001',
  status: 'PENDING',
  freelancerWallet: MOCK_WALLET,
  freelancerName: 'Angélica Torres',
  freelancerEmail: 'angelica@jugueteriamedellin.co',
  freelancerCompany: 'Juguetería Medellín',
  freelancerTaxId: null,
  freelancerAddress: null,
  freelancerPhone: null,
  freelancerLogoUrl: null,
  clientName: 'Carlos Pérez',
  clientEmail: 'carlos@importadoraglobal.com',
  clientCompany: 'Importadora Global',
  clientAddress: null,
  clientTaxId: null,
  clientWallet: null,
  title: 'Pedido de juguetes importados',
  description: 'Pago del pedido #A-204',
  notes: null,
  subtotal: '199.00',
  taxRate: null,
  taxAmount: null,
  discount: null,
  total: '199.00',
  currency: 'USDC',
  createdAt: '2026-07-05T12:00:00.000Z',
  updatedAt: '2026-07-05T12:00:00.000Z',
  dueDate: '2026-07-20T12:00:00.000Z',
  paidAt: null,
  transactionHash: null,
  ledgerNumber: null,
  payerWallet: null,
  networkPassphrase: TESTNET_PASSPHRASE,
  payoutMethod: 'CRYPTO',
  payoutAlias: null,
  quoteId: null,
  quoteBuyAmount: null,
  anchorTxId: null,
  receiptTxHash: null,
  invoiceType: 'DIRECT_PAYMENT',
  isOpenAmount: false,
  lineItems: [{ description: 'Pedido de juguetes importados', quantity: '1', rate: '199.00', amount: '199.00' }],
};

const SCENARIOS: Record<string, Invoice> = {
  'mock-draft': { ...base, id: 'mock-draft', invoiceNumber: 'L2P-MOCK-DRAFT', status: 'DRAFT' },
  'mock-pending': base,
  'mock-processing': { ...base, id: 'mock-processing', status: 'PROCESSING' },
  'mock-awaiting-anchor': { ...base, id: 'mock-awaiting-anchor', status: 'AWAITING_ANCHOR' },
  'mock-awaiting-payment': { ...base, id: 'mock-awaiting-payment', status: 'AWAITING_PAYMENT' },
  'mock-anchor-error': { ...base, id: 'mock-anchor-error', status: 'ANCHOR_ERROR' },
  'mock-needs-kyc': { ...base, id: 'mock-needs-kyc', status: 'NEEDS_KYC' },
  'mock-paid': {
    ...base,
    id: 'mock-paid',
    invoiceNumber: 'L2P-MOCK-PAID',
    status: 'PAID',
    paidAt: '2026-07-05T15:30:00.000Z',
    transactionHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    ledgerNumber: 51234567,
    payerWallet: MOCK_PAYER,
  },
  'mock-settling': { ...base, id: 'mock-settling', status: 'SETTLING' },
  'mock-settled-fiat': { ...base, id: 'mock-settled-fiat', status: 'SETTLED_FIAT', payoutMethod: 'BRE_B', payoutAlias: '@angelica' },
  'mock-cancelled': { ...base, id: 'mock-cancelled', status: 'CANCELLED' },
  'mock-expired': { ...base, id: 'mock-expired', status: 'EXPIRED' },
  'mock-failed': { ...base, id: 'mock-failed', status: 'FAILED' },
  'mock-breb': {
    ...base,
    id: 'mock-breb',
    invoiceNumber: 'L2P-MOCK-BREB',
    status: 'AWAITING_PAYMENT',
    payoutMethod: 'BRE_B',
    payoutAlias: '@angelica',
    title: 'Cobro con liquidación a COP (Bre-B)',
    description: 'Liquidación en pesos colombianos vía Bre-B',
  },
  'mock-business': {
    ...base,
    id: 'mock-business',
    invoiceNumber: 'L2P-MOCK-BIZ',
    status: 'PENDING',
    title: 'Servicios de diseño — Julio 2026',
    description: 'Diseño de identidad de marca y material de campaña',
    notes: 'Gracias por su preferencia. Pago a 15 días.',
    subtotal: '1200.00',
    taxRate: '19',
    taxAmount: '228.00',
    total: '1428.00',
    lineItems: [
      { description: 'Diseño de logotipo', quantity: '1', rate: '500.00', amount: '500.00' },
      { description: 'Manual de marca', quantity: '1', rate: '400.00', amount: '400.00' },
      { description: 'Piezas de campaña', quantity: '3', rate: '100.00', amount: '300.00' },
    ],
  },
};

export function getMockLink(id: string): Invoice | null {
  if (!id.startsWith('mock')) return null;
  return SCENARIOS[id] ?? SCENARIOS['mock-pending'];
}

export const MOCK_LINK_SCENARIOS: { id: string; label: string }[] = [
  { id: 'mock-draft', label: 'Borrador (Enviar / Eliminar)' },
  { id: 'mock-pending', label: 'Pendiente (link de pago + cancelar)' },
  { id: 'mock-processing', label: 'Procesando' },
  { id: 'mock-awaiting-anchor', label: 'Esperando anchor' },
  { id: 'mock-awaiting-payment', label: 'Esperando pago' },
  { id: 'mock-anchor-error', label: 'Error de anchor' },
  { id: 'mock-needs-kyc', label: 'Requiere KYC' },
  { id: 'mock-paid', label: 'Pagado (pago confirmado + hash)' },
  { id: 'mock-settling', label: 'Liquidando' },
  { id: 'mock-settled-fiat', label: 'Liquidado a fiat' },
  { id: 'mock-cancelled', label: 'Cancelado' },
  { id: 'mock-expired', label: 'Expirado' },
  { id: 'mock-failed', label: 'Fallido' },
  { id: 'mock-breb', label: 'Bre-B / off-ramp COP (ReceiverOffRamp)' },
  { id: 'mock-business', label: 'Factura de negocio (impuesto + notas)' },
];
