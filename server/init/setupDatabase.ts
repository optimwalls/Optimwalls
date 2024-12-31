import { db } from "@db";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";
import { crypto } from "../auth";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupDatabase() {
  try {
    log("Starting database setup...");

    // Run migrations
    const migrationsFolder = resolve(__dirname, "../../migrations");

    try {
      await migrate(db, { migrationsFolder });
      log("Database migrations completed successfully");
    } catch (error: any) {
      // Handle migration errors more gracefully
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        log("Running initial schema setup...");
      } else {
        throw error;
      }
    }

    // Initialize database schema
    try {
      await db.query("BEGIN");

      // Execute initial migrations if needed
      const [migrationCheck] = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'roles'
        );
      `);

      if (!migrationCheck.exists) {
        log("Creating initial database structure...");
        await db.query(initialMigration);
      }

      await db.query("COMMIT");
      log("Database schema initialization completed");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }

    // Check for superadmin role and user
    try {
      const [superAdminRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "SuperAdmin"))
        .limit(1);

      if (!superAdminRole) {
        log("SuperAdmin role not found. It will be created during role setup.");
        return true;
      }

      const [superadmin] = await db
        .select()
        .from(users)
        .where(eq(users.username, "nizam.superadmin"))
        .limit(1);

      if (!superadmin) {
        // Create superadmin if it doesn't exist
        const hashedPassword = await crypto.hash("superadmin");
        const [newUser] = await db.insert(users).values({
          username: "nizam.superadmin",
          password: hashedPassword,
          roleId: superAdminRole.id,
          email: "superadmin@optimwalls.com",
          fullName: "Nizam Super Admin",
          department: "Management",
          position: "Super Administrator",
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        if (newUser) {
          log("Superadmin user created successfully");
        }
      } else {
        log("Superadmin user already exists");
      }
    } catch (error: any) {
      // If tables don't exist, they will be created during migration
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        log("Core tables will be created during migration");
        return true;
      }
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Database setup failed:", error);
    throw error;
  }
}

const initialMigration = `
DO $$ 
BEGIN
  -- Create base tables if they don't exist
  CREATE TABLE IF NOT EXISTS "roles" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL UNIQUE,
    "created_at" timestamp DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY,
    "username" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "role_id" integer NOT NULL REFERENCES "roles" ("id"),
    "email" text UNIQUE,
    "full_name" text,
    "department" text,
    "position" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
  );
END $$;
`;