import { db } from "@db";
import { roles, permissions } from "@db/schema";

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
    for (const roleData of defaultRoles) {
      // Create role
      const [role] = await db
        .insert(roles)
        .values({ name: roleData.name })
        .onConflictDoNothing()
        .returning();

      if (role) {
        // Add permissions for the role
        await db
          .insert(permissions)
          .values(
            roleData.permissions.map(p => ({
              roleId: role.id,
              resource: p.resource,
              action: p.action
            }))
          )
          .onConflictDoNothing();
      }
    }
    
    console.log("Roles and permissions initialized successfully");
  } catch (error) {
    console.error("Error setting up roles:", error);
    throw error;
  }
}
