# SKILL: x402 payment session

> The payment half of a session. This skill defines how Aitch takes an x402 payment. All
> money movement is delegated to the deterministic engine
> [`payments/session/pay-session.mjs`](../../payments/session/pay-session.mjs) — this
> markdown gates and interprets; it never signs or transfers.

## Contract

- **Network:** GOAT mainnet, chain **2345**. Token: **USDC.e**
  (`0x3022b87ac063DE95b1570F46f5e470F8B53112D8`, 6 decimals).
- **SDK:** `GoatX402Client({ baseUrl, apiKey, apiSecret })`. Base URL
  `https://x402-api.goat.network`. Not `GoatX402` / `apiUrl` / `middleware()`.
- **Two wallets:** payer (student, B) ≠ merchant (Aitch, A). Enforced in code.
- **Spend cap:** low tier 0.1 USDC.e. At/above it, human confirmation is required.

## Order flow

```
createOrder(dappOrderId, chainId 2345, USDC, tokenContract, fromAddress, amountWei)
   → order { orderId, flow, payToAddress, amountWei, expiresAt }
   → GUARD: flow == "ERC20_DIRECT"          (else halt — do not guess)
   → GUARD: payToAddress == AGENT_ADDRESS    (else halt — wrong receiver)
ERC-20 transfer(payToAddress, amountWei)     (ethers v6, payer key from env)
   → wait for tx.status == 1                  (else: transfer reverted)
waitForConfirmation(orderId)                 (poll; emit status pings)
   → PAYMENT_CONFIRMED | INVOICED
getOrderProof(orderId)                        (signed proof: from, to, tx_hash, flow)
```

## How the agent invokes it

Deterministic, shell-out only. The agent never constructs a transaction.

```bash
# Preflight (read-only, no keys move funds):
node payments/diagnostics/merchant-check.mjs      # merchant listed + USDC.e ready?
node payments/diagnostics/gas-check.mjs           # can the payer afford the txs?

# Dry run (creates an order, sends nothing):
node payments/session/pay-session.mjs

# Execute (moves 1 USDC.e). Requires --confirm; above cap also prompts for
# the typed phrase CONFIRM PAYMENT:
node payments/session/pay-session.mjs --confirm
```

## Result interpretation

| Engine outcome | Meaning | Agent action |
|---|---|---|
| `PAYMENT_CONFIRMED` / `INVOICED` + proof | Settled and proven | Unlock the session; deliver the study pack |
| tx mined but confirmation pending / timeout | On-chain transfer done; indexer lagging | Tell the user it settled on-chain, reconciliation pending; **do not re-pay** |
| `EXPIRED` | Order window elapsed before transfer | Create a new order |
| `flow != ERC20_DIRECT` | Unsupported flow | Halt; explain; do not guess signatures/approvals |
| `payToAddress != AGENT_ADDRESS` | Wrong receiver | Halt; the merchant receiving address is misconfigured |
| key mismatch / payer == merchant | Guard tripped | Halt; refuse to move funds |

## Guardrails

- **Dry-run by default.** Real funds move only with `--confirm`.
- **Two independent gates** for above-cap spend: the typed `CONFIRM PAYMENT` phrase in
  chat *and* the `--confirm` flag on the engine. A stray call satisfies neither by itself.
- **On-chain guards run before money moves:** chain id == 2345, derived signer ==
  expected address, payer ≠ merchant, on-chain `decimals()` matches quote.
- **Latency is expected.** Never freeze; never send a second transfer to "fix" a slow
  confirmation.
- **Secrets from `process.env` only.** This skill and the engine never log or echo a key.
