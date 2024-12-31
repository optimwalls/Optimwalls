import { db } from "@db";
import { roles, permissions, users } from "@db/schema";
import { eq } from "drizzle-orm";

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
    )
  },
  {
    name: "Employee",
    permissions: [
      { resource: "leads", action: "read" },
      { resource: "leads", action: "update" },
      { resource: "activities", action: "create" },
      { resource: "activities", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "stats", action: "read" },
    ]
  },
  {
    name: "Viewer",
    permissions: [
      { resource: "leads", action: "read" },
      { resource: "activities", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "stats", action: "read" },
    ]
  }
];

export async function setupRoles() {
  try {
    // First, clear existing permissions to avoid duplicates
    await db.delete(permissions);

    // Create roles if they don't exist
    for (const roleData of defaultRoles) {
      let role;

      // Check if role exists
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      if (existingRole) {
        role = existingRole;
      } else {
        // Create new role
        const [newRole] = await db
          .insert(roles)
          .values({ 
            name: roleData.name,
            createdAt: new Date()
          })
          .returning();
        role = newRole;
      }

      // Add permissions for the role
      const permissionValues = roleData.permissions.map(p => ({
        roleId: role.id,
        resource: p.resource,
        action: p.action,
        createdAt: new Date()
      }));

      await db.insert(permissions).values(permissionValues);

      // If this is SuperAdmin role, ensure the nizam.superadmin user has this role
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
        }
      }
    }

    console.log("Roles and permissions initialized successfully");
  } catch (error) {
    console.error("Error setting up roles:", error);
    throw error;
  }
}