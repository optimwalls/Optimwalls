import { Router } from "express";
import { db } from "@db";
import { marketingCampaigns, marketingLeads, leads } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";

const router = Router();

// Get all marketing campaigns
router.get("/campaigns", checkPermission("marketing", "read"), async (req, res) => {
  try {
    const campaigns = await db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.createdAt));
    
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new marketing campaign
router.post("/campaigns", checkPermission("marketing", "create"), async (req, res) => {
  try {
    const [campaign] = await db
      .insert(marketingCampaigns)
      .values({
        ...req.body,
        createdBy: req.user?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update campaign
router.patch("/campaigns/:id", checkPermission("marketing", "update"), async (req, res) => {
  try {
    const [updated] = await db
      .update(marketingCampaigns)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, parseInt(req.params.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get campaign metrics
router.get("/campaigns/:id/metrics", checkPermission("marketing", "read"), async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Get leads generated from this campaign
    const campaignLeads = await db
      .select()
      .from(marketingLeads)
      .leftJoin(leads, eq(marketingLeads.leadId, leads.id))
      .where(eq(marketingLeads.campaignId, campaignId));

    // Calculate conversion metrics
    const metrics = {
      ...campaign.metrics,
      totalLeads: campaignLeads.length,
      convertedLeads: campaignLeads.filter(lead => lead.leads?.status === 'Qualified').length,
    };

    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
