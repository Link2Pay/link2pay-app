# Phase 1 — AnchorAdapter interface + TestAnchorAdapter (the real SEP integration)

> Prereq: read `_CONTEXT.md`. Phase 0 done. This is the genuine, load-bearing SEP integration.

## Goal
One adapter interface that all anchor interaction goes through, plus a real implementation against the
live SDF test anchor using `@stellar/typescript-wallet-sdk`.

## CONFIRM FIRST (do not invent signatures)
Fetch and quote the real APIs before coding:
- wallet-sdk README / `developers.stellar.org` for `anchor()`, `sep10().authenticate()`, `sep38().requestQuote()`,
  `sep24().withdraw()`, and the `Watcher`/`getTransactionBy` signatures.
- The exact SEP-24 withdraw-exchange response fields (`withdraw_anchor_account`, `withdraw_memo`, `memo_type`).
- Whether testanchor SEP-38 quotes a COP pair. If it does NOT → FALLBACK: implement a plain SEP-24 USDC
  withdrawal for the real leg and mark the FX/COP leg as mocked; keep Anchor Platform as the named integration.

## Files
- `backend/src/anchors/AnchorAdapter.ts` — interface + types.
- `backend/src/anchors/adapters/TestAnchorAdapter.ts`.
- `backend/src/anchors/__tests__/testAnchor.integration.ts` (or a runnable script under `backend/scripts/`).

## Interface (from spec §2.2 — implement exactly)
```ts
export type AnchorStatus = 'INITIATED'|'AWAITING_PAYMENT'|'PAYMENT_DETECTED'|'SETTLING'|'SETTLED'|'ERROR'|'EXPIRED';
export interface Quote { quoteId; sellAsset; buyAsset; sellAmount; buyAmount; rate; feeTotal; expiresAt; } // all string
export interface OffRampIntent { anchorTxId; interactiveUrl?; depositAddress; memo; memoType:'text'|'id'|'hash'; asset; amount; }
export interface AnchorAdapter {
  readonly id: 'testnet'|'mock-breb'|'abroad';
  getQuote(p:{sellAmount:string; buyCurrency:'COP'; payoutAlias:string}): Promise<Quote>;
  initiateOffRamp(p:{quoteId:string; receiverAccount:string; payoutAlias:string}): Promise<OffRampIntent>;
  getStatus(anchorTxId:string): Promise<AnchorStatus>;
}
```

## TestAnchorAdapter steps
1. SEP-1 discovery via `wallet.anchor({ homeDomain: config.ANCHOR_HOME_DOMAIN }).getInfo()`.
2. SEP-10 auth: `const sep10 = await anchor.sep10(); const authToken = await sep10.authenticate({ accountKp })`.
   Testnet `SigningKeypair` for the receiver is acceptable for the demo. Store JWT only for the SEP flow lifetime.
3. SEP-38 quote: `anchor.sep38(authToken).requestQuote({ sell_asset, buy_asset, sell_amount, context })`. Map → `Quote`.
4. SEP-24 interactive withdraw with the quote → `{ interactiveUrl, anchorTxId }`. At `pending_user_transfer_start`,
   extract `withdraw_anchor_account` + `withdraw_memo` (+ `memo_type`) → `OffRampIntent`.
5. `getStatus`: poll via Watcher/`getTransactionBy`; normalize anchor status strings → `AnchorStatus`.

## Acceptance Criteria
- [ ] Integration run against live testanchor obtains: a JWT, a firm SEP-38 quote (id + rate before expiry),
      an interactive URL, and a deposit address + memo. Log the full transcript.
- [ ] `getStatus` polling reaches a terminal state in the test.
- [ ] If SEP-38/withdraw-exchange COP is unavailable, the fallback path is implemented and clearly documented in the file header.

## Commit
`git commit -m "feat(offramp): phase 1 — AnchorAdapter + TestAnchorAdapter (real SEP-10/38/24)"`
