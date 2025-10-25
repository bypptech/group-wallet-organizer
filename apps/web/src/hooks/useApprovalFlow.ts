import { useState, useCallback } from 'react'
import { useAaClient } from './useAaClient'
import { useEscrow } from './useEscrows'
import type { Address } from 'viem'

/**
 * Escrow承認フローを管理するカスタムフック
 * エスクローの承認・拒否・キャンセル機能を提供
 */
export const useApprovalFlow = (escrowId?: string) => {
  const { writeContract, isReady: isAaReady } = useAaClient()
  const { escrow, refresh: refreshEscrow } = useEscrow(escrowId)

  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * エスクローを承認
   */
  const approve = useCallback(
    async (escrowRegistryAddress: Address, escrowRegistryAbi: any) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (!escrowId) {
        throw new Error('Escrow ID not provided')
      }

      try {
        setIsApproving(true)
        setError(null)

        const txHash = await writeContract(
          escrowRegistryAddress,
          escrowRegistryAbi,
          'approveEscrow',
          [BigInt(escrowId)]
        )

        console.log('Escrow approved:', txHash)

        // データを更新
        await refreshEscrow()

        return txHash
      } catch (err) {
        console.error('Failed to approve escrow:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsApproving(false)
      }
    },
    [isAaReady, escrowId, writeContract, refreshEscrow]
  )

  /**
   * エスクローを拒否
   */
  const reject = useCallback(
    async (
      escrowRegistryAddress: Address,
      escrowRegistryAbi: any,
      reason: string = ''
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (!escrowId) {
        throw new Error('Escrow ID not provided')
      }

      try {
        setIsRejecting(true)
        setError(null)

        const txHash = await writeContract(
          escrowRegistryAddress,
          escrowRegistryAbi,
          'rejectEscrow',
          [BigInt(escrowId), reason]
        )

        console.log('Escrow rejected:', txHash)

        // データを更新
        await refreshEscrow()

        return txHash
      } catch (err) {
        console.error('Failed to reject escrow:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsRejecting(false)
      }
    },
    [isAaReady, escrowId, writeContract, refreshEscrow]
  )

  /**
   * エスクローをキャンセル
   */
  const cancel = useCallback(
    async (
      escrowRegistryAddress: Address,
      escrowRegistryAbi: any,
      reason: string = ''
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (!escrowId) {
        throw new Error('Escrow ID not provided')
      }

      try {
        setIsCancelling(true)
        setError(null)

        const txHash = await writeContract(
          escrowRegistryAddress,
          escrowRegistryAbi,
          'cancelEscrow',
          [BigInt(escrowId), reason]
        )

        console.log('Escrow cancelled:', txHash)

        // データを更新
        await refreshEscrow()

        return txHash
      } catch (err) {
        console.error('Failed to cancel escrow:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsCancelling(false)
      }
    },
    [isAaReady, escrowId, writeContract, refreshEscrow]
  )

  /**
   * エスクローをリリース
   */
  const release = useCallback(
    async (escrowRegistryAddress: Address, escrowRegistryAbi: any) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (!escrowId) {
        throw new Error('Escrow ID not provided')
      }

      try {
        setError(null)

        const txHash = await writeContract(
          escrowRegistryAddress,
          escrowRegistryAbi,
          'releaseEscrow',
          [BigInt(escrowId)]
        )

        console.log('Escrow released:', txHash)

        // データを更新
        await refreshEscrow()

        return txHash
      } catch (err) {
        console.error('Failed to release escrow:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      }
    },
    [isAaReady, escrowId, writeContract, refreshEscrow]
  )

  return {
    escrow,
    isApproving,
    isRejecting,
    isCancelling,
    error,
    approve,
    reject,
    cancel,
    release,
    refresh: refreshEscrow,
  }
}

/**
 * 複数エスクローの一括承認を管理するカスタムフック
 */
export const useBatchApproval = () => {
  const { writeBatchContract, isReady: isAaReady } = useAaClient()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 複数のエスクローを一括承認
   */
  const batchApprove = useCallback(
    async (
      escrowRegistryAddress: Address,
      escrowRegistryAbi: any,
      escrowIds: string[]
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (escrowIds.length === 0) {
        throw new Error('No escrow IDs provided')
      }

      try {
        setIsProcessing(true)
        setError(null)

        // 各エスクローIDに対するapproveEscrow呼び出しを作成
        const calls = escrowIds.map((id) => ({
          contractAddress: escrowRegistryAddress,
          abi: escrowRegistryAbi,
          functionName: 'approveEscrow',
          args: [BigInt(id)],
        }))

        const txHash = await writeBatchContract(calls)

        console.log('Batch approval completed:', txHash)

        return txHash
      } catch (err) {
        console.error('Failed to batch approve escrows:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [isAaReady, writeBatchContract]
  )

  /**
   * 複数のエスクローを一括拒否
   */
  const batchReject = useCallback(
    async (
      escrowRegistryAddress: Address,
      escrowRegistryAbi: any,
      escrowIds: string[],
      reason: string = ''
    ) => {
      if (!isAaReady) {
        throw new Error('AA Client not ready')
      }

      if (escrowIds.length === 0) {
        throw new Error('No escrow IDs provided')
      }

      try {
        setIsProcessing(true)
        setError(null)

        const calls = escrowIds.map((id) => ({
          contractAddress: escrowRegistryAddress,
          abi: escrowRegistryAbi,
          functionName: 'rejectEscrow',
          args: [BigInt(id), reason],
        }))

        const txHash = await writeBatchContract(calls)

        console.log('Batch rejection completed:', txHash)

        return txHash
      } catch (err) {
        console.error('Failed to batch reject escrows:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [isAaReady, writeBatchContract]
  )

  return {
    isProcessing,
    error,
    batchApprove,
    batchReject,
  }
}

/**
 * 承認状態の取得と監視
 */
export const useApprovalState = (escrowId?: string) => {
  const { escrow } = useEscrow(escrowId)
  const [approvalProgress, setApprovalProgress] = useState({
    current: 0,
    required: 0,
    percentage: 0,
  })

  // エスクローの承認情報から進捗を計算
  const calculateProgress = useCallback(() => {
    if (!escrow || !escrow.approvals) {
      return { current: 0, required: 0, percentage: 0 }
    }

    const approvedCount = escrow.approvals.filter((a) => a.approved).length
    const requiredCount = escrow.approvals.length // 簡略化、実際は別のロジックが必要

    return {
      current: approvedCount,
      required: requiredCount,
      percentage: requiredCount > 0 ? (approvedCount / requiredCount) * 100 : 0,
    }
  }, [escrow])

  // エスクローが更新されたら進捗を再計算
  const updateProgress = useCallback(() => {
    const progress = calculateProgress()
    setApprovalProgress(progress)
  }, [calculateProgress])

  // 初回とエスクロー更新時に進捗を計算
  useState(() => {
    updateProgress()
  })

  return {
    escrow,
    approvalProgress,
    isApproved: escrow?.status === 1, // Approved status
    isPending: escrow?.status === 0, // Pending status
    updateProgress,
  }
}

/**
 * エスクロー状態の定義
 */
export enum EscrowState {
  DRAFT = 0,
  PENDING = 1,
  APPROVED = 2,
  READY = 3,
  RELEASED = 4,
  CANCELLED = 5,
  EXPIRED = 6,
}

/**
 * エスクロー状態のラベルを取得
 */
export const getEscrowStateLabel = (state: number): string => {
  switch (state) {
    case EscrowState.DRAFT:
      return 'Draft'
    case EscrowState.PENDING:
      return 'Pending'
    case EscrowState.APPROVED:
      return 'Approved'
    case EscrowState.READY:
      return 'Ready'
    case EscrowState.RELEASED:
      return 'Released'
    case EscrowState.CANCELLED:
      return 'Cancelled'
    case EscrowState.EXPIRED:
      return 'Expired'
    default:
      return 'Unknown'
  }
}

/**
 * エスクロー状態の色を取得（UI用）
 */
export const getEscrowStateColor = (state: number): string => {
  switch (state) {
    case EscrowState.DRAFT:
      return 'gray'
    case EscrowState.PENDING:
      return 'yellow'
    case EscrowState.APPROVED:
      return 'blue'
    case EscrowState.READY:
      return 'green'
    case EscrowState.RELEASED:
      return 'green'
    case EscrowState.CANCELLED:
      return 'red'
    case EscrowState.EXPIRED:
      return 'red'
    default:
      return 'gray'
  }
}
