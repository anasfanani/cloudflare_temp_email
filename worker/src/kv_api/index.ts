import { Hono } from 'hono';
import { getPasswords } from '../utils';

export const api = new Hono<HonoCustomType>();

// Auth middleware - use x-custom-auth (same as other API endpoints)
api.use('/api/kv/*', async (c, next) => {
  const passwords = getPasswords(c);
  if (!passwords || passwords.length === 0) {
    return c.text('PASSWORDS not configured', 500);
  }
  
  const auth = c.req.header('x-custom-auth');
  if (!auth || !passwords.includes(auth)) {
    return c.text('Unauthorized', 401);
  }
  
  if (!c.env.KV) {
    return c.text('KV not available', 500);
  }
  
  await next();
});

api.post('/api/kv/get', async (c) => {
  try {
    const { key, type } = await c.req.json();
    const value = type === 'json' 
      ? await c.env.KV.get(key, 'json')
      : await c.env.KV.get(key, 'text');
    return c.json({ value });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

api.post('/api/kv/put', async (c) => {
  try {
    const { key, value } = await c.req.json();
    await c.env.KV.put(key, value);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

api.post('/api/kv/delete', async (c) => {
  try {
    const { key } = await c.req.json();
    await c.env.KV.delete(key);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

api.post('/api/kv/list', async (c) => {
  try {
    const { prefix } = await c.req.json();
    const list = await c.env.KV.list({ prefix });
    return c.json({ keys: list.keys });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});
