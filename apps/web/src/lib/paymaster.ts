// Pimlico Paymaster クライアントは一時的に無効化
import { type Chain, type Transport, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { entryPoint07Address } from 'viem/account-abstraction'
import type { UserOperation } from 'permissionless'

/**
 * Paymaster クライアント設定
 * ガススポンサーシップを提供するためのクライアント
 */

/**
 * Paymaster RPCエンドポイントの取得
 */
export const getPaymasterUrl = (chainId: number): string => {
  const paymasterUrl = import.meta.env.VITE_PAYMASTER_RPC_URL

  if (!paymasterUrl) {
    throw new Error(
      'VITE_PAYMASTER_RPC_URL が設定されていません。Paymasterを使用するには環境変数を設定してください。'
    )
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
 * Paymaster Clientの作成
 * @param chainId - ネットワークID
 */
export const createPaymasterClient = (
  _chainId: number
): never => {
  throw new Error('Paymaster client is temporarily disabled')
}

/**
 * ガススポンサーシップのリクエスト
 * @param chainId - ネットワークID
 * @param userOperation - UserOperation
 */
export const sponsorUserOperation = async (
  chainId: number,
  userOperation: UserOperation
): Promise<UserOperation> => {
  try {
    throw new Error('Paymaster sponsorship is temporarily disabled')
  } catch (error) {
    console.error('Failed to sponsor UserOperation:', error)
    throw error
  }
}

/**
 * ガス価格の見積もり
 * @param chainId - ネットワークID
 * @param userOperation - UserOperation
 */
export const estimateGas = async (
  chainId: number,
  userOperation: Partial<UserOperation>
): Promise<{
  preVerificationGas: bigint
  verificationGasLimit: bigint
  callGasLimit: bigint
}> => {
  try {
    throw new Error('Paymaster gas estimation is temporarily disabled')
  } catch (error) {
    console.error('Failed to estimate gas:', error)
    throw error
  }
}

/**
 * Paymasterの残高確認
 * @param chainId - ネットワークID
 */
export const checkPaymasterBalance = async (
  chainId: number
): Promise<bigint> => {
  try {
    throw new Error('Paymaster balance check is temporarily disabled')
  } catch (error) {
    console.error('Failed to check Paymaster balance:', error)
    throw error
  }
}

/**
 * Paymasterポリシーの検証
 * @param chainId - ネットワークID
 * @param userOperation - UserOperation
 * @returns スポンサー可否
 */
export const validatePaymasterPolicy = async (
  chainId: number,
  userOperation: UserOperation
): Promise<boolean> => {
  try {
    // Paymasterポリシーの検証ロジック
    // 例: 特定のコントラクトのみスポンサー、金額制限など

    // ここでは仮の実装として常にtrueを返す
    console.log('Validating Paymaster policy for UserOperation')

    // 実際の実装では、以下のようなチェックを行う:
    // - 送信先コントラクトがホワイトリストに含まれているか
    // - トランザクション金額が制限内か
    // - ユーザーが許可リストに含まれているか
    // - 1日あたりのスポンサー回数制限を超えていないか

    return true
  } catch (error) {
    console.error('Failed to validate Paymaster policy:', error)
    return false
  }
}

/**
 * Paymasterの利用可否確認
 * @returns Paymaster利用可否
 */
export const isPaymasterAvailable = (): boolean => {
  const paymasterUrl = import.meta.env.VITE_PAYMASTER_RPC_URL
  return !!paymasterUrl
}
