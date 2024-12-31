import { Router } from "express";
import { db } from "@db";
import { websiteContent, portfolioProjects, websiteEnquiries, leads } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";

const router = Router();

// Get all website content
router.get("/content", async (req, res) => {
  try {
    const content = await db
      .select()
      .from(websiteContent)
      .where(eq(websiteContent.status, "Published"))
      .orderBy(desc(websiteContent.publishedAt));
    
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create/Update website content
router.post("/content", checkPermission("website", "create"), async (req, res) => {
  try {
    const [content] = await db
      .insert(websiteContent)
      .values({
        ...req.body,
        author: req.user?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(content);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get portfolio projects
router.get("/portfolio", async (req, res) => {
  try {
    const projects = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.featured, true))
      .orderBy(desc(portfolioProjects.publishedAt));
    
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Submit enquiry
router.post("/enquiries", async (req, res) => {
  try {
    const [enquiry] = await db
      .insert(websiteEnquiries)
      .values({
        ...req.body,
        status: "New",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      message: "Thank you for your enquiry. We'll get back to you soon.",
      enquiry
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Convert enquiry to lead
router.post("/enquiries/:id/convert", checkPermission("leads", "create"), async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const [enquiry] = await db
      .select()
      .from(websiteEnquiries)
      .where(eq(websiteEnquiries.id, enquiryId))
      .limit(1);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    // Create new lead
    const [lead] = await db
      .insert(leads)
      .values({
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        status: "New",
        source: "Website",
        notes: enquiry.message,
        assignedTo: req.user?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update enquiry status
    await db
      .update(websiteEnquiries)
      .set({
        status: "Converted",
        convertedToLeadId: lead.id,
        updatedAt: new Date(),
      })
      .where(eq(websiteEnquiries.id, enquiryId));

    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
