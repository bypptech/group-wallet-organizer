import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * 通知の型定義
 */
export interface Notification {
  id: string
  userId: string
  type: 'escrow_created' | 'escrow_approved' | 'escrow_released' | 'escrow_cancelled' | 'member_invited' | 'policy_updated'
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  readAt: string | null
  createdAt: string
}

/**
 * 通知作成リクエスト
 */
export interface CreateNotificationRequest {
  userId: string
  type: Notification['type']
  title: string
  message: string
  data?: Record<string, any>
}

/**
 * 通知管理フック
 */
export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient()

  /**
   * 通知一覧を取得
   */
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []

      const response = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      return data.notifications || []
    },
    enabled: !!userId,
    refetchInterval: 30000, // 30秒ごとに自動更新
  })

  /**
   * 未読通知数を取得
   */
  const {
    data: unreadCount = 0,
  } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0

      const response = await fetch(`${API_BASE_URL}/notifications/unread-count?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch unread count')
      }
      const data = await response.json()
      return data.count || 0
    },
    enabled: !!userId,
    refetchInterval: 30000,
  })

  /**
   * 通知を既読にする
   */
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] })
    },
  })

  /**
   * 全ての通知を既読にする
   */
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required')

      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] })
    },
  })

  /**
   * 通知を削除
   */
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] })
    },
  })

  /**
   * 通知を作成（システム用）
   */
  const createNotificationMutation = useMutation({
    mutationFn: async (data: CreateNotificationRequest) => {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] })
    },
  })

  /**
   * 通知を種類でフィルタ
   */
  const filterByType = (type: Notification['type']) => {
    return notifications.filter((n) => n.type === type)
  }

  /**
   * 未読通知のみ取得
   */
  const unreadNotifications = notifications.filter((n) => !n.read)

  /**
   * 既読通知のみ取得
   */
  const readNotifications = notifications.filter((n) => n.read)

  /**
   * 通知を時間でソート（新しい順）
   */
  const sortedNotifications = [...notifications].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return {
    // データ
    notifications: sortedNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    isLoading,
    error,

    // アクション
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    createNotification: createNotificationMutation.mutate,
    filterByType,
    refetch,

    // ステータス
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    isCreatingNotification: createNotificationMutation.isPending,
  }
}

/**
 * 通知アイコンとスタイルを取得
 */
export const getNotificationStyle = (type: Notification['type']) => {
  const styles = {
    escrow_created: {
      icon: '📝',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    escrow_approved: {
      icon: '✅',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
    escrow_released: {
      icon: '🎉',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    escrow_cancelled: {
      icon: '❌',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10',
    },
    member_invited: {
      icon: '👥',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
    },
    policy_updated: {
      icon: '⚙️',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500/10',
    },
  }

  return styles[type] || styles.escrow_created
}

/**
 * 相対時間を取得（例: "2時間前"）
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
