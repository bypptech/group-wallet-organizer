/**
 * Vault API Routes (In-Memory Storage)
 * データベース接続不要のインメモリーストレージを使用
 */

import { Hono } from "hono";
import { mockVaults, mockMembers, mockPaymasterInfo } from "../mock/data.js";

const app = new Hono();

// GET /vaults - Vault一覧取得
app.get("/", (c) => {
  const userAddress = c.req.query("userAddress");

  // Filter vaults by user address if provided
  let vaults = mockVaults;
  if (userAddress) {
    vaults = mockVaults.filter((vault) => {
      // Check if user is a member of this vault
      const isMember = mockMembers.some(
        (m) => m.vaultId === vault.id && m.address?.toLowerCase() === userAddress.toLowerCase()
      );
      return isMember;
    });
  }

  return c.json({
    vaults,
    total: vaults.length,
  });
});

// POST /vaults - 新しいVault作成
app.post("/", async (c) => {
  const body = await c.req.json();
  const { name, description, vaultAddress, creatorAddress, requiredWeight = 3 } = body;

  if (!name || !vaultAddress) {
    return c.json({ error: "Name and vaultAddress are required" }, 400);
  }

  const newVault = {
    id: crypto.randomUUID(),
    vaultAddress,
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to mock vaults
  mockVaults.push(newVault);

  // Add creator as owner
  if (creatorAddress) {
    const newMember = {
      id: crypto.randomUUID(),
      vaultId: newVault.id,
      address: creatorAddress,
      role: "owner",
      weight: 3,
      joinedAt: new Date().toISOString(),
      addedBy: creatorAddress,
    };
    mockMembers.push(newMember);
  }

  return c.json(newVault, 201);
});

// GET /vaults/:id - Vault詳細取得
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const vault = mockVaults.find((v) => v.id === id || v.vaultId === id);

  if (!vault) {
    return c.json({ error: "Vault not found" }, 404);
  }

  return c.json(vault);
});

// GET /vaults/:id/members - メンバー一覧取得
app.get("/:id/members", (c) => {
  const id = c.req.param("id");
  const vault = mockVaults.find((v) => v.id === id || v.vaultId === id);

  if (!vault) {
    return c.json({ error: "Vault not found" }, 404);
  }

  const vaultMembers = mockMembers.filter((m) => m.vaultId === vault.id);

  return c.json({
    members: vaultMembers,
    total: vaultMembers.length,
  });
});

// PATCH /vaults/:id - Vault更新
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const vaultIndex = mockVaults.findIndex((v) => v.id === id || v.vaultId === id);

  if (vaultIndex === -1) {
    return c.json({ error: "Vault not found" }, 404);
  }

  const body = await c.req.json();
  const vault = mockVaults[vaultIndex];

  // Update vault in mock array
  const updatedVault = {
    ...vault,
    ...body,
    updatedAt: new Date().toISOString(),
  };
  mockVaults[vaultIndex] = updatedVault;

  return c.json(updatedVault);
});

// POST /vaults/:id/members - メンバー追加
app.post("/:id/members", async (c) => {
  const id = c.req.param("id");
  const vault = mockVaults.find((v) => v.id === id || v.vaultId === id);

  if (!vault) {
    return c.json({ error: "Vault not found" }, 404);
  }

  const body = await c.req.json();

  return c.json({
    id: crypto.randomUUID(),
    vaultId: vault.id,
    ...body,
    addedAt: new Date(),
  });
});

// PATCH /vaults/:id/members/:memberId - メンバー更新
app.patch("/:id/members/:memberId", async (c) => {
  const id = c.req.param("id");
  const memberId = c.req.param("memberId");

  const vault = mockVaults.find((v) => v.id === id || v.vaultId === id);
  if (!vault) {
    return c.json({ error: "Vault not found" }, 404);
  }

  const member = mockMembers.find((m) => m.id === memberId && m.vaultId === vault.id);
  if (!member) {
    return c.json({ error: "Member not found" }, 404);
  }

  const body = await c.req.json();

  return c.json({
    ...member,
    ...body,
  });
});

// DELETE /vaults/:id/members/:memberId - メンバー削除
app.delete("/:id/members/:memberId", (c) => {
  const id = c.req.param("id");
  const memberId = c.req.param("memberId");

  const vault = mockVaults.find((v) => v.id === id || v.vaultId === id);
  if (!vault) {
    return c.json({ error: "Vault not found" }, 404);
  }

  const member = mockMembers.find((m) => m.id === memberId && m.vaultId === vault.id);
  if (!member) {
    return c.json({ error: "Member not found" }, 404);
  }

  return c.json({ success: true, message: "Member removed" });
});

export default app;
