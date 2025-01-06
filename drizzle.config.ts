import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_PUBLIC_URL) {
  throw new Error("DATABASE_PUBLIC_URL environment variable is required");
}

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_PUBLIC_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;