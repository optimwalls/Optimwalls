import { db } from "@db";
import { roles, permissions, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";

const defaultRoles = [
  {
    name: "SuperAdmin",
    permissions: ["leads", "users", "clients", "activities", "stats"].flatMap(resource =>
      ["create", "read", "update", "delete"].map(action => ({ resource, action }))
    )
  },
  {
    name: "Admin",
    permissions: ["leads", "users", "clients", "activities", "stats"].flatMap(resource =>
      ["create", "read", "update", "delete"].map(action => ({ resource, action }))
    )
  },
  {
    name: "Manager",
    permissions: ["leads", "clients", "activities", "stats"].flatMap(resource =>
      ["create", "read", "update"].map(action => ({ resource, action }))
    ).concat([
      { resource: "users", action: "read" }
    ])
  },
  {
    name: "Employee",
    permissions: [
      { resource: "leads", action: "read" },
      { resource: "leads", action: "update" },
      { resource: "leads", action: "create" },
      { resource: "clients", action: "read" },
      { resource: "activities", action: "create" },
      { resource: "activities", action: "read" },
      { resource: "activities", action: "update" },
      { resource: "stats", action: "read" }
    ]
  },
  {
    name: "Viewer",
    permissions: [
      { resource: "leads", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "activities", action: "read" },
      { resource: "stats", action: "read" }
    ]
  }
];

export async function setupRoles() {
  try {
    log("Starting roles and permissions setup...");

    // First, clear existing permissions to avoid duplicates
    await db.delete(permissions);
    log("Cleared existing permissions");

    for (const roleData of defaultRoles) {
      // Check if role exists
      let [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      if (!role) {
        // Create new role if it doesn't exist
        [role] = await db
          .insert(roles)
          .values({ 
            name: roleData.name,
            createdAt: new Date()
          })
          .returning();
        log(`Created role: ${roleData.name}`);
      } else {
        log(`Role ${roleData.name} already exists`);
      }

      // Add permissions for the role
      const permissionValues = roleData.permissions.map(p => ({
        roleId: role.id,
        resource: p.resource,
        action: p.action,
        createdAt: new Date()
      }));

      if (permissionValues.length > 0) {
        await db.insert(permissions).values(permissionValues);
        log(`Added ${permissionValues.length} permissions for role: ${roleData.name}`);
      }

      // If this is SuperAdmin role, ensure the superadmin user has this role
      if (roleData.name === "SuperAdmin") {
        const [superAdmin] = await db
          .select()
          .from(users)
          .where(eq(users.username, "nizam.superadmin"))
          .limit(1);

        if (superAdmin) {
          await db
            .update(users)
            .set({ roleId: role.id })
            .where(eq(users.id, superAdmin.id));
          log("Updated superadmin user role");
        }
      }
    }

    log("Roles and permissions initialization completed successfully");
  } catch (error) {
    console.error("Error setting up roles:", error);
    throw error;
  }
}