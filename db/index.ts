import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

// Basic configuration without any extras
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test connection immediately and log details
pool.connect((err, client, release) => {
  if (err) {
    console.error('Initial connection error:', err);
    console.error('Connection details:', {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
    });
    return;
  }

  client.query('SELECT version()', (err, result) => {
    release();
    if (err) {
      console.error('Query error:', err);
      return;
    }
    console.log('Connected to PostgreSQL:', result.rows[0]);
  });
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Basic initialization function
export async function initDb() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT version()');
      console.log('Database connection verified');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

// Clean up on shutdown
process.on('SIGTERM', () => {
  pool.end();
});


// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Export transaction helper
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
  await pool.end();
  process.exit(-1);
});