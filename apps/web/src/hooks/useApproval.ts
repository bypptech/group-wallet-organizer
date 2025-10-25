import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { ESCROW_REGISTRY_ABI, ESCROW_REGISTRY_ADDRESS } from '@/lib/contracts';
import { useVaultStore } from '@/store/useVaultStore';

/**
 * エスクロー承認フック
 */
export const useApproveEscrow = () => {
  const [isApproving, setIsApproving] = useState(false);
  const { addNotification, updateEscrow } = useVaultStore();

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
   * エスクローを承認
   */
  const approveEscrow = async (escrowId: bigint) => {
    try {
      setIsApproving(true);

      // コントラクト呼び出し
      writeContract({
        address: ESCROW_REGISTRY_ADDRESS,
        abi: ESCROW_REGISTRY_ABI,
        functionName: 'approveEscrow',
        args: [escrowId],
      });

      // 成功時の通知
      addNotification({
        type: 'approval_request',
        title: 'Approval Submitted',
        message: `Successfully approved escrow #${escrowId}`,
        timestamp: Date.now(),
        read: false,
        escrowId: escrowId.toString(),
      });

      // ストアを更新（楽観的UI更新）
      updateEscrow(escrowId.toString(), {
        status: 2, // APPROVED
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to approve escrow');
      console.error('Approve escrow error:', error);

      // エラー通知
      addNotification({
        type: 'approval_request',
        title: 'Approval Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsApproving(false);
    }
  };

  return {
    approveEscrow,
    isApproving: isApproving || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * 承認状態取得フック
 */
export const useApprovalState = (escrowId: bigint | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ESCROW_REGISTRY_ADDRESS,
    abi: ESCROW_REGISTRY_ABI,
    functionName: 'getApprovalState',
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 10000, // 10秒ごとに更新
    },
  });

  if (!data) {
    return {
      requiredApprovals: 0,
      currentApprovals: 0,
      approvers: [] as Address[],
      isLoading,
      error,
      refetch,
    };
  }

  const [requiredApprovals, currentApprovals, approvers] = data as [bigint, bigint, Address[]];

  return {
    requiredApprovals: Number(requiredApprovals),
    currentApprovals: Number(currentApprovals),
    approvers,
    progress: Number(requiredApprovals) > 0
      ? (Number(currentApprovals) / Number(requiredApprovals)) * 100
      : 0,
    isComplete: currentApprovals >= requiredApprovals,
    isLoading,
    error,
    refetch,
  };
};

/**
 * エスクロー詳細取得フック
 */
export const useEscrowDetail = (escrowId: bigint | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ESCROW_REGISTRY_ADDRESS,
    abi: ESCROW_REGISTRY_ABI,
    functionName: 'getEscrow',
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
      refetchInterval: 10000,
    },
  });

  return {
    escrow: data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * 一括承認フック（複数のエスクローを一度に承認）
 */
export const useBatchApprove = () => {
  const [isApproving, setIsApproving] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const { approveEscrow } = useApproveEscrow();
  const { addNotification } = useVaultStore();

  const batchApprove = async (escrowIds: bigint[]) => {
    setIsApproving(true);
    setApprovedCount(0);

    try {
      for (const escrowId of escrowIds) {
        await approveEscrow(escrowId);
        setApprovedCount((prev) => prev + 1);

        // 各承認の間に少し待機（ネットワーク負荷軽減）
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      addNotification({
        type: 'approval_request',
        title: 'Batch Approval Complete',
        message: `Successfully approved ${escrowIds.length} escrows`,
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch approval failed');
      console.error('Batch approve error:', error);

      addNotification({
        type: 'approval_request',
        title: 'Batch Approval Failed',
        message: `Approved ${approvedCount}/${escrowIds.length} escrows before error`,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsApproving(false);
    }
  };

  return {
    batchApprove,
    isApproving,
    approvedCount,
  };
};

/**
 * ライブ承認セッション管理
 */
export const useLiveApprovalSession = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Address[]>([]);

  /**
   * ライブセッション開始
   */
  const startSession = async (escrowId: bigint) => {
    try {
      // TODO: WebSocket接続やPush Protocol統合
      const newSessionId = `session-${Date.now()}`;
      setSessionId(newSessionId);
      setIsSessionActive(true);

      console.log('Live approval session started:', newSessionId);

      return newSessionId;
    } catch (err) {
      console.error('Failed to start session:', err);
      return null;
    }
  };

  /**
   * ライブセッション終了
   */
  const endSession = () => {
    setIsSessionActive(false);
    setSessionId(null);
    setParticipants([]);
  };

  /**
   * 参加者追加
   */
  const addParticipant = (address: Address) => {
    setParticipants((prev) => [...new Set([...prev, address])]);
  };

  return {
    isSessionActive,
    sessionId,
    participants,
    startSession,
    endSession,
    addParticipant,
  };
};

/**
 * Merkle Proof検証用ヘルパー
 */
export const useMerkleProof = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Merkle Proofを生成
   */
  const generateProof = async (
    address: Address,
    role: number
  ): Promise<string[]> => {
    try {
      setIsVerifying(true);

      // TODO: Merkle Tree生成とProof計算
      // 現在はモックデータを返す
      const mockProof = [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      ];

      return mockProof;
    } catch (err) {
      console.error('Proof generation error:', err);
      return [];
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Merkle Proofを検証
   */
  const verifyProof = async (
    proof: string[],
    leaf: string,
    root: string
  ): Promise<boolean> => {
    try {
      setIsVerifying(true);

      // TODO: オンチェーン検証
      // RoleVerifier.verifyRole() を呼び出し

      return true; // モック
    } catch (err) {
      console.error('Proof verification error:', err);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    generateProof,
    verifyProof,
    isVerifying,
  };
};
