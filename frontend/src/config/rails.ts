//
// Fiat off-ramp rail registry (frontend mirror of backend/src/config/rails.ts).
// Single source of truth for which country maps to which local instant-payment
// rail, and whether that rail is live yet or still walled behind "coming soon".
//
//   Colombia  → Bre-B             → COP  → live
//   Brazil    → Pix               → BRL  → coming soon
//   Argentina → Transferência 3.0 → ARS  → coming soon
//

export type CountryCode = 'CO' | 'BR' | 'AR';
export type BuyCurrency = 'COP' | 'BRL' | 'ARS';
export type FiatRailId = 'BRE_B' | 'PIX' | 'TRANSFERENCIA_30';
export type RailStatus = 'live' | 'coming_soon';

export interface FiatRail {
  id: FiatRailId;
  country: CountryCode;
  countryName: string;
  currency: BuyCurrency;
  /** Display name of the rail, e.g. "Bre-B", "Pix", "Transferência 3.0". */
  railName: string;
  /** Label for the recipient identifier the merchant enters. */
  aliasLabel: string;
  aliasPlaceholder: string;
  status: RailStatus;
  /** DB PayoutMethod value for live rails; null while walled. */
  payoutMethod: 'BRE_B' | null;
}

export const FIAT_RAILS: Record<FiatRailId, FiatRail> = {
  BRE_B: {
    id: 'BRE_B',
    country: 'CO',
    countryName: 'Colombia',
    currency: 'COP',
    railName: 'Bre-B',
    aliasLabel: 'Bre-B llave',
    aliasPlaceholder: '@nequi-3001234567',
    status: 'live',
    payoutMethod: 'BRE_B',
  },
  PIX: {
    id: 'PIX',
    country: 'BR',
    countryName: 'Brazil',
    currency: 'BRL',
    railName: 'Pix',
    aliasLabel: 'Pix key',
    aliasPlaceholder: 'CPF, email, phone or random key',
    status: 'coming_soon',
    payoutMethod: null,
  },
  TRANSFERENCIA_30: {
    id: 'TRANSFERENCIA_30',
    country: 'AR',
    countryName: 'Argentina',
    currency: 'ARS',
    railName: 'Transferência 3.0',
    aliasLabel: 'CBU / CVU / alias',
    aliasPlaceholder: 'alias.mercadopago',
    status: 'coming_soon',
    payoutMethod: null,
  },
};

export const FIAT_RAIL_LIST: FiatRail[] = Object.values(FIAT_RAILS);

export const COUNTRY_OPTIONS: { code: CountryCode; name: string }[] = [
  { code: 'CO', name: 'Colombia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
];

/**
 * Resolve the rail for a merchant's country value. Tolerant of both ISO codes
 * ('CO') and legacy free-text names ('Colombia') so existing profiles keep
 * working after the switch to a structured selector.
 */
export function railByCountry(country?: string | null): FiatRail | null {
  if (!country) return null;
  const c = country.trim().toLowerCase();
  return (
    FIAT_RAIL_LIST.find(
      (r) => r.country.toLowerCase() === c || r.countryName.toLowerCase() === c
    ) ?? null
  );
}

export function railById(id?: string | null): FiatRail | null {
  if (!id) return null;
  return (FIAT_RAILS as Record<string, FiatRail>)[id] ?? null;
}
