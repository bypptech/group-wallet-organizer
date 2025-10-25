/**
 * Shareable Keys API Routes
 *
 * エンドポイント:
 * - GET /shareable-keys - Shareable Keys一覧取得
 * - POST /shareable-keys - Shareable Key作成（自動的にVaultメンバー全員を認可）
 * - GET /shareable-keys/:id - Shareable Key詳細取得
 * - POST /shareable-keys/:id/create-invite - 招待リンク生成（Weight固定1）
 * - POST /shareable-keys/:id/revoke - Shareable Key無効化
 * - GET /shareable-keys/:id/usage - 使用履歴取得
 * - GET /shareable-keys/:id/authorized-users - 認可ユーザー一覧取得
 * - POST /shareable-keys/:id/use - 使用記録
 */

import { Hono } from "hono";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDatabase } from "../db/client.js";
import { shareableKeys, shareableKeyUsage, vaults, invites, authorizedUsers, members } from "../db/schema.js";
import { randomBytes } from "crypto";

const app = new Hono();

// ============================================
// Helper Functions
// ============================================

/**
 * トークン生成
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 招待トークン生成
 */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 共有URL生成
 */
function generateShareUrl(token: string): string {
  const baseUrl = process.env.WEB_ORIGIN || "http://localhost:5173";
  return `${baseUrl}/share/${token}`;
}

/**
 * 招待URL生成
 */
function generateInviteUrl(token: string): string {
  const baseUrl = process.env.WEB_ORIGIN || "http://localhost:5173";
  return `${baseUrl}/invite/${token}`;
}

// ============================================
// Routes
// ============================================

/**
 * GET /shareable-keys
 * Shareable Keys一覧取得
 */
app.get("/", async (c) => {
  try {
    const createdBy = c.req.query("createdBy");
    const demo = c.req.query("demo");
    const vaultId = c.req.query("vaultId");

    // Demo mode: fetch all keys for demo vault
    if (demo === "true" && vaultId) {
      const db = getDatabase();

      const keys = await db
        .select()
        .from(shareableKeys)
        .where(eq(shareableKeys.vaultId, vaultId))
        .orderBy(desc(shareableKeys.createdAt));

      return c.json(keys);
    }

    if (!createdBy) {
      return c.json({ error: "createdBy parameter is required" }, 400);
    }

    const db = getDatabase();

    const keys = await db
      .select({
        id: shareableKeys.id,
        name: shareableKeys.name,
        description: shareableKeys.description,
        keyType: shareableKeys.keyType,
        vaultId: shareableKeys.vaultId,
        vaultAddress: vaults.address,
        vaultName: vaults.name,
        permissions: shareableKeys.permissions,
        shareUrl: shareableKeys.shareUrl,
        token: shareableKeys.token,
        maxUses: shareableKeys.maxUses,
        usageCount: shareableKeys.usageCount,
        expiresAt: shareableKeys.expiresAt,
        status: shareableKeys.status,
        revokedAt: shareableKeys.revokedAt,
        createdBy: shareableKeys.createdBy,
        createdAt: shareableKeys.createdAt,
        metadata: shareableKeys.metadata,
      })
      .from(shareableKeys)
      .leftJoin(vaults, eq(shareableKeys.vaultId, vaults.id))
      .where(eq(shareableKeys.createdBy, createdBy.toLowerCase()))
      .orderBy(desc(shareableKeys.createdAt));

    return c.json(keys);
  } catch (error) {
    console.error("Get shareable keys error:", error);
    return c.json(
      {
        error: "Failed to fetch shareable keys",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /shareable-keys
 * Shareable Key作成
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      description,
      keyType,
      vaultId,
      permissions,
      maxUses,
      expiresAt,
      createdBy,
      metadata,
    } = body;

    // 必須フィールドのバリデーション
    if (!name || !keyType || !createdBy) {
      return c.json(
        {
          error: "Missing required fields",
          required: ["name", "keyType", "createdBy"],
        },
        400
      );
    }

    // keyTypeがvaultの場合、vaultIdは必須
    if (keyType === "vault" && !vaultId) {
      return c.json(
        {
          error: "vaultId is required for vault key type",
        },
        400
      );
    }

    const db = getDatabase();

    // Vault存在確認（keyType=vaultの場合のみ）
    if (keyType === "vault") {
      const [existingVault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.id, vaultId))
        .limit(1);

      if (!existingVault) {
        return c.json({ error: "Vault not found" }, 404);
      }
    }

    // トークンと共有URL生成
    const token = generateToken();
    const shareUrl = generateShareUrl(token);

    const newKey = {
      vaultId: keyType === "vault" ? vaultId : null,
      name,
      description,
      keyType,
      permissions: permissions || [], // Optional - default to empty array
      shareUrl,
      token,
      maxUses: maxUses || null,
      usageCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: "active",
      createdBy: createdBy.toLowerCase(),
      metadata: metadata || null,
    };

    const [created] = await db
      .insert(shareableKeys)
      .values(newKey)
      .returning();

    // Auto-authorize all Vault Members (if keyType is 'vault')
    if (keyType === "vault" && vaultId) {
      try {
        // Fetch all members of the vault
        const vaultMembers = await db
          .select()
          .from(members)
          .where(eq(members.vaultId, vaultId));

        console.log(`[ShareableKeys] Auto-authorizing ${vaultMembers.length} vault members for key ${created.id}`);

        // Create authorization records for all members
        if (vaultMembers.length > 0) {
          const authorizations = vaultMembers.map((member) => ({
            keyId: created.id,
            userAddress: member.address.toLowerCase(),
            vaultId: vaultId,
            authorizedBy: createdBy.toLowerCase(),
            status: "active" as const,
          }));

          await db.insert(authorizedUsers).values(authorizations);
          console.log(`[ShareableKeys] Successfully authorized ${authorizations.length} members`);
        }
      } catch (authError) {
        console.error("[ShareableKeys] Error auto-authorizing vault members:", authError);
        // Continue even if authorization fails - key is still created
      }
    }

    return c.json(created, 201);
  } catch (error) {
    console.error("Create shareable key error:", error);
    return c.json(
      {
        error: "Failed to create shareable key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /shareable-keys/my-accessible-devices
 * ユーザーがアクセス可能なデバイス一覧取得
 */
app.get("/my-accessible-devices", async (c) => {
  try {
    const address = c.req.query("address");

    if (!address) {
      return c.json({ error: "Address required" }, 400);
    }

    const db = getDatabase();

    // Get all active authorized keys for this user
    const userKeys = await db
      .select({
        keyId: authorizedUsers.keyId,
        device: sql<string>`${shareableKeys.metadata}->>'device'`,
        keyName: shareableKeys.name,
        keyStatus: shareableKeys.status,
        authStatus: authorizedUsers.status,
      })
      .from(authorizedUsers)
      .innerJoin(shareableKeys, eq(authorizedUsers.keyId, shareableKeys.id))
      .where(
        and(
          eq(authorizedUsers.userAddress, address.toLowerCase()),
          eq(authorizedUsers.status, "active"),
          eq(shareableKeys.status, "active")
        )
      );

    // Extract unique devices (filter out null and empty)
    const devices = [
      ...new Set(
        userKeys
          .map((k) => k.device)
          .filter((d): d is string => d !== null && d !== undefined && d !== "")
      ),
    ];

    return c.json({
      devices,
      keys: userKeys,
      totalKeys: userKeys.length,
    });
  } catch (error) {
    console.error("Get accessible devices error:", error);
    return c.json(
      {
        error: "Failed to get accessible devices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /shareable-keys/:id
 * Shareable Key詳細取得
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    const [key] = await db
      .select({
        id: shareableKeys.id,
        name: shareableKeys.name,
        description: shareableKeys.description,
        keyType: shareableKeys.keyType,
        vaultId: shareableKeys.vaultId,
        vaultAddress: vaults.address,
        vaultName: vaults.name,
        permissions: shareableKeys.permissions,
        shareUrl: shareableKeys.shareUrl,
        token: shareableKeys.token,
        maxUses: shareableKeys.maxUses,
        usageCount: shareableKeys.usageCount,
        expiresAt: shareableKeys.expiresAt,
        status: shareableKeys.status,
        revokedAt: shareableKeys.revokedAt,
        revokedBy: shareableKeys.revokedBy,
        createdBy: shareableKeys.createdBy,
        createdAt: shareableKeys.createdAt,
        updatedAt: shareableKeys.updatedAt,
        metadata: shareableKeys.metadata,
      })
      .from(shareableKeys)
      .leftJoin(vaults, eq(shareableKeys.vaultId, vaults.id))
      .where(eq(shareableKeys.id, id))
      .limit(1);

    if (!key) {
      return c.json({ error: "Shareable key not found" }, 404);
    }

    return c.json(key);
  } catch (error) {
    console.error("Get shareable key error:", error);
    return c.json(
      {
        error: "Failed to fetch shareable key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /shareable-keys/:id/create-invite
 * 招待リンク生成（Team Pay同等、Weight固定1）
 */
app.post("/:id/create-invite", async (c) => {
  try {
    const keyId = c.req.param("id");
    const body = await c.req.json();
    const { expiresAt, createdBy } = body;

    if (!expiresAt || !createdBy) {
      return c.json(
        {
          error: "Missing required fields",
          required: ["expiresAt", "createdBy"],
        },
        400
      );
    }

    const db = getDatabase();

    // Shareable Key取得
    const [key] = await db
      .select()
      .from(shareableKeys)
      .where(eq(shareableKeys.id, keyId))
      .limit(1);

    if (!key) {
      return c.json({ error: "Shareable key not found" }, 404);
    }

    // Keyが無効化されていないかチェック
    if (key.status !== "active") {
      return c.json(
        {
          error: "Shareable key is not active",
          status: key.status,
        },
        400
      );
    }

    // VaultIdが必要
    if (!key.vaultId) {
      return c.json(
        {
          error: "Cannot create invite for key without vaultId",
        },
        400
      );
    }

    // 招待トークン生成
    const inviteToken = generateInviteToken();
    const inviteUrl = generateInviteUrl(inviteToken);

    // invitesテーブルに招待作成
    // Weight は固定で1、Role は viewer固定（権限はpermissionsで管理）
    const newInvite = {
      vaultId: key.vaultId,
      token: inviteToken,
      role: "viewer", // 固定
      weight: 1, // 固定（Weight機能を使用しない）
      signature: "0x" + "0".repeat(130), // モック署名
      expiresAt: new Date(expiresAt),
      createdBy: createdBy.toLowerCase(),
      metadata: {
        source: "shareable-key",
        shareableKeyId: keyId,
        keyType: key.keyType,
        permissions: key.permissions,
        accessControlType: "whitelist",
      },
    };

    const [createdInvite] = await db
      .insert(invites)
      .values(newInvite)
      .returning();

    return c.json(
      {
        inviteUrl,
        token: createdInvite.token,
        expiresAt: createdInvite.expiresAt,
        role: createdInvite.role,
        weight: createdInvite.weight,
        metadata: createdInvite.metadata,
      },
      201
    );
  } catch (error) {
    console.error("Create invite error:", error);
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
 * POST /shareable-keys/:id/revoke
 * Shareable Key無効化
 */
app.post("/:id/revoke", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { revokedBy } = body;

    if (!revokedBy) {
      return c.json({ error: "revokedBy is required" }, 400);
    }

    const db = getDatabase();

    const [updated] = await db
      .update(shareableKeys)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        revokedBy: revokedBy.toLowerCase(),
      })
      .where(eq(shareableKeys.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Shareable key not found" }, 404);
    }

    return c.json({
      success: true,
      key: updated,
    });
  } catch (error) {
    console.error("Revoke shareable key error:", error);
    return c.json(
      {
        error: "Failed to revoke shareable key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /shareable-keys/:id/usage
 * 使用履歴取得
 */
app.get("/:id/usage", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    const usage = await db
      .select()
      .from(shareableKeyUsage)
      .where(eq(shareableKeyUsage.keyId, id))
      .orderBy(desc(shareableKeyUsage.usedAt));

    return c.json({ usage });
  } catch (error) {
    console.error("Get usage error:", error);
    return c.json(
      {
        error: "Failed to fetch usage history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /shareable-keys/:id/authorized-users
 * 認可ユーザー一覧取得
 */
app.get("/:id/authorized-users", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    // Verify key exists
    const [key] = await db
      .select()
      .from(shareableKeys)
      .where(eq(shareableKeys.id, id))
      .limit(1);

    if (!key) {
      return c.json({ error: "Shareable key not found" }, 404);
    }

    // Get all authorized users
    const authorized = await db
      .select({
        id: authorizedUsers.id,
        userAddress: authorizedUsers.userAddress,
        authorizedBy: authorizedUsers.authorizedBy,
        authorizedAt: authorizedUsers.authorizedAt,
        status: authorizedUsers.status,
        revokedAt: authorizedUsers.revokedAt,
        revokedBy: authorizedUsers.revokedBy,
      })
      .from(authorizedUsers)
      .where(eq(authorizedUsers.keyId, id))
      .orderBy(desc(authorizedUsers.authorizedAt));

    return c.json({
      keyId: id,
      totalAuthorized: authorized.length,
      activeCount: authorized.filter(u => u.status === "active").length,
      revokedCount: authorized.filter(u => u.status === "revoked").length,
      authorizedUsers: authorized,
    });
  } catch (error) {
    console.error("Get authorized users error:", error);
    return c.json(
      {
        error: "Failed to fetch authorized users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /shareable-keys/:id/use
 * 使用記録
 */
app.post("/:id/use", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { userAddress, action, ipAddress, userAgent } = body;

    if (!userAddress || !action) {
      return c.json(
        {
          error: "Missing required fields",
          required: ["userAddress", "action"],
        },
        400
      );
    }

    const db = getDatabase();

    // Shareable Key取得
    const [key] = await db
      .select()
      .from(shareableKeys)
      .where(eq(shareableKeys.id, id))
      .limit(1);

    if (!key) {
      return c.json({ error: "Shareable key not found" }, 404);
    }

    // 有効性チェック
    if (key.status !== "active") {
      return c.json({ error: "Shareable key is not active" }, 403);
    }

    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return c.json({ error: "Shareable key has expired" }, 403);
    }

    if (key.maxUses && key.usageCount >= key.maxUses) {
      return c.json({ error: "Shareable key usage limit reached" }, 403);
    }

    // 使用履歴記録
    const [usage] = await db
      .insert(shareableKeyUsage)
      .values({
        keyId: id,
        userAddress: userAddress.toLowerCase(),
        action,
        ipAddress,
        userAgent,
        metadata: body.metadata || null,
      })
      .returning();

    // 使用カウント更新
    const newUsageCount = key.usageCount + 1;

    // 使用回数が上限に達した場合、自動的にステータスを非アクティブにする
    const updateData: any = {
      usageCount: sql`${shareableKeys.usageCount} + 1`,
    };

    if (key.maxUses && newUsageCount >= key.maxUses) {
      updateData.status = 'inactive';
      console.log(`[shareable-keys] Key ${id} reached max uses (${key.maxUses}), setting status to inactive`);
    }

    await db
      .update(shareableKeys)
      .set(updateData)
      .where(eq(shareableKeys.id, id));

    return c.json({
      success: true,
      usage,
      keyDeactivated: key.maxUses && newUsageCount >= key.maxUses,
    });
  } catch (error) {
    console.error("Record usage error:", error);
    return c.json(
      {
        error: "Failed to record usage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
