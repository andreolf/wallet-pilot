/**
 * WalletPilot Cursor Skill
 * 
 * Provides AI agents with wallet automation capabilities.
 */

import { WalletPilot, PermissionBuilder } from '@walletpilot/sdk';
import { createPublicClient, http, formatEther, formatUnits, type Address } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';

// ============================================================================
// Chain Configuration
// ============================================================================

const CHAINS = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
  10: optimism,
  8453: base,
} as const;

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
};

// Common token addresses
const TOKENS: Record<string, Record<number, Address>> = {
  USDC: {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  USDT: {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
};

// ============================================================================
// Skill Actions
// ============================================================================

/**
 * Initialize a WalletPilot client
 */
export function createClient(apiKey?: string): WalletPilot {
  return new WalletPilot({
    apiKey: apiKey || process.env.WALLETPILOT_API_KEY,
    debug: true,
  });
}

/**
 * Request wallet permissions from user
 */
export async function connect(options: {
  apiKey?: string;
  spendLimits?: Array<{ token: string; limit: string; period: 'hour' | 'day' | 'week' | 'month' }>;
  chains?: number[];
  expiry?: string;
}): Promise<{ deepLink: string; requestId: string }> {
  const pilot = createClient(options.apiKey);
  
  const builder = new PermissionBuilder();
  
  // Add spend limits
  for (const limit of options.spendLimits || [{ token: 'USDC', limit: '100', period: 'day' as const }]) {
    builder.spend(limit.token, limit.limit, limit.period);
  }
  
  // Add chains
  builder.chains(options.chains || [1, 137, 42161]);
  
  // Add expiry
  builder.expiry(options.expiry || '30d');
  
  const permission = builder.build();
  const result = await pilot.requestPermission(permission);
  
  console.log('\n📱 Open this link in MetaMask to approve:\n');
  console.log(result.deepLink);
  console.log('\n');
  
  return {
    deepLink: result.deepLink,
    requestId: result.requestId,
  };
}

/**
 * Execute a transaction
 */
export async function execute(options: {
  apiKey?: string;
  to: Address;
  data?: `0x${string}`;
  value?: string;
  chainId: number;
}): Promise<{ hash: string; status: string }> {
  const pilot = createClient(options.apiKey);
  
  const result = await pilot.execute({
    to: options.to,
    data: options.data,
    value: options.value ? BigInt(options.value) : undefined,
    chainId: options.chainId,
  });
  
  console.log(`\n✅ Transaction submitted: ${result.hash}`);
  console.log(`   Chain: ${CHAIN_NAMES[options.chainId] || options.chainId}`);
  console.log(`   Status: ${result.status}\n`);
  
  return {
    hash: result.hash,
    status: result.status,
  };
}

/**
 * Get ETH balance for an address
 */
export async function getBalance(address: Address, chainId = 1): Promise<string> {
  const chain = CHAINS[chainId as keyof typeof CHAINS];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  
  const client = createPublicClient({
    chain,
    transport: http(),
  });
  
  const balance = await client.getBalance({ address });
  const formatted = formatEther(balance);
  
  console.log(`\n💰 Balance on ${CHAIN_NAMES[chainId]}:`);
  console.log(`   ${formatted} ETH\n`);
  
  return formatted;
}

/**
 * Get ERC20 token balance
 */
export async function getTokenBalance(
  address: Address,
  token: string,
  chainId = 1
): Promise<string> {
  const chain = CHAINS[chainId as keyof typeof CHAINS];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  
  const tokenAddress = TOKENS[token.toUpperCase()]?.[chainId];
  if (!tokenAddress) {
    throw new Error(`Token ${token} not found on chain ${chainId}`);
  }
  
  const client = createPublicClient({
    chain,
    transport: http(),
  });
  
  const balance = await client.readContract({
    address: tokenAddress,
    abi: [{
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    }],
    functionName: 'balanceOf',
    args: [address],
  });
  
  // Assume 6 decimals for stablecoins
  const formatted = formatUnits(balance as bigint, 6);
  
  console.log(`\n💰 ${token.toUpperCase()} Balance on ${CHAIN_NAMES[chainId]}:`);
  console.log(`   ${formatted} ${token.toUpperCase()}\n`);
  
  return formatted;
}

/**
 * List supported chains
 */
export function listChains(): void {
  console.log('\n🔗 Supported Chains:\n');
  for (const [id, name] of Object.entries(CHAIN_NAMES)) {
    console.log(`   ${id}: ${name}`);
  }
  console.log('');
}

/**
 * List supported tokens
 */
export function listTokens(): void {
  console.log('\n🪙 Supported Tokens:\n');
  for (const [token, chains] of Object.entries(TOKENS)) {
    const chainIds = Object.keys(chains).map(id => CHAIN_NAMES[parseInt(id)]).join(', ');
    console.log(`   ${token}: ${chainIds}`);
  }
  console.log('');
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2];

switch (command) {
  case 'connect':
    connect({}).catch(console.error);
    break;
  case 'balance':
    const addr = process.argv[3] as Address;
    if (!addr) {
      console.error('Usage: walletpilot balance <address>');
      process.exit(1);
    }
    getBalance(addr).catch(console.error);
    break;
  case 'chains':
    listChains();
    break;
  case 'tokens':
    listTokens();
    break;
  case 'help':
  default:
    console.log(`
WalletPilot Skill

Commands:
  connect              Request wallet permissions
  balance <address>    Get ETH balance
  chains               List supported chains
  tokens               List supported tokens
  help                 Show this help

Environment:
  WALLETPILOT_API_KEY  Your WalletPilot API key
`);
}
