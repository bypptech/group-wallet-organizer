import { useState, useCallback, useEffect } from 'react'
import { useWalletClient, useChainId } from 'wagmi'
import { createAaClient, sendUserOperation, sendBatchUserOperation, getSmartAccountAddress } from '@/lib/aa-client'
import type { SmartAccountClient } from 'permissionless'
import type { Chain, Transport, Address } from 'viem'

/**
 * Account Abstraction クライアントを管理するカスタムフック
 * Smart Accountの操作とUserOperationの送信を提供
 */
export const useAaClient = () => {
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()

  const [aaClient, setAaClient] = useState<SmartAccountClient<Transport, Chain, any> | null>(null)
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * AA Clientの初期化
   */
  const initializeAaClient = useCallback(async () => {
    if (!walletClient) {
      setError(new Error('Wallet client not available'))
      return
    }

    try {
      setIsInitializing(true)
      setError(null)

      const client = await createAaClient(walletClient, chainId)
      setAaClient(client)

      const address = client.account.address
      setSmartAccountAddress(address)

      console.log('AA Client initialized:', {
        smartAccountAddress: address,
        chainId,
      })
    } catch (err) {
      console.error('Failed to initialize AA Client:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setAaClient(null)
      setSmartAccountAddress(null)
    } finally {
      setIsInitializing(false)
    }
  }, [walletClient, chainId])

  /**
   * Smart Accountアドレスの取得
   */
  const getAddress = useCallback(async (): Promise<Address | null> => {
    if (!walletClient) {
      console.warn('Wallet client not available')
      return null
    }

    try {
      const address = await getSmartAccountAddress(walletClient, chainId)
      setSmartAccountAddress(address)
      return address
    } catch (err) {
      console.error('Failed to get smart account address:', err)
      return null
    }
  }, [walletClient, chainId])

  /**
   * UserOperationの送信
   */
  const sendTransaction = useCallback(
    async (
      to: Address,
      data: `0x${string}`,
      value: bigint = 0n
    ): Promise<`0x${string}` | null> => {
      if (!aaClient) {
        throw new Error('AA Client not initialized. Call initializeAaClient first.')
      }

      try {
        const txHash = await sendUserOperation(aaClient, to, data, value)
        console.log('Transaction sent:', txHash)
        return txHash
      } catch (err) {
        console.error('Failed to send transaction:', err)
        throw err
      }
    },
    [aaClient]
  )

  /**
   * バッチUserOperationの送信
   */
  const sendBatchTransaction = useCallback(
    async (
      calls: Array<{
        to: Address
        data: `0x${string}`
        value?: bigint
      }>
    ): Promise<`0x${string}` | null> => {
      if (!aaClient) {
        throw new Error('AA Client not initialized. Call initializeAaClient first.')
      }

      try {
        const txHash = await sendBatchUserOperation(aaClient, calls)
        console.log('Batch transaction sent:', txHash)
        return txHash
      } catch (err) {
        console.error('Failed to send batch transaction:', err)
        throw err
      }
    },
    [aaClient]
  )

  /**
   * コントラクトメソッドの呼び出し
   */
  const writeContract = useCallback(
    async (
      contractAddress: Address,
      abi: any,
      functionName: string,
      args: any[] = [],
      value: bigint = 0n
    ): Promise<`0x${string}` | null> => {
      if (!aaClient) {
        throw new Error('AA Client not initialized. Call initializeAaClient first.')
      }

      try {
        // ABIから関数シグネチャを見つけてエンコード
        const functionAbi = abi.find(
          (item: any) => item.type === 'function' && item.name === functionName
        )

        if (!functionAbi) {
          throw new Error(`Function ${functionName} not found in ABI`)
        }

        // viem の encodeFunctionData を使用してデータをエンコード
        const { encodeFunctionData } = await import('viem')
        const data = encodeFunctionData({
          abi: [functionAbi],
          functionName,
          args,
        })

        return await sendTransaction(contractAddress, data, value)
      } catch (err) {
        console.error('Failed to write contract:', err)
        throw err
      }
    },
    [aaClient, sendTransaction]
  )

  /**
   * バッチコントラクト呼び出し
   */
  const writeBatchContract = useCallback(
    async (
      calls: Array<{
        contractAddress: Address
        abi: any
        functionName: string
        args?: any[]
        value?: bigint
      }>
    ): Promise<`0x${string}` | null> => {
      if (!aaClient) {
        throw new Error('AA Client not initialized. Call initializeAaClient first.')
      }

      try {
        const { encodeFunctionData } = await import('viem')

        const encodedCalls = calls.map((call) => {
          const functionAbi = call.abi.find(
            (item: any) => item.type === 'function' && item.name === call.functionName
          )

          if (!functionAbi) {
            throw new Error(`Function ${call.functionName} not found in ABI`)
          }

          const data = encodeFunctionData({
            abi: [functionAbi],
            functionName: call.functionName,
            args: call.args || [],
          })

          return {
            to: call.contractAddress,
            data,
            value: call.value || 0n,
          }
        })

        return await sendBatchTransaction(encodedCalls)
      } catch (err) {
        console.error('Failed to write batch contract:', err)
        throw err
      }
    },
    [aaClient, sendBatchTransaction]
  )

  /**
   * AA Clientの状態をリセット
   */
  const reset = useCallback(() => {
    setAaClient(null)
    setSmartAccountAddress(null)
    setError(null)
  }, [])

  /**
   * ウォレット変更時に自動初期化
   */
  useEffect(() => {
    if (walletClient && !aaClient && !isInitializing) {
      initializeAaClient()
    }
  }, [walletClient, aaClient, isInitializing, initializeAaClient])

  /**
   * チェーン変更時にリセット
   */
  useEffect(() => {
    if (aaClient) {
      reset()
    }
  }, [chainId])

  return {
    // State
    aaClient,
    smartAccountAddress,
    isInitializing,
    error,
    isReady: !!aaClient && !!smartAccountAddress,

    // Methods
    initializeAaClient,
    getAddress,
    sendTransaction,
    sendBatchTransaction,
    writeContract,
    writeBatchContract,
    reset,
  }
}

/**
 * Smart Accountの情報を取得するカスタムフック
 */
export const useSmartAccountInfo = () => {
  const { smartAccountAddress, isReady, getAddress } = useAaClient()
  const [isLoading, setIsLoading] = useState(false)

  const refreshAddress = useCallback(async () => {
    setIsLoading(true)
    try {
      await getAddress()
    } finally {
      setIsLoading(false)
    }
  }, [getAddress])

  return {
    address: smartAccountAddress,
    isReady,
    isLoading,
    refreshAddress,
  }
}
