/**
 * Maps raw Stellar/Horizon error codes and messages to user-friendly strings.
 * This prevents cryptic SDK errors from being exposed directly to clients.
 */
type StellarResultCodes = {
  transaction?: string;
  operations?: string[];
};

function parseResultCodesFromMessage(message: string): StellarResultCodes | null {
  const marker = 'Transaction failed:';
  const markerIndex = message.indexOf(marker);
  if (markerIndex === -1) return null;

  const payload = message.slice(markerIndex + marker.length).trim();
  if (!payload) return null;

  try {
    const parsed = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as StellarResultCodes;
  } catch {
    return null;
  }
}

function getResultCodes(err: any, message: string): StellarResultCodes {
  const rawResultCodes =
    err?.resultCodes ??
    err?.response?.data?.extras?.result_codes ??
    parseResultCodesFromMessage(message) ??
    {};

  const operations = Array.isArray(rawResultCodes?.operations)
    ? rawResultCodes.operations.filter((code: unknown) => typeof code === 'string')
    : [];

  return {
    transaction:
      typeof rawResultCodes?.transaction === 'string'
        ? rawResultCodes.transaction
        : undefined,
    operations,
  };
}

export function mapStellarError(error: unknown): string {
  if (typeof error !== 'object' || !error) return 'Payment processing failed. Please try again.';

  const err = error as any;
  const message: string = err?.message ?? '';
  const resultCodes = getResultCodes(err, message);
  const opCodes: string[] = resultCodes.operations ?? [];

  if (message.startsWith('Network mismatch:')) {
    return message;
  }

  // Stellar operation result codes
  if (opCodes.includes('op_underfunded')) {
    return 'Insufficient balance. Make sure the wallet has enough XLM for amount, reserve, and fees.';
  }
  if (opCodes.includes('op_no_trust')) {
    return 'Your wallet does not have a trustline for this asset. Please add a trustline in your wallet.';
  }
  if (opCodes.includes('op_no_destination')) {
    return 'Recipient wallet is not activated on this network. It must be funded first.';
  }
  if (opCodes.includes('op_line_full')) {
    return 'The recipient wallet cannot receive more of this asset (limit reached).';
  }
  if (opCodes.includes('op_low_reserve')) {
    return 'Insufficient reserve in the sending wallet. Keep extra XLM above the minimum account reserve.';
  }
  if (opCodes.includes('op_no_issuer')) {
    return 'Asset issuer account was not found on this network.';
  }
  if (opCodes.includes('op_src_no_trust')) {
    return 'Sender wallet does not trust this asset. Add a trustline and try again.';
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
  if (resultCodes.transaction === 'tx_bad_auth') {
    return 'Transaction authorization failed. Please reconnect your wallet and sign again.';
  }
  if (resultCodes.transaction === 'tx_bad_auth_extra') {
    return 'Transaction signature is invalid for this network. Reconnect wallet and retry.';
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
