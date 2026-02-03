import type { TokenPrice } from "./types.js";

const priceCache = new Map<string, TokenPrice>();

const TOKEN_ADDRESSES: Record<string, Record<number, string>> = {
  ETH: {
    1: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    137: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
  SOL: {
    0: "So11111111111111111111111111111111111111112", // Native SOL
  },
  USDC: {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    0: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana
  },
  USDT: {
    1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  },
};

const COINGECKO_IDS: Record<string, string> = {
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "ethereum",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "usd-coin",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "tether",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "wrapped-bitcoin",
  "So11111111111111111111111111111111111111112": "solana",
};

export async function getTokenPrice(
  address: string,
  chainId: number
): Promise<number> {
  const cacheKey = `${chainId}:${address.toLowerCase()}`;
  const cached = priceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.priceUsd;
  }

  const stablecoins = ["USDC", "USDT", "DAI", "FRAX"];
  for (const stable of stablecoins) {
    if (
      TOKEN_ADDRESSES[stable]?.[chainId]?.toLowerCase() === address.toLowerCase()
    ) {
      const price = 1.0;
      priceCache.set(cacheKey, {
        address,
        chainId,
        priceUsd: price,
        timestamp: Date.now(),
      });
      return price;
    }
  }

  try {
    const coingeckoId = COINGECKO_IDS[address];
    if (coingeckoId) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
      );
      const data = (await response.json()) as Record<string, { usd?: number }>;
      const price = data[coingeckoId]?.usd || 0;

      priceCache.set(cacheKey, {
        address,
        chainId,
        priceUsd: price,
        timestamp: Date.now(),
      });

      return price;
    }
  } catch (error) {
    console.warn(`Failed to fetch price for ${address}:`, error);
  }

  return 0;
}

export async function estimateUsdValue(
  tokenAddress: string,
  amount: bigint,
  decimals: number,
  chainId: number
): Promise<bigint> {
  const price = await getTokenPrice(tokenAddress, chainId);

  const amountFloat = Number(amount) / 10 ** decimals;
  const usdValue = amountFloat * price;

  return BigInt(Math.floor(usdValue * 1e6));
}

export async function estimateTxValueUsd(
  value: bigint,
  chainId: number
): Promise<bigint> {
  if (value === 0n) return 0n;

  // Solana native
  if (chainId === 0) {
    const solPrice = await getTokenPrice(
      "So11111111111111111111111111111111111111112",
      0
    );
    const solAmount = Number(value) / 1e9; // SOL has 9 decimals
    const usdValue = solAmount * solPrice;
    return BigInt(Math.floor(usdValue * 1e6));
  }

  // EVM native (ETH)
  const ethPrice = await getTokenPrice(
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    chainId
  );

  const ethAmount = Number(value) / 1e18;
  const usdValue = ethAmount * ethPrice;

  return BigInt(Math.floor(usdValue * 1e6));
}

export function formatUsd(value: bigint): string {
  const dollars = Number(value) / 1e6;
  return `$${dollars.toFixed(2)}`;
}

export function parseUsd(value: string): bigint {
  const cleaned = value.replace(/[$,]/g, "");
  const dollars = parseFloat(cleaned);
  return BigInt(Math.floor(dollars * 1e6));
}
