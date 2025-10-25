/**
 * Paymaster Settings API Routes
 *
 * Endpoints for managing paymaster configuration per vault
 * - GET /paymaster/settings/:vaultId - Get paymaster settings
 * - POST /paymaster/settings/:vaultId - Create or update paymaster settings
 * - PATCH /paymaster/settings/:vaultId - Update specific fields
 * - DELETE /paymaster/settings/:vaultId - Delete paymaster settings
 */

import { Hono } from "hono";
import { z } from "zod";
import { getDatabase, paymasterSettings, vaults } from "../db/client.js";
import { eq } from "drizzle-orm";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

const createPaymasterSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  token: z.enum(["USDC", "ETH", "JPYC"]).default("USDC"),
  monthlyLimit: z.string().regex(/^\d+$/).default("0"),
  dailyLimit: z.string().regex(/^\d+$/).default("0"),
  autoRefillEnabled: z.boolean().default(false),
  refillThreshold: z.string().regex(/^\d+$/).default("0"),
  refillAmount: z.string().regex(/^\d+$/).default("0"),
  fallbackEnabled: z.boolean().default(true),
});

const updatePaymasterSettingsSchema = createPaymasterSettingsSchema.partial();

// ============================================
// Routes
// ============================================

/**
 * GET /paymaster/settings/:vaultId
 * Get paymaster settings for a specific vault
 */
app.get("/settings/:vaultId", async (c) => {
  try {
    const db = getDatabase();
    const vaultIdParam = c.req.param("vaultId");

    // Support both UUID and Ethereum address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(vaultIdParam);
    let vaultUuid = vaultIdParam;

    if (isAddress) {
      const vault = await db.select().from(vaults).where(eq(vaults.address, vaultIdParam)).limit(1);
      if (!vault || vault.length === 0) {
        return c.json({ error: "Vault not found" }, 404);
      }
      vaultUuid = vault[0].id;
    }

    const settings = await db
      .select()
      .from(paymasterSettings)
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .limit(1);

    if (!settings || settings.length === 0) {
      // Return default settings if not configured
      return c.json({
        settings: {
          enabled: false,
          token: "USDC",
          balance: "0",
          dailyUsage: "0",
          monthlyLimit: "0",
          dailyLimit: "0",
          autoRefillEnabled: false,
          refillThreshold: "0",
          refillAmount: "0",
          fallbackEnabled: true,
          healthStatus: "healthy",
          lastTopUpAt: null,
          lastResetAt: new Date().toISOString(),
        },
      });
    }

    return c.json({ settings: settings[0] });
  } catch (error) {
    console.error("Get paymaster settings error:", error);
    return c.json(
      {
        error: "Failed to get paymaster settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /paymaster/settings/:vaultId
 * Create or update paymaster settings for a vault
 */
app.post("/settings/:vaultId", async (c) => {
  try {
    const db = getDatabase();
    const vaultIdParam = c.req.param("vaultId");
    const body = await c.req.json();

    const validated = createPaymasterSettingsSchema.parse(body);

    // Support both UUID and Ethereum address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(vaultIdParam);
    let vaultUuid = vaultIdParam;

    if (isAddress) {
      const vault = await db.select().from(vaults).where(eq(vaults.address, vaultIdParam)).limit(1);
      if (!vault || vault.length === 0) {
        return c.json({ error: "Vault not found" }, 404);
      }
      vaultUuid = vault[0].id;
    }

    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(paymasterSettings)
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .limit(1);

    let result;
    const now = new Date();

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      result = await db
        .update(paymasterSettings)
        .set({
          ...validated,
          updatedAt: now,
        })
        .where(eq(paymasterSettings.vaultId, vaultUuid))
        .returning();
    } else {
      // Create new settings
      result = await db
        .insert(paymasterSettings)
        .values({
          vaultId: vaultUuid,
          ...validated,
          balance: "0",
          dailyUsage: "0",
          healthStatus: "healthy",
          lastResetAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    }

    return c.json({
      settings: result[0],
      message: existingSettings && existingSettings.length > 0 ? "Settings updated" : "Settings created",
    });
  } catch (error) {
    console.error("Create/Update paymaster settings error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to save paymaster settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * PATCH /paymaster/settings/:vaultId
 * Update specific fields of paymaster settings
 */
app.patch("/settings/:vaultId", async (c) => {
  try {
    const db = getDatabase();
    const vaultIdParam = c.req.param("vaultId");
    const body = await c.req.json();

    const validated = updatePaymasterSettingsSchema.parse(body);

    // Support both UUID and Ethereum address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(vaultIdParam);
    let vaultUuid = vaultIdParam;

    if (isAddress) {
      const vault = await db.select().from(vaults).where(eq(vaults.address, vaultIdParam)).limit(1);
      if (!vault || vault.length === 0) {
        return c.json({ error: "Vault not found" }, 404);
      }
      vaultUuid = vault[0].id;
    }

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(paymasterSettings)
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .limit(1);

    if (!existingSettings || existingSettings.length === 0) {
      return c.json({ error: "Paymaster settings not found. Please create settings first." }, 404);
    }

    const result = await db
      .update(paymasterSettings)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .returning();

    return c.json({
      settings: result[0],
      message: "Settings updated",
    });
  } catch (error) {
    console.error("Update paymaster settings error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to update paymaster settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * DELETE /paymaster/settings/:vaultId
 * Delete paymaster settings for a vault
 */
app.delete("/settings/:vaultId", async (c) => {
  try {
    const db = getDatabase();
    const vaultIdParam = c.req.param("vaultId");

    // Support both UUID and Ethereum address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(vaultIdParam);
    let vaultUuid = vaultIdParam;

    if (isAddress) {
      const vault = await db.select().from(vaults).where(eq(vaults.address, vaultIdParam)).limit(1);
      if (!vault || vault.length === 0) {
        return c.json({ error: "Vault not found" }, 404);
      }
      vaultUuid = vault[0].id;
    }

    const result = await db
      .delete(paymasterSettings)
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .returning();

    if (!result || result.length === 0) {
      return c.json({ error: "Paymaster settings not found" }, 404);
    }

    return c.json({
      message: "Paymaster settings deleted",
      deleted: result[0],
    });
  } catch (error) {
    console.error("Delete paymaster settings error:", error);
    return c.json(
      {
        error: "Failed to delete paymaster settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /paymaster/settings/:vaultId/top-up
 * Top up paymaster balance (manual refill)
 */
app.post("/settings/:vaultId/top-up", async (c) => {
  try {
    const db = getDatabase();
    const vaultIdParam = c.req.param("vaultId");
    const body = await c.req.json();

    const { amount } = z.object({
      amount: z.string().regex(/^\d+$/),
    }).parse(body);

    // Support both UUID and Ethereum address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(vaultIdParam);
    let vaultUuid = vaultIdParam;

    if (isAddress) {
      const vault = await db.select().from(vaults).where(eq(vaults.address, vaultIdParam)).limit(1);
      if (!vault || vault.length === 0) {
        return c.json({ error: "Vault not found" }, 404);
      }
      vaultUuid = vault[0].id;
    }

    const existingSettings = await db
      .select()
      .from(paymasterSettings)
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .limit(1);

    if (!existingSettings || existingSettings.length === 0) {
      return c.json({ error: "Paymaster settings not found" }, 404);
    }

    const currentBalance = BigInt(existingSettings[0].balance || "0");
    const topUpAmount = BigInt(amount);
    const newBalance = (currentBalance + topUpAmount).toString();

    const result = await db
      .update(paymasterSettings)
      .set({
        balance: newBalance,
        lastTopUpAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymasterSettings.vaultId, vaultUuid))
      .returning();

    return c.json({
      settings: result[0],
      message: "Balance topped up successfully",
      topUpAmount: amount,
      newBalance,
    });
  } catch (error) {
    console.error("Top up paymaster error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to top up paymaster",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
