# Family Wallet Subgraph クイックスタート

## 🚀 デプロイ手順（3ステップ）

### Step 1: The Graph Studioでアカウント作成

1. https://thegraph.com/studio/ にアクセス
2. MetaMaskでサインイン
3. 「Create a Subgraph」をクリック
4. Subgraph名を入力: `family-wallet`
5. 「Settings」タブから「Deploy Key」をコピー

### Step 2: 環境変数を設定

プロジェクトルートの `.env` ファイルを開き、以下を設定：

```bash
# The Graph Studio Deploy Key（Step 1でコピーしたキー）
GRAPH_DEPLOY_KEY=your-deploy-key-here

# Subgraph Slug（Step 1で作成した名前）
GRAPH_SUBGRAPH_SLUG=family-wallet
```

### Step 3: デプロイ実行

```bash
cd family-wallet-subgraph
./deploy.sh
```

デプロイスクリプトが以下を自動実行します：
- ✅ The Graph Studioへの認証
- ✅ コード生成 (`npm run codegen`)
- ✅ ビルド (`npm run build`)
- ✅ デプロイ (`graph deploy --studio`)

## 📊 デプロイ後の確認

### The Graph Studioで確認

1. https://thegraph.com/studio/ にアクセス
2. デプロイしたSubgraphを選択
3. 以下を確認：
   - **Indexing Status**: `Synced` になっているか
   - **Current Version**: デプロイしたバージョンが表示されているか
   - **Health**: `Healthy` になっているか

### GraphQL Playgroundでクエリテスト

The Graph Studioの「Playground」タブで以下のクエリを実行：

```graphql
{
  # Vault一覧を取得
  vaults(first: 5) {
    id
    vaultAddress
    createdAt
    escrowCount
    escrows(first: 3) {
      id
      state
      amount
      recipient
    }
  }

  # グローバル統計を取得
  globalStats(id: "0x676c6f62616c") {
    totalVaults
    totalEscrows
    totalApprovals
    totalReleased
  }
}
```

## 🔗 デプロイ済みコントラクト情報

| コントラクト | アドレス | ネットワーク |
|------------|---------|-------------|
| EscrowRegistry | `0x636b998315e77408806CccFCC93af4D1179afc2f` | Base Sepolia |
| startBlock | `31894658` | - |

## 📝 フロントエンドで使用する

デプロイ後、The Graph Studioで「Query URL」をコピーし、`.env` に設定：

```bash
# The Graph Studio Query URL
FAMILY_SUBGRAPH_URL=https://api.studio.thegraph.com/query/xxxxx/family-wallet/v0.0.1

# フロントエンド用（パブリック）
NEXT_PUBLIC_FAMILY_SUBGRAPH_URL=https://api.studio.thegraph.com/query/xxxxx/family-wallet/v0.0.1
```

フロントエンドでの使用例：

```typescript
// apps/web/src/lib/graphql.ts
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient(
  process.env.NEXT_PUBLIC_FAMILY_SUBGRAPH_URL!
)

export async function getVaults() {
  const query = `
    query GetVaults {
      vaults(first: 10) {
        id
        vaultAddress
        escrows {
          id
          state
          amount
        }
      }
    }
  `
  return client.request(query)
}
```

## 🔄 Subgraphの更新

コード変更後、再デプロイする場合：

```bash
cd family-wallet-subgraph
./deploy.sh
```

バージョンラベルを入力するプロンプトが表示されます（例: `v0.0.2`）

## ❓ トラブルシューティング

### "GRAPH_DEPLOY_KEY is not set"

**原因**: `.env` ファイルに `GRAPH_DEPLOY_KEY` が設定されていない

**解決策**:
1. The Graph Studio の「Settings」から Deploy Key をコピー
2. `.env` に `GRAPH_DEPLOY_KEY=<your-key>` を追加

### "Subgraph has not indexed any blocks"

**原因**: ブロックチェーン上でイベントがまだ発生していない

**解決策**:
1. フロントエンドからエスクローを作成
2. 数分待ってから再度クエリ

### "Network not supported"

**原因**: `subgraph.yaml` の network 設定が不正

**解決策**:
- `network: base-sepolia` が正しく設定されているか確認

## 📚 参考リンク

- **The Graph Documentation**: https://thegraph.com/docs/
- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Subgraph Studio**: https://thegraph.com/studio/
- **詳細ガイド**: [DEPLOYMENT.md](./DEPLOYMENT.md)
