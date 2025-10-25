import { toast as sonnerToast } from 'sonner'
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2, ExternalLink } from 'lucide-react'

/**
 * トースト通知のカスタムアイコン定義
 */
const ToastIcons = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  loading: <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />,
}

/**
 * トランザクションハッシュへのリンク生成
 */
const getBlockExplorerUrl = (txHash: string): string => {
  const baseUrl = 'https://sepolia.basescan.org/tx'
  return `${baseUrl}/${txHash}`
}

/**
 * 基本的な成功通知
 */
export const showSuccessToast = (message: string, description?: string) => {
  sonnerToast.success(message, {
    description,
    icon: ToastIcons.success,
    duration: 5000,
  })
}

/**
 * 基本的なエラー通知
 */
export const showErrorToast = (message: string, description?: string) => {
  sonnerToast.error(message, {
    description,
    icon: ToastIcons.error,
    duration: 7000,
  })
}

/**
 * 警告通知
 */
export const showWarningToast = (message: string, description?: string) => {
  sonnerToast.warning(message, {
    description,
    icon: ToastIcons.warning,
    duration: 6000,
  })
}

/**
 * 情報通知
 */
export const showInfoToast = (message: string, description?: string) => {
  sonnerToast.info(message, {
    description,
    icon: ToastIcons.info,
    duration: 4000,
  })
}

/**
 * ローディング通知（手動で閉じる必要あり）
 */
export const showLoadingToast = (message: string, description?: string) => {
  return sonnerToast.loading(message, {
    description,
    icon: ToastIcons.loading,
    duration: Infinity,
  })
}

/**
 * トランザクション開始通知
 */
export const showTxPendingToast = (txType: string, description?: string) => {
  return sonnerToast.loading(`${txType}を処理中...`, {
    description: description || 'トランザクションを送信しています。しばらくお待ちください。',
    icon: ToastIcons.loading,
    duration: Infinity,
  })
}

/**
 * トランザクション成功通知（Block Explorerリンク付き）
 */
export const showTxSuccessToast = (
  txType: string,
  txHash: string,
  description?: string
) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.success(`${txType}が完了しました`, {
    description: description || 'トランザクションが正常に完了しました。',
    icon: ToastIcons.success,
    duration: 10000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * トランザクション失敗通知
 */
export const showTxErrorToast = (
  txType: string,
  error: string,
  userFriendlyMessage?: string
) => {
  sonnerToast.error(`${txType}が失敗しました`, {
    description: userFriendlyMessage || error,
    icon: ToastIcons.error,
    duration: 10000,
  })
}

/**
 * エスクロー作成成功通知
 */
export const showEscrowCreatedToast = (
  escrowId: string,
  amount: string,
  recipient: string,
  txHash: string
) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.success('エスクローを作成しました', {
    description: `${amount}を${recipient.slice(0, 6)}...${recipient.slice(-4)}に送信予約しました。`,
    icon: ToastIcons.success,
    duration: 10000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * エスクロー承認通知
 */
export const showEscrowApprovedToast = (
  escrowId: string,
  approver: string,
  txHash: string
) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.success('エスクローを承認しました', {
    description: `${approver.slice(0, 6)}...${approver.slice(-4)}がエスクローを承認しました。`,
    icon: ToastIcons.success,
    duration: 8000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * エスクロー実行成功通知
 */
export const showEscrowReleasedToast = (
  escrowId: string,
  amount: string,
  txHash: string
) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.success('エスクローを実行しました', {
    description: `${amount}の送金が完了しました。`,
    icon: ToastIcons.success,
    duration: 10000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * エスクローキャンセル通知
 */
export const showEscrowCancelledToast = (escrowId: string, txHash: string) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.info('エスクローをキャンセルしました', {
    description: '送金予約がキャンセルされました。',
    icon: ToastIcons.info,
    duration: 8000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * 流動性追加成功通知
 */
export const showLiquidityAddedToast = (
  tokenA: string,
  tokenB: string,
  txHash: string
) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.success('流動性を追加しました', {
    description: `${tokenA}/${tokenB}プールに流動性を追加しました。`,
    icon: ToastIcons.success,
    duration: 8000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * グループ作成成功通知
 */
export const showGroupCreatedToast = (groupName: string, memberCount: number) => {
  sonnerToast.success('グループを作成しました', {
    description: `"${groupName}"を作成しました。メンバー: ${memberCount}名`,
    icon: ToastIcons.success,
    duration: 6000,
  })
}

/**
 * 招待リンク生成成功通知
 */
export const showInviteLinkCreatedToast = (role: string) => {
  sonnerToast.success('招待リンクを生成しました', {
    description: `${role}の招待リンクをクリップボードにコピーしました。`,
    icon: ToastIcons.success,
    duration: 5000,
  })
}

/**
 * ウォレット接続成功通知
 */
export const showWalletConnectedToast = (address: string) => {
  sonnerToast.success('ウォレットを接続しました', {
    description: `アドレス: ${address.slice(0, 6)}...${address.slice(-4)}`,
    icon: ToastIcons.success,
    duration: 4000,
  })
}

/**
 * ウォレット切断通知
 */
export const showWalletDisconnectedToast = () => {
  sonnerToast.info('ウォレットを切断しました', {
    description: 'ウォレット接続が解除されました。',
    icon: ToastIcons.info,
    duration: 3000,
  })
}

/**
 * ネットワーク切り替え要求通知
 */
export const showNetworkSwitchRequiredToast = (
  currentNetwork: string,
  requiredNetwork: string
) => {
  sonnerToast.warning('ネットワークを切り替えてください', {
    description: `現在: ${currentNetwork} → 必要: ${requiredNetwork}`,
    icon: ToastIcons.warning,
    duration: 8000,
  })
}

/**
 * ガス代不足エラー通知
 */
export const showInsufficientGasToast = (requiredAmount: string) => {
  sonnerToast.error('ガス代が不足しています', {
    description: `トランザクションを実行するには${requiredAmount} ETHが必要です。`,
    icon: ToastIcons.error,
    duration: 10000,
  })
}

/**
 * トークン承認要求通知
 */
export const showTokenApprovalRequiredToast = (tokenSymbol: string) => {
  sonnerToast.info(`${tokenSymbol}の使用許可が必要です`, {
    description: 'トランザクションを実行する前にトークンの使用を許可してください。',
    icon: ToastIcons.info,
    duration: 6000,
  })
}

/**
 * トークン承認成功通知
 */
export const showTokenApprovedToast = (tokenSymbol: string, txHash: string) => {
  const explorerUrl = getBlockExplorerUrl(txHash)

  sonnerToast.success(`${tokenSymbol}の使用を許可しました`, {
    description: 'トランザクションを続行できます。',
    icon: ToastIcons.success,
    duration: 5000,
    action: {
      label: (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          確認
        </span>
      ),
      onClick: () => window.open(explorerUrl, '_blank'),
    },
  })
}

/**
 * コピー成功通知
 */
export const showCopiedToast = (content: string = 'テキスト') => {
  sonnerToast.success('コピーしました', {
    description: `${content}をクリップボードにコピーしました。`,
    icon: ToastIcons.success,
    duration: 3000,
  })
}

/**
 * 保存成功通知
 */
export const showSavedToast = (itemName: string = '設定') => {
  sonnerToast.success('保存しました', {
    description: `${itemName}を保存しました。`,
    icon: ToastIcons.success,
    duration: 4000,
  })
}

/**
 * 削除成功通知
 */
export const showDeletedToast = (itemName: string = 'アイテム') => {
  sonnerToast.success('削除しました', {
    description: `${itemName}を削除しました。`,
    icon: ToastIcons.success,
    duration: 4000,
  })
}

/**
 * 汎用トースト通知（カスタマイズ可能）
 */
export const showToast = {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
  loading: showLoadingToast,
  tx: {
    pending: showTxPendingToast,
    success: showTxSuccessToast,
    error: showTxErrorToast,
  },
  escrow: {
    created: showEscrowCreatedToast,
    approved: showEscrowApprovedToast,
    released: showEscrowReleasedToast,
    cancelled: showEscrowCancelledToast,
  },
  wallet: {
    connected: showWalletConnectedToast,
    disconnected: showWalletDisconnectedToast,
    networkSwitch: showNetworkSwitchRequiredToast,
    insufficientGas: showInsufficientGasToast,
  },
  token: {
    approvalRequired: showTokenApprovalRequiredToast,
    approved: showTokenApprovedToast,
  },
  group: {
    created: showGroupCreatedToast,
    inviteCreated: showInviteLinkCreatedToast,
  },
  liquidityAdded: showLiquidityAddedToast,
  copied: showCopiedToast,
  saved: showSavedToast,
  deleted: showDeletedToast,
}
