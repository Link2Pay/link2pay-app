/**
 * OPTIONAL fallback: seed XLM↔USDC liquidity on TESTNET for path payments.
 *
 * Usually NOT needed — testnet already has a deep native/USDC (XLM/USDC) AMM
 * pool, so Horizon finds an XLM→USDC route out of the box. Use this only for
 * thin pairs (e.g. EURC/USDC) or if the pool drains.
 *
 * Posts two SDEX offers from a funded account that holds XLM + faucet USDC,
 * adding the USDC trustline first if needed. DEMO liquidity only —
 * on mainnet you rely on real market depth, never self-seeded offers.
 *
 * Usage:
 *   SEED_SECRET=S...  ts-node scripts/seed-liquidity.ts
 *   (optional) SEED_PRICE=0.10  SEED_AMOUNT=2000
 *
 * Prereqs for the SEED_SECRET account:
 *   - Funded with XLM (friendbot)
 *   - Holds testnet USDC (Circle faucet → select Stellar)
 */
import {
  Horizon,
  Keypair,
  Asset,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk';

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

async function main() {
  const secret = process.env.SEED_SECRET;
  if (!secret) throw new Error('Set SEED_SECRET to a funded testnet secret (XLM + USDC).');

  const price = process.env.SEED_PRICE || '0.10'; // USDC per XLM (~$0.10)
  const usdcAmount = process.env.SEED_AMOUNT || '2000'; // USDC to offer
  const xlmAmount = process.env.SEED_XLM_AMOUNT || '20000'; // XLM to offer

  const server = new Horizon.Server(HORIZON_URL);
  const kp = Keypair.fromSecret(secret);
  const usdc = new Asset('USDC', USDC_ISSUER);

  const account = await server.loadAccount(kp.publicKey());
  const hasTrustline = account.balances.some(
    (b: any) => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
  );

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (!hasTrustline) {
    console.log('Adding USDC trustline…');
    builder.addOperation(Operation.changeTrust({ asset: usdc }));
  }

  // Sell USDC for XLM (lets XLM→USDC path payments consume USDC).
  builder.addOperation(
    Operation.manageSellOffer({
      selling: usdc,
      buying: Asset.native(),
      amount: usdcAmount,
      price: (1 / parseFloat(price)).toFixed(7), // XLM per USDC
      offerId: '0',
    })
  );

  // Sell XLM for USDC (the reverse direction).
  builder.addOperation(
    Operation.manageSellOffer({
      selling: Asset.native(),
      buying: usdc,
      amount: xlmAmount,
      price, // USDC per XLM
      offerId: '0',
    })
  );

  const tx = builder.setTimeout(120).build();
  tx.sign(kp);
  const res = await server.submitTransaction(tx);
  console.log('✅ Liquidity seeded. tx:', res.hash);
  console.log(`   Selling ${usdcAmount} USDC and ${xlmAmount} XLM around ${price} USDC/XLM.`);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e?.response?.data?.extras?.result_codes || e?.message || e);
  process.exit(1);
});
