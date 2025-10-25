# Family Wallet Subgraph デプロイメントガイド

## 概要

このドキュメントは、Family Wallet SubgraphをThe Graph Studioにデプロイする手順を説明します。

## 前提条件

### 1. コントラクトデプロイ完了
- EscrowRegistryコントラクトがBase Sepoliaにデプロイ済み
- コントラクトアドレスとデプロイブロック番号を取得済み

### 2. The Graph Studioアカウント
- https://thegraph.com/studio/ でアカウント作成済み
- Subgraphを作成し、Slug名を取得済み（例: `family-wallet`）

### 3. 環境変数設定
```bash
# .env ファイルを作成
cp .env.example .env

# The Graph Studio Deploy Keyを設定
GRAPH_DEPLOY_KEY=your-deploy-key-here
```

## デプロイ手順

### Step 1: subgraph.yaml の更新

コントラクトアドレスとデプロイブロック番号を更新します。

```yaml
dataSources:
  - kind: ethereum
    name: EscrowRegistry
    network: base-sepolia
    source:
      address: "0xYourDeployedContractAddress" # ← コントラクトアドレスに更新
      abi: EscrowRegistry
      startBlock: 12345678 # ← デプロイブロック番号に更新
```

**コントラクトアドレスとブロック番号の取得方法:**

```bash
# hardhatデプロイスクリプトから出力を確認
# または以下のコマンドで確認
cat ../outputs/contracts-base-sepolia.json
```

### Step 2: 依存関係のインストール

```bash
npm install
# または
pnpm install
```

### Step 3: コード生成

```bash
npm run codegen
```

このコマンドは以下を生成します:
- TypeScript型定義 (`generated/schema.ts`)
- コントラクトABI型定義 (`generated/EscrowRegistry/EscrowRegistry.ts`)

### Step 4: ビルド

```bash
npm run build
```

ビルド成果物は `build/` ディレクトリに生成されます。

### Step 5: The Graph Studio認証

```bash
# Deploy Keyで認証（The Graph Studioから取得）
graph auth --studio <YOUR_DEPLOY_KEY>
```

Deploy Keyの取得方法:
1. https://thegraph.com/studio/ にログイン
2. 作成したSubgraphを選択
3. 「Settings」→「Deploy Key」をコピー

### Step 6: デプロイ

```bash
# Slug名は The Graph Studio で作成したSubgraphの名前
npm run deploy

# または直接指定
graph deploy --studio family-wallet
```

初回デプロイ時は、バージョンラベルを入力するプロンプトが表示されます（例: `v0.0.1`）

### Step 7: デプロイ確認

デプロイ後、The Graph Studioで以下を確認:

1. **Indexing Status**: Subgraphが正常にインデックス中か確認
2. **Synced**: 最新ブロックまで同期されているか確認
3. **Playground**: GraphQLクエリをテスト

**サンプルクエリ:**

```graphql
{
  vaults(first: 5) {
    id
    vaultAddress
    createdAt
    escrows {
      id
      state
      amount
    }
  }

  globalStats(id: "0x676c6f62616c") {
    totalVaults
    totalEscrows
    totalApprovals
  }
}
```

## トラブルシューティング

### ビルドエラー: "Cannot find module"

**原因**: 依存関係が不足している

**解決策**:
```bash
npm install --force
npm run codegen
npm run build
```

### デプロイエラー: "Network not supported"

**原因**: ネットワーク名が不正

**解決策**: `subgraph.yaml` の `network` フィールドを確認
```yaml
network: base-sepolia  # 正しいネットワーク名
```

### インデックスエラー: "Failed to index from block X"

**原因**: `startBlock` が実際のデプロイブロックより前の可能性

**解決策**:
1. BaseScan でコントラクトのデプロイトランザクションを確認
2. 正しいブロック番号に更新
3. 再デプロイ

### クエリエラー: "Subgraph has not indexed any blocks"

**原因**: ブロックチェーンイベントがまだ発生していない

**解決策**:
1. フロントエンドからエスクロー作成などの操作を実行
2. 数分待ってから再度クエリ

## ローカルテスト（オプション）

ローカルのGraph Nodeでテストする場合:

```bash
# Graph NodeをDockerで起動
docker-compose up -d

# ローカルSubgraphを作成
npm run create-local

# ローカルにデプロイ
npm run deploy-local
```

## 更新とバージョン管理

### Subgraphの更新手順

1. コードを修正（schema.graphql または mapping.ts）
2. ビルド: `npm run build`
3. バージョンをインクリメント（例: v0.0.1 → v0.0.2）
4. デプロイ: `npm run deploy`

### ロールバック

The Graph Studioで以前のバージョンに戻すことが可能:
1. Studio の「Versions」タブを開く
2. ロールバックしたいバージョンを選択
3. 「Publish」をクリック

## デプロイ後の確認項目

- [ ] Subgraphが正常にインデックス中
- [ ] 最新ブロックまで同期完了
- [ ] サンプルクエリが正常に実行される
- [ ] エスクロー作成イベントが正しく記録される
- [ ] Vault統計が正確に計算される

## 参考リンク

- **The Graph Documentation**: https://thegraph.com/docs/
- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Subgraph Studio**: https://thegraph.com/studio/

## サポート

問題が発生した場合:
1. The Graph Discord: https://discord.gg/graphprotocol
2. GitHub Issues: [プロジェクトリポジトリ]
