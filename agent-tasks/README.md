# agent-tasks — runnable phase prompts for the anchor off-ramp

These files turn `IMPLEMENTATION_PLAN.md` into **self-contained prompts** an AI coding agent
(e.g. Claude Code running the DeepSeek model) can execute one at a time. Each phase file restates
the context it needs, so you can feed it to the agent on its own.

## Order
```
phase-00-setup-upgrade.md      # REQUIRED first (stellar-sdk v12→v15 + deps + config)
phase-01-test-anchor.md        # AnchorAdapter interface + real SEP integration
phase-02-offramp-flow.md       # payer-pays-with-memo + state machine + endpoints
phase-03-mock-breb.md          # demo hero rail (labeled simulated)
phase-04-soroban-receipt.md    # on-chain receipt contract (cuttable)
phase-05-path-payments.md      # pay in any asset (feature-flagged)
phase-06-wallets-kit.md        # broaden wallet support
phase-07-reflector-preview.md  # optional FX preview
phase-08-checkout-button.md    # optional embeddable button
phase-09-deploy.md             # Vercel + Render
phase-10-readme-docs.md        # README + ARCHITECTURE + DEMO
```

## How to run with Claude Code + DeepSeek
1. Point Claude Code at the DeepSeek model (e.g. set `ANTHROPIC_BASE_URL` / `ANTHROPIC_MODEL` to your
   DeepSeek-compatible endpoint, or use a DeepSeek model alias in your settings). Verify with a trivial prompt.
2. Create the branch once: `git checkout -b feat/anchor-offramp`.
3. For each phase, give the agent this exact instruction:
   > Read `agent-tasks/_CONTEXT.md` then `agent-tasks/phase-00-setup-upgrade.md`. Do ONLY that phase.
   > Run its Acceptance Criteria and report PASS/FAIL with evidence. Then stop.
4. Review the diff. If AC pass, commit and move to the next phase file.

## Priority if time runs short (spec §11)
Phases 1–3 > 9 > 10 > 4 > 6 > 5 > 7–8. A flawless SEP flow + clean deploy + honest mock beats a
half-working contract.

## DeepSeek-specific notes
- DeepSeek has no memory of the design discussion — `_CONTEXT.md` is its only source of truth. Always
  have it read `_CONTEXT.md` first.
- It is prone to inventing API signatures. For every item under "CONFIRM AT BUILD TIME" in `_CONTEXT.md`,
  require it to fetch the live doc/README first and quote the real signature before writing code.
- Keep it to ONE phase per session to avoid scope drift.
