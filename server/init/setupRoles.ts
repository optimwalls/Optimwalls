import { db } from "@db";
import { roles, permissions, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";

const defaultRoles = [
  {
    name: "SuperAdmin",
    permissions: [
      "leads", "users", "clients", "activities", "stats",
      "hr", "finance", "production", "vendors", "quotations",
      "designs", "projects", "support", "knowledge", "sustainability",
      "reports", "website"
    ].flatMap(resource =>
      ["create", "read", "update", "delete"].map(action => ({ resource, action }))
    )
  },
  {
    name: "CEO",
    permissions: [
      "leads", "users", "clients", "activities", "stats",
      "hr", "finance", "production", "vendors", "quotations",
      "designs", "projects", "support", "knowledge", "sustainability",
      "reports", "website"
    ].flatMap(resource =>
      ["create", "read", "update", "delete"].map(action => ({ resource, action }))
    )
  },
  {
    name: "DepartmentHead",
    permissions: [
      "leads", "clients", "activities", "stats",
      "hr", "production", "vendors", "quotations",
      "designs", "projects", "support", "knowledge",
      "reports"
    ].flatMap(resource =>
      ["create", "read", "update"].map(action => ({ resource, action }))
    ).concat([
      { resource: "users", action: "read" }
    ])
  },
  {
    name: "HRManager",
    permissions: [
      { resource: "hr", action: "create" },
      { resource: "hr", action: "read" },
      { resource: "hr", action: "update" },
      { resource: "hr", action: "delete" },
      { resource: "users", action: "read" },
      { resource: "reports", action: "read" },
      { resource: "knowledge", action: "read" },
    ]
  },
  {
    name: "FinanceManager",
    permissions: [
      { resource: "finance", action: "create" },
      { resource: "finance", action: "read" },
      { resource: "finance", action: "update" },
      { resource: "finance", action: "delete" },
      { resource: "quotations", action: "read" },
      { resource: "quotations", action: "update" },
      { resource: "reports", action: "read" },
      { resource: "vendors", action: "read" },
    ]
  },
  {
    name: "ProjectManager",
    permissions: [
      { resource: "projects", action: "create" },
      { resource: "projects", action: "read" },
      { resource: "projects", action: "update" },
      { resource: "production", action: "create" },
      { resource: "production", action: "read" },
      { resource: "production", action: "update" },
      { resource: "sustainability", action: "read" },
      { resource: "sustainability", action: "update" },
      { resource: "vendors", action: "read" },
      { resource: "reports", action: "read" },
      { resource: "knowledge", action: "read" },
    ]
  },
  {
    name: "DesignManager",
    permissions: [
      { resource: "designs", action: "create" },
      { resource: "designs", action: "read" },
      { resource: "designs", action: "update" },
      { resource: "designs", action: "delete" },
      { resource: "projects", action: "read" },
      { resource: "knowledge", action: "read" },
      { resource: "knowledge", action: "create" },
      { resource: "reports", action: "read" },
    ]
  },
  {
    name: "SupportManager",
    permissions: [
      { resource: "support", action: "create" },
      { resource: "support", action: "read" },
      { resource: "support", action: "update" },
      { resource: "support", action: "delete" },
      { resource: "clients", action: "read" },
      { resource: "knowledge", action: "read" },
      { resource: "knowledge", action: "create" },
      { resource: "reports", action: "read" },
    ]
  },
  {
    name: "Employee",
    permissions: [
      { resource: "leads", action: "read" },
      { resource: "leads", action: "update" },
      { resource: "clients", action: "read" },
      { resource: "activities", action: "create" },
      { resource: "activities", action: "read" },
      { resource: "activities", action: "update" },
      { resource: "knowledge", action: "read" },
      { resource: "reports", action: "read" }
    ]
  },
  {
    name: "Viewer",
    permissions: [
      { resource: "leads", action: "read" },
      { resource: "clients", action: "read" },
      { resource: "activities", action: "read" },
      { resource: "knowledge", action: "read" }
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