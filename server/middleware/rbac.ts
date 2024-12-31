import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { permissions } from "@db/schema";
import { and, eq } from "drizzle-orm";

export function checkPermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
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
        return res.status(403).send("Permission denied");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
