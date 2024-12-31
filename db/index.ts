import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Required for Neon serverless
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveTimeoutMillis: 5000,
  max: 10
});

export const db = drizzle(pool, { schema });