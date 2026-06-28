# RUN ALL PHASES — autonomous master prompt

Paste this whole file as the instruction to the DeepSeek-backed coding agent. It runs every phase end
to end, gating on Acceptance Criteria, committing after each. You are already on branch `feat/anchor-offramp`.

---

## Operating rules (follow exactly)
1. FIRST, read `agent-tasks/_CONTEXT.md` in full. It is your only source of truth for repo paths,
   verified facts, and guardrails. Re-read its guardrails before each phase.
2. Execute phases IN ORDER: 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10.
   For each phase, read `agent-tasks/phase-NN-*.md` and do exactly what it says.
3. **AC gate:** after a phase, run its Acceptance Criteria and print a `PHASE NN RESULT: PASS/FAIL`
   block with evidence (command output, tx hashes, logs). 
   - If PASS → `git add -A && git commit -m "<the phase's commit message>"`, then continue.
   - If FAIL → attempt up to 2 fixes. If still failing, STOP and print exactly what blocked you and
     what you tried. Do NOT proceed to the next phase on a hard failure (except the cuttable phases below).
4. **CONFIRM-FIRST rule:** wherever a phase lists "CONFIRM FIRST" / "CONFIRM AT BUILD TIME", fetch the
   live doc/README and quote the real API signature BEFORE writing code. Never invent a signature.
5. **Cuttable phases:** Phase 04 (Soroban) and Phases 05/06/07/08 are optional. If one cannot pass after
   2 fix attempts, CUT it cleanly (revert its partial work so the build stays green), note it, and
   CONTINUE to the next phase. Phases 00, 01, 02, 03, 09, 10 are NOT cuttable — stop if they fail.
6. **Hard stops (never work around):** do not custody funds or hold keys; do not reuse the app session
   token as the SEP-10 JWT; do not weaken existing security middleware; never claim real pesos moved.
   If a step seems to require any of these, STOP and report.
7. Keep going phase to phase without asking for confirmation between phases, unless a non-cuttable phase
   hard-fails or a guardrail would be violated.

## Priority if you run low on time/budget (spec §11)
Guarantee Phases 01–03 (real SEP flow + mock Bre-B) and 09 (deploy) and 10 (docs) first. Then 04, 06, 05,
07, 08 in that order. A flawless SEP flow + clean deploy + honest mock beats a half-working contract.

## Final report
After Phase 10 (or on a hard stop), print a summary table: phase | PASS/FAIL/CUT | evidence/commit hash.
List any deviations from `_CONTEXT.md` you discovered (e.g. a corrected API signature) so a human can review.

---
Begin now: read `agent-tasks/_CONTEXT.md`, then start Phase 00.
