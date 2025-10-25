/**
 * Policy Validator Service
 *
 * Policy-Based Architecture - "Policy as Oracle Pattern"
 * Policy を外部検証ルール（Oracle）として機能させる
 *
 * 主な責務:
 * - Escrow が Policy の条件を満たすかを検証
 * - Merkle Proof を使った Guardian 権限検証
 * - 金額・承認数・期限などの検証
 */

import type { PaymentPolicy } from '@packages/shared/types/policy';
import type { Escrow, Approval, ValidationResult } from '@packages/shared/types/escrow';
import { MerkleTree } from 'merkletreejs';
import { keccak256, toUtf8Bytes } from 'ethers';
import { getDatabase, members } from '../db/client.js';
import { eq } from 'drizzle-orm';

/**
 * PolicyValidatorService クラス
 *
 * Off-chain で Policy 検証を実行
 * スマートコントラクトではなく、API サーバーが「Oracle」として機能
 */
export class PolicyValidatorService {
  /**
   * Escrow が指定された Policy の条件を満たすかを検証
   *
   * @param escrow 検証対象の Escrow
   * @param policy 検証に使用する Policy
   * @returns 検証結果（valid, errors, warnings）
   */
  async validateEscrowAgainstPolicy(
    escrow: Escrow,
    policy: PaymentPolicy
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Policy が有効か
    if (!policy.active) {
      errors.push('Policy is not active');
      return { valid: false, errors, warnings };
    }

    // 2. 金額チェック
    const amount = BigInt(escrow.totalAmount);
    const maxAmount = policy.maxAmount ? BigInt(policy.maxAmount) : BigInt(Number.MAX_SAFE_INTEGER);

    if (amount > maxAmount) {
      errors.push(
        `Amount ${amount.toString()} exceeds policy maximum ${maxAmount.toString()}`
      );
    }

    // 警告: 金額が上限の90%を超えている
    if (amount > (maxAmount * 90n) / 100n) {
      warnings.push(`Amount is close to policy maximum (${amount.toString()} / ${maxAmount.toString()})`);
    }

    // 3. 承認数チェック
    const approvalCount = escrow.approvals?.length || 0;
    if (approvalCount < policy.threshold) {
      errors.push(
        `Insufficient approvals: ${approvalCount}/${policy.threshold}`
      );
    }

    // 4. 各承認者の権限検証（Merkle proof）
    if (escrow.approvals && escrow.approvals.length > 0) {
      for (const approval of escrow.approvals) {
        const isValid = await this.verifyGuardianRole(
          approval.guardianAddress,
          policy.rolesRoot,
          approval.merkleProof
        );

        if (!isValid) {
          errors.push(
            `Guardian ${approval.guardianAddress} not authorized by policy`
          );
        }
      }
    }

    // 5. Deadline チェック
    if (escrow.deadline) {
      const deadline = new Date(escrow.deadline);
      const now = new Date();

      if (deadline < now) {
        errors.push('Escrow deadline has passed');
      }

      // Timelock チェック: 現在時刻 + timelock < deadline であること
      const minTimelock = policy.timelock * 1000; // seconds to ms
      const timeDiff = deadline.getTime() - now.getTime();

      if (timeDiff < minTimelock) {
        errors.push(
          `Deadline too soon. Minimum timelock: ${policy.timelock}s, but only ${Math.floor(timeDiff / 1000)}s until deadline`
        );
      }
    }

    // 6. Escrow が既に approved 状態の場合は警告
    if (escrow.status === 'approved' || escrow.status === 'on-chain' || escrow.status === 'executed') {
      warnings.push(`Escrow is already in '${escrow.status}' status`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Merkle proof を使って Guardian のロールを検証
   *
   * @param guardianAddress Guardian のウォレットアドレス
   * @param rolesRoot Policy の rolesRoot（Merkle Root）
   * @param merkleProof Merkle proof（オプション）
   * @returns 検証結果（true = 権限あり）
   */
  private async verifyGuardianRole(
    guardianAddress: string,
    rolesRoot: string,
    merkleProof?: string[]
  ): Promise<boolean> {
    // Merkle proof がある場合は検証
    if (merkleProof && merkleProof.length > 0) {
      return this.verifyMerkleProof(guardianAddress, rolesRoot, merkleProof);
    }

    // Merkle proof がない場合は DB から直接確認（後方互換）
    return this.checkGuardianInDB(guardianAddress);
  }

  /**
   * Merkle proof の検証
   *
   * @param guardianAddress Guardian のアドレス
   * @param root Merkle Root
   * @param proof Merkle proof
   * @returns 検証結果
   */
  private verifyMerkleProof(
    guardianAddress: string,
    root: string,
    proof: string[]
  ): boolean {
    try {
      // Leaf の生成（Guardian アドレスのハッシュ）
      const leaf = keccak256(toUtf8Bytes(guardianAddress.toLowerCase()));

      // Proof を使って Root を再計算
      let computedHash = leaf;
      for (const proofElement of proof) {
        const proofBuf = Buffer.from(proofElement.replace('0x', ''), 'hex');
        const computedBuf = Buffer.from(computedHash.replace('0x', ''), 'hex');

        // ソート順を決定（Merkle Tree の標準的な方法）
        if (computedBuf.compare(proofBuf) < 0) {
          computedHash = keccak256(Buffer.concat([computedBuf, proofBuf]));
        } else {
          computedHash = keccak256(Buffer.concat([proofBuf, computedBuf]));
        }
      }

      // 計算された Root と実際の Root を比較
      return computedHash.toLowerCase() === root.toLowerCase();
    } catch (error) {
      console.error('Merkle proof verification failed:', error);
      return false;
    }
  }

  /**
   * DB 直接確認（Merkle proof 未実装時の後方互換）
   *
   * @param guardianAddress Guardian のアドレス
   * @returns Guardian が存在するか
   */
  private async checkGuardianInDB(guardianAddress: string): Promise<boolean> {
    try {
      const db = getDatabase();

      const result = await db
        .select()
        .from(members)
        .where(eq(members.address, guardianAddress.toLowerCase()))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Guardian DB check failed:', error);
      return false;
    }
  }

  /**
   * Policy 作成時の Merkle Root 生成
   *
   * @param guardianAddresses Guardian アドレスの配列
   * @returns Merkle Root（hex string）
   */
  async generateRolesRoot(guardianAddresses: string[]): Promise<string> {
    if (guardianAddresses.length === 0) {
      throw new Error('At least one guardian address is required');
    }

    // アドレスを小文字に統一
    const normalizedAddresses = guardianAddresses.map(addr => addr.toLowerCase());

    // Leaf の生成
    const leaves = normalizedAddresses.map(addr =>
      keccak256(toUtf8Bytes(addr))
    );

    // Merkle Tree 構築
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    // Root 取得
    const root = tree.getRoot();

    return '0x' + root.toString('hex');
  }

  /**
   * Policy 作成時の Owners Merkle Root 生成
   *
   * @param ownerAddresses オーナーアドレスの配列
   * @returns Merkle Root（bytes32 hex）
   */
  async generateOwnersRoot(ownerAddresses: string[]): Promise<string> {
    if (ownerAddresses.length === 0) {
      throw new Error('At least one owner address is required');
    }

    // アドレスを小文字に統一
    const normalizedAddresses = ownerAddresses.map(addr => addr.toLowerCase());

    // Leaf の生成
    const leaves = normalizedAddresses.map(addr =>
      keccak256(toUtf8Bytes(addr))
    );

    // Merkle Tree 構築
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    // Root 取得
    const root = tree.getRoot();

    return '0x' + root.toString('hex');
  }

  /**
   * Guardian 用の Merkle proof 生成
   *
   * @param guardianAddress 対象 Guardian のアドレス
   * @param allGuardianAddresses 全 Guardian のアドレス配列
   * @returns Merkle proof（hex string の配列）
   */
  async generateMerkleProof(
    guardianAddress: string,
    allGuardianAddresses: string[]
  ): Promise<string[]> {
    // アドレスを小文字に統一
    const normalizedAddresses = allGuardianAddresses.map(addr => addr.toLowerCase());
    const targetAddress = guardianAddress.toLowerCase();

    // Leaf の生成
    const leaves = normalizedAddresses.map(addr =>
      keccak256(toUtf8Bytes(addr))
    );

    // Merkle Tree 構築
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    // 対象アドレスの Leaf
    const targetLeaf = keccak256(toUtf8Bytes(targetAddress));

    // Proof 取得
    const proof = tree.getProof(targetLeaf);

    // Hex string の配列に変換
    return proof.map(p => '0x' + p.data.toString('hex'));
  }

  /**
   * 簡易的な Policy 検証（Escrow なしで Policy 自体を検証）
   *
   * @param policy 検証対象の Policy
   * @returns 検証結果
   */
  validatePolicySettings(policy: {
    threshold: number;
    timelock: number;
    rolesRoot: string;
    ownersRoot: string;
    maxAmount?: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Threshold チェック
    if (policy.threshold < 1) {
      errors.push('Threshold must be at least 1');
    }

    if (policy.threshold > 100) {
      warnings.push('Threshold is very high (>100), this may be impractical');
    }

    // Timelock チェック
    if (policy.timelock < 0) {
      errors.push('Timelock cannot be negative');
    }

    if (policy.timelock > 30 * 24 * 60 * 60) { // 30 days
      warnings.push('Timelock is longer than 30 days');
    }

    // Merkle Root フォーマットチェック
    if (!policy.rolesRoot.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push('Invalid rolesRoot format (must be 0x followed by 64 hex characters)');
    }

    if (!policy.ownersRoot.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push('Invalid ownersRoot format (must be 0x followed by 64 hex characters)');
    }

    // 最大金額チェック
    if (policy.maxAmount) {
      try {
        const amount = BigInt(policy.maxAmount);
        if (amount <= 0n) {
          errors.push('Max amount must be greater than 0');
        }
      } catch {
        errors.push('Invalid maxAmount format (must be a valid number string)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * シングルトンインスタンス
 */
let policyValidatorInstance: PolicyValidatorService | null = null;

/**
 * PolicyValidatorService インスタンス取得
 */
export function getPolicyValidatorService(): PolicyValidatorService {
  if (!policyValidatorInstance) {
    policyValidatorInstance = new PolicyValidatorService();
  }
  return policyValidatorInstance;
}
