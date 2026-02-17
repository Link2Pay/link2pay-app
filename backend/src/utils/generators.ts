/**
 * Generate a unique invoice number
 * Format: INV-XXXXXXXX (fits within Stellar 28-char memo limit)
 */
export function generateInvoiceNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'INV-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitize user input strings
 */
export function sanitizeString(input: string, maxLength: number): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F]/g, '');
}

/**
 * Format Stellar amount (7 decimal places)
 */
export function formatStellarAmount(amount: number | string): string {
  return parseFloat(amount.toString()).toFixed(7);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
