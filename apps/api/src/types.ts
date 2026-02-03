import type { Context } from 'hono';

// ============================================================================
// API Types
// ============================================================================

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
  rateLimit: number;
}

export interface Permission {
  id: string;
  apiKeyId: string;
  userAddress: string;
  delegation: string;
  sessionAccount: string;
  sessionKey: string;
  chains: number[];
  constraints: PermissionConstraints;
  expiresAt: Date;
  createdAt: Date;
  usage: PermissionUsage;
}

export interface PermissionConstraints {
  spend?: SpendLimit[];
  contracts?: string[];
}

export interface SpendLimit {
  token: string;
  limit: string;
  period: 'hour' | 'day' | 'week' | 'month';
}

export interface PermissionUsage {
  spent: Record<string, string>;
  txCount: number;
  lastTxAt?: Date;
}

export interface Transaction {
  id: string;
  hash: string;
  permissionId: string;
  chainId: number;
  to: string;
  value: string;
  data?: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  createdAt: Date;
  confirmedAt?: Date;
  error?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface PermissionRequestBody {
  permission: {
    spend?: SpendLimit | SpendLimit[];
    chains?: number[];
    contracts?: string[];
    expiry?: string;
    description?: string;
  };
  callbackUrl?: string;
}

export interface PermissionRequestResponse {
  requestId: string;
  deepLink: string;
  qrCode?: string;
  expiresAt: string;
}

export interface ExecuteRequestBody {
  intent: {
    to: string;
    value?: string;
    data?: string;
    chainId: number;
    gasLimit?: string;
  };
  permissionId: string;
}

export interface ExecuteResponse {
  hash: string;
  chainId: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// ============================================================================
// Context Types
// ============================================================================

export interface Variables {
  apiKey?: ApiKey;
}

export type ApiContext = Context<{ Variables: Variables }>;
