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

# Known PUBLIC 64-hex values allowed to appear (documented on-chain data).
# Settlement tx hashes are public by construction — they are printed on a block explorer
# and are the evidence the Stage 2 reports cite. A private key is NEVER added here.
# Only add a hash after confirming it resolves on https://explorer.goat.network.
ALLOWLIST_HASHES=(
  'e89e16dffd7713954b27b0b2e788af6700cea0c9e0346c787e8ec89672b6c7c5'  # blk 13802564, human wallet -> Aitch
  'f972de0eb556f0836821490024196c1313e9edf9cebaa167e584063d32fb468b'  # blk 14620758, Agora #82 -> Aitch #77
  'a81799f4a3a376384c955d8cecd819ab2ea4feda567588f9ff5f0eff1b2d48ce'  # blk 14620856, Agora #82 -> Aitch #77
)

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
FILTERED="$HITS"
for h in "${ALLOWLIST_HASHES[@]}"; do
  FILTERED="$(printf '%s
' "$FILTERED" | grep -v "$h" || true)"
done

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
echo "(${#ALLOWLIST_HASHES[@]} public settlement tx hashes allowlisted; expected in docs.)"
exit 0
