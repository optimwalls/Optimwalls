import { Router } from "express";
import { db } from "@db";
import { clients, leads } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";
import type { NewClient } from "@db/schema";

const router = Router();

// Get all clients
router.get("/", checkPermission("clients", "read"), async (req, res) => {
  try {
    const allClients = await db
      .select()
      .from(clients)
      .leftJoin(leads, eq(clients.leadId, leads.id));
    res.json(allClients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new client (usually from a converted lead)
router.post("/", checkPermission("clients", "create"), async (req, res) => {
  try {
    const clientData: NewClient = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If converting from a lead, verify lead exists
    if (clientData.leadId) {
      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, clientData.leadId))
        .limit(1);

      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Update lead status to Converted
      await db
        .update(leads)
        .set({ status: "Converted", updatedAt: new Date() })
        .where(eq(leads.id, clientData.leadId));
    }

    const [client] = await db.insert(clients).values(clientData).returning();
    res.status(201).json(client);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update client
router.patch("/:id", checkPermission("clients", "update"), async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const [updatedClient] = await db
      .update(clients)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(updatedClient);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get client projects
router.get("/:id/projects", checkPermission("clients", "read"), async (req, res) => {
  try {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, parseInt(req.params.id)))
      .limit(1);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Return project details stored in JSON field
    res.json(client.projectDetails || {});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
