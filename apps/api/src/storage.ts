import { type User, type InsertUser, type Integration, type InsertIntegration, type Workflow, type InsertWorkflow } from "@repo/shared";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Integration methods
  getIntegration(id: string): Promise<Integration | undefined>;
  getAllIntegrations(): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined>;
  
  // Workflow methods
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getWorkflowsByIntegration(integrationId: string): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private integrations: Map<string, Integration> = new Map();
  private workflows: Map<string, Workflow> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }

  async getAllIntegrations(): Promise<Integration[]> {
    return Array.from(this.integrations.values());
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const id = randomUUID();
    const now = new Date();
    const integration: Integration = { 
      ...insertIntegration,
      repository: insertIntegration.repository || null,
      tsumikiVersion: insertIntegration.tsumikiVersion || null,
      vibeKitVersion: insertIntegration.vibeKitVersion || null,
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    const existing = this.integrations.get(id);
    if (!existing) return undefined;
    
    const updated: Integration = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.integrations.set(id, updated);
    return updated;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getWorkflowsByIntegration(integrationId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      workflow => workflow.integrationId === integrationId
    );
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date();
    const workflow: Workflow = { 
      ...insertWorkflow,
      integrationId: insertWorkflow.integrationId || null,
      output: insertWorkflow.output || null,
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;
    
    const updated: Workflow = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.workflows.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
