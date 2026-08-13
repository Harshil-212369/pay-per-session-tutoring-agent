@HANDOFF.md

# Aitch — working notes

Pay-per-session AI tutoring agent. ERC-8004 Agent #77 on GOAT Network mainnet, paid in
USDC.e over x402.

## Session start

If `HANDOFF.md` lists open items, surface them before starting new work.

## This repo is not the live system

The running agent lives in **WSL** at `~/.openclaw/workspace/`. This repo is the payment
stack and the website. Anything about the agent's behaviour — identity, skills, allowlist,
tool policy — is in WSL and **is not visible from here**.

Do not report project status from this repo alone. Two separate reviews have produced
confidently wrong status by reconstructing it from git logs in this tree while the real
state was in WSL.

## Rule: no change is done until the runtime proves it

This project's most-repeated failure (3 times): a file edited in good faith that the
runtime never reads. `IDENTITY.md` (not in OpenClaw's startup context — that's
`AGENTS.md`/`SOUL.md`/`USER.md`), `goat-agent` (in `.claude/skills/`, which OpenClaw never
scans), `study-pack`/`payment-session` (installer printed success; no YAML frontmatter, so
never indexed).

Therefore, after any change intended to alter behaviour:

1. **Run the check that observes the runtime, not the filesystem**, and show its output:
   - skills → `openclaw skills check` ("Ready and visible to model") — not the installer message
   - agent context → `/new` in Telegram, then ask the bot
   - payment/API → run the relevant read-only diagnostic
2. **Do not start the next task until the check passes.** An unverified change becomes
   accepted history and later work silently builds on it.
3. Commits are not on GitHub until pushed — `git log origin/main..HEAD` must be empty at
   session end.

When creating or significantly editing a file, **show the user the actual content or
diff** — they read code more reliably than prose summaries.

## Chain and token constants — get these wrong and money moves incorrectly

| Key | Value |
|---|---|
| Chain | GOAT Network mainnet, **2345** |
| RPC | `https://rpc.goat.network` |
| x402 API | `https://flow-api.goat.network` |
| Merchant portal | `https://flow-merchant.goat.network` |
| USDC.e | `0x3022b87ac063DE95b1570F46f5e470F8B53112D8`, 6 decimals |
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Wallet A (merchant, receives) | `0x09eE632927821d7B18Ac76Ff743821A30DA7c6bF` |

Wrong values that circulate in third-party skills and will silently break things:

- `48816` / `rpc.testnet3.goat.network` — GOAT **Testnet3**, not mainnet
- `0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1` — Testnet3 USDC
- `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` — **Base** USDC
- `x402-api.goat.network` — dead; resolves but serves a cert for `flow-api` only, so Node
  fails at TLS with `ERR_TLS_CERT_ALTNAME_INVALID` and reports a status-less `fetch failed`
- `api.goatx402.io` — NXDOMAIN, appears only in an SDK docstring

Assert `chainId === 2345` before any on-chain action.

## Aitch is payee-only

In x402 the payer signs; the payee only receives. Aitch holds **no spending key** and does
not need one. Anything proposing to give it a wallet key — Privy, `GOAT_PRIVATE_KEY` — is
solving a problem we do not have, and only becomes relevant if Aitch becomes a *payer*
(agent-to-agent purchasing).

Secrets stay in environment variables, never in a file inside the workspace. The workspace
is where the agent has full read access; a merchant secret there is readable by any prompt
that talks it into reading a file. OpenClaw has `openclaw secrets` for this.

## Verification scripts

All read-only, none require credentials:

```bash
GOATX402_MERCHANT_ID=HarshilSuthar node payments/diagnostics/merchant-check.mjs
node payments/diagnostics/balance-check.mjs [address]
STUDENT_ADDRESS=0x<B> node payments/diagnostics/gas-check.mjs
```

`payments/session/pay-session.mjs` **moves real funds** with `--confirm`. Do not run it to
test something.

A fallback default inside a verification script is a false-green generator — `gas-check.mjs`
once had `STUDENT_ADDRESS || A`, which printed one wallet twice and read as a clean
two-wallet pass. Verification scripts should throw, not default.
