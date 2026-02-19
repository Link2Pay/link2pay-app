/**
 * Maps raw Stellar/Horizon error codes and messages to user-friendly strings.
 * This prevents cryptic SDK errors from being exposed directly to clients.
 */
export function mapStellarError(error: unknown): string {
  if (typeof error !== 'object' || !error) return 'Payment processing failed. Please try again.';

  const err = error as any;
  const message: string = err?.message ?? '';
  const resultCodes = err?.response?.data?.extras?.result_codes ?? {};
  const opCodes: string[] = resultCodes.operations ?? [];

  // Stellar operation result codes
  if (opCodes.includes('op_underfunded')) {
    return 'Insufficient balance to complete this payment. Please fund your wallet and try again.';
  }
  if (opCodes.includes('op_no_trust')) {
    return 'Your wallet does not have a trustline for this asset. Please add a trustline in your wallet.';
  }
  if (opCodes.includes('op_no_destination')) {
    return 'The recipient wallet does not exist on the Stellar network.';
  }
  if (opCodes.includes('op_line_full')) {
    return 'The recipient wallet cannot receive more of this asset (limit reached).';
  }

  // Transaction-level codes
  if (resultCodes.transaction === 'tx_bad_seq') {
    return 'Transaction sequence error. Please try again.';
  }
  if (resultCodes.transaction === 'tx_too_late') {
    return 'The transaction timed out. Please create a new payment and try again.';
  }
  if (resultCodes.transaction === 'tx_insufficient_fee') {
    return 'Transaction fee was too low. Please try again.';
  }

  // Known internal error messages
  if (message.includes('ACCOUNT_NOT_FOUND')) {
    return 'Wallet account not found on the Stellar network. Please fund your wallet with at least 1 XLM.';
  }
  if (message.includes('INVALID_SENDER_ADDRESS')) {
    return 'Invalid sender wallet address.';
  }
  if (message.includes('INVALID_RECIPIENT_ADDRESS')) {
    return 'Invalid recipient wallet address.';
  }

  // Horizon HTTP errors
  const httpStatus = err?.response?.status;
  if (httpStatus === 429) return 'Network is busy. Please wait a moment and try again.';
  if (httpStatus === 503) return 'Stellar network is temporarily unavailable. Please try again later.';

  return 'Payment processing failed. Please try again.';
}
