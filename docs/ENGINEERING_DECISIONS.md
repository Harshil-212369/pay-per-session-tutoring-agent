# Engineering Decisions — Aitch

A decision log. Each entry is a decision, the reasoning behind it, and what it rules out.
Ordered roughly by how load-bearing it is. Ported from the build's working notes.

---

## 1. Split brain vs. engine — the LLM never moves money

**Decision.** `SKILL.md` orchestrates conversation and gating only. All money movement
lives in a deterministic Node engine (`payments/session/pay-session.mjs`) the agent shells
out to.

**Why.** Settlement must be auditable and reproducible, not improvised by an LLM. A
deterministic script with typed error codes and on-chain guards can be reasoned about and
tested; an LLM emitting transfer calls cannot. This also contains the blast radius — the
model never holds a key.

**Rules out.** Any design where the agent constructs or signs transactions inline.

## 2. SDK truth: `GoatX402Client` + `baseUrl`, order-based, does not move money

**Decision.** Build against `new GoatX402Client({ baseUrl, apiKey, apiSecret })` and the
order flow `createOrder → ERC-20 transfer (ethers v6) → waitForConfirmation →
getOrderProof`.

**Why.** `goatx402-sdk-server@0.1.1` is an order-based HTTP API client. The
`x402.middleware()` Express pattern and the `GoatX402` / `apiUrl` naming in some onboarding
docs are **not in the installed package** — confirmed by unpacking the tarball and reading
`src/client.ts`. Building against the docstring would have been dead code. The SDK issues
orders and watches the chain; the on-chain `transfer` moves the money.

**Rules out.** `middleware()`, `apiUrl`, `merchantId`-in-config, and treating the SDK as a
money mover.

## 3. Mainnet host + explicit chain assertion

**Decision.** Base URL is `https://x402-api.goat.network`; every script asserts chain
`2345` before acting.

**Why.** The SDK's example `api.goatx402.io` is a placeholder that fails. Separately, the
`goat-agent` skill template defaults to **Testnet3 (chain 48816)** — a silent "works but
wrong chain" trap. Asserting the chain id turns that into a loud, early failure.

## 4. Two-tier human confirmation (defense in depth)

**Decision.** Below the low-tier cap (0.1 USDC.e) Aitch acts autonomously. Above it — or
for config / receiving-wallet changes — it halts for an explicit typed `CONFIRM PAYMENT`.
The engine *also* requires a separate `--confirm` flag: two independent gates.

**Why.** The bootcamp's flagship mainnet demo required a final human confirm — two-tier
confirmation is the demonstrated norm, not overcaution. Defense in depth means a stray
agent call can't move funds on its own: it would need both the typed phrase and the flag.

**Rules out.** Fully silent autonomous spend at arbitrary amounts.

## 5. Two distinct wallets (payer ≠ merchant)

**Decision.** Use separate payer (B / student) and merchant (A / Aitch) wallets. Scripts
assert `payer != merchant` and that each private key derives its expected address.

**Why.** A self-transfer (payer == merchant == agent) risks the x402 indexer not
confirming cleanly. Two wallets give a clean confirmation and match the real product
topology. This was confirmed against the bootcamp demo, which used a distinct receiver.

**Rules out.** Self-payment as the primary demo path.

## 6. Latency is a first-class branch, not an error case

**Decision.** Treat on-chain settlement latency as expected. Emit an immediate ack and
status pings while polling; on timeout, surface the order's current status, **never send a
second transfer**, and route reconciliation to the portal.

**Why.** On-chain settlement is slow — the #1 UX risk observed in the bootcamp mainnet
demo. The x402 green-flag criterion is explicitly "catches timeouts and explains them
without freezing." A frozen-looking agent reads as broken even when the money moved.

**Evidenced by.** The live Stage-1 settlement: payer
`0xBB086b3b05Cf958c16414A0Bdd9b43A53aDb7087` → merchant
`0x09eE632927821d7B18Ac76Ff743821A30DA7c6bF`, 1 USDC.e, `ERC20_DIRECT`, block 13802564,
tx `0xe89e16dffd7713954b27b0b2e788af6700cea0c9e0346c787e8ec89672b6c7c5`. The indexer
reconciliation lagged past the poll window; the on-chain transfer is irreversible and
confirmed. The `catch` branch in `pay-session.mjs` handles exactly this: it reports the
order status (e.g. `CHECKOUT_VERIFIED`) and tells the operator to reconcile rather than
re-pay. **This is a documented latency characteristic, not a payment failure.**

## 7. Flow allow-list — only `ERC20_DIRECT` auto-executes

**Decision.** Auto-execute only `ERC20_DIRECT`. `ERC20_3009` (gasless EIP-712) and
`ERC20_APPROVE_XFER` halt with an explicit unsupported-flow error.

**Why.** Guessing an EIP-712 signature or approve calldata is exactly the kind of wrong
on-chain action that fails unsafe. Halting is correct until each flow is implemented and
tested. Aitch's merchant is `DIRECT`.

## 8. Decimals read on-chain, never assumed at settle

**Decision.** Assume 6 decimals at quote time, but read `decimals()` on-chain at settle
and abort on mismatch.

**Why.** Sending a wrong amount because a token had unexpected decimals is unrecoverable.
Failing safe costs one RPC call.

## 9. Secrets from `process.env` only; caps enforced in code

**Decision.** All scripts read keys/secrets from `process.env` (loaded from the vault into
the daemon at startup). Spend caps are enforced in code at both quote and settle; the
daily cap is summed from an append-only ledger counting only settled rows.

**Why.** The agent process never reads the private key from disk directly, and caps that
live in code can't be talked around by the conversation layer. Private-key hygiene is a
scored differentiator — the bootcamp flagged a demo that printed a raw key in plaintext
Telegram as an anti-pattern.

**Rules out.** Committing `.env`/vault contents; trusting the LLM to respect a cap.

## 10. Single-chain — no cross-chain settlement logic

**Decision.** Stay on chain `2345`, `USDC.e` only. No bridging, no multi-chain routing.

**Why.** "No-bridge multi-chain native assets" is a GOAT marketing claim, not a
requirement for this product. Designing for cross-chain would add settlement complexity
with no user benefit for a single-course tutoring session.

## 11. Naming discipline — one canonical engine

**Decision.** The canonical, tested engine is **`pay-session.mjs`**. The earlier
`session-pay.mjs` draft is **not** shipped. Diagnostics are read-only and clearly
separated under `payments/diagnostics/`.

**Why.** Two near-identically named scripts is a footgun — someone runs the wrong one. One
canonical money-mover, dry-run by default, with the drafts kept out of the repo.

---

## Artifacts to ignore (from bootcamp source material)

Recorded so nobody re-introduces them:

- **`X42` / `X402`** — the same thing; only **x402** is real.
- **`EIP-8183`** — OKX's on-chain task system; irrelevant to this stack.
- **"No-bridge multi-chain"** — GOAT marketing; Aitch is single-chain by decision #10.
- **`Privy` for wallet-gen** — Aitch self-custodies via the vault; no reason to switch.
- **`x402.middleware()` / `GoatX402` / `apiUrl`** — wrong SDK surface; see decision #2.
