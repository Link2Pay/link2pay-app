// Stellar base-reserve math shared by the Send and Funding Link flows.
// An account locks 1 XLM base + 0.5 XLM per subentry (trustline, offer,
// data entry, extra signer); `headroom` keeps a margin for transaction fees.

export function spendableXlm(totalXlm: number, subentryCount: number, headroom = 0.1): number {
  return Math.max(0, totalXlm - (1 + 0.5 * subentryCount) - headroom);
}
