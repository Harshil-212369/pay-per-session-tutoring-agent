# Security

Aitch moves real funds on mainnet. This document covers how secrets are kept out of the
repo and how to turn on GitHub's server-side protections.

## Principles

1. **No secret material in the repo — ever.** No private key, seed phrase, API key, or
   API secret in code, in the working tree, or in git history.
2. **Secrets come from the environment.** Every money-moving script reads keys and API
   credentials from `process.env`, loaded from a host vault into the daemon at startup.
   The agent process never reads a private key from a committed file.
3. **Fail loud, fail safe.** Scripts assert chain id, that each key derives its expected
   address, and that payer ≠ merchant, *before* touching money.

## What is and isn't a secret

- **Safe to commit:** public 0x **addresses** (40 hex chars / 20 bytes), the USDC.e
  contract, chain id, RPC URL, and public on-chain **tx hashes**.
- **Never commit:** **private keys** (0x + 64 hex / 32 bytes), seed phrases, API keys, API
  secrets, `rclone.conf`, `.pem`/`.key` files, or vault contents.

The distinction the scanner keys on: a **64-hex** `0x` string is private-key-shaped. A
40-hex address is not.

## `.gitignore` coverage

The committed [`.gitignore`](../.gitignore) excludes: `.env` and `.env.*` (except
`.env.example`), `*.pem`, `*.key`, `rclone.conf`, `secrets/`, `agent.env`, `vault/`,
`node_modules/`, `__pycache__/`, media files (`*.m4a`, `*.mp3`, `*.mp4`, `*.pptx`, `*.pdf`,
images, `*.zip`), runtime `state/`, and the internal `forClaudeCode/` and `old/` notes.

Only [`.env.example`](../.env.example) — placeholders only — is committed.

## Pre-push secret scan

Run before every push:

```bash
bash scripts/scan-secrets.sh
```

It scans the working tree (excluding `node_modules/`, `.git/`, `forClaudeCode/`, `old/`)
for any `0x`-prefixed 64-hex string and exits non-zero if it finds one. The one public
settlement tx hash is explicitly allowlisted so a legitimately-public value doesn't block
the push. Any other hit is treated as a potential private key: **stop, remove it, and
rotate the key.**

The same scan runs in CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) with
`permissions: { contents: read }`. The workflow uses `pull_request`, **never**
`pull_request_target` (which would expose write-scoped tokens to untrusted forks).

## Enable GitHub secret scanning + push protection

Do this on the remote once it exists:

1. Go to the repo on GitHub → **Settings → Code security and analysis**.
2. Enable **Secret scanning**.
3. Enable **Push protection**. GitHub then **blocks** any push containing a detected
   secret before it lands on the remote.
4. (Org-wide) An org owner can enable both for all repositories under
   **Organization settings → Code security and analysis** and set them as defaults for new
   repos.

Push protection is the safety net, not the plan: the plan is that secrets never enter a
commit in the first place. Push protection catches the mistake you didn't know you made.

## If a secret is ever committed

A key that has touched git history is compromised, even after you delete it — assume it
was scraped.

1. **Rotate the key immediately** (generate a new wallet / API credential; move funds if a
   private key was exposed).
2. Remove it from the working tree and history (e.g. `git filter-repo`), then force-push.
3. Re-run `scripts/scan-secrets.sh` to confirm the tree is clean.

Rotation comes first. History rewriting is cleanup, not remediation.
