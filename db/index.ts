import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from 'pg';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create PostgreSQL pool with proper configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000 // Return an error after 2 seconds if connection could not be established
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Test the connection and implement retry mechanism
async function initializeDatabase(retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN'); //Added from original code for transaction testing
        await client.query('SELECT 1'); // Simple query to test connection
        await client.query('COMMIT'); //Added from original code for transaction testing
        console.log('Database connection and transaction support verified successfully'); //Modified to reflect transaction test
        client.release();
        return true;
      } catch (err) {
        await client.query('ROLLBACK'); //Added from original code for transaction rollback
        client.release();
        throw err;
      }
    } catch (err) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) {
        console.error('Failed to connect to database after all retries');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Initialize database connection
export async function initDb() {
  const success = await initializeDatabase();
  if (!success) {
    throw new Error('Failed to initialize database connection');
  }
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

// Handle unexpected errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  pool.end(() => {
    process.exit(-1);
  });
});

// Export transaction helper (from original code)
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