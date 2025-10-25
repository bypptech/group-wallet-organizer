# Simple DEX - Tsumiki × VibeKit統合開発例

このサンプルプロジェクトは、統合フレームワークを使ったAMM DEX開発の完全な例を提供します。

## 開発フロー実例

### Phase 1: 仕様定義
```bash
# VibeKitプロシージャに従った要件定義
@kairo-requirements
# 出力: 詳細なDEX要件仕様書

@kairo-design  
# 出力: AMM技術設計書

@kairo-tasks
# 出力: 開発タスクリスト
```

### Phase 2: TDD実装
```bash
# Tsumikiコマンドによる段階的TDD
./scripts/tdd-cycle.sh --phase requirements
./scripts/tdd-cycle.sh --phase testcases
./scripts/tdd-cycle.sh --phase red      # 失敗テスト作成
./scripts/tdd-cycle.sh --phase green    # 最小実装  
./scripts/tdd-cycle.sh --phase refactor # リファクタリング
```

### Phase 3: 品質検証
```bash
# 統合テスト・品質チェック
@tdd-verify-complete
# セキュリティ監査
# ガス効率性検証
# E2Eテスト実行
```

## プロジェクト構成

```
simple-dex/
├─ contracts/
│  ├─ SimpleDEX.sol        # メインDEXコントラクト
│  ├─ LiquidityPool.sol    # 流動性プールコントラクト  
│  └─ test/
│     ├─ SimpleDEX.test.js # TDDテストスイート
│     └─ integration.test.js
├─ frontend/
│  ├─ components/
│  │  ├─ SwapInterface.tsx
│  │  ├─ PoolInterface.tsx
│  │  └─ WalletConnection.tsx
│  └─ hooks/
│     ├─ useSwap.ts
│     └─ usePool.ts
└─ docs/
   ├─ requirements.md      # AI生成要件仕様書
   ├─ architecture.md      # AI生成設計書
   └─ tasks.md            # AI生成タスクリスト
```

## 実装された機能

### スマートコントラクト
- [x] トークンスワップ機能
- [x] 流動性提供・引き出し
- [x] 価格計算（AMM）
- [x] 手数料徴収
- [x] セキュリティ機能

### フロントエンド
- [x] ウォレット接続
- [x] スワップインターフェース
- [x] 流動性管理UI
- [x] トランザクション履歴
- [x] リアルタイム価格表示

## 学習ポイント

### AI TDD統合
1. **仕様ファースト**: コード実装前の詳細仕様策定
2. **テストファースト**: 実装前のテスト作成
3. **品質ファースト**: 継続的な品質ゲート適用

### Web3特有考慮事項
1. **セキュリティ**: スマートコントラクト監査
2. **ガス効率**: トランザクション最適化
3. **UX**: Web3特有のユーザー体験改善

## 次のステップ

このサンプルをベースに、独自のDeFiプロジェクトを開発してください：

1. requirements.mdを自分のプロジェクト向けに修正
2. TDDサイクルで段階的実装
3. 継続的な品質チェック・改善
4. 本番デプロイメント計画

詳細な実装手順は各フェーズのドキュメントを参照してください。