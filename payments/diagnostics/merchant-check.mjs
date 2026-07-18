  // merchant-check.mjs  —  run: node merchant-check.mjs
  import { GoatX402Client } from 'goatx402-sdk-server';

  // ⚠️ VERIFY this host in the portal's Developer section. The SDK docstring
  //    example uses https://api.goatx402.io — confirm it's the GOAT mainnet host.
  const BASE_URL = process.env.GOATX402_API_URL || 'https://x402-api.goat.network'; // GOAT mainnet
  const MERCHANT_ID = process.env.GOATX402_MERCHANT_ID;
  const GOAT_CHAIN  = 2345;
  const USDC_E = '0x3022b87ac063DE95b1570F46f5e470F8B53112D8'; // GOAT USDC.e (verified). NOT Base USDC 0x833589fc...a02913

  if (!MERCHANT_ID) { console.error('Set GOATX402_MERCHANT_ID'); process.exit(1); }

  // getMerchant needs no auth — empty key/secret is fine for this public check.
  const client = new GoatX402Client({
    baseUrl: BASE_URL,// Change this one. 
    apiKey: process.env.GOATX402_API_KEY || '',
    apiSecret: process.env.GOATX402_API_SECRET || '',
  });

  try {
    const m = await client.getMerchant(MERCHANT_ID);

    console.log('supportedTokens:', JSON.stringify(m.supportedTokens, null, 2));

    console.log(`LISTED ✓  id=${m.merchantId}  name=${m.name}  type=${m.receiveType}`);

    const usdcE = m.supportedTokens.find(
      t => t.chainId === GOAT_CHAIN &&
          t.tokenContract.toLowerCase() === USDC_E.toLowerCase()
    );
    console.log(usdcE
      ? 'USDC.e on chain 2345: configured ✓ — payment-ready'
      : 'USDC.e on chain 2345: MISSING — add it under portal → Settings');
  } catch (err) {
    // GoatX402Error carries .status — 404 typically = not approved/listed yet.
    console.error(`NOT retrievable (status ${err?.status ?? '?'}): ${err?.message ?? err}`);
    console.error('→ If 404: not yet approved. Confirm in portal + ping t.me/goatbuilderhub.');
  }