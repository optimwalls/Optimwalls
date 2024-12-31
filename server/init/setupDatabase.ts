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
        log("Tables don't exist yet, continuing with setup...");
      } else {
        throw error;
      }
    }

    // Check for superadmin
    let superadmin;
    try {
      [superadmin] = await db
        .select()
        .from(users)
        .where(eq(users.username, "nizam.superadmin"))
        .limit(1);
    } catch (error: any) {
      // If table doesn't exist yet, continue
      if (error.message.includes('relation "users" does not exist')) {
        log("Users table will be created during migration");
        return true;
      }
      throw error;
    }

    if (!superadmin) {
      // Find or create SuperAdmin role first
      let superAdminRole;
      try {
        [superAdminRole] = await db
          .select()
          .from(roles)
          .where(eq(roles.name, "SuperAdmin"))
          .limit(1);

        if (!superAdminRole) {
          log("SuperAdmin role not found. It will be created during role setup.");
          return true;
        }

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
      } catch (error: any) {
        // If roles table doesn't exist, it will be created during migration
        if (error.message.includes('relation "roles" does not exist')) {
          log("Roles table will be created during migration");
          return true;
        }
        throw error;
      }
    } else {
      log("Superadmin user already exists");
    }

    return true;
  } catch (error: any) {
    console.error("Database setup failed:", error);
    throw error;
  }
}