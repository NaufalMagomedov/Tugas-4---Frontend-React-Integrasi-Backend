import mssql from 'mssql';
import { drizzle } from 'drizzle-orm/node-mssql';
import { env } from '../config/env.ts';

const config: mssql.config = {
  server: env.db.server,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  options: {
    encrypt: env.db.encrypt,
    trustServerCertificate: env.db.trustServerCertificate,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise: Promise<mssql.ConnectionPool> | null = null;
let dbPromise: ReturnType<typeof buildDb> | null = null;

async function buildDb() {
  poolPromise ??= mssql.connect(config);
  const pool = await poolPromise;
  return drizzle({ client: pool });
}

// Satu instance Drizzle dipakai ulang untuk seluruh aplikasi.
export function getDb() {
  if (!dbPromise) {
    dbPromise = buildDb().catch((error) => {
      dbPromise = null;
      poolPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/** Dipanggil saat server dimatikan agar koneksi SQL Server ditutup rapi. */
export async function closeDb(): Promise<void> {
  const pending = poolPromise;
  poolPromise = null;
  dbPromise = null;

  if (pending) {
    const pool = await pending;
    await pool.close();
  }
}
