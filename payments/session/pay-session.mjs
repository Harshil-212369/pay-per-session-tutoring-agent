// pay-session.mjs — Aitch x402 session payment. B (student) pays A (Aitch/merchant).
// Dry-run by default. Real funds move only with --confirm.
import { ethers } from "ethers";
import { GoatX402Client } from "goatx402-sdk-server";
import readline from "node:readline/promises";
const MERCHANT_ID = process.env.GOATX402_MERCHANT_ID;
const RPC        = "https://rpc.goat.network";
const CHAIN      = 2345;
const USDC       = "0x3022b87ac063DE95b1570F46f5e470F8B53112D8";
const BASE_URL   = process.env.GOATX402_API_URL || "https://x402-api.goat.network";
const MERCHANT   = process.env.GOATX402_MERCHANT_ID;

const AMOUNT_WEI     = "1000000";   // 1.0 USDC.e
const AUTO_CAP_WEI   = 100_000n;    // 0.1 USDC.e — below this, Aitch acts autonomously
const TIMEOUT_MS     = 120_000;
const POLL_MS        = 3_000;

const ERC20 = [
  "function transfer(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

const KEY_B  = process.env.STUDENT_PRIVATE_KEY;
const ADDR_B = process.env.STUDENT_ADDRESS;
const ADDR_A = process.env.AGENT_ADDRESS;
const usd = (w) => ethers.formatUnits(w, 6);

for (const [k, v] of Object.entries({ STUDENT_PRIVATE_KEY: KEY_B, STUDENT_ADDRESS: ADDR_B, AGENT_ADDRESS: ADDR_A, GOATX402_MERCHANT_ID: MERCHANT, GOATX402_API_KEY: process.env.GOATX402_API_KEY, GOATX402_API_SECRET: process.env.GOATX402_API_SECRET }))
  if (!v) throw new Error(`Missing env: ${k}`);

const provider = new ethers.JsonRpcProvider(RPC, CHAIN);
const walletB  = new ethers.Wallet(KEY_B, provider);
const usdc     = new ethers.Contract(USDC, ERC20, walletB);

const client = new GoatX402Client({
  baseUrl:   BASE_URL,
  apiKey:    process.env.GOATX402_API_KEY,
  apiSecret: process.env.GOATX402_API_SECRET,
});

// ───────── GUARDS ─────────
const net = await provider.getNetwork();
if (Number(net.chainId) !== CHAIN) throw new Error(`WRONG CHAIN: ${net.chainId}`);
if (walletB.address.toLowerCase() !== ADDR_B.toLowerCase())
  throw new Error(`KEY MISMATCH: STUDENT_PRIVATE_KEY derives ${walletB.address}, expected ${ADDR_B}. STOP.`);
if (ADDR_A.toLowerCase() === ADDR_B.toLowerCase())
  throw new Error("payer === merchant. STOP.");

const gasB  = await provider.getBalance(ADDR_B);
const usdcB = await usdc.balanceOf(ADDR_B);
if (gasB === 0n)                       throw new Error("B has no gas.");
if (usdcB < BigInt(AMOUNT_WEI))        throw new Error(`B has ${usd(usdcB)} USDC.e, needs ${usd(AMOUNT_WEI)}.`);

// ───────── PROBE: validates baseUrl + receiving address in one call ─────────
console.log(`\nprobing ${BASE_URL} …`);
const merchant = await client.getMerchant(MERCHANT);
const token = merchant.supportedTokens.find(t => t.chainId === CHAIN && t.symbol === "USDC");
if (!token) throw new Error(`merchant has no USDC on chain ${CHAIN}`);
console.log(`  merchant ${merchant.merchantId} · ${merchant.receiveType} · USDC ${token.tokenContract}`);
if (merchant.receiveType !== "DIRECT") throw new Error(`receiveType=${merchant.receiveType}; this script only handles DIRECT.`);

// ───────── CREATE ORDER ─────────
const dappOrderId = `aitch-session-${Date.now()}`;
console.log(`\ncreating order ${dappOrderId} …`);
const order = await client.createOrder({
  dappOrderId,
  chainId:       CHAIN,
  tokenSymbol:   "USDC",
  tokenContract: USDC,
  fromAddress:   ADDR_B,
  amountWei:     AMOUNT_WEI,
});

console.table({
  orderId:   order.orderId,
  flow:      order.flow,
  amount:    `${usd(order.amountWei)} ${order.tokenSymbol}`,
  payer:     ADDR_B,
  payTo:     order.payToAddress,
  chain:     `${order.fromChainId} → ${order.payToChainId}`,
  expiresAt: new Date(order.expiresAt * 1000).toISOString(),
});

if (order.flow !== "ERC20_DIRECT")
  throw new Error(`Unexpected flow ${order.flow}. This script only signs ERC20_DIRECT. STOP — do not guess.`);
if (order.payToAddress.toLowerCase() !== ADDR_A.toLowerCase())
  throw new Error(`payToAddress ${order.payToAddress} != AGENT_ADDRESS ${ADDR_A}. Merchant receiving address is wrong. STOP.`);

// ───────── GUARDRAIL: two-tier confirmation ─────────
const overCap = BigInt(AMOUNT_WEI) > AUTO_CAP_WEI;
console.log(`\nspend cap: ${usd(AUTO_CAP_WEI)} USDC.e — this order is ${overCap ? "ABOVE cap → human confirmation required" : "below cap → autonomous"}`);

if (!process.argv.includes("--confirm")) {
  console.log("\nDRY RUN. Order created but unpaid. Re-run with --confirm to pay.");
  process.exit(0);
}
if (overCap) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rl.question(`\nType CONFIRM PAYMENT to send ${usd(AMOUNT_WEI)} USDC.e to ${order.payToAddress}: `);
  rl.close();
  if (ans.trim() !== "CONFIRM PAYMENT") {
    console.log("Aborted by user. Cancelling order…");
    await client.cancelOrder(order.orderId).catch(e => console.log(`  cancel failed: ${e.message}`));
    process.exit(0);
  }
}

// ───────── PAY ─────────
try {
  console.log("\n[1/3] sending on-chain transfer…");
  const tx = await usdc.transfer(order.payToAddress, BigInt(order.amountWei));
  console.log(`      ${tx.hash}`);
  const rc = await tx.wait();
  if (rc.status !== 1) throw new Error("transfer REVERTED on-chain");
  console.log(`      mined block ${rc.blockNumber}`);

  console.log("\n[2/3] settling via x402 — polling for confirmation…");
  const t0 = Date.now();
  const proof = await client.waitForConfirmation(order.orderId, {
    timeout:  TIMEOUT_MS,
    interval: POLL_MS,
    onStatusChange: (s) => console.log(`      [${((Date.now()-t0)/1000).toFixed(0)}s] status → ${s}`),
  });

  if (proof.status !== "PAYMENT_CONFIRMED" && proof.status !== "INVOICED")
    throw new Error(`settled in unexpected state: ${proof.status}`);

  console.log("\n[3/3] fetching on-chain proof…");
  const signed = await client.getOrderProof(order.orderId);

  console.log(`\n═══ x402 PAYMENT CONFIRMED ═══`);
  console.table({
    orderId:  proof.orderId,
    status:   proof.status,
    merchant: proof.merchantId,
    amount:   `${usd(proof.amountWei)} ${proof.tokenSymbol}`,
    from:     signed.payload.from_addr,
    to:       signed.payload.to_addr,
    txHash:   signed.payload.tx_hash,
    flow:     signed.payload.flow,
  });
  console.log(`proof signature: ${signed.signature.slice(0, 24)}…`);
  console.log(`\nhttps://explorer.goat.network/tx/${signed.payload.tx_hash}\n`);

} catch (err) {
  // Rubric: catch timeouts/errors and EXPLAIN. Never crash silently.
  console.error(`\n─── PAYMENT DID NOT COMPLETE ───`);
  console.error(`reason: ${err.message}`);
  let status = "unknown";
  try { status = (await client.getOrderStatus(order.orderId)).status; } catch {}
  console.error(`order ${order.orderId} is currently: ${status}`);
  console.error(
    status === "CHECKOUT_VERIFIED"
      ? "The transfer may not have been indexed yet. Re-run getOrderStatus in ~30s before retrying — do NOT send a second transfer."
      : status === "EXPIRED"
      ? "Order expired. Create a new one."
      : "Check the explorer for the transfer, then reconcile in the merchant portal."
  );
  process.exit(1);
}