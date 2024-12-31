import { Request, Response, NextFunction } from "express";
import { rbacService } from "./service";
import type { AuthenticatedRequest, RBACContext } from "./types";

export function createRBACMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Add RBAC context to the request
    const authReq = req as AuthenticatedRequest;
    authReq.rbacContext = {
      userId: req.user!.id,
      roleId: req.user!.roleId,
    };

    next();
  };
}

export function checkPermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.rbacContext) {
      return res.status(401).send("RBAC context not initialized");
    }

    try {
      const hasPermission = await rbacService.hasPermission(
        authReq.rbacContext,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).send("Permission denied");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const rbacMiddleware = createRBACMiddleware();
