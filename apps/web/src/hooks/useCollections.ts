import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import type {
  CreateCollectionParams,
  CollectionPaymentParams,
  CollectionMetadata,
  CollectionStats,
} from '@shared/types/collection'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Collection API Response型定義
 */
interface CollectionAPIResponse {
  id: string
  vaultId: string
  requester: string
  recipient: string
  token: string
  amount: string
  status: 'draft' | 'submitted' | 'on-chain' | 'cancelled'
  createdAt: string
  updatedAt: string
  metadata: CollectionMetadata
}

/**
 * Collection詳細レスポンス（統計情報付き）
 */
interface CollectionDetailResponse {
  collection: CollectionAPIResponse
  stats: CollectionStats
}

/**
 * Collection一覧取得フック
 */
export const useCollections = (vaultId?: string) => {
  const {
    data: collections = [],
    isLoading,
    error,
    refetch,
  } = useQuery<CollectionAPIResponse[]>({
    queryKey: ['collections', vaultId],
    queryFn: async () => {
      if (!vaultId) return []

      const response = await fetch(`${API_BASE_URL}/collections/vault/${vaultId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch collections')
      }
      const data = await response.json()
      return data.collections || []
    },
    enabled: !!vaultId,
    retry: false,
  })

  return {
    collections,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Collection詳細取得フック
 */
export const useCollection = (collectionId?: string) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CollectionDetailResponse>({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      if (!collectionId) throw new Error('Collection ID is required')

      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch collection')
      }
      return response.json()
    },
    enabled: !!collectionId,
    retry: false,
  })

  return {
    collection: data?.collection,
    stats: data?.stats,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Collection作成フック
 */
export const useCreateCollection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateCollectionParams): Promise<CollectionAPIResponse> => {
      const response = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create collection')
      }

      const data = await response.json()
      return data.collection
    },
    onSuccess: (newCollection) => {
      // Invalidate collections query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['collections', newCollection.vaultId] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}


/**
 * Participant追加パラメータ型定義
 */
export interface AddParticipantParams {
  collectionId: string
  name: string
  address?: Address
  allocatedAmount: string
}

/**
 * Participant追加フック
 */
export const useAddParticipant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: AddParticipantParams): Promise<CollectionAPIResponse> => {
      const { collectionId, ...participantData } = params
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.error || 'Failed to add participant')
        } catch {
          throw new Error(`Failed to add participant: ${response.status} ${errorText}`)
        }
      }

      const responseText = await response.text()
      try {
        const data = JSON.parse(responseText)
        return data.collection
      } catch (error) {
        console.error('[useAddParticipant] JSON parse error:', error)
        console.error('[useAddParticipant] Response text:', responseText)
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`)
      }
    },
    onSuccess: (updatedCollection) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['collection', updatedCollection.id] })
      queryClient.invalidateQueries({ queryKey: ['collections', updatedCollection.vaultId] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

/**
 * 参加者の支払いを記録するフック
 */
export const useRecordPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ collectionId, participantId, vaultId }: { collectionId: string; participantId: string; vaultId?: string }) => {
      const response = await fetch(
        `${API_BASE_URL}/collections/${collectionId}/participants/${participantId}/record-payment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || 'Failed to record payment')
        } catch {
          throw new Error(`Failed to record payment: ${response.status} ${errorText}`)
        }
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionId] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      if (variables.vaultId) {
        queryClient.invalidateQueries({ queryKey: ['collections', variables.vaultId] })
      }
    },
  })
}

/**
 * Collection統計情報計算ユーティリティ
 */
export const calculateCollectionStats = (metadata: CollectionMetadata): CollectionStats => {
  const totalParticipants = metadata.participants.length
  const paidParticipants = metadata.participants.filter(p => p.status === 'paid').length
  const pendingParticipants = metadata.participants.filter(p => p.status === 'pending' || p.status === 'partial').length

  const totalAmount = BigInt(metadata.totalAmount)
  const collectedAmount = BigInt(metadata.collectedAmount)
  const completionRate = totalAmount > 0n
    ? Number((collectedAmount * 100n) / totalAmount)
    : 0

  return {
    totalParticipants,
    paidParticipants,
    pendingParticipants,
    totalAmount: metadata.totalAmount,
    collectedAmount: metadata.collectedAmount,
    completionRate,
  }
}
