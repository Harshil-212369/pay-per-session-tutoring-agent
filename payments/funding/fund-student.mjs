// fund-student.mjs — MOVES REAL FUNDS. Dry-run unless you pass --confirm.
import { ethers } from "ethers";

const RPC   = "https://rpc.goat.network";
const CHAIN = 2345n;
const USDC  = "0x3022b87ac063DE95b1570F46f5e470F8B53112D8";

const GAS_TO_SEND  = ethers.parseEther("0.000005"); // ~600 txs worth for B
const USDC_TO_SEND = 2_000_000n;                    // 2.0 USDC.e (6 decimals)

const ERC20 = [
  "function transfer(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

const KEY_A = process.env.WALLET_PRIVATE_KEY;
const ADDR_A = process.env.AGENT_ADDRESS;
const ADDR_B = process.env.STUDENT_ADDRESS;
if (!KEY_A || !ADDR_A || !ADDR_B) throw new Error("Missing env: WALLET_PRIVATE_KEY / AGENT_ADDRESS / STUDENT_ADDRESS");

const provider = new ethers.JsonRpcProvider(RPC, Number(CHAIN));
const walletA  = new ethers.Wallet(KEY_A, provider);
const usdc     = new ethers.Contract(USDC, ERC20, walletA);

// ---- GUARDS: fail loudly before touching money ----
const net = await provider.getNetwork();
if (net.chainId !== CHAIN) throw new Error(`WRONG CHAIN: ${net.chainId} (want ${CHAIN})`);

// This is the guard that saves you: proves WALLET_PRIVATE_KEY is A's key, not B's.
if (walletA.address.toLowerCase() !== ADDR_A.toLowerCase())
  throw new Error(`KEY MISMATCH: WALLET_PRIVATE_KEY derives ${walletA.address}, expected ${ADDR_A}. Keys are crossed. STOP.`);

if (ADDR_A.toLowerCase() === ADDR_B.toLowerCase())
  throw new Error("A === B. Payer and merchant must be distinct. STOP.");

const usdcA = await usdc.balanceOf(ADDR_A);
if (usdcA < USDC_TO_SEND) throw new Error(`Insufficient USDC.e: have ${ethers.formatUnits(usdcA, 6)}`);

console.log(`\nchain ${net.chainId}  |  signer ${walletA.address}  ✓ matches AGENT_ADDRESS`);
console.log(`PLAN:`);
console.log(`  A → B   ${ethers.formatEther(GAS_TO_SEND)} BTC (gas bootstrap)`);
console.log(`  A → B   ${ethers.formatUnits(USDC_TO_SEND, 6)} USDC.e`);
console.log(`  B = ${ADDR_B}\n`);

if (!process.argv.includes("--confirm")) {
  console.log("DRY RUN. Re-run with --confirm to execute.");
  process.exit(0);
}

// ---- EXECUTE ----
console.log("[1/2] sending gas…");
const tx1 = await walletA.sendTransaction({ to: ADDR_B, value: GAS_TO_SEND });
console.log(`      ${tx1.hash}`);
const r1 = await tx1.wait();
if (r1.status !== 1) throw new Error("gas transfer REVERTED");
console.log(`      confirmed block ${r1.blockNumber}`);

console.log("[2/2] sending USDC.e…");
const tx2 = await usdc.transfer(ADDR_B, USDC_TO_SEND);
console.log(`      ${tx2.hash}`);
const r2 = await tx2.wait();
if (r2.status !== 1) throw new Error("USDC transfer REVERTED");
console.log(`      confirmed block ${r2.blockNumber}`);

// ---- VERIFY ----
const gasB  = await provider.getBalance(ADDR_B);
const usdcB = await usdc.balanceOf(ADDR_B);
console.log(`\nWALLET B FUNDED`);
console.log(`  gas:    ${ethers.formatEther(gasB)} BTC`);
console.log(`  USDC.e: ${ethers.formatUnits(usdcB, 6)}`);
console.log(`\n  https://explorer.goat.network/tx/${tx2.hash}`);
console.log(gasB > 0n && usdcB >= USDC_TO_SEND ? "\nPASS — B can now pay." : "\nFAIL — check balances.");

