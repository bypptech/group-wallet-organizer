/**
 * Vault API Routes
 *
 * エンドポイント:
 * - GET /vaults - Vault一覧取得
 * - POST /vaults - Vault作成
 * - GET /vaults/:id - Vault詳細取得
 * - PATCH /vaults/:id - Vault更新
 * - GET /vaults/:id/members - メンバー一覧取得
 * - POST /vaults/:id/members - メンバー追加
 * - DELETE /vaults/:id/members/:address - メンバー削除
 */

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDatabase, vaults, members, type NewVault, type NewMember } from "../db/client.js";
import { shareableKeys, authorizedUsers, invites } from "../db/schema.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

const createVaultSchema = z.object({
  vaultId: z.string().regex(/^0x[a-fA-F0-9]{64}$/), // bytes32 hex (legacy, converted to uuid)
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Vault contract address
  chainId: z.number().int().positive(),
  policyId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  salt: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  factoryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateVaultSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  policyId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  metadata: z.record(z.any()).optional(),
});

const addMemberSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  role: z.enum(["owner", "guardian", "requester", "viewer"]),
  weight: z.number().int().min(1).optional(),
  addedBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * GET /vaults
 * Vault一覧取得（members情報を含む）
 */
app.get("/", async (c) => {
  try {
    const db = getDatabase();

    // Query parameters
    const address = c.req.query("address"); // Filter by member address
    const demo = c.req.query("demo"); // Filter for demo vaults

    let query = db.select().from(vaults);

    // Filter for demo vaults if requested
    if (demo === "true") {
      const demoVaults = await db
        .select()
        .from(vaults)
        .where(eq(vaults.isDemo, true));

      // Fetch members and pending invites for demo vaults
      const vaultsWithMembersAndInvites = await Promise.all(
        demoVaults.map(async (vault) => {
          const vaultMembers = await db
            .select()
            .from(members)
            .where(eq(members.vaultId, vault.id));

          // Get all invites for the vault
          const allInvites = await db
            .select()
            .from(invites)
            .where(eq(invites.vaultId, vault.id));

          // Filter for pending invites (not used and not expired)
          const now = new Date();
          const pendingInvites = allInvites.filter(invite => {
            const isNotUsed = !invite.usedAt;
            const isNotExpired = !invite.expiresAt || invite.expiresAt > now;
            return isNotUsed && isNotExpired;
          });

          return {
            ...vault,
            members: vaultMembers,
            pendingInvitesCount: pendingInvites.length,
          };
        })
      );

      return c.json({ vaults: vaultsWithMembersAndInvites });
    }

    // Filter by member address if provided
    if (address) {
      const vaultIds = await db
        .select({ vaultId: members.vaultId })
        .from(members)
        .where(eq(members.address, address));

      const ids = vaultIds.map((v) => v.vaultId);

      if (ids.length === 0) {
        return c.json({ vaults: [] });
      }

      // Note: In production, use a proper IN query
      // For simplicity, fetching all and filtering
      const allVaults = await query;
      const filteredVaults = allVaults.filter((v) => ids.includes(v.id));

      // Fetch members and pending invites count for each vault
      const vaultsWithMembersAndInvites = await Promise.all(
        filteredVaults.map(async (vault) => {
          const vaultMembers = await db
            .select()
            .from(members)
            .where(eq(members.vaultId, vault.id));

          // Count pending invites (not used, not expired)
          const pendingInvites = await db
            .select()
            .from(invites)
            .where(eq(invites.vaultId, vault.id));

          const now = new Date();
          const activePendingInvites = pendingInvites.filter(invite => {
            const isNotUsed = !invite.usedAt;
            const isNotExpired = !invite.expiresAt || invite.expiresAt > now;
            return isNotUsed && isNotExpired;
          });

          return {
            ...vault,
            members: vaultMembers,
            pendingInvitesCount: activePendingInvites.length,
          };
        })
      );

      return c.json({ vaults: vaultsWithMembersAndInvites });
    }

    const result = await query;

    // Fetch members and pending invites count for each vault
    const vaultsWithMembersAndInvites = await Promise.all(
      result.map(async (vault) => {
        const vaultMembers = await db
          .select()
          .from(members)
          .where(eq(members.vaultId, vault.id));

        // Count pending invites (not used, not expired)
        const pendingInvites = await db
          .select()
          .from(invites)
          .where(eq(invites.vaultId, vault.id));

        const now = new Date();
        const activePendingInvites = pendingInvites.filter(invite => {
          const isNotUsed = !invite.usedAt;
          const isNotExpired = !invite.expiresAt || invite.expiresAt > now;
          return isNotUsed && isNotExpired;
        });

        return {
          ...vault,
          members: vaultMembers,
          pendingInvitesCount: activePendingInvites.length,
        };
      })
    );

    return c.json({ vaults: vaultsWithMembersAndInvites });
  } catch (error) {
    console.error("Get vaults error:", error);
    return c.json(
      { error: "Failed to fetch vaults", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * POST /vaults
 * Vault作成
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    console.log('[API] Creating vault with data:', body);
    const validatedData = createVaultSchema.parse(body);

    const db = getDatabase();

    // Generate UUID for the vault (using CREATE2-compatible UUID if not provided)
    const vaultUuid = uuidv4();
    const caip10 = `eip155:${validatedData.chainId}:${validatedData.address}`;

    const newVault: NewVault = {
      address: validatedData.address,
      chainId: validatedData.chainId,
      caip10,
      uuid: vaultUuid,
      name: validatedData.name,
      description: validatedData.description,
      salt: validatedData.salt,
      factoryAddress: validatedData.factoryAddress,
      policyId: validatedData.policyId,
      metadata: validatedData.metadata,
    };

    console.log('[API] Inserting vault:', newVault);
    const [vault] = await db.insert(vaults).values(newVault).returning();

    console.log('[API] Vault created successfully:', { id: vault.id, address: vault.address, name: vault.name });

    // Add creator as owner member
    if (validatedData.metadata?.creatorAddress) {
      const creatorMember = {
        vaultId: vault.id,
        address: validatedData.metadata.creatorAddress,
        role: 'owner',
        weight: validatedData.metadata.requiredWeight || 1,
        addedBy: validatedData.metadata.creatorAddress,
      };

      await db.insert(members).values(creatorMember);
      console.log('[API] Added creator as owner member:', creatorMember.address);
    }

    return c.json({ vault }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[API] Validation error:', error.errors);
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Create vault error:", error);
    return c.json(
      { error: "Failed to create vault", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * GET /vaults/:id/stats
 * Vault統計情報取得
 *
 * IMPORTANT: This must be defined BEFORE /:id route to avoid being caught by it
 */
app.get("/:id/stats", async (c) => {
  try {
    const vaultIdOrAddress = c.req.param("id");
    const db = getDatabase();

    console.log(`[API] Fetching stats for vault: ${vaultIdOrAddress}`);

    // Find vault by UUID or address
    let vault;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vaultIdOrAddress);

    if (isUUID) {
      console.log(`[API] Searching by UUID: ${vaultIdOrAddress}`);
      const result = await db.select().from(vaults).where(eq(vaults.id, vaultIdOrAddress));
      vault = result[0];
    } else {
      console.log(`[API] Searching by address: ${vaultIdOrAddress}`);
      const result = await db.select().from(vaults).where(eq(vaults.address, vaultIdOrAddress));
      vault = result[0];
    }

    if (!vault) {
      console.log(`[API] Vault not found: ${vaultIdOrAddress}`);
      return c.json({ error: "Vault not found" }, 404);
    }

    // Get total members count
    const membersResult = await db
      .select()
      .from(members)
      .where(eq(members.vaultId, vault.id));

    const totalMembers = membersResult.length;

    // Get required weight from metadata
    const metadata = vault.metadata as Record<string, any> || {};
    const requiredApprovals = metadata.requiredWeight || 0;

    // TODO: Get totalEscrows and pendingApprovals from escrows table when implemented
    const stats = {
      totalMembers,
      totalEscrows: 0,
      pendingApprovals: 0,
      requiredApprovals,
      totalBalance: "0.00 USD", // TODO: Implement balance calculation
    };

    console.log(`[API] Stats for vault ${vault.id}:`, stats);

    return c.json(stats);
  } catch (error) {
    console.error("Get vault stats error:", error);
    return c.json(
      { error: "Failed to fetch vault stats", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * GET /vaults/:id
 * Vault詳細取得
 *
 * :id can be:
 * - UUID (vaults.id or vaults.uuid)
 * - Ethereum address (vaults.address)
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    console.log('[API] Fetching vault with id:', id);

    // Try to determine if id is an address (0x...) or UUID
    let vault;
    if (id.startsWith('0x') && id.length === 42) {
      // Ethereum address format
      console.log('[API] Searching by address:', id);
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.address, id))
        .limit(1);
    } else {
      // UUID format - try both id and uuid fields
      console.log('[API] Searching by UUID:', id);
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.id, id))
        .limit(1);

      // If not found by id, try uuid field
      if (!vault) {
        console.log('[API] Not found by id, trying uuid field');
        [vault] = await db
          .select()
          .from(vaults)
          .where(eq(vaults.uuid, id))
          .limit(1);
      }
    }

    if (!vault) {
      console.log('[API] Vault not found for id:', id);
      return c.json({ error: "Vault not found" }, 404);
    }

    console.log('[API] Vault found:', { id: vault.id, address: vault.address, name: vault.name });

    // Get members
    const vaultMembers = await db
      .select()
      .from(members)
      .where(eq(members.vaultId, vault.id));

    console.log('[API] Found', vaultMembers.length, 'members');

    // Count pending invites (not used, not expired)
    const pendingInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.vaultId, vault.id));

    const now = new Date();
    const activePendingInvites = pendingInvites.filter(invite => {
      const isNotUsed = !invite.usedAt;
      const isNotExpired = !invite.expiresAt || invite.expiresAt > now;
      return isNotUsed && isNotExpired;
    });

    console.log('[API] Found', activePendingInvites.length, 'active pending invites');

    return c.json({
      vault: {
        ...vault,
        pendingInvitesCount: activePendingInvites.length,
      },
      members: vaultMembers,
    });
  } catch (error) {
    console.error("Get vault error:", error);
    return c.json(
      { error: "Failed to fetch vault", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * PATCH /vaults/:id
 * Vault更新
 */
app.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    console.log('[API] PATCH /vaults/:id - id:', id, 'body:', body);
    const validatedData = updateVaultSchema.parse(body);
    console.log('[API] Validated data:', validatedData);

    const db = getDatabase();

    // Determine if id is an address or UUID
    let vault;
    if (id.startsWith('0x') && id.length === 42) {
      [vault] = await db
        .update(vaults)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(vaults.address, id))
        .returning();
    } else {
      // Try by id first
      [vault] = await db
        .update(vaults)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(vaults.id, id))
        .returning();

      // If not found, try by uuid
      if (!vault) {
        [vault] = await db
          .update(vaults)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(vaults.uuid, id))
          .returning();
      }
    }

    if (!vault) {
      return c.json({ error: "Vault not found" }, 404);
    }

    // Fetch members for the updated vault
    const membersResult = await db
      .select()
      .from(members)
      .where(eq(members.vaultId, vault.id));

    console.log('[API] Vault updated successfully:', vault.id);
    console.log('[API] Found', membersResult.length, 'members');

    return c.json({
      vault,
      members: membersResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Update vault error:", error);
    return c.json(
      { error: "Failed to update vault", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * GET /vaults/:id/members
 * メンバー一覧取得
 */
app.get("/:id/members", async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDatabase();

    // Verify vault exists
    let vault;
    if (id.startsWith('0x') && id.length === 42) {
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.address, id))
        .limit(1);
    } else {
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.id, id))
        .limit(1);

      if (!vault) {
        [vault] = await db
          .select()
          .from(vaults)
          .where(eq(vaults.uuid, id))
          .limit(1);
      }
    }

    if (!vault) {
      return c.json({ error: "Vault not found" }, 404);
    }

    // Get members
    const vaultMembers = await db
      .select()
      .from(members)
      .where(eq(members.vaultId, vault.id));

    return c.json({ members: vaultMembers });
  } catch (error) {
    console.error("Get members error:", error);
    return c.json(
      { error: "Failed to fetch members", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * POST /vaults/:id/members
 * メンバー追加
 */
app.post("/:id/members", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validatedData = addMemberSchema.parse(body);

    const db = getDatabase();

    // Verify vault exists
    let vault;
    if (id.startsWith('0x') && id.length === 42) {
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.address, id))
        .limit(1);
    } else {
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.id, id))
        .limit(1);

      if (!vault) {
        [vault] = await db
          .select()
          .from(vaults)
          .where(eq(vaults.uuid, id))
          .limit(1);
      }
    }

    if (!vault) {
      return c.json({ error: "Vault not found" }, 404);
    }

    // Check if member already exists
    const [existingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.vaultId, vault.id),
          eq(members.address, validatedData.address)
        )
      )
      .limit(1);

    if (existingMember) {
      return c.json({ error: "Member already exists" }, 409);
    }

    // Add member
    const newMember: NewMember = {
      vaultId: vault.id,
      address: validatedData.address,
      role: validatedData.role,
      weight: validatedData.weight,
      addedBy: validatedData.addedBy,
      metadata: validatedData.metadata,
    };

    const [member] = await db.insert(members).values(newMember).returning();

    // Auto-authorize new member for all active Shareable Keys of this vault
    try {
      const activeKeys = await db
        .select()
        .from(shareableKeys)
        .where(
          and(
            eq(shareableKeys.vaultId, vault.id),
            eq(shareableKeys.status, "active"),
            eq(shareableKeys.keyType, "vault")
          )
        );

      if (activeKeys.length > 0) {
        console.log(`[Vaults] Auto-authorizing new member ${member.address} for ${activeKeys.length} Shareable Keys`);

        const authorizations = activeKeys.map((key) => ({
          keyId: key.id,
          userAddress: member.address.toLowerCase(),
          vaultId: vault.id,
          authorizedBy: "system", // System-generated authorization
          status: "active" as const,
        }));

        await db.insert(authorizedUsers).values(authorizations);
        console.log(`[Vaults] Successfully authorized member for ${authorizations.length} keys`);
      }
    } catch (authError) {
      console.error("[Vaults] Error auto-authorizing new member:", authError);
      // Continue even if authorization fails - member is still added
    }

    return c.json({ member }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }

    console.error("Add member error:", error);
    return c.json(
      { error: "Failed to add member", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

/**
 * DELETE /vaults/:id/members/:address
 * メンバー削除
 */
app.delete("/:id/members/:address", async (c) => {
  try {
    const id = c.req.param("id");
    const address = c.req.param("address");

    const db = getDatabase();

    // Verify vault exists
    let vault;
    if (id.startsWith('0x') && id.length === 42) {
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.address, id))
        .limit(1);
    } else {
      [vault] = await db
        .select()
        .from(vaults)
        .where(eq(vaults.id, id))
        .limit(1);

      if (!vault) {
        [vault] = await db
          .select()
          .from(vaults)
          .where(eq(vaults.uuid, id))
          .limit(1);
      }
    }

    if (!vault) {
      return c.json({ error: "Vault not found" }, 404);
    }

    // Delete member
    const [deletedMember] = await db
      .delete(members)
      .where(
        and(
          eq(members.vaultId, vault.id),
          eq(members.address, address)
        )
      )
      .returning();

    if (!deletedMember) {
      return c.json({ error: "Member not found" }, 404);
    }

    // Auto-revoke authorization for all Shareable Keys of this vault
    try {
      const revokeResult = await db
        .update(authorizedUsers)
        .set({
          status: "revoked",
          revokedAt: new Date(),
          revokedBy: "system", // System-generated revocation
        })
        .where(
          and(
            eq(authorizedUsers.vaultId, vault.id),
            eq(authorizedUsers.userAddress, address.toLowerCase())
          )
        )
        .returning();

      console.log(`[Vaults] Revoked ${revokeResult.length} Shareable Key authorizations for removed member ${address}`);
    } catch (revokeError) {
      console.error("[Vaults] Error revoking authorizations:", revokeError);
      // Continue even if revocation fails - member is still deleted
    }

    return c.json({ success: true, member: deletedMember });
  } catch (error) {
    console.error("Delete member error:", error);
    return c.json(
      { error: "Failed to delete member", details: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

export default app;
