/**
 * Audit Service
 * 監査ログの永続化・検索機能を提供
 *
 * ## 機能
 * - UserOperationハッシュ記録
 * - トランザクションハッシュ記録
 * - 日付範囲・アクション種別による検索
 * - アクター別ログ取得
 */

import { getDatabase } from "../db/client.js";
import { auditLogs } from "../db/schema.js";
import { eq, and, gte, lte, desc, sql, SQL } from "drizzle-orm";

/**
 * 監査ログエントリ
 */
export interface AuditLogEntry {
  vaultId?: string;
  actor: string; // Ethereum address
  action: string; // 'createEscrow', 'approveRelease', 'release', 'updatePolicy', etc.
  resource: string; // 'escrow', 'policy', 'vault', 'member'
  resourceId?: string;
  txHash?: string;
  userOpHash?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * 検索フィルタ
 */
export interface AuditLogFilter {
  vaultId?: string;
  actor?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 監査ログ統計
 */
export interface AuditLogStats {
  totalLogs: number;
  actionCounts: Record<string, number>;
  resourceCounts: Record<string, number>;
  topActors: Array<{ actor: string; count: number }>;
}

/**
 * AuditService
 * 監査ログの永続化と検索機能
 */
export class AuditService {
  /**
   * 監査ログを記録
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const db = getDatabase();
      await db.insert(auditLogs).values({
        vaultId: entry.vaultId,
        actor: entry.actor,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        txHash: entry.txHash,
        userOpHash: entry.userOpHash,
        data: entry.data,
        metadata: entry.metadata,
      });
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      throw new Error("Audit log failed");
    }
  }

  /**
   * 複数の監査ログを一括記録
   */
  static async logBatch(entries: AuditLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    try {
      const db = getDatabase();
      await db.insert(auditLogs).values(
        entries.map((entry) => ({
          vaultId: entry.vaultId,
          actor: entry.actor,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          txHash: entry.txHash,
          userOpHash: entry.userOpHash,
          data: entry.data,
          metadata: entry.metadata,
        }))
      );
    } catch (error) {
      console.error("Failed to log audit entries:", error);
      throw new Error("Batch audit log failed");
    }
  }

  /**
   * 監査ログを検索
   */
  static async search(filter: AuditLogFilter) {
    const conditions: SQL[] = [];

    if (filter.vaultId) {
      conditions.push(eq(auditLogs.vaultId, filter.vaultId));
    }

    if (filter.actor) {
      conditions.push(eq(auditLogs.actor, filter.actor));
    }

    if (filter.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }

    if (filter.resource) {
      conditions.push(eq(auditLogs.resource, filter.resource));
    }

    if (filter.startDate) {
      conditions.push(gte(auditLogs.timestamp, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(auditLogs.timestamp, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const db = getDatabase();
    const query = db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(filter.limit || 100)
      .offset(filter.offset || 0);

    return await query;
  }

  /**
   * アクター別の監査ログを取得
   */
  static async getByActor(actor: string, limit = 50) {
    const db = getDatabase();
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actor, actor))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  /**
   * Vault別の監査ログを取得
   */
  static async getByVault(vaultId: string, limit = 100) {
    const db = getDatabase();
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.vaultId, vaultId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  /**
   * UserOperationハッシュで監査ログを取得
   */
  static async getByUserOpHash(userOpHash: string) {
    const db = getDatabase();
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userOpHash, userOpHash))
      .orderBy(desc(auditLogs.timestamp));
  }

  /**
   * トランザクションハッシュで監査ログを取得
   */
  static async getByTxHash(txHash: string) {
    const db = getDatabase();
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.txHash, txHash))
      .orderBy(desc(auditLogs.timestamp));
  }

  /**
   * 監査ログ統計を取得
   */
  static async getStats(filter?: {
    vaultId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogStats> {
    const conditions: SQL[] = [];

    if (filter?.vaultId) {
      conditions.push(eq(auditLogs.vaultId, filter.vaultId));
    }

    if (filter?.startDate) {
      conditions.push(gte(auditLogs.timestamp, filter.startDate));
    }

    if (filter?.endDate) {
      conditions.push(lte(auditLogs.timestamp, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 総ログ数
    const db = getDatabase();
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);
    const totalLogs = totalResult[0]?.count || 0;

    // アクション別集計
    const actionResults = await getDatabase()
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.action);

    const actionCounts = actionResults.reduce(
      (acc, row) => {
        acc[row.action] = row.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // リソース別集計
    const resourceResults = await getDatabase()
      .select({
        resource: auditLogs.resource,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.resource);

    const resourceCounts = resourceResults.reduce(
      (acc, row) => {
        acc[row.resource] = row.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // トップアクター
    const topActorResults = await getDatabase()
      .select({
        actor: auditLogs.actor,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.actor)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topActors = topActorResults.map((row) => ({
      actor: row.actor,
      count: row.count,
    }));

    return {
      totalLogs,
      actionCounts,
      resourceCounts,
      topActors,
    };
  }

  /**
   * 古い監査ログを削除（データ保持期間管理）
   */
  static async cleanup(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await getDatabase()
      .delete(auditLogs)
      .where(lte(auditLogs.timestamp, cutoffDate));

    return result.rowCount || 0;
  }

  /**
   * エスクロー操作の監査ログを記録（ヘルパー）
   */
  static async logEscrowAction(params: {
    vaultId?: string;
    actor: string;
    action: "create" | "approve" | "release" | "cancel" | "revoke";
    escrowId: string;
    txHash?: string;
    userOpHash?: string;
    data?: Record<string, unknown>;
  }) {
    await this.log({
      vaultId: params.vaultId,
      actor: params.actor,
      action: `escrow_${params.action}`,
      resource: "escrow",
      resourceId: params.escrowId,
      txHash: params.txHash,
      userOpHash: params.userOpHash,
      data: params.data,
    });
  }

  /**
   * ポリシー操作の監査ログを記録（ヘルパー）
   */
  static async logPolicyAction(params: {
    vaultId?: string;
    actor: string;
    action: "create" | "update" | "activate" | "deactivate";
    policyId: string;
    txHash?: string;
    userOpHash?: string;
    changes?: Record<string, unknown>;
  }) {
    await this.log({
      vaultId: params.vaultId,
      actor: params.actor,
      action: `policy_${params.action}`,
      resource: "policy",
      resourceId: params.policyId,
      txHash: params.txHash,
      userOpHash: params.userOpHash,
      data: { changes: params.changes },
    });
  }

  /**
   * メンバー操作の監査ログを記録（ヘルパー）
   */
  static async logMemberAction(params: {
    vaultId?: string;
    actor: string;
    action: "add" | "remove" | "role_change";
    memberAddress: string;
    data?: Record<string, unknown>;
  }) {
    await this.log({
      vaultId: params.vaultId,
      actor: params.actor,
      action: `member_${params.action}`,
      resource: "member",
      resourceId: params.memberAddress,
      data: params.data,
    });
  }
}
