# Growth Metrics Proposal — Aitch (Pay-Per-Session Tutoring Agent)

**Stage 1 deliverable · 2026-07-17**

These are the metrics Aitch will track through Stage 2. Each entry gives the **definition**, **why it's meaningful for this product** (not a vanity number), and a **proposed Stage 2 target**. Targets are pre-pilot proposals with stated rationale, not measured results — they will be revised against real seed-user data.

## North-star metric

**Paid study-pack sessions per week.**
A session is only counted when an x402 payment settles on-chain *and* a study pack is delivered. It is the single number that captures whether the product does its job and gets paid for it — it can't be inflated by signups, page views, or free chatter.
**Stage 2 target:** a sustained upward trend across the 10–20 seed cohort, with a non-zero week-over-week paid-session count by the end of Stage 2.

## Acquisition & activation

| Metric | Definition | Why it matters | Stage 2 target |
|---|---|---|---|
| **Seed users onboarded** | Distinct students who complete a first Telegram session with Aitch | Confirms the wedge segment is reachable, not theoretical | 10–20 |
| **Activation rate** | % of onboarded users who complete at least one *paid* session | Separates curiosity from willingness to pay — the real product test | ≥ 50% of onboarded |
| **Time-to-first-value** | Median time from `/start` to first delivered study pack | Long onboarding kills a per-session product; this is the friction gauge | Under one session, same day |

## Retention & repeat purchase (the load-bearing signals)

| Metric | Definition | Why it matters | Stage 2 target |
|---|---|---|---|
| **7-day return rate** | % of paying users who buy again within 7 days | The pain is *weekly*; if it's real, users come back next week. This is the truest product-market-fit signal for this segment | ≥ 40% |
| **Sessions per user per week** | Mean paid sessions per active user, weekly | Distinguishes one-off use from a study habit | ≥ 1.0 and rising |

## Unit economics

| Metric | Definition | Why it matters | Stage 2 target |
|---|---|---|---|
| **Gross margin per session** | Session price − variable cost (transcription/OCR/LLM compute per pack) | A per-session product only works if each session is profitable at the unit level | Positive on every tier |
| **Time-to-first-settled-transaction** | Time from session start to confirmed on-chain settlement | Directly tied to the x402 latency risk flagged in the bootcamp; a UX-critical number to drive down | Trend downward over Stage 2 |

## Product quality

| Metric | Definition | Why it matters | Stage 2 target |
|---|---|---|---|
| **Pipeline run time** | Median wall-clock from raw audio+slides to master PDF | The core deliverable's speed; sets the ceiling on how responsive a session feels | Track and reduce |
| **Study-pack rating** | User-reported usefulness of the delivered pack (simple thumbs/1–5) | The pack is the product; its rating is the retention leading indicator | Establish baseline, then improve |

## Discovery (ERC-8004 / GEO)

The bootcamp names "AI optimization for LLM discovery" and on-chain reputation as graded deliverables. Aitch's discoverability surface is its **ERC-8004 Agent Card** (Agent ID 77).

| Metric | Definition | Why it matters | Stage 2 target |
|---|---|---|---|
| **Agent Card discoverability** | Whether the Agent Card `description` surfaces in agent-to-agent routing for buyer-language queries ("pay-per-session tutoring, per-topic, no subscription") | This is how other agents/LLMs find Aitch without a human — the GEO deliverable made concrete | Card rewritten in buyer language; routing-surfacing observed |
| **On-chain reputation events** | Feedback/reputation entries accrued against Agent 77 | Portable, verifiable trust that travels across ecosystems | Non-zero by end of Stage 2 |

## What we will NOT optimize for

Vanity metrics that don't map to a paying student getting a study pack: raw Telegram message volume, landing-page hits without conversion, or total signups without activation. If a number can go up while paid sessions stay flat, it isn't a growth metric — it's noise.
