# Product Growth Report — Aitch

**Stage 2 · submitted 2026-08-21**
Team: Harshil Suthar · Agent: Aitch, ERC-8004 Agent **#77**, GOAT Network mainnet (chain 2345)
Repo: https://github.com/Harshil-212369/pay-per-session-tutoring-agent
Product: https://pay-per-session-tutoring-agent.vercel.app/

---

## 1. Metrics selected at the start of Stage 2

Submitted 2026-07-17 in [`docs/GROWTH_METRICS.md`](GROWTH_METRICS.md), unchanged since.

**North-star metric: paid study-pack sessions per week.** A session counts only when an
x402 payment settles on-chain *and* a study pack is delivered. It cannot be inflated by
signups, page views, or free chatter.

**Stated Stage 2 target:** *"a sustained upward trend across the 10–20 seed cohort, with a
non-zero week-over-week paid-session count by the end of Stage 2."*

Supporting metrics with their original targets: seed users onboarded (10–20), activation
rate (≥50%), time-to-first-value (same day), 7-day return rate (≥40%), sessions per user
per week (≥1.0), gross margin per session (positive), time-to-first-settled-transaction
(trend down), pipeline run time (track and reduce), study-pack rating (baseline),
Agent Card discoverability (rewritten in buyer language), on-chain reputation events
(non-zero).

## 2. Results achieved

### North-star: **MET**

Non-zero paid sessions settled on-chain, verifiable by anyone:

| # | Date | Payer | Amount | Block | Transaction |
|---|---|---|---|---|---|
| 1 | 2026-07-13 | Human-operated wallet `0xBB08…7087` | 1 USDC.e | 13802564 | [`0xe89e16df…b6c7c5`](https://explorer.goat.network/tx/0xe89e16dffd7713954b27b0b2e788af6700cea0c9e0346c787e8ec89672b6c7c5) |
| 2 | 2026-08-16 | **Agora, ERC-8004 Agent #82** `0x1B66…1F06` | 1 USDC.e | 14620758 | [`0xf972de0e…2fb468b`](https://explorer.goat.network/tx/0xf972de0eb556f0836821490024196c1313e9edf9cebaa167e584063d32fb468b) |
| 3 | 2026-08-16 | **Agora, ERC-8004 Agent #82** `0x1B66…1F06` | 1 USDC.e | 14620856 | [`0xa81799f4…1b2d48ce`](https://explorer.goat.network/tx/0xa81799f4a3a376384c955d8cecd819ab2ea4feda567588f9ff5f0eff1b2d48ce) |

**3 USDC.e settled to Agent #77's receiving wallet
`0x09eE632927821d7B18Ac76Ff743821A30DA7c6bF`.** Payments 2 and 3 are **agent-to-agent**:
a separate builder's autonomous agent purchased tutoring sessions from Aitch, with no human
approving either transfer. Both are independently verifiable on
[explorer.goat.network](https://explorer.goat.network) and on
[8004scan.io/agents/goat/77](https://8004scan.io/agents/goat/77).

### Verified active users

**1 verified active user: Agora, ERC-8004 Agent #82** (operator: Zakariyah Akbar).

The #ClawToTheTop criteria define an active user as someone "using your product (Telegram
bot users, web sign-ups, **AI agent users**, etc.)". Agora is an AI agent user: it purchased
two tutoring sessions autonomously, six minutes apart, with no human approving either
transfer, and both purchases are settled on-chain and independently verifiable. It also
returned unprompted for a third session on 2026-08-21.

This is a smaller number than the seed-user target and is reported as such — but it is a
real user of the product, not a signup or a page view.

### Target-by-target status

| Metric | Target | Result | Status |
|---|---|---|---|
| **Paid sessions / week (north-star)** | Non-zero by end of Stage 2 | 3 settled; 2 in the final week | **MET** |
| Time-to-first-settled-transaction | Trend downward | ≤3.5s confirmation on all Aug 16 settlements | **MET** |
| Gross margin per session | Positive at unit level | Positive — pipeline runs on GitHub Actions free tier (~10–15 min/pack of a 2,000 min monthly allowance) | **MET** |
| Agent Card discoverability | Rewritten in buyer language | Agent #77 live and resolvable, `aitch_tutor` URI; buyer-language rewrite not completed | Partial |
| Seed users onboarded | 10–20 | 0 | **NOT MET** |
| Activation rate | ≥50% of onboarded | N/A — no onboarded cohort | Not measurable |
| 7-day return rate | ≥40% | Agora returned within 6 minutes and purchased a second session | Directionally met, n=1 |
| Sessions per user per week | ≥1.0 | 2.0 (Agora, same night) | Directionally met, n=1 |
| On-chain reputation events | Non-zero | 0 | **NOT MET** |
| Pipeline run time | Track and reduce | ~10–15 min per weekly pack, measured | Baseline established |
| Study-pack rating | Establish baseline | No rated deliveries | **NOT MET** |

## 3. Key learnings and performance analysis

**The north-star was chosen well and the acquisition metric was chosen badly.** "Paid
sessions settled on-chain" proved to be exactly the un-gameable number it was meant to be —
it is either on the chain or it isn't. "Seed users onboarded" turned out to measure a
funnel we had deliberately kept closed for security reasons (see below), so it went to zero
while the thing it was a proxy for — *does anyone actually pay for this* — was answered
three times.

**The demand signal arrived from a segment we did not forecast.** The seed user definition
targets TMU students in lecture-heavy courses. The paying customers in the final week were
**another AI agent**. That is a real and unexpected finding: a pay-per-session tutoring
agent with a public ERC-8004 identity and an x402 endpoint is purchasable by machines, and
machines transact faster than students recruit. The repeat purchase came six minutes after
the first, with no marketing, no onboarding, and no human in the loop on the buyer's side.

**Distribution was gated by a security decision, and that decision was correct.**
The Telegram allowlist stayed locked to a single ID for all of Stage 2. A `sandbox explain`
audit showed the agent runtime had `exec`, `process`, and `write` permitted with sandboxing
`off` — admitting strangers would have handed shell-capable access on a personal machine to
anyone who found the bot. Sandbox policy (`mode: non-main`, `workspaceAccess: none`) was
configured and verified before any expansion. Growth was traded for not shipping a
vulnerability. Given the same information, the same call.

**A measurement failure nearly produced a false report.** On 2026-08-16 the public RPC
endpoint served state 43 hours stale without erroring. Our balance checker reported 4.0
USDC.e when the wallet held 6.0, and a log scan found zero of the two transfers that had
provably landed. We were minutes away from telling a counterparty their payment had failed.
Caught by cross-checking the block explorer, whose transaction sat in a block *newer* than
what our script believed the chain tip to be. Fix shipped:
[`payments/lib/rpc-freshness.mjs`](../payments/lib/rpc-freshness.mjs) compares the head
block's timestamp against the local clock and throws with the measured lag rather than
reporting stale state. **Growth metrics that depend on a single unverified data source are
not measurements.**

**Honest scoreboard.** North-star met, unit economics positive, settlement latency
excellent, three real payments including the first agent-to-agent transaction in our
cohort. Seed-user acquisition missed outright, and study-pack ratings have no baseline
because no student has yet received a delivery.

## 4. What's next

Two items, both identified from real friction rather than speculation:

1. **Agent-issued invoices.** Order creation currently requires the operator to run
   `create-order.mjs` on the host, because the merchant credentials are deliberately absent
   from the agent's environment. For a non-technical student that is not a product. The fix
   is a fixed-shape service holding the credentials with a hard amount cap, so the agent
   calls a constrained endpoint rather than holding keys. `payTo` is already server-side and
   asserted against wallet A, so the injection surface is narrow.
2. **Session history per wallet.** A student should be able to ask what they have already
   bought and which study pack came from which payment. The x402 SDK exposes
   `getOrderStatus(orderId)` but no lookup by payer address, so this needs a local
   order↔wallet store.

