/**
 * Notifications API Routes (Mock Mode)
 */

import { Hono } from "hono";
import { mockNotifications } from "../mock/data.js";

const app = new Hono();

// GET /notifications - 通知一覧取得
app.get("/", (c) => {
  const userId = c.req.query("userId");

  let notifications = mockNotifications;
  if (userId) {
    notifications = notifications.filter((n) => n.userId === userId);
  }

  return c.json({
    notifications,
    total: notifications.length,
  });
});

// GET /notifications/unread-count - 未読数取得
app.get("/unread-count", (c) => {
  const userId = c.req.query("userId");

  let notifications = mockNotifications;
  if (userId) {
    notifications = notifications.filter((n) => n.userId === userId);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return c.json({ count: unreadCount });
});

// PATCH /notifications/:id - 通知を既読にする
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const notification = mockNotifications.find((n) => n.id === id);

  if (!notification) {
    return c.json({ error: "Notification not found" }, 404);
  }

  return c.json({
    ...notification,
    read: true,
    readAt: new Date(),
  });
});

// POST /notifications/mark-all-read - 全て既読にする
app.post("/mark-all-read", async (c) => {
  const body = await c.req.json();
  const userId = body.userId;

  return c.json({
    success: true,
    message: "All notifications marked as read",
    userId,
  });
});

// DELETE /notifications/:id - 通知削除
app.delete("/:id", (c) => {
  const id = c.req.param("id");
  const notification = mockNotifications.find((n) => n.id === id);

  if (!notification) {
    return c.json({ error: "Notification not found" }, 404);
  }

  return c.json({ success: true, message: "Notification deleted" });
});

export default app;
