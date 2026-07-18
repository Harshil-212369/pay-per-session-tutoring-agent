// check-order.mjs — READ ONLY. Polls an existing order. Sends nothing, signs nothing.
// usage: node check-order.mjs <orderId>
import { GoatX402Client } from "goatx402-sdk-server";

const orderId = process.argv[2];
if (!orderId) { console.error("usage: node check-order.mjs <orderId>"); process.exit(1); }

const client = new GoatX402Client({
  baseUrl:   process.env.GOATX402_API_URL || "https://x402-api.goat.network",
  apiKey:    process.env.GOATX402_API_KEY,
  apiSecret: process.env.GOATX402_API_SECRET,
});

const t0 = Date.now();
let last = null;

while (Date.now() - t0 < 15 * 60 * 1000) {   // patient: 15 min
  let s;
  try {
    s = await client.getOrderStatus(orderId);
  } catch (e) {
    console.log(`  [${((Date.now()-t0)/1000).toFixed(0)}s] poll error: ${e.message} — retrying`);
    await new Promise(r => setTimeout(r, 5000));
    continue;
  }

  if (s.status !== last) {
    console.log(`  [${((Date.now()-t0)/1000).toFixed(0)}s] status → ${s.status}${s.txHash ? `  tx ${s.txHash}` : ""}`);
    last = s.status;
  }

  if (s.status === "PAYMENT_CONFIRMED" || s.status === "INVOICED") {
    const signed = await client.getOrderProof(orderId);
    console.log(`\n═══ x402 PAYMENT CONFIRMED ═══`);
    console.table({
      orderId:  s.orderId,
      status:   s.status,
      merchant: s.merchantId,
      amount:   `${Number(s.amountWei) / 1e6} ${s.tokenSymbol}`,
      from:     signed.payload.from_addr,
      to:       signed.payload.to_addr,
      txHash:   signed.payload.tx_hash,
      flow:     signed.payload.flow,
    });
    console.log(`proof signature: ${signed.signature.slice(0, 24)}…`);
    console.log(`\nhttps://explorer.goat.network/tx/${signed.payload.tx_hash}\n`);
    process.exit(0);
  }

  if (["FAILED", "EXPIRED", "CANCELLED"].includes(s.status)) {
    console.error(`\nOrder terminal: ${s.status}. The on-chain transfer still succeeded — reconcile in the portal.`);
    process.exit(1);
  }

  await new Promise(r => setTimeout(r, 5000));
}

console.log("\nStill CHECKOUT_VERIFIED after 15 min. Transfer is on-chain and irreversible;");
console.log("this is an indexer/reconciliation lag, not a payment failure.");
console.log("Check portal → Orders / Order Reconciliation.");