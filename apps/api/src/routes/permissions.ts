import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Variables } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  createPermissionRequest,
  generateDeepLink,
  getPermission,
  getPermissionsByApiKey,
  revokePermission,
  normalizeSpendLimits,
} from '../services/permissions.js';

const app = new Hono<{ Variables: Variables }>();

// ============================================================================
// Schemas
// ============================================================================

const spendLimitSchema = z.object({
  token: z.string(),
  limit: z.string(),
  period: z.enum(['hour', 'day', 'week', 'month']),
});

const permissionRequestSchema = z.object({
  permission: z.object({
    spend: z.union([spendLimitSchema, z.array(spendLimitSchema)]).optional(),
    chains: z.array(z.number()).optional(),
    contracts: z.array(z.string()).optional(),
    expiry: z.string().optional(),
    description: z.string().optional(),
  }),
  callbackUrl: z.string().url().optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /v1/permissions/request
 * Create a new permission request
 */
app.post(
  '/request',
  authMiddleware,
  zValidator('json', permissionRequestSchema),
  async (c) => {
    const body = c.req.valid('json');
    const apiKey = c.get('apiKey')!;

    const constraints = {
      spend: normalizeSpendLimits(body.permission.spend),
      contracts: body.permission.contracts,
    };

    const chains = body.permission.chains || [1]; // Default to Ethereum mainnet
    const expiry = body.permission.expiry || '30d';

    const { requestId, expiresAt } = createPermissionRequest(
      apiKey.id,
      constraints,
      chains,
      expiry,
      body.callbackUrl
    );

    const deepLink = generateDeepLink(requestId, constraints, chains, expiresAt);

    return c.json({
      success: true,
      data: {
        requestId,
        deepLink,
        expiresAt: expiresAt.toISOString(),
      },
    });
  }
);

/**
 * POST /v1/permissions/callback
 * Callback from MetaMask after permission grant
 */
app.post('/callback', async (c) => {
  // In production, this would:
  // 1. Verify the callback signature from MetaMask
  // 2. Store the delegation and session key
  // 3. Notify the original requester via their callback URL
  
  const body = await c.req.json();
  
  return c.json({
    success: true,
    message: 'Permission grant received',
  });
});

/**
 * GET /v1/permissions/:id
 * Get a permission by ID
 */
app.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const permission = getPermission(id);

  if (!permission) {
    return c.json({ success: false, error: 'Permission not found' }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: permission.id,
      userAddress: permission.userAddress,
      chains: permission.chains,
      constraints: permission.constraints,
      expiresAt: permission.expiresAt.toISOString(),
      usage: permission.usage,
    },
  });
});

/**
 * GET /v1/permissions
 * List all permissions for the API key
 */
app.get('/', authMiddleware, async (c) => {
  const apiKey = c.get('apiKey')!;
  const permissions = getPermissionsByApiKey(apiKey.id);

  return c.json({
    success: true,
    data: permissions.map(p => ({
      id: p.id,
      userAddress: p.userAddress,
      chains: p.chains,
      expiresAt: p.expiresAt.toISOString(),
      usage: p.usage,
    })),
  });
});

/**
 * DELETE /v1/permissions/:id
 * Revoke a permission
 */
app.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const deleted = revokePermission(id);

  if (!deleted) {
    return c.json({ success: false, error: 'Permission not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
