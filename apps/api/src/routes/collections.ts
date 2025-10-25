/**
 * Collection API Routes (Legacy Compatibility Layer)
 *
 * このファイルはレガシーAPIとの互換性のために残されています
 * 新しいPolicy-Based Architectureでは、CollectionはEscrowの一種として扱われます
 * 
 * すべてのリクエストは /escrows エンドポイントにリダイレクトされます
 */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDatabase, escrows, policies, type NewEscrow } from "../db/client.js";
import { z } from "zod";
import type { CollectionParticipant } from "@shared/types/escrow";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

const createCollectionSchema = z.object({
  vaultId: z.string().uuid(),
  vaultAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  deadline: z.string().datetime().optional(),
  participants: z.array(
    z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
      name: z.string().min(1),
      allocatedAmount: z.string(),
    })
  ),
  createdBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  note: z.string().optional(),
});

const recordPaymentSchema = z.object({
  participantAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

const addParticipantSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  name: z.string().min(1),
  allocatedAmount: z.string(),
});

// ============================================
// Routes
// ============================================

/**
 * POST /collections
 * 新しい集金を作成（escrows API にリダイレクト）
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = createCollectionSchema.parse(body);

    const db = getDatabase();

    // Get or create default collection policy for this vault
    let vaultPolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.vaultId, validatedData.vaultId))
      .limit(1);

    let defaultPolicy;
    if (vaultPolicies.length === 0) {
      // Auto-create default policy for collection
      console.log("[Collection] No policy found, creating default policy for vault:", validatedData.vaultId);
      // Generate a unique policyId (bytes32 as hex) using vault ID
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(`collection-policy-${validatedData.vaultId}`).digest('hex');
      const dummyPolicyId = '0x' + hash;

      const [newPolicy] = await db
        .insert(policies)
        .values({
          policyId: dummyPolicyId,
          vaultId: validatedData.vaultId,
          type: 'collection',
          name: 'Default Collection Policy',
          description: 'Auto-generated policy for collections',
          threshold: 1,
          active: true,
        })
        .returning();
      defaultPolicy = newPolicy;
      console.log("[Collection] Created default policy:", { id: newPolicy.id, name: newPolicy.name });
    } else {
      defaultPolicy = vaultPolicies[0];
    }

    // 参加者リストから合計金額を計算
    const totalAmount = validatedData.participants.reduce(
      (sum, p) => sum + BigInt(p.allocatedAmount),
      0n
    ).toString();

    // Initialize participants with status and unique IDs
    const participants: CollectionParticipant[] = validatedData.participants.map((p) => ({
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      address: p.address,
      name: p.name,
      allocatedAmount: p.allocatedAmount,
      paidAmount: "0",
      status: "pending" as const,
    }));

    // Create collection escrow
    const newEscrow: NewEscrow = {
      type: 'collection',
      vaultId: validatedData.vaultId,
      policyId: defaultPolicy.id,
      name: validatedData.name,
      description: validatedData.description,
      token: validatedData.token,
      totalAmount: totalAmount,
      collectedAmount: '0',
      participants: participants,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
      status: 'draft',
      metadata: {
        createdBy: validatedData.createdBy,
        note: validatedData.note,
        legacyApi: true, // Mark as created via legacy API
      },
    };

    const [collection] = await db
      .insert(escrows)
      .values(newEscrow)
      .returning();

    console.log("[Collection] Created via legacy API:", {
      id: collection.id,
      name: validatedData.name,
      totalAmount: totalAmount,
      participants: validatedData.participants.length,
    });

    return c.json({ collection }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[Collection] Validation error:", error.errors);
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("[Collection] Create error:", error);
    return c.json(
      {
        error: "Failed to create collection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /collections/:id/participants
 * 参加者を追加
 */
app.post("/:id/participants", async (c) => {
  try {
    const collectionId = c.req.param("id");
    const body = await c.req.json();
    const validatedData = addParticipantSchema.parse(body);

    const db = getDatabase();

    // Get existing escrow
    const [existing] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, collectionId))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Collection not found" }, 404);
    }

    if (existing.type !== 'collection') {
      return c.json({ error: "Invalid collection type" }, 400);
    }

    // Get current participants
    const participants = (existing.participants as CollectionParticipant[]) || [];

    // Generate unique ID for participant
    const participantId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create new participant
    const newParticipant: CollectionParticipant = {
      id: participantId,
      address: validatedData.address,
      name: validatedData.name,
      allocatedAmount: validatedData.allocatedAmount,
      paidAmount: "0",
      status: "pending" as const,
    };

    // Add new participant
    const updatedParticipants = [...participants, newParticipant];

    // Calculate new total amount
    const newTotalAmount = updatedParticipants.reduce(
      (sum, p) => sum + BigInt(p.allocatedAmount),
      0n
    ).toString();

    // Update escrow
    const [updated] = await db
      .update(escrows)
      .set({
        participants: updatedParticipants,
        totalAmount: newTotalAmount,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, collectionId))
      .returning();

    console.log("[Collection] Participant added:", {
      collectionId,
      participantName: validatedData.name,
      allocatedAmount: validatedData.allocatedAmount,
      totalParticipants: updatedParticipants.length,
    });

    return c.json({ collection: updated }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("[Collection] Add participant error:", error);
    return c.json(
      {
        error: "Failed to add participant",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /collections/:id/payments
 * 支払を記録
 */
app.post("/:id/payments", async (c) => {
  try {
    const collectionId = c.req.param("id");
    const body = await c.req.json();
    const validatedData = recordPaymentSchema.parse(body);

    const db = getDatabase();

    // Get existing escrow
    const [existing] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, collectionId))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Collection not found" }, 404);
    }

    if (existing.type !== 'collection') {
      return c.json({ error: "Invalid collection type" }, 400);
    }

    // Update participant payment status
    const participants = (existing.participants as CollectionParticipant[]) || [];
    const participantIndex = participants.findIndex(
      p => p.address.toLowerCase() === validatedData.participantAddress.toLowerCase()
    );

    if (participantIndex === -1) {
      return c.json({ error: "Participant not found" }, 404);
    }

    const participant = participants[participantIndex];
    const newPaidAmount = (BigInt(participant.paidAmount || '0') + BigInt(validatedData.amount)).toString();
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
      txHash: validatedData.txHash,
    };

    // Calculate total collected amount
    const collectedAmount = participants.reduce(
      (sum, p) => sum + BigInt(p.paidAmount || '0'),
      0n
    ).toString();

    // Check if all paid
    const allPaid = participants.every((p) => p.status === 'paid');

    // Update escrow
    const newStatus = allPaid ? "completed" : "draft";

    const [updated] = await db
      .update(escrows)
      .set({
        participants,
        collectedAmount,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, collectionId))
      .returning();

    console.log("[Collection] Payment recorded:", {
      collectionId,
      participant: validatedData.participantAddress,
      amount: validatedData.amount,
      collectedAmount,
      allPaid,
    });

    return c.json({ collection: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("[Collection] Record payment error:", error);
    return c.json(
      {
        error: "Failed to record payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /collections/vault/:vaultId
 * Vault内の集金一覧を取得
 */
app.get("/vault/:vaultId", async (c) => {
  try {
    const vaultId = c.req.param("vaultId");
    const db = getDatabase();

    const collections = await db
      .select()
      .from(escrows)
      .where(eq(escrows.vaultId, vaultId));

    // Collection type のみフィルタ
    const collectionEscrows = collections.filter(e => e.type === 'collection');

    return c.json({ collections: collectionEscrows });
  } catch (error) {
    console.error("[Collection] Get collections error:", error);
    return c.json(
      {
        error: "Failed to fetch collections",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /collections/:id
 * 集金詳細を取得
 */
app.get("/:id", async (c) => {
  try {
    const collectionId = c.req.param("id");
    const db = getDatabase();

    const [collection] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, collectionId))
      .limit(1);

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    if (collection.type !== 'collection') {
      return c.json({ error: "Invalid collection type" }, 400);
    }

    // Get vault information to include vaultAddress
    const { vaults } = await import("../db/client.js");
    const [vault] = await db
      .select()
      .from(vaults)
      .where(eq(vaults.id, collection.vaultId))
      .limit(1);

    const participants = (collection.participants as CollectionParticipant[]) || [];

    // 統計情報を計算
    const totalParticipants = participants.length;
    const paidParticipants = participants.filter(
      (p) => p.status === 'paid'
    ).length;
    const pendingParticipants = totalParticipants - paidParticipants;
    const completionRate =
      (Number(collection.collectedAmount || '0') / Number(collection.totalAmount)) * 100;

    return c.json({
      ...collection,
      vaultAddress: vault?.address,
      vaultName: vault?.name,
      stats: {
        totalParticipants,
        paidParticipants,
        pendingParticipants,
        totalAmount: collection.totalAmount,
        collectedAmount: collection.collectedAmount || '0',
        completionRate: Math.min(completionRate, 100),
      },
    });
  } catch (error) {
    console.error("[Collection] Get collection error:", error);
    return c.json(
      {
        error: "Failed to fetch collection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// ============================================
// Get Specific Participant
// ============================================
app.get("/:collectionId/participants/:participantId", async (c) => {
  try {
    const { collectionId, participantId } = c.req.param();
    const db = getDatabase();

    const [collection] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, collectionId))
      .limit(1);

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    if (collection.type !== 'collection') {
      return c.json({ error: "Invalid collection type" }, 400);
    }

    const participants = (collection.participants as CollectionParticipant[]) || [];
    const participant = participants.find(p => p.id === participantId);

    if (!participant) {
      return c.json({ error: "Participant not found" }, 404);
    }

    return c.json(participant);
  } catch (error) {
    console.error("[Collection] Get participant error:", error);
    return c.json(
      {
        error: "Failed to fetch participant",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// ============================================
// Link Wallet to Participant
// ============================================
app.patch("/:collectionId/participants/:participantId/link-wallet", async (c) => {
  console.log("[Collection] Link-wallet endpoint called");
  try {
    const { collectionId, participantId } = c.req.param();
    console.log("[Collection] collectionId:", collectionId, "participantId:", participantId);
    const body = await c.req.json();
    console.log("[Collection] Request body:", body);

    const { address } = z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
    }).parse(body);

    const db = getDatabase();

    // Get collection
    const [collection] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, collectionId))
      .limit(1);

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    if (collection.type !== 'collection') {
      return c.json({ error: "Invalid collection type" }, 400);
    }

    const participants = (collection.participants as CollectionParticipant[]) || [];
    const participantIndex = participants.findIndex(p => p.id === participantId);

    if (participantIndex === -1) {
      return c.json({ error: "Participant not found" }, 404);
    }

    // Update participant with wallet address (allow overwriting existing address)
    participants[participantIndex] = {
      ...participants[participantIndex],
      address,
    };

    // Update collection in database
    await db
      .update(escrows)
      .set({
        participants: participants as any,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, collectionId));

    return c.json(participants[participantIndex]);
  } catch (error) {
    console.error("[Collection] Link wallet error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        400
      );
    }

    return c.json(
      {
        error: "Failed to link wallet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Record payment for a participant
 * PATCH /api/collections/:collectionId/participants/:participantId/record-payment
 */
app.patch("/:collectionId/participants/:participantId/record-payment", async (c) => {
  try {
    const { collectionId, participantId } = c.req.param();
    const db = getDatabase();

    // Get collection
    const [collection] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, collectionId))
      .limit(1);

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    if (collection.type !== 'collection') {
      return c.json({ error: "Invalid collection type" }, 400);
    }

    const participants = (collection.participants as CollectionParticipant[]) || [];
    const participantIndex = participants.findIndex(p => p.id === participantId);

    if (participantIndex === -1) {
      return c.json({ error: "Participant not found" }, 404);
    }

    const participant = participants[participantIndex];

    // Check if already paid
    if (participant.status === 'paid') {
      return c.json({ error: "Payment already recorded" }, 400);
    }

    // Record full payment
    participants[participantIndex] = {
      ...participant,
      paidAmount: participant.allocatedAmount,
      status: 'paid' as const,
      paidAt: new Date().toISOString(),
    };

    // Calculate new collected amount
    const newCollectedAmount = participants.reduce((sum, p) => {
      return sum + BigInt(p.paidAmount);
    }, 0n).toString();

    // Update collection in database
    await db
      .update(escrows)
      .set({
        participants: participants as any,
        collectedAmount: newCollectedAmount,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, collectionId));

    return c.json(participants[participantIndex]);
  } catch (error) {
    console.error("[Collection] Record payment error:", error);

    return c.json(
      {
        error: "Failed to record payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
