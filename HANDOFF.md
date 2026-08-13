# HANDOFF

Open state for Aitch. Update at the end of every session. Read at the start of every session.

**Last updated:** 2026-08-10

## Deadlines

| What | When | Days left (from Aug 13) |
|---|---|---|
| #ClawToTheTop challenge | Aug 10 – Aug 21 | **running now** |
| ~~Metis livestream Aug 12~~ | **postponed** — only Sage (sagepays.xyz) made the marketing livestream | — |
| **Demo ready (self-imposed, before the 19th)** | **Aug 19** | **6** |
| Stage 2 deliverables (3 reports) | **Aug 21** | **8** |
| Demo Day | Aug 26 | 13 |

Competitive note: Sage (@sagedeputybot, Shariq — the same Shariq waiting on our allowlist)
pays testers in USDC on GOAT mainnet with on-chain receipts, has a live web app and a demo
video, and took the livestream slot. Both waiting allowlist users build competing agents —
treat what they see of Aitch accordingly.

#ClawToTheTop scoring: 5 posts/week = 10 pts, each extra post +5, each verified active
user +5, featured livestream demo +25. Evidence must be posted in the cohort group chat.
Minnah states it does **not** affect Demo Day judging — the Stage 2 rubric (40% product
growth / 40% ecosystem / 10% seed validation / 10% GEO) is the actual grade. Do not trade
deliverables for points; posts and users happen to serve both.

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
5. ~~Tutoring skills not installed.~~ **DONE Aug 10.** `study-pack` and `payment-session`
   are installed and report `✓ ready`, source `openclaw-workspace`. See the skills lesson
   below — the first install silently did nothing.

   Still open underneath: `payment-session` shells out to
   `payments/session/pay-session.mjs`, which does **not** exist in WSL. The skill is
   loaded but its payment path is not runnable until item 2 is resolved.
6. **Seed users: 0 of 10–20.** The only deliverable that needs calendar time.
7. **A2A with Agora** — Zakariyah (@zakariyahakbar) is a committed counterparty. Direction
   matters: **Agora pays Aitch** works today. Aitch buying compute makes it a *payer*, which
   needs a spending key — the thing we deliberately avoided.

## Hosting — ClawUp is DEAD, target is a self-hosted VPS

**Do not resurrect the ClawUp migration.** Stephen Duan confirmed (Aug 7–8) the
creation/migration flow is sunset with "no plan" to reopen. An earlier revision of this
file documented that path in detail; it is void.

The ClawUp *public API* (`api.clawup.org/api/v1/`) is a separate thing and still useful —
its OpenAI-compatible `/agents/{id}/chat` endpoint is the route to embedding an agent on a
website later. It was never part of migration.

**Revised plan:**

- **Interim (pilot):** Windows Task Scheduler → "At log on" → `wsl.exe -d Ubuntu -u harry
  -- <gateway command>`, plus `powercfg` to prevent sleep. ~20 minutes.
- **Target (post-pilot):** self-hosted Linux VPS — $5 droplet or Oracle free tier. Telegram
  polls outbound, so there is no ingress, firewall, or port-forwarding work. Archive the
  workspace, rsync up, nvm Node 22.22.3, load secrets, `systemctl enable`.
- **Fly.io caveat:** Fly Machines auto-suspend when idle by default, which kills a
  long-polling Telegram gateway. Requires `auto_stop_machines = false`. A plain droplet has
  no such behaviour.

Do the VPS move **after** seed users, not before — it spends runway on infrastructure
instead of the deliverable.

The secret-vaulting work done for the ClawUp archive was **not** wasted. It is required for
any move, and it uncovered `/root/openclaw-secrets/agent.env` sitting at mode `644` —
world-readable, including by `harry`, the account the agent runs as. Now `600`.

**Pre-archive assertion — run immediately before `tar`, every time:**

```bash
ls -la ~/.openclaw/openclaw.json*        # must return exactly ONE file
ls ~/.openclaw/agents/main/sessions/     # no .reset. or .deleted. entries
```

This is not a formality. Superseded `openclaw.json` copies were vaulted on Aug 6; the
daemon regenerated `.last-good` on Aug 9 unprompted. Every such copy carries the live
Telegram bot token. An archive built before the re-check ships them all.

**Cutover gotcha:** Telegram permits exactly one poller per bot token. When the ClawUp claw
starts polling, the local WSL gateway competes for the same token and Telegram returns 409.
Stop the local gateway at cutover, or create a second bot via BotFather for local dev.

Superseded config copies and dead session transcripts are vaulted root-only outside the
archive path. Live credentials — `credentials/telegram-pairing.json`,
`identity/device-auth.json` — must stay put; migration needs them.

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

**The same trap, twice more, in skills (Aug 10).** `openclaw skills install` reported
success for `study-pack` and `payment-session`, and both were invisible to the model —
`openclaw skills info <name>` returned "not found." Two independent causes:

1. **No YAML frontmatter.** An indexed skill needs `name:` and `description:` in a `---`
   block. Both files opened straight at `# SKILL:`. Without it the skill is not indexed at
   all, and the installer still prints success.
2. **`goat-agent` is in the wrong directory entirely.** It sits at
   `workspace/.claude/skills/` — a **Claude Code** convention. OpenClaw scans
   `<workspace>/skills`, `<workspace>/.agents/skills`, `~/.agents/skills`,
   `<state-dir>/skills`, bundled, then `skills.load.extraDirs`. `.claude/skills` is on
   none of those. It has never been loaded by the agent.

   Consequence worth recording: the chain-48816 Testnet3 landmine fixed on Aug 2 was never
   live in the agent's context. Fixing it was still correct — it would bite the moment the
   skill is loaded — but the urgency was overstated at the time.

**Verification that actually proves a skill is loaded:**

```bash
openclaw skills check          # look at "Ready and visible to model"
openclaw skills list | grep <name>   # source column should read openclaw-workspace
```

An installer's success message is not evidence. Neither is the file being on disk.

Second: **do not report status from the Windows mirror.** It cannot see WSL, where the live
agent runs. Two separate reviews produced confidently wrong status this way.
