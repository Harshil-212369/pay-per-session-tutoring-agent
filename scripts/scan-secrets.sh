#!/usr/bin/env bash
# scan-secrets.sh — pre-push guard.
# Scans the working tree for anything that looks like a private key:
# a 0x-prefixed 64-hex-char string (32 bytes). 20-byte addresses (40 hex)
# and known-public tx hashes are reported separately, not treated as secrets.
#
# Exit 1 if a candidate secret is found. Run before every push.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

# Directories we never scan (deps, internal notes, git internals).
EXCLUDES=(--glob '!node_modules/**' --glob '!.git/**' --glob '!forClaudeCode/**' --glob '!old/**')

# Known PUBLIC 64-hex values that are allowed to appear (documented on-chain data).
# The Stage-1 settlement tx hash is public and intentionally documented.
ALLOWLIST='e89e16dffd7713954b27b0b2e788af6700cea0c9e0346c787e8ec89672b6c7c5'

PATTERN='0x[0-9a-fA-F]{64}'

echo "Scanning $ROOT for 0x-prefixed 64-hex-char strings…"

if command -v rg >/dev/null 2>&1; then
  HITS="$(rg -n --no-heading "${EXCLUDES[@]}" "$PATTERN" . || true)"
else
  HITS="$(grep -rInE "$PATTERN" . \
    --exclude-dir=node_modules --exclude-dir=.git \
    --exclude-dir=forClaudeCode --exclude-dir=old || true)"
fi

# Drop allowlisted public hashes.
FILTERED="$(printf '%s\n' "$HITS" | grep -v "$ALLOWLIST" || true)"

if [ -n "${FILTERED//[$'\t\r\n ']/}" ]; then
  echo
  echo "!! POTENTIAL SECRET(S) FOUND — DO NOT PUSH:"
  printf '%s\n' "$FILTERED"
  echo
  echo "Each line above contains a 0x + 64-hex string that is not on the public allowlist."
  echo "If it is a private key, remove it and rotate the key. STOP."
  exit 1
fi

echo "OK — no unallowlisted 64-hex secrets found."
echo "(Public settlement tx hash is allowlisted and expected in docs.)"
exit 0
