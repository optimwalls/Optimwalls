import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@db";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";
import { crypto } from "../auth";
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
    await migrate(db, { migrationsFolder });
    log("Database migrations completed");

    // Check for superadmin
    const [superadmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "nizam.superadmin"))
      .limit(1);

    if (!superadmin) {
      // Find or create SuperAdmin role first
      const [superAdminRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "SuperAdmin"))
        .limit(1);

      if (!superAdminRole) {
        log("Critical Error: SuperAdmin role not found. Please run setupRoles first.");
        throw new Error("SuperAdmin role not found");
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
    } else {
      log("Superadmin user already exists");
    }

    return true;
  } catch (error: any) {
    // If error is about missing tables, they will be created by migrations
    if (error.message.includes('relation "users" does not exist')) {
      log("Database tables don't exist, will be created during migration");
      return true;
    }

    console.error("Database setup failed:", error);
    throw error;
  }
}