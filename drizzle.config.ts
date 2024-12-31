import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config(); // Load environment variables from .env file

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required. Please ensure the database is provisioned.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});