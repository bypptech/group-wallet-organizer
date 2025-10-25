# Family Wallet Subgraph

Family Walletプロジェクトのための[The Graph](https://thegraph.com/)サブグラフです。
EscrowRegistryコントラクトのイベントをインデックス化し、GraphQL APIを提供します。

## 概要

このサブグラフは以下のエンティティをトラッキングします：

- **Vault**: MultiOwnable AA Walletのインスタンス
- **Escrow**: エスクロートランザクション（お小遣い、請求書支払い等）
- **Approval**: エスクローの承認
- **TimelineEvent**: すべてのイベントのタイムライン
- **VaultStats**: Vault毎の統計情報
- **GlobalStats**: グローバル統計情報
- **DailyStats**: 日次統計情報

## セットアップ

### 前提条件

```bash
npm install -g @graphprotocol/graph-cli
```

### 依存関係のインストール

```bash
npm install
```

### 設定

1. `subgraph.yaml`を編集してコントラクトアドレスとstartBlockを設定：

```yaml
source:
  address: "0xYourContractAddress" # デプロイされたEscrowRegistryアドレス
  startBlock: 12345678 # デプロイメントブロック番号
```

2. `.env`ファイルを作成してThe Graph API Keyを設定：

```bash
FAMILY_SUBGRAPH_API_KEY=your-api-key-here
```

## ビルド

### 型生成

```bash
npm run codegen
```

### ビルド

```bash
npm run build
```

## デプロイ

### The Graph Studioへのデプロイ

```bash
npm run deploy
```

### ローカルGraph Nodeへのデプロイ

1. ローカルGraph Nodeを起動

2. サブグラフを作成：

```bash
npm run create-local
```

3. デプロイ：

```bash
npm run deploy-local
```

## クエリ例

### すべてのエスクローを取得

```graphql
query {
  escrows(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    escrowId
    vaultAddress
    requester
    recipient
    tokenAddress
    amount
    state
    createdAt
  }
}
```

### Vault毎のエスクローを取得

```graphql
query GetVaultEscrows($vaultAddress: Bytes!) {
  escrows(where: { vaultAddress: $vaultAddress }) {
    id
    escrowId
    recipient
    amount
    state
    approvals {
      approver
      timestamp
    }
  }
}
```

### タイムラインイベントを取得

```graphql
query GetTimeline($escrowId: BigInt!) {
  timelineEvents(
    where: { escrowId: $escrowId }
    orderBy: timestamp
    orderDirection: asc
  ) {
    id
    eventType
    actor
    timestamp
    previousState
    newState
    reason
  }
}
```

### 統計情報を取得

```graphql
query GetStats {
  globalStats(id: "0x676c6f62616c") {
    totalVaults
    totalEscrows
    totalApprovals
  }
  vaultStats(first: 10) {
    id
    totalEscrows
    pendingEscrows
    approvedEscrows
    releasedEscrows
    cancelledEscrows
  }
}
```

## イベントハンドラー

このサブグラフは以下のEscrowRegistryイベントを処理します：

- `EscrowCreated`: 新しいエスクローが作成されたとき
- `ApprovalGranted`: エスクローが承認されたとき
- `EscrowReleased`: エスクローが実行されたとき
- `EscrowCancelled`: エスクローがキャンセルされたとき
- `EscrowStateChanged`: エスクローの状態が変更されたとき

## 開発

### スキーマの変更

`schema.graphql`を編集後、以下を実行：

```bash
npm run codegen
npm run build
```

### マッピングの変更

`src/mapping.ts`を編集後、以下を実行：

```bash
npm run build
```

## トラブルシューティング

### ビルドエラー

- `graph codegen`を実行して型を再生成
- ABIファイルが`abis/`ディレクトリに存在することを確認
- `subgraph.yaml`のイベントシグネチャが正しいことを確認

### デプロイエラー

- The Graph Studio APIキーが正しく設定されているか確認
- コントラクトアドレスとstartBlockが正しいか確認
- ネットワーク名が正しいか確認（base-sepolia）

## ライセンス

ISC

## リンク

- [The Graph Documentation](https://thegraph.com/docs/)
- [Family Wallet Project](https://github.com/yourusername/family-wallet)
