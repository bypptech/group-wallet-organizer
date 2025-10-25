/**
 * Policy API Routes (In-Memory Storage)
 * データベース接続不要のインメモリーストレージを使用
 */

import { Hono } from "hono";
import { mockPolicies, type MockPolicy } from "../mock/data.js";

const app = new Hono();

// GET /policies - ポリシー一覧取得
app.get("/", (c) => {
  const vaultId = c.req.query("vaultId");
  const status = c.req.query("status");

  let policies = mockPolicies;

  // Filter by vault ID
  if (vaultId) {
    policies = policies.filter((p) => p.vaultId === vaultId);
  }

  // Filter by status
  if (status) {
    policies = policies.filter((p) => p.status === status);
  }

  return c.json({
    policies,
    total: policies.length,
  });
});

// POST /policies - 新しいポリシー作成
app.post("/", async (c) => {
  const body = await c.req.json();
  const {
    vaultId,
    name,
    description,
    minApprovals,
    maxAmount,
    cooldownHours,
    rolesRoot,
  } = body;

  if (!vaultId || !name) {
    return c.json({ error: "VaultId and name are required" }, 400);
  }

  const newPolicy: MockPolicy = {
    id: `POL-${String(mockPolicies.length + 1).padStart(3, "0")}`,
    vaultId,
    name,
    threshold: `${minApprovals || 2}/${minApprovals || 2}`,
    timelock: `${cooldownHours || 24}h`,
    rolesRoot: rolesRoot || "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: "draft",
    description: description || "",
    createdAt: new Date().toISOString().split("T")[0],
    lastUpdated: new Date().toISOString().split("T")[0],
    scheduledUpdate: null,
    usageCount: 0,
    minApprovals: minApprovals || 2,
    maxAmount: maxAmount || "1000",
    cooldownHours: cooldownHours || 24,
  };

  mockPolicies.push(newPolicy);

  return c.json(newPolicy, 201);
});

// GET /policies/:id - ポリシー詳細取得
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const policy = mockPolicies.find((p) => p.id === id);

  if (!policy) {
    return c.json({ error: "Policy not found" }, 404);
  }

  return c.json(policy);
});

// PATCH /policies/:id - ポリシー更新
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const policy = mockPolicies.find((p) => p.id === id);

  if (!policy) {
    return c.json({ error: "Policy not found" }, 404);
  }

  const body = await c.req.json();
  const { name, description, minApprovals, maxAmount, cooldownHours, status } = body;

  // Update policy fields
  if (name !== undefined) policy.name = name;
  if (description !== undefined) policy.description = description;
  if (minApprovals !== undefined) {
    policy.minApprovals = minApprovals;
    policy.threshold = `${minApprovals}/${minApprovals}`;
  }
  if (maxAmount !== undefined) policy.maxAmount = maxAmount;
  if (cooldownHours !== undefined) {
    policy.cooldownHours = cooldownHours;
    policy.timelock = `${cooldownHours}h`;
  }
  if (status !== undefined) policy.status = status;

  policy.lastUpdated = new Date().toISOString().split("T")[0];

  return c.json(policy);
});

// POST /policies/:id/enable - ポリシー有効化
app.post("/:id/enable", (c) => {
  const id = c.req.param("id");
  const policy = mockPolicies.find((p) => p.id === id);

  if (!policy) {
    return c.json({ error: "Policy not found" }, 404);
  }

  policy.status = "active";
  policy.lastUpdated = new Date().toISOString().split("T")[0];

  return c.json({ success: true, policy });
});

// POST /policies/:id/disable - ポリシー無効化
app.post("/:id/disable", (c) => {
  const id = c.req.param("id");
  const policy = mockPolicies.find((p) => p.id === id);

  if (!policy) {
    return c.json({ error: "Policy not found" }, 404);
  }

  policy.status = "draft";
  policy.lastUpdated = new Date().toISOString().split("T")[0];

  return c.json({ success: true, policy });
});

// DELETE /policies/:id - ポリシー削除（アーカイブ）
app.delete("/:id", (c) => {
  const id = c.req.param("id");
  const policyIndex = mockPolicies.findIndex((p) => p.id === id);

  if (policyIndex === -1) {
    return c.json({ error: "Policy not found" }, 404);
  }

  // Archive instead of delete
  mockPolicies[policyIndex].status = "archived";
  mockPolicies[policyIndex].lastUpdated = new Date().toISOString().split("T")[0];

  return c.json({ success: true, message: "Policy archived successfully" });
});

// POST /policies/:id/schedule - ポリシー更新スケジュール
app.post("/:id/schedule", async (c) => {
  const id = c.req.param("id");
  const policy = mockPolicies.find((p) => p.id === id);

  if (!policy) {
    return c.json({ error: "Policy not found" }, 404);
  }

  const body = await c.req.json();
  const { scheduledDate } = body;

  if (!scheduledDate) {
    return c.json({ error: "scheduledDate is required" }, 400);
  }

  policy.scheduledUpdate = scheduledDate;
  policy.lastUpdated = new Date().toISOString().split("T")[0];

  return c.json({ success: true, policy });
});

// POST /policies/:id/emergency-update - 緊急ポリシー更新
app.post("/:id/emergency-update", async (c) => {
  const id = c.req.param("id");
  const policy = mockPolicies.find((p) => p.id === id);

  if (!policy) {
    return c.json({ error: "Policy not found" }, 404);
  }

  const body = await c.req.json();
  const { minApprovals, maxAmount, cooldownHours, reason } = body;

  if (!reason) {
    return c.json({ error: "Emergency reason is required" }, 400);
  }

  // Update policy with emergency changes
  if (minApprovals !== undefined) {
    policy.minApprovals = minApprovals;
    policy.threshold = `${minApprovals}/${minApprovals}`;
  }
  if (maxAmount !== undefined) policy.maxAmount = maxAmount;
  if (cooldownHours !== undefined) {
    policy.cooldownHours = cooldownHours;
    policy.timelock = `${cooldownHours}h`;
  }

  policy.lastUpdated = new Date().toISOString().split("T")[0];
  policy.status = "active";

  return c.json({
    success: true,
    policy,
    message: `Emergency update applied: ${reason}`,
  });
});

export default app;
