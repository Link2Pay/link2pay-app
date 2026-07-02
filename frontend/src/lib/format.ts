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
