/**
 * Fixtures SOLO PARA DESARROLLO del checkout público (`PaymentFlow`).
 *
 * Se consumen únicamente desde `getInvoice()` detrás de `import.meta.env.DEV`
 * y con `import()` dinámico, por lo que este archivo NO se empaqueta en el build
 * de producción. Permiten previsualizar el checkout en `localhost` sin backend:
 *   /pay/mock-crypto · /pay/mock-crypto-logo · /pay/mock-open · /pay/mock-xlm
 *   /pay/mock-business · /pay/mock-breb · /pay/mock-success · /pay/mock-closed
 *
 * Regla anti-red: los escenarios Bre-B se dejan en AWAITING_PAYMENT (no
 * PROCESSING/SETTLING) para que `OffRampPayment` no dispare polling (`offrampStatus`).
 */
import type { PublicInvoice } from '../types';

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

// Invoice base válido (Direct Payment, crypto, USDC, pendiente de pago).
const base: PublicInvoice = {
  id: 'mock-crypto',
  invoiceNumber: 'L2P-MOCK-0001',
  status: 'PENDING',
  freelancerName: 'Angélica Torres',
  freelancerCompany: 'Juguetería Medellín',
  freelancerEmail: null,
  freelancerTaxId: null,
  freelancerAddress: null,
  freelancerPhone: null,
  freelancerLogoUrl: null,
  clientName: 'Carlos Pérez',
  clientCompany: 'Importadora Global',
  clientEmail: null,
  clientAddress: null,
  clientTaxId: null,
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
  dueDate: null,
  paidAt: null,
  transactionHash: null,
  networkPassphrase: TESTNET_PASSPHRASE,
  payoutMethod: 'CRYPTO',
  payoutAlias: null,
  anchorTxId: null,
  quoteBuyAmount: null,
  receiptTxHash: null,
  invoiceType: 'DIRECT_PAYMENT',
  isOpenAmount: false,
  lineItems: [{ description: 'Pedido de juguetes importados', quantity: '1', rate: '199.00', amount: '199.00' }],
};

const SCENARIOS: Record<string, PublicInvoice> = {
  'mock-crypto': base,

  'mock-crypto-logo': {
    ...base,
    id: 'mock-crypto-logo',
    // Logo de marca embebido como data-URI para no depender de red.
    freelancerLogoUrl:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%234F51B8'/%3E%3Ctext x='32' y='42' font-family='sans-serif' font-size='30' fill='white' text-anchor='middle'%3EJ%3C/text%3E%3C/svg%3E",
  },

  'mock-open': {
    ...base,
    id: 'mock-open',
    title: 'Aporte / propina',
    description: 'El pagador elige el monto',
    isOpenAmount: true,
    subtotal: '0.00',
    total: '0.00',
    lineItems: [],
  },

  'mock-xlm': {
    ...base,
    id: 'mock-xlm',
    currency: 'XLM',
    subtotal: '450.00',
    total: '450.00',
    lineItems: [{ description: 'Servicio de diseño', quantity: '1', rate: '450.00', amount: '450.00' }],
  },

  'mock-business': {
    ...base,
    id: 'mock-business',
    invoiceType: 'BUSINESS_INVOICE',
    title: 'Factura de servicios',
    subtotal: '300.00',
    taxRate: '19',
    taxAmount: '57.00',
    total: '357.00',
    lineItems: [
      { description: 'Diseño de logotipo', quantity: '1', rate: '150.00', amount: '150.00' },
      { description: 'Diseño de tarjetas', quantity: '2', rate: '75.00', amount: '150.00' },
    ],
  },

  'mock-breb': {
    ...base,
    id: 'mock-breb',
    status: 'AWAITING_PAYMENT',
    title: 'Cobro con liquidación en pesos',
    payoutMethod: 'BRE_B',
    payoutAlias: '@angelica',
    quoteBuyAmount: '820179', // ≈ 199 USDC × 4120.5
    currency: 'USDC',
  },

  'mock-success': {
    ...base,
    id: 'mock-success',
    status: 'PAID',
    paidAt: '2026-07-05T12:03:00.000Z',
    transactionHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00',
  },

  'mock-closed': {
    ...base,
    id: 'mock-closed',
    status: 'EXPIRED',
  },
};

/**
 * Devuelve el fixture para un id de preview (`mock`, `mock-<escenario>`), o
 * `null` si el id no corresponde a un preview. Un id `mock` desconocido cae al
 * escenario por defecto (`mock-crypto`).
 */
export function getMockInvoice(id: string): PublicInvoice | null {
  if (!id.startsWith('mock')) return null;
  return SCENARIOS[id] ?? SCENARIOS['mock-crypto'];
}

/** Lista de escenarios para el índice dev de preview. */
export const MOCK_SCENARIOS: { id: string; label: string }[] = [
  { id: 'mock-crypto', label: 'Crypto — Direct Payment (De/Para + wallets)' },
  { id: 'mock-crypto-logo', label: 'Crypto — comercio con logo' },
  { id: 'mock-open', label: 'Monto abierto' },
  { id: 'mock-xlm', label: 'XLM (con equivalente USD)' },
  { id: 'mock-business', label: 'Business Invoice (documento + ítems)' },
  { id: 'mock-breb', label: 'Bre-B / COP (off-ramp)' },
  { id: 'mock-success', label: 'Éxito (recibo)' },
  { id: 'mock-closed', label: 'Expirado (cerrado)' },
];
