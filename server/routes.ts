import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import authRoutes from "./services/auth/routes";
import leadRoutes from "./services/leads/routes";

export function registerRoutes(app: Express): Server {
  // Set up authentication
  setupAuth(app);

  // Register service routes
  app.use("/api/auth", authRoutes);
  app.use("/api/leads", leadRoutes);

  const httpServer = createServer(app);
  return httpServer;
}