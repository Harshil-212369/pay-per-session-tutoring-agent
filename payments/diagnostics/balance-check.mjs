// balance-check.mjs  —  run: node balance-check.mjs   (ethers v6)
import { ethers } from 'ethers';

const RPC    = 'https://rpc.goat.network';
const USDC_E = '0x3022b87ac063DE95b1570F46f5e470F8B53112D8';
const WALLET = '0x09eE632927821d7B18Ac76Ff743821A30DA7c6bF';

const ERC20 = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const provider = new ethers.JsonRpcProvider(RPC);
const token = new ethers.Contract(USDC_E, ERC20, provider);

try {
  // Native BTC gas — required to actually SEND a payment, not just hold tokens.
  const gasRaw = await provider.getBalance(WALLET);
  console.log(`Gas  (BTC): ${ethers.formatEther(gasRaw)}  (raw=${gasRaw})`);

  // USDC.e token balance — the funds you'd be paying with.
  const [raw, decimals, symbol] = await Promise.all([
    token.balanceOf(WALLET),
    token.decimals(),
    token.symbol(),
  ]);
  console.log(`${symbol}: ${ethers.formatUnits(raw, decimals)}  (raw=${raw}, decimals=${decimals})`);
} catch (err) {
  console.error('Read failed:', err?.shortMessage ?? err?.message ?? err);
  console.error("→ Test RPC: curl -s https://rpc.goat.network -X POST " +
    "-H 'content-type: application/json' " +
    `-d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'`);
}