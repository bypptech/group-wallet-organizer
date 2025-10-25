# ファミリー共有ウォレット 技術設計書

**更新日**: 2025-09-30
**バージョン**: 2.0
**ベース**: requirements.md + 実装差分レポート

## 1. システム全体設計

### 1.1 アーキテクチャ概要

- **チェーン**: Base Mainnet（L2, EVM）
- **コントラクト**: EscrowRegistry (主), PolicyManager, RoleVerifier, ERC20Paymaster, GuardianModule
- **クライアント**: Next.js 15 (Web), Expo SDK 52 (Mobile)
- **API**: Hono (TypeScript) on Cloudflare Workers, Drizzle + Neon PostgreSQL
- **連携サービス**: ERC-4337 Bundler, Paymaster (USDC/JPYC), The Graph Subgraph, Expo Push Notification, WalletConnect v2

```mermaid
graph TB
    subgraph "クライアント"
        Web[Next.js Web App<br/>localhost:5174/wallet-demo]
        Mobile[Expo React Native App]
        WalletConnect[WalletConnect v2 Modal]
    end

    subgraph "API/サービス"
        HonoAPI[Hono API<br/>(Vault/Activity/Notifications)]
        Subgraph[The Graph Subgraph]
        Bundler[ERC-4337 Bundler]
        Paymaster[USDC/JPYC Paymaster]
    end

    subgraph "ブロックチェーン(Base)"
        EntryPoint[ERC-4337 EntryPoint]
        EscrowRegistry[EscrowRegistry]
        PolicyModule[Policy Storage]
        Tokens[ETH/USDC/JPYC]
    end

    Web -->|WalletConnect| Bundler
    Mobile -->|WalletConnect| Bundler
    WalletConnect --> Bundler
    Bundler --> EntryPoint
    EntryPoint --> EscrowRegistry
    EscrowRegistry --> Tokens
    EscrowRegistry --> PolicyModule
    HonoAPI --> EscrowRegistry
    HonoAPI --> Subgraph
    Web --> HonoAPI
    Mobile --> HonoAPI
```

### 1.2 レイヤー構成

1. **プレゼンテーション層**: Next.js 15 (Web), Expo SDK 52 (モバイル)
2. **接続層**: wagmi v2 + viem + WalletConnect v2, permissionless SDK（UserOperation 生成）
3. **API/統合層**: Hono（Cloudflare Workers 対応）, Subgraph, 通知/分析サービス
4. **スマートコントラクト層**: EscrowRegistry, Policy 管理, Paymaster, Guard/Role 管理
5. **インフラ層**: Base Mainnet, Bundler/Paymaster サービス, Neon PostgreSQL

### 1.3 実装状況サマリ

| レイヤー | 実装率 | 状態 |
|---------|--------|------|
| **UIコンポーネント** | 100% | ✅ 完了（Figma統合済み）|
| **ルーティング** | 100% | ✅ 完了（12画面実装済み）|
| **Web3統合** | 0% | ❌ 未実装 |
| **スマートコントラクト** | 0% | ❌ 未実装 |
| **APIバックエンド** | 0% | ❌ 未実装 |
| **データベース** | 0% | ❌ 未実装 |
| **通知システム** | 0% | ❌ 未実装 |
| **テスト** | 0% | ❌ 未実装 |

**総合実装率: 約25%**（UIのみ完成、ロジック層未実装）

## 2. スマートコントラクト設計

### 2.1 EscrowRegistry

| 項目 | 内容 |
| ---- | ---- |
| 役割 | エスクローの登録・承認・リリース・キャンセル・ポリシー連携 |
| 実装状態 | ❌ 未実装 |
| 重要ストレージ | `mapping(bytes32 => Escrow)` `mapping(bytes32 => PolicyBinding)` `mapping(bytes32 => ApprovalState)` |
| 採用パターン | Upgradeable Proxy（UUPS）、カスタムエラー、イベント Emission |

```solidity
struct Escrow {
    bytes32 vaultId;
    address payer;
    address payee;
    address token; // address(0) for native
    uint256 amount;
    address target;
    bytes data;
    bytes32 policyId;
    uint48  deadline;
    EscrowStatus status;
}

struct ApprovalState {
    uint48 createdAt;
    uint48 lastActionAt;
    uint8 approvalsCount;
    mapping(bytes32 => bool) hasApproved; // hashed approver identifier
}
```

**主要関数**（未実装）
- `createEscrow(CreateParams calldata params)`
- `approveRelease(bytes32 escrowId, bytes calldata proof)`
- `revokeApproval(bytes32 escrowId, bytes calldata proof)`
- `release(bytes32 escrowId, bytes calldata proof)`
- `cancel(bytes32 escrowId, bytes calldata proof)`
- `updatePolicyBindings(bytes32 escrowId, bytes32 newPolicyId)`

**ガードロジック**（未実装）
- `PolicyManager.getPolicy(policyId)` を呼び出し閾値/タイムロック/rolesRoot を取得
- `RoleVerifier.verify(proof, rolesRoot, approverHash)`でロール証明
- `require(block.timestamp >= timelockEnd)` と `approvalsCount >= threshold` を検証
- `deadline` 超過時は `cancel` のみ許可

### 2.2 PolicyManager

**実装状態**: ❌ 未実装

- Policy データのバージョニング v1
- `struct Policy { uint8 threshold; uint32 timelock; bytes32 rolesRoot; bytes32 ownersRoot; }`
- `createPolicy`, `updatePolicy`, `schedulePolicyUpdate`, `finalizePolicyUpdate` 等、タイムロックを含む二段階更新
- Guardian 認定により緊急変更が可能

### 2.3 RoleVerifier

**実装状態**: ❌ 未実装

- `verifyRole(bytes32 leaf, bytes32[] calldata proof, bytes32 root)`
- keccak256(abi.encodePacked(account, role)) を leaf として Merkle 証明

### 2.4 ERC20Paymaster

**実装状態**: ❌ 未実装

- ERC-4337 EntryPoint 向け Paymaster
- 承認フロー: `validatePaymasterUserOp` → トークン残高チェック → スポンサー決定
- ガス支払い: 事前にデポジットした USDC/JPYC を EntryPoint に供給
- トークン換算: `priceOracle` を接続（Chainlink or 内部レート）

### 2.5 GuardianModule

**実装状態**: ❌ 未実装

- 凍結、リカバリ、所有者再発行
- `initiateRecovery(bytes32 vaultId, address newAccount, Proof proof)` → タイムロック → `completeRecovery`

### 2.6 イベント一覧

| コントラクト | イベント | 説明 | 実装状態 |
| ------------- | -------- | ---- | -------- |
| EscrowRegistry | `EscrowCreated`, `EscrowApproved`, `EscrowReleased`, `EscrowCancelled`, `EscrowExpired` | UI/サブグラフ連携用 | ❌ 未実装 |
| PolicyManager  | `PolicyCreated`, `PolicyUpdated`, `PolicyUpdateScheduled` | ポリシー監査ログ | ❌ 未実装 |
| Paymaster      | `SponsorshipGranted`, `SponsorshipRejected` | ガススポンサー監査 | ❌ 未実装 |
| GuardianModule | `RecoveryInitiated`, `RecoveryCompleted`, `EmergencyFreeze` | 緊急操作可視化 | ❌ 未実装 |

## 3. オフチェーン設計

### 3.1 Hono API

**実装状態**: ❌ 未実装
**ランタイム**: Cloudflare Workers + TypeScript + Hono 4.x + Drizzle ORM

| Route | メソッド | 概要 | 実装状態 |
| ----- | ------ | ---- | -------- |
| `/vaults` | GET/POST | Vault の取得/作成 | ❌ 未実装 |
| `/vaults/:id/members` | GET/POST/DELETE | メンバー管理 | ❌ 未実装 |
| `/vaults/:id/invites` | GET/POST/DELETE | 招待リンク生成・失効管理 | ❌ 未実装 |
| `/escrows` | GET/POST | Escrow 一覧取得/ドラフト登録 | ❌ 未実装 |
| `/escrows/:id` | GET | Escrow 詳細（オンチェーン + Neon）| ❌ 未実装 |
| `/escrows/:id/timeline` | GET | 承認/コメント/通知ログ | ❌ 未実装 |
| `/policies` | GET/POST | Policy 参照・変更要求 | ❌ 未実装 |
| `/notifications` | POST | Push 通知トリガー | ❌ 未実装 |
| `/paymaster/sponsor` | POST | Sponsorship API | ❌ 未実装 |

**サービスレイヤー**（すべて未実装）
- EscrowService: サブグラフ参照、Neon キャッシュ更新
- PolicyService: Policy 操作履歴保存
- TimelineService: 承認ステップ、コメント、UserOperation ハッシュ追跡
- InviteService: 招待トークン生成・署名・失効、Vault メンバー登録のドラフト作成
- PaymasterService: Sponsorship リクエスト、失敗時の fallback

**データベース**（未実装）
- Drizzle Schema: vaults, members, policies, invites, escrows_snapshot, approvals, notifications
- Neon PostgreSQL によるデータ永続化、ファイル（証憑、請求書等）は外部ストレージ連携

### 3.2 サブグラフ設計

**実装状態**: ❌ 未実装

- **Namespace**: `family-wallet/base`
- Data Sources: EscrowRegistry, PolicyManager, Paymaster
- Entities: `Vault`, `Escrow`, `Approval`, `PolicyVersion`, `Sponsorship`
- ハンドラ: `handleEscrowCreated`, `handleEscrowApproved`, `handlePolicyUpdated`

### 3.3 Bundler/Paymaster 連携

**実装状態**: ❌ 未実装

- `permissionless` SDK をラップした `AaClient`（Web/Mobile 共通）
- Sponsorship フロー: クライアント → Hono `/paymaster/sponsor` → Paymaster RPC → Bundler
- 失敗時は API が `fallbackMode: true` を返し、UI で ETH ガスを選択

### 3.4 通知システム

**実装状態**: ❌ 未実装

- Expo Push Notification: Mobile 向け
- Web Push（Service Worker）: Escrow 状態変化、緊急通知
- 重要イベントは TimelineService 経由でログに記録

## 4. クライアント設計

### 4.1 Web アプリ（`apps/web`）

**実装状態**: ✅ UIレイヤー 100%完成、❌ バックエンド統合 0%

#### 完成している部分（UI）

**ディレクトリ構成**:
```
apps/web/src/
├── pages/
│   └── wallet-demo.tsx          # ✅ 完成（ロール切替、12画面統合）
├── components/
│   ├── wallet/                  # ✅ 完成（14ファイル）
│   │   ├── Dashboard.tsx        # ✅ エスクロー一覧、アクティビティ
│   │   ├── EscrowDetail.tsx     # ✅ 個別詳細、タイムライン
│   │   ├── EscrowCreateWizard.tsx # ✅ 作成ウィザード
│   │   ├── ApprovalsHub.tsx     # ✅ 同期/非同期署名タブ
│   │   ├── GroupCreation.tsx    # ✅ グループ作成、招待管理
│   │   ├── EscrowReleaseConsole.tsx # ✅ Ready/Waitingリスト
│   │   ├── PolicyManagement.tsx # ✅ ポリシー設定
│   │   ├── NotificationCenter.tsx # ✅ 通知センター
│   │   ├── VaultSettings.tsx    # ✅ グループ設定
│   │   ├── AuditLogViewer.tsx   # ✅ 監査ログ
│   │   ├── MobileView.tsx       # ✅ モバイルビュー
│   │   └── AccessibilityGuide.tsx # ✅ アクセシビリティ
│   └── ui/                      # ✅ 完成（50+ファイル、shadcn/ui）
├── hooks/                       # ❌ 未実装
│   ├── useEscrows.ts           # ❌ エスクロー取得・作成
│   ├── useApprovalFlow.ts      # ❌ 承認フロー
│   └── useAaClient.ts          # ❌ Account Abstraction
├── lib/                         # ❌ 未実装
│   ├── wagmi.ts                # ❌ wagmi v2 設定
│   ├── bundler.ts              # ❌ Bundler クライアント
│   ├── paymaster.ts            # ❌ Paymaster クライアント
│   └── graph.ts                # ❌ The Graph クライアント
└── store/                       # ❌ 未実装
    └── useVaultStore.ts        # ❌ Zustand ストア
```

**完成している12画面**:
1. ✅ Dashboard - エスクロー一覧、アクティビティサマリ
2. ✅ Escrow Detail - 個別エスクロー詳細、タイムライン
3. ✅ Escrow Create Wizard - エスクロー作成ウィザード
4. ✅ Approvals Hub - 承認ハブ（同期/非同期署名タブ、閾値進捗）
5. ✅ Group Creation & Invite - グループ作成、招待管理、QR生成
6. ✅ Escrow Release Console - Ready/Waitingリスト、release() UI
7. ✅ Policy Management - ポリシー設定、閾値/タイムロック管理
8. ✅ Notification Center - 通知センター
9. ✅ Vault Settings - グループ設定、メンバー管理
10. ✅ Audit Log Viewer - 監査ログ
11. ✅ Mobile View - モバイルビュー（レスポンシブ対応）
12. ✅ Accessibility Guide - アクセシビリティガイド

**ロール別アクセス制御**:
- ✅ Owner（オーナー）: 全画面アクセス可能
- ✅ Guardian（ガーディアン）: Dashboard, Escrow Detail, Policy, Notifications, Audit, Approvals Hub, Escrow Release, Accessibility, Mobile
- ✅ Requester（リクエスター）: Dashboard, Escrow Detail, Escrow Create, Notifications, Accessibility, Mobile
- ✅ Viewer（ビューアー）: Dashboard, Escrow Detail, Audit, Accessibility, Mobile

#### 未実装の部分（バックエンド統合）

**Web3統合** - すべて未実装:
- ❌ `lib/wagmi.ts` - wagmi v2 設定、WalletConnect v2統合
- ❌ `lib/bundler.ts` - Bundler クライアント（permissionless SDK）
- ❌ `lib/paymaster.ts` - Paymaster クライアント
- ❌ `lib/graph.ts` - The Graph クライアント

**カスタムフック** - すべて未実装:
- ❌ `hooks/useEscrows.ts` - エスクロー取得・作成
- ❌ `hooks/useApprovalFlow.ts` - 承認フロー
- ❌ `hooks/useAaClient.ts` - Account Abstraction クライアント

**状態管理** - 未実装:
- ❌ `store/useVaultStore.ts` - Zustand ストア

**主要機能の実装状態**:

| 機能 | UI | バックエンド | 状態 |
|------|----|-----------| -----|
| エスクロー作成 | ✅ | ❌ | UI完成、API未接続 |
| 承認フロー | ✅ | ❌ | UI完成、UserOperation未実装 |
| ポリシー管理 | ✅ | ❌ | UI完成、コントラクト未実装 |
| グループ招待 | ✅ | ❌ | UI完成、EIP-712署名未実装 |
| 通知 | ✅ | ❌ | UI完成、Push通知未実装 |
| 監査ログ | ✅ | ❌ | UI完成、永続化未実装 |

### 4.2 モバイルアプリ（`apps/mobile`）

**実装状態**: ❌ 未実装

```
apps/mobile/src/
├── screens/                    # ❌ 未実装
│   ├── HomeScreen.tsx
│   ├── ApprovalsScreen.tsx
│   ├── TimelineScreen.tsx
│   ├── GroupScreen.tsx
│   └── SettingsScreen.tsx
├── components/                 # ❌ 未実装
│   ├── EscrowList.tsx
│   ├── ApprovalButtons.tsx
│   └── WalletStatus.tsx
├── hooks/                      # ❌ 未実装
│   ├── useWalletConnect.ts
│   ├── useUserOperation.ts
│   └── usePushNotifications.ts
├── lib/                        # ❌ 未実装
│   ├── walletconnect.ts
│   ├── bundler-client.ts
│   └── storage.ts
└── providers/                  # ❌ 未実装
    └── AppProvider.tsx
```

**主要画面**（すべて未実装）:
- Home: 承認待ちサマリ、招待バナー、最新通知
- Approvals: 承認待ちリスト、同期/非同期切替、Sponsor チェック
- Timeline: Escrow 履歴、閾値進捗バー、コメント
- Group: メンバー/ロール/重み表示、Invite Builder、招待ステータス
- Settings: WalletConnect、Push 設定、端末登録

## 5. Shared パッケージ設計

**実装状態**: ❌ 未実装

```
packages/shared/src/
├── types/                      # ❌ 未実装
│   ├── escrow.ts              # Escrow型定義
│   ├── policy.ts              # Policy型定義
│   ├── vault.ts               # Vault型定義
│   └── notification.ts        # Notification型定義
├── constants/                  # ❌ 未実装
│   ├── contracts.ts           # CONTRACT_ADDRESSES
│   ├── chain.ts               # CHAIN_CONFIG
│   └── policy.ts              # POLICY_LIMITS
├── abis/                       # ❌ 未実装
│   ├── EscrowRegistry.ts
│   ├── PolicyManager.ts
│   ├── Paymaster.ts
│   └── EntryPoint.ts
└── lib/                        # ❌ 未実装
    ├── escrow-helpers.ts      # 承認状態計算
    ├── merkle.ts              # Merkle証明生成
    └── validation.ts          # バリデーション
```

## 6. セキュリティ設計

**実装状態**: ❌ 未実装

- 単体テスト: reentrancy, signature replay, timelock bypass
- Guard: `nonReentrant`、`EIP712Domain` 署名検証
- Upgrade 管理: Proxy Admin を GuardianModule が保持、Emergency Freeze でアップグレード停止
- Multisig: ヘルスチェック/アップグレードは 3-of-5 threshold
- モニタリング: Forta/EigenPhi などの監視サービス連携を検討

## 7. テスト計画詳細

**実装状態**: すべて未実装

### 7.1 Foundry テスト（未実装）

- `EscrowRegistry.t.sol`: create→approve→release、timelock、deadline
- `PolicyManager.t.sol`: policy update scheduling、rolesRoot 更新
- `Paymaster.t.sol`: sponsorship success/failure、spend limit
- ガスベンチ: approvalsCount/threshold 別のコスト測定

### 7.2 API テスト（未実装）

- Vitest+Hono テストベンチ
- Neon をローカルモック
- ミドルウェア: 認証、デバイス署名検証

### 7.3 クライアントテスト（未実装）

- Web: React Testing Library + Playwright
- Mobile: RTL + Detox
- Snapshot/Visual Regression: Chromatic or Storybook

## 8. 運用・監視

**実装状態**: ❌ 未実装

- アラート: Paymaster スポンサー率、Escrow 失敗率、Bundler レイテンシ
- メトリクス: Prometheus 互換エンドポイント（Workers から PushGateway）
- ログ: Cloudflare Workers Logpush、Neon PostgreSQL
- インシデント対応: GuardianModule で緊急停止 → フォールバックポリシー

## 9. 依存関係とバージョン

| 領域 | 主要パッケージ | バージョン | 実装状態 |
| ---- | -------------- | ---------- | -------- |
| On-Chain | Solidity | ^0.8.24 | ❌ 未実装 |
| On-Chain | OpenZeppelin Contracts | ^5.0.0 | ❌ 未実装 |
| On-Chain | Foundry | 最新安定版 | ❌ 未実装 |
| Web | Next.js | 15.x | ✅ セットアップ済み |
| Web | React | 18.x | ✅ セットアップ済み |
| Web | wagmi | 2.x | ❌ 未設定 |
| Web | viem | 2.x | ❌ 未設定 |
| Web | shadcn/ui | latest | ✅ 完全統合 |
| Web | TailwindCSS | v4 | ✅ 設定済み |
| Mobile | Expo SDK | 52.x | ❌ 未実装 |
| Mobile | React Native | 0.75.x | ❌ 未実装 |
| API | Hono | 4.x | ❌ 未実装 |
| API | Drizzle ORM | 0.30.x | ❌ 未実装 |
| Shared | pnpm | 9.x | ✅ セットアップ済み |

## 10. 実装ガイドライン

### 完了している作業

✅ **Phase 1: Figma UI統合**
- 12画面すべてのUIコンポーネント実装完了
- ロール別アクセス制御（Owner/Guardian/Requester/Viewer）実装
- shadcn/uiコンポーネント50+ファイル統合
- レスポンシブデザイン対応

### 次のステップ（優先順位順）

**Phase 2: Web3基盤構築（最優先）**
1. ⏭️ wagmi + viem 設定 - WalletConnect v2接続
2. ⏭️ permissionless SDK統合 - UserOperation生成
3. ⏭️ Bundler クライアント実装
4. ⏭️ カスタムフック実装（useEscrows, useApprovalFlow, useAaClient）

**Phase 3: スマートコントラクト開発**
5. ⏭️ EscrowRegistry 実装（Solidity）
6. ⏭️ PolicyManager 実装
7. ⏭️ RoleVerifier 実装（Merkle Proof）
8. ⏭️ ERC20Paymaster 実装
9. ⏭️ Foundry テスト実装

**Phase 4: API & データベース**
10. ⏭️ Hono APIセットアップ
11. ⏭️ Supabaseスキーマ作成
12. ⏭️ The Graph Subgraph開発
13. ⏭️ サービス層実装

**Phase 5: フロントエンド統合**
14. ⏭️ 既存UIとバックエンド接続
15. ⏭️ 状態管理統合（Zustand）
16. ⏭️ リアルタイム更新（Polling/Subscription）

**Phase 6: モバイルアプリ開発**
17. ⏭️ Expo プロジェクトセットアップ
18. ⏭️ 5画面実装（Home/Approvals/Timeline/Group/Settings）
19. ⏭️ WalletConnect統合
20. ⏭️ Push通知実装

**Phase 7: 通知・監査**
21. ⏭️ Push通知統合（Expo Push / Web Push）
22. ⏭️ 監査ログ永続化

**Phase 8: QA & デプロイ**
23. ⏭️ E2Eテスト（Playwright / Detox）
24. ⏭️ Base Mainnetデプロイ

## 11. 差分サマリ

**2025-09-30更新**:
- 実装差分レポートを基に設計書を全面改訂
- 各コンポーネントの実装状態を明示（✅完了/❌未実装）
- UIレイヤー100%完成、バックエンド0%の状況を反映
- 優先順位付きの実装ロードマップを追加
- Figma統合完了（12画面、ロール別アクセス制御）を記録
