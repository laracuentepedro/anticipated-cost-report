import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertProjectSchema,
  insertCostCodeSchema,
  insertCostEntrySchema,
  insertChangeOrderSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/attachments", isAuthenticated, async (req, res) => {
    if (!req.body.attachmentURL) {
      return res.status(400).json({ error: "attachmentURL is required" });
    }

    const userId = (req.user as any)?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.attachmentURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Cost code routes
  app.get("/api/cost-codes", isAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      const costCodes = category 
        ? await storage.getCostCodesByCategory(category as string)
        : await storage.getCostCodes();
      res.json(costCodes);
    } catch (error) {
      console.error("Error fetching cost codes:", error);
      res.status(500).json({ message: "Failed to fetch cost codes" });
    }
  });

  app.post("/api/cost-codes", isAuthenticated, async (req, res) => {
    try {
      const costCodeData = insertCostCodeSchema.parse(req.body);
      const costCode = await storage.createCostCode(costCodeData);
      res.status(201).json(costCode);
    } catch (error) {
      console.error("Error creating cost code:", error);
      res.status(500).json({ message: "Failed to create cost code" });
    }
  });

  // Cost entry routes
  app.get("/api/cost-entries", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const costEntries = await storage.getCostEntries(projectId as string);
      res.json(costEntries);
    } catch (error) {
      console.error("Error fetching cost entries:", error);
      res.status(500).json({ message: "Failed to fetch cost entries" });
    }
  });

  app.post("/api/cost-entries", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const costEntryData = insertCostEntrySchema.parse({
        ...req.body,
        enteredBy: userId,
      });
      const costEntry = await storage.createCostEntry(costEntryData);
      res.status(201).json(costEntry);
    } catch (error) {
      console.error("Error creating cost entry:", error);
      res.status(500).json({ message: "Failed to create cost entry" });
    }
  });

  app.put("/api/cost-entries/:id", isAuthenticated, async (req, res) => {
    try {
      const costEntryData = insertCostEntrySchema.partial().parse(req.body);
      const costEntry = await storage.updateCostEntry(req.params.id, costEntryData);
      res.json(costEntry);
    } catch (error) {
      console.error("Error updating cost entry:", error);
      res.status(500).json({ message: "Failed to update cost entry" });
    }
  });

  app.delete("/api/cost-entries/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCostEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cost entry:", error);
      res.status(500).json({ message: "Failed to delete cost entry" });
    }
  });

  // Change order routes
  app.get("/api/change-orders", isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const changeOrders = await storage.getChangeOrders(projectId as string);
      res.json(changeOrders);
    } catch (error) {
      console.error("Error fetching change orders:", error);
      res.status(500).json({ message: "Failed to fetch change orders" });
    }
  });

  app.post("/api/change-orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const changeOrderData = insertChangeOrderSchema.parse({
        ...req.body,
        requestedBy: userId,
      });
      const changeOrder = await storage.createChangeOrder(changeOrderData);
      res.status(201).json(changeOrder);
    } catch (error) {
      console.error("Error creating change order:", error);
      res.status(500).json({ message: "Failed to create change order" });
    }
  });

  app.put("/api/change-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const changeOrderData = insertChangeOrderSchema.partial().parse({
        ...req.body,
        ...(req.body.status === "approved" && { approvedBy: userId, approvalDate: new Date() }),
      });
      const changeOrder = await storage.updateChangeOrder(req.params.id, changeOrderData);
      res.json(changeOrder);
    } catch (error) {
      console.error("Error updating change order:", error);
      res.status(500).json({ message: "Failed to update change order" });
    }
  });

  // Analytics routes
  app.get("/api/projects/:id/cost-summary", isAuthenticated, async (req, res) => {
    try {
      const summary = await storage.getProjectCostSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching cost summary:", error);
      res.status(500).json({ message: "Failed to fetch cost summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
