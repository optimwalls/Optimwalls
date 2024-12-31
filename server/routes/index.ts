import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuthService } from "../services/auth";
import { setupLeadService } from "../services/leads";
import { rbacMiddleware } from "../core/rbac/middleware";

export function registerRoutes(app: Express): Server {
  // Setup core middleware
  app.use("/api", rbacMiddleware);

  // Initialize services
  setupAuthService(app);
  setupLeadService(app);

  const httpServer = createServer(app);
  return httpServer;
}
