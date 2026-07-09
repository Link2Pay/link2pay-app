import { describe, it, expect, vi } from 'vitest';
import { verifyEscrowFunded, resolveSweepStatus } from './fundingLinkService';

const ESCROW = 'GBUMVWB7KO2R25AJHZP6V3HI4PNQNBNNZIR4BJMPN2NUZZN5ER3IQMO3';
const CREATOR = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const CLAIMER = 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2';
const TESTNET = 'Test SDF Network ; September 2015';
// Circle USDC issuer on testnet — must match backend NETWORK_CONFIG
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

function fakeServer(opts: { account?: any; operations?: any[] }) {
  return {
    loadAccount: vi.fn(async () => {
      if (!opts.account) throw Object.assign(new Error('Not Found'), { response: { status: 404 } });
      return opts.account;
    }),
    operations: () => ({
      forAccount: () => ({
        order: () => ({
          limit: () => ({ call: async () => ({ records: opts.operations ?? [] }) }),
        }),
      }),
    }),
  } as any;
}

describe('verifyEscrowFunded', () => {
  it('accepts an XLM escrow holding at least the amount', async () => {
    const server = fakeServer({
      account: { balances: [{ asset_type: 'native', balance: '26.6000000' }] },
    });
    await expect(
      verifyEscrowFunded(server, { escrowAccount: ESCROW, asset: 'XLM', amount: '25', networkPassphrase: TESTNET })
    ).resolves.toBe(true);
  });

  it('accepts a USDC escrow with trustline and balance', async () => {
    const server = fakeServer({
      account: {
        balances: [
          { asset_type: 'native', balance: '3.7000000' },
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: USDC_ISSUER, balance: '10.0000000' },
        ],
      },
    });
    await expect(
      verifyEscrowFunded(server, { escrowAccount: ESCROW, asset: 'USDC', amount: '10', networkPassphrase: TESTNET })
    ).resolves.toBe(true);
  });

  it('rejects a USDC escrow missing the trustline or short on balance', async () => {
    const server = fakeServer({
      account: { balances: [{ asset_type: 'native', balance: '3.7000000' }] },
    });
    await expect(
      verifyEscrowFunded(server, { escrowAccount: ESCROW, asset: 'USDC', amount: '10', networkPassphrase: TESTNET })
    ).resolves.toBe(false);
  });

  it('rejects when the escrow account does not exist', async () => {
    const server = fakeServer({ account: null });
    await expect(
      verifyEscrowFunded(server, { escrowAccount: ESCROW, asset: 'XLM', amount: '1', networkPassphrase: TESTNET })
    ).resolves.toBe(false);
  });
});

describe('resolveSweepStatus', () => {
  it('returns null while the escrow account is still alive', async () => {
    const server = fakeServer({ account: { balances: [] } });
    await expect(resolveSweepStatus(server, { escrowAccount: ESCROW, creatorWallet: CREATOR })).resolves.toBeNull();
  });

  it('returns CLAIMED when the escrow was merged into a third party', async () => {
    const server = fakeServer({
      account: null,
      operations: [
        { type: 'payment', source_account: ESCROW, transaction_hash: 'aa'.repeat(32) },
        { type: 'account_merge', source_account: ESCROW, account: ESCROW, into: CLAIMER, transaction_hash: 'bb'.repeat(32) },
      ],
    });
    await expect(resolveSweepStatus(server, { escrowAccount: ESCROW, creatorWallet: CREATOR })).resolves.toEqual({
      status: 'CLAIMED',
      claimedBy: CLAIMER,
      claimTxHash: 'bb'.repeat(32),
    });
  });

  it('returns RECLAIMED when the escrow was merged back into its creator', async () => {
    const server = fakeServer({
      account: null,
      operations: [{ type: 'account_merge', source_account: ESCROW, account: ESCROW, into: CREATOR, transaction_hash: 'cc'.repeat(32) }],
    });
    await expect(resolveSweepStatus(server, { escrowAccount: ESCROW, creatorWallet: CREATOR })).resolves.toEqual({
      status: 'RECLAIMED',
      claimedBy: CREATOR,
      claimTxHash: 'cc'.repeat(32),
    });
  });

  it('returns null when the account is gone but no merge is found', async () => {
    const server = fakeServer({ account: null, operations: [] });
    await expect(resolveSweepStatus(server, { escrowAccount: ESCROW, creatorWallet: CREATOR })).resolves.toBeNull();
  });
});
