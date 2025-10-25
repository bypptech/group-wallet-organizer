import { useState, useCallback, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import {
  getEscrowsByVault,
  getEscrowById,
  getEscrowsByUser,
  getEscrowsByStatus,
  getEscrowStats,
  type Escrow,
} from '@/lib/graphql'
import type { Address } from 'viem'

/**
 * Escrowデータを管理するカスタムフック
 * The Graphからエスクロー情報を取得・管理
 */
export const useEscrows = (vaultAddress?: Address) => {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()

  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Vaultのエスクロー一覧を取得
   */
  const fetchEscrows = useCallback(
    async (first: number = 100, skip: number = 0) => {
      if (!vaultAddress) {
        console.warn('Vault address not provided')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const data = await getEscrowsByVault(vaultAddress, first, skip)
        setEscrows(data)
      } catch (err) {
        console.error('Failed to fetch escrows:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    },
    [vaultAddress]
  )

  /**
   * ユーザーに関連するエスクローを取得
   */
  const fetchUserEscrows = useCallback(
    async (first: number = 100, skip: number = 0) => {
      if (!userAddress) {
        console.warn('User address not available')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const data = await getEscrowsByUser(userAddress, first, skip)
        setEscrows(data)
      } catch (err) {
        console.error('Failed to fetch user escrows:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    },
    [userAddress]
  )

  /**
   * ステータスでフィルタリングしたエスクローを取得
   */
  const fetchEscrowsByStatus = useCallback(
    async (status: number, first: number = 100, skip: number = 0) => {
      if (!vaultAddress) {
        console.warn('Vault address not provided')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const data = await getEscrowsByStatus(vaultAddress, status, first, skip)
        setEscrows(data)
      } catch (err) {
        console.error('Failed to fetch escrows by status:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    },
    [vaultAddress]
  )

  /**
   * 特定のエスクローを取得
   */
  const fetchEscrowById = useCallback(async (escrowId: string): Promise<Escrow | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getEscrowById(escrowId)
      return data
    } catch (err) {
      console.error('Failed to fetch escrow by ID:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * エスクローをリフレッシュ
   */
  const refresh = useCallback(() => {
    if (vaultAddress) {
      fetchEscrows()
    } else if (userAddress) {
      fetchUserEscrows()
    }
  }, [vaultAddress, userAddress, fetchEscrows, fetchUserEscrows])

  /**
   * 初回マウント時にデータを取得
   */
  useEffect(() => {
    if (vaultAddress) {
      fetchEscrows()
    }
  }, [vaultAddress, fetchEscrows])

  return {
    escrows,
    isLoading,
    error,
    fetchEscrows,
    fetchUserEscrows,
    fetchEscrowsByStatus,
    fetchEscrowById,
    refresh,
  }
}

/**
 * Escrow統計情報を管理するカスタムフック
 */
export const useEscrowStats = (vaultAddress?: Address) => {
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    releasedCount: 0,
    cancelledCount: 0,
    expiredCount: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    if (!vaultAddress) {
      console.warn('Vault address not provided')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await getEscrowStats(vaultAddress)
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch escrow stats:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [vaultAddress])

  useEffect(() => {
    if (vaultAddress) {
      fetchStats()
    }
  }, [vaultAddress, fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}

/**
 * 単一のEscrowを管理するカスタムフック
 */
export const useEscrow = (escrowId?: string) => {
  const [escrow, setEscrow] = useState<Escrow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchEscrow = useCallback(async () => {
    if (!escrowId) {
      console.warn('Escrow ID not provided')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await getEscrowById(escrowId)
      setEscrow(data)
    } catch (err) {
      console.error('Failed to fetch escrow:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [escrowId])

  useEffect(() => {
    if (escrowId) {
      fetchEscrow()
    }
  }, [escrowId, fetchEscrow])

  return {
    escrow,
    isLoading,
    error,
    refresh: fetchEscrow,
  }
}

/**
 * Escrowのステータス定義
 */
export enum EscrowStatus {
  Pending = 0,
  Approved = 1,
  Released = 2,
  Cancelled = 3,
  Expired = 4,
}

/**
 * Escrowタイプの定義
 */
export enum EscrowType {
  OneTime = 0,
  Recurring = 1,
  Conditional = 2,
}

/**
 * 承認タイプの定義
 */
export enum ApprovalType {
  Threshold = 0,
  Unanimous = 1,
  Weighted = 2,
}

/**
 * Escrowのステータスラベルを取得
 */
export const getEscrowStatusLabel = (status: number): string => {
  switch (status) {
    case EscrowStatus.Pending:
      return 'Pending'
    case EscrowStatus.Approved:
      return 'Approved'
    case EscrowStatus.Released:
      return 'Released'
    case EscrowStatus.Cancelled:
      return 'Cancelled'
    case EscrowStatus.Expired:
      return 'Expired'
    default:
      return 'Unknown'
  }
}

/**
 * Escrowタイプのラベルを取得
 */
export const getEscrowTypeLabel = (type: number): string => {
  switch (type) {
    case EscrowType.OneTime:
      return 'One Time'
    case EscrowType.Recurring:
      return 'Recurring'
    case EscrowType.Conditional:
      return 'Conditional'
    default:
      return 'Unknown'
  }
}

/**
 * 承認タイプのラベルを取得
 */
export const getApprovalTypeLabel = (type: number): string => {
  switch (type) {
    case ApprovalType.Threshold:
      return 'Threshold'
    case ApprovalType.Unanimous:
      return 'Unanimous'
    case ApprovalType.Weighted:
      return 'Weighted'
    default:
      return 'Unknown'
  }
}
