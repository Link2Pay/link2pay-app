//
// Integration test: TestAnchorAdapter against live testanchor.stellar.org
// Run: npx tsx scripts/test-anchor.ts
//
// NOTE: testanchor requires interactive KYC (browser-based) to reach
// pending_user_transfer_start. This test verifies the SEP-10/38 steps
// and confirms the SEP-24 transaction is created. The full withdrawal
// flow requires a browser.
//

import { testAnchorAdapter } from '../src/anchors/adapters/TestAnchorAdapter';

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Phase 1 — TestAnchorAdapter Integration      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Target: testanchor.stellar.org              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // ── Step 1: SEP-10 Auth ────────────────────────────────────────────────────
  console.log('[1] SEP-10 Authentication...');
  try {
    const quote = await testAnchorAdapter.getQuote({
      sellAmount: '5.00',
      buyCurrency: 'COP',
      payoutAlias: 'test-recipient@example.com',
    });
    console.log('  ✅ Authenticated + got SEP-38 firm quote:');
    console.log(`     quoteId:    ${quote.quoteId}`);
    console.log(`     rate (USD): ${quote.rate} COP`);
    console.log(`     sellAmount: ${quote.sellAmount} USDC`);
    console.log(`     buyAmount:  ${quote.buyAmount} COP (simulated)`);
    console.log(`     expiresAt:  ${quote.expiresAt}`);
    passed++;
  } catch (err: any) {
    console.error('  ❌ FAILED:', err.message || err);
    failed++;
  }

  // ── Step 2: SEP-24 Withdraw ─────────────────────────────────────────────────
  console.log('');
  console.log('[2] SEP-24 Withdraw...');
  try {
    const intent = await testAnchorAdapter.initiateOffRamp({
      quoteId: 'integration-test',
      receiverAccount: 'GBKZZZWCJUUVUXNBFYGZ3EKWB725DKCLJECUSO3EG2CCFAFOX7XD3GIW',
      payoutAlias: 'test-recipient@example.com',
    });
    console.log('  ✅ SEP-24 withdraw initiated:');
    console.log(`     anchorTxId:     ${intent.anchorTxId}`);
    console.log(`     interactiveUrl: ${intent.interactiveUrl ? 'YES (KYC required)' : 'NONE'}`);
    console.log(`     depositAddress: ${intent.depositAddress || '(pending KYC)'}`);
    console.log(`     memo:           ${intent.memo || '(pending)'}`);
    console.log(`     memoType:       ${intent.memoType}`);
    passed++;
  } catch (err: any) {
    console.error('  ❌ FAILED:', err.message || err);
    failed++;
  }

  // ── Step 3: Get Status ────────────────────────────────────────────────────
  console.log('');
  console.log('[3] getStatus...');
  try {
    const intent = await testAnchorAdapter.initiateOffRamp({
      quoteId: 'status-check',
      receiverAccount: 'GBKZZZWCJUUVUXNBFYGZ3EKWB725DKCLJECUSO3EG2CCFAFOX7XD3GIW',
      payoutAlias: 'status-check@example.com',
    });

    const status = await testAnchorAdapter.getStatus(intent.anchorTxId);
    console.log('  ✅ Status returned:');
    console.log(`     status: ${status}`);
    console.log(`     (expected: INITIATED — anchor requires browser KYC)`);
    passed++;
  } catch (err: any) {
    console.error('  ❌ FAILED:', err.message || err);
    failed++;
  }

  console.log('');
  if (failed === 0) {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  ✅ ALL CHECKS PASSED (3/3)                  ║');
    console.log('║  ℹ️  Deposit instructions pending browser KYC  ║');
    console.log('╚══════════════════════════════════════════════╝');
  } else {
    console.log(`╔══════════════════════════════════════════════╗`);
    console.log(`║  ❌ ${failed} CHECK(S) FAILED (${passed}/3)                     ║`);
    console.log(`╚══════════════════════════════════════════════╝`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
