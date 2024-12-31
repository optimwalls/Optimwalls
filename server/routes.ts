import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { checkPermission } from "./middleware/rbac";
import { db } from "@db";
import { leads, activities, users } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Lead routes
  app.get("/api/leads", checkPermission("leads", "read"), async (req, res) => {
    const allLeads = await db.query.leads.findMany({
      with: {
        assignedUser: true,
        activities: true,
      },
    });
    res.json(allLeads);
  });

  app.post("/api/leads", checkPermission("leads", "create"), async (req, res) => {
    const lead = await db.insert(leads).values(req.body).returning();
    res.json(lead[0]);
  });

  app.patch("/api/leads/:id", checkPermission("leads", "update"), async (req, res) => {
    const lead = await db
      .update(leads)
      .set(req.body)
      .where(eq(leads.id, parseInt(req.params.id)))
      .returning();
    res.json(lead[0]);
  });

  // Activity routes
  app.post("/api/activities", checkPermission("activities", "create"), async (req, res) => {
    const activity = await db
      .insert(activities)
      .values({ ...req.body, userId: req.user.id })
      .returning();
    res.json(activity[0]);
  });

  // Stats route
  app.get("/api/stats", checkPermission("stats", "read"), async (req, res) => {
    const [leadStats] = await db
      .select({
        totalLeads: db.fn.count(leads.id),
        toContact: db.fn.count(leads.id).filter(eq(leads.status, "New")),
        qualified: db.fn.count(leads.id).filter(eq(leads.status, "Qualified")),
        revenue: db.fn.sum(leads.budget).filter(eq(leads.status, "Qualified")),
      })
      .from(leads);

    res.json(leadStats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
