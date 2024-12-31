import { Router } from "express";
import { db } from "@db";
import { leads, projects, clients, transactions, supportTickets } from "@db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { checkPermission } from "../../middleware/rbac";

const router = Router();

router.get("/stats", checkPermission("dashboard", "read"), async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Fetch total leads and leads needing follow-up
    const [leadsStats] = await db
      .select({
        totalLeads: sql<number>`count(*)`,
        toContact: sql<number>`count(*) filter (where ${leads.status} = 'New' and ${leads.assignedTo} = ${req.user?.id})`,
        qualified: sql<number>`count(*) filter (where ${leads.status} = 'Qualified')`
      })
      .from(leads);

    // Calculate total pipeline value from qualified leads
    const [pipelineValue] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${leads.budget}), 0)`
      })
      .from(leads)
      .where(eq(leads.status, "Qualified"));

    // Get active projects count
    const [projectStats] = await db
      .select({
        activeProjects: sql<number>`count(*) filter (where ${projects.status} = 'InProgress')`
      })
      .from(projects);

    // Get monthly transactions total
    const [monthlyTransactions] = await db
      .select({
        income: sql<number>`coalesce(sum(case when ${transactions.type} = 'Income' then ${transactions.amount} else 0 end), 0)`,
        expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'Expense' then ${transactions.amount} else 0 end), 0)`
      })
      .from(transactions)
      .where(gte(transactions.date, thirtyDaysAgo.toISOString().split('T')[0]));

    // Get open support tickets
    const [supportStats] = await db
      .select({
        openTickets: sql<number>`count(*) filter (where ${supportTickets.status} = 'Open')`
      })
      .from(supportTickets);

    res.json({
      totalLeads: Number(leadsStats.totalLeads),
      toContact: Number(leadsStats.toContact),
      qualified: Number(leadsStats.qualified),
      revenue: Number(pipelineValue.revenue),
      activeProjects: Number(projectStats.activeProjects),
      monthlyIncome: Number(monthlyTransactions.income),
      monthlyExpense: Number(monthlyTransactions.expense),
      openTickets: Number(supportStats.openTickets),
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;