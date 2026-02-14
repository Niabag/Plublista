import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { Agent, setGlobalDispatcher } from 'undici';
import * as schema from './schema/index';

// Increase TCP connect timeout to 30s to handle Neon free-tier cold starts (~12s)
setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle({ client: sql, schema });
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
