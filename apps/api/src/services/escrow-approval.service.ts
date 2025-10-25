/**
 * Escrow Approval Service
 *
 * Policy-Based Architecture - "Policy as Oracle Pattern"
 * Escrow の承認フローを Off-chain で管理
 *
 * 主な責務:
 * - Guardian による承認の追加
 * - Policy 条件の確認と状態遷移
 * - 承認完了時の On-chain 登録トリガー
 */

import type { Escrow, Approval, EscrowStatus, ApproveEscrowParams } from '@packages/shared/types/escrow';
import type { PaymentPolicy } from '@packages/shared/types/policy';
import { getDatabase, escrows, policies, members } from '../db/client.js';
import { eq, and } from 'drizzle-orm';
import { getPolicyValidatorService } from './policy-validator.service.js';
import { getOnChainExecutorService } from './onchain-executor.service.js';

/**
 * Escrow Approval テーブル（新規作成が必要）
 * TODO: マイグレーションで escrow_approvals テーブルを作成
 */
interface EscrowApprovalRecord {
  id: string;
  escrowId: string;
  guardianId: string;
  guardianAddress: string;
  approvedAt: Date;
  signature?: string;
  merkleProof?: string[];
}

/**
 * EscrowApprovalService クラス
 *
 * Off-chain で承認フローを管理
 * Policy 条件を満たしたら On-chain 登録をトリガー
 */
export class EscrowApprovalService {
  private validatorService = getPolicyValidatorService();

  /**
   * Escrow に承認を追加
   *
   * @param params 承認パラメータ
   * @returns 更新された Escrow
   */
  async addApproval(params: ApproveEscrowParams): Promise<Escrow> {
    const { escrowId, guardianId, guardianAddress, signature } = params;
    const db = getDatabase();

    // 1. Escrow 取得
    const escrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (escrowResult.length === 0) {
      throw new Error('Escrow not found');
    }

    const escrow = escrowResult[0] as unknown as Escrow;

    // 2. Status 確認
    if (escrow.status !== 'submitted') {
      throw new Error(`Cannot approve escrow in status: ${escrow.status}. Escrow must be in 'submitted' status.`);
    }

    // 3. Policy 取得
    const policyResult = await db
      .select()
      .from(policies)
      .where(eq(policies.id, escrow.policyId))
      .limit(1);

    if (policyResult.length === 0) {
      throw new Error('Policy not found');
    }

    const policy = policyResult[0] as unknown as PaymentPolicy;

    // 4. Member (Guardian) 取得（Merkle proof 生成のため）
    const memberResult = await db
      .select()
      .from(members)
      .where(eq(members.id, guardianId))
      .limit(1);

    if (memberResult.length === 0) {
      throw new Error('Member/Guardian not found');
    }

    const guardian = memberResult[0];

    // 5. 重複承認チェック
    // TODO: escrow_approvals テーブルから確認
    // 現在は escrow.approvals から確認（型定義に approvals が追加されている前提）
    const existingApprovals: Approval[] = (escrow as any).approvals || [];

    const alreadyApproved = existingApprovals.some(
      approval => approval.guardianId === guardianId
    );

    if (alreadyApproved) {
      throw new Error('Guardian has already approved this escrow');
    }

    // 6. Merkle proof 生成
    // TODO: Vault の全 Guardian を取得して Merkle proof 生成
    // 現在は簡略化のため null
    const merkleProof: string[] | undefined = undefined;

    // 7. 承認を記録
    const newApproval: Approval = {
      guardianId,
      guardianAddress,
      approvedAt: new Date().toISOString(),
      signature,
      merkleProof,
    };

    // TODO: escrow_approvals テーブルに INSERT
    // 現在は escrow.approvals に追加（仮実装）
    const updatedApprovals = [...existingApprovals, newApproval];

    // 8. Escrow を更新
    await db
      .update(escrows)
      .set({
        // approvals フィールドが DB schema に存在する前提
        // TODO: DB schema 更新後に有効化
        // approvals: JSON.stringify(updatedApprovals),
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, escrowId));

    // 9. 更新された Escrow を取得
    const updatedEscrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    const updatedEscrow = updatedEscrowResult[0] as unknown as Escrow;

    // 仮: approvals を手動で追加
    (updatedEscrow as any).approvals = updatedApprovals;

    // 10. 承認数確認 → Policy 条件を満たしたか？
    await this.checkAndUpdateStatus(updatedEscrow, policy);

    // 最終的な Escrow を返す
    const finalEscrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    const finalEscrow = finalEscrowResult[0] as unknown as Escrow;
    (finalEscrow as any).approvals = updatedApprovals;

    return finalEscrow;
  }

  /**
   * 承認数を確認し、Policy 条件を満たしたら状態を更新
   *
   * @param escrow 対象 Escrow
   * @param policy 参照 Policy
   */
  private async checkAndUpdateStatus(
    escrow: Escrow,
    policy: PaymentPolicy
  ): Promise<void> {
    const db = getDatabase();

    // Policy 検証
    const validation = await this.validatorService.validateEscrowAgainstPolicy(
      escrow,
      policy
    );

    console.log('[EscrowApprovalService] Validation result:', validation);

    // 検証成功 → approved 状態へ
    if (validation.valid) {
      console.log(`[EscrowApprovalService] Escrow ${escrow.id} meets policy conditions, updating to 'approved'`);

      await db
        .update(escrows)
        .set({
          status: 'approved' as EscrowStatus,
          updatedAt: new Date(),
        })
        .where(eq(escrows.id, escrow.id));

      // On-chain 登録をトリガー
      await this.triggerOnChainRegistration(escrow, policy);
      console.log(`[EscrowApprovalService] Triggered on-chain registration for escrow ${escrow.id}`);
    } else {
      console.log(`[EscrowApprovalService] Escrow ${escrow.id} does not meet policy conditions yet:`, validation.errors);
    }
  }

  /**
   * On-chain 登録をトリガー
   *
   * @param escrow Escrow
   * @param policy Policy
   */
  private async triggerOnChainRegistration(
    escrow: Escrow,
    policy: PaymentPolicy
  ): Promise<void> {
    console.log(`[EscrowApprovalService] Triggering on-chain registration for escrow ${escrow.id}`);

    try {
      const onChainExecutor = getOnChainExecutorService();

      const result = await onChainExecutor.registerEscrowOnChain({
        escrow,
        policy,
      });

      console.log(
        `[EscrowApprovalService] Escrow ${escrow.id} registered on-chain:`,
        {
          txHash: result.txHash,
          onChainId: result.onChainId,
          state: result.state,
        }
      );
    } catch (error) {
      console.error(
        `[EscrowApprovalService] Failed to register escrow ${escrow.id} on-chain:`,
        error
      );

      // On-chain 登録失敗時は状態を pending に戻す
      const db = getDatabase();
      await db
        .update(escrows)
        .set({
          status: 'pending' as EscrowStatus,
          updatedAt: new Date(),
        })
        .where(eq(escrows.id, escrow.id));

      throw error;
    }
  }

  /**
   * Escrow の承認状況を取得
   *
   * @param escrowId Escrow ID
   * @returns 承認一覧
   */
  async getApprovals(escrowId: string): Promise<Approval[]> {
    const db = getDatabase();

    // TODO: escrow_approvals テーブルから取得
    // 現在は escrow.approvals から取得（仮実装）

    const escrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (escrowResult.length === 0) {
      throw new Error('Escrow not found');
    }

    const escrow = escrowResult[0] as unknown as Escrow;

    return (escrow as any).approvals || [];
  }

  /**
   * Escrow の承認進捗を取得
   *
   * @param escrowId Escrow ID
   * @returns 承認進捗情報
   */
  async getApprovalProgress(escrowId: string): Promise<{
    currentApprovals: number;
    requiredApprovals: number;
    approvals: Approval[];
    isApproved: boolean;
  }> {
    const db = getDatabase();

    // Escrow 取得
    const escrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (escrowResult.length === 0) {
      throw new Error('Escrow not found');
    }

    const escrow = escrowResult[0] as unknown as Escrow;

    // Policy 取得
    const policyResult = await db
      .select()
      .from(policies)
      .where(eq(policies.id, escrow.policyId))
      .limit(1);

    if (policyResult.length === 0) {
      throw new Error('Policy not found');
    }

    const policy = policyResult[0] as unknown as PaymentPolicy;

    const approvals: Approval[] = (escrow as any).approvals || [];

    return {
      currentApprovals: approvals.length,
      requiredApprovals: policy.threshold,
      approvals,
      isApproved: approvals.length >= policy.threshold,
    };
  }

  /**
   * Escrow の承認をキャンセル（取り消し）
   *
   * @param escrowId Escrow ID
   * @param guardianId Guardian ID
   */
  async cancelApproval(escrowId: string, guardianId: string): Promise<Escrow> {
    const db = getDatabase();

    // Escrow 取得
    const escrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (escrowResult.length === 0) {
      throw new Error('Escrow not found');
    }

    const escrow = escrowResult[0] as unknown as Escrow;

    // Status 確認（submitted のみキャンセル可能）
    if (escrow.status !== 'submitted') {
      throw new Error(`Cannot cancel approval for escrow in status: ${escrow.status}`);
    }

    // 承認を削除
    const existingApprovals: Approval[] = (escrow as any).approvals || [];
    const updatedApprovals = existingApprovals.filter(
      approval => approval.guardianId !== guardianId
    );

    if (updatedApprovals.length === existingApprovals.length) {
      throw new Error('Guardian has not approved this escrow');
    }

    // TODO: escrow_approvals テーブルから DELETE
    // 現在は escrow.approvals を更新（仮実装）

    await db
      .update(escrows)
      .set({
        // approvals: JSON.stringify(updatedApprovals),
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, escrowId));

    // 更新された Escrow を返す
    const updatedEscrowResult = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    const updatedEscrow = updatedEscrowResult[0] as unknown as Escrow;
    (updatedEscrow as any).approvals = updatedApprovals;

    return updatedEscrow;
  }
}

/**
 * シングルトンインスタンス
 */
let escrowApprovalInstance: EscrowApprovalService | null = null;

/**
 * EscrowApprovalService インスタンス取得
 */
export function getEscrowApprovalService(): EscrowApprovalService {
  if (!escrowApprovalInstance) {
    escrowApprovalInstance = new EscrowApprovalService();
  }
  return escrowApprovalInstance;
}
