/**
 * Audit Logs API Routes
 * 監査ログのAPI エンドポイント
 *
 * ## エンドポイント
 * - GET  /api/audit-logs - 監査ログ検索
 * - GET  /api/audit-logs/stats - 監査ログ統計
 * - GET  /api/audit-logs/by-actor/:actor - アクター別ログ取得
 * - GET  /api/audit-logs/by-vault/:vaultId - Vault別ログ取得
 * - GET  /api/audit-logs/by-userop/:hash - UserOpハッシュで検索
 * - GET  /api/audit-logs/by-tx/:hash - トランザクションハッシュで検索
 * - POST /api/audit-logs - 監査ログ記録（内部API）
 * - POST /api/audit-logs/batch - 一括監査ログ記録（内部API）
 */

import { Hono } from "hono";
import { z } from "zod";
import { AuditService } from "../services/audit-service";

const app = new Hono();

/**
 * バリデーションスキーマ
 */
const searchSchema = z.object({
  vaultId: z.string().optional(),
  actor: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const statsSchema = z.object({
  vaultId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const logEntrySchema = z.object({
  vaultId: z.string().optional(),
  actor: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  txHash: z.string().optional(),
  userOpHash: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const batchLogSchema = z.object({
  entries: z.array(logEntrySchema),
});

/**
 * GET /api/audit-logs
 * 監査ログ検索
 */
app.get("/", async (c) => {
  try {
    const query = c.req.query();
    const validated = searchSchema.parse(query);

    const filter = {
      vaultId: validated.vaultId,
      actor: validated.actor,
      action: validated.action,
      resource: validated.resource,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      limit: validated.limit ? parseInt(validated.limit) : 100,
      offset: validated.offset ? parseInt(validated.offset) : 0,
    };

    const logs = await AuditService.search(filter);

    return c.json({
      success: true,
      data: logs,
      count: logs.length,
      filter,
    });
  } catch (error) {
    console.error("Audit logs search error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search audit logs",
      },
      500
    );
  }
});

/**
 * GET /api/audit-logs/stats
 * 監査ログ統計
 */
app.get("/stats", async (c) => {
  try {
    const query = c.req.query();
    const validated = statsSchema.parse(query);

    const filter = {
      vaultId: validated.vaultId,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    };

    const stats = await AuditService.getStats(filter);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Audit stats error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get audit stats",
      },
      500
    );
  }
});

/**
 * GET /api/audit-logs/by-actor/:actor
 * アクター別監査ログ取得
 */
app.get("/by-actor/:actor", async (c) => {
  try {
    const actor = c.req.param("actor");
    const limit = c.req.query("limit");

    const logs = await AuditService.getByActor(
      actor,
      limit ? parseInt(limit) : undefined
    );

    return c.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get by actor error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get logs by actor",
      },
      500
    );
  }
});

/**
 * GET /api/audit-logs/by-vault/:vaultId
 * Vault別監査ログ取得
 */
app.get("/by-vault/:vaultId", async (c) => {
  try {
    const vaultId = c.req.param("vaultId");
    const limit = c.req.query("limit");

    const logs = await AuditService.getByVault(
      vaultId,
      limit ? parseInt(limit) : undefined
    );

    return c.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get by vault error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get logs by vault",
      },
      500
    );
  }
});

/**
 * GET /api/audit-logs/by-userop/:hash
 * UserOperationハッシュで監査ログ検索
 */
app.get("/by-userop/:hash", async (c) => {
  try {
    const hash = c.req.param("hash");
    const logs = await AuditService.getByUserOpHash(hash);

    return c.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get by UserOp hash error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get logs by UserOp hash",
      },
      500
    );
  }
});

/**
 * GET /api/audit-logs/by-tx/:hash
 * トランザクションハッシュで監査ログ検索
 */
app.get("/by-tx/:hash", async (c) => {
  try {
    const hash = c.req.param("hash");
    const logs = await AuditService.getByTxHash(hash);

    return c.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Get by tx hash error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get logs by tx hash",
      },
      500
    );
  }
});

/**
 * POST /api/audit-logs
 * 監査ログ記録（内部API）
 */
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = logEntrySchema.parse(body);

    await AuditService.log(validated);

    return c.json({
      success: true,
      message: "Audit log recorded",
    });
  } catch (error) {
    console.error("Audit log recording error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record audit log",
      },
      500
    );
  }
});

/**
 * POST /api/audit-logs/batch
 * 一括監査ログ記録（内部API）
 */
app.post("/batch", async (c) => {
  try {
    const body = await c.req.json();
    const validated = batchLogSchema.parse(body);

    await AuditService.logBatch(validated.entries);

    return c.json({
      success: true,
      message: `${validated.entries.length} audit logs recorded`,
      count: validated.entries.length,
    });
  } catch (error) {
    console.error("Batch audit log error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record batch audit logs",
      },
      500
    );
  }
});

/**
 * POST /api/audit-logs/cleanup
 * 古い監査ログの削除（管理者API）
 */
app.post("/cleanup", async (c) => {
  try {
    const body = await c.req.json();
    const retentionDays = body.retentionDays || 90;

    const deletedCount = await AuditService.cleanup(retentionDays);

    return c.json({
      success: true,
      message: `Deleted ${deletedCount} old audit logs`,
      deletedCount,
    });
  } catch (error) {
    console.error("Audit cleanup error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cleanup audit logs",
      },
      500
    );
  }
});

export default app;
