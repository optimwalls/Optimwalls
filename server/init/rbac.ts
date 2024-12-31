import { db } from "@db";
import { roles, permissions } from "@db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function initializeRBAC() {
  console.log('[RBAC] Starting roles and permissions initialization...');

  try {
    // Begin transaction
    const baseRoles = [
      { name: 'SuperAdmin' },
      { name: 'Admin' },
      { name: 'Manager' },
      { name: 'Designer' },
      { name: 'Sales' },
      { name: 'Viewer' }
    ];

    // Create roles if they don't exist
    for (const roleData of baseRoles) {
      try {
        console.log(`[RBAC] Checking role: ${roleData.name}`);
        const existingRole = await db
          .select()
          .from(roles)
          .where(eq(roles.name, roleData.name))
          .limit(1);

        if (existingRole.length === 0) {
          console.log(`[RBAC] Creating role: ${roleData.name}`);
          await db.insert(roles).values({
            name: roleData.name,
            createdAt: new Date()
          });
          console.log(`[RBAC] Successfully created role: ${roleData.name}`);
        } else {
          console.log(`[RBAC] Role already exists: ${roleData.name}`);
        }
      } catch (error) {
        console.error(`[RBAC] Error processing role ${roleData.name}:`, error);
        throw error;
      }
    }

    // Fetch all roles for permission assignment
    console.log('[RBAC] Fetching roles for permission assignment...');
    const allRoles = await db.select().from(roles);
    const roleMap = new Map(allRoles.map(role => [role.name, role.id]));

    // Clear existing permissions
    console.log('[RBAC] Clearing existing permissions...');
    await db.delete(permissions);
    console.log('[RBAC] Successfully cleared existing permissions');

    // Define base permissions per role
    const permissionSets = {
      SuperAdmin: ['*:*'],
      Admin: ['users:*', 'projects:*', 'clients:*', 'leads:*', 'marketing:*', 'website:*'],
      Manager: ['projects:read', 'projects:update', 'clients:read', 'leads:read', 'marketing:read', 'website:read'],
      Designer: ['projects:read', 'designs:*', 'website:read'],
      Sales: ['leads:*', 'clients:read', 'projects:read', 'marketing:read'],
      Viewer: ['projects:read', 'clients:read', 'leads:read', 'website:read']
    };

    // Create permissions
    console.log('[RBAC] Creating permissions...');
    for (const [roleName, perms] of Object.entries(permissionSets)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) {
        console.error(`[RBAC] Role not found: ${roleName}`);
        continue;
      }

      try {
        console.log(`[RBAC] Setting up permissions for role: ${roleName}`);
        for (const perm of perms) {
          const [resource, action] = perm.split(':');

          if (action === '*') {
            // Expand wildcard actions
            const actions = ['create', 'read', 'update', 'delete'];
            for (const specificAction of actions) {
              await db.insert(permissions).values({
                roleId,
                resource: resource === '*' ? '*' : resource,
                action: specificAction,
                createdAt: new Date()
              });
            }
          } else {
            await db.insert(permissions).values({
              roleId,
              resource: resource === '*' ? '*' : resource,
              action,
              createdAt: new Date()
            });
          }
        }
        console.log(`[RBAC] Successfully set up permissions for role: ${roleName}`);
      } catch (error) {
        console.error(`[RBAC] Error setting up permissions for role ${roleName}:`, error);
        throw error;
      }
    }

    console.log('[RBAC] Roles and permissions initialization completed successfully');
  } catch (error) {
    console.error('[RBAC] Critical error during initialization:', error);
    throw error;
  }
}