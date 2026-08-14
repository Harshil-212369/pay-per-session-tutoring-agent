// create-order.mjs — issue an x402 order and print what the payer needs. MOVES NO FUNDS.
//
// Use when someone else's wallet is paying (agent-to-agent), so pay-session.mjs is the
// wrong tool: that script requires STUDENT_PRIVATE_KEY because it signs the transfer
// itself. Here the buyer signs on their side; we only issue the invoice.
//
// No private key is required or accepted. createOrder is authenticated by the merchant
// API key/secret, not by a wallet.
//
//   GOATX402_MERCHANT_ID=HarshilSuthar \
//   GOATX402_API_KEY=... GOATX402_API_SECRET=... \
//   node payments/session/create-order.mjs 0x<payer address> [amountWei]
//
// Orders expire. Create this immediately before handing the values to the payer.

import { GoatX402Client } from "goatx402-sdk-server";

const BASE_URL = process.env.GOATX402_API_URL || "https://flow-api.goat.network";
const MERCHANT = process.env.GOATX402_MERCHANT_ID;
const CHAIN    = 2345;
const USDC     = "0x3022b87ac063DE95b1570F46f5e470F8B53112D8"; // USDC.e, 6 decimals
const WALLET_A = "0x09eE632927821d7B18Ac76Ff743821A30DA7c6bF"; // Aitch — must receive

const FROM   = process.argv[2] || process.env.PAYER_ADDRESS;
const AMOUNT = process.argv[3] || "1000000"; // 1.0 USDC.e

// Throw, never default — a verification script that guesses is a false-green generator.
for (const [k, v] of Object.entries({
  GOATX402_MERCHANT_ID: MERCHANT,
  GOATX402_API_KEY:     process.env.GOATX402_API_KEY,
  GOATX402_API_SECRET:  process.env.GOATX402_API_SECRET,
})) if (!v) throw new Error(`Missing env: ${k}`);

if (!FROM) throw new Error("Payer address required: node create-order.mjs 0x<payer> — this is the BUYER's wallet, not yours.");
if (!/^0x[a-fA-F0-9]{40}$/.test(FROM)) throw new Error(`Not a valid address: ${FROM}`);
if (FROM.toLowerCase() === WALLET_A.toLowerCase()) throw new Error("Payer equals merchant. A merchant cannot buy from itself. STOP.");

const client = new GoatX402Client({
  baseUrl:   BASE_URL,
  apiKey:    process.env.GOATX402_API_KEY,
  apiSecret: process.env.GOATX402_API_SECRET,
});

// Probe first: validates the base URL and the receiving address before we create anything.
console.log(`probing ${BASE_URL} …`);
const merchant = await client.getMerchant(MERCHANT);
const token = merchant.supportedTokens.find(
  (t) => t.chainId === CHAIN && t.tokenContract.toLowerCase() === USDC.toLowerCase(),
);
if (!token) throw new Error(`merchant has no USDC.e on chain ${CHAIN}`);
if (merchant.receiveType !== "DIRECT") throw new Error(`receiveType=${merchant.receiveType}; expected DIRECT.`);
console.log(`  ${merchant.merchantId} · ${merchant.receiveType} · USDC.e ${token.tokenContract} · chain ${CHAIN}`);

const dappOrderId = `aitch-a2a-${Date.now()}`;
console.log(`\ncreating order ${dappOrderId} …`);

const order = await client.createOrder({
  dappOrderId,
  chainId:       CHAIN,
  tokenSymbol:   "USDC",
  tokenContract: USDC,
  fromAddress:   FROM,
  amountWei:     AMOUNT,
});

// The payer sends to payToAddress. If that is not wallet A, the money goes elsewhere.
if (order.payToAddress.toLowerCase() !== WALLET_A.toLowerCase())
  throw new Error(`payTo is ${order.payToAddress}, expected ${WALLET_A}. DO NOT SEND THIS TO THE PAYER.`);
if (order.fromChainId && order.fromChainId !== CHAIN)
  throw new Error(`order chain is ${order.fromChainId}, expected ${CHAIN}.`);

const expires = order.expiresAt ? new Date(order.expiresAt * 1000).toISOString() : "unknown";

console.log("\n──────── SEND THESE TWO VALUES TO THE PAYER ────────");
console.log(`orderId       ${order.orderId}`);
console.log(`payToAddress  ${order.payToAddress}`);
console.log("───────────────────────────────────────────────────");
console.log(`\ncontext (already known to them):`);
console.log(`  amount   ${Number(order.amountWei) / 1e6} USDC.e  (${order.amountWei} wei)`);
console.log(`  token    ${USDC}`);
console.log(`  chain    ${CHAIN}`);
console.log(`  flow     ${order.flow}`);
console.log(`  payer    ${FROM}`);
console.log(`  expires  ${expires}`);
console.log(`\nTrack it:  node payments/diagnostics/check-order.mjs ${order.orderId}`);
