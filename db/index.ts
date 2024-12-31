import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";
import { log } from "../server/vite";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for database connection");
}

// Configuration for Replit PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Create the connection pool
const pool = new Pool(poolConfig);

// Test connection immediately and log details
pool.on('connect', () => {
  log('New client connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Basic initialization function with better error handling
export async function initDb() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT version()');
    log('Database connection established');
    log(`PostgreSQL version: ${result.rows[0].version}`);
    return true;
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Clean up on shutdown
process.on('SIGTERM', async () => {
  try {
    await pool.end();
    log('Database pool has ended');
  } catch (err) {
    console.error('Error during pool shutdown:', err);
  }
});

// Export transaction helper with improved error handling
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