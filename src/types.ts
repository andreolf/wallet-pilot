import { z } from "zod";
import type { WalletProviderId } from "./wallets/index.js";

// Chain IDs
export const SUPPORTED_CHAINS = {
  // EVM
  ETHEREUM: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  AVALANCHE: 43114,
  BSC: 56,
  // Solana (using 0 as convention)
  SOLANA: 0,
} as const;

// Permission Schema
export const SpendLimitSchema = z.object({
  daily: z.string(), // BigInt as string (6 decimals for USD)
  perTx: z.string(),
  token: z.string().optional(),
});

export const RequireApprovalSchema = z.object({
  above: z.string(),
  methods: z.array(z.string()),
});

export const ConstraintsSchema = z.object({
  spendLimit: SpendLimitSchema,
  allowedChains: z.array(z.number()),
  allowedProtocols: z.array(z.string()),
  allowedActions: z.array(z.string()),
  blockedMethods: z.array(z.string()),
  requireApproval: RequireApprovalSchema,
});

export const PermissionsSchema = z.object({
  version: z.string(),
  wallet: z.string(),
  constraints: ConstraintsSchema,
  expiry: z.string().nullable(),
  revoked: z.boolean(),
});

export type SpendLimit = z.infer<typeof SpendLimitSchema>;
export type RequireApproval = z.infer<typeof RequireApprovalSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type Permissions = z.infer<typeof PermissionsSchema>;

// Wallet Config
export interface WalletConfig {
  provider: WalletProviderId;
  extensionPath: string | null;
}

// Transaction Types
export interface TxIntent {
  to: string;
  value: bigint;
  data: string;
  chainId: number;
  from?: string;
  gasLimit?: bigint;
}

export interface DecodedTx {
  method: string;
  selector: string;
  args: Record<string, unknown>;
}

export interface GuardResult {
  allowed: boolean;
  reason?: GuardRejectReason;
  requiresApproval?: boolean;
  estimatedValueUsd?: bigint;
}

export type GuardRejectReason =
  | "revoked"
  | "expired"
  | "chain_not_allowed"
  | "protocol_not_allowed"
  | "action_not_allowed"
  | "method_blocked"
  | "exceeds_per_tx_limit"
  | "exceeds_daily_limit"
  | "simulation_failed";

// Logging Types
export interface TxLog {
  id: string;
  timestamp: number;
  action: AgentAction;
  intent: TxIntent;
  decodedTx?: DecodedTx;
  guardResult: GuardResult;
  outcome: TxOutcome;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
}

export type TxOutcome =
  | "confirmed"
  | "rejected_by_guard"
  | "rejected_by_user"
  | "failed"
  | "pending_approval";

export type AgentAction =
  | "connect"
  | "swap"
  | "send"
  | "sign"
  | "approve"
  | "balance"
  | "history";

// Wallet State
export interface WalletState {
  address: string;
  chainId: number;
  isConnected: boolean;
  balances: Map<string, bigint>;
  provider: WalletProviderId;
}

// Browser State
export interface BrowserState {
  isRunning: boolean;
  currentUrl: string | null;
  hasWalletPopup: boolean;
}

// Price Feed
export interface TokenPrice {
  address: string;
  chainId: number;
  priceUsd: number;
  timestamp: number;
}

// Known Protocols (EVM)
export const KNOWN_PROTOCOLS: Record<string, string> = {
  // Uniswap
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": "Uniswap V2 Router",
  "0xE592427A0AEce92De3Edee1F18E0157C05861564": "Uniswap V3 Router",
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45": "Uniswap Universal Router",
  // 1inch
  "0x1111111254EEB25477B68fb85Ed929f73A960582": "1inch Router",
  // SushiSwap
  "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F": "SushiSwap Router",
  // Curve
  "0x99a58482BD75cbab83b27EC03CA68fF489b5788f": "Curve Router",
};

// Known Method Selectors
export const KNOWN_METHODS: Record<string, string> = {
  "0x095ea7b3": "approve(address,uint256)",
  "0xa9059cbb": "transfer(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
  "0x38ed1739": "swapExactTokensForTokens",
  "0x7ff36ab5": "swapExactETHForTokens",
  "0x18cbafe5": "swapExactTokensForETH",
  "0x5ae401dc": "multicall(uint256,bytes[])",
  "0xac9650d8": "multicall(bytes[])",
  "0x3593564c": "execute(bytes,bytes[],uint256)",
};
