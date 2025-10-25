import { createSmartAccountClient, type SmartAccountClient } from 'permissionless'
import { toSimpleSmartAccount } from 'permissionless/accounts'
import { type Chain, type Transport, type Address, http, createPublicClient, type WalletClient } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { entryPoint07Address } from 'viem/account-abstraction'

/**
 * Account Abstraction クライアント設定
 * ERC-4337のUserOperationを生成・送信するためのクライアント
 */

/**
 * Bundler RPCエンドポイントの取得
 */
export const getBundlerUrl = (chainId: number): string => {
  const bundlerUrl = import.meta.env.VITE_BUNDLER_RPC_URL

  if (!bundlerUrl) {
    console.warn('VITE_BUNDLER_RPC_URL が設定されていません。デフォルトRPCを使用します。')
    return chainId === base.id
      ? `https://mainnet.base.org`
      : `https://sepolia.base.org`
  }

  return bundlerUrl
}

/**
 * Paymaster RPCエンドポイントの取得
 */
export const getPaymasterUrl = (chainId: number): string => {
  const paymasterUrl = import.meta.env.VITE_PAYMASTER_RPC_URL

  if (!paymasterUrl) {
    console.warn('VITE_PAYMASTER_RPC_URL が設定されていません。Paymasterは使用できません。')
    return ''
  }

  return paymasterUrl
}

/**
 * チェーン設定の取得
 */
export const getChain = (chainId: number): Chain => {
  switch (chainId) {
    case base.id:
      return base
    case baseSepolia.id:
      return baseSepolia
    default:
      console.warn(`Unknown chainId: ${chainId}, falling back to Base Sepolia`)
      return baseSepolia
  }
}

/**
 * Smart Account Clientの作成
 * @param walletClient - wagmiのWalletClient
 * @param chainId - ネットワークID
 */
export const createAaClient = async (
  walletClient: WalletClient,
  chainId: number
): Promise<SmartAccountClient<Transport, Chain, any>> => {
  if (!walletClient.account) {
    throw new Error('Wallet client does not have an account')
  }

  const chain = getChain(chainId)
  const bundlerUrl = getBundlerUrl(chainId)
  const paymasterUrl = getPaymasterUrl(chainId)

  // Public client for reading blockchain state
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  // Bundler client は使用せず、bundlerTransport に直接 transport を渡す

  // Paymaster client は未対応
  const paymasterClient = undefined

  // Convert EOA wallet to Smart Account
  const simpleSmartAccount = await toSimpleSmartAccount({
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7',
    },
    owner: walletClient.account,
  })

  // Create Smart Account Client with UserOperation capabilities
  const smartAccountClient = createSmartAccountClient({
    account: simpleSmartAccount,
    chain,
    bundlerTransport: http(bundlerUrl),
    // middleware: {} // Paymaster未使用
  })

  return smartAccountClient
}

/**
 * UserOperation送信のヘルパー関数
 * @param client - Smart Account Client
 * @param to - 送信先アドレス
 * @param data - トランザクションデータ
 * @param value - 送信する値（オプション）
 */
export const sendUserOperation = async (
  client: SmartAccountClient<Transport, Chain, any>,
  to: Address,
  data: `0x${string}`,
  value: bigint = 0n
): Promise<`0x${string}`> => {
  try {
    const userOpHash = await client.sendUserOperation({
      calls: [
        {
          to,
          data,
          value,
        },
      ],
    })

    console.log('UserOperation submitted:', userOpHash)

    // Wait for the UserOperation to be included in a block
    const receipt = await client.waitForUserOperationReceipt({
      hash: userOpHash,
    })

    console.log('UserOperation receipt:', receipt)

    return receipt.receipt.transactionHash
  } catch (error) {
    console.error('Failed to send UserOperation:', error)
    throw error
  }
}

/**
 * バッチUserOperation送信のヘルパー関数
 * @param client - Smart Account Client
 * @param calls - 複数のコール
 */
export const sendBatchUserOperation = async (
  client: SmartAccountClient<Transport, Chain, any>,
  calls: Array<{
    to: Address
    data: `0x${string}`
    value?: bigint
  }>
): Promise<`0x${string}`> => {
  try {
    const userOpHash = await client.sendUserOperation({
      calls: calls.map((call) => ({
        to: call.to,
        data: call.data,
        value: call.value || 0n,
      })),
    })

    console.log('Batch UserOperation submitted:', userOpHash)

    const receipt = await client.waitForUserOperationReceipt({
      hash: userOpHash,
    })

    console.log('Batch UserOperation receipt:', receipt)

    return receipt.receipt.transactionHash
  } catch (error) {
    console.error('Failed to send batch UserOperation:', error)
    throw error
  }
}

/**
 * Smart Accountアドレスの取得
 * @param walletClient - wagmiのWalletClient
 * @param chainId - ネットワークID
 */
export const getSmartAccountAddress = async (
  walletClient: WalletClient,
  chainId: number
): Promise<Address> => {
  const client = await createAaClient(walletClient, chainId)
  return client.account.address
}
