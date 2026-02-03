import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Hex } from 'viem';
import type { Variables } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  executeTransaction,
  getTransaction,
  getTransactionByHash,
  getTransactionStatus,
  getTransactionHistory,
} from '../services/transactions.js';

const app = new Hono<{ Variables: Variables }>();

// ============================================================================
// Schemas
// ============================================================================

const executeSchema = z.object({
  intent: z.object({
    to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    value: z.string().optional(),
    data: z.string().optional(),
    chainId: z.number(),
    gasLimit: z.string().optional(),
  }),
  permissionId: z.string().uuid(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /v1/tx/execute
 * Execute a transaction using a permission
 */
app.post(
  '/execute',
  authMiddleware,
  zValidator('json', executeSchema),
  async (c) => {
    const body = c.req.valid('json');

    try {
      const tx = await executeTransaction(body.permissionId, body.intent);

      return c.json({
        success: true,
        data: {
          id: tx.id,
          hash: tx.hash,
          chainId: tx.chainId,
          status: tx.status,
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      }, 400);
    }
  }
);

/**
 * GET /v1/tx/:hash
 * Get transaction by hash
 */
app.get('/:hash', authMiddleware, async (c) => {
  const hash = c.req.param('hash');
  
  // First check our records
  const tx = getTransactionByHash(hash);
  
  if (tx) {
    return c.json({
      success: true,
      data: {
        id: tx.id,
        hash: tx.hash,
        chainId: tx.chainId,
        to: tx.to,
        value: tx.value,
        status: tx.status,
        gasUsed: tx.gasUsed,
        createdAt: tx.createdAt.toISOString(),
        confirmedAt: tx.confirmedAt?.toISOString(),
        error: tx.error,
      },
    });
  }

  return c.json({ success: false, error: 'Transaction not found' }, 404);
});

/**
 * GET /v1/tx/:hash/status
 * Get transaction status from chain
 */
app.get('/:hash/status', authMiddleware, async (c) => {
  const hash = c.req.param('hash') as Hex;
  const chainId = parseInt(c.req.query('chainId') || '1');

  try {
    const status = await getTransactionStatus(hash, chainId);
    
    return c.json({
      success: true,
      data: {
        hash,
        chainId,
        status: status.status,
        blockNumber: status.blockNumber?.toString(),
        gasUsed: status.gasUsed?.toString(),
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status',
    }, 400);
  }
});

/**
 * GET /v1/tx/history/:permissionId
 * Get transaction history for a permission
 */
app.get('/history/:permissionId', authMiddleware, async (c) => {
  const permissionId = c.req.param('permissionId');
  const limit = parseInt(c.req.query('limit') || '50');

  const transactions = getTransactionHistory(permissionId, limit);

  return c.json({
    success: true,
    data: transactions.map(tx => ({
      id: tx.id,
      hash: tx.hash,
      chainId: tx.chainId,
      to: tx.to,
      value: tx.value,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
    })),
  });
});

export default app;
