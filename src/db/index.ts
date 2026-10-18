import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    if (process.env.DATABASE_URL) {
      global._postgresPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });
    } else if (process.env.SQL_HOST) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 5000,
      });
    } else {
      return null;
    }

    global._postgresPool.on('error', (err) => {
      console.warn('Unexpected error on idle SQL pool client:', err?.message || err);
    });
  }
  return global._postgresPool;
};

let dbExport: any;

try {
  const pool = createPool();
  if (pool) {
    dbExport = drizzle(pool, { schema });
  } else {
    throw new Error('Database not configured');
  }
} catch {
  console.warn('[AI Studio] PostgreSQL not connected — using mock fallback');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  const mockQueryBuilder = {
    from: () => mockQueryBuilder,
    where: () => mockQueryBuilder,
    orderBy: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    values: () => mockQueryBuilder,
    onConflictDoUpdate: () => mockQueryBuilder,
    returning: async () => [],
    then: (resolve: any) => Promise.resolve([]).then(resolve),
    catch: (reject: any) => Promise.resolve([]).catch(reject),
  };
  dbExport = new Proxy({} as any, {
    get: (_, prop) => {
      if (prop === 'query') return new Proxy({}, { get: () => noOp });
      if (prop === 'select' || prop === 'insert' || prop === 'delete' || prop === 'update') {
        return () => mockQueryBuilder;
      }
      return async () => [];
    },
  });
}

export const db = dbExport;
