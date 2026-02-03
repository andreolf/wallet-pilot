import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';

import permissionsRoutes from './routes/permissions.js';
import transactionsRoutes from './routes/transactions.js';

const app = new Hono();

// ============================================================================
// Middleware
// ============================================================================

app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://walletpilot.xyz'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'WalletPilot API',
    version: '0.1.0',
    status: 'healthy',
    docs: 'https://docs.walletpilot.xyz',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// API v1 routes
app.route('/v1/permissions', permissionsRoutes);
app.route('/v1/tx', transactionsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// ============================================================================
// Server
// ============================================================================

const port = parseInt(process.env.PORT || '3001');

console.log(`
╔═══════════════════════════════════════════╗
║         WalletPilot API v0.1.0            ║
╠═══════════════════════════════════════════╣
║  Local:   http://localhost:${port}            ║
║  Health:  http://localhost:${port}/health     ║
╚═══════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
