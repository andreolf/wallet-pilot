import type { Permission, PermissionConstraints, SpendLimit } from '../types.js';

// In-memory permission store (replace with database in production)
const permissions = new Map<string, Permission>();
const permissionRequests = new Map<string, {
  constraints: PermissionConstraints;
  chains: number[];
  expiresAt: Date;
  callbackUrl?: string;
}>();

/**
 * Create a permission request
 */
export function createPermissionRequest(
  apiKeyId: string,
  constraints: PermissionConstraints,
  chains: number[],
  expiry: string,
  callbackUrl?: string
): { requestId: string; expiresAt: Date } {
  const requestId = crypto.randomUUID();
  const expiresAt = calculateExpiry(expiry);

  permissionRequests.set(requestId, {
    constraints,
    chains,
    expiresAt,
    callbackUrl,
  });

  // Clean up after expiry
  setTimeout(() => {
    permissionRequests.delete(requestId);
  }, expiresAt.getTime() - Date.now());

  return { requestId, expiresAt };
}

/**
 * Generate ERC-7715 deep link for MetaMask
 */
export function generateDeepLink(
  requestId: string,
  constraints: PermissionConstraints,
  chains: number[],
  expiresAt: Date
): string {
  // Build ERC-7715 permissions payload
  const permissions: object[] = [];

  // Add spend limits
  if (constraints.spend) {
    for (const spend of constraints.spend) {
      permissions.push({
        type: 'erc20-spend',
        data: {
          token: spend.token,
          allowance: spend.limit,
          period: spend.period,
        },
      });
    }
  }

  // Add chain restrictions
  if (chains.length > 0) {
    permissions.push({
      type: 'chain-id',
      data: { chains },
    });
  }

  // Add contract restrictions
  if (constraints.contracts?.length) {
    permissions.push({
      type: 'contract-call',
      data: { contracts: constraints.contracts },
    });
  }

  const payload = {
    method: 'wallet_grantPermissions',
    params: [{
      permissions,
      expiry: Math.floor(expiresAt.getTime() / 1000),
      signer: {
        type: 'session-key',
      },
    }],
    metadata: {
      requestId,
      callbackUrl: `https://api.walletpilot.xyz/v1/permissions/callback`,
    },
  };

  // For now, return a placeholder deep link
  // In production, this would use MetaMask's actual deep link format
  const encodedPayload = encodeURIComponent(JSON.stringify(payload));
  return `https://metamask.app.link/wc?payload=${encodedPayload}`;
}

/**
 * Store a granted permission
 */
export function storePermission(
  requestId: string,
  userAddress: string,
  delegation: string,
  sessionAccount: string,
  sessionKey: string
): Permission | null {
  const request = permissionRequests.get(requestId);
  if (!request) {
    return null;
  }

  const permission: Permission = {
    id: crypto.randomUUID(),
    apiKeyId: '', // Would be set from request context
    userAddress,
    delegation,
    sessionAccount,
    sessionKey,
    chains: request.chains,
    constraints: request.constraints,
    expiresAt: request.expiresAt,
    createdAt: new Date(),
    usage: {
      spent: {},
      txCount: 0,
    },
  };

  permissions.set(permission.id, permission);
  permissionRequests.delete(requestId);

  return permission;
}

/**
 * Get a permission by ID
 */
export function getPermission(id: string): Permission | undefined {
  return permissions.get(id);
}

/**
 * Get all permissions for an API key
 */
export function getPermissionsByApiKey(apiKeyId: string): Permission[] {
  return Array.from(permissions.values()).filter(
    p => p.apiKeyId === apiKeyId && p.expiresAt > new Date()
  );
}

/**
 * Validate a permission can execute on a chain
 */
export function validatePermission(
  permission: Permission,
  chainId: number
): { valid: boolean; error?: string } {
  if (permission.expiresAt < new Date()) {
    return { valid: false, error: 'Permission expired' };
  }

  if (!permission.chains.includes(chainId)) {
    return { valid: false, error: `Permission not valid for chain ${chainId}` };
  }

  return { valid: true };
}

/**
 * Update permission usage
 */
export function updatePermissionUsage(
  permissionId: string,
  token: string,
  amount: string
): void {
  const permission = permissions.get(permissionId);
  if (!permission) return;

  const currentSpent = BigInt(permission.usage.spent[token] || '0');
  permission.usage.spent[token] = (currentSpent + BigInt(amount)).toString();
  permission.usage.txCount++;
  permission.usage.lastTxAt = new Date();
}

/**
 * Revoke a permission
 */
export function revokePermission(id: string): boolean {
  return permissions.delete(id);
}

// ============================================================================
// Helpers
// ============================================================================

function calculateExpiry(duration: string): Date {
  const match = duration.match(/^(\d+)(h|d|w|m|y)$/);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const multipliers: Record<string, number> = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + num * multipliers[unit]);
}

function normalizeSpendLimits(
  spend?: SpendLimit | SpendLimit[]
): SpendLimit[] {
  if (!spend) return [];
  return Array.isArray(spend) ? spend : [spend];
}

export { normalizeSpendLimits };
