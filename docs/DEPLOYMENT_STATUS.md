# Family Wallet - デプロイステータス

**最終更新**: 2025-10-04 22:00
**総合進捗**: 95%

---

## デプロイ準備状況

### ✅ 完了している作業

#### 1. スマートコントラクト（Base Sepolia）
- [x] EscrowRegistry: `0x636b998315e77408806CccFCC93af4D1179afc2f`
- [x] PolicyManager: `0xE903dc0061212Abd78668d81a8c5F02C603Dc19E`
- [x] RoleVerifier: `0xA68B80144d3291D5b53cE8C62c306fE195668d60`
- [x] GuardianModule: `0x18e89214CB9ED4bC16362b158C5D0E35d87c7828`
- [x] ERC20Paymaster: `0xb4F5880bbAD08803dc9F473b427b1Bc385431D16`
- [x] Basescan検証完了

#### 2. Subgraph（The Graph Studio）
- [x] エンドポイント: `https://api.studio.thegraph.com/query/121881/family-wallet/v0.0.2`
- [x] インデックス動作確認済み

#### 3. デプロイ設定ファイル
- [x] `apps/api/wrangler.toml` - Cloudflare Workers設定
- [x] `apps/api/src/server-cloudflare.ts` - Workers エントリーポイント
- [x] `apps/web/vercel.json` - Vercel設定
- [x] デプロイスクリプト（`deploy:cloudflare`）

#### 4. ドキュメント
- [x] `DEPLOYMENT.md` - デプロイ手順ガイド
- [x] `MONITORING.md` - 監視・運用ガイド
- [x] `DEPLOYMENT_STATUS.md` - このファイル

---

## ❌ 未完了の作業

### 1. 外部サービスアカウント作成

| サービス | 状態 | 必要な作業 | URL |
|---------|------|-----------|-----|
| Cloudflare | ❌ | アカウント作成・ログイン | https://dash.cloudflare.com/ |
| Vercel | ❌ | アカウント作成・GitHubリポジトリ連携 | https://vercel.com/ |
| Alchemy | ❌ | API Key取得 | https://www.alchemy.com/ |
| WalletConnect | ❌ | Project ID取得 | https://cloud.walletconnect.com/ |

### 2. 環境変数・シークレット設定

#### Cloudflare Workers（3個のシークレット）

```bash
# 設定コマンド
cd apps/api
wrangler login
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put WEB_ORIGIN
```

| シークレット | 状態 | 値の取得方法 |
|-------------|------|------------|
| DATABASE_URL | ❌ | Neon Console から取得 |
| JWT_SECRET | ❌ | `openssl rand -base64 32` で生成 |
| WEB_ORIGIN | ❌ | Vercel デプロイ後のURL |

#### Vercel（9個の環境変数）

| 環境変数 | 状態 | 値 |
|---------|------|-----|
| VITE_API_URL | ❌ | Cloudflare Workers URL（デプロイ後） |
| VITE_ALCHEMY_API_KEY | ❌ | Alchemy から取得 |
| VITE_WALLETCONNECT_PROJECT_ID | ❌ | WalletConnect から取得 |
| VITE_ESCROW_REGISTRY_ADDRESS | ✅ | `0x636b998315e77408806CccFCC93af4D1179afc2f` |
| VITE_POLICY_MANAGER_ADDRESS | ✅ | `0xE903dc0061212Abd78668d81a8c5F02C603Dc19E` |
| VITE_ROLE_VERIFIER_ADDRESS | ✅ | `0xA68B80144d3291D5b53cE8C62c306fE195668d60` |
| VITE_GUARDIAN_MODULE_ADDRESS | ✅ | `0x18e89214CB9ED4bC16362b158C5D0E35d87c7828` |
| VITE_PAYMASTER_ADDRESS | ✅ | `0xb4F5880bbAD08803dc9F473b427b1Bc385431D16` |
| VITE_SUBGRAPH_URL | ✅ | `https://api.studio.thegraph.com/query/121881/family-wallet/v0.0.2` |

### 3. デプロイ実行

- [ ] Cloudflare Workers デプロイ（`pnpm deploy:cloudflare`）
- [ ] Vercel デプロイ（Git push）
- [ ] 監視・アラート設定

---

## デプロイ実行手順（推奨順序）

### ステップ1: 外部サービスセットアップ（30分）

1. **Alchemy** アカウント作成・API Key取得
   - https://www.alchemy.com/
   - Chain: Base
   - Network: Base Sepolia

2. **WalletConnect** アカウント作成・Project ID取得
   - https://cloud.walletconnect.com/
   - Project Name: Family Wallet

3. **Cloudflare** アカウント作成
   - https://dash.cloudflare.com/

4. **Vercel** アカウント作成・GitHub連携
   - https://vercel.com/
   - Import Git Repository

### ステップ2: Cloudflare Workers デプロイ（15分）

```bash
cd apps/api

# 1. ログイン
wrangler login

# 2. シークレット設定
wrangler secret put DATABASE_URL
# 入力: postgresql://user:pass@host/family_wallet

wrangler secret put JWT_SECRET
# 入力: (openssl rand -base64 32 で生成)

wrangler secret put WEB_ORIGIN
# 入力: http://localhost:5173 (一旦ローカル)

# 3. デプロイ
pnpm deploy:cloudflare

# 4. デプロイURLを記録
# 例: https://family-wallet-api.abc123.workers.dev
```

### ステップ3: Vercel デプロイ（15分）

```bash
# 1. Vercel Dashboard で環境変数設定
# Settings > Environment Variables

VITE_API_URL = (ステップ2のWorkers URL)
VITE_ALCHEMY_API_KEY = (ステップ1で取得)
VITE_WALLETCONNECT_PROJECT_ID = (ステップ1で取得)
VITE_ESCROW_REGISTRY_ADDRESS = 0x636b998315e77408806CccFCC93af4D1179afc2f
VITE_POLICY_MANAGER_ADDRESS = 0xE903dc0061212Abd78668d81a8c5F02C603Dc19E
VITE_ROLE_VERIFIER_ADDRESS = 0xA68B80144d3291D5b53cE8C62c306fE195668d60
VITE_GUARDIAN_MODULE_ADDRESS = 0x18e89214CB9ED4bC16362b158C5D0E35d87c7828
VITE_PAYMASTER_ADDRESS = 0xb4F5880bbAD08803dc9F473b427b1Bc385431D16
VITE_SUBGRAPH_URL = https://api.studio.thegraph.com/query/121881/family-wallet/v0.0.2

# 2. Git push でデプロイ
git push origin main

# 3. Vercel URLを記録
# 例: https://family-wallet-xyz.vercel.app
```

### ステップ4: WEB_ORIGIN 更新（5分）

```bash
# Cloudflare Workers の WEB_ORIGIN を更新
cd apps/api
wrangler secret put WEB_ORIGIN
# 入力: https://family-wallet-xyz.vercel.app

# 再デプロイ
pnpm deploy:cloudflare
```

### ステップ5: 動作確認（10分）

```bash
# 1. API Health Check
curl https://family-wallet-api.abc123.workers.dev/health
# 期待: {"ok":true,"mockMode":false}

# 2. Web アクセス
open https://family-wallet-xyz.vercel.app

# 3. ウォレット接続テスト
# ブラウザでMetaMask接続を確認
```

### ステップ6: 監視設定（15分）

1. **Cloudflare Dashboard** > Analytics
   - エラー率アラート設定
   - CPU時間監視

2. **Vercel Dashboard** > Analytics
   - デプロイ失敗アラート
   - パフォーマンス監視

3. **Neon Console** > Monitoring
   - 接続数監視
   - クエリパフォーマンス

---

## チェックリスト

### デプロイ前
- [ ] すべての外部サービスアカウント作成完了
- [ ] API Key / Project ID 取得完了
- [ ] DATABASE_URL 取得確認
- [ ] JWT_SECRET 生成確認
- [ ] ローカルビルド成功確認（`pnpm build`）

### デプロイ中
- [ ] Cloudflare Workers シークレット設定完了
- [ ] Cloudflare Workers デプロイ成功
- [ ] Workers URL 記録
- [ ] Vercel 環境変数設定完了
- [ ] Vercel デプロイ成功
- [ ] Vercel URL 記録
- [ ] WEB_ORIGIN 更新・再デプロイ

### デプロイ後
- [ ] API Health Check 成功
- [ ] Web サイト表示確認
- [ ] ウォレット接続テスト
- [ ] エスクロー作成テスト
- [ ] 監視・アラート設定完了
- [ ] HTTPS 確認
- [ ] セキュリティヘッダー確認

---

## トラブルシューティング

### API が "DATABASE_URL is not defined" エラー
```bash
wrangler secret list
# DATABASE_URL が表示されない場合
wrangler secret put DATABASE_URL
```

### CORS エラー
```bash
# WEB_ORIGIN が正しいか確認
wrangler secret put WEB_ORIGIN
# 入力: https://your-actual-vercel-url.vercel.app
```

### Vercel ビルドエラー
```bash
# 環境変数が設定されているか確認
# Vercel Dashboard > Settings > Environment Variables

# ローカルでビルドテスト
cd apps/web
pnpm build
```

---

## サポート

詳細なドキュメント:
- デプロイ手順: `DEPLOYMENT.md`
- 監視・運用: `MONITORING.md`
- タスクリスト: `.kiro/specs/family_wallet/tasks.md`

---

**次のアクション**: 外部サービスアカウント作成から開始してください。
