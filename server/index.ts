import express from "express";
import { initDb } from "@db";
import { log } from "./vite";

const app = express();

// Basic middleware (from original code)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize application
(async () => {
  try {
    // Step 1: Initialize database
    log("Initializing database connection...");
    console.log("Database URL:", process.env.DATABASE_URL?.split(":")[0]);
    console.log("Database Host:", process.env.PGHOST);
    console.log("Database Port:", process.env.PGPORT);
    await initDb();
    log("Database initialization completed");

    // Step 2: Start server
    const PORT = 5000;
    app.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
    process.exit(1);
  }
})();