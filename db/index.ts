import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a new postgres client with SSL configuration
const queryClient = postgres(process.env.DATABASE_URL, { 
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

// Initialize database connection with detailed logging
export async function initDb() {
  console.log('Initializing database connection...');
  try {
    await queryClient`SELECT 1`;
    console.log('Database connection verified successfully');
    return true;
  } catch (err) {
    console.error('Failed to connect to database:', err);
    throw err;
  }
}

// Initialize Drizzle with the schema
export const db = drizzle(queryClient, { schema });

// Handle process termination gracefully
process.on('SIGTERM', async () => {
  await queryClient.end();
  console.log('Database connection closed');
  process.exit(0);
});

// Handle unexpected errors
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled rejection:', err);
  await queryClient.end();
  process.exit(-1);
});

// Export transaction helper
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const tx = await queryClient.begin();
  try {
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}