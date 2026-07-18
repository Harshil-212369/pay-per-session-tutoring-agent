// gas-check.mjs — READ ONLY. No key required. Sends nothing.
import { ethers } from "ethers";

const RPC   = "https://rpc.goat.network";
const CHAIN = 2345n;
const USDC  = "0x3022b87ac063DE95b1570F46f5e470F8B53112D8";
const A     = "0x09eE632927821d7B18Ac76Ff743821A30DA7c6bF"; // Aitch / merchant
const B     = process.env.STUDENT_ADDRESS || A;             // payer; falls back to A

const ERC20 = [
  "function transfer(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(RPC, Number(CHAIN));
const usdc     = new ethers.Contract(USDC, ERC20, provider);

const net = await provider.getNetwork();
if (net.chainId !== CHAIN) throw new Error(`WRONG CHAIN: got ${net.chainId}, want ${CHAIN}`);

const fee   = await provider.getFeeData();
const price = fee.maxFeePerGas ?? fee.gasPrice;
if (!price) throw new Error("RPC returned no gas price");

const gasWei  = await provider.getBalance(A);
const usdcBal = await usdc.balanceOf(A);

// Cost of one ERC-20 transfer. Estimated from A; add a cold-slot buffer because
// a first-ever transfer to a brand-new address writes a fresh storage slot (~20k gas).
const warmGas = await usdc.transfer.estimateGas(B, 1_000_000n, { from: A });
const coldGas = warmGas + 20_000n;
const nativeGas = 21_000n;

// The four transactions you actually need:
const plan = [
  ["1. A → B  gas top-up (native)",      nativeGas],
  ["2. A → B  fund 2 USDC.e (cold)",     coldGas  ],
  ["3. B → A  x402 payment (warm)",      warmGas  ],
  ["4. retry buffer (one more payment)", warmGas  ],
];

const btc = (w) => ethers.formatEther(w);
let total = 0n;

console.log(`\nchain ${net.chainId}  |  gasPrice ${ethers.formatUnits(price, "gwei")} gwei`);
console.log(`wallet A  gas: ${btc(gasWei)} BTC   USDC.e: ${ethers.formatUnits(usdcBal, 6)}\n`);
console.log("PLANNED SPEND");
for (const [label, gas] of plan) {
  const cost = gas * price;
  total += cost;
  console.log(`  ${label.padEnd(36)} ${String(gas).padStart(7)} gas   ${btc(cost)} BTC`);
}
console.log(`  ${"TOTAL REQUIRED".padEnd(36)} ${" ".repeat(7)}       ${btc(total)} BTC`);
console.log(`  ${"AVAILABLE".padEnd(36)} ${" ".repeat(7)}       ${btc(gasWei)} BTC\n`);

const headroom = Number(gasWei * 100n / total) / 100;
console.log(gasWei >= total
  ? `PASS — ${headroom.toFixed(2)}x headroom. Proceed.`
  : `FAIL — short by ${btc(total - gasWei)} BTC. Request top-up before spending.`);

  