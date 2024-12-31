import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config(); // Load environment variables from .env file

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required. Please ensure the database is provisioned.");
}

// Ensure SSL mode is properly set in connection URL
let connectionString = process.env.DATABASE_URL;
if (!connectionString.includes('sslmode=')) {
  connectionString += '?sslmode=require';
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  },
  verbose: true,
  strict: true,
});