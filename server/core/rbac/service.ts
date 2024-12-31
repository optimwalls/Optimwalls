import { db } from "@db";
import { permissions, roles } from "@db/schema";
import { and, eq } from "drizzle-orm";
import type { Permission, RBACContext } from "./types";

export class RBACService {
  private static instance: RBACService;
  private permissionCache: Map<number, Permission[]>;

  private constructor() {
    this.permissionCache = new Map();
  }

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  async hasPermission(context: RBACContext, resource: string, action: string): Promise<boolean> {
    try {
      let rolePermissions = this.permissionCache.get(context.roleId);
      
      if (!rolePermissions) {
        const perms = await db
          .select()
          .from(permissions)
          .where(eq(permissions.roleId, context.roleId));
        
        rolePermissions = perms.map(p => ({
          resource: p.resource,
          action: p.action,
        }));
        
        this.permissionCache.set(context.roleId, rolePermissions);
      }

      return rolePermissions.some(
        p => p.resource === resource && p.action === action
      );
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async clearCache(): Promise<void> {
    this.permissionCache.clear();
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const perms = await db
      .select()
      .from(permissions)
      .where(eq(permissions.roleId, roleId));
    
    return perms.map(p => ({
      resource: p.resource,
      action: p.action,
    }));
  }
}

export const rbacService = RBACService.getInstance();
