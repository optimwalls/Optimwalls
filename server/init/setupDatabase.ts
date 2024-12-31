import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "@db";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";

export async function setupDatabase() {
  try {
    // Check if we can connect to the database
    const [testConnection] = await db.select().from(users).limit(1);
    log("Database connection successful");

    // Check if superadmin exists
    const [superadmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "nizam.superadmin"))
      .limit(1);

    if (!superadmin) {
      // Create superadmin if it doesn't exist
      await db.insert(users).values({
        username: "nizam.superadmin",
        password: "superadmin", // This should be properly hashed in production
        roleId: 1, // Will be updated by setupRoles
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      log("Superadmin user created");
    }

    return true;
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  }
}
