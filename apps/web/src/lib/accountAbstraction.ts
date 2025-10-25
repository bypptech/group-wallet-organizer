import { type SmartAccountClient } from 'permissionless'
import { type Chain, type Transport, type Account } from 'viem'

/**
 * Account Abstraction (ERC-4337) 関連のヘルパー関数
 */

/**
 * UserOperation を作成するための基本設定
 */
export interface UserOperationConfig {
  target: `0x${string}`
  value: bigint
  data: `0x${string}`
}

/**
 * SmartAccountClient の型エイリアス
 */
export type AaClient = SmartAccountClient<
  Transport,
  Chain,
  Account
>

/**
 * UserOperation を生成するためのヘルパー
 *
 * @param client SmartAccountClient インスタンス
 * @param config UserOperation の設定
 * @returns UserOperation のハッシュ
 */
export async function sendUserOperation(
  client: AaClient,
  config: UserOperationConfig
): Promise<`0x${string}`> {
  const userOpHash = await client.sendUserOperation({
    calls: [
      {
        to: config.target,
        value: config.value,
        data: config.data,
      },
    ],
  })

  return userOpHash
}

/**
 * UserOperation の実行を待機する
 *
 * @param client SmartAccountClient インスタンス
 * @param userOpHash UserOperation のハッシュ
 * @returns トランザクションレシート
 */
export async function waitForUserOperation(
  client: AaClient,
  userOpHash: `0x${string}`
) {
  const receipt = await client.waitForUserOperationReceipt({
    hash: userOpHash,
  })

  return receipt
}

/**
 * バッチ UserOperation を送信する
 *
 * @param client SmartAccountClient インスタンス
 * @param operations 複数の UserOperation 設定
 * @returns UserOperation のハッシュ
 */
export async function sendBatchUserOperations(
  client: AaClient,
  operations: UserOperationConfig[]
): Promise<`0x${string}`> {
  const userOpHash = await client.sendUserOperation({
    calls: operations.map(op => ({
      to: op.target,
      value: op.value,
      data: op.data,
    })),
  })

  return userOpHash
}

/**
 * スマートアカウントのアドレスを取得
 *
 * @param client SmartAccountClient インスタンス
 * @returns スマートアカウントのアドレス
 */
export function getSmartAccountAddress(client: AaClient): `0x${string}` {
  return client.account.address
}

/**
 * Paymaster を使用した UserOperation を送信
 * (Paymaster 統合後に実装)
 */
export async function sendSponsoredUserOperation(
  client: AaClient,
  config: UserOperationConfig
): Promise<`0x${string}`> {
  // TODO: Paymaster クライアント統合後に実装
  throw new Error('Paymaster integration not yet implemented')
}
