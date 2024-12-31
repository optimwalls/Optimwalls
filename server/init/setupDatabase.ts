import { db } from "@db";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { sql } from "drizzle-orm";

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
      // Execute initial migrations if needed
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'roles'
        );
      `);

      const tableExists = result.rows?.[0]?.exists || false;

      if (!tableExists) {
        log("Creating initial database structure...");
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role_id INTEGER NOT NULL,
            email TEXT UNIQUE,
            full_name TEXT,
            department TEXT,
            position TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_role FOREIGN KEY(role_id) REFERENCES roles(id)
          );
        `);
      }

      log("Database schema initialization completed");
    } catch (error) {
      console.error("Error during schema initialization:", error);
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
        .where(eq(users.username, "admin"))
        .limit(1);

      if (!superadmin) {
        // Create superadmin if it doesn't exist
        const hashedPassword = "admin"; // This will be properly hashed later
        const [newUser] = await db.insert(users).values({
          username: "admin",
          password: hashedPassword,
          roleId: superAdminRole.id,
          email: "admin@optimwalls.com",
          fullName: "System Administrator",
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