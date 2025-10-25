import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { getEscrowById, type Escrow } from '@/lib/graphql';
import { ESCROW_REGISTRY_ABI, ESCROW_REGISTRY_ADDRESS } from '@/lib/contracts';
import { queryKeys } from '@/lib/queryClient';
import { useApprovalState } from './useApproval';

/**
 * エスクロー詳細取得フック
 * The Graphとコントラクトの両方からデータを取得して統合
 */
export const useEscrowDetail = (escrowId: string | undefined) => {
  // The Graphからエスクロー情報を取得
  const {
    data: graphEscrow,
    isLoading: isGraphLoading,
    error: graphError,
    refetch: refetchGraph,
  } = useQuery({
    queryKey: queryKeys.escrowById(escrowId || ''),
    queryFn: async () => {
      if (!escrowId) return null;
      return await getEscrowById(escrowId);
    },
    enabled: !!escrowId,
    refetchInterval: 30000, // 30秒ごとに更新
    staleTime: 10000,
  });

  // コントラクトからリアルタイム状態を取得
  const {
    data: contractEscrow,
    isLoading: isContractLoading,
    error: contractError,
    refetch: refetchContract,
  } = useReadContract({
    address: ESCROW_REGISTRY_ADDRESS,
    abi: ESCROW_REGISTRY_ABI,
    functionName: 'getEscrow',
    args: escrowId ? [BigInt(escrowId)] : undefined,
    query: {
      enabled: !!escrowId,
      refetchInterval: 10000, // 10秒ごとに更新
    },
  });

  // 承認状態を取得
  const approvalState = useApprovalState(escrowId ? BigInt(escrowId) : undefined);

  // データを統合
  const mergedEscrow: Escrow | null = graphEscrow
    ? {
        ...graphEscrow,
        // コントラクトから最新の状態を上書き
        status: contractEscrow ? Number((contractEscrow as any).state) : graphEscrow.status,
      }
    : null;

  return {
    escrow: mergedEscrow,
    approvalState,
    isLoading: isGraphLoading || isContractLoading || approvalState.isLoading,
    error: graphError || contractError || approvalState.error,
    refetch: () => {
      refetchGraph();
      refetchContract();
      approvalState.refetch();
    },
  };
};

/**
 * エスクロータイムライン取得フック
 */
export interface TimelineEvent {
  id: string;
  type: 'created' | 'approved' | 'released' | 'cancelled' | 'state_changed';
  title: string;
  description: string;
  timestamp: number;
  actor: string;
  txHash?: string;
}

export const useEscrowTimeline = (escrowId: string | undefined) => {
  const { escrow, approvalState } = useEscrowDetail(escrowId);

  const timeline: TimelineEvent[] = [];

  if (!escrow) {
    return { timeline, isLoading: true };
  }

  // 作成イベント
  timeline.push({
    id: 'created',
    type: 'created',
    title: 'Escrow Created',
    description: `Created by requester`,
    timestamp: Number(escrow.createdAt),
    actor: escrow.vaultAddress,
  });

  // 承認イベント
  if (escrow.approvals) {
    escrow.approvals.forEach((approval, index) => {
      if (approval.approved) {
        timeline.push({
          id: `approval-${index}`,
          type: 'approved',
          title: 'Approval Granted',
          description: `Approved by ${approval.approver}`,
          timestamp: Number(approval.timestamp),
          actor: approval.approver,
        });
      }
    });
  }

  // ステータス変更イベント（モック）
  // TODO: The Graphのイベントログから取得

  // タイムスタンプでソート（新しい順）
  timeline.sort((a, b) => b.timestamp - a.timestamp);

  return {
    timeline,
    isLoading: false,
  };
};

/**
 * エスクロー統計情報
 */
export const useEscrowStats = (escrowId: string | undefined) => {
  const { escrow, approvalState } = useEscrowDetail(escrowId);

  if (!escrow) {
    return {
      stats: null,
      isLoading: true,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const scheduledTime = Number(escrow.scheduledReleaseAt);
  const expiryTime = Number(escrow.expiresAt);

  const stats = {
    // 承認進捗
    approvalProgress: {
      current: approvalState.currentApprovals,
      required: approvalState.requiredApprovals,
      percentage: approvalState.progress,
      isComplete: approvalState.isComplete,
    },

    // タイムライン
    timeline: {
      createdAt: Number(escrow.createdAt),
      scheduledReleaseAt: scheduledTime,
      expiresAt: expiryTime,
      canReleaseAt: scheduledTime,
      timeUntilRelease: Math.max(0, scheduledTime - now),
      timeUntilExpiry: Math.max(0, expiryTime - now),
    },

    // ステータス
    status: {
      current: escrow.status,
      isPending: escrow.status === 1,
      isApproved: escrow.status === 2,
      isReady: escrow.status === 3,
      isReleased: escrow.status === 4,
      isCancelled: escrow.status === 5,
      isExpired: escrow.status === 6,
    },

    // アクション可否
    actions: {
      canApprove: escrow.status === 1, // PENDING
      canRelease: escrow.status === 3 || (escrow.status === 2 && now >= scheduledTime), // READY or APPROVED+時間経過
      canCancel: escrow.status < 4, // RELEASED前ならキャンセル可能
    },
  };

  return {
    stats,
    isLoading: false,
  };
};

/**
 * エスクロー金額フォーマット
 */
export const formatEscrowAmount = (
  amount: string,
  tokenSymbol: string = 'ETH',
  decimals: number = 18
): string => {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  // 小数点以下を整形
  const fractionalString = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalString.replace(/0+$/, '');

  if (trimmedFractional === '') {
    return `${integerPart} ${tokenSymbol}`;
  }

  return `${integerPart}.${trimmedFractional} ${tokenSymbol}`;
};

/**
 * 残り時間フォーマット
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Expired';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
