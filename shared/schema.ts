import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("PM"), // PM, Estimator, Accountant, Executive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  projectNumber: varchar("project_number", { length: 50 }).unique().notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("active"), // active, completed, archived
  projectType: varchar("project_type").notNull(), // commercial, residential, industrial
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const costCodes = pgTable("cost_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 20 }).unique().notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  category: varchar("category").notNull(), // labor, materials, equipment, subcontractors
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }), // hours, feet, each, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const costEntries = pgTable("cost_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  costCodeId: uuid("cost_code_id").notNull().references(() => costCodes.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  entryDate: timestamp("entry_date").notNull(),
  attachmentPath: varchar("attachment_path"),
  enteredBy: varchar("entered_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const changeOrders = pgTable("change_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  changeOrderNumber: varchar("change_order_number", { length: 50 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  costEntries: many(costEntries),
  requestedChangeOrders: many(changeOrders, { relationName: "requestedBy" }),
  approvedChangeOrders: many(changeOrders, { relationName: "approvedBy" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  costEntries: many(costEntries),
  changeOrders: many(changeOrders),
}));

export const costCodesRelations = relations(costCodes, ({ many }) => ({
  costEntries: many(costEntries),
}));

export const costEntriesRelations = relations(costEntries, ({ one }) => ({
  project: one(projects, {
    fields: [costEntries.projectId],
    references: [projects.id],
  }),
  costCode: one(costCodes, {
    fields: [costEntries.costCodeId],
    references: [costCodes.id],
  }),
  enteredByUser: one(users, {
    fields: [costEntries.enteredBy],
    references: [users.id],
  }),
}));

export const changeOrdersRelations = relations(changeOrders, ({ one }) => ({
  project: one(projects, {
    fields: [changeOrders.projectId],
    references: [projects.id],
  }),
  requestedByUser: one(users, {
    fields: [changeOrders.requestedBy],
    references: [users.id],
    relationName: "requestedBy",
  }),
  approvedByUser: one(users, {
    fields: [changeOrders.approvedBy],
    references: [users.id],
    relationName: "approvedBy",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostCodeSchema = createInsertSchema(costCodes).omit({
  id: true,
  createdAt: true,
});

export const insertCostEntrySchema = createInsertSchema(costEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChangeOrderSchema = createInsertSchema(changeOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCostCode = z.infer<typeof insertCostCodeSchema>;
export type CostCode = typeof costCodes.$inferSelect;
export type InsertCostEntry = z.infer<typeof insertCostEntrySchema>;
export type CostEntry = typeof costEntries.$inferSelect;
export type InsertChangeOrder = z.infer<typeof insertChangeOrderSchema>;
export type ChangeOrder = typeof changeOrders.$inferSelect;
