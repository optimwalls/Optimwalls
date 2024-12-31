import { Router } from "express";
import { db } from "@db";
import { activities, users } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";
import type { NewActivity } from "@db/schema";

const router = Router();

// Get all activities
router.get("/", checkPermission("activities", "read"), async (req, res) => {
  try {
    const allActivities = await db
      .select()
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt));
    res.json(allActivities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new activity
router.post("/", checkPermission("activities", "create"), async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const activityData: NewActivity = {
      ...req.body,
      userId: req.user.id,
      createdAt: new Date(),
    };

    const [activity] = await db.insert(activities).values(activityData).returning();
    res.status(201).json(activity);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get activities for a specific lead
router.get("/lead/:leadId", checkPermission("activities", "read"), async (req, res) => {
  try {
    const leadActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.leadId, parseInt(req.params.leadId)))
      .leftJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt));
    res.json(leadActivities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Mark activity as completed
router.patch("/:id/complete", checkPermission("activities", "update"), async (req, res) => {
  try {
    const [completedActivity] = await db
      .update(activities)
      .set({ completedAt: new Date() })
      .where(eq(activities.id, parseInt(req.params.id)))
      .returning();
    
    if (!completedActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    
    res.json(completedActivity);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
