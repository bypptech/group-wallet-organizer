import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import {
  getEscrowsByVault,
  getEscrowStats,
  isSubgraphAvailable,
  type Escrow
} from '@/lib/graphql';
import {
  useVaultStore,
  useCurrentVault,
  useEscrows,
  useNotifications
} from '@/store/useVaultStore';

/**
 * Dashboard用のデータ取得フック
 * The Graphからエスクロー情報を取得し、Zustandストアに保存
 */
export const useDashboardData = () => {
  const { address: userAddress } = useAccount();
  const currentVault = useCurrentVault();
  const escrows = useEscrows();
  const notifications = useNotifications();

  const {
    setEscrows,
    setEscrowsLoading,
    addNotification
  } = useVaultStore();

  const vaultAddress = currentVault.address;

  // エスクロー一覧の取得
  const {
    data: escrowsData,
    isLoading: isEscrowsLoading,
    error: escrowsError,
    refetch: refetchEscrows
  } = useQuery({
    queryKey: ['escrows', vaultAddress],
    queryFn: async () => {
      if (!vaultAddress) return [];
      return await getEscrowsByVault(vaultAddress);
    },
    enabled: !!vaultAddress && isSubgraphAvailable(),
    refetchInterval: 30000, // 30秒ごとに自動更新
    staleTime: 10000, // 10秒間はキャッシュを使用
  });

  // エスクロー統計情報の取得
  const {
    data: statsData,
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: ['escrowStats', vaultAddress],
    queryFn: async () => {
      if (!vaultAddress) return null;
      return await getEscrowStats(vaultAddress);
    },
    enabled: !!vaultAddress && isSubgraphAvailable(),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // エスクローデータをストアに保存
  useEffect(() => {
    if (escrowsData) {
      setEscrows(escrowsData);
    }
  }, [escrowsData, setEscrows]);

  // ローディング状態をストアに反映
  useEffect(() => {
    setEscrowsLoading(isEscrowsLoading);
  }, [isEscrowsLoading, setEscrowsLoading]);

  // エラー発生時に通知を追加
  useEffect(() => {
    if (escrowsError) {
      addNotification({
        type: 'escrow_created',
        title: 'データ取得エラー',
        message: 'エスクローデータの取得に失敗しました',
        timestamp: Date.now(),
        read: false,
      });
    }
  }, [escrowsError, addNotification]);

  // KPI計算
  const kpis = {
    pendingApprovals: statsData?.pendingCount || 0,
    approvedCount: statsData?.approvedCount || 0,
    releasedCount: statsData?.releasedCount || 0,
    totalCount: statsData?.totalCount || 0,
    urgentEscrows: escrows.items.filter((escrow) => {
      const deadline = Number(escrow.expiresAt) * 1000;
      const now = Date.now();
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      return hoursUntilDeadline < 24 && hoursUntilDeadline > 0 && Number(escrow.status) === 1; // PENDING
    }).length,
    lastUpdated: escrows.lastFetched
      ? new Date(escrows.lastFetched).toLocaleString()
      : 'Never',
  };

  // 承認待ちエスクロー
  const pendingEscrows = escrows.items.filter(
    (escrow) => Number(escrow.status) === 1 // PENDING
  );

  // 最近のエスクロー (最新5件)
  const recentEscrows = [...escrows.items]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);

  // 承認進捗の計算
  const getApprovalProgress = (escrow: Escrow) => {
    const current = escrow.approvals.filter((a) => a.approved).length;
    const required = 2; // TODO: Policy から取得
    return {
      current,
      required,
      percentage: (current / required) * 100,
    };
  };

  return {
    // データ
    escrows: escrows.items,
    pendingEscrows,
    recentEscrows,
    kpis,
    notifications: notifications.items,
    unreadCount: notifications.unreadCount,

    // 状態
    isLoading: escrows.isLoading,
    isError: !!escrowsError,

    // ヘルパー関数
    getApprovalProgress,
    refetch: refetchEscrows,

    // ストアアクション
    vaultStore: useVaultStore,
  };
};

/**
 * エスクロー状態の表示用ラベル
 */
export const getEscrowStatusLabel = (status: number): string => {
  const labels = {
    0: 'Draft',
    1: 'Pending',
    2: 'Approved',
    3: 'Ready',
    4: 'Released',
    5: 'Cancelled',
    6: 'Expired',
  };
  return labels[status as keyof typeof labels] || 'Unknown';
};

/**
 * エスクロー状態の色
 */
export const getEscrowStatusColor = (status: number): string => {
  const colors = {
    0: 'gray',      // Draft
    1: 'yellow',    // Pending
    2: 'blue',      // Approved
    3: 'green',     // Ready
    4: 'emerald',   // Released
    5: 'red',       // Cancelled
    6: 'orange',    // Expired
  };
  return colors[status as keyof typeof colors] || 'gray';
};

/**
 * エスクロータイプの表示用ラベル
 */
export const getEscrowTypeLabel = (type: number): string => {
  const labels = {
    0: 'Allowance',
    1: 'Bill Payment',
    2: 'Gift',
    3: 'Reimbursement',
    4: 'Other',
  };
  return labels[type as keyof typeof labels] || 'Unknown';
};
