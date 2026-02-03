import { createPublicClient, http, type Hex } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';
import type { Transaction, Permission } from '../types.js';
import { getPermission, validatePermission, updatePermissionUsage } from './permissions.js';

// In-memory transaction store (replace with database in production)
const transactions = new Map<string, Transaction>();

const CHAIN_MAP = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
  10: optimism,
  8453: base,
} as const;

// RPC URLs (in production, use Infura/Alchemy with API keys)
const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  137: 'https://polygon.llamarpc.com',
  42161: 'https://arbitrum.llamarpc.com',
  10: 'https://optimism.llamarpc.com',
  8453: 'https://base.llamarpc.com',
};

export interface ExecuteParams {
  to: string;
  value?: string;
  data?: string;
  chainId: number;
  gasLimit?: string;
}

/**
 * Execute a transaction using a permission
 */
export async function executeTransaction(
  permissionId: string,
  params: ExecuteParams
): Promise<Transaction> {
  // Get and validate permission
  const permission = getPermission(permissionId);
  if (!permission) {
    throw new Error('Permission not found');
  }

  const validation = validatePermission(permission, params.chainId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create transaction record
  const tx: Transaction = {
    id: crypto.randomUUID(),
    hash: '', // Will be set after submission
    permissionId,
    chainId: params.chainId,
    to: params.to,
    value: params.value || '0',
    data: params.data,
    status: 'pending',
    createdAt: new Date(),
  };

  transactions.set(tx.id, tx);

  try {
    // In production, this would:
    // 1. Create the UserOperation using the session account
    // 2. Sign with the session key
    // 3. Submit via a bundler
    // 4. Wait for inclusion
    
    // For now, simulate a transaction
    const hash = await simulateTransaction(permission, params);
    
    tx.hash = hash;
    tx.status = 'confirmed';
    tx.confirmedAt = new Date();

    // Update permission usage
    updatePermissionUsage(permissionId, 'ETH', params.value || '0');

    return tx;
  } catch (error) {
    tx.status = 'failed';
    tx.error = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
}

/**
 * Simulate transaction execution
 * In production, this would use the actual delegation framework
 */
async function simulateTransaction(
  permission: Permission,
  params: ExecuteParams
): Promise<Hex> {
  // Generate a mock transaction hash
  const mockHash = ('0x' + 
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  ) as Hex;

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return mockHash;
}

/**
 * Get transaction by ID
 */
export function getTransaction(id: string): Transaction | undefined {
  return transactions.get(id);
}

/**
 * Get transaction by hash
 */
export function getTransactionByHash(hash: string): Transaction | undefined {
  for (const tx of transactions.values()) {
    if (tx.hash === hash) {
      return tx;
    }
  }
  return undefined;
}

/**
 * Get transaction status from chain
 */
export async function getTransactionStatus(
  hash: Hex,
  chainId: number
): Promise<{ status: 'pending' | 'confirmed' | 'failed'; blockNumber?: bigint; gasUsed?: bigint }> {
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(RPC_URLS[chainId]),
  });

  try {
    const receipt = await client.getTransactionReceipt({ hash });
    return {
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch {
    return { status: 'pending' };
  }
}

/**
 * Get transaction history for a permission
 */
export function getTransactionHistory(
  permissionId: string,
  limit = 50
): Transaction[] {
  const txs: Transaction[] = [];
  
  for (const tx of transactions.values()) {
    if (tx.permissionId === permissionId) {
      txs.push(tx);
    }
  }

  return txs
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
