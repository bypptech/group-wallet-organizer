/**
 * Paymaster API Routes (Mock Mode)
 */

import { Hono } from "hono";
import { mockPaymasterInfo } from "../mock/data.js";

const app = new Hono();

// GET /paymaster/balance - Paymaster残高取得
app.get("/balance", (c) => {
  const vaultId = c.req.query("vaultId");

  if (!vaultId) {
    return c.json({ error: "vaultId is required" }, 400);
  }

  return c.json(mockPaymasterInfo);
});

export default app;
