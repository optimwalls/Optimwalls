import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { permissions, users, roles } from "@db/schema";
import { and, eq } from "drizzle-orm";

export function checkPermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.user || !req.user.roleId) {
        return res.status(403).json({ message: "No role assigned" });
      }

      // SuperAdmin (roleId 1) bypass all permission checks
      if (req.user.roleId === 1) {
        return next();
      }

      const [permission] = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.roleId, req.user.roleId),
            eq(permissions.resource, resource),
            eq(permissions.action, action)
          )
        )
        .limit(1);

      if (!permission) {
        return res.status(403).json({
          message: `Permission denied: ${action} on ${resource}`,
          required: { resource, action },
          userRole: req.user.roleId
        });
      }

      next();
    } catch (error: any) {
      console.error("RBAC Error:", error);
      next(error);
    }
  };
}

// Helper function to check if user has permission without middleware
export async function hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return false;

    // SuperAdmin bypass
    if (user.roleId === 1) return true;

    const [permission] = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.roleId, user.roleId),
          eq(permissions.resource, resource),
          eq(permissions.action, action)
        )
      )
      .limit(1);

    return !!permission;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}