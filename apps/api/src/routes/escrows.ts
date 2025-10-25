/**
 * Escrow API Routes (Policy-Based Architecture)
 *
 * エンドポイント:
 * - GET /escrows - エスクロー一覧取得
 * - POST /escrows - エスクロー作成（Payment or Collection）
 * - GET /escrows/:id - エスクロー詳細取得
 * - GET /escrows/:id/timeline - タイムライン取得
 * - PATCH /escrows/:id - エスクロー更新
 * - POST /escrows/:id/payment - Collection支払記録
 * - POST /escrows/:id/approve - 承認追加（NEW - Phase 2）
 * - POST /escrows/:id/validate - Policy検証（NEW - Phase 2）
 * - GET /escrows/:id/approvals - 承認状況取得（NEW - Phase 2）
 */

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import {
  getDatabase,
  escrows,
  timelines,
  policies,
  paymasterSettings,
  comments,
  type NewEscrow,
  type NewTimeline,
  type NewComment,
} from "../db/client.js";
import { z } from "zod";
import { getEscrowApprovalService } from "../services/escrow-approval.service.js";
import { getPolicyValidatorService } from "../services/policy-validator.service.js";
import { getOnChainExecutorService } from "../services/onchain-executor.service.js";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

// Collection Participant Schema
const participantSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().optional(),
  allocatedAmount: z.string(),
  paidAmount: z.string().optional(),
  status: z.enum(['pending', 'partial', 'paid', 'overdue']).optional(),
  paidAt: z.string().optional(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  lastPaymentAt: z.string().optional(),
});

// Payment Escrow Schema
const createPaymentEscrowSchema = z.object({
  type: z.literal('payment'),
  vaultId: z.string().uuid(),
  policyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  requester: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  totalAmount: z.string(),
  target: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  data: z.string().optional(),
  reason: z.string().optional(),
  deadline: z.string().datetime().optional(),
  scheduledReleaseAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// Collection Escrow Schema
const createCollectionEscrowSchema = z.object({
  type: z.literal('collection'),
  vaultId: z.string().uuid(),
  policyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  totalAmount: z.string(),
  participants: z.array(participantSchema),
  deadline: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// Union schema for create
const createEscrowSchema = z.discriminatedUnion('type', [
  createPaymentEscrowSchema,
  createCollectionEscrowSchema,
]);

// Update schemas
const updatePaymentEscrowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'on-chain', 'completed', 'cancelled', 'expired']).optional(),
  reason: z.string().optional(),
  deadline: z.string().datetime().optional(),
  scheduledReleaseAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  escrowId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCollectionEscrowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'on-chain', 'completed', 'cancelled', 'expired']).optional(),
  deadline: z.string().datetime().optional(),
  participants: z.array(participantSchema).optional(),
  collectedAmount: z.string().optional(),
  escrowId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  metadata: z.record(z.any()).optional(),
});

// Record payment schema
const recordPaymentSchema = z.object({
  participantAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

const addTimelineEventSchema = z.object({
  escrowId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  eventType: z.string(),
  actor: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  userOpHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  data: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * GET /escrows
 * エスクロー一覧取得（type, vaultId, policyId, statusでフィルタ可能）
 */
app.get("/", async (c) => {
  try {
    const db = getDatabase();

    // Query parameters
    const vaultId = c.req.query("vaultId");
    const policyId = c.req.query("policyId");
    const type = c.req.query("type"); // 'payment' | 'collection'
    const status = c.req.query("status");

    let query = db.select().from(escrows);

    // Build where conditions
    const conditions = [];
    if (vaultId) {
      conditions.push(eq(escrows.vaultId, vaultId));
    }
    if (policyId) {
      conditions.push(eq(escrows.policyId, policyId));
    }
    if (type) {
      conditions.push(eq(escrows.type, type));
    }
    if (status) {
      conditions.push(eq(escrows.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;

    return c.json({ escrows: result });
  } catch (error) {
    console.error("Get escrows error:", error);
    return c.json(
      {
        error: "Failed to fetch escrows",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /escrows
 * エスクロー作成（Payment or Collection）
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    console.log('[API] POST /escrows - body:', JSON.stringify(body, null, 2));

    const validated = createEscrowSchema.parse(body);
    console.log('[API] Validation passed');

    const db = getDatabase();

    let newEscrow: NewEscrow;

    if (validated.type === 'payment') {
      // Payment Escrow
      newEscrow = {
        type: 'payment',
        vaultId: validated.vaultId,
        policyId: validated.policyId,
        name: validated.name,
        description: validated.description,
        requester: validated.requester,
        recipient: validated.recipient,
        token: validated.token,
        totalAmount: validated.totalAmount,
        target: validated.target,
        data: validated.data,
        reason: validated.reason,
        deadline: validated.deadline ? new Date(validated.deadline) : undefined,
        scheduledReleaseAt: validated.scheduledReleaseAt 
          ? new Date(validated.scheduledReleaseAt) 
          : undefined,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        status: 'draft',
        metadata: validated.metadata,
      };
    } else {
      // Collection Escrow
      // Calculate total amount from participants
      const totalAmount = validated.participants.reduce(
        (sum, p) => sum + BigInt(p.allocatedAmount),
        0n
      ).toString();

      // Initialize participants with status
      const participants = validated.participants.map(p => ({
        ...p,
        paidAmount: '0',
        status: 'pending' as const,
      }));

      newEscrow = {
        type: 'collection',
        vaultId: validated.vaultId,
        policyId: validated.policyId,
        name: validated.name,
        description: validated.description,
        token: validated.token,
        totalAmount: totalAmount,
        collectedAmount: '0',
        participants: participants,
        deadline: validated.deadline ? new Date(validated.deadline) : undefined,
        status: 'draft',
        metadata: validated.metadata,
      };
    }

    const result = await db.insert(escrows).values(newEscrow).returning();

    return c.json({ escrow: result[0] }, 201);
  } catch (error) {
    console.error("Create escrow error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to create escrow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /escrows/:id
 * エスクロー詳細取得
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    // Get timeline if escrowId exists
    let timeline: any[] = [];
    if (escrow.escrowId) {
      timeline = await db
        .select()
        .from(timelines)
        .where(eq(timelines.escrowId, escrow.escrowId))
        .orderBy(desc(timelines.timestamp));
    }

    return c.json({
      escrow,
      timeline,
    });
  } catch (error) {
    console.error("Get escrow error:", error);
    return c.json(
      {
        error: "Failed to fetch escrow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /escrows/:id/timeline
 * タイムライン取得
 */
app.get("/:id/timeline", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    // Get escrow
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    if (!escrow.escrowId) {
      return c.json({ timeline: [] });
    }

    // Get timeline
    const timeline = await db
      .select()
      .from(timelines)
      .where(eq(timelines.escrowId, escrow.escrowId))
      .orderBy(desc(timelines.timestamp));

    return c.json({ timeline });
  } catch (error) {
    console.error("Get timeline error:", error);
    return c.json(
      {
        error: "Failed to fetch timeline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /escrows/:id/timeline
 * タイムラインイベント追加
 */
app.post("/:id/timeline", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validatedData = addTimelineEventSchema.parse(body);

    const db = getDatabase();

    // Verify escrow exists
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    const newEvent: NewTimeline = {
      escrowId: validatedData.escrowId,
      eventType: validatedData.eventType,
      actor: validatedData.actor,
      txHash: validatedData.txHash,
      userOpHash: validatedData.userOpHash,
      data: validatedData.data,
      metadata: validatedData.metadata,
    };

    const [event] = await db.insert(timelines).values(newEvent).returning();

    return c.json({ event }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Add timeline event error:", error);
    return c.json(
      {
        error: "Failed to add timeline event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * PATCH /escrows/:id
 * エスクロー更新（typeに応じた更新）
 */
app.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const db = getDatabase();

    // Check if escrow exists and get its type
    const [existing] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    // Validate based on escrow type
    let validated;
    if (existing.type === 'payment') {
      validated = updatePaymentEscrowSchema.parse(body);
    } else {
      validated = updateCollectionEscrowSchema.parse(body);
    }

    const updateData: any = {
      ...validated,
      updatedAt: new Date(),
    };

    // Convert datetime strings to Date objects
    if ('deadline' in validated && validated.deadline) {
      updateData.deadline = new Date(validated.deadline);
    }
    if ('scheduledReleaseAt' in validated && validated.scheduledReleaseAt) {
      updateData.scheduledReleaseAt = new Date(validated.scheduledReleaseAt);
    }
    if ('expiresAt' in validated && validated.expiresAt) {
      updateData.expiresAt = new Date(validated.expiresAt);
    }

    const [escrow] = await db
      .update(escrows)
      .set(updateData)
      .where(eq(escrows.id, id))
      .returning();

    return c.json({ escrow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Update escrow error:", error);
    return c.json(
      {
        error: "Failed to update escrow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /escrows/:id/payment
 * Collection支払記録（Collection Escrow専用）
 */
app.post("/:id/payment", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validated = recordPaymentSchema.parse(body);

    const db = getDatabase();

    // Get existing escrow
    const [existing] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    if (existing.type !== 'collection') {
      return c.json({ error: "This endpoint is only for collection escrows" }, 400);
    }

    // Update participant payment status
    const participants = (existing.participants as any[]) || [];
    const participantIndex = participants.findIndex(
      p => p.address.toLowerCase() === validated.participantAddress.toLowerCase()
    );

    if (participantIndex === -1) {
      return c.json({ error: "Participant not found" }, 404);
    }

    const participant = participants[participantIndex];
    const newPaidAmount = (BigInt(participant.paidAmount || '0') + BigInt(validated.amount)).toString();
    const allocatedAmount = BigInt(participant.allocatedAmount);

    // Update participant status
    let status: 'pending' | 'partial' | 'paid' = 'pending';
    if (BigInt(newPaidAmount) >= allocatedAmount) {
      status = 'paid';
    } else if (BigInt(newPaidAmount) > 0n) {
      status = 'partial';
    }

    participants[participantIndex] = {
      ...participant,
      paidAmount: newPaidAmount,
      status,
      paidAt: status === 'paid' ? new Date().toISOString() : participant.paidAt,
      lastPaymentAt: new Date().toISOString(),
      txHash: validated.txHash,
    };

    // Calculate total collected amount
    const newCollectedAmount = participants.reduce(
      (sum, p) => sum + BigInt(p.paidAmount || '0'),
      0n
    ).toString();

    // Update escrow
    const [escrow] = await db
      .update(escrows)
      .set({
        participants,
        collectedAmount: newCollectedAmount,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, id))
      .returning();

    return c.json({ escrow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Record payment error:", error);
    return c.json(
      {
        error: "Failed to record payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// ============================================
// Phase 2: Policy-Based Approval Flow
// ============================================

/**
 * POST /escrows/:id/approve
 * Escrow承認追加（Policy as Oracle Pattern）
 */
app.post("/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    // Validation
    const approveSchema = z.object({
      guardianId: z.string().uuid(),
      guardianAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      signature: z.string().optional(),
    });

    const validated = approveSchema.parse(body);

    // Approval Service を使用
    const approvalService = getEscrowApprovalService();

    const updatedEscrow = await approvalService.addApproval({
      escrowId: id,
      ...validated,
    });

    return c.json({
      escrow: updatedEscrow,
      message: "Approval added successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Add approval error:", error);
    return c.json(
      {
        error: "Failed to add approval",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /escrows/:id/validate
 * Policy検証（実際には承認せず、結果のみ返す）
 */
app.post("/:id/validate", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    // Escrow取得
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    // Policy取得
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, escrow.policyId))
      .limit(1);

    if (!policy) {
      return c.json({ error: "Policy not found" }, 404);
    }

    // 検証
    const validatorService = getPolicyValidatorService();
    const validation = await validatorService.validateEscrowAgainstPolicy(
      escrow as any,
      policy as any
    );

    return c.json({
      validation,
      escrow: {
        id: escrow.id,
        status: escrow.status,
        totalAmount: escrow.totalAmount,
      },
      policy: {
        id: policy.id,
        name: policy.name,
        threshold: policy.threshold,
        maxAmount: policy.maxAmount,
      },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return c.json(
      {
        error: "Failed to validate escrow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /escrows/:id/approvals
 * 承認状況取得
 */
app.get("/:id/approvals", async (c) => {
  try {
    const id = c.req.param("id");

    const approvalService = getEscrowApprovalService();
    const progress = await approvalService.getApprovalProgress(id);

    return c.json(progress);
  } catch (error) {
    console.error("Get approvals error:", error);
    return c.json(
      {
        error: "Failed to get approvals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * DELETE /escrows/:id/approve/:guardianId
 * 承認取り消し
 */
app.delete("/:id/approve/:guardianId", async (c) => {
  try {
    const id = c.req.param("id");
    const guardianId = c.req.param("guardianId");

    const approvalService = getEscrowApprovalService();
    const updatedEscrow = await approvalService.cancelApproval(id, guardianId);

    return c.json({
      escrow: updatedEscrow,
      message: "Approval cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel approval error:", error);
    return c.json(
      {
        error: "Failed to cancel approval",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// ============================================
// On-chain 操作エンドポイント
// ============================================

// POST /escrows/:id/execute - On-chain で Escrow を実行（資金リリース）
app.post("/:id/execute", async (c) => {
  try {
    const id = c.req.param("id");
    const onChainExecutor = getOnChainExecutorService();

    const result = await onChainExecutor.executeEscrowOnChain(id);

    return c.json({
      message: "Escrow executed on-chain successfully",
      result,
    });
  } catch (error) {
    console.error("Execute escrow on-chain error:", error);
    return c.json(
      {
        error: "Failed to execute escrow on-chain",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// POST /escrows/:id/cancel-onchain - On-chain で Escrow をキャンセル
app.post("/:id/cancel-onchain", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const cancelSchema = z.object({
      reason: z.string().min(1),
    });

    const { reason } = cancelSchema.parse(body);
    const onChainExecutor = getOnChainExecutorService();

    const result = await onChainExecutor.cancelEscrowOnChain(id, reason);

    return c.json({
      message: "Escrow cancelled on-chain successfully",
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Cancel escrow on-chain error:", error);
    return c.json(
      {
        error: "Failed to cancel escrow on-chain",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// GET /escrows/:id/onchain - On-chain Escrow データを取得
app.get("/:id/onchain", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    // Off-chain から onChainId を取得
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id))
      .limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    if (!escrow.onChainId) {
      return c.json({ error: "Escrow not registered on-chain" }, 404);
    }

    const onChainExecutor = getOnChainExecutorService();
    const onChainData = await onChainExecutor.getOnChainEscrow(
      Number(escrow.onChainId)
    );

    return c.json({
      offChainId: id,
      onChainId: escrow.onChainId,
      onChainData,
    });
  } catch (error) {
    console.error("Get on-chain escrow error:", error);
    return c.json(
      {
        error: "Failed to get on-chain escrow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// POST /escrows/:id/verify-integrity - Escrow データの整合性を検証
app.post("/:id/verify-integrity", async (c) => {
  try {
    const id = c.req.param("id");
    const onChainExecutor = getOnChainExecutorService();

    const isValid = await onChainExecutor.verifyEscrowIntegrity(id);

    return c.json({
      escrowId: id,
      isValid,
      message: isValid
        ? "Escrow data integrity verified"
        : "Escrow data integrity check failed",
    });
  } catch (error) {
    console.error("Verify escrow integrity error:", error);
    return c.json(
      {
        error: "Failed to verify escrow integrity",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// GET /escrows/:id/paymaster-check - Paymaster sponsorship check
app.get("/:id/paymaster-check", async (c) => {
  try {
    const escrowId = c.req.param("id");
    const db = getDatabase();

    // Get escrow details
    const [escrow] = await db.select().from(escrows).where(eq(escrows.id, escrowId)).limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    // Get vault's paymaster settings
    const paymasterQuery = await db
      .select()
      .from(paymasterSettings)
      .where(eq(paymasterSettings.vaultId, escrow.vaultId))
      .limit(1);

    const settings = paymasterQuery[0];

    if (!settings || !settings.enabled) {
      return c.json({
        canSponsor: false,
        reason: "Paymaster not enabled for this vault",
        balance: "0",
        estimatedCost: "0",
        token: "USDC",
        enabled: false,
      });
    }

    // Estimate gas cost (simplified - in production this would call actual gas estimation)
    const estimatedCost = "50000000000000000"; // 0.05 ETH in wei as example

    // Check if balance is sufficient
    const balance = BigInt(settings.balance || "0");
    const cost = BigInt(estimatedCost);
    const dailyUsed = BigInt(settings.dailyUsage || "0");
    const dailyLimit = BigInt(settings.dailyLimit || "0");
    const monthlyLimit = BigInt(settings.monthlyLimit || "0");

    const canSponsor =
      balance >= cost &&
      (dailyLimit === 0n || dailyUsed + cost <= dailyLimit) &&
      (monthlyLimit === 0n || dailyUsed + cost <= monthlyLimit);

    let reason = "";
    if (!canSponsor) {
      if (balance < cost) {
        reason = "Insufficient paymaster balance";
      } else if (dailyLimit > 0n && dailyUsed + cost > dailyLimit) {
        reason = "Daily limit exceeded";
      } else if (monthlyLimit > 0n && dailyUsed + cost > monthlyLimit) {
        reason = "Monthly limit exceeded";
      }
    }

    return c.json({
      canSponsor,
      reason: canSponsor ? "Paymaster can sponsor this transaction" : reason,
      balance: settings.balance,
      estimatedCost,
      token: settings.token,
      enabled: settings.enabled,
      healthStatus: settings.healthStatus,
      dailyUsage: settings.dailyUsage,
      dailyLimit: settings.dailyLimit,
      monthlyLimit: settings.monthlyLimit,
      autoRefillEnabled: settings.autoRefillEnabled,
      fallbackEnabled: settings.fallbackEnabled,
    });
  } catch (error) {
    console.error("Paymaster check error:", error);
    return c.json(
      {
        error: "Failed to check paymaster status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// ============================================
// Comments Endpoints
// ============================================

// Comment creation schema
const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  authorName: z.string().max(255).optional(),
});

// GET /escrows/:id/comments - Get comments for an escrow
app.get("/:id/comments", async (c) => {
  try {
    const escrowId = c.req.param("id");
    const db = getDatabase();

    // Verify escrow exists
    const [escrow] = await db.select().from(escrows).where(eq(escrows.id, escrowId)).limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    // Get comments ordered by creation time (newest first)
    const escrowComments = await db
      .select()
      .from(comments)
      .where(eq(comments.escrowId, escrowId))
      .orderBy(desc(comments.createdAt));

    return c.json({
      comments: escrowComments,
      total: escrowComments.length,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return c.json(
      {
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// POST /escrows/:id/comments - Add a comment to an escrow
app.post("/:id/comments", async (c) => {
  try {
    const escrowId = c.req.param("id");
    const body = await c.req.json();
    const db = getDatabase();

    // Validate request body
    const validatedData = createCommentSchema.parse(body);

    // Verify escrow exists
    const [escrow] = await db.select().from(escrows).where(eq(escrows.id, escrowId)).limit(1);

    if (!escrow) {
      return c.json({ error: "Escrow not found" }, 404);
    }

    // For now, use a placeholder author address
    // In production, this would come from authenticated user session
    const author = body.author || "0x0000000000000000000000000000000000000000";

    // Create comment
    const newComment: NewComment = {
      escrowId,
      author,
      authorName: validatedData.authorName,
      content: validatedData.content,
    };

    const [createdComment] = await db.insert(comments).values(newComment).returning();

    // Create timeline event
    const timelineEvent: NewTimeline = {
      escrowId,
      eventType: 'comment_added',
      actor: author,
      data: {
        commentId: createdComment.id,
        content: validatedData.content.substring(0, 100), // Preview
      },
    };

    await db.insert(timelines).values(timelineEvent);

    return c.json({
      comment: createdComment,
      message: "Comment added successfully",
    }, 201);
  } catch (error) {
    console.error("Create comment error:", error);
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        400
      );
    }
    return c.json(
      {
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
