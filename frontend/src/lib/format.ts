import { CURRENCY_SYMBOLS } from '../config';

/**
 * Format a token amount for display: XLM as a trailing-symbol amount
 * (`12.00 XLM`), fiat-style assets with a leading symbol (`$12.00`).
 */
export function formatAmount(amount: string, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const number = parseFloat(amount);
  if (currency === 'XLM') return `${number.toFixed(2)} ${symbol}`;
  return `${symbol}${number.toFixed(2)}`;
}

/**
 * Truncate a Stellar address (or any long id) to `head…tail` for compact
 * display. Defaults match the sidebar's short form.
 */
export function shortenAddress(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

/**
 * Convert a date-only value (from `<input type="date">`, e.g. "2026-07-05")
 * into an end-of-day UTC ISO string, so a due date means "through the end of
 * the chosen day" instead of "the instant that day starts in UTC".
 *
 * `new Date("2026-07-05")` parses as UTC midnight — for anyone west of UTC
 * (most of the Americas), that instant has already passed by the time they
 * finish creating the invoice, so it expires on arrival. Anchoring to
 * end-of-day UTC instead gives the full chosen day everywhere except deep
 * into UTC+ timezones, which is the safest default without a stored
 * per-merchant timezone.
 */
export function endOfDayIso(dateOnly: string): string {
  return new Date(`${dateOnly}T23:59:59.999Z`).toISOString();
}
