// Horizon-side truth for funding links. The DB status is advisory; these
// helpers are the only way status transitions happen. Pure Horizon logic —
// the Prisma writes stay in the route layer so this file tests without a DB.
import StellarSdk from '@stellar/stellar-sdk';
import { getAssetIssuer, getHorizonUrl } from '../config';

type HorizonServer = StellarSdk.Horizon.Server;

export function serverFor(networkPassphrase: string): HorizonServer {
  return new StellarSdk.Horizon.Server(getHorizonUrl(networkPassphrase));
}

/**
 * True when the escrow account exists on-chain and holds at least `amount`
 * of the link's asset (with the canonical issuer for USDC).
 */
export async function verifyEscrowFunded(
  server: HorizonServer,
  params: { escrowAccount: string; asset: 'XLM' | 'USDC'; amount: string; networkPassphrase: string }
): Promise<boolean> {
  let account: Awaited<ReturnType<HorizonServer['loadAccount']>>;
  try {
    account = await server.loadAccount(params.escrowAccount);
  } catch {
    return false;
  }
  const want = parseFloat(params.amount);
  if (params.asset === 'XLM') {
    const native = account.balances.find((b: any) => b.asset_type === 'native');
    return !!native && parseFloat(native.balance) >= want;
  }
  const issuer = getAssetIssuer('USDC', params.networkPassphrase);
  const line = account.balances.find(
    (b: any) => b.asset_code === 'USDC' && b.asset_issuer === issuer
  );
  return !!line && parseFloat((line as any).balance) >= want;
}

/**
 * If the escrow account has been merged away, find the account_merge in its
 * (still-served) history and classify it: merged into the creator means the
 * sender reclaimed; anything else is a claim.
 */
export async function resolveSweepStatus(
  server: HorizonServer,
  link: { escrowAccount: string; creatorWallet: string }
): Promise<{ status: 'CLAIMED' | 'RECLAIMED'; claimedBy: string; claimTxHash: string } | null> {
  try {
    await server.loadAccount(link.escrowAccount);
    return null; // still alive — not swept
  } catch {
    // fall through: account gone (or Horizon hiccup — the merge search below
    // returns null in that case and we simply try again on the next read)
  }
  let records: any[];
  try {
    const page = await server.operations().forAccount(link.escrowAccount).order('desc').limit(50).call();
    records = page.records;
  } catch {
    return null;
  }
  const merge = records.find(
    (r: any) => r.type === 'account_merge' && r.source_account === link.escrowAccount
  );
  if (!merge) return null;
  const into: string = (merge as any).into;
  return {
    status: into === link.creatorWallet ? 'RECLAIMED' : 'CLAIMED',
    claimedBy: into,
    claimTxHash: merge.transaction_hash,
  };
}
