# Aitch — What Works, What's Next

**2026-08-21** · ERC-8004 Agent **#77**, GOAT Network mainnet (chain 2345)
Source for a Demo Day deck: everything in §1 is verifiable today; §3 is a plan, labelled as one.

---

## 1. What works today

| Capability | Status | Proof anyone can check |
|---|---|---|
| On-chain agent identity | Live | Agent #77, [8004scan.io/agents/goat/77](https://8004scan.io/agents/goat/77) |
| x402 merchant, receiving USDC.e | Live | `HarshilSuthar`, type DIRECT, chain 2345 |
| Payment from a human wallet | Done | Block 13802564 |
| **Payment from another AI agent** | Done, twice | Blocks 14620758, 14620856 — Agora #82 → Aitch #77, no human approving either |
| Study-pack pipeline | Live | GitHub Actions, `workflow_dispatch`, runs in cloud — no laptop required |
| Conversational agent | Live | Telegram, OpenClaw, skills `study-pack` + `payment-session` loaded and indexed |
| Sandbox isolation for visitors | Configured | `mode: non-main`, `workspaceAccess: none` |
| Stale-data protection | Shipped | `payments/lib/rpc-freshness.mjs` |

**The one thing worth pausing on:** another autonomous agent bought two tutoring sessions,
six minutes apart, with no human in the loop on the buyer's side. That is agent-to-agent
commerce actually happening, not a demo of it.

## 2. What is manual today

Honest about the seam. Three steps in a session are performed by the operator, not the agent:

1. **Issuing an invoice.** `create-order.mjs` is run on the host, because the merchant
   credentials are deliberately not in the agent's environment.
2. **Moving files.** The student sends material in Telegram; the operator places it in
   OneDrive for the pipeline to collect.
3. **Returning the pack.** The finished PDF is sent back into the chat by hand.

Everything else — identity, pricing, tutoring, payment settlement, pack generation — is
already automated. The seam is file transport and credential custody, not intelligence.

## 3. The path to a fully autonomous session

### 3.1 Storage-backed uploads (removes step 2)

Telegram caps bot downloads at **20 MB**; a two-hour lecture recording exceeds that, so
large files must never route through the bot. The fix is for the file to go directly from
the student to storage:

```
/start_session
   → agent returns a presigned upload URL (student's browser → storage, direct)
   → student uploads; agent never touches the bytes
   → agent triggers the pipeline with the object key
   → pipeline writes the master PDF back to storage
   → agent returns a presigned download link
```

OneDrive already backs the pipeline and has ~900 GB free, so it can serve as the store
directly; object storage (R2/S3) is the alternative if presigned URLs prove awkward on
OneDrive. Either way the agent handles **keys and links, never file contents** — which
also keeps a sandboxed agent workable, since it needs no filesystem access to the workspace.

### 3.2 A credential-holding order service (removes step 1)

The agent should be able to issue an invoice from chat without ever holding the merchant
key. A small fixed-shape service on the host holds the credentials and exposes exactly one
operation: *create an order for this payer, for this amount, up to a hard cap.*

This is safe because `payTo` is not caller-controlled — it comes from merchant config and
`create-order.mjs` already asserts it equals wallet A before returning anything. The only
caller-supplied fields are the payer address and the amount, and a cap bounds the second.
Note that a sandboxed session cannot reach a host loopback port (`network: "none"`), so this
belongs in the channel layer rather than as an agent-invoked HTTP call.

### 3.3 Session history per wallet (new capability)

A student should be able to ask *"what have I already bought, and which pack came from
which payment?"* The x402 SDK exposes `getOrderStatus(orderId)` but no lookup by payer
address, so this needs a local order↔wallet↔pack store. Small, and it makes repeat purchase
feel like an account rather than a series of strangers' transactions.

### 3.4 Unattended uptime

The pipeline is already serverless. Only the chat gateway needs to stay awake. Interim:
Windows Task Scheduler at logon. Target: a $5 VPS — Telegram polls outbound, so there is no
ingress, firewall, or port-forwarding work.

## 4. Sequencing

| Phase | Work | Unlocks |
|---|---|---|
| **Now** | Sponsored pilot, operator-assisted | Real student feedback on the pack itself, before optimising anything |
| **Next** | 3.1 storage-backed uploads | Removes the largest manual step and the 20 MB ceiling |
| **Then** | 3.2 order service | Student self-serve payment; the product becomes buyable without the operator |
| **Then** | 3.3 history, 3.4 VPS | Repeat purchase and unattended availability |

Deliberately in this order: the pilot answers *is the study pack worth paying for* before
engineering removes friction from a purchase nobody has yet asked to make twice.

## 5. What this is really about

Every claim above is checkable — a transaction hash, a block number, a public registry
entry, a commit. That is the point. An agent that takes money should be one whose claims
you can verify without trusting the person who built it.

Aitch holds **no spending key**. It can receive and it cannot send. That is not a
limitation to be fixed later; it is the security property that makes a payments-taking
agent safe to run at all.

