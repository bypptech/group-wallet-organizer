import { useCallback } from 'react'
import { showToast } from '@/lib/toast'
import {
  handleUserOperationError,
  handleContractError,
} from '@/components/errors/EscrowErrorBoundary'
import type { Address } from 'viem'

/**
 * トランザクション実行オプション
 */
interface TransactionOptions {
  txType: string
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

/**
 * エスクロー操作オプション
 */
interface EscrowOperationOptions {
  escrowId: string
  amount?: string
  recipient?: Address
  approver?: Address
}

/**
 * トースト通知とエラーハンドリングを統合するカスタムフック
 */
export const useToastNotifications = () => {
  /**
   * トランザクション実行をラップして自動的にトースト通知を表示
   */
  const executeWithToast = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: TransactionOptions
    ): Promise<T | null> => {
      const {
        txType,
        onSuccess,
        onError,
        successMessage,
        errorMessage,
      } = options

      // ローディングトースト表示
      const toastId = showToast.tx.pending(txType)

      try {
        const result = await operation()

        // ローディングトーストを閉じる
        if (toastId) {
          // @ts-ignore - Sonner toast dismiss method
          toastId.dismiss?.()
        }

        // トランザクションハッシュを取得（result が string または object の場合）
        const txHash =
          typeof result === 'string'
            ? result
            : (result as { hash?: string })?.hash

        if (txHash) {
          showToast.tx.success(txType, txHash, successMessage)
          onSuccess?.(txHash)
        } else {
          showToast.success(`${txType}が完了しました`, successMessage)
        }

        return result
      } catch (error) {
        // ローディングトーストを閉じる
        if (toastId) {
          // @ts-ignore - Sonner toast dismiss method
          toastId.dismiss?.()
        }

        const friendlyMessage = handleContractError(error)
        showToast.tx.error(
          txType,
          error instanceof Error ? error.message : '不明なエラー',
          errorMessage || friendlyMessage
        )

        onError?.(error instanceof Error ? error : new Error('Unknown error'))
        return null
      }
    },
    []
  )

  /**
   * エスクロー作成時のトースト通知
   */
  const notifyEscrowCreated = useCallback(
    (options: EscrowOperationOptions & { txHash: string }) => {
      const { escrowId, amount, recipient, txHash } = options

      if (amount && recipient) {
        showToast.escrow.created(escrowId, amount, recipient, txHash)
      } else {
        showToast.tx.success('エスクロー作成', txHash, 'エスクローを作成しました。')
      }
    },
    []
  )

  /**
   * エスクロー承認時のトースト通知
   */
  const notifyEscrowApproved = useCallback(
    (options: EscrowOperationOptions & { txHash: string }) => {
      const { escrowId, approver, txHash } = options

      if (approver) {
        showToast.escrow.approved(escrowId, approver, txHash)
      } else {
        showToast.tx.success('エスクロー承認', txHash, 'エスクローを承認しました。')
      }
    },
    []
  )

  /**
   * エスクロー実行時のトースト通知
   */
  const notifyEscrowReleased = useCallback(
    (options: EscrowOperationOptions & { txHash: string }) => {
      const { escrowId, amount, txHash } = options

      if (amount) {
        showToast.escrow.released(escrowId, amount, txHash)
      } else {
        showToast.tx.success('エスクロー実行', txHash, 'エスクローを実行しました。')
      }
    },
    []
  )

  /**
   * エスクローキャンセル時のトースト通知
   */
  const notifyEscrowCancelled = useCallback(
    (options: EscrowOperationOptions & { txHash: string }) => {
      const { escrowId, txHash } = options
      showToast.escrow.cancelled(escrowId, txHash)
    },
    []
  )

  /**
   * トークン承認時のトースト通知
   */
  const notifyTokenApproval = useCallback(
    async (
      tokenSymbol: string,
      approvalOperation: () => Promise<string>
    ): Promise<string | null> => {
      showToast.token.approvalRequired(tokenSymbol)

      const toastId = showToast.tx.pending(`${tokenSymbol}の承認`)

      try {
        const txHash = await approvalOperation()

        if (toastId) {
          // @ts-ignore - Sonner toast dismiss method
          toastId.dismiss?.()
        }

        showToast.token.approved(tokenSymbol, txHash)
        return txHash
      } catch (error) {
        if (toastId) {
          // @ts-ignore - Sonner toast dismiss method
          toastId.dismiss?.()
        }

        const friendlyMessage = handleUserOperationError(error)
        showToast.error(
          'トークン承認に失敗しました',
          friendlyMessage
        )

        return null
      }
    },
    []
  )

  /**
   * ウォレット接続時のトースト通知
   */
  const notifyWalletConnected = useCallback((address: Address) => {
    showToast.wallet.connected(address)
  }, [])

  /**
   * ウォレット切断時のトースト通知
   */
  const notifyWalletDisconnected = useCallback(() => {
    showToast.wallet.disconnected()
  }, [])

  /**
   * ネットワーク切り替え要求時のトースト通知
   */
  const notifyNetworkSwitch = useCallback(
    (currentNetwork: string, requiredNetwork: string) => {
      showToast.wallet.networkSwitch(currentNetwork, requiredNetwork)
    },
    []
  )

  /**
   * ガス代不足エラー通知
   */
  const notifyInsufficientGas = useCallback((requiredAmount: string) => {
    showToast.wallet.insufficientGas(requiredAmount)
  }, [])

  /**
   * グループ作成成功通知
   */
  const notifyGroupCreated = useCallback(
    (groupName: string, memberCount: number) => {
      showToast.group.created(groupName, memberCount)
    },
    []
  )

  /**
   * 招待リンク生成成功通知
   */
  const notifyInviteLinkCreated = useCallback((role: string) => {
    showToast.group.inviteCreated(role)
  }, [])

  /**
   * コピー成功通知
   */
  const notifyCopied = useCallback((content?: string) => {
    showToast.copied(content)
  }, [])

  /**
   * 保存成功通知
   */
  const notifySaved = useCallback((itemName?: string) => {
    showToast.saved(itemName)
  }, [])

  /**
   * 削除成功通知
   */
  const notifyDeleted = useCallback((itemName?: string) => {
    showToast.deleted(itemName)
  }, [])

  /**
   * エラー処理とトースト表示
   */
  const handleErrorWithToast = useCallback((error: unknown, context?: string) => {
    const friendlyMessage = handleContractError(error)
    const title = context ? `${context}に失敗しました` : 'エラーが発生しました'

    showToast.error(title, friendlyMessage)

    // コンソールにも詳細を出力
    console.error(`[Error] ${context}:`, error)
  }, [])

  /**
   * UserOperation固有のエラー処理とトースト表示
   */
  const handleUserOpErrorWithToast = useCallback(
    (error: unknown, context?: string) => {
      const friendlyMessage = handleUserOperationError(error)
      const title = context ? `${context}に失敗しました` : 'エラーが発生しました'

      showToast.error(title, friendlyMessage)

      // コンソールにも詳細を出力
      console.error(`[UserOp Error] ${context}:`, error)
    },
    []
  )

  return {
    // トランザクション実行
    executeWithToast,

    // エスクロー操作通知
    notifyEscrowCreated,
    notifyEscrowApproved,
    notifyEscrowReleased,
    notifyEscrowCancelled,

    // トークン操作通知
    notifyTokenApproval,

    // ウォレット操作通知
    notifyWalletConnected,
    notifyWalletDisconnected,
    notifyNetworkSwitch,
    notifyInsufficientGas,

    // グループ操作通知
    notifyGroupCreated,
    notifyInviteLinkCreated,

    // 一般操作通知
    notifyCopied,
    notifySaved,
    notifyDeleted,

    // エラー処理
    handleErrorWithToast,
    handleUserOpErrorWithToast,
  }
}
