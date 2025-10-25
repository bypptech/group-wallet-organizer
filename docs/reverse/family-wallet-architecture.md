
# Family Wallet アーキテクチャ設計（逆生成）

**分析日時**: 2025-01-XX
**プロジェクト**: Family Wallet - Web3共有ウォレット

## システム概要

### 実装されたアーキテクチャ
- **パターン**: モノレポ構成のフルスタックWeb3アプリケーション
- **Account Abstraction**: ERC-4337準拠
- **構成**: Web + API + スマートコントラクト + モバイル

### 技術スタック

#### フロントエンド (apps/web)
- **フレームワーク**: React 18 + Vite
- **ルーティング**: React Router (pages/)
- **状態管理**: Zustand (useVaultStore)
- **UI ライブラリ**: shadcn/ui (50+コンポーネント)
- **スタイリング**: TailwindCSS v4
- **Web3統合**: wagmi v2 + viem
- **ウォレット接続**: WalletConnect v2
- **Account Abstraction**: permissionless SDK

#### バックエンド (apps/api)
- **フレームワーク**: Hono 4.x on Node.js
- **ORM**: Drizzle ORM
- **データベース**: Neon PostgreSQL
- **認証**: JWT (HS256)
- **APIエンドポイント**: 
  - `/auth/*` - 認証
  - `/vaults` - Vault管理
  - `/escrows` - Escrow管理
  - `/policies` - Policy管理
  - `/invites` - 招待管理
  - `/notifications` - 通知
  - `/paymaster` - ガススポンサー

#### スマートコントラクト (contracts/)
- **Solidity**: ^0.8.24
- **フレームワーク**: Hardhat
- **テスト**: Hardhat (未実装)
- **コントラクト**:
  - `EscrowRegistry.sol` - エスクロー管理（未実装）
  - `PolicyManager.sol` - ポリシー管理（未実装）
  - `RoleVerifier.sol` - Merkle Proof検証（未実装）
  - `ERC20Paymaster.sol` - ガス代スポンサー（未実装）
  - `GuardianModule.sol` - 緊急管理（未実装）

#### モバイルアプリ (apps/mobile)
- **SDK**: Expo SDK 52
- **フレームワーク**: React Native 0.75
- **ウォレット接続**: WalletConnect v2
- **生体認証**: expo-local-authentication
- **実装状態**: セットアップ済み、画面未実装

#### Shared パッケージ (packages/shared)
- **TypeScript型定義**: エンティティ、API、コンポーネントProps
- **共通ユーティリティ**: バリデーション、Merkle証明生成

#### インフラ・サービス
- **ブロックチェーン**: Base Mainnet (L2, EVM互換)
- **インデックス**: The Graph Subgraph
- **通知**: Expo Push Notification, Web Push (Service Worker)
- **監視**: 未実装

## レイヤー構成

### 実装されたレイヤー

```
apps/
├── web/                    # ✅ UIレイヤー完成 (100%)
│   ├── src/
│   │   ├── components/    # 50+ shadcn/ui + 14 wallet components
│   │   ├── pages/         # 3ページ (home, wallet-demo, not-found)
│   │   ├── hooks/         # 15+ カスタムフック (Web3統合は未実装)
│   │   ├── lib/           # Web3クライアント (未実装)
│   │   ├── providers/     # ThemeProvider, Web3Provider (未実装)
│   │   └── store/         # Zustand (useVaultStore, 未実装)
│
├── api/                    # ⚠️ 構造定義済み、ロジック未実装
│   ├── src/
│   │   ├── routes/        # 8ルートファイル (モックデータ返却)
│   │   ├── services/      # 5サービスクラス (未実装)
│   │   ├── auth/          # JWT認証 (実装済み)
│   │   ├── db/            # Drizzle スキーマ定義
│   │   └── mock/          # モックデータ
│
├── mobile/                 # ⚠️ セットアップ済み、画面未実装
│   ├── app/
│   │   ├── screens/       # 6画面定義 (空実装)
│   │   ├── components/    # 未実装
│   │   ├── hooks/         # WalletConnect統合 (未実装)
│   │   └── lib/           # ユーティリティ (未実装)
│
contracts/                  # ❌ 完全未実装
├── EscrowRegistry.sol
├── modules/
│   ├── PolicyManager.sol
│   ├── RoleVerifier.sol
│   └── GuardianModule.sol
└── paymaster/
    └── ERC20Paymaster.sol

packages/shared/            # ❌ 型定義のみ、ロジック未実装
└── src/
    ├── types/
    ├── constants/
    └── lib/
```

### レイヤー責務

#### プレゼンテーション層 (apps/web, apps/mobile)
- **実装状況**: Web UIは100%完成、Mobile は画面未実装
- **完成機能**:
  - ✅ 12画面のUI実装 (Dashboard, Escrow詳細, 作成ウィザード等)
  - ✅ ロール別アクセス制御 (Owner/Guardian/Requester/Viewer)
  - ✅ レスポンシブデザイン
- **未実装機能**:
  - ❌ Web3統合 (wagmi, viem, WalletConnect)
  - ❌ 状態管理 (Zustand)
  - ❌ リアルタイム更新
  - ❌ モバイル画面全体

#### API/統合層 (apps/api)
- **実装状況**: エンドポイント定義済み、ビジネスロジック未実装
- **完成機能**:
  - ✅ JWT認証 (登録/ログイン/リフレッシュ)
  - ✅ Drizzle スキーマ定義
  - ✅ モックAPIエンドポイント
- **未実装機能**:
  - ❌ サービス層のビジネスロジック
  - ❌ Subgraph統合
  - ❌ Bundler/Paymaster クライアント
  - ❌ 通知システム

#### スマートコントラクト層 (contracts/)
- **実装状況**: ファイル作成済み、完全未実装
- **計画機能**:
  - ❌ EscrowRegistry (エスクロー管理)
  - ❌ PolicyManager (ポリシー管理)
  - ❌ RoleVerifier (Merkle Proof検証)
  - ❌ ERC20Paymaster (ガス代スポンサー)
  - ❌ GuardianModule (緊急管理)

## デザインパターン

### 発見されたパターン

#### Account Abstraction (ERC-4337)
- **使用箇所**: apps/web/src/lib/aa-client.ts (未実装)
- **実装方式**: permissionless SDK + Bundler
- **UserOperation生成**: クライアントサイド

#### Repository Pattern
- **使用箇所**: apps/api/src/services/ (未実装)
- **サービスクラス**:
  - EscrowService
  - PolicyService
  - TimelineService
  - InviteService
  - PaymasterService

#### Custom Hooks Pattern
- **使用箇所**: apps/web/src/hooks/
- **実装済みフック**:
  - useDashboardData
  - useEscrowDetail
  - useCreateEscrow
  - useApprovalFlow
  - useReleaseEscrow
  - usePolicy
  - useNotifications
  - useGroupCreation
  - useVaultSettings
  - useAuditLogs
- **未実装フック**: Web3統合系 (useEscrows, useAaClient等)

#### Zustand State Management
- **使用箇所**: apps/web/src/store/useVaultStore.ts (未実装)
- **想定ストア**: Vault状態、ユーザー情報、通知

## 非機能要件の実装状況

### セキュリティ
- **認証**: ✅ JWT (HS256) 実装済み
- **認可**: ❌ ロールベース未実装
- **CORS設定**: ⚠️ 要確認
- **HTTPS対応**: Replit デフォルト対応

### パフォーマンス
- **キャッシュ**: ❌ 未実装
- **データベース最適化**: ❌ インデックス未設定
- **バンドル最適化**: ✅ Vite デフォルト設定
- **画像最適化**: ❌ 未実装

### 運用・監視
- **ログ出力**: ⚠️ console.log のみ
- **エラートラッキング**: ❌ 未実装
- **メトリクス収集**: ❌ 未実装
- **ヘルスチェック**: ❌ 未実装

## 実装優先度

### Phase 1: Web3基盤構築（最優先）
1. wagmi + viem 設定
2. WalletConnect v2 統合
3. permissionless SDK 統合
4. カスタムフック実装 (useEscrows, useApprovalFlow, useAaClient)

### Phase 2: スマートコントラクト開発
5. EscrowRegistry 実装
6. PolicyManager 実装
7. RoleVerifier 実装 (Merkle Proof)
8. ERC20Paymaster 実装
9. Hardhat テスト実装

### Phase 3: API & データベース
10. サービス層実装
11. Neon PostgreSQL スキーマ適用
12. The Graph Subgraph 開発

### Phase 4: フロントエンド統合
13. 既存UIとバックエンド接続
14. Zustand 状態管理
15. リアルタイム更新

### Phase 5: モバイルアプリ
16. 5画面実装 (Home/Approvals/Timeline/Group/Settings)
17. WalletConnect統合
18. Push通知実装

### Phase 6: QA & デプロイ
19. E2Eテスト (Playwright)
20. Base Mainnet デプロイ

## 次のステップ

1. ✅ `@rev-design` 完了
2. ⏭️ `@kairo-tasks` を実行してタスク分割
3. ⏭️ Phase 1 (Web3基盤) から順次実装開始
