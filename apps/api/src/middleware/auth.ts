import { createMiddleware } from 'hono/factory';
import type { Variables } from '../types.js';

// In-memory API key store (replace with database in production)
const API_KEYS = new Map<string, { id: string; name: string; rateLimit: number }>();

// Add a demo key for testing
API_KEYS.set('wp_demo_key_12345', {
  id: 'demo',
  name: 'Demo Key',
  rateLimit: 100,
});

/**
 * Authentication middleware
 * Validates API key from Authorization header
 */
export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ success: false, error: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token.startsWith('wp_')) {
      return c.json({ success: false, error: 'Invalid API key format' }, 401);
    }

    const keyData = API_KEYS.get(token);
    
    if (!keyData) {
      return c.json({ success: false, error: 'Invalid API key' }, 401);
    }

    // Set API key in context
    c.set('apiKey', {
      ...keyData,
      key: token,
      createdAt: new Date(),
    });

    await next();
  }
);

/**
 * Optional auth - doesn't fail if no key provided
 */
export const optionalAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const keyData = API_KEYS.get(token);
      
      if (keyData) {
        c.set('apiKey', {
          ...keyData,
          key: token,
          createdAt: new Date(),
        });
      }
    }

    await next();
  }
);
