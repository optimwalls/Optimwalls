import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "@db";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";
import { crypto } from "../auth";

export async function setupDatabase() {
  try {
    log("Starting database setup...");

    // Run migrations
    await migrate(db, { migrationsFolder: "./migrations" });
    log("Database migrations completed");

    // Check for superadmin
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
        roleId: 1, // SuperAdmin role
        email: "superadmin@optimwalls.com",
        fullName: "Nizam Super Admin",
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
      log("Database tables don't exist, will be created during role setup");
      return true;
    }

    console.error("Database setup failed:", error);
    throw error;
  }
}