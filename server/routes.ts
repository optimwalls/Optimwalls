import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import authRoutes from "./services/auth/routes";
import leadRoutes from "./services/leads/routes";
import clientRoutes from "./services/clients/routes";
import activityRoutes from "./services/activities/routes";
import session from "express-session";
import createMemoryStore from "memorystore";

export function registerRoutes(app: Express): Server {
  // Set up session store
  const MemoryStore = createMemoryStore(session);
  app.use(session({
    secret: process.env.REPL_ID || "optim-walls-crm",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: app.get("env") === "production",
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // Clear expired entries every 24h
    }),
  }));

  // Set up authentication before routes
  setupAuth(app);

  // Register API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/leads", leadRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/activities", activityRoutes);

  // Error handling middleware
  app.use((err: any, _req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      ...(app.get('env') === 'development' ? { stack: err.stack } : {})
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}