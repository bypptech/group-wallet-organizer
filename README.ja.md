# Family Wallet - グループウォレットオーガナイザー

**Unlock, Pay, and Organize — Together.**

グループでの資金管理を安全かつ透明に実現するWeb3ウォレットシステム

---

## 📖 目次

- [プロダクト概要](#プロダクト概要)
- [主要機能](#主要機能)
- [技術的な魅力](#技術的な魅力)
- [対応環境](#対応環境)
- [クイックスタート](#クイックスタート)
- [開発者向けガイド](#開発者向けインストール設定ガイド)
- [プロジェクト構造](#プロジェクト構造)
- [開発コマンド](#開発コマンド)
- [トラブルシューティング](#トラブルシューティング)

---

## プロダクト概要

Family Walletは、家族、友人、チーム、コミュニティなど、あらゆるグループが共同で資金を管理できるスマートコントラクトベースのウォレットプラットフォームです。従来の銀行口座やデジタルウォレットでは実現困難だった「複数人による承認」「透明性の高い資金フロー」「ガス代の最適化」を、Web3技術により実現します。

### 🎯 プロダクトの特徴

- **マルチシグネチャエスクロー**: 複数人の承認による安全な資金管理
- **Account Abstraction (ERC-4337)**: ガスレストランザクションとバッチ処理
- **Paymaster統合**: USDC/JPYCでガス代を支払い、ETH不要で取引可能
- **柔軟な承認フロー**: 同期・非同期承認、タイムロック、期限管理
- **透明性と監査性**: すべての取引がブロックチェーンに記録

---

## 主要機能

### 1. Team Pay（グループの共有ウォレット）

複数人で資金を管理する共有ウォレット機能です。

**主な特徴**
- マルチシグネチャ承認による安全な資金管理
- カスタマイズ可能な承認ルール（閾値、タイムロック、権限設定）
- リアルタイムな承認状況の可視化
- 監査ログによる全取引の追跡可能性
- メンバーごとの役割設定（オーナー、ガーディアン、リクエスター、閲覧者）

**ユースケース**
- 家族の共同貯蓄・生活費管理
- サークルや部活の会計管理
- 複数人で運営するプロジェクト予算管理
- 小規模チームの経費管理

### 2. Leader Pay（立て替え払いの回収ウォレット）

立て替え払いや集金を効率化する回収型ウォレット機能です。

**主な特徴**
- 参加者ごとの支払い状況をリアルタイム追跡
- 個別の招待URLによる簡単な参加管理
- 進捗率の可視化と自動リマインド
- 期日管理とステータス管理
- 支払い履歴の自動記録

**ユースケース**
- 飲み会・イベントの割り勘管理
- 旅行費用の立て替え回収
- グループ購入の支払い管理
- プロジェクト参加費の徴収

### 3. Shareable Keys（共有鍵・招待リンク管理）

グループへの参加を簡単にする招待リンク生成・管理機能です。

**主な特徴**
- **役割ベースの招待リンク生成**: Owner、Guardian、Requester、Viewerなど、役割を指定して招待URLを作成
- **有効期限管理**: 1〜30日の範囲で招待リンクの有効期限を設定可能
- **使用回数制限**: 最大使用回数を設定し、セキュリティを確保
- **権限管理**: 各招待リンクに付与する権限（Permissions）を細かく設定
- **使用履歴追跡**: いつ、誰が招待リンクを使用したかを完全に記録
- **リアルタイム状態管理**: Active（有効）、Expired（期限切れ）、Revoked（無効化）のステータス管理
- **ワンクリック無効化**: 不要になった招待リンクをいつでも無効化可能
- **保留中の招待一覧**: 送信済みでまだ使用されていない招待リンクを一覧表示
- **コピー機能**: 招待リンクをワンクリックでクリップボードにコピー

**ユースケース**
- 新メンバーをグループに簡単に招待
- 期間限定のゲストアクセス提供
- イベント参加者への一時的なアクセス権付与
- 役割別の権限管理を伴う招待
- セキュアな招待リンクの配布と管理

**セキュリティ機能**
- EIP-712署名による招待リンクの検証
- Merkleツリーによるガーディアンリスト管理
- ウォレット署名による本人確認
- 自動期限切れによるセキュリティリスク軽減

### 4. ポリシー管理（Payment & Collection Policies）

支払いルールと集金ルールを定義・管理する機能です。

**主な特徴**
- **Payment Policy（支払いポリシー）**:
  - 最小承認数の設定（Minimum Approvals Required）
  - 最大取引額の制限（Maximum Transaction Amount）
  - クールダウン期間の設定（Cooldown Period）
  - タイムロック機能による二段階承認

- **Collection Policy（集金ポリシー）**:
  - 部分支払いの許可設定（Allow Partial Payment）
  - 自動完了機能（Auto Complete）
  - デフォルト期限の設定（Default Deadline）
  - リマインダー設定（Reminder Settings）

- **ポリシーの適用範囲**:
  - グループ全体への適用
  - 個別エスクローへの適用
  - 複数エスクローでの共有利用

**ユースケース**
- 高額取引に対する厳格な承認ルール設定
- 少額取引の簡易承認フロー設定
- 定期的な集金の自動化ルール設定
- チームごとの異なる承認ルール管理

### 5. エスクロー管理（Escrow Management）

資金の安全な保管と条件付きリリースを実現する機能です。

**主な特徴**
- **7つの状態管理**: DRAFT → PENDING → APPROVED → READY → RELEASED/CANCELLED/EXPIRED
- **5つのエスクロータイプ**: Allowance（お小遣い）、Bill Payment（請求書）、Gift（ギフト）、Reimbursement（払い戻し）、Other（その他）
- **柔軟な承認フロー**:
  - 非同期承認（ASYNC）: 個別に承認を収集
  - 同期承認（SYNC）: 一斉署名による承認
- **承認進捗の可視化**: リアルタイムで承認状況を追跡
- **タイムロック機能**: 承認後の待機期間設定
- **期限管理**: 承認期限とエスクロー有効期限の個別設定
- **Paymaster統合**: USDCやJPYCでガス代を支払い

**ユースケース**
- お小遣いの定期的な支払い管理
- 請求書の承認・支払いフロー
- ギフトやボーナスの配布管理
- 経費精算と払い戻し処理

### 6. 承認ハブ（Approvals Hub）

全てのグループにまたがる承認リクエストを一元管理する機能です。

**主な特徴**
- 全グループの承認待ちリクエストを一覧表示
- 優先度別・期日別のソート機能
- ワンクリック承認・却下
- バッチ承認機能
- リアルタイム通知との連携

### 7. 監査ログ（Audit Trail）

すべての取引とアクションを完全に記録・追跡する機能です。

**主な特徴**
- すべてのトランザクションの記録
- メンバーアクションの追跡
- タイムスタンプ付き証跡
- フィルタリング・検索機能
- エクスポート機能（CSV、JSON）
- オンチェーン検証可能

### 8. スマートコントラクト統合

#### VaultFactory（ウォレット工場）
- **CREATE2による決定的デプロイ**: UUID、オーナー、チェーンIDからウォレットアドレスを事前予測
- **CAIP-10標準対応**: マルチチェーン対応のアドレス管理
- **クローンパターン**: ガス効率的なウォレット作成（Minimal Proxy）
- **アップグレード可能**: 実装コントラクトの更新対応

#### EscrowRegistry（エスクロー管理）
- **7つの状態管理**: DRAFT→PENDING→APPROVED→READY→RELEASED/CANCELLED/EXPIRED
- **5つのエスクロータイプ**: お小遣い、請求書、ギフト、払い戻し、その他
- **柔軟な承認フロー**:
  - 非同期承認（ASYNC）: 個別に承認を収集
  - 同期承認（SYNC）: 一斉署名による承認
- **タイムロック機能**: 承認後の待機期間設定
- **期限管理**: 承認期限とエスクロー有効期限の個別設定

#### PolicyManager（ポリシー管理）
- **承認ルール設定**: 必要な承認数（閾値）の管理
- **ガーディアンリスト管理**: Merkleツリーによる効率的な権限検証
- **EIP-712署名対応**: 型付き構造化データの安全な署名

#### RoleVerifier（役割検証）
- **4つの役割管理**: Owner、Guardian、Requester、Viewer
- **権限ベースアクセス制御**: 各機能への適切なアクセス制御
- **Merkle証明**: ガス効率的な権限検証

#### ERC20Paymaster（ガス代支払い）
- **ERC-20トークンでガス代支払い**: USDC、JPYCなどで取引可能
- **ETH不要**: ネイティブトークンなしで完結
- **残高自動検証**: トークン残高の事前確認
- **フォールバック機能**: 通常のETHガス支払いにも対応

### 9. 通知システム（Notifications）

リアルタイムでグループメンバーに重要な情報を通知する機能です。

**主な特徴**
- 承認リクエストの即時通知
- 期日接近アラート（デッドライン3日前など）
- 取引完了通知（成功・失敗）
- メンバー変更通知（追加・削除・役割変更）
- エスクロー状態変化の通知
- カスタマイズ可能な通知設定

---

## 技術的な魅力

### 🔒 セキュリティ

**マルチレイヤー承認**
- スマートコントラクトレベルの権限管理
- Merkleツリーによる効率的な権限検証（ガス削減）
- EIP-712署名による安全な認証
- Role-Based Access Control（RBAC）による細かい権限制御

**監査可能性**
- すべてのアクションが記録される監査ログ
- ブロックチェーン上の不変記録
- タイムライン機能による変更履歴追跡
- イベントログによるオフチェーン連携

### ⚡ スケーラビリティ

**マルチチェーン対応**
- Base Sepoliaテストネット対応
- CAIP-10標準による統一アドレス管理
- 将来的な他チェーン展開への拡張性
- CREATE2による決定的アドレス生成

**効率的なガス管理**
- Paymaster統合によるガスレス取引
- バッチ処理による最適化
- ERC-4337（Account Abstraction）による柔軟なガス支払い
- Minimal Proxyパターンによる低コストデプロイ

### 👨‍💻 開発者フレンドリー

**モノレポ構成（npm workspaces）**
- `apps/web`: フロントエンド（React 18 + Vite）
- `apps/api`: バックエンド（Hono API）
- `apps/mobile`: モバイルアプリ（Expo/React Native）
- `packages/shared`: 共通型定義・ユーティリティ
- `contracts/`: スマートコントラクト（Hardhat）

**型安全性**
- TypeScript完全対応
- Zod/Drizzleによるスキーマ検証
- wagmi/viemによる型安全なWeb3インタラクション
- 自動生成型定義（Typechain）

**開発効率**
- TDD（テスト駆動開発）フロー
- AIアシスト開発環境（Claude, Gemini, Codex統合）
- 仕様書ベース実装（.kiro/specs管理）
- MCPサーバー統合（GitHub, Playwright, Supabase等）

---

## プロダクトの強み

### 1. 🎨 ユーザー体験
- **直感的なUI/UX**: Shadcn/UIによる洗練されたデザイン
- **マルチデバイス対応**: レスポンシブデザイン（モバイル・タブレット・デスクトップ）
- **ダークモード対応**: システム設定に連動した自動切り替え
- **アクセシビリティ**: WAI-ARIA準拠のコンポーネント

### 2. 🔧 柔軟性
- **カスタマイズ可能な承認ルール**: 閾値、タイムロック、期限設定
- **多様なユースケースに対応**: 家族、サークル、チーム、コミュニティ
- **拡張可能なアーキテクチャ**: プラグイン・モジュール構造
- **マルチトークン対応**: ETH、USDC、JPYC、その他ERC-20

### 3. 🔍 透明性
- **リアルタイムな状況確認**: 承認進捗の可視化
- **完全な監査証跡**: すべての取引・承認の記録
- **オンチェーン検証可能**: ブロックエクスプローラーで確認可能
- **タイムライン表示**: 時系列での変更履歴

### 4. 🚀 利便性
- **ガス代不要**: Paymasterによるガスレス取引
- **招待URL一つで参加**: 複雑な設定不要
- **自動通知・リマインド**: 期日管理・承認催促
- **バッチ処理**: 複数の操作を一度に実行

---

## 対応環境

### ブロックチェーン
- **メインネット**: Base（将来対応予定）
- **テストネット**: Base Sepolia（現在対応）
- **Chain ID**: 84532（Base Sepolia）

### ウォレット
- MetaMask（推奨）
- Rainbow Wallet
- Coinbase Wallet
- その他Ethereum互換ウォレット

### トークン
- **ネイティブ**: ETH
- **ERC-20**: USDC, JPYC, PYUSD（テスト環境）

### ブラウザ
- Chrome / Edge（Chromium）: 最新版
- Firefox: 最新版
- Safari: 最新版（macOS/iOS）

---

## クイックスタート

### 👥 ユーザー向け

1. **ウォレットの準備**
   - MetaMaskをインストール: https://metamask.io/
   - Base Sepoliaネットワークを追加

2. **アプリケーションにアクセス**
   - デモサイト: https://your-demo-url.vercel.app
   - ウォレット接続ボタンをクリック

3. **グループウォレットの作成**
   - 「新しいグループを作成」をクリック
   - グループ名と初期メンバーを設定
   - 承認ルール（閾値）を設定

4. **メンバーの招待**
   - 招待URLを生成
   - メンバーにURLを共有
   - メンバーが参加すると通知

5. **エスクローの作成と承認**
   - 「新しいリクエスト」から支払いリクエスト作成
   - 必要なメンバーが承認
   - 承認完了後、自動実行

### 👨‍💻 開発者向け

詳細は下記の「[開発者向けインストール＆設定ガイド](#開発者向けインストール設定ガイド)」を参照してください。

---

# 開発者向けインストール＆設定ガイド

このセクションでは、Family Walletの開発環境をゼロからセットアップする完全な手順を説明します。

## 📋 前提環境

### 必須環境

| ツール | バージョン | 用途 |
|--------|-----------|------|
| **Node.js** | v20以上 | JavaScript/TypeScriptランタイム |
| **npm** | 最新版 | パッケージマネージャー |
| **Git** | 2.x以上 | バージョン管理 |
| **PostgreSQL** | 14以上 | データベース（またはSupabase） |

### 推奨環境

| ツール | 用途 |
|--------|------|
| **VSCode** | TypeScript開発環境（推奨エディタ） |
| **MetaMask** | ウォレット接続テスト |
| **Base Sepolia ETH** | テストネット取引用 |
| **Alchemy/Infura** | RPC Provider（オプション） |

### 環境確認

```bash
# 必須環境の確認
node --version    # v20以上を確認
npm --version     # 最新版を確認
git --version     # 2.x以上を確認
psql --version    # PostgreSQL 14以上を確認（ローカルDB使用時）

# Homebrewでのインストール例（macOS）
brew install node@20
brew install postgresql@14
brew install git
```

---

## 🚀 インストール手順

### Step 1: リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/your-org/family-wallet.git
cd family-wallet

# または SSHでクローン
git clone git@github.com:your-org/family-wallet.git
cd family-wallet

# ブランチ確認
git branch
```

### Step 2: 依存関係のインストール

```bash
# npm workspaces を使用して全パッケージの依存関係をインストール
npm ci

# インストール確認（各ワークスペースの確認）
npm list --depth=0 --workspace=apps/web
npm list --depth=0 --workspace=apps/api
npm list --depth=0 --workspace=packages/shared

# 必要に応じてキャッシュクリア
npm cache clean --force
```

### Step 3: 環境変数の設定

#### 3-1. 環境変数ファイルの作成

プロジェクトルートに `.env` ファイルを作成します：

```bash
# エディタで .env を作成
touch .env
code .env  # VSCode
# または
nano .env  # ターミナルエディタ
```

#### 3-2. 必須の環境変数

以下の環境変数を `.env` ファイルに設定してください：

```bash
#====================================
# データベース設定（必須）
#====================================
# PostgreSQL接続文字列 - Neon Serverless推奨
# 形式: postgres://[user]:[password]@[host]/[database]?sslmode=require

# ローカルPostgreSQL使用時
DATABASE_URL=postgres://username:password@localhost:5432/family_wallet

# Neon Database使用時（推奨）
# DATABASE_URL=postgres://[user]:[password]@[host].neon.tech/[database]?sslmode=require
# NEON_DATABASE_URL=postgres://[user]:[password]@[host].neon.tech/[database]?sslmode=require

# Supabase使用時
# DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# オプション: データベース接続プール設定
# DATABASE_MAX_CONNECTIONS=10
# DATABASE_IDLE_TIMEOUT=30000

#====================================
# API設定（必須）
#====================================
# JWT署名用の秘密鍵（32文字以上の16進数文字列）
# 生成方法: openssl rand -hex 32
JWT_SECRET=your_generated_jwt_secret_here

# WebフロントエンドのオリジンURL（CORS設定）
WEB_ORIGIN=http://localhost:5173

# APIサーバーのポート（デフォルト: 3001）
PORT=3001

# Node環境（development/production）
NODE_ENV=development

#====================================
# Web3設定 - RPC接続（必須）
#====================================
# Alchemy API Key（推奨）
VITE_ALCHEMY_API_KEY=your_alchemy_api_key

# または カスタムRPC URL
# VITE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Base Sepolia RPC（Hardhat用）
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# または Alchemy使用時
# BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Base Mainnet RPC（本番用）
# BASE_MAINNET_RPC_URL=https://mainnet.base.org

#====================================
# WalletConnect設定（必須）
#====================================
# WalletConnect Project ID
# 取得先: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

#====================================
# Account Abstraction - Bundler/Paymaster（オプション）
#====================================
# Bundler RPC URL（ERC-4337用）
# VITE_BUNDLER_RPC_URL=https://bundler.example.com

# Paymaster アドレス（ガスレストランザクション用）
# VITE_PAYMASTER_ADDRESS=0x...

#====================================
# スマートコントラクトアドレス（デプロイ後に設定）
#====================================
# 初回起動時は空でOK - デプロイ後に設定
VITE_VAULT_FACTORY_ADDRESS=
VITE_ESCROW_REGISTRY_ADDRESS=
VITE_POLICY_MANAGER_ADDRESS=
VITE_ROLE_VERIFIER_ADDRESS=
VITE_ERC20_PAYMASTER_ADDRESS=

#====================================
# スマートコントラクト開発・デプロイ用（オプション）
#====================================
# デプロイ用の秘密鍵（テストネット専用、本番環境では使用禁止）
# ⚠️ 警告: この鍵には少額のテストETHのみを保管すること
PRIVATE_KEY=your_private_key_for_deployment

# BaseScan API Key（コントラクト検証用）
# 取得先: https://basescan.org/myapikey
BASESCAN_API_KEY=your_basescan_api_key

# Gas Reporter設定
REPORT_GAS=false
# COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

#### 3-3. JWT_SECRETの生成

```bash
# ランダムな秘密鍵を生成
openssl rand -hex 32

# または Node.jsで生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成された値を .env の JWT_SECRET に設定
```

### Step 4: データベースのセットアップ

#### 4-1. データベースプロバイダーの選択

以下のいずれかを選択してください：

**A. Neon Database（推奨 - サーバーレス）**
1. [Neon](https://neon.tech/)にサインアップ
2. 新しいプロジェクトを作成
3. 接続文字列をコピー
4. `.env` の `DATABASE_URL` に設定
5. 自動スケーリング・ブランチ機能が利用可能

**B. Supabase（オールインワン）**
1. [Supabase](https://supabase.com/)にサインアップ
2. 新しいプロジェクトを作成
3. Settings → Database → Connection string → URI から取得
4. `.env` の `DATABASE_URL` に設定

**C. ローカルPostgreSQL**
```bash
# PostgreSQLサービスの起動（macOS）
brew services start postgresql@14

# データベースの作成
createdb family_wallet

# ユーザーとパスワードの設定
psql postgres
postgres=# CREATE USER myuser WITH PASSWORD 'mypassword';
postgres=# GRANT ALL PRIVILEGES ON DATABASE family_wallet TO myuser;
postgres=# \q
```

#### 4-2. スキーマのプッシュ

```bash
# Drizzle ORMでスキーマをデータベースに反映
npm run db:push

# 確認: Drizzle Studioでデータベースを表示（apps/apiディレクトリで実行）
cd apps/api
npm run db:studio
# → http://localhost:4983 でブラウザが開く
```

### Step 5: 開発サーバーの起動

```bash
# 全サービス（API + Web）を同時起動
npm run dev

# → API: http://localhost:3001
# → Web: http://localhost:5173

# または個別に起動
npm run dev:api  # APIサーバーのみ起動（ポート: 3001）
npm run dev:web  # Webフロントエンドのみ起動（ポート: 5173）
```

**起動確認**
- API: http://localhost:3001 にアクセス
- Web: http://localhost:5173 にアクセス

### Step 6: 動作確認

#### 6-1. APIの動作確認

```bash
# ヘルスチェック
curl http://localhost:3001/

# レスポンス例
# {"message":"Family Wallet API is running"}
# または
# {"status":"ok"}
```

#### 6-2. Webの動作確認

1. ブラウザで http://localhost:5173 を開く
2. MetaMaskを接続
3. Base Sepoliaネットワークに切り替え
4. ウォレット接続ボタンをクリック

#### 6-3. Base Sepolia の追加（MetaMask）

MetaMaskに Base Sepolia ネットワークを追加：

```
ネットワーク名: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
通貨記号: ETH
ブロックエクスプローラー: https://sepolia.basescan.org
```

#### 6-4. テストネットETHの取得

```bash
# Base Sepolia Faucet
https://www.alchemy.com/faucets/base-sepolia

# または Coinbase Faucet
https://coinbase.com/faucets/base-ethereum-sepolia-faucet
```

---

## 🏗️ スマートコントラクトのデプロイ（オプション）

### 前提条件

- `.env` に以下が設定されていること:
  - `PRIVATE_KEY`: デプロイ用ウォレットの秘密鍵
  - `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC URL（デフォルト: https://sepolia.base.org）
  - `BASESCAN_API_KEY`: コントラクト検証用（オプション）
- デプロイ用ウォレットに Base Sepolia ETH があること

### デプロイ手順

```bash
# 1. コントラクトのコンパイル
npm run compile
# または
npx hardhat compile

# 2. テストの実行（デプロイ前に必ず実行）
npm run test:contracts
# または
npx hardhat test

# 3. ガスレポート（オプション）
npm run test:gas
# または
REPORT_GAS=true npx hardhat test

# 4. カバレッジレポート（オプション）
npm run test:coverage
# または
npx hardhat coverage

# 5. ローカルネットワークでのテスト
npm run deploy:local
# または
npx hardhat run scripts/deploy.ts --network localhost

# 6. Base Sepolia へのデプロイ
npx hardhat run scripts/deploy.ts --network baseSepolia

# 7. デプロイされたアドレスを .env に追加
# VITE_VAULT_FACTORY_ADDRESS=0x...
# VITE_ESCROW_REGISTRY_ADDRESS=0x...
# 等

# 6. コントラクトの検証（Etherscan）
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

---

## 📁 プロジェクト構造

```
family-wallet/
├── apps/                           # アプリケーション群
│   ├── web/                        # フロントエンド（React 18 + Vite）
│   │   ├── src/
│   │   │   ├── components/         # UIコンポーネント
│   │   │   │   ├── ui/            # Shadcn/UI基本コンポーネント
│   │   │   │   ├── layout/        # レイアウトコンポーネント
│   │   │   │   ├── wallet/        # ウォレット関連コンポーネント
│   │   │   │   └── escrow/        # エスクロー関連コンポーネント
│   │   │   ├── hooks/              # カスタムフック
│   │   │   │   ├── useVault.ts    # Vault操作フック
│   │   │   │   ├── useEscrow.ts   # エスクロー操作フック
│   │   │   │   └── usePolicy.ts   # ポリシー管理フック
│   │   │   ├── pages/              # ページコンポーネント
│   │   │   │   ├── home.tsx       # ホーム
│   │   │   │   ├── wallet-demo.tsx # ウォレットデモ
│   │   │   │   ├── invite.tsx     # 招待ページ
│   │   │   │   └── not-found.tsx  # 404ページ
│   │   │   ├── providers/          # コンテキストプロバイダー
│   │   │   │   ├── Web3Provider.tsx # Web3設定
│   │   │   │   └── QueryProvider.tsx # TanStack Query
│   │   │   ├── lib/                # ライブラリ・ユーティリティ
│   │   │   │   ├── contracts/     # コントラクトABI・アドレス
│   │   │   │   ├── utils.ts       # ユーティリティ関数
│   │   │   │   └── constants.ts   # 定数定義
│   │   │   └── styles/             # グローバルスタイル
│   │   ├── vite.config.ts          # Vite設定
│   │   └── package.json
│   │
│   ├── api/                        # バックエンド（Hono on Node.js）
│   │   ├── src/
│   │   │   ├── routes/             # APIルート
│   │   │   │   ├── auth.ts        # 認証エンドポイント
│   │   │   │   ├── vaults.ts      # Vault管理
│   │   │   │   ├── escrows.ts     # エスクロー管理
│   │   │   │   └── invitations.ts # 招待管理
│   │   │   ├── services/           # ビジネスロジック
│   │   │   │   ├── vaultService.ts
│   │   │   │   ├── escrowService.ts
│   │   │   │   └── authService.ts
│   │   │   ├── db/                 # データベース
│   │   │   │   ├── schema.ts      # Drizzleスキーマ定義
│   │   │   │   └── migrations/    # マイグレーション
│   │   │   ├── middleware/         # ミドルウェア
│   │   │   │   ├── auth.ts        # JWT認証
│   │   │   │   └── cors.ts        # CORS設定
│   │   │   ├── honoApp.ts          # Honoアプリケーション
│   │   │   └── index.ts            # エントリーポイント
│   │   ├── drizzle.config.ts       # Drizzle設定
│   │   └── package.json
│   │
│   └── mobile/                     # モバイルアプリ（Expo/React Native）
│       ├── app/                    # Expo Routerページ
│       ├── components/             # モバイルコンポーネント
│       └── package.json
│
├── packages/                       # 共有パッケージ
│   └── shared/                     # 共通型定義・ユーティリティ
│       ├── src/
│       │   ├── types/              # TypeScript型定義
│       │   │   ├── vault.ts       # Vault型
│       │   │   ├── escrow.ts      # エスクロー型
│       │   │   └── user.ts        # ユーザー型
│       │   ├── schemas/            # Zodスキーマ
│       │   │   ├── vaultSchema.ts
│       │   │   └── escrowSchema.ts
│       │   └── utils/              # 共通ユーティリティ
│       └── package.json
│
├── contracts/                      # スマートコントラクト（Hardhat）
│   ├── contracts/                  # Solidityソースコード
│   │   ├── core/                   # コアコントラクト
│   │   │   └── VaultFactory.sol   # Vault工場
│   │   ├── EscrowRegistry.sol      # エスクロー管理
│   │   ├── modules/                # モジュール
│   │   │   ├── PolicyManager.sol  # ポリシー管理
│   │   │   ├── RoleVerifier.sol   # 役割検証
│   │   │   └── GuardianModule.sol # ガーディアン管理
│   │   ├── paymaster/              # Paymaster
│   │   │   └── ERC20Paymaster.sol # ERC-20ガス支払い
│   │   ├── interfaces/             # インターフェース
│   │   └── mocks/                  # テスト用モック
│   ├── test/                       # コントラクトテスト
│   │   ├── VaultFactory.test.ts
│   │   ├── EscrowRegistry.test.ts
│   │   └── PolicyManager.test.ts
│   ├── scripts/                    # デプロイスクリプト
│   │   ├── deploy.ts              # メインデプロイ
│   │   └── verify.ts              # 検証スクリプト
│   ├── hardhat.config.ts           # Hardhat設定
│   └── package.json
│
├── .ai/                            # AI開発設定（単一ソース）
│   ├── config.yaml                 # AI共通設定
│   ├── quality-gates.yaml          # 品質ゲート定義
│   └── templates/                  # コマンドテンプレート
│
├── .claude/                        # Claude設定（生成物）
│   ├── AGENTS.md                   # Claude用指示書
│   ├── CLAUDE.generated.md         # 自動生成設定
│   ├── commands/                   # Claudeコマンド
│   └── mcp.json                    # MCP設定（同期）
│
├── .kiro/                          # Kiro仕様管理（正本）
│   ├── specs/                      # プロジェクト仕様書
│   │   └── family-wallet/
│   │       ├── requirements.md    # 要件定義書
│   │       ├── design.md          # 設計書
│   │       └── tasks.md           # タスクリスト
│   ├── settings/                   # Kiro設定
│   └── logs/                       # 実行ログ
│
├── docs/                           # ドキュメント
│   ├── specs/                      # 仕様ドラフト
│   ├── design/                     # 設計ドラフト
│   ├── api/                        # API仕様
│   └── architecture/               # アーキテクチャ図
│
├── scripts/                        # 自動化スクリプト
│   ├── ai-config-migrator.js       # AI設定同期
│   ├── agents/                     # エージェント管理
│   ├── specs/                      # 仕様同期
│   ├── mcp/                        # MCPチェック
│   └── vibekit/                    # VibeKit統合
│
├── .github/                        # GitHub設定
│   └── workflows/                  # CI/CDワークフロー
│       ├── ai-sync.yml            # AI設定同期チェック
│       ├── test.yml               # テスト実行
│       └── deploy.yml             # デプロイ
│
├── mcp.json                        # MCPサーバー定義（単一ソース）
├── tsconfig.base.json              # TypeScript基本設定
├── package.json                    # ルートパッケージ設定
├── README.md                       # 英語版README
├── README.ja.md                    # 日本語版README（このファイル）
└── AGENTS.md                       # 運用規範（最優先）
```

---

## 🛠️ 主要技術スタック

### フロントエンド

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **フレームワーク** | React 18 + Vite | 高速なビルドと開発体験 |
| **言語** | TypeScript 5.6 | 型安全性の確保 |
| **スタイリング** | TailwindCSS + Shadcn/UI | ユーティリティファーストCSS + 高品質UIコンポーネント |
| **状態管理** | TanStack Query | サーバー状態の効率的な管理 |
| **ルーティング** | Wouter | 軽量なクライアントサイドルーティング |
| **アニメーション** | Framer Motion | 滑らかなアニメーション・トランジション |
| **Web3** | wagmi + viem + RainbowKit | 型安全なWeb3フック + ウォレット接続UI |
| **フォーム** | React Hook Form + Zod | フォーム管理 + バリデーション |

### バックエンド

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **フレームワーク** | Hono | 超高速な軽量Webフレームワーク |
| **ランタイム** | Node.js 20+ | サーバーサイドJavaScript実行環境 |
| **認証** | JWT（jose + bcryptjs） | トークンベース認証 + パスワードハッシュ |
| **バリデーション** | Zod | スキーマバリデーション |
| **ORM** | Drizzle ORM | 型安全なデータベースクエリ |
| **データベース** | PostgreSQL / Supabase | リレーショナルデータベース |

### スマートコントラクト

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **開発環境** | Hardhat | コントラクト開発・テスト・デプロイ |
| **言語** | Solidity ^0.8.24 | スマートコントラクト言語 |
| **標準** | ERC-4337 | Account Abstraction標準 |
| **ライブラリ** | OpenZeppelin Contracts | セキュアなコントラクトライブラリ |
| **テスト** | Mocha + Chai | ユニットテスト |
| **型生成** | Typechain | ABIからTypeScript型を自動生成 |

### 開発支援・AI統合

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **AI統合** | Claude, Gemini, Codex | 実装・仕様作成・コード補完 |
| **MCP** | context7, GitHub, Playwright等 | 最新ドキュメント・リポジトリ操作・E2Eテスト |
| **仕様管理** | Kiro | 仕様書の正本管理・TDDフロー |
| **モノレポ** | npm workspaces | マルチパッケージ管理 |

---

## ⚙️ 開発コマンド

### アプリケーション開発

```bash
#------------------------------------
# 開発サーバー
#------------------------------------
npm run dev              # API + Web 同時起動（推奨）
npm run dev:api          # APIサーバーのみ起動（localhost:5000）
npm run dev:web          # Webフロントエンドのみ起動（localhost:5173）

#------------------------------------
# ビルド
#------------------------------------
npm run build            # 全体ビルド（Web + API）
npm run build:api        # APIサーバーのビルド
npm run build:web        # Webフロントエンドのビルド

#------------------------------------
# 本番起動
#------------------------------------
npm start                # APIサーバー起動（ビルド後）
npm run preview -w apps/web  # Webプレビュー（ビルド確認用）

#------------------------------------
# 型チェック
#------------------------------------
npm run check            # 全体の型チェック（tsconfig.base.json）
npm run check -w apps/web    # Webの型チェック
npm run check -w apps/api    # APIの型チェック
```

### データベース管理

```bash
#------------------------------------
# スキーマ管理
#------------------------------------
npm run db:push          # Drizzle ORMでスキーマをDBに反映

# Drizzle Studio起動（データベースGUI）
npx drizzle-kit studio
# → http://localhost:4983 でブラウザが開く

#------------------------------------
# マイグレーション（高度な使用）
#------------------------------------
npx drizzle-kit generate:pg  # PostgreSQL用マイグレーション生成
npx drizzle-kit migrate      # マイグレーション実行
npx drizzle-kit drop         # スキーマ削除（注意！）
```

### スマートコントラクト開発

```bash
#------------------------------------
# コンパイル・ビルド
#------------------------------------
npm run compile          # Solidityコントラクトのコンパイル
npm run hardhat clean    # アーティファクト削除

#------------------------------------
# テスト
#------------------------------------
npm run test:contracts   # 全テスト実行
npm run test:coverage    # カバレッジレポート生成
npm run test:gas         # ガス使用量レポート

# 特定のテストのみ実行
npx hardhat test test/VaultFactory.test.ts
npx hardhat test --grep "createVault"

#------------------------------------
# デプロイ
#------------------------------------
npm run deploy:local     # ローカルネットワークにデプロイ

# Base Sepoliaにデプロイ
npx hardhat run scripts/deploy.ts --network baseSepolia

# コントラクト検証（Etherscan）
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

#------------------------------------
# Hardhatユーティリティ
#------------------------------------
npm run hardhat console  # Hardhatコンソール起動
npm run hardhat node     # ローカルノード起動（別ターミナル）
npx hardhat accounts     # アカウント一覧表示
npx hardhat compile --force  # 強制再コンパイル
```

### 仕様管理・AI開発

```bash
#------------------------------------
# 仕様書作成（Kiro）
#------------------------------------
npm run spec:init        # 仕様書雛形作成

# AI設定の同期
npm run ai:migrate       # .ai/ → 各AIツールへ設定生成
npm run agents:sync      # コマンドテンプレート配布
npm run specs:sync       # docs → .kiro/specs へ同期

#------------------------------------
# TDDサイクル
#------------------------------------
npm run tdd:cycle        # TDDサイクル実行

#------------------------------------
# MCP確認
#------------------------------------
npm run mcp:check        # MCPサーバー定義の確認

#------------------------------------
# VibeKit（Web3開発支援）
#------------------------------------
npm run vibe:create-feature  # 新機能作成
npm run vibe:setup-plan      # セットアップ計画
npm run vibe:check-prereq    # 前提条件チェック
```

### テスト

```bash
#------------------------------------
# フロントエンドテスト（設定後）
#------------------------------------
# cd apps/web
# npm test                 # ユニットテスト
# npm run test:e2e         # E2Eテスト（Playwright）
# npm run test:coverage    # カバレッジレポート

#------------------------------------
# バックエンドテスト（設定後）
#------------------------------------
# cd apps/api
# npm test                 # ユニットテスト
# npm run test:integration # 統合テスト
```

### ユーティリティ

```bash
#------------------------------------
# クリーンアップ
#------------------------------------
# node_modules削除・再インストール
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm ci

# ビルド成果物削除
rm -rf apps/web/dist apps/api/dist

#------------------------------------
# 依存関係管理
#------------------------------------
npm audit                # 脆弱性チェック
npm audit fix            # 自動修正
npm outdated             # 古いパッケージ確認
npm update               # パッケージ更新

#------------------------------------
# ワークスペース操作
#------------------------------------
npm list --depth=0       # ルートの依存関係表示
npm list --depth=0 -w apps/web  # Web の依存関係表示
npm install <package> -w apps/web  # Web に パッケージ追加
```

---

## 🧪 テスト

### テスト戦略

このプロジェクトでは、包括的なテスト戦略を採用しています：

1. **スマートコントラクト**: Hardhatによるユニットテスト（必須）
2. **フロントエンド**: React Testing Library（設定後）
3. **E2E**: Playwright（設定後）
4. **API**: Honoテスト（設定後）

### スマートコントラクトテスト

```bash
# 全テスト実行
npm run test:contracts

# カバレッジレポート
npm run test:coverage
# → coverage/index.html でブラウザ表示

# ガス使用量レポート
npm run test:gas

# 特定のテストのみ実行
npx hardhat test test/VaultFactory.test.ts
npx hardhat test --grep "should create vault with UUID"

# デバッグモード
npx hardhat test --verbose
```

---

## 🚀 デプロイ

### フロントエンド（Vercel推奨）

#### Vercelへのデプロイ

1. **Vercelアカウントの準備**
   - [Vercel](https://vercel.com/)にサインアップ
   - GitHubリポジトリを連携

2. **環境変数の設定**
   ```
   VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   VITE_VAULT_FACTORY_ADDRESS=0x...
   VITE_ESCROW_REGISTRY_ADDRESS=0x...
   （その他のコントラクトアドレス）
   ```

3. **ビルド設定**
   ```
   Framework Preset: Vite
   Build Command: npm run build:web
   Output Directory: apps/web/dist
   Install Command: npm ci
   ```

4. **デプロイ実行**
   ```bash
   # 自動デプロイ（GitHubプッシュ時）または手動
   vercel --prod
   ```

### バックエンド（Railway/Render推奨）

#### Railwayへのデプロイ

1. **Railwayアカウントの準備**
   - [Railway](https://railway.app/)にサインアップ
   - 新しいプロジェクトを作成

2. **環境変数の設定**
   ```
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   WEB_ORIGIN=https://your-frontend.vercel.app
   PORT=5000
   ```

3. **デプロイ設定**
   ```
   Start Command: npm start
   Build Command: npm run build:api
   Root Directory: /
   ```

#### Renderへのデプロイ

1. **Renderアカウントの準備**
   - [Render](https://render.com/)にサインアップ
   - 新しいWebサービスを作成

2. **ビルド設定**
   ```
   Build Command: npm ci && npm run build:api
   Start Command: npm start
   ```

### スマートコントラクト（Base Sepolia）

#### デプロイ手順

```bash
# 1. 環境変数の確認
echo $PRIVATE_KEY
echo $ALCHEMY_API_KEY

# 2. コンパイルとテスト
npm run compile
npm run test:contracts

# 3. Base Sepoliaへデプロイ
npx hardhat run scripts/deploy.ts --network baseSepolia

# 出力例：
# Deploying VaultFactory...
# VaultFactory deployed to: 0x1234...
# Deploying EscrowRegistry...
# EscrowRegistry deployed to: 0x5678...

# 4. デプロイされたアドレスを .env に追加
# VITE_VAULT_FACTORY_ADDRESS=0x1234...
# VITE_ESCROW_REGISTRY_ADDRESS=0x5678...

# 5. Etherscanで検証
npx hardhat verify --network baseSepolia 0x1234... <CONSTRUCTOR_ARGS>
```

---

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー

```bash
# 問題: "could not connect to server" エラー

# 解決策1: DATABASE_URL を確認
echo $DATABASE_URL

# 解決策2: PostgreSQLサービスの起動確認（ローカル）
brew services list
brew services start postgresql@14

# 解決策3: Supabase接続確認
# Supabase Dashboard → Settings → Database → Connection String

# 解決策4: スキーマを再プッシュ
npm run db:push
```

#### 2. ポート衝突

```bash
# 問題: "Port 5000 is already in use"

# 解決策1: ポート変更
PORT=3001 npm run dev:api

# 解決策2: プロセスを確認・終了
lsof -ti:5000 | xargs kill -9

# 解決策3: .env でポート設定
echo "PORT=3001" >> .env
```

#### 3. Web3接続エラー

```bash
# 問題: "Could not detect network" または "Chain not supported"

# 解決策:
# 1. MetaMaskでBase Sepoliaネットワークを追加
#    ネットワーク名: Base Sepolia
#    RPC URL: https://sepolia.base.org
#    Chain ID: 84532
#    通貨記号: ETH
#    ブロックエクスプローラー: https://sepolia.basescan.org

# 2. RPCエンドポイント確認
echo $VITE_BASE_SEPOLIA_RPC

# 3. テストネットETH残高確認
# Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia
```

#### 4. ビルドエラー

```bash
# 問題: "Module not found" または型エラー

# 解決策1: 依存関係の再インストール
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm ci

# 解決策2: TypeScript型チェック
npm run check

# 解決策3: キャッシュクリア
npm cache clean --force
rm -rf apps/web/dist apps/api/dist

# 解決策4: パスエイリアス確認
# @shared/* が packages/shared/src/* を参照しているか確認
cat tsconfig.base.json
```

#### 5. スマートコントラクトデプロイエラー

```bash
# 問題: "insufficient funds for gas * price + value"

# 解決策1: ETH残高確認
# MetaMaskでBase Sepolia残高を確認

# 解決策2: Faucetから取得
# https://www.alchemy.com/faucets/base-sepolia

# 問題: "nonce too low"

# 解決策: MetaMaskのアカウントをリセット
# MetaMask → 設定 → 高度な設定 → アカウントのリセット
```

#### 6. AI設定の同期エラー

```bash
# 問題: "AI configuration out of sync" in CI

# 解決策:
npm run ai:migrate
npm run agents:sync
git add .
git commit -m "sync: update AI configurations"
```

---

## 🤝 コントリビューション

### 開発フロー

このプロジェクトでは、**仕様書ベース開発**と**TDD（テスト駆動開発）**を採用しています。

#### 1. 仕様作成

```bash
# 仕様書雛形作成
npm run spec:init

# Kiroコマンドで段階的に仕様作成
# @kairo-requirements  # 要件定義
# @kairo-design       # 設計書
# @kairo-tasks        # タスクリスト

# 仕様書の同期（レビュー承認後）
npm run specs:sync -- --project <name>
```

#### 2. TDD実装

```bash
# TDDサイクルの実行
npm run tdd:cycle

# または個別に:
# @tdd-requirements   # TDD要件定義
# @tdd-testcases     # テストケース作成
# @tdd-red           # 失敗テスト作成（RED）
# @tdd-green         # 最小実装（GREEN）
# @tdd-refactor      # リファクタリング（REFACTOR）
```

#### 3. テスト

```bash
# スマートコントラクト
npm run test:contracts
npm run test:coverage

# フロントエンド（設定後）
cd apps/web && npm test

# E2E（設定後）
cd apps/web && npm run test:e2e
```

#### 4. コミット

```bash
# 変更をステージング
git add .

# コミットメッセージ規約（Conventional Commits）
git commit -m "feat: 新しいエスクロー機能を追加"
git commit -m "fix: ウォレット接続のバグ修正"
git commit -m "docs: READMEの更新"
git commit -m "test: VaultFactoryのテスト追加"
git commit -m "refactor: PolicyManagerのリファクタリング"
```

#### 5. プルリクエスト

1. フォークまたはブランチ作成
   ```bash
   git checkout -b feature/escrow-enhancements
   ```

2. 変更のプッシュ
   ```bash
   git push origin feature/escrow-enhancements
   ```

3. GitHub上でPRを作成
   - 明確なタイトルと説明
   - 関連するIssueをリンク
   - レビュワーをアサイン

4. CI/CDチェック通過確認
   - AI設定同期チェック
   - テスト実行
   - ビルド成功

### コーディング規約

- **TypeScript必須**: すべてのコードはTypeScriptで記述
- **型安全性**: `any`の使用を避け、適切な型定義
- **Zod/Drizzle**: スキーマバリデーションの徹底
- **フォーマット**: Prettier使用（設定後）
- **リント**: ESLint準拠（設定後）
- **テストカバレッジ**: 80%以上を目標
- **コメント**: 複雑なロジックには必ずコメント

---

## 🔐 セキュリティ

### ベストプラクティス

#### 環境変数管理

```bash
# ❌ 絶対にやってはいけないこと
git add .env
git commit -m "add env file"  # 秘密情報がコミットされる！

# ✅ 正しい方法
# 1. .env は .gitignore に追加（済み）
# 2. .env.example をテンプレートとして提供
# 3. 本番環境はホスティングサービスの環境変数機能を使用
```

#### 秘密鍵管理

```bash
# ✅ JWT_SECRET生成
openssl rand -hex 32

# ✅ 環境ごとに異なる秘密鍵を使用
# 開発: .env.local
# ステージング: Vercel/Railway環境変数
# 本番: Vercel/Railway環境変数（異なる値）

# ❌ ハードコードしない
const JWT_SECRET = "my-secret";  # 絶対にNG！
```

#### 依存関係のセキュリティ

```bash
# 定期的な脆弱性チェック（週1回推奨）
npm audit

# 自動修正可能なものは修正
npm audit fix

# 手動確認が必要な場合
npm audit fix --force  # 慎重に実行

# 依存関係の更新
npm outdated
npm update
```

#### スマートコントラクトのセキュリティ

```bash
# 監査チェックリスト:
# 1. OpenZeppelinライブラリの使用
# 2. Reentrancy攻撃の防止
# 3. オーバーフロー/アンダーフローの防止（Solidity 0.8+で自動）
# 4. アクセス制御の適切な実装
# 5. 外部監査の実施（本番前）

# テストカバレッジ100%を目指す
npm run test:coverage
```

---

## 📚 リソース

### プロジェクトドキュメント

- [技術仕様書](.kiro/specs/family-wallet/)
- [API仕様](docs/api/)
- [スマートコントラクト仕様](contracts/README.md)
- [アーキテクチャ図](docs/architecture/)

### 公式ドキュメント

#### ブロックチェーン
- [Base Network](https://base.org/)
- [Base Docs](https://docs.base.org/)
- [ERC-4337（Account Abstraction）](https://eips.ethereum.org/EIPS/eip-4337)
- [CAIP-10（Chain Agnostic Identifiers）](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md)

#### スマートコントラクト
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat](https://hardhat.org/docs)
- [Etherscan](https://sepolia.basescan.org/)

#### フロントエンド
- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [wagmi](https://wagmi.sh/)
- [viem](https://viem.sh/)
- [RainbowKit](https://www.rainbowkit.com/)

#### バックエンド
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod](https://zod.dev/)
- [jose（JWT）](https://github.com/panva/jose)

#### ツール
- [TanStack Query](https://tanstack.com/query/)
- [Wouter](https://github.com/molefrog/wouter)
- [Framer Motion](https://www.framer.com/motion/)

### コミュニティ

- **GitHub Issues**: [Issues](https://github.com/your-org/family-wallet/issues)
- **GitHub Discussions**: [Discussions](https://github.com/your-org/family-wallet/discussions)
- **Discord**: （準備中）
- **Twitter**: （準備中）

---

## 📄 ライセンス

MIT License

Copyright (c) 2025 Family Wallet Contributors

詳細は [LICENSE](./LICENSE) ファイルを参照してください。

---

## 🙏 謝辞

このプロジェクトは以下の技術・コミュニティに支えられています：

- **Base Network**: スケーラブルなL2ソリューション
- **OpenZeppelin**: セキュアなスマートコントラクトライブラリ
- **wagmi/viem**: 型安全なWeb3開発体験
- **Hono**: 超高速なWebフレームワーク
- **Shadcn/UI**: 美しいUIコンポーネント

---

**Family Wallet** - グループの資金管理を、もっと簡単に、もっと安全に。

**Unlock, Pay, and Organize — Together.** 🚀
