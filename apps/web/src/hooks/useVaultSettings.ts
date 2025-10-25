import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Vault情報の型定義
 */
export interface Vault {
  id: string
  vaultAddress: Address
  name: string
  description: string
  createdAt: string
  updatedAt: string
  members: VaultMember[]
  settings: VaultSettings
}

/**
 * Vaultメンバーの型定義
 */
export interface VaultMember {
  id: string
  vaultId: string
  userAddress: Address
  role: 'owner' | 'guardian' | 'requester' | 'viewer'
  weight: number
  addedAt: string
  addedBy: Address
  lastActivity: string | null
}

/**
 * Vault設定の型定義
 */
export interface VaultSettings {
  requiredWeight: number
  timelock: number
  autoApprove: boolean
  paymasterEnabled: boolean
  webhooksEnabled: boolean
  notificationsEnabled: boolean
}

/**
 * Vault更新リクエスト
 */
export interface UpdateVaultRequest {
  name?: string
  description?: string
  settings?: Partial<VaultSettings>
}

/**
 * メンバー追加リクエスト
 */
export interface AddMemberRequest {
  userAddress: Address
  role: 'owner' | 'guardian' | 'requester' | 'viewer'
  weight: number
}

/**
 * メンバー更新リクエスト
 */
export interface UpdateMemberRequest {
  role?: 'owner' | 'guardian' | 'requester' | 'viewer'
  weight?: number
}

/**
 * Webhook情報
 */
export interface Webhook {
  id: string
  vaultId: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'failed'
  secret: string
  lastDelivery: string | null
  deliveryRate: number
  createdAt: string
}

/**
 * Paymaster情報
 */
export interface PaymasterInfo {
  id?: string
  vaultId?: string
  enabled: boolean
  token: 'USDC' | 'ETH' | 'JPYC'
  balance: string
  dailyUsage: string
  monthlyLimit: string
  dailyLimit: string
  autoRefillEnabled: boolean
  refillThreshold: string
  refillAmount: string
  fallbackEnabled: boolean
  healthStatus: 'healthy' | 'warning' | 'critical'
  lastTopUpAt: string | null
  lastResetAt: string
  createdAt?: string
  updatedAt?: string
  metadata?: any
}

/**
 * Vault設定管理フック
 */
export const useVaultSettings = (vaultId?: string) => {
  const queryClient = useQueryClient()

  /**
   * Vault情報を取得
   */
  const {
    data: vault,
    isLoading: isLoadingVault,
    error: vaultError,
    refetch: refetchVault,
  } = useQuery<Vault>({
    queryKey: ['vault', vaultId],
    queryFn: async () => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vault')
      }
      return response.json()
    },
    enabled: !!vaultId,
  })

  /**
   * Vaultメンバー一覧を取得
   */
  const {
    data: members = [],
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = useQuery<VaultMember[]>({
    queryKey: ['vault', vaultId, 'members'],
    queryFn: async () => {
      if (!vaultId) return []

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      return data.members || []
    },
    enabled: !!vaultId,
  })

  /**
   * Webhooks一覧を取得
   */
  const {
    data: webhooks = [],
    isLoading: isLoadingWebhooks,
    refetch: refetchWebhooks,
  } = useQuery<Webhook[]>({
    queryKey: ['vault', vaultId, 'webhooks'],
    queryFn: async () => {
      if (!vaultId) return []

      // TODO: Webhook APIエンドポイント実装後に有効化
      // const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/webhooks`)
      // if (!response.ok) throw new Error('Failed to fetch webhooks')
      // return response.json()

      // Mock data
      return []
    },
    enabled: !!vaultId,
  })

  /**
   * Paymaster情報を取得
   */
  const {
    data: paymasterInfo,
    isLoading: isLoadingPaymaster,
    refetch: refetchPaymaster,
  } = useQuery<PaymasterInfo>({
    queryKey: ['vault', vaultId, 'paymaster'],
    queryFn: async () => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/paymaster/settings/${vaultId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch paymaster info')
      }
      const data = await response.json()
      return data.settings
    },
    enabled: !!vaultId,
  })

  /**
   * Vault情報を更新
   */
  const updateVaultMutation = useMutation({
    mutationFn: async (data: UpdateVaultRequest) => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update vault')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId] })
    },
  })

  /**
   * メンバーを追加
   */
  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberRequest) => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to add member')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId, 'members'] })
    },
  })

  /**
   * メンバーを更新
   */
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: UpdateMemberRequest }) => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update member')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId, 'members'] })
    },
  })

  /**
   * メンバーを削除
   */
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId, 'members'] })
    },
  })

  /**
   * Paymaster設定を更新
   */
  const updatePaymasterMutation = useMutation({
    mutationFn: async (data: Partial<PaymasterInfo>) => {
      if (!vaultId) throw new Error('Vault ID is required')

      const response = await fetch(`${API_BASE_URL}/paymaster/settings/${vaultId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update paymaster settings')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId, 'paymaster'] })
    },
  })

  /**
   * Webhookを追加
   */
  const addWebhookMutation = useMutation({
    mutationFn: async (data: Omit<Webhook, 'id' | 'vaultId' | 'secret' | 'status' | 'lastDelivery' | 'deliveryRate' | 'createdAt'>) => {
      if (!vaultId) throw new Error('Vault ID is required')

      // TODO: Webhook APIエンドポイント実装
      throw new Error('Webhook API not implemented yet')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId, 'webhooks'] })
    },
  })

  /**
   * Webhookを削除
   */
  const removeWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      if (!vaultId) throw new Error('Vault ID is required')

      // TODO: Webhook APIエンドポイント実装
      throw new Error('Webhook API not implemented yet')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', vaultId, 'webhooks'] })
    },
  })

  /**
   * ロールラベルを取得
   */
  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      owner: 'Owner',
      guardian: 'Guardian',
      requester: 'Requester',
      viewer: 'Viewer',
    }
    return labels[role] || role
  }

  /**
   * ロールカラーを取得
   */
  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      owner: 'from-purple-500 to-indigo-500',
      guardian: 'from-amber-500 to-orange-500',
      requester: 'from-green-500 to-emerald-500',
      viewer: 'from-blue-500 to-cyan-500',
    }
    return colors[role] || 'from-gray-500 to-gray-600'
  }

  return {
    // Vault データ
    vault,
    members,
    webhooks,
    paymasterInfo,

    // ローディング状態
    isLoadingVault,
    isLoadingMembers,
    isLoadingWebhooks,
    isLoadingPaymaster,

    // エラー
    vaultError,

    // Vault操作
    updateVault: updateVaultMutation.mutate,
    isUpdatingVault: updateVaultMutation.isPending,

    // メンバー操作
    addMember: addMemberMutation.mutate,
    updateMember: updateMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    isAddingMember: addMemberMutation.isPending,
    isUpdatingMember: updateMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,

    // Webhook操作
    addWebhook: addWebhookMutation.mutate,
    removeWebhook: removeWebhookMutation.mutate,
    isAddingWebhook: addWebhookMutation.isPending,
    isRemovingWebhook: removeWebhookMutation.isPending,

    // Paymaster操作
    updatePaymaster: updatePaymasterMutation.mutate,
    updatePaymasterAsync: updatePaymasterMutation.mutateAsync,
    isUpdatingPaymaster: updatePaymasterMutation.isPending,

    // リフレッシュ
    refetchVault,
    refetchMembers,
    refetchWebhooks,
    refetchPaymaster,

    // ユーティリティ
    getRoleLabel,
    getRoleColor,
  }
}
