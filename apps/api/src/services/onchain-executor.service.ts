/**
 * OnChainExecutorService
 *
 * EscrowExecutor.sol との On-chain インタラクションを管理するサービス
 *
 * 責務:
 * - Off-chain で approved 状態の Escrow を On-chain に登録
 * - On-chain での Escrow 実行（資金リリース）
 * - On-chain イベントの監視と Off-chain 状態の同期
 */

import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { keccak256, toBytes, toHex } from "viem/utils";
import type { Escrow, PaymentPolicy } from "../db/schema.types.js";
import { getDatabase } from "../db/index.js";
import { escrows } from "../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * EscrowExecutor.sol の ABI（必要な関数のみ）
 */
const ESCROW_EXECUTOR_ABI = parseAbi([
  "function registerEscrow(bytes32 offChainId, address vaultAddress, address recipient, address tokenAddress, uint256 amount, uint256 scheduledReleaseAt, (bytes32 policyId, bytes32 rolesRoot, uint256 threshold, uint256 maxAmount) policyValidation, bytes32 escrowDataHash) returns (uint256)",
  "function executeEscrow(uint256 onChainId)",
  "function cancelEscrow(uint256 onChainId, string reason)",
  "function getEscrow(uint256 onChainId) view returns ((bytes32 escrowHash, address vaultAddress, address recipient, address tokenAddress, uint256 amount, bytes32 policyRoot, uint8 state, uint256 registeredAt, uint256 executedAt, uint256 scheduledReleaseAt))",
  "function getOnChainId(bytes32 offChainId) view returns (uint256)",
  "function verifyEscrowIntegrity(uint256 onChainId, bytes32 offChainDataHash) view returns (bool)",
  "event EscrowRegistered(uint256 indexed onChainId, bytes32 indexed offChainId, address indexed vaultAddress, address recipient, address tokenAddress, uint256 amount, bytes32 policyRoot)",
  "event EscrowExecuted(uint256 indexed onChainId, bytes32 indexed offChainId, address indexed recipient, address tokenAddress, uint256 amount)",
  "event EscrowCancelled(uint256 indexed onChainId, bytes32 indexed offChainId, address indexed cancelledBy, string reason)",
]);

/**
 * On-chain Escrow 登録パラメータ
 */
export interface RegisterOnChainParams {
  escrow: Escrow;
  policy: PaymentPolicy;
}

/**
 * On-chain Escrow 実行結果
 */
export interface OnChainExecutionResult {
  txHash: string;
  onChainId: number;
  state: "registered" | "executed" | "cancelled";
}

/**
 * OnChainExecutorService クラス
 */
export class OnChainExecutorService {
  private publicClient;
  private walletClient;
  private executorAccount;
  private contractAddress: `0x${string}`;

  constructor() {
    // 環境変数から設定を取得
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "";
    const privateKey = process.env.EXECUTOR_PRIVATE_KEY as `0x${string}`;
    const contractAddress = process.env.ESCROW_EXECUTOR_ADDRESS as `0x${string}`;

    if (!privateKey) {
      throw new Error("EXECUTOR_PRIVATE_KEY is not set");
    }

    if (!contractAddress) {
      throw new Error("ESCROW_EXECUTOR_ADDRESS is not set");
    }

    this.contractAddress = contractAddress;
    this.executorAccount = privateKeyToAccount(privateKey);

    // Public Client（読み取り用）
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Wallet Client（書き込み用）
    this.walletClient = createWalletClient({
      account: this.executorAccount,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Off-chain で approved 状態の Escrow を On-chain に登録
   */
  async registerEscrowOnChain(
    params: RegisterOnChainParams
  ): Promise<OnChainExecutionResult> {
    const { escrow, policy } = params;

    console.log(
      `[OnChainExecutorService] Registering escrow ${escrow.id} on-chain`
    );

    // Off-chain ID のハッシュを生成（UUID → bytes32）
    const offChainId = keccak256(toBytes(escrow.id));

    // Escrow データ全体のハッシュを生成
    const escrowDataHash = this._generateEscrowDataHash(escrow);

    // Policy 検証データの準備
    const policyValidation = {
      policyId: keccak256(toBytes(policy.id)),
      rolesRoot: policy.rolesRoot as `0x${string}`,
      threshold: BigInt(policy.threshold),
      maxAmount: policy.maxAmount ? BigInt(policy.maxAmount) : BigInt(Number.MAX_SAFE_INTEGER),
    };

    // scheduledReleaseAt を Unix timestamp に変換
    const scheduledReleaseAt = escrow.scheduledReleaseAt
      ? BigInt(Math.floor(new Date(escrow.scheduledReleaseAt).getTime() / 1000))
      : BigInt(Math.floor(Date.now() / 1000));

    try {
      // registerEscrow を呼び出し
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: ESCROW_EXECUTOR_ABI,
        functionName: "registerEscrow",
        args: [
          offChainId,
          escrow.vaultAddress as `0x${string}`,
          escrow.recipientAddress as `0x${string}`,
          escrow.tokenAddress as `0x${string}`,
          BigInt(escrow.totalAmount),
          scheduledReleaseAt,
          policyValidation,
          escrowDataHash,
        ],
      });

      console.log(
        `[OnChainExecutorService] Transaction sent: ${hash}`
      );

      // トランザクションの確認を待つ
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log(
        `[OnChainExecutorService] Transaction confirmed in block ${receipt.blockNumber}`
      );

      // イベントログから onChainId を取得
      const logs = await this.publicClient.getLogs({
        address: this.contractAddress,
        event: {
          type: "event",
          name: "EscrowRegistered",
          inputs: [
            { type: "uint256", indexed: true, name: "onChainId" },
            { type: "bytes32", indexed: true, name: "offChainId" },
            { type: "address", indexed: true, name: "vaultAddress" },
            { type: "address", name: "recipient" },
            { type: "address", name: "tokenAddress" },
            { type: "uint256", name: "amount" },
            { type: "bytes32", name: "policyRoot" },
          ],
        },
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      if (logs.length === 0) {
        throw new Error("EscrowRegistered event not found in transaction receipt");
      }

      const onChainId = Number(logs[0].topics[1]);

      console.log(
        `[OnChainExecutorService] Escrow registered with onChainId: ${onChainId}`
      );

      // Off-chain データベースを更新
      await this._updateEscrowOnChainData(escrow.id, {
        onChainId: onChainId.toString(),
        onChainTxHash: hash,
        state: "on-chain",
      });

      return {
        txHash: hash,
        onChainId,
        state: "registered",
      };
    } catch (error) {
      console.error(
        `[OnChainExecutorService] Failed to register escrow on-chain:`,
        error
      );
      throw error;
    }
  }

  /**
   * On-chain で Escrow を実行（資金リリース）
   */
  async executeEscrowOnChain(
    escrowId: string
  ): Promise<OnChainExecutionResult> {
    const db = getDatabase();

    // Escrow を取得
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (!escrow) {
      throw new Error(`Escrow ${escrowId} not found`);
    }

    if (!escrow.onChainId) {
      throw new Error(`Escrow ${escrowId} is not registered on-chain`);
    }

    const onChainId = BigInt(escrow.onChainId);

    console.log(
      `[OnChainExecutorService] Executing escrow ${escrowId} (onChainId: ${onChainId})`
    );

    try {
      // executeEscrow を呼び出し
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: ESCROW_EXECUTOR_ABI,
        functionName: "executeEscrow",
        args: [onChainId],
      });

      console.log(
        `[OnChainExecutorService] Execution transaction sent: ${hash}`
      );

      // トランザクションの確認を待つ
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log(
        `[OnChainExecutorService] Execution confirmed in block ${receipt.blockNumber}`
      );

      // Off-chain データベースを更新
      await this._updateEscrowOnChainData(escrowId, {
        state: "executed",
        executedAt: new Date(),
      });

      return {
        txHash: hash,
        onChainId: Number(onChainId),
        state: "executed",
      };
    } catch (error) {
      console.error(
        `[OnChainExecutorService] Failed to execute escrow on-chain:`,
        error
      );
      throw error;
    }
  }

  /**
   * On-chain で Escrow をキャンセル
   */
  async cancelEscrowOnChain(
    escrowId: string,
    reason: string
  ): Promise<OnChainExecutionResult> {
    const db = getDatabase();

    // Escrow を取得
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (!escrow) {
      throw new Error(`Escrow ${escrowId} not found`);
    }

    if (!escrow.onChainId) {
      throw new Error(`Escrow ${escrowId} is not registered on-chain`);
    }

    const onChainId = BigInt(escrow.onChainId);

    console.log(
      `[OnChainExecutorService] Cancelling escrow ${escrowId} (onChainId: ${onChainId})`
    );

    try {
      // cancelEscrow を呼び出し
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: ESCROW_EXECUTOR_ABI,
        functionName: "cancelEscrow",
        args: [onChainId, reason],
      });

      console.log(
        `[OnChainExecutorService] Cancellation transaction sent: ${hash}`
      );

      // トランザクションの確認を待つ
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log(
        `[OnChainExecutorService] Cancellation confirmed in block ${receipt.blockNumber}`
      );

      // Off-chain データベースを更新
      await this._updateEscrowOnChainData(escrowId, {
        state: "cancelled",
        cancelledAt: new Date(),
      });

      return {
        txHash: hash,
        onChainId: Number(onChainId),
        state: "cancelled",
      };
    } catch (error) {
      console.error(
        `[OnChainExecutorService] Failed to cancel escrow on-chain:`,
        error
      );
      throw error;
    }
  }

  /**
   * On-chain Escrow データを取得
   */
  async getOnChainEscrow(onChainId: number) {
    try {
      const escrowData = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: ESCROW_EXECUTOR_ABI,
        functionName: "getEscrow",
        args: [BigInt(onChainId)],
      });

      return escrowData;
    } catch (error) {
      console.error(
        `[OnChainExecutorService] Failed to get on-chain escrow:`,
        error
      );
      throw error;
    }
  }

  /**
   * Escrow データの整合性を検証
   */
  async verifyEscrowIntegrity(
    escrowId: string
  ): Promise<boolean> {
    const db = getDatabase();

    // Escrow を取得
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);

    if (!escrow || !escrow.onChainId) {
      return false;
    }

    const onChainId = BigInt(escrow.onChainId);
    const offChainDataHash = this._generateEscrowDataHash(escrow as any);

    try {
      const isValid = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: ESCROW_EXECUTOR_ABI,
        functionName: "verifyEscrowIntegrity",
        args: [onChainId, offChainDataHash],
      });

      return isValid;
    } catch (error) {
      console.error(
        `[OnChainExecutorService] Failed to verify escrow integrity:`,
        error
      );
      return false;
    }
  }

  /**
   * Escrow データ全体のハッシュを生成
   */
  private _generateEscrowDataHash(escrow: Escrow): `0x${string}` {
    // Escrow の主要データを連結してハッシュ化
    const dataString = [
      escrow.id,
      escrow.vaultAddress,
      escrow.recipientAddress,
      escrow.tokenAddress,
      escrow.totalAmount,
      escrow.status,
      escrow.policyId,
    ].join("|");

    return keccak256(toBytes(dataString));
  }

  /**
   * Off-chain データベースの Escrow を更新
   */
  private async _updateEscrowOnChainData(
    escrowId: string,
    data: {
      onChainId?: string;
      onChainTxHash?: string;
      state?: string;
      executedAt?: Date;
      cancelledAt?: Date;
    }
  ): Promise<void> {
    const db = getDatabase();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.onChainId) updateData.onChainId = data.onChainId;
    if (data.onChainTxHash) updateData.onChainTxHash = data.onChainTxHash;
    if (data.state) updateData.status = data.state;
    if (data.executedAt) updateData.executedAt = data.executedAt;
    if (data.cancelledAt) updateData.cancelledAt = data.cancelledAt;

    await db.update(escrows).set(updateData).where(eq(escrows.id, escrowId));

    console.log(
      `[OnChainExecutorService] Updated escrow ${escrowId} in database:`,
      updateData
    );
  }
}

// Singleton インスタンス
let onChainExecutorService: OnChainExecutorService | null = null;

/**
 * OnChainExecutorService のシングルトンインスタンスを取得
 */
export const getOnChainExecutorService = (): OnChainExecutorService => {
  if (!onChainExecutorService) {
    onChainExecutorService = new OnChainExecutorService();
  }
  return onChainExecutorService;
};
