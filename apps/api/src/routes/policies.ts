/**
 * Policy API Routes (Policy-Based Architecture)
 *
 * エンドポイント:
 * - GET /policies - ポリシー一覧取得
 * - POST /policies - ポリシー作成（Payment or Collection）
 * - GET /policies/:id - ポリシー詳細取得
 * - PATCH /policies/:id - ポリシー更新
 * - GET /policies/by-vault/:vaultId - Vault別ポリシー取得
 * - GET /policies/by-policy-id/:policyId - PolicyId別取得
 */

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDatabase, policies, type NewPolicy } from "../db/client.js";
import { z } from "zod";
import { getPolicyValidatorService } from "../services/policy-validator.service.js";
import { keccak256, toUtf8Bytes } from "ethers";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

// Collection Config Schema
const collectionConfigSchema = z.object({
  allowPartialPayment: z.boolean().optional(),
  autoComplete: z.boolean().optional(),
  defaultDeadline: z.string().optional(),
  reminderSettings: z.object({
    enabled: z.boolean(),
    daysBefore: z.number().int().min(1),
  }).optional(),
});

// Payment Policy Schema (Manual Root Specification)
const createPaymentPolicySchema = z.object({
  type: z.literal('payment'),
  policyId: z.string().regex(/^0x[a-fA-F0-9]{64}$/), // bytes32 hex
  vaultId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  threshold: z.number().int().min(1),
  timelock: z.number().int().min(0), // seconds
  rolesRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/), // Merkle root
  ownersRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/), // Merkle root
  maxAmount: z.string().optional(), // BigInt as string
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Payment Policy Schema (Auto-generate Merkle roots from addresses)
const createPaymentPolicyWithAddressesSchema = z.object({
  type: z.literal('payment'),
  vaultId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  threshold: z.number().int().min(1),
  timelock: z.number().int().min(0).optional().default(0), // seconds
  guardianAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/i)).min(1), // Array of Ethereum addresses
  ownerAddresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/i)).min(1), // Array of Ethereum addresses
  maxAmount: z.string().optional(), // BigInt as string
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Collection Policy Schema
const createCollectionPolicySchema = z.object({
  type: z.literal('collection'),
  policyId: z.string().regex(/^0x[a-fA-F0-9]{64}$/), // bytes32 hex
  vaultId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  collectionConfig: collectionConfigSchema,
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Union schema for create
// Note: createPaymentPolicySchema is excluded from union to avoid validation conflicts
// Use pre-validation logic in POST handler to determine which schema to use
const createPolicySchema = z.union([
  createCollectionPolicySchema,
]);

// Update schemas (type-specific)
const updatePaymentPolicySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  threshold: z.number().int().min(1).optional(),
  timelock: z.number().int().min(0).optional(),
  rolesRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  ownersRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  maxAmount: z.string().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCollectionPolicySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  collectionConfig: collectionConfigSchema.optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * GET /policies
 * ポリシー一覧取得（type, vaultId, activeでフィルタ可能）
 */
app.get("/", async (c) => {
  try {
    const db = getDatabase();

    // Query parameters
    const vaultId = c.req.query("vaultId");
    const type = c.req.query("type"); // 'payment' | 'collection'
    const active = c.req.query("active");

    let query = db.select().from(policies);

    // Build where conditions
    const conditions = [];
    if (vaultId) {
      conditions.push(eq(policies.vaultId, vaultId));
    }
    if (type) {
      conditions.push(eq(policies.type, type));
    }
    if (active !== undefined) {
      conditions.push(eq(policies.active, active === "true"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return c.json({ policies: result });
  } catch (error) {
    console.error("Get policies error:", error);
    return c.json(
      {
        error: "Failed to fetch policies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /policies
 * ポリシー作成（Payment or Collection）
 * Payment Policyの場合、guardianAddressesを指定すればrolesRootを自動生成
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();

    console.log('[Policy Create] Request body:', JSON.stringify(body, null, 2));
    console.log('[Policy Create] Type:', body.type);
    console.log('[Policy Create] Has guardianAddresses:', !!body.guardianAddresses);

    // まず type と guardianAddresses の有無を確認
    let validated: any;
    if (body.type === 'payment' && body.guardianAddresses) {
      console.log('[Policy Create] Using createPaymentPolicyWithAddressesSchema');
      // guardianAddresses からrootを自動生成するパターン
      validated = createPaymentPolicyWithAddressesSchema.parse(body);
    } else {
      console.log('[Policy Create] Using createPolicySchema');
      // 通常のパターン (manual root or collection)
      validated = createPolicySchema.parse(body);
    }

    const db = getDatabase();
    const validatorService = getPolicyValidatorService();

    let newPolicy: NewPolicy;

    if (validated.type === 'payment') {
      // Payment Policyの処理
      let rolesRoot: string;
      let ownersRoot: string;
      let policyId: string;
      let timelock: number;

      // guardianAddresses が指定されている場合は自動生成
      if ('guardianAddresses' in validated) {
        // Merkle roots を自動生成
        rolesRoot = await validatorService.generateRolesRoot(validated.guardianAddresses);
        ownersRoot = await validatorService.generateOwnersRoot(validated.ownerAddresses);

        // policyId を生成（vaultId + name から）
        const policyIdSource = `${validated.vaultId}-${validated.name}-${Date.now()}`;
        policyId = keccak256(toUtf8Bytes(policyIdSource));

        timelock = validated.timelock ?? 0;
      } else {
        // 手動指定の場合
        rolesRoot = validated.rolesRoot;
        ownersRoot = validated.ownersRoot;
        policyId = validated.policyId;
        timelock = validated.timelock;
      }

      newPolicy = {
        type: 'payment',
        policyId,
        vaultId: validated.vaultId,
        name: validated.name,
        description: validated.description,
        threshold: validated.threshold,
        timelock,
        rolesRoot,
        ownersRoot,
        maxAmount: validated.maxAmount,
        active: validated.active ?? true,
        metadata: validated.metadata,
      };
    } else {
      // Collection Policy
      // policyId を生成
      const policyIdSource = `${validated.vaultId}-${validated.name}-${Date.now()}`;
      const policyId = keccak256(toUtf8Bytes(policyIdSource));

      newPolicy = {
        type: 'collection',
        policyId,
        vaultId: validated.vaultId,
        name: validated.name,
        description: validated.description,
        collectionConfig: validated.collectionConfig,
        active: validated.active ?? true,
        metadata: validated.metadata,
      };
    }

    const result = await db.insert(policies).values(newPolicy).returning();

    return c.json({ policy: result[0] }, 201);
  } catch (error) {
    console.error("Create policy error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to create policy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /policies/:id
 * ポリシー詳細取得
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Policy ID is required" }, 400);
    }

    const db = getDatabase();

    const result = await db
      .select()
      .from(policies)
      .where(eq(policies.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: "Policy not found" }, 404);
    }

    return c.json({ policy: result[0] });
  } catch (error) {
    console.error("Get policy error:", error);
    return c.json(
      {
        error: "Failed to fetch policy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * PATCH /policies/:id
 * ポリシー更新（typeに応じた更新）
 */
app.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Policy ID is required" }, 400);
    }

    const body = await c.req.json();

    const db = getDatabase();

    // Check if policy exists and get its type
    const existing = await db
      .select()
      .from(policies)
      .where(eq(policies.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Policy not found" }, 404);
    }

    const existingPolicy = existing[0];

    // Validate based on policy type
    let validated;
    if (existingPolicy.type === 'payment') {
      validated = updatePaymentPolicySchema.parse(body);
    } else {
      validated = updateCollectionPolicySchema.parse(body);
    }

    // Update policy
    const updateData: any = {
      ...validated,
      updatedAt: new Date(),
    };

    const result = await db
      .update(policies)
      .set(updateData)
      .where(eq(policies.id, id))
      .returning();

    return c.json({ policy: result[0] });
  } catch (error) {
    console.error("Update policy error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to update policy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /policies/by-vault/:vaultId
 * Vault別ポリシー取得（アクティブなポリシーのみ）
 */
app.get("/by-vault/:vaultId", async (c) => {
  try {
    const vaultId = c.req.param("vaultId");

    if (!vaultId) {
      return c.json({ error: "Vault ID is required" }, 400);
    }

    const db = getDatabase();

    const result = await db
      .select()
      .from(policies)
      .where(and(eq(policies.vaultId, vaultId), eq(policies.active, true)));

    return c.json({ policies: result });
  } catch (error) {
    console.error("Get vault policies error:", error);
    return c.json(
      {
        error: "Failed to fetch vault policies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /policies/by-policy-id/:policyId
 * PolicyId別取得（オンチェーンIDでの検索）
 */
app.get("/by-policy-id/:policyId", async (c) => {
  try {
    const policyId = c.req.param("policyId");

    if (!policyId) {
      return c.json({ error: "Policy ID is required" }, 400);
    }

    const db = getDatabase();

    const result = await db
      .select()
      .from(policies)
      .where(eq(policies.policyId, policyId))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: "Policy not found" }, 404);
    }

    return c.json({ policy: result[0] });
  } catch (error) {
    console.error("Get policy by policyId error:", error);
    return c.json(
      {
        error: "Failed to fetch policy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
