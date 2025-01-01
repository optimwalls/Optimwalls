import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";
import { log } from "../server/vite";

// Basic database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // Required for Railway's SSL connection
  }
});

pool.on('connect', () => {
  log('PostgreSQL client connected to database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Initialize database
export async function initDb() {
  let client;
  try {
    log('Attempting to connect to PostgreSQL...');
    console.log('Using connection URL:', process.env.DATABASE_URL ? 'Present (URL hidden for security)' : 'Missing');

    client = await pool.connect();
    const result = await client.query('SELECT version()');
    log('Database connection successful');
    log(`PostgreSQL version: ${result.rows[0].version}`);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Clean up resources on shutdown
process.on('SIGTERM', async () => {
  try {
    await pool.end();
    log('Database pool has ended');
  } catch (err) {
    console.error('Error during pool shutdown:', err);
  }
});

// Helper for database transactions
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Handle unexpected errors
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled rejection:', err);
  try {
    await pool.end();
  } catch (endErr) {
    console.error('Error while ending pool on unhandled rejection:', endErr);
  }
  process.exit(-1);
});