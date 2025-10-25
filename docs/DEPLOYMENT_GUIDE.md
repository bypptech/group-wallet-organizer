# Deployment Guide - Family Wallet

このガイドでは、Family Walletのスマートコントラクトをデプロイする手順を説明します。

## 前提条件

1. **環境変数の設定** (.env ファイル)
   - `PRIVATE_KEY`: デプロイ用のウォレットの秘密鍵
   - `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC URL (デフォルト: https://sepolia.base.org)
   - `BASESCAN_API_KEY`: Basescan API Key (コントラクト検証用)

2. **テストネットETHの取得**
   - デプロイには Gas Fee が必要です
   - 以下のFaucetから Base Sepolia ETH を取得してください:
     - **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
     - **Coinbase Faucet**: https://portal.cdp.coinbase.com/products/faucet
   - デプロイアカウント: `0x1cEF170132c776380c1575eC18aA0cfBDE497033`
   - 必要量の目安: 約 0.01 ETH

## デプロイ手順

### 1. コントラクトのコンパイル

```bash
npm run compile
```

### 2. Base Sepolia へのデプロイ

デプロイスクリプトを実行:

```bash
bash scripts/deploy-contracts.sh
```

または、直接実行:

```bash
npx hardhat run scripts/deploy-escrow.cjs --network baseSepolia
```

### 3. デプロイされるコントラクト

以下の5つのコントラクトがデプロイされます:

1. **EscrowRegistry**: エスクロー管理のメインコントラクト
2. **PolicyManager**: ポリシー管理モジュール
3. **RoleVerifier**: ロール検証モジュール
4. **GuardianModule**: Guardian機能・リカバリ機能
5. **ERC20Paymaster**: ERC20トークンによるガス代スポンサー

### 4. デプロイ結果の確認

デプロイが成功すると、以下のファイルにアドレスが保存されます:

```
deployments/base-sepolia.json
```

ファイル形式:

```json
{
  "network": "baseSepolia",
  "chainId": 84532,
  "contracts": {
    "EscrowRegistry": "0x...",
    "PolicyManager": "0x...",
    "RoleVerifier": "0x...",
    "GuardianModule": "0x...",
    "ERC20Paymaster": "0x..."
  },
  "deployer": "0x1cEF170132c776380c1575eC18aA0cfBDE497033",
  "timestamp": "2025-10-03T..."
}
```

## デプロイ後の設定

### 1. フロントエンドのコントラクトアドレス更新

`apps/web/src/lib/contracts.ts` を更新:

```typescript
export const ESCROW_REGISTRY_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '<デプロイされたアドレス>' as `0x${string}`,
} as const

export const POLICY_MANAGER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '<デプロイされたアドレス>' as `0x${string}`,
} as const

export const ROLE_VERIFIER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '<デプロイされたアドレス>' as `0x${string}`,
} as const

export const GUARDIAN_MODULE_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '<デプロイされたアドレス>' as `0x${string}`,
} as const

export const ERC20_PAYMASTER_ADDRESS = {
  [base.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  [baseSepolia.id]: '<デプロイされたアドレス>' as `0x${string}`,
} as const
```

### 2. Subgraph 設定の更新

`family-wallet-subgraph/subgraph.yaml` を更新:

```yaml
dataSources:
  - kind: ethereum/contract
    name: EscrowRegistry
    network: base-sepolia
    source:
      address: "<EscrowRegistry のアドレス>"
      abi: EscrowRegistry
      startBlock: <デプロイされたブロック番号>
    # ...
```

### 3. コントラクトの検証 (Basescan)

デプロイ後、Basescan でコントラクトを検証:

```bash
# EscrowRegistry
npx hardhat verify --network baseSepolia <EscrowRegistry_ADDRESS>

# PolicyManager
npx hardhat verify --network baseSepolia <PolicyManager_ADDRESS>

# RoleVerifier
npx hardhat verify --network baseSepolia <RoleVerifier_ADDRESS>

# GuardianModule
npx hardhat verify --network baseSepolia <GuardianModule_ADDRESS>

# ERC20Paymaster
npx hardhat verify --network baseSepolia <ERC20Paymaster_ADDRESS>
```

検証が成功すると、Basescan上でソースコードが公開されます:
https://sepolia.basescan.org/

### 4. Subgraph のデプロイ

Subgraph をデプロイ (詳細は `family-wallet-subgraph/DEPLOYMENT.md` 参照):

```bash
cd family-wallet-subgraph
npm run deploy
```

## トラブルシューティング

### Insufficient funds エラー

```
ProviderError: insufficient funds for gas * price + value
```

→ Base Sepolia Faucet から ETH を取得してください

### Compilation error

```
Error HH600: Compilation failed
```

→ `npm run compile` を実行してコンパイルエラーを確認

### Network connection error

```
Error: could not detect network
```

→ `BASE_SEPOLIA_RPC_URL` が正しく設定されているか確認

## 参考リンク

- **Base Sepolia Block Explorer**: https://sepolia.basescan.org/
- **Base Sepolia Faucet**: https://www.alchemy.com/faucets/base-sepolia
- **Hardhat Documentation**: https://hardhat.org/docs
- **The Graph Documentation**: https://thegraph.com/docs/

## 現在の状態

✅ デプロイスクリプト準備完了
❌ Base Sepolia ETH 取得待ち（デプロイアカウント: `0x1cEF170132c776380c1575eC18aA0cfBDE497033`）

デプロイアカウントに 0.01 ETH 以上を送信後、再度デプロイスクリプトを実行してください。
