import { pgTable, text, serial, integer, timestamp, json, boolean, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, type InferModel } from "drizzle-orm";

// Users and Auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  department: text("department"),
  position: text("position"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// HR Management
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  employeeId: text("employee_id").unique().notNull(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  joiningDate: date("joining_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  status: text("status").notNull(), // Active, OnLeave, Terminated
  documents: json("documents").$type<{
    type: string;
    url: string;
    uploadedAt: string;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance Management
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // Income, Expense
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  vendorId: integer("vendor_id").references(() => vendors.id),
  createdBy: integer("created_by").references(() => users.id),
  status: text("status").notNull(), // Pending, Approved, Rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects and Production
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  managerId: integer("manager_id").references(() => users.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  status: text("status").notNull(), // Planning, InProgress, Completed
  phase: text("phase"), // Design, Production, Installation
  progress: integer("progress").default(0),
  specifications: json("specifications").$type<{
    category: string;
    details: Record<string, any>;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor Management
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Material, Service
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  rating: integer("rating"),
  status: text("status").notNull(), // Active, Inactive
  documents: json("documents").$type<{
    type: string;
    url: string;
    validUntil: string;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotations
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => clients.id),
  items: json("items").$type<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[]>(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // Draft, Sent, Approved, Rejected
  validUntil: date("valid_until"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Design Management
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull(), // Draft, UnderReview, Approved
  files: json("files").$type<{
    type: string;
    url: string;
    uploadedAt: string;
  }[]>(),
  designerId: integer("designer_id").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // Low, Medium, High
  status: text("status").notNull(), // Open, InProgress, Resolved
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  attachments: json("attachments").$type<{
    type: string;
    url: string;
    uploadedAt: string;
  }[]>(),
  author: integer("author").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sustainability Metrics
export const sustainabilityMetrics = pgTable("sustainability_metrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  materialUsage: json("material_usage").$type<{
    material: string;
    quantity: number;
    unit: string;
  }[]>(),
  wasteGenerated: decimal("waste_generated", { precision: 10, scale: 2 }),
  recycledMaterial: decimal("recycled_material", { precision: 10, scale: 2 }),
  energyConsumption: decimal("energy_consumption", { precision: 10, scale: 2 }),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Continue existing tables with updated relations
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  status: text("status").notNull().default("New"),
  source: text("source"),
  assignedTo: integer("assigned_to").references(() => users.id),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  score: integer("score").default(0),
  projectType: text("project_type"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  projectDetails: json("project_details").$type<{
    type: string;
    value: number;
    status: string;
    startDate?: string;
    endDate?: string;
  }>(),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // call, email, meeting
  notes: text("notes"),
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  assignedProjects: many(projects),
  designs: many(designs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(permissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  role: one(roles, {
    fields: [permissions.roleId],
    references: [roles.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  activities: many(activities),
  client: one(clients, {
    fields: [leads.id],
    references: [clients.leadId],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  lead: one(leads, {
    fields: [activities.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  lead: one(leads, {
    fields: [clients.leadId],
    references: [leads.id],
  }),
  assignedUser: one(users, {
    fields: [clients.assignedTo],
    references: [users.id],
  }),
  projects: many(projects)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  manager: one(users, {
    fields: [projects.managerId],
    references: [users.id],
  }),
  designs: many(designs),
  quotations: many(quotations),
  sustainabilityMetrics: many(sustainabilityMetrics),
  supportTickets: many(supportTickets),
  transactions: many(transactions),
}));


export const vendorsRelations = relations(vendors, ({ many }) => ({
  transactions: many(transactions),
}));

export const quotationsRelations = relations(quotations, ({ one }) => ({
  project: one(projects, {
    fields: [quotations.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [quotations.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [quotations.createdBy],
    references: [users.id],
  }),
}));

export const designsRelations = relations(designs, ({ one }) => ({
  project: one(projects, {
    fields: [designs.projectId],
    references: [projects.id],
  }),
  designer: one(users, {
    fields: [designs.designerId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [designs.approvedBy],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  client: one(clients, {
    fields: [supportTickets.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [supportTickets.projectId],
    references: [projects.id],
  }),
  assignedTo: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one }) => ({
  author: one(users, {
    fields: [knowledgeBase.author],
    references: [users.id],
  }),
}));

export const sustainabilityMetricsRelations = relations(sustainabilityMetrics, ({ one }) => ({
  project: one(projects, {
    fields: [sustainabilityMetrics.projectId],
    references: [projects.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertLeadSchema = createInsertSchema(leads);
export const selectLeadSchema = createSelectSchema(leads);
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);
export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);
export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);
export const insertPermissionSchema = createInsertSchema(permissions);
export const selectPermissionSchema = createSelectSchema(permissions);
export const insertEmployeeSchema = createInsertSchema(employees);
export const selectEmployeeSchema = createSelectSchema(employees);
export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createSelectSchema(projects);
export const insertDesignSchema = createInsertSchema(designs);
export const selectDesignSchema = createSelectSchema(designs);
export const insertVendorSchema = createInsertSchema(vendors);
export const selectVendorSchema = createSelectSchema(vendors);
export const insertQuotationSchema = createInsertSchema(quotations);
export const selectQuotationSchema = createSelectSchema(quotations);
export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export const selectSupportTicketSchema = createSelectSchema(supportTickets);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase);
export const selectKnowledgeBaseSchema = createSelectSchema(knowledgeBase);
export const insertSustainabilityMetricsSchema = createInsertSchema(sustainabilityMetrics);
export const selectSustainabilityMetricsSchema = createSelectSchema(sustainabilityMetrics);


// Types
export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, "insert">;
export type Lead = InferModel<typeof leads>;
export type NewLead = InferModel<typeof leads, "insert">;
export type Activity = InferModel<typeof activities>;
export type NewActivity = InferModel<typeof activities, "insert">;
export type Client = InferModel<typeof clients>;
export type NewClient = InferModel<typeof clients, "insert">;
export type Role = InferModel<typeof roles>;
export type NewRole = InferModel<typeof roles, "insert">;
export type Permission = InferModel<typeof permissions>;
export type NewPermission = InferModel<typeof permissions, "insert">;
export type Employee = InferModel<typeof employees>;
export type NewEmployee = InferModel<typeof employees, "insert">;
export type Project = InferModel<typeof projects>;
export type NewProject = InferModel<typeof projects, "insert">;
export type Design = InferModel<typeof designs>;
export type NewDesign = InferModel<typeof designs, "insert">;
export type Vendor = InferModel<typeof vendors>;
export type NewVendor = InferModel<typeof vendors, "insert">;
export type Quotation = InferModel<typeof quotations>;
export type NewQuotation = InferModel<typeof quotations, "insert">;
export type SupportTicket = InferModel<typeof supportTickets>;
export type NewSupportTicket = InferModel<typeof supportTickets, "insert">;
export type Transaction = InferModel<typeof transactions>;
export type NewTransaction = InferModel<typeof transactions, "insert">;
export type KnowledgeBase = InferModel<typeof knowledgeBase>;
export type NewKnowledgeBase = InferModel<typeof knowledgeBase, "insert">;
export type SustainabilityMetric = InferModel<typeof sustainabilityMetrics>;
export type NewSustainabilityMetric = InferModel<typeof sustainabilityMetrics, "insert">;

// Fix the Express User type declaration
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      roleId: number;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}