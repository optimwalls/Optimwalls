import { Router } from "express";
import { db } from "@db";
import { leads, activities, users, type Lead, type NewLead } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";

const router = Router();

// Get all leads with pagination and filters
router.get("/", checkPermission("leads", "read"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, assignedTo } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        status: leads.status,
        source: leads.source,
        budget: leads.budget,
        score: leads.score,
        projectType: leads.projectType,
        createdAt: leads.createdAt,
        assignedTo: leads.assignedTo,
        assignedUser: {
          id: users.id,
          username: users.username,
        }
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .orderBy(desc(leads.createdAt));

    if (status) {
      query = query.where(eq(leads.status, status as string));
    }

    if (assignedTo) {
      query = query.where(eq(leads.assignedTo, Number(assignedTo)));
    }

    const [totalCount] = await db
      .select({ count: db.fn.count() })
      .from(leads);

    const results = await query.limit(Number(limit)).offset(offset);

    res.json({
      data: results,
      pagination: {
        total: Number(totalCount.count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(totalCount.count) / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single lead with activities
router.get("/:id", checkPermission("leads", "read"), async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Get lead activities
    const leadActivities = await db
      .select({
        id: activities.id,
        type: activities.type,
        notes: activities.notes,
        scheduledFor: activities.scheduledFor,
        completedAt: activities.completedAt,
        createdAt: activities.createdAt,
        user: {
          id: users.id,
          username: users.username,
        }
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.leadId, leadId))
      .orderBy(desc(activities.createdAt));

    res.json({
      ...lead,
      activities: leadActivities
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new lead
router.post("/", checkPermission("leads", "create"), async (req, res) => {
  try {
    const leadData: NewLead = {
      ...req.body,
      status: "New",
      score: calculateLeadScore(req.body),
      assignedTo: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [lead] = await db.insert(leads).values(leadData).returning();

    // Create initial activity
    await db.insert(activities).values({
      leadId: lead.id,
      userId: req.user?.id!,
      type: "creation",
      notes: "Lead created",
      createdAt: new Date(),
    });

    res.status(201).json(lead);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update lead
router.patch("/:id", checkPermission("leads", "update"), async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // If status is changing, recalculate score
    if (req.body.status || req.body.budget || req.body.projectType) {
      const [currentLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (currentLead) {
        updateData.score = calculateLeadScore({
          ...currentLead,
          ...req.body,
        });
      }
    }

    const [updatedLead] = await db
      .update(leads)
      .set(updateData)
      .where(eq(leads.id, leadId))
      .returning();

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Log status change as activity
    if (req.body.status) {
      await db.insert(activities).values({
        leadId: leadId,
        userId: req.user?.id!,
        type: "status_change",
        notes: `Status updated to ${req.body.status}`,
        createdAt: new Date(),
      });
    }

    res.json(updatedLead);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add activity to lead
router.post("/:id/activities", checkPermission("leads", "update"), async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { type, notes, scheduledFor } = req.body;

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const [activity] = await db.insert(activities).values({
      leadId,
      userId: req.user?.id!,
      type,
      notes,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdAt: new Date(),
    }).returning();

    res.status(201).json(activity);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate lead score
function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 0;

  // Budget factor (up to 40 points)
  if (lead.budget) {
    if (lead.budget >= 100000) score += 40;
    else if (lead.budget >= 50000) score += 30;
    else if (lead.budget >= 25000) score += 20;
    else score += 10;
  }

  // Project type factor (up to 30 points)
  if (lead.projectType === 'Commercial') score += 30;
  else if (lead.projectType === 'Residential') score += 20;

  // Status factor (up to 30 points)
  switch (lead.status) {
    case 'Qualified':
      score += 30;
      break;
    case 'In Discussion':
      score += 20;
      break;
    case 'Proposal Sent':
      score += 15;
      break;
    case 'New':
      score += 5;
      break;
    default:
      break;
  }

  return Math.min(score, 100);
}

export default router;