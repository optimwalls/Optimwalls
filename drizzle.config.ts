import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config(); // Load environment variables from .env file

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required. Please ensure the database is provisioned.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST!,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE!,
    port: Number(process.env.PGPORT),
  },
  verbose: true,
  strict: true,
});