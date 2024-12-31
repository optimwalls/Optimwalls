import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeRBAC } from "./init/rbac";
import { initDb } from "@db";
import { setupDatabase } from "./init/setupDatabase";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

// Global error handling middleware
const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: err.message,
    ...(app.get('env') === 'development' ? { stack: err.stack } : {})
  });
};

app.use(errorHandler);

// Initialize application with proper sequencing
async function startServer() {
  try {
    // Step 1: Initialize database connection
    log("Starting database initialization...");
    await initDb();
    log("Database initialization completed");

    // Step 2: Run database setup and migrations
    log("Starting database setup and migrations...");
    await setupDatabase();
    log("Database setup and migrations completed");

    // Step 3: Initialize RBAC after database is ready
    log("Starting roles and permissions initialization...");
    await initializeRBAC();
    log("Roles and permissions initialization completed");

    // Step 4: Register routes after all initialization is complete
    const server = registerRoutes(app);

    // Step 5: Setup Vite or static files based on environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Step 6: Start server
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error("Critical error during server startup:", error);
  process.exit(1);
});