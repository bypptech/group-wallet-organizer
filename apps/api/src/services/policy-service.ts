/**
 * Policy Service
 *
 * ポリシー操作の履歴管理とビジネスロジック
 */

import { getDatabase, policies, auditLogs, type NewPolicy, type NewAuditLog } from "../db/client.js";
import { eq, and, desc } from "drizzle-orm";
import { AuditService } from "./audit-service.js";

/**
 * ポリシー更新履歴
 */
export interface PolicyUpdateHistory {
  policyId: string;
  action: string;
  actor: string;
  changes: Record<string, any>;
  timestamp: Date;
  txHash?: string;
}

/**
 * PolicyService クラス
 */
export class PolicyService {
  /**
   * ポリシー作成（監査ログ付き）
   */
  async createPolicy(
    policyData: Omit<NewPolicy, "id" | "createdAt" | "updatedAt">,
    actor: string,
    txHash?: string
  ) {
    const db = getDatabase();

    // ポリシー作成
    const newPolicy: NewPolicy = {
      ...policyData,
      active: policyData.active ?? true,
    };

    const result = await db.insert(policies).values(newPolicy).returning();
    const policy = result[0];

    // 監査ログ記録
    await this.createAuditLog({
      vaultId: policy.vaultId,
      actor,
      action: "policy_created",
      resource: "policy",
      resourceId: policy.policyId,
      txHash,
      data: {
        threshold: policy.threshold,
        timelock: policy.timelock,
        rolesRoot: policy.rolesRoot,
        ownersRoot: policy.ownersRoot,
      },
    });

    return policy;
  }

  /**
   * ポリシー更新（監査ログ付き）
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<Omit<NewPolicy, "id" | "policyId" | "vaultId" | "createdAt">>,
    actor: string,
    txHash?: string
  ) {
    const db = getDatabase();

    // 既存ポリシー取得
    const existing = await db
      .select()
      .from(policies)
      .where(eq(policies.policyId, policyId))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Policy not found");
    }

    const oldPolicy = existing[0];

    // 更新
    const result = await db
      .update(policies)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(policies.policyId, policyId))
      .returning();

    const updatedPolicy = result[0];

    // 変更内容を記録
    const changes: Record<string, any> = {};
    if (updates.threshold !== undefined) {
      changes.threshold = { from: oldPolicy.threshold, to: updates.threshold };
    }
    if (updates.timelock !== undefined) {
      changes.timelock = { from: oldPolicy.timelock, to: updates.timelock };
    }
    if (updates.rolesRoot !== undefined) {
      changes.rolesRoot = { from: oldPolicy.rolesRoot, to: updates.rolesRoot };
    }
    if (updates.ownersRoot !== undefined) {
      changes.ownersRoot = { from: oldPolicy.ownersRoot, to: updates.ownersRoot };
    }
    if (updates.maxAmount !== undefined) {
      changes.maxAmount = { from: oldPolicy.maxAmount, to: updates.maxAmount };
    }
    if (updates.active !== undefined) {
      changes.active = { from: oldPolicy.active, to: updates.active };
    }

    // 監査ログ記録
    await this.createAuditLog({
      vaultId: updatedPolicy.vaultId,
      actor,
      action: "policy_updated",
      resource: "policy",
      resourceId: policyId,
      txHash,
      data: { changes },
    });

    return updatedPolicy;
  }

  /**
   * ポリシー有効化/無効化
   */
  async togglePolicyActive(policyId: string, active: boolean, actor: string, txHash?: string) {
    return this.updatePolicy(
      policyId,
      { active },
      actor,
      txHash
    );
  }

  /**
   * アクティブなポリシー取得
   */
  async getActivePolicy(vaultId: string) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(policies)
      .where(and(eq(policies.vaultId, vaultId), eq(policies.active, true)))
      .orderBy(desc(policies.createdAt))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * ポリシー履歴取得
   */
  async getPolicyHistory(vaultId: string) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(policies)
      .where(eq(policies.vaultId, vaultId))
      .orderBy(desc(policies.createdAt));

    return result;
  }

  /**
   * ポリシー変更履歴取得（監査ログから）
   */
  async getPolicyChangeHistory(policyId: string): Promise<PolicyUpdateHistory[]> {
    const db = getDatabase();

    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.resource, "policy"),
          eq(auditLogs.resourceId, policyId)
        )
      )
      .orderBy(desc(auditLogs.timestamp));

    return logs.map((log) => ({
      policyId,
      action: log.action,
      actor: log.actor,
      changes: (log.data as any)?.changes || {},
      timestamp: log.timestamp,
      txHash: log.txHash || undefined,
    }));
  }

  /**
   * 監査ログ作成
   */
  private async createAuditLog(
    logData: Omit<NewAuditLog, "id" | "timestamp">
  ) {
    const db = getDatabase();

    const newLog: NewAuditLog = {
      ...logData,
      timestamp: new Date(),
    };

    const result = await db.insert(auditLogs).values(newLog).returning();
    return result[0];
  }

  /**
   * Vault全体の監査ログ取得
   */
  async getVaultAuditLogs(vaultId: string, limit = 50, offset = 0) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.vaultId, vaultId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * アクター別監査ログ取得
   */
  async getActorAuditLogs(actor: string, limit = 50, offset = 0) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actor, actor))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * ポリシー統計情報取得
   */
  async getPolicyStats(vaultId: string) {
    const db = getDatabase();

    const allPolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.vaultId, vaultId));

    const activePolicies = allPolicies.filter((p) => p.active);

    const stats = {
      total: allPolicies.length,
      active: activePolicies.length,
      inactive: allPolicies.length - activePolicies.length,
      averageThreshold:
        activePolicies.length > 0
          ? activePolicies.reduce((sum, p) => sum + p.threshold, 0) / activePolicies.length
          : 0,
      averageTimelock:
        activePolicies.length > 0
          ? activePolicies.reduce((sum, p) => sum + p.timelock, 0) / activePolicies.length
          : 0,
    };

    return stats;
  }

  /**
   * ポリシー検証
   */
  validatePolicy(policy: {
    threshold: number;
    timelock: number;
    rolesRoot: string;
    ownersRoot: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (policy.threshold < 1) {
      errors.push("Threshold must be at least 1");
    }

    if (policy.timelock < 0) {
      errors.push("Timelock cannot be negative");
    }

    if (!policy.rolesRoot.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push("Invalid rolesRoot format");
    }

    if (!policy.ownersRoot.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push("Invalid ownersRoot format");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * シングルトンインスタンス
 */
let policyServiceInstance: PolicyService | null = null;

/**
 * PolicyServiceインスタンス取得
 */
export function getPolicyService(): PolicyService {
  if (!policyServiceInstance) {
    policyServiceInstance = new PolicyService();
  }
  return policyServiceInstance;
}
