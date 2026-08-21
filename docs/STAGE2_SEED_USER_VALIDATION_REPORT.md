# Seed User Validation Report — Aitch

**Stage 2 · submitted 2026-08-21**
Original seed-user definition: [`docs/SEED_USERS.md`](SEED_USERS.md) (2026-07-17)

---

## 1. Number of seed users

**0 students onboarded** against a stated target of 10–20. Stating that plainly up front
because the rest of this report is only useful if the headline is honest.

What did happen, and what it is worth:

| Cohort | Count | Evidence |
|---|---|---|
| Students onboarded to the Telegram agent | **0** | Allowlist remained locked to one ID all of Stage 2 |
| Waitlist signups (form live since Jul 31) | Collected via form; not converted | https://forms.gle/FbhUZA4NBEo6SfRQ8 |
| **Verified active users** | **1** | Agora, ERC-8004 Agent #82 — an *AI agent user*, which the challenge criteria list explicitly |
| Paying counterparties | **2** | 1 human-operated wallet, 1 autonomous agent |
| Paid sessions settled on-chain | **3** | Blocks 13802564, 14620758, 14620856 |
| Builders who requested access and were held | **2** | Both competing bootcamp teams |

## 2. Why the number is zero

Not because students were unreachable, and not because they refused to pay. Because we
never opened the door.

A security audit of the agent runtime (`openclaw sandbox explain`) showed `exec`,
`process`, `write`, and `edit` all permitted with sandboxing set to `off`, running directly
on a personal laptop alongside SSH keys and credentials. Admitting an arbitrary Telegram
user under that configuration would have granted a stranger shell-capable access through a
chat prompt. The allowlist stayed closed while sandbox isolation was configured and
verified (`mode: non-main`, `workspaceAccess: none`, confirmed via
`sandbox explain --session <non-main key>` returning `runtime: sandboxed`).

The trade was explicit: **user count for not shipping a vulnerability.** It cost the
acquisition target. It was still the right call, and it is the single largest driver of
this report's headline number.

## 3. Key user insights

**Insight 1 — the buyer was not the user we designed for.**
The seed definition describes TMU students in lecture-heavy courses. The customers who
actually paid in the final week were **another AI agent** (Agora, ERC-8004 Agent #82),
autonomously, twice, six minutes apart, with no human approving either transfer. We built a
consumer product and discovered a machine-to-machine one underneath it. A public ERC-8004
identity plus an x402 endpoint makes the agent purchasable by software — a distribution
channel that requires no recruitment.

**Insight 2 — the funnel was dishonest before it was empty.**
The landing page carried a "Start for free →" call to action pointing at a bot that
silently ignored non-allowlisted users. Traffic driven to that page would have hit a dead
end with no explanation. Fixed on 2026-07-31 (commit `e5ade6a`): every CTA replaced with
"Join the waitlist", and a status row added stating plainly that the bot is in private
testing. **Driving traffic to a promise you cannot keep is worse than admitting the
limitation.**

**Insight 3 — the counterparty's requirements were sharper than any survey.**
Zakariyah (Agora) asked for exactly three fields — `order_id`, `payToAddress`,
`amount_wei` — and asked to run the transaction *twice* so his own repeat-usage metric
would register. That request specified our integration surface more precisely than a user
interview would have, and produced `create-order.mjs`, a no-key invoice path for external
payers that did not exist before he asked for it.

**Insight 4 — trust needs to survive a broken measurement.**
When our balance check disagreed with the counterparty's claim that he had paid, the
convenient conclusion was that he was wrong. He was not; our RPC was 43 hours stale. The
product lesson generalises to students: never tell a paying user their payment failed on
the word of one endpoint, and never ask them to pay again to retry. That rule is now
written into the agent's own skill file.

## 4. Validation of original assumptions

| Assumption from `SEED_USERS.md` | Verdict | Basis |
|---|---|---|
| Students will pay **per session** rather than subscribe | **Not tested** | No student reached the payment step |
| The pain is weekly and recurring | **Not tested with users** | Still founder-observed only |
| Users can supply their own raw material | **Supported** | Pipeline runs end to end on real CPOL507 audio + slides |
| Generic AI tutors can't tutor on *this* lecture | **Supported by construction** | Study pack grounds tutoring in the student's own transcript |
| Subscriptions are the wrong shape for irregular use | **Unvalidated opinion** | No pricing comparison run with real users |
| x402 per-session payment is viable at $1 | **Validated** | 3 settlements, ≤3.5s confirmation, positive unit margin |
| A narrow wedge (one course pattern) is reachable | **Not validated** | Zero recruited |

Two assumptions were **invalidated by omission**: that acquisition would be the easy part
and infrastructure the hard part. The reverse held. Recruiting was never attempted at
scale; the infrastructure consumed the stage.

## 5. Product improvements resulting from feedback

| Trigger | Change | Evidence |
|---|---|---|
| Dead-end CTA identified before launch traffic | Waitlist funnel + honest status table | commit `e5ade6a` |
| Counterparty needed a no-key invoice path | `create-order.mjs` — issues an invoice for an external payer, requires no private key, asserts `payTo` = wallet A | commit `86af160` |
| Stale-RPC false negative | `rpc-freshness.mjs` — refuses to report on-chain state from a lagging node | commit `24888cc` |
| Skill contradicted the payee-only design | Session state machine rewritten with named states and a **sticky PAID** rule so no paying user is ever asked to pay twice | commit `9be6a23` |
| Runtime security audit | Sandbox policy `non-main` / `workspaceAccess: none` verified before any allowlist expansion | `openclaw sandbox explain` |

## 6. Supporting materials

- Seed user definition (pre-registered, Stage 1): [`docs/SEED_USERS.md`](SEED_USERS.md)
- Waitlist form: https://forms.gle/FbhUZA4NBEo6SfRQ8
- On-chain settlement receipts: blocks 13802564, 14620758, 14620856 on
  [explorer.goat.network](https://explorer.goat.network)
- Counterparty's public account of the same transactions: @usingagora on X
- Agent identity: [8004scan.io/agents/goat/77](https://8004scan.io/agents/goat/77)

## 7. Pilot in progress (post-deadline, reported for completeness)

Three sponsored sessions with TMU students are scheduled for 2026-08-22/23 — operator-assisted
end-to-end: the student messages Aitch, supplies their own lecture audio and slides, receives a
generated study pack, and asks questions answered from *their* transcript. Sessions are
sponsored (no charge) so the pilot measures whether the study pack is useful, before it
measures willingness to pay. Findings will follow the Stage 2 deadline and are noted here so
the timeline is on the record rather than backfilled.

## 8. What we would do differently

Open a **safe** channel early rather than a fast one or none. The correct sequence was
sandbox isolation in week one, then a small allowlisted cohort in week two, then growth —
instead of deferring both and arriving at Stage 2's end with working payments and no
students. The infrastructure work was real and is now done; it simply should not have
consumed the entire recruiting window.

