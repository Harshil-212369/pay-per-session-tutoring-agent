// rpc-freshness.mjs — refuse to report state from a lagging RPC node.
//
// 2026-08-16: https://rpc.goat.network served a head block 43 HOURS old while the
// chain had moved on. balance-check.mjs read 4.0 USDC.e when wallet A actually held
// 6.0, and a getLogs scan found zero incoming transfers that had definitely landed —
// because the blocks containing them did not exist on that node yet. Two real
// agent-to-agent payments were nearly reported to the counterparty as never sent.
//
// A verification script that silently reads stale state is a false-RED generator: the
// mirror image of a fallback default. Both produce confident wrong answers. Throw.

const DEFAULT_MAX_AGE_S = 600; // 10 min. GOAT confirms in ~3.5s, so this is generous.

/**
 * Assert the node's head block is recent. Throws with the measured lag if not.
 * Returns { blockNumber, ageSeconds } on success.
 */
export async function assertRpcFresh(provider, { maxAgeSeconds = DEFAULT_MAX_AGE_S } = {}) {
  const block = await provider.getBlock('latest');
  if (!block) throw new Error('RPC returned no latest block — cannot verify freshness.');

  const ageSeconds = Math.floor(Date.now() / 1000) - Number(block.timestamp);

  if (ageSeconds > maxAgeSeconds) {
    const hours = (ageSeconds / 3600).toFixed(1);
    throw new Error(
      `STALE RPC — head block ${block.number} is ${hours}h old (limit ${maxAgeSeconds}s).\n` +
      `  Balances and logs from this node are WRONG. Do not report them, and do not\n` +
      `  tell a counterparty their payment failed based on this.\n` +
      `  Cross-check on https://explorer.goat.network, or set GOAT_RPC_URL to a healthy node.`
    );
  }

  // Clocks drift; a head block far in the "future" means the local clock is wrong,
  // which breaks the check in the other direction. Worth surfacing, not fatal.
  if (ageSeconds < -120) {
    console.warn(`  ⚠ head block timestamp is ${-ageSeconds}s ahead of this machine's clock — check system time.`);
  }

  return { blockNumber: block.number, ageSeconds };
}

/** RPC URL, overridable when the default node is unhealthy. */
export const RPC_URL = process.env.GOAT_RPC_URL || 'https://rpc.goat.network';
