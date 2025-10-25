# Family Wallet 実装差分レポート
**日付:** 2025-09-30
**対象:** `/home/runner/workspace/apps/web` (localhost:5174/wallet-demo)
**基準:** `.kiro/specs/family_wallet/requirements.md`

---

## 📊 実装状況サマリ

### ✅ 完全実装済み（UI レイヤー）

1. **Dashboard** - エスクロー一覧、アクティビティサマリ
2. **Escrow Detail** - 個別エスクロー詳細、タイムライン
3. **Escrow Create Wizard** - エスクロー作成ウィザード
4. **Approvals Hub** - 承認ハブ（同期/非同期署名タブ、閾値進捗）
5. **Group Creation & Invite** - グループ作成、招待管理、QR 生成
6. **Escrow Release Console** - Ready/Waiting リスト、release() UI
7. **Policy Management** - ポリシー設定、閾値/タイムロック管理
8. **Notification Center** - 通知センター
9. **Vault Settings** - グループ設定、メンバー管理
10. **Audit Log Viewer** - 監査ログ
11. **Mobile View** - モバイルビュー（レスポンシブ対応）
12. **Accessibility Guide** - アクセシビリティガイド

### 🔴 未実装（バックエンド統合）

#### 要件1: エスクロー登録とグルーピング
- ❌ **EscrowRegistry コントラクト連携**
  - `createEscrow()` の UserOperation 生成・送信
  - Bundler への送信処理
  - トランザクション結果の反映
- ❌ **解放条件の動的切り替え**（SIGNATURE/MULTISIG/TIMELOCK/ORACLE/IOT/MILESTONE/COMPOUND）
  - UI は実装済みだが、ポリシーとの整合性チェック未実装
- ❌ **Supabase へのテンプレート保存**
  - API エンドポイント未実装
  - ドラフト再利用機能未実装

#### 要件2: MultiOwnable 承認プロセス
- ❌ **UserOperation の構築と送信**
  - `approveRelease()` の実装（permissionless SDK 統合）
  - Bundler 連携
- ❌ **ライブセッション機能**
  - WebSocket/SignalR による参加者リアルタイム同期
  - QR/URL 共有機能のバックエンド
- ❌ **閾値・タイムロック検証**
  - オンチェーンステート取得
  - PolicyManager からの rolesRoot 検証

#### 要件3: ガススポンサーと Paymaster
- ❌ **Paymaster 統合**
  - Sponsorship リクエスト API (`/paymaster/sponsor`)
  - トークン残高チェック
  - 日次上限超過判定
- ❌ **Fallback フロー**
  - ETH ガス支払い切り替え UI（UI は存在するが機能未実装）

#### 要件4: 可視化・通知・監査
- ❌ **The Graph Subgraph 連携**
  - イベントインデックス取得
  - リアルタイム更新（Polling/Subscription）
- ❌ **Push 通知**
  - Expo Push Notifications（モバイル）
  - Web Push（Service Worker）
  - 通知トリガー API
- ❌ **監査ログ永続化**
  - Supabase へのログ保存
  - UserOperation ハッシュ記録

#### 要件5: ウォレット接続とリカバリ
- ❌ **WalletConnect v2 統合**
  - セッション確立
  - ネットワーク切り替えダイアログ
  - 再接続フロー
- ❌ **ソーシャルリカバリ**
  - Guardian 承認フロー
  - Timelock 待機
  - 新デバイス登録

#### 要件6: UI/UX 表示要件
- ⚠️ **ステータスコンポーネント**（部分実装）
  - Skeleton/Loading 状態（UI コンポーネントは存在するが統合未完了）
  - エラーバナー（未統合）
  - 空表示（未統合）
- ❌ **レスポンシブブレークポイント**（1440px/1024px/375px）
  - Tailwind 設定は存在するが、細かい調整未完了

#### 要件7: グループ招待とロール管理
- ❌ **EIP-712 署名生成**
  - 招待ハッシュ生成
  - リンク/QR の有効期限管理
- ❌ **招待受領フロー**
  - SIWE 認証
  - `acceptInvite()` / `proposeAddMember` の実装
- ❌ **招待ステータス管理**
  - `pending/accepted/expired` のリアルタイム更新
  - 再発行ボタン機能

---

## 🔧 不足している技術コンポーネント

### フロントエンド
1. **Web3 接続層**
   - `lib/wagmi.ts` - wagmi v2 設定（未実装）
   - `lib/bundler.ts` - Bundler クライアント（未実装）
   - `lib/paymaster.ts` - Paymaster クライアント（未実装）
   - `lib/graph.ts` - The Graph クライアント（未実装）

2. **カスタムフック**
   - `hooks/useEscrows.ts` - エスクロー取得・作成（未実装）
   - `hooks/useApprovalFlow.ts` - 承認フロー（未実装）
   - `hooks/useAaClient.ts` - Account Abstraction クライアント（未実装）

3. **状態管理**
   - `store/useVaultStore.ts` - Zustand ストア（未実装）

### バックエンド（未実装）
1. **Hono API** (`apps/api`)
   - `routes/escrows.ts` - エスクロー CRUD
   - `routes/policies.ts` - ポリシー管理
   - `routes/vaults.ts` - グループ/メンバー管理
   - `routes/notifications.ts` - 通知管理

2. **サービス層**
   - `services/escrow-service.ts`
   - `services/policy-service.ts`
   - `services/timeline-service.ts`
   - `services/paymaster-service.ts`

3. **統合層**
   - `integrations/subgraph-client.ts`
   - `integrations/bundler-client.ts`
   - `integrations/permissionless-client.ts`

4. **データベース**
   - `db/schema.ts` - Drizzle スキーマ
   - Supabase テーブル設計

### スマートコントラクト（未実装）
- `contracts/src/EscrowRegistry.sol`
- `contracts/src/modules/PolicyManager.sol`
- `contracts/src/modules/RoleVerifier.sol`
- `contracts/src/paymaster/ERC20Paymaster.sol`

### インフラ（未実装）
- The Graph Subgraph デプロイ
- Bundler サービス設定
- Paymaster サービス設定
- Supabase プロジェクト設定

---

## 📝 次のステップ（優先順位順）

### Phase 1: Web3 基盤構築（高優先度）
1. ✅ **Figma UI コンポーネント統合**（完了）
2. ⏭️ **wagmi + viem 設定** - WalletConnect v2 接続
3. ⏭️ **permissionless SDK 統合** - UserOperation 生成
4. ⏭️ **Bundler クライアント実装**

### Phase 2: スマートコントラクト開発
5. ⏭️ **EscrowRegistry 実装**（Solidity）
6. ⏭️ **PolicyManager 実装**
7. ⏭️ **RoleVerifier 実装**（Merkle Proof）
8. ⏭️ **ERC20Paymaster 実装**

### Phase 3: API & データベース
9. ⏭️ **Hono API セットアップ**
10. ⏭️ **Supabase スキーマ作成**
11. ⏭️ **The Graph Subgraph 開発**

### Phase 4: フロントエンド統合
12. ⏭️ **カスタムフック実装**（useEscrows, useApprovalFlow）
13. ⏭️ **状態管理統合**（Zustand）
14. ⏭️ **リアルタイム更新**（Polling/Subscription）

### Phase 5: 通知・監査
15. ⏭️ **Push 通知統合**（Expo Push / Web Push）
16. ⏭️ **監査ログ永続化**

### Phase 6: QA & デプロイ
17. ⏭️ **E2E テスト**（Playwright / Detox）
18. ⏭️ **Base Mainnet デプロイ**

---

## 📐 現在の実装カバレッジ

| カテゴリ | 実装率 | 備考 |
|---------|--------|------|
| **UI コンポーネント** | 100% | Figma デザイン完全統合 |
| **ルーティング** | 100% | 12画面すべて実装 |
| **Web3 統合** | 0% | wagmi/viem/permissionless 未統合 |
| **スマートコントラクト** | 0% | 未開発 |
| **API バックエンド** | 0% | 未開発 |
| **データベース** | 0% | 未設定 |
| **通知システム** | 0% | 未実装 |
| **テスト** | 0% | 未作成 |

**総合実装率: 約 25%**（UI のみ完成、ロジック層未実装）

---

## 🎯 結論

### 現状
- ✅ **Figma デザインの完全な UI 実装**が完了
- ✅ **ロール別アクセス制御**の UI レイヤーが完成
- ✅ **12 画面すべて**がデモ可能な状態

### 不足
- ❌ **Web3 統合**（WalletConnect, Bundler, Paymaster）
- ❌ **スマートコントラクト**（EscrowRegistry, PolicyManager 等）
- ❌ **API バックエンド**（Hono, Supabase, The Graph）
- ❌ **リアルタイム機能**（通知、ライブセッション）

### 推奨アクション
1. **即座に**: Web3 統合（wagmi + permissionless SDK）
2. **並行して**: スマートコントラクト開発（Foundry/Hardhat）
3. **その後**: API バックエンド & データベース構築

現在の `/wallet-demo` は **プロトタイプ/モックアップ** として機能し、実際のブロックチェーン連携を行うには Phase 1-3 の実装が必須です。
