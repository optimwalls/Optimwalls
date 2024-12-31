import { neon } from '@neondatabase/serverless';
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure database URL with SSL
let connectionString = process.env.DATABASE_URL;
if (!connectionString.includes('sslmode=')) {
  connectionString += '?sslmode=require';
}

// Create the SQL connection
const sql = neon(connectionString);

// Initialize Drizzle with the schema
export const db = drizzle(sql, { schema });

// Test the connection by executing a simple query
sql`SELECT 1`.then(() => {
  console.log('Database connection established successfully');
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});