# HANDOFF

Open state for Aitch. Update at the end of every session. Read at the start of every session.

**Last updated:** 2026-08-06

## Deadlines

| What | When | Days left |
|---|---|---|
| #ClawToTheTop challenge | Aug 10 – Aug 21 | starts in 4 |
| Stage 2 deliverables (3 reports) | **Aug 21** | **15** |
| Demo Day | Aug 26 | 20 |

Three reports due Aug 21: Product Growth, Seed User Feedback (10–20 users), GEO Contribution.

## Where things live — read this before assuming

| Thing | Location | Notes |
|---|---|---|
| Live agent runtime | WSL `~/.openclaw/workspace/` | `SOUL.md`, `AGENTS.md`, `USER.md`, `.claude/skills/` |
| Payment code | **Windows only** — this repo | **Never cloned into WSL.** See "Open" below. |
| Claude Project KB | `forClaudeCode/` | gitignored — does NOT travel with a clone |
| Merchant portal | https://flow-merchant.goat.network | |
| API host | https://flow-api.goat.network | `x402-api` is dead — TLS cert mismatch |

## Done

- **flow-api migration** (commit `90625c7`). Old `x402-api.goat.network` still resolves but
  presents a cert for `flow-api` only → Node aborts at TLS with
  `ERR_TLS_CERT_ALTNAME_INVALID`, surfacing as a status-less `fetch failed`.
  Public route verified live: `merchant-check.mjs` → `LISTED ✓ type=DIRECT`, chain 2345,
  USDC.e matched.
- **gas-check false-green closed.** `STUDENT_ADDRESS || A` meant an unset payer address
  printed wallet A twice and read as a clean two-wallet pass. Now throws when unset *and*
  when it equals A.
- **balance-check parameterized** — takes an address argument; previously hardcoded A only.
- **chain-48816 landmine fixed** (WSL, Aug 2). Three files in the live `goat-agent` skill
  said Testnet3 / chain 48816 / USDC `0x29d1ee93…`. Corrected to mainnet 2345 / USDC.e
  `0x3022b87a…`. Backups `*.bak-testnet3`.
- **Privy skill quarantined** → `docs/reference/privy-agent-wallets.md`. Base-configured,
  carries the Base USDC address our own code warns against, and Aitch needs no spending key.
- **Agent identity fixed** (Aug 6). See "Lesson" below — the fix that mattered was
  `SOUL.md`, not `IDENTITY.md`. Bot now correctly states Agent #77 and wallet A.

## Open

1. **Telegram allowlist** — `channels.telegram.allowFrom: ["8014413141"]`. Two people have
   sent `/start` and are waiting: `8737323083` (@zakariyahakbar), `2105571539` (@shariqshkt).
   **Blocked on:** `openclaw sandbox explain` reports `mode: off`, `runtime: direct`, with
   `exec/process/write` allowed. Admitting an outsider today gives them a shell-capable
   agent on the laptop. Turn the sandbox on before admitting anyone.
2. **No WSL clone of this repo.** `~/aitch` does not exist. Payment code is Windows-only, so
   Aitch cannot execute it. `SOUL.md` Rule 2 forbids execution outside the workspace, so the
   code must land *inside* `~/.openclaw/workspace/`, not at `~/aitch`.
3. **Authenticated flow-api surface untested.** Only `/merchants/<id>` (public) is verified.
   `createOrder` → `PAYMENT_CONFIRMED` has never run against the new host. Treat a 404 on
   order creation as a **path-prefix** problem, not a credentials problem.
4. **Order stuck at `Invoiced`.** The one successful payment shows `Confirmed: Yes` with a
   real tx, but the order never reached `PAYMENT_CONFIRMED`, so the dashboard reads
   "Payment confirmed: 0". `waitForConfirmation()` will time out *after* a student has paid.
5. **Tutoring skills not installed.** `~/.openclaw/workspace/.claude/skills/` contains only
   `goat-agent`. `study-pack` and `payment-session` have never been installed. Use
   `openclaw skills install <local dir>`, not manual copying.
6. **Seed users: 0 of 10–20.** The only deliverable that needs calendar time.
7. **A2A with Agora** — Zakariyah (@zakariyahakbar) is a committed counterparty. Direction
   matters: **Agora pays Aitch** works today. Aitch buying compute makes it a *payer*, which
   needs a spending key — the thing we deliberately avoided.

## Next milestone — payment → pipeline

Make a paid session actually run end to end:

1. Student uploads lecture material via Telegram.
2. If it is an audio file paired with slides, hand off to the **CPOL507 study-pack pipeline**
   (separate GitHub repo, GitHub Actions).
3. Gate delivery on x402 payment: order created → student pays USDC.e → `PAYMENT_CONFIRMED`
   → study pack returned.

Blocked by items 2, 3, 4 and 5 above.

## Lesson — do not repeat

**Aitch does not load `IDENTITY.md`.** `AGENTS.md` line ~15 lists the runtime startup
context as `AGENTS.md`, `SOUL.md`, `USER.md` — and then says *"do not manually reread
startup files."* `IDENTITY.md` was rewritten on Aug 2 and the bot's behaviour did not change,
because it never reads that file. The working fix (Aug 6) put the identity facts into
`SOUL.md` and a pointer into `AGENTS.md`.

Generalise: **before editing a config or context file, verify it is actually loaded.** A file
existing in the workspace is not evidence that the agent reads it.

Second: **do not report status from the Windows mirror.** It cannot see WSL, where the live
agent runs. Two separate reviews produced confidently wrong status this way.
