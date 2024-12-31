import { z } from "zod";

export type Permission = {
  resource: string;
  action: string;
};

export type Role = {
  id: number;
  name: string;
  permissions: Permission[];
};

export const PermissionSchema = z.object({
  resource: z.string(),
  action: z.enum(["create", "read", "update", "delete"]),
});

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  permissions: z.array(PermissionSchema),
});

export type RBACContext = {
  userId: number;
  roleId: number;
};

export type AuthenticatedRequest = Express.Request & {
  rbacContext?: RBACContext;
};
