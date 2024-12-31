-- Create Users and Auth tables
CREATE TABLE IF NOT EXISTS "roles" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "role_id" integer NOT NULL REFERENCES "roles" ("id"),
  "email" text UNIQUE,
  "full_name" text,
  "department" text,
  "position" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" serial PRIMARY KEY,
  "role_id" integer NOT NULL REFERENCES "roles" ("id"),
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Create HR Management tables
CREATE TABLE IF NOT EXISTS "employees" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users" ("id"),
  "employee_id" text NOT NULL UNIQUE,
  "department" text NOT NULL,
  "position" text NOT NULL,
  "joining_date" date NOT NULL,
  "salary" decimal(10,2),
  "status" text NOT NULL,
  "documents" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Leads and Clients tables
CREATE TABLE IF NOT EXISTS "leads" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "location" text,
  "status" text NOT NULL DEFAULT 'New',
  "source" text,
  "assigned_to" integer REFERENCES "users" ("id"),
  "budget" decimal(10,2),
  "score" integer DEFAULT 0,
  "project_type" text,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "clients" (
  "id" serial PRIMARY KEY,
  "lead_id" integer UNIQUE REFERENCES "leads" ("id"),
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "location" text,
  "project_details" jsonb,
  "assigned_to" integer REFERENCES "users" ("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" serial PRIMARY KEY,
  "lead_id" integer NOT NULL REFERENCES "leads" ("id"),
  "user_id" integer NOT NULL REFERENCES "users" ("id"),
  "type" text NOT NULL,
  "notes" text,
  "scheduled_for" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

-- Create Project Management tables
CREATE TABLE IF NOT EXISTS "projects" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "client_id" integer REFERENCES "clients" ("id"),
  "manager_id" integer REFERENCES "users" ("id"),
  "start_date" date,
  "end_date" date,
  "budget" decimal(10,2),
  "status" text NOT NULL,
  "phase" text,
  "progress" integer DEFAULT 0,
  "specifications" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Vendor Management tables
CREATE TABLE IF NOT EXISTS "vendors" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "contact_person" text,
  "email" text,
  "phone" text,
  "address" text,
  "rating" integer,
  "status" text NOT NULL,
  "documents" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Design Management tables
CREATE TABLE IF NOT EXISTS "designs" (
  "id" serial PRIMARY KEY,
  "project_id" integer REFERENCES "projects" ("id"),
  "name" text NOT NULL,
  "version" text NOT NULL,
  "status" text NOT NULL,
  "files" jsonb,
  "designer_id" integer REFERENCES "users" ("id"),
  "approved_by" integer REFERENCES "users" ("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Support Management tables
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" serial PRIMARY KEY,
  "client_id" integer REFERENCES "clients" ("id"),
  "project_id" integer REFERENCES "projects" ("id"),
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "priority" text NOT NULL,
  "status" text NOT NULL,
  "assigned_to" integer REFERENCES "users" ("id"),
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Knowledge Base table
CREATE TABLE IF NOT EXISTS "knowledge_base" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "content" text NOT NULL,
  "tags" text[],
  "attachments" jsonb,
  "author" integer REFERENCES "users" ("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Sustainability Metrics table
CREATE TABLE IF NOT EXISTS "sustainability_metrics" (
  "id" serial PRIMARY KEY,
  "project_id" integer REFERENCES "projects" ("id"),
  "material_usage" jsonb,
  "waste_generated" decimal(10,2),
  "recycled_material" decimal(10,2),
  "energy_consumption" decimal(10,2),
  "date" date NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Finance Management tables
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" serial PRIMARY KEY,
  "type" text NOT NULL,
  "category" text NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "description" text,
  "date" date NOT NULL,
  "project_id" integer REFERENCES "projects" ("id"),
  "vendor_id" integer REFERENCES "vendors" ("id"),
  "created_by" integer REFERENCES "users" ("id"),
  "status" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create Quotation Management table
CREATE TABLE IF NOT EXISTS "quotations" (
  "id" serial PRIMARY KEY,
  "project_id" integer REFERENCES "projects" ("id"),
  "client_id" integer REFERENCES "clients" ("id"),
  "items" jsonb,
  "total_amount" decimal(10,2) NOT NULL,
  "status" text NOT NULL,
  "valid_until" date,
  "notes" text,
  "created_by" integer REFERENCES "users" ("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
