import {
  users,
  projects,
  costCodes,
  costEntries,
  changeOrders,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type CostCode,
  type InsertCostCode,
  type CostEntry,
  type InsertCostEntry,
  type ChangeOrder,
  type InsertChangeOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Cost code operations
  getCostCodes(): Promise<CostCode[]>;
  getCostCodesByCategory(category: string): Promise<CostCode[]>;
  createCostCode(costCode: InsertCostCode): Promise<CostCode>;
  
  // Cost entry operations
  getCostEntries(projectId?: string): Promise<CostEntry[]>;
  createCostEntry(costEntry: InsertCostEntry): Promise<CostEntry>;
  updateCostEntry(id: string, costEntry: Partial<InsertCostEntry>): Promise<CostEntry>;
  deleteCostEntry(id: string): Promise<void>;
  
  // Change order operations
  getChangeOrders(projectId?: string): Promise<ChangeOrder[]>;
  createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder>;
  updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder>;
  
  // Analytics
  getProjectCostSummary(projectId: string): Promise<{
    totalCost: number;
    costByCategory: Record<string, number>;
    budgetVariance: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Cost code operations
  async getCostCodes(): Promise<CostCode[]> {
    return await db.select().from(costCodes).where(eq(costCodes.isActive, true));
  }

  async getCostCodesByCategory(category: string): Promise<CostCode[]> {
    return await db
      .select()
      .from(costCodes)
      .where(and(eq(costCodes.category, category), eq(costCodes.isActive, true)));
  }

  async createCostCode(costCode: InsertCostCode): Promise<CostCode> {
    const [newCostCode] = await db.insert(costCodes).values(costCode).returning();
    return newCostCode;
  }

  // Cost entry operations
  async getCostEntries(projectId?: string): Promise<CostEntry[]> {
    const query = db.select().from(costEntries);
    if (projectId) {
      return await query.where(eq(costEntries.projectId, projectId)).orderBy(desc(costEntries.entryDate));
    }
    return await query.orderBy(desc(costEntries.entryDate));
  }

  async createCostEntry(costEntry: InsertCostEntry): Promise<CostEntry> {
    const [newCostEntry] = await db.insert(costEntries).values(costEntry).returning();
    return newCostEntry;
  }

  async updateCostEntry(id: string, costEntry: Partial<InsertCostEntry>): Promise<CostEntry> {
    const [updatedCostEntry] = await db
      .update(costEntries)
      .set({ ...costEntry, updatedAt: new Date() })
      .where(eq(costEntries.id, id))
      .returning();
    return updatedCostEntry;
  }

  async deleteCostEntry(id: string): Promise<void> {
    await db.delete(costEntries).where(eq(costEntries.id, id));
  }

  // Change order operations
  async getChangeOrders(projectId?: string): Promise<ChangeOrder[]> {
    const query = db.select().from(changeOrders);
    if (projectId) {
      return await query.where(eq(changeOrders.projectId, projectId)).orderBy(desc(changeOrders.requestDate));
    }
    return await query.orderBy(desc(changeOrders.requestDate));
  }

  async createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder> {
    const [newChangeOrder] = await db.insert(changeOrders).values(changeOrder).returning();
    return newChangeOrder;
  }

  async updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder> {
    const [updatedChangeOrder] = await db
      .update(changeOrders)
      .set({ ...changeOrder, updatedAt: new Date() })
      .where(eq(changeOrders.id, id))
      .returning();
    return updatedChangeOrder;
  }

  // Analytics
  async getProjectCostSummary(projectId: string): Promise<{
    totalCost: number;
    costByCategory: Record<string, number>;
    budgetVariance: number;
  }> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const costSummary = await db
      .select({
        category: costCodes.category,
        totalAmount: sql<number>`SUM(${costEntries.amount})`,
      })
      .from(costEntries)
      .innerJoin(costCodes, eq(costEntries.costCodeId, costCodes.id))
      .where(eq(costEntries.projectId, projectId))
      .groupBy(costCodes.category);

    const costByCategory: Record<string, number> = {};
    let totalCost = 0;

    for (const item of costSummary) {
      const amount = Number(item.totalAmount);
      costByCategory[item.category] = amount;
      totalCost += amount;
    }

    const budget = Number(project.budget);
    const budgetVariance = budget - totalCost;

    return {
      totalCost,
      costByCategory,
      budgetVariance,
    };
  }
}

export const storage = new DatabaseStorage();
