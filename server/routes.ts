import { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { checkPermission } from "./middleware/rbac";
import { db } from "@db";
import { leads, activities, users } from "@db/schema";
import { eq, sql } from "drizzle-orm";

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
    const [stats] = await db
      .select({
        totalLeads: sql<number>`count(${leads.id})::int`,
        toContact: sql<number>`count(case when ${leads.status} = 'New' then 1 end)::int`,
        qualified: sql<number>`count(case when ${leads.status} = 'Qualified' then 1 end)::int`,
        revenue: sql<number>`coalesce(sum(case when ${leads.status} = 'Qualified' then ${leads.budget} end), 0)::int`,
      })
      .from(leads);

    res.json(stats);
  });

  const httpServer = createServer(app);
  return httpServer;
}