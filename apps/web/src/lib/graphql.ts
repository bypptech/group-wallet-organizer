import { type Address } from 'viem'

/**
 * The Graph クライアント設定
 * EscrowRegistry, PolicyManagerなどのイベントデータを取得
 */

/**
 * Subgraph URLの取得
 */
export const getSubgraphUrl = (): string => {
  const subgraphUrl = import.meta.env.VITE_SUBGRAPH_URL

  if (!subgraphUrl) {
    throw new Error(
      'VITE_SUBGRAPH_URL が設定されていません。The Graphを使用するには環境変数を設定してください。'
    )
  }

  return subgraphUrl
}

/**
 * GraphQLクエリの実行
 * @param query - GraphQLクエリ文字列
 * @param variables - クエリ変数
 */
export const executeGraphQLQuery = async <T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> => {
  const subgraphUrl = getSubgraphUrl()

  try {
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL errors:', result.errors)
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
    }

    return result.data as T
  } catch (error) {
    console.error('Failed to execute GraphQL query:', error)
    throw error
  }
}

/**
 * Escrow型定義
 */
export interface Escrow {
  id: string
  escrowId: string
  vaultAddress: Address
  recipient: Address
  tokenAddress: Address
  amount: string
  escrowType: number
  approvalType: number
  title: string
  description: string
  status: number
  createdAt: string
  scheduledReleaseAt: string
  expiresAt: string
  metadataHash: string
  approvals: Approval[]
}

export interface Approval {
  id: string
  escrowId: string
  approver: Address
  approved: boolean
  timestamp: string
}

export interface Policy {
  id: string
  vaultAddress: Address
  minApprovals: string
  maxAmount: string
  cooldownPeriod: string
  enabled: boolean
}

export interface Vault {
  id: string
  address: Address
  owner: Address
  members: string[]
  policies: Policy[]
  escrows: Escrow[]
}

/**
 * Vaultのエスクロー一覧を取得
 * @param vaultAddress - Vaultコントラクトのアドレス
 * @param first - 取得件数（デフォルト: 100）
 * @param skip - スキップ件数（デフォルト: 0）
 */
export const getEscrowsByVault = async (
  vaultAddress: Address,
  first: number = 100,
  skip: number = 0
): Promise<Escrow[]> => {
  const query = `
    query GetEscrowsByVault($vaultAddress: String!, $first: Int!, $skip: Int!) {
      escrows(
        where: { vaultAddress: $vaultAddress }
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        escrowId
        vaultAddress
        recipient
        tokenAddress
        amount
        escrowType
        approvalType
        title
        description
        status
        createdAt
        scheduledReleaseAt
        expiresAt
        metadataHash
        approvals {
          id
          escrowId
          approver
          approved
          timestamp
        }
      }
    }
  `

  const result = await executeGraphQLQuery<{ escrows: Escrow[] }>(query, {
    vaultAddress: vaultAddress.toLowerCase(),
    first,
    skip,
  })

  return result.escrows
}

/**
 * 特定のエスクローを取得
 * @param escrowId - エスクローID
 */
export const getEscrowById = async (escrowId: string): Promise<Escrow | null> => {
  const query = `
    query GetEscrowById($escrowId: String!) {
      escrow(id: $escrowId) {
        id
        escrowId
        vaultAddress
        recipient
        tokenAddress
        amount
        escrowType
        approvalType
        title
        description
        status
        createdAt
        scheduledReleaseAt
        expiresAt
        metadataHash
        approvals {
          id
          escrowId
          approver
          approved
          timestamp
        }
      }
    }
  `

  const result = await executeGraphQLQuery<{ escrow: Escrow | null }>(query, {
    escrowId,
  })

  return result.escrow
}

/**
 * ユーザーに関連するエスクローを取得
 * @param userAddress - ユーザーアドレス
 * @param first - 取得件数（デフォルト: 100）
 * @param skip - スキップ件数（デフォルト: 0）
 */
export const getEscrowsByUser = async (
  userAddress: Address,
  first: number = 100,
  skip: number = 0
): Promise<Escrow[]> => {
  const query = `
    query GetEscrowsByUser($userAddress: String!, $first: Int!, $skip: Int!) {
      escrows(
        where: {
          or: [
            { recipient: $userAddress }
            { approvals_: { approver: $userAddress } }
          ]
        }
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        escrowId
        vaultAddress
        recipient
        tokenAddress
        amount
        escrowType
        approvalType
        title
        description
        status
        createdAt
        scheduledReleaseAt
        expiresAt
        metadataHash
        approvals {
          id
          escrowId
          approver
          approved
          timestamp
        }
      }
    }
  `

  const result = await executeGraphQLQuery<{ escrows: Escrow[] }>(query, {
    userAddress: userAddress.toLowerCase(),
    first,
    skip,
  })

  return result.escrows
}

/**
 * Vaultのポリシー情報を取得
 * @param vaultAddress - Vaultコントラクトのアドレス
 */
export const getPoliciesByVault = async (
  vaultAddress: Address
): Promise<Policy[]> => {
  const query = `
    query GetPoliciesByVault($vaultAddress: String!) {
      policies(where: { vaultAddress: $vaultAddress }) {
        id
        vaultAddress
        minApprovals
        maxAmount
        cooldownPeriod
        enabled
      }
    }
  `

  const result = await executeGraphQLQuery<{ policies: Policy[] }>(query, {
    vaultAddress: vaultAddress.toLowerCase(),
  })

  return result.policies
}

/**
 * Vault情報の取得
 * @param vaultAddress - Vaultコントラクトのアドレス
 */
export const getVaultInfo = async (vaultAddress: Address): Promise<Vault | null> => {
  const query = `
    query GetVaultInfo($vaultAddress: String!) {
      vault(id: $vaultAddress) {
        id
        address
        owner
        members
        policies {
          id
          vaultAddress
          minApprovals
          maxAmount
          cooldownPeriod
          enabled
        }
        escrows(first: 10, orderBy: createdAt, orderDirection: desc) {
          id
          escrowId
          vaultAddress
          recipient
          tokenAddress
          amount
          escrowType
          approvalType
          title
          description
          status
          createdAt
          scheduledReleaseAt
          expiresAt
          metadataHash
        }
      }
    }
  `

  const result = await executeGraphQLQuery<{ vault: Vault | null }>(query, {
    vaultAddress: vaultAddress.toLowerCase(),
  })

  return result.vault
}

/**
 * ステータスによるエスクローのフィルタリング
 * @param vaultAddress - Vaultコントラクトのアドレス
 * @param status - エスクローステータス（0: Pending, 1: Approved, 2: Released, 3: Cancelled, 4: Expired）
 * @param first - 取得件数（デフォルト: 100）
 * @param skip - スキップ件数（デフォルト: 0）
 */
export const getEscrowsByStatus = async (
  vaultAddress: Address,
  status: number,
  first: number = 100,
  skip: number = 0
): Promise<Escrow[]> => {
  const query = `
    query GetEscrowsByStatus($vaultAddress: String!, $status: Int!, $first: Int!, $skip: Int!) {
      escrows(
        where: {
          vaultAddress: $vaultAddress
          status: $status
        }
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        escrowId
        vaultAddress
        recipient
        tokenAddress
        amount
        escrowType
        approvalType
        title
        description
        status
        createdAt
        scheduledReleaseAt
        expiresAt
        metadataHash
        approvals {
          id
          escrowId
          approver
          approved
          timestamp
        }
      }
    }
  `

  const result = await executeGraphQLQuery<{ escrows: Escrow[] }>(query, {
    vaultAddress: vaultAddress.toLowerCase(),
    status,
    first,
    skip,
  })

  return result.escrows
}

/**
 * The Graph利用可否確認
 * @returns The Graph利用可否
 */
export const isSubgraphAvailable = (): boolean => {
  const subgraphUrl = import.meta.env.VITE_SUBGRAPH_URL
  return !!subgraphUrl
}

/**
 * エスクロー統計情報の取得
 * @param vaultAddress - Vaultコントラクトのアドレス
 */
export const getEscrowStats = async (
  vaultAddress: Address
): Promise<{
  totalCount: number
  pendingCount: number
  approvedCount: number
  releasedCount: number
  cancelledCount: number
  expiredCount: number
}> => {
  const query = `
    query GetEscrowStats($vaultAddress: String!) {
      escrowStats(id: $vaultAddress) {
        totalCount
        pendingCount
        approvedCount
        releasedCount
        cancelledCount
        expiredCount
      }
    }
  `

  const result = await executeGraphQLQuery<{
    escrowStats: {
      totalCount: number
      pendingCount: number
      approvedCount: number
      releasedCount: number
      cancelledCount: number
      expiredCount: number
    } | null
  }>(query, {
    vaultAddress: vaultAddress.toLowerCase(),
  })

  // データが存在しない場合は0で初期化
  return (
    result.escrowStats || {
      totalCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      releasedCount: 0,
      cancelledCount: 0,
      expiredCount: 0,
    }
  )
}
