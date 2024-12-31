import express from "express";
import { initDb } from "@db";
import { log } from "./vite";
import { setupDatabase } from "./init/setupDatabase";
import { initializeRBAC } from "./init/rbac";

const app = express();

// Basic middleware (from original code)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize application
(async () => {
  try {
    // Step 1: Initialize database connection
    log("Initializing database connection...");
    await initDb();
    log("Database connection established successfully");

    // Step 2: Setup database schema and initial data
    log("Setting up database schema...");
    await setupDatabase();
    log("Database schema setup completed");

    // Step 3: Initialize RBAC
    log("Initializing RBAC...");
    await initializeRBAC();
    log("RBAC initialization completed");

    // Step 4: Start server
    const PORT = Number(process.env.PORT) || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
    process.exit(1);
  }
})();

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});