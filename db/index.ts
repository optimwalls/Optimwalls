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

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  }
});

// Initialize Drizzle with the schema
export const db = drizzle(pool, { schema });

// Test the connection by executing a simple query
pool.query('SELECT 1').then(() => {
  console.log('Database connection established successfully');
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});