import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * グループ作成リクエストの型定義
 */
export interface CreateGroupRequest {
  name: string
  requiredWeight: number
  autoApprove: boolean
  members: {
    address: Address
    role: 'owner' | 'guardian' | 'requester' | 'viewer'
    weight: number
  }[]
}

/**
 * 招待リクエストの型定義
 */
export interface CreateInviteRequest {
  vaultId: string
  role: 'owner' | 'guardian' | 'requester' | 'viewer'
  weight: number
  expiresAt: number
  method: 'link' | 'qr' | 'email'
  email?: string
}

/**
 * 招待情報の型定義
 */
export interface Invite {
  id: string
  vaultId: string
  role: string
  weight: number
  inviteToken: string
  inviteNonce: string
  expiresAt: number
  usedAt: number | null
  acceptedBy: Address | null
  method: 'link' | 'qr' | 'email'
  email: string | null
  qrCodeData: string | null
  createdAt: number
}

/**
 * グループ作成管理フック
 */
export const useGroupCreation = (vaultId?: string) => {
  const queryClient = useQueryClient()
  const [error, setError] = useState<Error | null>(null)

  /**
   * 招待一覧を取得
   */
  const {
    data: invites = [],
    isLoading: isLoadingInvites,
    refetch: refetchInvites,
  } = useQuery<Invite[]>({
    queryKey: ['invites', vaultId],
    queryFn: async () => {
      if (!vaultId) return []

      const response = await fetch(`${API_BASE_URL}/invites?vaultId=${vaultId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invites')
      }
      return response.json()
    },
    enabled: !!vaultId,
  })

  /**
   * 招待を作成
   */
  const createInviteMutation = useMutation({
    mutationFn: async (data: CreateInviteRequest) => {
      const response = await fetch(`${API_BASE_URL}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create invite')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', vaultId] })
    },
    onError: (err) => {
      console.error('Create invite error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    },
  })

  /**
   * 招待リンクを生成
   */
  const generateInviteLink = useCallback((inviteToken: string): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/invite/${inviteToken}`
  }, [])

  /**
   * 招待QRコードを生成（実際のQRコード生成はバックエンド）
   */
  const generateInviteQR = useCallback(
    async (inviteId: string): Promise<string> => {
      const response = await fetch(`${API_BASE_URL}/invites/${inviteId}/qr`)
      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }
      const data = await response.json()
      return data.qrCodeData
    },
    []
  )

  /**
   * 招待を削除
   */
  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetch(`${API_BASE_URL}/invites/${inviteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invite')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', vaultId] })
    },
  })

  /**
   * 招待を承認
   */
  const acceptInviteMutation = useMutation({
    mutationFn: async ({
      inviteToken,
      signature,
      userAddress,
    }: {
      inviteToken: string
      signature: string
      userAddress: Address
    }) => {
      const response = await fetch(`${API_BASE_URL}/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteToken,
          signature,
          userAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to accept invite')
      }

      return response.json()
    },
  })

  /**
   * クリップボードにコピー
   */
  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      throw new Error('コピーに失敗しました')
    }
  }, [])

  /**
   * 招待メールを送信
   */
  const sendInviteEmail = useCallback(
    async (inviteId: string, email: string): Promise<void> => {
      // TODO: メール送信API実装
      console.log('Sending invite email:', { inviteId, email })
    },
    []
  )

  return {
    // 招待データ
    invites,
    isLoadingInvites,

    // 招待作成
    createInvite: createInviteMutation.mutate,
    isCreatingInvite: createInviteMutation.isPending,
    createInviteError: createInviteMutation.error,

    // 招待削除
    deleteInvite: deleteInviteMutation.mutate,
    isDeletingInvite: deleteInviteMutation.isPending,

    // 招待承認
    acceptInvite: acceptInviteMutation.mutate,
    isAcceptingInvite: acceptInviteMutation.isPending,
    acceptInviteError: acceptInviteMutation.error,

    // ユーティリティ
    generateInviteLink,
    generateInviteQR,
    copyToClipboard,
    sendInviteEmail,
    refetchInvites,

    // エラー
    error,
  }
}

/**
 * 招待トークンから招待情報を取得
 */
export const useInviteByToken = (inviteToken?: string) => {
  return useQuery<Invite | null>({
    queryKey: ['invite', inviteToken],
    queryFn: async () => {
      if (!inviteToken) return null

      const response = await fetch(`${API_BASE_URL}/invites/token/${inviteToken}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch invite')
      }
      return response.json()
    },
    enabled: !!inviteToken,
  })
}
