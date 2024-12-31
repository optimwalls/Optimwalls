import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import authRoutes from "./services/auth/routes";
import leadRoutes from "./services/leads/routes";
import clientRoutes from "./services/clients/routes";
import activityRoutes from "./services/activities/routes";

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);

  // Register service routes
  app.use("/api/auth", authRoutes);
  app.use("/api/leads", leadRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/activities", activityRoutes);

  const httpServer = createServer(app);
  return httpServer;
}