// Transaction builders for funding links ("reverse payment links").
//
// Mechanism: a throwaway escrow account whose secret key travels only in the
// claim URL's fragment. The sender funds it and becomes co-signer (reclaim);
// the claim page sweeps it to whoever connects, signed with the fragment key.
// Every sweep drops the escrow's trustline and co-signer subentries before
// account_merge (merge fails while subentries exist) — signature checks
// happen before ops apply, so removing a signer mid-transaction is safe.
//
// The escrow pays all claim fees, so a recipient with zero XLM works, and the
// merge hands the deposit XLM to the recipient — covering the reserves a
// brand-new account needs. All claim variants are single atomic transactions.
import {
  Asset,
  BASE_FEE,
  Horizon,
  Operation,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

export type FundingAsset = 'XLM' | 'USDC';

export interface FundingSpec {
  asset: FundingAsset;
  amount: string; // decimal string, e.g. '25'
  usdcIssuer: string;
  networkPassphrase: string;
}

// USDC escrow: 2.0 own reserves (base 1 + trustline 0.5 + co-signer 0.5)
// + 1.6 to activate an unfunded recipient at claim time + fee headroom.
export const USDC_ESCROW_XLM = '3.7';
// XLM escrow: 1.5 own reserves (base 1 + co-signer 0.5) + fee headroom.
export const XLM_ESCROW_EXTRA = 1.6;
// Starting balance for a recipient account born at claim time: base reserve
// 1 + USDC trustline 0.5 + margin.
const RECIPIENT_ACTIVATION_XLM = '1.6';
// Top-up for a funded recipient whose spendable XLM can't cover the 0.5
// trustline reserve.
const TRUSTLINE_TOPUP_XLM = '0.6';

function usdcAsset(spec: FundingSpec): Asset {
  return new Asset('USDC', spec.usdcIssuer);
}

export function escrowStartingBalance(spec: FundingSpec): string {
  if (spec.asset === 'USDC') return USDC_ESCROW_XLM;
  return (parseFloat(spec.amount) + XLM_ESCROW_EXTRA).toFixed(7).replace(/\.?0+$/, '');
}

/**
 * One sender-signed transaction that births the escrow: create_account,
 * (USDC) trustline + payment, and set_options adding the sender as an equal
 * co-signer so the dashboard can reclaim without the link.
 * Caller signs with the sender wallet AND the escrow keypair.
 */
export function buildCreateEscrowTx(
  sender: Horizon.AccountResponse,
  senderKey: string,
  escrowKey: string,
  spec: FundingSpec
): Transaction {
  const builder = new TransactionBuilder(sender, {
    fee: BASE_FEE,
    networkPassphrase: spec.networkPassphrase,
  }).addOperation(
    Operation.createAccount({ destination: escrowKey, startingBalance: escrowStartingBalance(spec) })
  );
  if (spec.asset === 'USDC') {
    builder
      .addOperation(Operation.changeTrust({ source: escrowKey, asset: usdcAsset(spec) }))
      .addOperation(
        Operation.payment({ destination: escrowKey, asset: usdcAsset(spec), amount: spec.amount })
      );
  }
  builder.addOperation(
    Operation.setOptions({
      source: escrowKey,
      signer: { ed25519PublicKey: senderKey, weight: 1 },
    })
  );
  return builder.setTimeout(300).build();
}

export type ClaimBranch =
  | { kind: 'unfunded' }
  | { kind: 'noTrustline'; topUp: string | null }
  | { kind: 'ready' };

/**
 * Inspect the recipient on Horizon and pick the claim shape. Re-run right
 * before building — chain state is only trusted at build time.
 */
export async function detectClaimBranch(
  server: Horizon.Server,
  recipient: string,
  spec: FundingSpec
): Promise<ClaimBranch> {
  let account: Horizon.AccountResponse;
  try {
    account = await server.loadAccount(recipient);
  } catch {
    return { kind: 'unfunded' };
  }
  if (spec.asset === 'XLM') return { kind: 'ready' };

  const line = account.balances.find(
    (b) =>
      'asset_code' in b &&
      b.asset_code === 'USDC' &&
      'asset_issuer' in b &&
      b.asset_issuer === spec.usdcIssuer
  );
  if (line) {
    const limit = parseFloat((line as { limit: string }).limit);
    if (limit - parseFloat(line.balance) < parseFloat(spec.amount)) throw new Error('LINE_FULL');
    return { kind: 'ready' };
  }
  // Funded but trustline-less: the change_trust op needs the recipient to
  // afford its 0.5 reserve at apply time, so short accounts get a top-up
  // payment from the escrow first (same atomic transaction).
  const native = account.balances.find((b) => b.asset_type === 'native');
  const spendable =
    parseFloat(native?.balance ?? '0') - (1 + 0.5 * account.subentry_count);
  return { kind: 'noTrustline', topUp: spendable < 0.6 ? TRUSTLINE_TOPUP_XLM : null };
}

/** Only a change_trust sourced by the recipient requires their signature. */
export function needsRecipientSignature(spec: FundingSpec, branch: ClaimBranch): boolean {
  return spec.asset === 'USDC' && branch.kind !== 'ready';
}

/**
 * The sweep: escrow is the transaction source (and fee payer — a zero-XLM
 * recipient works). Ends by removing the co-signer and merging the escrow
 * into the recipient, so the deposit XLM lands with them.
 */
export function buildClaimTx(
  escrow: Horizon.AccountResponse,
  coSigner: string,
  recipient: string,
  branch: ClaimBranch,
  spec: FundingSpec
): Transaction {
  const builder = new TransactionBuilder(escrow, {
    fee: BASE_FEE,
    networkPassphrase: spec.networkPassphrase,
  });
  if (spec.asset === 'USDC') {
    if (branch.kind === 'unfunded') {
      builder.addOperation(
        Operation.createAccount({ destination: recipient, startingBalance: RECIPIENT_ACTIVATION_XLM })
      );
    } else if (branch.kind === 'noTrustline' && branch.topUp) {
      builder.addOperation(
        Operation.payment({ destination: recipient, asset: Asset.native(), amount: branch.topUp })
      );
    }
    if (branch.kind !== 'ready') {
      builder.addOperation(Operation.changeTrust({ source: recipient, asset: usdcAsset(spec) }));
    }
    builder
      .addOperation(Operation.payment({ destination: recipient, asset: usdcAsset(spec), amount: spec.amount }))
      .addOperation(Operation.changeTrust({ asset: usdcAsset(spec), limit: '0' }));
  } else if (branch.kind === 'unfunded') {
    builder.addOperation(
      Operation.createAccount({ destination: recipient, startingBalance: spec.amount })
    );
  }
  builder
    .addOperation(Operation.setOptions({ signer: { ed25519PublicKey: coSigner, weight: 0 } }))
    .addOperation(Operation.accountMerge({ destination: recipient }));
  return builder.setTimeout(300).build();
}

/**
 * The reclaim sweep, same shape but destination = creator, signed by the
 * creator's wallet (they are co-signer with weight 1 and thresholds are 0).
 * For USDC the creator must still hold the trustline — they created the link,
 * so they had it; the UI surfaces the rare failure.
 */
export function buildReclaimTx(
  escrow: Horizon.AccountResponse,
  creator: string,
  spec: FundingSpec
): Transaction {
  const builder = new TransactionBuilder(escrow, {
    fee: BASE_FEE,
    networkPassphrase: spec.networkPassphrase,
  });
  if (spec.asset === 'USDC') {
    builder
      .addOperation(Operation.payment({ destination: creator, asset: usdcAsset(spec), amount: spec.amount }))
      .addOperation(Operation.changeTrust({ asset: usdcAsset(spec), limit: '0' }));
  }
  builder
    .addOperation(Operation.setOptions({ signer: { ed25519PublicKey: creator, weight: 0 } }))
    .addOperation(Operation.accountMerge({ destination: creator }));
  return builder.setTimeout(300).build();
}
