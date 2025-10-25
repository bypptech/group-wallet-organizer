import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { ESCROW_REGISTRY_ABI, ESCROW_REGISTRY_ADDRESS } from '@/lib/contracts';
import { useVaultStore } from '@/store/useVaultStore';

/**
 * エスクローリリース判定
 */
export interface EscrowReleaseStatus {
  isReady: boolean;
  canRelease: boolean;
  reason: string;
  approvalProgress: {
    current: number;
    required: number;
    percentage: number;
  };
  timelockStatus: {
    isActive: boolean;
    unlockTime: number | null;
    remainingTime: number | null;
  };
}

/**
 * エスクローリリースフック
 */
export const useReleaseEscrow = () => {
  const [isReleasing, setIsReleasing] = useState(false);
  const { updateEscrow, addNotification } = useVaultStore();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * エスクローをリリース
   */
  const releaseEscrow = async (escrowId: bigint) => {
    try {
      setIsReleasing(true);

      // コントラクト呼び出し
      writeContract({
        address: ESCROW_REGISTRY_ADDRESS,
        abi: ESCROW_REGISTRY_ABI,
        functionName: 'release',
        args: [escrowId],
      });

      // 成功時の通知
      addNotification({
        type: 'escrow_released',
        title: 'Escrow Released',
        message: `Successfully released escrow #${escrowId}`,
        timestamp: Date.now(),
        read: false,
        escrowId: escrowId.toString(),
      });

      // ストアを更新
      updateEscrow(escrowId.toString(), {
        status: 4, // RELEASED
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to release escrow');
      console.error('Release escrow error:', error);

      addNotification({
        type: 'escrow_released',
        title: 'Release Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsReleasing(false);
    }
  };

  return {
    releaseEscrow,
    isReleasing: isReleasing || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * リリース可否判定フック
 */
export const useEscrowReleaseStatus = (escrowId: bigint | undefined) => {
  const [releaseStatus, setReleaseStatus] = useState<EscrowReleaseStatus | null>(null);

  // エスクロー詳細取得
  const { data: escrowData, isLoading: isEscrowLoading } = useReadContract({
    address: ESCROW_REGISTRY_ADDRESS,
    abi: ESCROW_REGISTRY_ABI,
    functionName: 'getEscrow',
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });

  // 承認状態取得
  const { data: approvalData, isLoading: isApprovalLoading } = useReadContract({
    address: ESCROW_REGISTRY_ADDRESS,
    abi: ESCROW_REGISTRY_ABI,
    functionName: 'getApprovalState',
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  });

  // リリース判定を計算
  const checkReleaseStatus = (): EscrowReleaseStatus => {
    if (!escrowData || !approvalData) {
      return {
        isReady: false,
        canRelease: false,
        reason: 'Loading...',
        approvalProgress: { current: 0, required: 0, percentage: 0 },
        timelockStatus: { isActive: false, unlockTime: null, remainingTime: null },
      };
    }

    const [requiredApprovals, currentApprovals] = approvalData as [bigint, bigint, Address[]];
    const escrow = escrowData as any;

    const current = Number(currentApprovals);
    const required = Number(requiredApprovals);
    const approvalsMet = current >= required;

    // タイムロックチェック（仮実装）
    const now = Math.floor(Date.now() / 1000);
    const scheduledTime = Number(escrow.scheduledReleaseAt);
    const timelockPassed = now >= scheduledTime;

    const isReady = approvalsMet && timelockPassed;
    const canRelease = isReady && Number(escrow.state) === 2; // APPROVED状態

    let reason = '';
    if (!approvalsMet) {
      reason = `Waiting for approvals (${current}/${required})`;
    } else if (!timelockPassed) {
      const remainingSeconds = scheduledTime - now;
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      reason = `Timelock active (${hours}h ${minutes}m remaining)`;
    } else if (canRelease) {
      reason = 'Ready to release';
    } else {
      reason = 'Not in approved state';
    }

    return {
      isReady,
      canRelease,
      reason,
      approvalProgress: {
        current,
        required,
        percentage: required > 0 ? (current / required) * 100 : 0,
      },
      timelockStatus: {
        isActive: !timelockPassed,
        unlockTime: scheduledTime,
        remainingTime: timelockPassed ? null : scheduledTime - now,
      },
    };
  };

  // データ更新時に再計算
  const status = checkReleaseStatus();

  return {
    releaseStatus: status,
    isLoading: isEscrowLoading || isApprovalLoading,
    refetch: () => {
      // 再取得トリガー
    },
  };
};

/**
 * 一括リリースフック
 */
export const useBatchRelease = () => {
  const [isReleasing, setIsReleasing] = useState(false);
  const [releasedCount, setReleasedCount] = useState(0);
  const { releaseEscrow } = useReleaseEscrow();
  const { addNotification } = useVaultStore();

  const batchRelease = async (escrowIds: bigint[]) => {
    setIsReleasing(true);
    setReleasedCount(0);

    try {
      for (const escrowId of escrowIds) {
        await releaseEscrow(escrowId);
        setReleasedCount((prev) => prev + 1);

        // 各リリースの間に少し待機
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      addNotification({
        type: 'escrow_released',
        title: 'Batch Release Complete',
        message: `Successfully released ${escrowIds.length} escrows`,
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch release failed');
      console.error('Batch release error:', error);

      addNotification({
        type: 'escrow_released',
        title: 'Batch Release Failed',
        message: `Released ${releasedCount}/${escrowIds.length} escrows before error`,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsReleasing(false);
    }
  };

  return {
    batchRelease,
    isReleasing,
    releasedCount,
  };
};

/**
 * Ready/Waitingリスト取得フック
 */
export const useEscrowLists = (vaultAddress: Address | undefined) => {
  const [readyList, setReadyList] = useState<bigint[]>([]);
  const [waitingList, setWaitingList] = useState<bigint[]>([]);

  // TODO: The Graphから全エスクローを取得して判定
  // 現在はモックデータ

  const refreshLists = async () => {
    // The Graphクエリ実装
    // const escrows = await getEscrowsByVault(vaultAddress);
    // 各エスクローのステータスをチェックしてリストに振り分け
  };

  return {
    readyList,
    waitingList,
    refreshLists,
  };
};

/**
 * エスクローキャンセルフック
 */
export const useCancelEscrow = () => {
  const [isCancelling, setIsCancelling] = useState(false);
  const { updateEscrow, addNotification } = useVaultStore();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * エスクローをキャンセル
   */
  const cancelEscrow = async (escrowId: bigint, reason: string) => {
    try {
      setIsCancelling(true);

      writeContract({
        address: ESCROW_REGISTRY_ADDRESS,
        abi: ESCROW_REGISTRY_ABI,
        functionName: 'cancelEscrow',
        args: [escrowId, reason],
      });

      addNotification({
        type: 'escrow_created',
        title: 'Escrow Cancelled',
        message: `Cancelled escrow #${escrowId}: ${reason}`,
        timestamp: Date.now(),
        read: false,
        escrowId: escrowId.toString(),
      });

      updateEscrow(escrowId.toString(), {
        status: 5, // CANCELLED
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel escrow');
      console.error('Cancel escrow error:', error);

      addNotification({
        type: 'escrow_created',
        title: 'Cancel Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    cancelEscrow,
    isCancelling: isCancelling || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};
