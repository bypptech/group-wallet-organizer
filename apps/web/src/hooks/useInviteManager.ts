import { useState, useCallback } from 'react'
import type { Address } from 'viem'
import { useAccount, useSignTypedData, useChainId } from 'wagmi'
import { useQuery } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

/**
 * 招待情報の型定義
 */
export interface Invite {
  id: string
  vaultId: string  // Vault ID (database UUID)
  inviterAddress: Address
  role: 'owner' | 'guardian' | 'requester' | 'viewer'
  code: string
  expiresAt: number
  maxUses: number
  currentUses: number
  isActive: boolean
  createdAt: number
}

/**
 * 招待リンク生成オプション
 */
export interface InviteLinkOptions {
  role: 'owner' | 'guardian' | 'requester' | 'viewer'
  expiresIn?: number // 有効期限（秒）
  maxUses?: number // 最大使用回数
  // Payment fields for Shareable Keys
  paymentRequired?: boolean
  paymentAmount?: string // BigInt as string (USDC wei)
  paymentToken?: `0x${string}` // ERC20 token address
  paymentRecipient?: `0x${string}` // Payment destination address
}

/**
 * EIP-712 Domain定義を生成する関数
 */
const getEIP712Domain = (chainId: number) => ({
  name: 'Family Wallet',
  version: '1',
  chainId,
  verifyingContract: '0x0000000000000000000000000000000000000000' as const, // TODO: Update with deployed contract
})

/**
 * EIP-712 Types定義
 */
const INVITE_TYPES = {
  Invite: [
    { name: 'vaultId', type: 'string' },
    { name: 'role', type: 'string' },
    { name: 'weight', type: 'uint256' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'nonce', type: 'string' },
  ],
} as const

/**
 * 招待管理を行うカスタムフック
 * @param vaultId - Vault ID (database UUID from vaults.id)
 */
export const useInviteManager = (vaultId?: string) => {
  const { address, connector } = useAccount()
  const chainId = useChainId()
  const { signTypedDataAsync, signTypedData, error: signError, isError: isSignError, data: signData, status: signStatus } = useSignTypedData()

  console.log('useInviteManager initialized:', {
    address,
    chainId,
    vaultId,
    connector: connector?.name,
    signTypedDataAsyncAvailable: typeof signTypedDataAsync === 'function',
    signTypedDataAvailable: typeof signTypedData === 'function',
    signError,
    isSignError,
    signData,
    signStatus
  })

  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 招待コードを生成
   */
  const generateInviteCode = useCallback((): string => {
    // ランダムな8文字の招待コードを生成
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return code
  }, [])

  /**
   * 招待リンクを生成
   */
  const generateInviteLink = useCallback(
    (inviteCode: string): string => {
      const baseUrl = window.location.origin
      return `${baseUrl}/invite/shareable/${inviteCode}`
    },
    []
  )

  /**
   * QRコード用のデータを生成
   */
  const generateQRData = useCallback(
    (inviteCode: string): string => {
      return generateInviteLink(inviteCode)
    },
    [generateInviteLink]
  )

  /**
   * EIP-712署名付き招待を作成（API経由）
   */
  const createInviteWithSignature = useCallback(
    async (options: InviteLinkOptions & { weight?: number }): Promise<{ inviteToken: string; inviteLink: string; qrData: string } | null> => {
      console.log('createInviteWithSignature called with:', { address, vaultId, options })

      if (!address) {
        const error = new Error('Wallet not connected')
        setError(error)
        throw error
      }

      if (!vaultId) {
        const error = new Error('Vault ID not provided')
        setError(error)
        throw error
      }

      if (typeof vaultId !== 'string') {
        const error = new Error(`Invalid vault ID format: ${vaultId}`)
        setError(error)
        throw error
      }

      try {
        setIsGenerating(true)
        setError(null)

        // 有効期限を計算（秒単位のタイムスタンプ）
        const expiresAt = options.expiresIn
          ? Math.floor(Date.now() / 1000) + options.expiresIn
          : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // デフォルト7日

        // Nonce生成（ランダムな文字列）
        const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

        // EIP-712署名用のメッセージ
        const message = {
          vaultId: vaultId,
          role: options.role,
          weight: BigInt(options.weight || 1),
          expiresAt: BigInt(expiresAt),
          nonce,
        }

        // EIP-712署名を生成（現在のchainIdを使用）
        console.log('Attempting to sign with:', {
          domain: getEIP712Domain(chainId),
          types: INVITE_TYPES,
          primaryType: 'Invite',
          message,
        })

        // Direct MetaMask eth_signTypedData_v4 call
        console.log('=== SIGNATURE REQUEST DEBUG ===')
        console.log('window.ethereum exists:', !!window.ethereum)
        console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask)
        console.log('Current address:', address)
        console.log('chainId:', chainId)

        if (!window.ethereum) {
          throw new Error('MetaMask not found. Please install MetaMask extension.')
        }

        if (!window.ethereum.isMetaMask) {
          console.warn('window.ethereum exists but isMetaMask is false')
        }

        // BigInt を文字列に変換する replacer 関数
        const bigIntReplacer = (_key: string, value: any) => {
          return typeof value === 'bigint' ? value.toString() : value
        }

        const typedData = {
          domain: getEIP712Domain(chainId),
          types: INVITE_TYPES,
          primaryType: 'Invite',
          message,
        }

        console.log('Typed data to sign:', JSON.stringify(typedData, bigIntReplacer, 2))

        const typedDataString = JSON.stringify(typedData, bigIntReplacer)
        console.log('Typed data as string:', typedDataString)

        // Use MetaMask's eth_signTypedData_v4 directly
        let signature: string
        try {
          console.log('=== CALLING window.ethereum.request ===')
          console.log('Method: eth_signTypedData_v4')
          console.log('Params:', [address, typedDataString])

          const signPromise = window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [address, typedDataString],
          })

          console.log('Request sent, waiting for signature...')
          signature = await signPromise as string
          console.log('EIP-712 Signature obtained:', signature)
        } catch (signError) {
          console.error('=== SIGNATURE REQUEST FAILED ===')
          console.error('Error type:', signError?.constructor?.name)
          console.error('Error message:', signError instanceof Error ? signError.message : String(signError))
          console.error('Full error:', signError)

          if (signError instanceof Error && signError.message.includes('User rejected')) {
            throw new Error('Signature request was rejected by user')
          }
          throw new Error(`Failed to sign message: ${signError instanceof Error ? signError.message : 'Unknown error'}`)
        }

        // APIに招待作成リクエストを送信
        const response = await fetch(`${API_BASE_URL}/invites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vaultId: vaultId,
            role: options.role,
            weight: options.weight || 1,
            signature,
            expiresAt: new Date(expiresAt * 1000).toISOString(),
            createdBy: address,
            metadata: {
              nonce,
              maxUses: options.maxUses || 1,
            },
            // Payment fields for Shareable Keys
            paymentRequired: options.paymentRequired,
            paymentAmount: options.paymentAmount,
            paymentToken: options.paymentToken,
            paymentRecipient: options.paymentRecipient,
          }),
        })

        const contentType = response.headers.get('content-type')
        const isJson = contentType?.includes('application/json')

        if (!response.ok) {
          if (isJson) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to create invite: ${response.statusText}`)
          } else {
            const text = await response.text()
            throw new Error(`Failed to create invite: ${text.substring(0, 100)}`)
          }
        }

        if (!isJson) {
          const text = await response.text()
          throw new Error(`Expected JSON response but got: ${text.substring(0, 100)}`)
        }

        const data = await response.json()
        const inviteToken = data.invite?.token || data.token
        const inviteLink = generateInviteLink(inviteToken)
        const qrData = generateQRData(inviteToken)

        console.log('Invite created:', { inviteToken, inviteLink })

        return {
          inviteToken,
          inviteLink,
          qrData,
        }
      } catch (err) {
        console.error('=== Failed to create invite with signature ===')
        console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err)
        console.error('Error message:', err instanceof Error ? err.message : String(err))
        console.error('Full error:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        throw err
      } finally {
        setIsGenerating(false)
      }
    },
    [address, vaultId, chainId, generateInviteLink, generateQRData]
  )

  /**
   * 新しい招待を作成
   * TODO: Implement with direct wagmi writeContract when needed
   */
  const createInvite = useCallback(
    async (
      inviteManagerAddress: Address,
      inviteManagerAbi: any,
      options: InviteLinkOptions
    ): Promise<{ inviteCode: string; inviteLink: string } | null> => {
      console.warn('createInvite: Not implemented - AA Client removed')
      throw new Error('createInvite not implemented. Use createInviteWithSignature instead.')
    },
    []
  )

  /**
   * 招待を無効化
   * TODO: Implement with direct wagmi writeContract when needed
   */
  const revokeInvite = useCallback(
    async (
      inviteManagerAddress: Address,
      inviteManagerAbi: any,
      inviteCode: string
    ) => {
      console.warn('revokeInvite: Not implemented - AA Client removed')
      throw new Error('revokeInvite not implemented')
    },
    []
  )

  /**
   * 招待を使用してVaultに参加
   * TODO: Implement with direct wagmi writeContract when needed
   */
  const acceptInvite = useCallback(
    async (
      inviteManagerAddress: Address,
      inviteManagerAbi: any,
      inviteCode: string
    ) => {
      console.warn('acceptInvite: Not implemented - AA Client removed')
      throw new Error('acceptInvite not implemented')
    },
    []
  )

  /**
   * Vault の招待一覧を取得（API経由）
   */
  const fetchInvites = useCallback(async () => {
    if (!vaultId) {
      console.warn('Vault ID not provided')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // TODO: 実際のAPI実装時に置き換え
      // const response = await fetch(`/api/invites?vault=${vaultId}`)
      // const data = await response.json()
      // setInvites(data)

      console.warn('fetchInvites: API implementation required')
    } catch (err) {
      console.error('Failed to fetch invites:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [vaultId])

  return {
    invites,
    isLoading,
    isGenerating,
    error,
    createInvite,
    createInviteWithSignature,
    revokeInvite,
    acceptInvite,
    fetchInvites,
    generateInviteLink,
    generateQRData,
  }
}

/**
 * 招待コードの検証を行うカスタムフック
 */
export const useInviteValidator = () => {
  /**
   * 招待コードが有効かどうかを検証（API経由）
   */
  const validateInviteCode = useCallback(
    async (inviteCode: string): Promise<{ valid: boolean; error?: string }> => {
      try {
        // TODO: 実際のAPI実装時に置き換え
        // const response = await fetch(`/api/invites/validate?code=${inviteCode}`)
        // const data = await response.json()
        // return data

        console.warn('validateInviteCode: API implementation required')

        // 仮の実装
        if (inviteCode.length !== 8) {
          return { valid: false, error: 'Invalid invite code format' }
        }

        return { valid: true }
      } catch (err) {
        console.error('Failed to validate invite code:', err)
        return { valid: false, error: 'Validation failed' }
      }
    },
    []
  )

  /**
   * 招待コードのフォーマットを検証
   */
  const validateInviteFormat = useCallback((inviteCode: string): boolean => {
    // 8文字の英数字のみ
    return /^[A-Z0-9]{8}$/.test(inviteCode)
  }, [])

  return {
    validateInviteCode,
    validateInviteFormat,
  }
}

/**
 * QRコード生成を管理するカスタムフック
 */
export const useQRCodeGenerator = () => {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * QRコードデータを生成
   */
  const generateQRCode = useCallback(async (data: string): Promise<string> => {
    try {
      setIsGenerating(true)

      // QRコードライブラリを動的インポート
      // TODO: qrcode ライブラリのインストールと実装
      // const QRCode = await import('qrcode')
      // const qrDataUrl = await QRCode.toDataURL(data)
      // setQrCodeData(qrDataUrl)
      // return qrDataUrl

      console.warn('generateQRCode: qrcode library implementation required')

      // 仮の実装
      const mockQRData = `data:image/png;base64,${btoa(data)}`
      setQrCodeData(mockQRData)
      return mockQRData
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  /**
   * QRコードをクリア
   */
  const clearQRCode = useCallback(() => {
    setQrCodeData(null)
  }, [])

  return {
    qrCodeData,
    isGenerating,
    generateQRCode,
    clearQRCode,
  }
}

/**
 * 招待履歴を管理するカスタムフック
 * @param vaultId - Vault ID (database UUID from vaults.id)
 */
export const useInviteHistory = (vaultId?: string) => {
  const [history, setHistory] = useState<
    Array<{
      timestamp: number
      action: 'create' | 'accept' | 'revoke'
      inviteCode: string
      role: string
      user?: Address
    }>
  >([])

  /**
   * 履歴エントリを追加
   */
  const addHistoryEntry = useCallback(
    (
      action: 'create' | 'accept' | 'revoke',
      inviteCode: string,
      role: string,
      user?: Address
    ) => {
      setHistory((prev) => [
        {
          timestamp: Date.now(),
          action,
          inviteCode,
          role,
          user,
        },
        ...prev,
      ])
    },
    []
  )

  /**
   * 履歴をクリア
   */
  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  /**
   * 履歴を取得（API経由）
   */
  const fetchHistory = useCallback(async () => {
    if (!vaultId) {
      console.warn('Vault ID not provided')
      return
    }

    try {
      // TODO: 実際のAPI実装時に置き換え
      // const response = await fetch(`/api/invites/history?vault=${vaultId}`)
      // const data = await response.json()
      // setHistory(data)

      console.warn('fetchHistory: API implementation required')
    } catch (err) {
      console.error('Failed to fetch invite history:', err)
    }
  }, [vaultId])

  return {
    history,
    addHistoryEntry,
    clearHistory,
    fetchHistory,
  }
}

/**
 * Fetch pending invites for a vault
 */
export const usePendingInvites = (vaultId?: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pending-invites', vaultId],
    queryFn: async () => {
      if (!vaultId) throw new Error('Vault ID is required');

      const response = await fetch(`${API_BASE_URL}/invites/by-vault/${vaultId}?includeExpired=false&includeUsed=false`);

      if (!response.ok) {
        throw new Error('Failed to fetch pending invites');
      }

      const data = await response.json();
      return data.invites || [];
    },
    enabled: !!vaultId,
    retry: false,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const revokeInvite = async (inviteId: string) => {
    const response = await fetch(`${API_BASE_URL}/invites/${inviteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to revoke invite');
    }

    // Refetch the list after revoking
    refetch();
  };

  return {
    invites: data || [],
    isLoading,
    error,
    refetch,
    revokeInvite,
  };
};
