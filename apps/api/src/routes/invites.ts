/**
 * Invite API Routes
 *
 * エンドポイント:
 * - GET /invites - 招待一覧取得
 * - POST /invites - 招待作成（EIP-712署名付き）
 * - GET /invites/:token - 招待詳細取得（トークンで検索）
 * - POST /invites/:token/accept - 招待受諾
 * - DELETE /invites/:id - 招待削除
 * - GET /invites/by-vault/:vaultId - Vault別招待一覧
 */

import { Hono } from "hono";
import { eq, and, gt, sql } from "drizzle-orm";
import { getDatabase, invites, members, vaults, shareableKeys, shareableKeyUsage, type NewInvite, type NewMember } from "../db/client.js";
import { z } from "zod";
import { randomBytes } from "crypto";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

const createInviteSchema = z.object({
  vaultId: z.string().uuid(), // Vault UUID (vaults.id)
  role: z.enum(["owner", "guardian", "requester", "viewer", "approver"]),
  weight: z.number().int().min(1).optional(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/), // EIP-712 signature
  expiresAt: z.string().datetime(), // ISO 8601 datetime
  createdBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  metadata: z.record(z.any()).optional(),
  // Payment fields for Shareable Keys
  paymentRequired: z.boolean().optional(),
  paymentAmount: z.string().optional(), // BigInt as string (USDC wei)
  paymentToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(), // ERC20 token address
  paymentRecipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(), // Payment destination
});

const acceptInviteSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Accepting user's address
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/), // User's signature accepting the invite
  paymentTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(), // Payment transaction hash
});

// ============================================
// Helper Functions
// ============================================

/**
 * 招待トークン生成
 */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * EIP-712署名検証（モック）
 * TODO: 実際のEIP-712署名検証実装
 */
function verifyEIP712Signature(
  signature: string,
  vaultId: string,
  role: string,
  expiresAt: Date,
  signer: string
): boolean {
  // モック実装 - 常にtrueを返す
  // 実際の実装では、EIP-712 typedDataからハッシュを生成し、
  // ecrecover で署名者を検証する
  return signature.startsWith("0x") && signature.length > 10;
}

// ============================================
// Routes
// ============================================

/**
 * GET /invites
 * 招待一覧取得
 */
app.get("/", async (c) => {
  try {
    const db = getDatabase();

    // Query parameters
    const vaultId = c.req.query("vaultId");
    const createdBy = c.req.query("createdBy");
    const includeExpired = c.req.query("includeExpired") === "true";

    const conditions = [];

    if (vaultId) {
      conditions.push(eq(invites.vaultId, vaultId));
    }
    if (createdBy) {
      conditions.push(eq(invites.createdBy, createdBy));
    }
    if (!includeExpired) {
      conditions.push(gt(invites.expiresAt, new Date()));
    }

    let query = db.select().from(invites);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;

    return c.json({ invites: result });
  } catch (error) {
    console.error("Get invites error:", error);
    return c.json(
      {
        error: "Failed to fetch invites",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /invites
 * 招待作成（EIP-712署名付き）
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createInviteSchema.parse(body);

    // EIP-712署名検証
    const expiresAt = new Date(validated.expiresAt);
    const isValidSignature = verifyEIP712Signature(
      validated.signature,
      validated.vaultId,
      validated.role,
      expiresAt,
      validated.createdBy
    );

    if (!isValidSignature) {
      return c.json({ error: "Invalid EIP-712 signature" }, 400);
    }

    // 招待トークン生成
    const token = generateInviteToken();

    const db = getDatabase();

    // Vaultの存在確認 (vaultId is UUID from vaults.id)
    const [existingVault] = await db
      .select()
      .from(vaults)
      .where(eq(vaults.id, validated.vaultId))
      .limit(1);

    if (!existingVault) {
      return c.json(
        {
          error: "Vault not found",
          message: `指定されたVault (${validated.vaultId}) が存在しません。先にグループを作成してください。`,
          vaultId: validated.vaultId,
        },
        404
      );
    }

    const newInvite: NewInvite = {
      vaultId: validated.vaultId,
      token,
      role: validated.role,
      weight: validated.weight ?? 1,
      signature: validated.signature,
      expiresAt,
      createdBy: validated.createdBy,
      metadata: validated.metadata,
      // Payment fields
      paymentRequired: validated.paymentRequired ?? false,
      paymentAmount: validated.paymentAmount ?? null,
      paymentToken: validated.paymentToken ?? null,
      paymentRecipient: validated.paymentRecipient ?? null,
    };

    const result = await db.insert(invites).values(newInvite).returning();

    return c.json(
      {
        invite: result[0],
        inviteUrl: `${process.env.WEB_ORIGIN}/invite/${token}`,
      },
      201
    );
  } catch (error) {
    console.error("Create invite error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to create invite",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /invites/:token
 * 招待詳細取得（トークンで検索）
 */
app.get("/:token", async (c) => {
  try {
    const token = c.req.param("token");

    if (!token) {
      return c.json({ error: "Invite token is required" }, 400);
    }

    const db = getDatabase();

    const result = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: "Invite not found" }, 404);
    }

    const invite = result[0];

    // 有効期限チェック
    if (new Date(invite.expiresAt) < new Date()) {
      return c.json(
        {
          error: "Invite has expired",
          invite: {
            ...invite,
            expired: true,
          },
        },
        410
      );
    }

    // 既に使用済みチェック
    if (invite.usedAt) {
      return c.json(
        {
          error: "Invite has already been used",
          invite: {
            ...invite,
            used: true,
          },
        },
        410
      );
    }

    return c.json({ invite });
  } catch (error) {
    console.error("Get invite error:", error);
    return c.json(
      {
        error: "Failed to fetch invite",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /invites/:token/accept
 * 招待受諾
 */
app.post("/:token/accept", async (c) => {
  try {
    const token = c.req.param("token");
    const body = await c.req.json();
    const validated = acceptInviteSchema.parse(body);

    const db = getDatabase();

    // 招待取得
    const inviteResult = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (inviteResult.length === 0) {
      return c.json({ error: "Invite not found" }, 404);
    }

    const invite = inviteResult[0];

    // 有効期限チェック
    if (new Date(invite.expiresAt) < new Date()) {
      return c.json({ error: "Invite has expired" }, 410);
    }

    // 既に使用済みチェック
    if (invite.usedAt) {
      return c.json({ error: "Invite has already been used" }, 410);
    }

    // 既にメンバーかどうかチェック
    const [existingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.vaultId, invite.vaultId),
          eq(members.address, validated.address)
        )
      )
      .limit(1);

    if (existingMember) {
      return c.json(
        {
          error: "Already a member",
          message: "このアドレスは既にこのグループのメンバーです。",
          member: existingMember,
        },
        409
      );
    }

    // Payment verification for Shareable Keys
    if (invite.paymentRequired) {
      if (!validated.paymentTxHash) {
        return c.json(
          {
            error: "Payment required",
            message: "この招待にはUSDC決済が必要です。",
            paymentAmount: invite.paymentAmount,
            paymentToken: invite.paymentToken,
            paymentRecipient: invite.paymentRecipient,
          },
          402 // Payment Required
        );
      }

      // TODO: Verify payment transaction on Base Sepolia
      // 1. Get transaction receipt using RPC
      // 2. Verify transaction is successful
      // 3. Verify transfer amount matches invite.paymentAmount
      // 4. Verify recipient matches invite.paymentRecipient
      // 5. Verify token is USDC (invite.paymentToken)

      // For now, update payment info
      await db
        .update(invites)
        .set({
          paymentTxHash: validated.paymentTxHash,
          paymentCompletedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));
    }

    // TODO: ユーザー署名検証
    // EIP-712署名でユーザーが招待を受諾することを確認

    // Shareable Key招待の場合の特別処理
    if (invite.metadata && typeof invite.metadata === 'object' && 'source' in invite.metadata && invite.metadata.source === 'shareable-key') {
      const metadata = invite.metadata as any;
      const { shareableKeyId, permissions } = metadata;

      // shareable_key_usageテーブルにアクセス権を記録
      await db.insert(shareableKeyUsage).values({
        keyId: shareableKeyId,
        userAddress: validated.address.toLowerCase(),
        action: 'invited_access_granted',
        metadata: {
          inviteToken: token,
          permissions,
          grantedAt: new Date().toISOString(),
        },
      });

      // allowedAddressesにユーザーを追加
      await db
        .update(shareableKeys)
        .set({
          allowedAddresses: sql`
            COALESCE(allowed_addresses, '[]'::jsonb) ||
            ${JSON.stringify([validated.address.toLowerCase()])}::jsonb
          `,
        })
        .where(eq(shareableKeys.id, shareableKeyId));
    }

    // メンバーとして追加
    const newMember: NewMember = {
      vaultId: invite.vaultId,
      address: validated.address,
      role: invite.role,
      weight: invite.weight ?? 1,
      addedBy: invite.createdBy,
      metadata: {
        inviteToken: token,
        acceptedAt: new Date().toISOString(),
        source: invite.metadata && typeof invite.metadata === 'object' && 'source' in invite.metadata
          ? (invite.metadata as any).source
          : undefined,
      },
    };

    // トランザクション的に処理
    // 1. メンバー追加
    const memberResult = await db
      .insert(members)
      .values(newMember)
      .returning();

    // 2. 招待を使用済みにする
    await db
      .update(invites)
      .set({
        usedAt: new Date(),
        usedBy: validated.address,
      })
      .where(eq(invites.id, invite.id));

    return c.json({
      success: true,
      member: memberResult[0],
      message: "Successfully joined the vault",
    });
  } catch (error) {
    console.error("Accept invite error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    // 既にメンバーの場合のエラーハンドリング
    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return c.json(
        { error: "You are already a member of this vault" },
        409
      );
    }

    return c.json(
      {
        error: "Failed to accept invite",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * DELETE /invites/:id
 * 招待削除
 */
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Invite ID is required" }, 400);
    }

    const db = getDatabase();

    // 招待存在チェック
    const existing = await db
      .select()
      .from(invites)
      .where(eq(invites.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Invite not found" }, 404);
    }

    await db.delete(invites).where(eq(invites.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete invite error:", error);
    return c.json(
      {
        error: "Failed to delete invite",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /invites/by-vault/:vaultId
 * Vault別招待一覧
 */
app.get("/by-vault/:vaultId", async (c) => {
  try {
    const vaultIdParam = c.req.param("vaultId");

    if (!vaultIdParam) {
      return c.json({ error: "Vault ID is required" }, 400);
    }

    const includeExpired = c.req.query("includeExpired") === "true";
    const includeUsed = c.req.query("includeUsed") === "true";

    const db = getDatabase();

    // Find vault by address or UUID to get the actual vault ID
    let vault;
    if (vaultIdParam.startsWith('0x') && vaultIdParam.length === 42) {
      // Ethereum address format
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.address, vaultIdParam))
        .limit(1);
    } else {
      // UUID format - try both id and uuid fields
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.id, vaultIdParam))
        .limit(1);

      if (!vault) {
        [vault] = await db
          .select()
          .from(vaults)
          .where(eq(vaults.uuid, vaultIdParam))
          .limit(1);
      }
    }

    if (!vault) {
      return c.json({ error: "Vault not found" }, 404);
    }

    const conditions = [eq(invites.vaultId, vault.id)];

    if (!includeExpired) {
      conditions.push(gt(invites.expiresAt, new Date()));
    }

    const result = await db
      .select()
      .from(invites)
      .where(and(...conditions));

    // Filter out used invites if not requested
    const filtered = includeUsed
      ? result
      : result.filter((invite) => !invite.usedAt);

    return c.json({ invites: filtered });
  } catch (error) {
    console.error("Get vault invites error:", error);
    return c.json(
      {
        error: "Failed to fetch vault invites",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;