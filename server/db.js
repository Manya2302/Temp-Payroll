import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";
import { log } from './log.js';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is missing. Provide it in a .env file (DATABASE_URL=postgres://user:pass@host:port/db) or set it in the environment before running the server.',
  );
}

// Add SSL (common for Supabase/Neon) and diagnostics
let ssl = undefined;
try {
  // Enable SSL unless explicitly disabled
  ssl = { rejectUnauthorized: false };
} catch {}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[db] pool error', err);
});

(async () => {
  try {
    const url = new URL(process.env.DATABASE_URL);
    log(`DB connecting to ${url.hostname}:${url.port || '5432'} / ${url.pathname.replace('/', '')}`,'db');
    const client = await pool.connect();
    const { rows } = await client.query('select 1 as ok');
    log('DB connection test ok','db');
    client.release();
  } catch (e) {
    console.error('[db] initial connection test failed', e);
  }
})();

export const db = drizzle(pool, { schema });