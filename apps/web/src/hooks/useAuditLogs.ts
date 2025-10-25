import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * 監査ログの型定義
 */
export interface AuditLog {
  id: string
  vaultId: string
  eventType: 'escrow_created' | 'escrow_approved' | 'escrow_released' | 'escrow_cancelled' |
             'member_added' | 'member_removed' | 'member_updated' | 'settings_updated' |
             'webhook_added' | 'webhook_removed' | 'paymaster_topped_up'
  actor: Address
  actorRole: 'owner' | 'guardian' | 'requester' | 'viewer' | 'system'
  targetType: 'escrow' | 'member' | 'settings' | 'webhook' | 'paymaster'
  targetId: string | null
  action: string
  description: string
  metadata: Record<string, any>
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

/**
 * 監査ログフィルター
 */
export interface AuditLogFilter {
  eventType?: AuditLog['eventType']
  actor?: Address
  actorRole?: AuditLog['actorRole']
  targetType?: AuditLog['targetType']
  severity?: AuditLog['severity']
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * 監査ログ統計
 */
export interface AuditLogStats {
  totalEvents: number
  criticalEvents: number
  warningEvents: number
  infoEvents: number
  eventsByType: Record<string, number>
  eventsByActor: Record<string, number>
  recentActivity: {
    date: string
    count: number
  }[]
}

/**
 * 監査ログ管理フック
 */
export const useAuditLogs = (vaultId?: string, filter?: AuditLogFilter) => {
  /**
   * 監査ログ一覧を取得
   */
  const {
    data: logs = [],
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', vaultId, filter],
    queryFn: async () => {
      if (!vaultId) return []

      const params = new URLSearchParams()
      params.append('vaultId', vaultId)

      if (filter?.eventType) params.append('eventType', filter.eventType)
      if (filter?.actor) params.append('actor', filter.actor)
      if (filter?.actorRole) params.append('actorRole', filter.actorRole)
      if (filter?.targetType) params.append('targetType', filter.targetType)
      if (filter?.severity) params.append('severity', filter.severity)
      if (filter?.startDate) params.append('startDate', filter.startDate)
      if (filter?.endDate) params.append('endDate', filter.endDate)
      if (filter?.limit) params.append('limit', filter.limit.toString())
      if (filter?.offset) params.append('offset', filter.offset.toString())

      const response = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      const data = await response.json()
      return data.logs || []
    },
    enabled: !!vaultId,
    refetchInterval: 30000, // 30秒ごとに自動更新
  })

  /**
   * 監査ログ統計を取得
   */
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery<AuditLogStats>({
    queryKey: ['audit-logs', 'stats', vaultId],
    queryFn: async () => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/audit-logs/stats?vaultId=${vaultId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit log stats')
      }
      return response.json()
    },
    enabled: !!vaultId,
    refetchInterval: 60000, // 1分ごとに自動更新
  })

  /**
   * 特定の監査ログを取得
   */
  const getLogById = (logId: string): AuditLog | undefined => {
    return logs.find((log) => log.id === logId)
  }

  /**
   * イベントタイプでフィルタ
   */
  const filterByEventType = (eventType: AuditLog['eventType']): AuditLog[] => {
    return logs.filter((log) => log.eventType === eventType)
  }

  /**
   * アクターでフィルタ
   */
  const filterByActor = (actor: Address): AuditLog[] => {
    return logs.filter((log) => log.actor === actor)
  }

  /**
   * 重要度でフィルタ
   */
  const filterBySeverity = (severity: AuditLog['severity']): AuditLog[] => {
    return logs.filter((log) => log.severity === severity)
  }

  /**
   * 日付範囲でフィルタ
   */
  const filterByDateRange = (startDate: Date, endDate: Date): AuditLog[] => {
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp)
      return logDate >= startDate && logDate <= endDate
    })
  }

  /**
   * 重要なログのみ取得（criticalとwarning）
   */
  const criticalLogs = logs.filter((log) =>
    log.severity === 'critical' || log.severity === 'warning'
  )

  /**
   * 最近のログ取得（デフォルト10件）
   */
  const getRecentLogs = (count: number = 10): AuditLog[] => {
    return logs.slice(0, count)
  }

  /**
   * CSVエクスポート用データ生成
   */
  const exportToCSV = (): string => {
    const headers = ['Timestamp', 'Event Type', 'Actor', 'Action', 'Description', 'Severity']
    const rows = logs.map(log => [
      log.timestamp,
      log.eventType,
      log.actor,
      log.action,
      log.description,
      log.severity,
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    return csv
  }

  /**
   * CSVダウンロード
   */
  const downloadCSV = () => {
    const csv = exportToCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `audit-logs-${vaultId}-${new Date().toISOString()}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    // データ
    logs,
    stats,
    criticalLogs,
    isLoadingLogs,
    isLoadingStats,
    logsError,

    // フィルタ関数
    getLogById,
    filterByEventType,
    filterByActor,
    filterBySeverity,
    filterByDateRange,
    getRecentLogs,

    // エクスポート
    exportToCSV,
    downloadCSV,

    // リフレッシュ
    refetchLogs,
    refetchStats,
  }
}

/**
 * イベントタイプのラベルを取得
 */
export const getEventTypeLabel = (eventType: AuditLog['eventType']): string => {
  const labels: Record<AuditLog['eventType'], string> = {
    escrow_created: 'Escrow Created',
    escrow_approved: 'Escrow Approved',
    escrow_released: 'Escrow Released',
    escrow_cancelled: 'Escrow Cancelled',
    member_added: 'Member Added',
    member_removed: 'Member Removed',
    member_updated: 'Member Updated',
    settings_updated: 'Settings Updated',
    webhook_added: 'Webhook Added',
    webhook_removed: 'Webhook Removed',
    paymaster_topped_up: 'Paymaster Topped Up',
  }
  return labels[eventType] || eventType
}

/**
 * イベントタイプのアイコンを取得
 */
export const getEventTypeIcon = (eventType: AuditLog['eventType']): string => {
  const icons: Record<AuditLog['eventType'], string> = {
    escrow_created: '📝',
    escrow_approved: '✅',
    escrow_released: '🎉',
    escrow_cancelled: '❌',
    member_added: '👤',
    member_removed: '🚫',
    member_updated: '✏️',
    settings_updated: '⚙️',
    webhook_added: '🔗',
    webhook_removed: '🔓',
    paymaster_topped_up: '💰',
  }
  return icons[eventType] || '📄'
}

/**
 * 重要度の色を取得
 */
export const getSeverityColor = (severity: AuditLog['severity']): string => {
  const colors: Record<AuditLog['severity'], string> = {
    info: 'from-blue-500 to-cyan-500',
    warning: 'from-amber-500 to-orange-500',
    critical: 'from-red-500 to-pink-500',
  }
  return colors[severity] || colors.info
}

/**
 * 重要度のバッジ色を取得
 */
export const getSeverityBadgeColor = (severity: AuditLog['severity']): string => {
  const colors: Record<AuditLog['severity'], string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
  }
  return colors[severity] || colors.info
}

/**
 * 相対時間を取得
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}秒前`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}日前`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}ヶ月前`
  return `${Math.floor(diffInSeconds / 31536000)}年前`
}
