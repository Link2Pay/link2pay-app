//
// Fiat off-ramp rail registry — the single source of truth for which country
// maps to which local instant-payment rail, its settlement currency, and
// whether it is live yet.
//
//   Colombia  → Bre-B            → COP  → LIVE
//   Brazil    → Pix              → BRL  → coming soon (walled)
//   Argentina → Transferência 3.0 → ARS  → coming soon (walled)
//
// A rail with `status: 'coming_soon'` cannot back an invoice: the DB
// `PayoutMethod` enum only has CRYPTO | BRE_B, so no walled rail can be
// created. That IS the wall. To bring a rail live: add its PayoutMethod enum
// value + a country adapter, then flip `status` to 'live' here.
//

export type CountryCode = 'CO' | 'BR' | 'AR';
export type BuyCurrency = 'COP' | 'BRL' | 'ARS';
export type FiatRailId = 'BRE_B' | 'PIX' | 'TRANSFERENCIA_30';
export type RailStatus = 'live' | 'coming_soon';

export interface FiatRail {
  id: FiatRailId;
  country: CountryCode;
  countryName: string;
  buyCurrency: BuyCurrency;
  /** Display name of the rail, e.g. "Bre-B", "Pix", "Transferência 3.0". */
  railName: string;
  /** Label for the recipient identifier the merchant enters (llave, Pix key…). */
  aliasLabel: string;
  status: RailStatus;
}

export const FIAT_RAILS: Record<FiatRailId, FiatRail> = {
  BRE_B: {
    id: 'BRE_B',
    country: 'CO',
    countryName: 'Colombia',
    buyCurrency: 'COP',
    railName: 'Bre-B',
    aliasLabel: 'Bre-B llave',
    status: 'live',
  },
  PIX: {
    id: 'PIX',
    country: 'BR',
    countryName: 'Brazil',
    buyCurrency: 'BRL',
    railName: 'Pix',
    aliasLabel: 'Pix key',
    status: 'coming_soon',
  },
  TRANSFERENCIA_30: {
    id: 'TRANSFERENCIA_30',
    country: 'AR',
    countryName: 'Argentina',
    buyCurrency: 'ARS',
    railName: 'Transferência 3.0',
    aliasLabel: 'CBU / CVU / alias',
    status: 'coming_soon',
  },
};

export const FIAT_RAIL_LIST: FiatRail[] = Object.values(FIAT_RAILS);

/** The rail offered to a merchant in the given country, or null (e.g. "Other"). */
export function railByCountry(country?: string | null): FiatRail | null {
  if (!country) return null;
  const code = country.toUpperCase();
  return FIAT_RAIL_LIST.find((r) => r.country === code) ?? null;
}

/** Look up a rail by its id (also the fiat PayoutMethod value for live rails). */
export function railById(id?: string | null): FiatRail | null {
  if (!id) return null;
  return (FIAT_RAILS as Record<string, FiatRail>)[id] ?? null;
}

/** True only for rails that are actually wired end-to-end (Bre-B today). */
export function isRailLive(id?: string | null): boolean {
  const rail = railById(id);
  return !!rail && rail.status === 'live';
}
