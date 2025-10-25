# ファミリー共有ウォレット 要件定義書

## 概要

Base L2 上で稼働するファミリー/小規模グループ向けの共同管理ウォレットシステムを開発する。各メンバーは ERC-4337 に準拠したスマートアカウントを所有し、EscrowRegistry に登録された資産や外部コールを MultiOwnable ポリシーに基づいて共同管理する。USDC/JPYC などのステーブルコインによるガスレス体験、Expo ベースのモバイルアプリ、Next.js ベースの Web クライアント、Hono API、Paymaster/Bundler 連携、WalletConnect v2 を統合する。

## アーキテクチャ

### システム全体構成

```mermaid
graph TB
    subgraph "クライアント"
        Web[Next.js Web App]
        Mobile[Expo React Native App]
        WalletConnect[WalletConnect v2 Modal]
    end

    subgraph "API/サービス"
        HonoAPI[Hono API \n (Vault/Activity/Notifications)]
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

    Web --> WalletConnect
    Mobile --> WalletConnect
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

### レイヤー構成

1. **プレゼンテーション層**: Next.js 15 (Web), Expo SDK 52 (モバイル)
2. **接続層**: wagmi v2 + viem + WalletConnect v2, permissionless SDK（UserOperation 生成）
3. **API/統合層**: Hono（Cloudflare Workers 対応）, Subgraph, 通知/分析サービス
4. **スマートコントラクト層**: EscrowRegistry, Policy 管理, Paymaster, Guard/Role 管理
5. **インフラ層**: Base Mainnet, Bundler/Paymaster サービス, Neon PostgreSQL

## コンポーネントとインターフェース

### Web クライアント構成（Next.js）

```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # ダッシュボード（エスクロー一覧）
│   │   ├── escrows/[id]/page.tsx    # エスクロー詳細/投票
│   │   ├── policies/page.tsx        # ポリシー設定
│   │   └── settings/page.tsx        # グループ設定
│   ├── components/
│   │   ├── escrow/
│   │   │   ├── EscrowCard.tsx
│   │   │   └── EscrowTimeline.tsx
│   │   ├── approvals/
│   │   │   ├── ApprovalsHub.tsx
│   │   │   └── EscrowReleaseConsole.tsx
│   │   ├── policy/
│   │   │   ├── PolicyEditor.tsx
│   │   │   └── ThresholdConfigurator.tsx
│   │   ├── group/
│   │   │   └── GroupInvitePanel.tsx
│   │   ├── wallet/
│   │   │   ├── AccountBadge.tsx
│   │   │   └── GasSponsorNotice.tsx
│   │   └── ui/*
│   ├── hooks/
│   │   ├── useEscrows.ts
│   │   ├── useApprovalFlow.ts
│   │   └── useAaClient.ts
│   ├── lib/
│   │   ├── wagmi.ts
│   │   ├── bundler.ts
│   │   ├── paymaster.ts
│   │   └── graph.ts
│   └── store/
│       └── useVaultStore.ts
```

### モバイルクライアント構成（Expo）

```
apps/mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ApprovalsScreen.tsx
│   │   ├── TimelineScreen.tsx
│   │   ├── GroupScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── EscrowList.tsx
│   │   ├── ApprovalButtons.tsx
│   │   └── WalletStatus.tsx
│   ├── hooks/
│   │   ├── useWalletConnect.ts
│   │   ├── useUserOperation.ts
│   │   └── usePushNotifications.ts
│   ├── lib/
│   │   ├── walletconnect.ts
│   │   ├── bundler-client.ts
│   │   └── storage.ts
│   └── providers/
│       └── AppProvider.tsx
```

### API（Hono）構成

```
apps/api/
├── src/
│   ├── index.ts                    # エントリーポイント
│   ├── routes/
│   │   ├── escrows.ts              # エスクロー CRUD / タイムライン
│   │   ├── policies.ts             # ポリシー管理
│   │   ├── vaults.ts               # グループ/メンバー管理
│   │   └── notifications.ts        # 通知管理
│   ├── services/
│   │   ├── escrow-service.ts
│   │   ├── policy-service.ts
│   │   ├── timeline-service.ts
│   │   └── paymaster-service.ts
│   ├── integrations/
│   │   ├── subgraph-client.ts
│   │   ├── bundler-client.ts
│   │   └── permissionless-client.ts
│   ├── db/
│   │   ├── schema.ts
│   │   └── drizzle.ts
│   └── utils/
│       └── validators.ts
```

### スマートコントラクト構成

```
contracts/
├── src/
│   ├── EscrowRegistry.sol
│   ├── modules/
│   │   ├── PolicyManager.sol
│   │   ├── RoleVerifier.sol
│   │   └── PaymasterHook.sol
│   ├── interfaces/
│   │   ├── IEscrowRegistry.sol
│   │   ├── IPolicyManager.sol
│   │   └── IGuardianModule.sol
│   ├── libraries/
│   │   ├── EscrowLib.sol
│   │   ├── PolicyLib.sol
│   │   └── MerkleProofLib.sol
│   └── paymaster/
│       └── ERC20Paymaster.sol
└── test/
    ├── EscrowRegistry.t.sol
    ├── PolicyManager.t.sol
    └── Paymaster.t.sol
```

## データモデル

```typescript
// packages/shared/src/types/escrow.ts
export interface EscrowRecord {
  escrowId: string;
  vaultId: string;
  creator: `0x${string}`;
  payer: `0x${string}`;
  payee?: `0x${string}`;
  token: `0x${string}` | null;
  amountWei?: string;
  target?: `0x${string}`;
  callData?: `0x${string}`;
  policyId: string;
  deadlineIso?: string;
  status: 'PENDING' | 'APPROVED' | 'RELEASED' | 'CANCELLED' | 'EXPIRED';
  approvals: ApprovalRecord[];
}

export interface ApprovalRecord {
  approver: `0x${string}`;
  signatureType: 'UO' | 'EIP712';
  txHash?: `0x${string}`;
  approvedAtIso: string;
}

export interface Policy {
  policyId: string;
  vaultId: string;
  threshold: number;
  timelockSeconds: number;
  rolesRoot: `0x${string}`;
  ownersRoot: `0x${string}`;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface Vault {
  vaultId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  members: VaultMember[];
}

export interface VaultMember {
  account: `0x${string}`;
  roles: string[];
  joinedAtIso: string;
}
```

## エラーハンドリング

- EscrowRegistry では `error PolicyMismatch()`, `error TimelockActive()`, `error ThresholdNotMet()`, `error DeadlinePassed()` などのカスタムエラーを定義し、UserOperation の revert 理由を明確化する。
- Paymaster では `error UnsupportedToken()`, `error SponsorshipDenied()`, `error ExceededSpendLimit()` を定義し、ガススポンサー失敗時の UX を高める。
- クライアント側では `EscrowError` クラスを整備し、`POLICY_NOT_SATISFIED`, `PAYMASTER_REJECTED`, `BUNDLER_TIMEOUT`, `NETWORK_MISMATCH` などのコードとユーザーフィードバックを紐づける。
- API では Hono のエラーハンドラで詳細コード（`ESCROW_NOT_FOUND`, `INVALID_POLICY_UPDATE`, `SIGNATURE_INVALID`）を返却する。

## テスト戦略

### スマートコントラクトテスト（Foundry）
- `createEscrow` の正常系/異常系
- M-of-N 承認とタイムロック経過の検証
- Merkle Proof による Role 検証
- Paymaster Sponsorship 認可/拒否/上限超過

### API テスト
- Hono ルートごとのユニットテスト（Vault/Possible Escrow/Past Activity）
- Bundler/Paymaster へのモックコール検証
- Neon/Drizzle 層のシナリオテスト

### クライアントテスト
- Web: React Testing Library で主要コンポーネント/フックのユニットテスト
- モバイル: Expo Jest/React Native Testing Library で画面遷移・WalletConnect フローの検証
- Playwright（Web）/Detox（Mobile, 必要に応じ）で E2E

### 解析/品質
- Slither, solhint, prettier-plugin-solidity による解析
- Coverage 90%以上、gas-reporter による閾値モニタリング

## 要件

### 要件1: エスクロー登録とグルーピング
**ユーザーストーリー:** 世帯メンバーとして、用途に応じた支出/操作リクエストをエスクローとして登録し、家族ボードで共有したい。

- WHEN ユーザーが Web/モバイルで新規エスクローを作成すると THEN システムは EscrowRegistry に `createEscrow` を呼び出し、vaultId と結びついたレコードを作成する。
- WHEN ユーザーが支出タイプを選択すると THEN システムは金額/対象コントラクト/締切などの入力フォームを表示する。
- WHEN ユーザーが「解放条件」ステップで SIGNATURE/MULTISIG/TIMELOCK/ORACLE/IOT/MILESTONE/COMPOUND を選択すると THEN UI は条件ごとの必要フィールドと候補テンプレートを動的に切り替え、前提となるポリシーと齟齬がある場合は警告を表示する。
- WHEN Escrow が作成されると THEN API はサブグラフ/Transaction から状態を取得し UI に即時反映する。
- IF 入力がポリシー上の制約（上限額や許可ロール）に違反する場合 THEN EscrowRegistry は `PolicyMismatch()` でリバートする。
- WHEN Escrow をテンプレートとして保存すると THEN システムは再利用できるドラフトを Neon に保存する。

### 要件2: MultiOwnable 承認プロセス
**ユーザーストーリー:** ガーディアン/オーナーとして、定義された閾値とタイムロックに基づいてエスクローを承認/拒否したい。

- WHEN ユーザーが `approveRelease` を実行すると THEN システムは UserOperation を構築し Bundler へ送信する。
- WHEN Approver が Approvals Hub を開くと THEN システムは同期（ライブセッション）と非同期署名の両モードを表示し、ポリシー閾値に対する進捗バーと残り重みを提示する。
- WHEN オーナー/ガーディアンが「ライブセッションを開始」を選択すると THEN システムは共有用 QR/URL を生成し、参加メンバーの署名がリアルタイムに進捗へ反映される。
- IF 必要承認数に達しタイムロックが経過した場合 THEN EscrowRegistry は `release` 実行を許可し資産移転またはコールを行う。
- WHEN 閾値を満たしたエスクローが存在すると THEN Escrow Release Console に「Ready to execute」リストを表示し、`release()` または監査ログの更新に必要な次アクションを案内する。
- WHEN ガーディアンが期限超過エスクローに対して `cancel` を提案すると THEN システムは同様の M-of-N 承認を要求する。
- IF 承認者が rolesRoot に含まれていない場合 THEN EscrowRegistry は `UnauthorizedApprover()` でリバートする。
- WHEN ポリシー更新が提案されると THEN システムは強化された閾値（例: 3-of-4）とタイムロックを要求する。

### 要件3: ガススポンサーと Paymaster 利用
**ユーザーストーリー:** 家族メンバーとして、USDC/JPYC 支払いでガスレスに操作したい。

- WHEN ユーザーが UserOperation を送信すると THEN クライアントは Paymaster へ sponsorship を要求する。
- IF Paymaster がトークン残高/日次上限を超える場合 THEN Sponsorship は拒否され、ユーザーに ETH 支払いまたは後日実行を案内する。
- WHEN Sponsorship が成功すると THEN UserOperation は Bundler を経由して EntryPoint に送信される。
- WHEN Paymaster がオフラインの場合 THEN API/クライアントはリトライ戦略とフェールバック（ETH ガス支払い）を提示する。

### 要件4: 可視化・通知・監査
**ユーザーストーリー:** 家族全員として、エスクローの進捗/投票状況/監査ログをリアルタイムで把握したい。

- WHEN Escrow 状態が変化すると THEN サブグラフがイベントをインデックスし、API/クライアントは更新を反映する。
- WHEN 新しい承認やコメントが追加されると THEN Expo Push Notifications/Web Push で通知する。
- WHEN ユーザーが監査画面を開くと THEN システムは Escrow の履歴、承認者、タイムスタンプ、UserOperation ハッシュを表示する。
- IF 不正アクセスが疑われる場合 THEN システムは Guardian/DPO へ緊急通知を送る。

### 要件5: ウォレット接続とリカバリ
**ユーザーストーリー:** メンバーとして、WalletConnect 経由で安全にウォレットを接続し、ソーシャルリカバリや端末紛失時の対応を行いたい。

- WHEN ユーザーが WalletConnect QR をスキャンすると THEN セッションが確立され、アカウントアドレス・ネットワークが同期される。
- IF ユーザーが Base 以外のネットワークに接続している場合 THEN ネットワーク切り替えダイアログを提示する。
- WHEN セッションが失効すると THEN クライアントは再接続/再認証フローを促す。
- WHEN リカバリ手続きが開始されると THEN Guardian 承認 → Timelock → 新デバイス登録の流れを案内する。

### 要件6: UI/UX 表示要件
**ユーザーストーリー:** 各ロールのユーザーとして、Figma で定義されたレイアウトとステートに従い一貫した操作体験を得たい。

- WHEN Web クライアントがレンダリングされると THEN `docs/design/figma` のワイヤーフレームに準拠したカード/テーブル配置とロール別 CTA を表示する（Requester/Approver/Owner/Viewer で差分表示）。
- WHEN Approvals Hub / Group Creation & Invite / Escrow Release Console の各画面を表示すると THEN Figma ワイヤーフレームのステップ（ライブセッション開始、Invite フォーム、Ready/Awaiting リスト）と同じ UI 要素・進捗ゲージを再現する。
- WHEN 画面幅が Desktop/Tablet/Mobile のブレークポイント（1440px/1024px/375px）を跨ぐと THEN 同ワイヤーフレームで定義されたレスポンシブレイアウトへ切り替える。
- WHEN API レスポンスが `loading`/`error`/`empty` の各状態を返すと THEN ワイヤーフレーム内で指定されたステータスコンポーネント（Skeleton/エラーバナー/空表示）を使用してユーザーに状態を伝える。
- WHEN 承認・Paymaster・通知フローに転移状態（Merkle Proof 入力、Bundler 送信、Sponsor fallback 等）が発生すると THEN ワイヤーフレームで示したステップガイドとメッセージを表示し、サーバーからのレスポンスコードと整合させる。
- WHEN Web Push / Expo Push の登録が行われると THEN 成功・失敗時の UI 文言/トーストをワイヤーフレーム仕様どおりに出し分ける。

### 要件7: グループ招待とロール管理
**ユーザーストーリー:** オーナー/ガーディアンとして、重み付きロールを持つメンバーを安全に招待し、期限や使用回数を制御したい。

- WHEN オーナーが Group Creation & Invite 画面でロール・weight・有効期限を入力すると THEN システムは EIP-712 署名済みの招待ハッシュを生成し、リンク/QR を提示する。
- WHEN 招待が発行されると THEN Group Settings にて `pending/accepted/expired` のステータスと残り時間を一覧表示し、必要に応じて再発行ボタンを提供する。
- WHEN モバイルアプリが招待リンク/QR を受け取ると THEN SIWE 認証後に `acceptInvite()` / `proposeAddMember` フローを自動で起動し、成功時に Approvals Hub にドラフトを追加する。
- WHEN Vault に保留中の招待がある場合 THEN Web ダッシュボードとモバイル Home タブのバナーで件数・対応リンクを通知する。
- IF 招待が期限切れとなった場合 THEN 過去のハッシュは失効し、新しい招待でのみメンバー追加が可能であることを UI で明示する。

## 差分サマリ (2025-09-29)
- `docs/design/figma` を v8.0 に更新し、Approvals Hub・Group Creation & Invite・Escrow Release Console の 3 画面と新規コンポーネント（Threshold Progress/Invite Card/Approvals List Item）を統合。
- Web ダッシュボードに ApprovalsHubPanel・GroupInvitePanel・EscrowReleaseConsolePanel を追加し、ロール別 CTA と閾値可視化を拡張。
- モバイルアプリに Group タブと招待バナーを実装し、Expo 側でも招待発行/受領フローを確認できるようにした。
- 要件書にグループ招待・ライブ承認セッション・解放条件ステップの仕様を追加し、同期/非同期マルチシグの UX 要件を明文化。

## 非機能要件

- **セキュリティ**: 重大な権限変更には 24h 以上のタイムロックを必須とし、Slither/Echidna 等の検証結果を CI に組み込む。
- **可用性**: Bundler/Paymaster の冗長構成、最低 99.5% 稼働。API は Cloudflare Workers でグローバル展開。
- **パフォーマンス**: Escrow 一覧は 3 秒以内に初期表示、UserOperation 送信のトランザクション結果は 10 秒以内にフィードバック。
- **監査性**: Escrow イベントはサブグラフに 1 分以内に反映。変更履歴は監査ログに永続化。
- **拡張性**: ポリシーモジュール/RoleVerifier をアップグレード可能な Proxy 構成でデプロイ。

## 開発プロセス要件（Tsumiki 活用）

- プロジェクトルートに導入済みの `tsumiki` フレームワークを活用し、`@kairo-*` `@tdd-*` `@rev-*` 形式のコマンドで要件→設計→タスク→実装を管理する。
- 主要な仕様更新や逆生成が必要な場合は `tsumiki` の `@kairo-requirements` `@kairo-design` `@kairo-tasks` `@kairo-implement` を順序どおり実行し、結果を `.kiro/specs/family_wallet/` に同期する。
- テスト駆動タスクでは `@tdd-*` コマンドを利用してテストケース生成・Red/Green/Refactor の記録を残し、CI ログと照合できるようにする。
- 既存コードの棚卸しや仕様再構築が発生した場合は `@rev-*` コマンドで逆生成し、差分をユーザー承認のうえで仕様書へ反映する。
- `tsumiki-main` 配下のアップデートがあった際は `npm run agents:sync` 相当のコマンドでコマンドファイルを同期し、ドキュメントと開発プロセスが乖離しないようにする。

## リスクと制約

- Base 上の Paymaster/Bundler サービス依存による UX 劣化リスク → 冗長ルートと ETH ガス fallback を用意。
- 役割管理を Merkle Root で行うため、UI/バックエンドでの証明生成の整合性が必須。
- Expo での WalletConnect 実装は OS に依存した制約があるため、主要端末での互換性検証を要する。
- 未成年アカウントの扱いなど法的要件はローカライズ設計で調整が必要。
