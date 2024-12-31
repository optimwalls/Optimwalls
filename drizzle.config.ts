import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure database URL with SSL
let connectionString = process.env.DATABASE_URL;
if (!connectionString.includes('sslmode=')) {
  connectionString += '?sslmode=require';
}

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  driver: 'pg',
  dbCredentials: {
    connectionString: connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;