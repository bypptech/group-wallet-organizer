#!/bin/bash

# Family Wallet Subgraph デプロイスクリプト

set -e

echo "================================================"
echo "Family Wallet Subgraph デプロイメント"
echo "================================================"
echo ""

# .envファイルから環境変数を読み込み
if [ -f "../.env" ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
fi

# 必須環境変数のチェック
if [ -z "$GRAPH_DEPLOY_KEY" ]; then
  echo "❌ Error: GRAPH_DEPLOY_KEY が設定されていません"
  echo ""
  echo "手順:"
  echo "1. https://thegraph.com/studio/ にアクセス"
  echo "2. アカウント作成/ログイン"
  echo "3. 「Create a Subgraph」をクリック"
  echo "4. Subgraph名を入力（例: family-wallet）"
  echo "5. 「Settings」→「Deploy Key」をコピー"
  echo "6. .env ファイルに GRAPH_DEPLOY_KEY=<your-key> を追加"
  echo ""
  exit 1
fi

if [ -z "$GRAPH_SUBGRAPH_SLUG" ]; then
  echo "⚠️  Warning: GRAPH_SUBGRAPH_SLUG が設定されていません"
  echo "   デフォルト値 'family-wallet' を使用します"
  GRAPH_SUBGRAPH_SLUG="family-wallet"
fi

echo "📋 デプロイ設定:"
echo "   Subgraph Slug: $GRAPH_SUBGRAPH_SLUG"
echo "   Network: base-sepolia"
echo ""

# Graph CLIの認証
echo "🔐 The Graph Studio に認証中..."
graph auth --studio $GRAPH_DEPLOY_KEY

if [ $? -ne 0 ]; then
  echo "❌ 認証に失敗しました"
  exit 1
fi

echo "✅ 認証成功"
echo ""

# コード生成
echo "🔨 コード生成中..."
npm run codegen

if [ $? -ne 0 ]; then
  echo "❌ コード生成に失敗しました"
  exit 1
fi

echo "✅ コード生成完了"
echo ""

# ビルド
echo "🔨 ビルド中..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ ビルドに失敗しました"
  exit 1
fi

echo "✅ ビルド完了"
echo ""

# デプロイ
echo "🚀 The Graph Studio にデプロイ中..."
graph deploy --studio $GRAPH_SUBGRAPH_SLUG

if [ $? -ne 0 ]; then
  echo "❌ デプロイに失敗しました"
  exit 1
fi

echo ""
echo "✅ デプロイ完了！"
echo ""
echo "📝 次のステップ:"
echo "   1. The Graph Studio (https://thegraph.com/studio/) にアクセス"
echo "   2. デプロイしたSubgraphを選択"
echo "   3. 「Indexing Status」でインデックス進行状況を確認"
echo "   4. 「Playground」でクエリをテスト"
echo ""
echo "🔗 サンプルクエリ:"
echo "   {"
echo "     vaults(first: 5) {"
echo "       id"
echo "       vaultAddress"
echo "       escrows {"
echo "         id"
echo "         state"
echo "         amount"
echo "       }"
echo "     }"
echo "   }"
echo ""
