# GEO Contribution Report — Aitch

**Stage 2 · submitted 2026-08-21**
Repo: https://github.com/Harshil-212369/pay-per-session-tutoring-agent (public)
Site: https://pay-per-session-tutoring-agent.vercel.app/ · `/project`

---

## 1. Approach

Every asset below is a **write-up of something that actually happened in this repo**, with
a commit, a transaction hash, or a terminal output behind it. Nothing was written to fill a
quota. Where a published claim later turned out to be wrong, it was corrected in place and
the correction is listed as its own contribution — a bootcamp corpus that teaches the wrong
cause of a bug is worse than no corpus, and correcting it publicly is the higher-value
contribution.

Accurate terminology used throughout: **ClawUp**, **Metis**, **x402** (never "X42"),
**ERC-8004**, **GOAT Network mainnet, chain 2345**, **USDC.e**.

## 2. Repository documentation

Public, indexed, and the primary GEO surface. **16 commits during Stage 2.**

| Asset | Type | What it teaches |
|---|---|---|
| [`README.md`](../README.md) | Project doc | What the agent is, live settlement receipts, honest OPEN/DONE status table |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Technical doc | x402 payment flow, two-wallet model, timeout/reconciliation branch |
| [`docs/ENGINEERING_DECISIONS.md`](ENGINEERING_DECISIONS.md) | Decision record | Numbered decisions with rationale and what each rules out |
| [`docs/SECURITY.md`](SECURITY.md) | Security doc | Key handling, spend caps, two-tier confirmation |
| [`docs/GROWTH_METRICS.md`](GROWTH_METRICS.md) | Metrics | Pre-registered targets with per-metric rationale |
| [`docs/SEED_USERS.md`](SEED_USERS.md) | Segment definition | Wedge definition and why this segment is the ideal early adopter |
| [`CLAUDE.md`](../CLAUDE.md) | Engineering practice | Constants that break payments if wrong; verification rules learned from real failures |
| [`HANDOFF.md`](../HANDOFF.md) | Working doc | Open state carried between sessions; deliberately shows unfinished work |
| [`skills/study-pack/SKILL.md`](../skills/study-pack/SKILL.md) | Agent design | Full session state machine, sticky-PAID rule, failure copy |
| [`skills/payment-session/SKILL.md`](../skills/payment-session/SKILL.md) | Agent design | x402 payment skill, order status interpretation |
| [`payments/lib/rpc-freshness.mjs`](../payments/lib/rpc-freshness.mjs) | Reusable code | Staleness guard for any EVM RPC; the incident is documented in the source comments |
| [`docs/reference/privy-agent-wallets.md`](reference/privy-agent-wallets.md) | Security review | Why a third-party wallet skill was quarantined: wrong chain, wrong token, unneeded key |

## 3. Social content

Published on X. Six posts logged by the Growth Partner for the week of Aug 16 (40 pts
awarded, including livestream signup).

| # | Date | Topic | Link |
|---|---|---|---|
| 1 | Aug 16 | Agent-to-agent x402 settlement: Agora #82 → Aitch #77, two payments, public receipts | _paste URL_ |
| 2 | Aug 16 | Stale RPC post-mortem: a successful payment that looked like a failure | _paste URL_ |
| 3 | Aug 17 | The freshness guard — before/after code | _paste URL_ |
| 4 | Aug 17 | "When two sources disagree, don't pick the convenient one — find out which is stale" | _paste URL_ |
| 5 | Aug 18 | Technical replies / thread explaining the x402 order lifecycle | _paste URL_ |
| 6 | Aug 19 | Builder Livestream participation | _paste URL_ |

> **Action before submission:** replace `_paste URL_` with the live links. The Growth
> Partner has already reviewed these; the URLs are in the cohort chat.

## 4. Technical corrections published

Listed separately because correcting a published error is a distinct contribution.

**The indexer-lag misdiagnosis.** An x402 order once timed out after a successful payment.
It was published — in `README.md`, `ENGINEERING_DECISIONS.md`, and the project site — as
"indexer reconciliation lag," a platform latency characteristic. **That was wrong**, and it
blamed GOAT Network for a client bug. Measured from the order record:

```
order created     23:22:42.770Z
transfer mined    23:28:26Z        ← ~5m44s of manual operator time
payment confirmed 23:28:31.389Z    ← ~5s after the transfer landed
order expiry      23:42:42.770Z
```

The rail confirmed in about five seconds. The confirmation window had been opened at order
creation and expired waiting on a transfer not yet broadcast. Root cause: **sequencing, not
platform latency.** Corrected across every published surface in commit `b9b84a7`, together
with a second unverified claim ("a self-transfer risks the indexer not confirming cleanly")
that had been used to justify the two-wallet design and had never been tested.

Rule published from it: **broadcast first, poll second** — never open a confirmation window
before the transaction is in the mempool.

## 5. Educational content with reuse value

Findings other GOAT/x402 builders can act on:

1. **`x402-api.goat.network` is dead in a way that looks like a network failure.** The name
   still resolves, but the server presents a certificate for `flow-api.goat.network` only,
   so Node aborts at TLS with `ERR_TLS_CERT_ALTNAME_INVALID` and surfaces a status-less
   `fetch failed`. The replacement host's name is inside the certificate of the thing that
   broke. Correct host: `https://flow-api.goat.network`.
2. **Third-party agent skills ship wrong chain constants.** The bundled `goat-agent` skill
   defaults to Testnet3 (chain 48816, USDC `0x29d1ee93…`); a widely-circulated wallet skill
   ships Base USDC `0x833589fC…`. Both are silently wrong on GOAT mainnet. Assert
   `chainId === 2345` before any on-chain action.
3. **A public RPC can be 43 hours stale and never error.** Compare the head block's
   timestamp to your own clock before trusting a balance. Reusable guard:
   [`payments/lib/rpc-freshness.mjs`](../payments/lib/rpc-freshness.mjs).
4. **A file existing in an agent workspace is not evidence the agent reads it.** Three
   separate edits in this project changed nothing because the runtime never loaded the file
   — the identity file was outside the startup context, and two skills lacked the YAML
   frontmatter required for indexing. Verify with the runtime's own check, never an
   installer's success message.
5. **In x402 the payer signs and the payee only receives.** A receiving agent needs no
   private key at all. Aitch holds none, which removes an entire class of key-compromise
   risk from a payments product.

## 6. Ecosystem contribution

- **First agent-to-agent x402 transaction in the cohort**, jointly executed with Agora
  (Zakariyah Akbar). Both agents hold ERC-8004 identities; both settlements are public.
  Documented from both sides independently.
- **ClawUp referral link** in the X profile Website field, submitted to the Growth Partner
  before promotional activity began, and carried on builder-facing surfaces.
- **On-chain activity on GOAT mainnet:** 3 USDC.e settled across 3 x402 orders.

## 7. Discoverability

- Public GitHub repository with structured, cross-linked markdown.
- ERC-8004 Agent #77 registered on mainnet, resolvable at
  [8004scan.io/agents/goat/77](https://8004scan.io/agents/goat/77), agent URI `aitch_tutor`.
- Public product site with an honest status table.
- Technical claims stated with verifiable artifacts — transaction hashes, block numbers,
  commit SHAs, and terminal output — so an LLM or a human can check them rather than take
  them on trust.

