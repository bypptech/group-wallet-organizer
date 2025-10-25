import { createPublicClient, http, type Chain, type Transport } from 'viem'
import { base, baseSepolia } from 'viem/chains'

/**
 * Bundler クライアント関連の設定とヘルパー
 */

/**
 * Bundler エンドポイント URL を環境変数から取得
 */
export const getBundlerUrl = (chainId: number): string => {
  const bundlerUrl = import.meta.env.VITE_BUNDLER_RPC_URL

  if (!bundlerUrl) {
    console.warn('VITE_BUNDLER_RPC_URL が設定されていません。デフォルトRPCを使用します。')
    // フォールバック: 通常のRPCエンドポイントを使用
    return chainId === base.id
      ? `https://mainnet.base.org`
      : `https://sepolia.base.org`
  }

  return bundlerUrl
}

/**
 * Bundler 用の Public Client を作成
 *
 * @param chain 対象チェーン (base または baseSepolia)
 * @returns Public Client インスタンス
 */
export function createBundlerClient(chain: Chain) {
  const bundlerUrl = getBundlerUrl(chain.id)

  return createPublicClient({
    chain,
    transport: http(bundlerUrl),
  })
}

/**
 * UserOperation の状態を取得する
 *
 * @param chainId チェーンID
 * @param userOpHash UserOperation のハッシュ
 * @returns UserOperation の状態情報
 */
export async function getUserOperationStatus(
  chainId: number,
  userOpHash: `0x${string}`
) {
  const chain = chainId === base.id ? base : baseSepolia
  const client = createBundlerClient(chain)

  try {
    // Bundler API を使用して UserOperation の状態を取得
    // eth_getUserOperationReceipt を呼び出す
    const receipt = await client.request({
      method: 'eth_getUserOperationReceipt',
      params: [userOpHash],
    } as any)

    return receipt
  } catch (error) {
    console.error('UserOperation status fetch error:', error)
    throw error
  }
}

/**
 * Bundler がサポートするチェーンIDのリスト
 */
export const SUPPORTED_BUNDLER_CHAINS = [base.id, baseSepolia.id]

/**
 * 指定されたチェーンが Bundler でサポートされているかチェック
 *
 * @param chainId チェーンID
 * @returns サポートされている場合 true
 */
export function isSupportedBundlerChain(chainId: number): boolean {
  return SUPPORTED_BUNDLER_CHAINS.includes(chainId)
}

/**
 * Bundler の接続状態をチェック
 *
 * @param chainId チェーンID
 * @returns 接続可能な場合 true
 */
export async function checkBundlerConnection(chainId: number): Promise<boolean> {
  try {
    const chain = chainId === base.id ? base : baseSepolia
    const client = createBundlerClient(chain)

    // eth_chainId を呼び出して接続確認
    await client.getChainId()
    return true
  } catch (error) {
    console.error('Bundler connection check failed:', error)
    return false
  }
}
