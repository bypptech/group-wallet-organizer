/**
 * Notification API Routes
 *
 * エンドポイント:
 * - GET /notifications - 通知一覧取得
 * - POST /notifications - 通知作成
 * - GET /notifications/:id - 通知詳細取得
 * - PATCH /notifications/:id/read - 通知を既読にする
 * - DELETE /notifications/:id - 通知削除
 * - GET /notifications/unread-count - 未読通知数取得
 */

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { getDatabase, notifications, type NewNotification } from "../db/client.js";
import { z } from "zod";

const app = new Hono();

// ============================================
// Validation Schemas
// ============================================

const createNotificationSchema = z.object({
  userId: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Ethereum address
  vaultId: z.string().uuid().optional(),
  type: z.string().min(1).max(50), // e.g., "escrow_created", "approval_needed"
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.any()).optional(), // Additional notification data
  metadata: z.record(z.any()).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * GET /notifications
 * 通知一覧取得
 */
app.get("/", async (c) => {
  try {
    const db = getDatabase();

    // Query parameters
    const userId = c.req.query("userId");
    const vaultId = c.req.query("vaultId");
    const read = c.req.query("read");
    const type = c.req.query("type");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    // Build where conditions
    const conditions = [eq(notifications.userId, userId)];

    if (vaultId) {
      conditions.push(eq(notifications.vaultId, vaultId));
    }
    if (read !== undefined) {
      conditions.push(eq(notifications.read, read === "true"));
    }
    if (type) {
      conditions.push(eq(notifications.type, type));
    }

    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({ notifications: result, count: result.length });
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json(
      {
        error: "Failed to fetch notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /notifications
 * 通知作成
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createNotificationSchema.parse(body);

    const db = getDatabase();

    const newNotification: NewNotification = {
      userId: validated.userId,
      vaultId: validated.vaultId,
      type: validated.type,
      title: validated.title,
      message: validated.message,
      read: false,
      data: validated.data,
      metadata: validated.metadata,
    };

    const result = await db
      .insert(notifications)
      .values(newNotification)
      .returning();

    return c.json({ notification: result[0] }, 201);
  } catch (error) {
    console.error("Create notification error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Validation error", details: error.errors },
        400
      );
    }

    return c.json(
      {
        error: "Failed to create notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /notifications/:id
 * 通知詳細取得
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Notification ID is required" }, 400);
    }

    const db = getDatabase();

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }

    return c.json({ notification: result[0] });
  } catch (error) {
    console.error("Get notification error:", error);
    return c.json(
      {
        error: "Failed to fetch notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * PATCH /notifications/:id/read
 * 通知を既読にする
 */
app.patch("/:id/read", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Notification ID is required" }, 400);
    }

    const db = getDatabase();

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }

    // Mark as read
    const result = await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    return c.json({ notification: result[0] });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return c.json(
      {
        error: "Failed to mark notification as read",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * DELETE /notifications/:id
 * 通知削除
 */
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ error: "Notification ID is required" }, 400);
    }

    const db = getDatabase();

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }

    await db.delete(notifications).where(eq(notifications.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return c.json(
      {
        error: "Failed to delete notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /notifications/unread-count
 * 未読通知数取得
 */
app.get("/unread-count", async (c) => {
  try {
    const userId = c.req.query("userId");

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const db = getDatabase();

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return c.json({ count: result.length });
  } catch (error) {
    console.error("Get unread count error:", error);
    return c.json(
      {
        error: "Failed to get unread count",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /notifications/mark-all-read
 * 全通知を既読にする
 */
app.post("/mark-all-read", async (c) => {
  try {
    const body = await c.req.json();
    const userId = body.userId;

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const db = getDatabase();

    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return c.json({ success: true });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return c.json(
      {
        error: "Failed to mark all as read",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
