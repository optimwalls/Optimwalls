import { Router } from "express";
import { db } from "@db";
import { leads, activities, users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";
import type { NewLead } from "@db/schema";

const router = Router();

// Get all leads with related data
router.get("/", checkPermission("leads", "read"), async (req, res) => {
  try {
    const allLeads = await db
      .select()
      .from(leads)
      .leftJoin(activities, eq(activities.leadId, leads.id))
      .leftJoin(users, eq(leads.assignedTo, users.id));
    
    res.json(allLeads);
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [lead] = await db.insert(leads).values(leadData).returning();
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update lead
router.patch("/:id", checkPermission("leads", "update"), async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const [updatedLead] = await db
      .update(leads)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();
    
    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    res.json(updatedLead);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get lead score
router.get("/:id/score", checkPermission("leads", "read"), async (req, res) => {
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

    // Calculate score based on budget, engagement, and other factors
    const score = calculateLeadScore(lead);
    res.json({ score });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate lead score
function calculateLeadScore(lead: any) {
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

  // Engagement factor (up to 30 points)
  // This will be calculated based on activity count in a separate query
  
  return Math.min(score, 100);
}

export default router;
