import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required",
  );
}

// Configure database URL with SSL
let connectionString = process.env.DATABASE_URL;
if (!connectionString.includes('sslmode=')) {
  connectionString += '?sslmode=require';
}

// Create a PostgreSQL pool with advanced configuration
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  }
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Test the connection and implement retry mechanism
async function initializeDatabase(retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Test both connection and transaction support
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT 1');
        await client.query('COMMIT');
        console.log('Database connection and transaction support verified successfully');
        client.release();
        return true;
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      console.error(`Attempt ${attempt}/${retries} failed:`, err);
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