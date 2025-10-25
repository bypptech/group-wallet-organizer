# ID Design Refactor Deployment Checklist

Phase 1: Foundation Implementation の本番環境デプロイメントチェックリスト

## デプロイメント概要

- **機能**: ID設計リファクタリング（bytes32 → Ethereum address + CAIP-10）
- **影響範囲**: スマートコントラクト、API、データベース、フロントエンド
- **推定ダウンタイム**: 10-15分
- **ロールバック可能性**: あり（各ステップで定義）

## 前提条件チェック

### 環境準備

- [ ] **Staging環境で完全なテスト実施済み**
  - [ ] 全ユニットテスト合格
  - [ ] 全統合テスト合格
  - [ ] E2Eテスト合格
  - [ ] パフォーマンステスト合格

- [ ] **本番環境アクセス権限確認**
  - [ ] Alchemyアカウント（RPC access）
  - [ ] Basescanアカウント（Contract verification）
  - [ ] AWSアカウント（Database, API hosting）
  - [ ] Vercelアカウント（Frontend hosting）
  - [ ] GitHub repository access

- [ ] **必要な環境変数準備**
  ```bash
  # Smart Contract Deployment
  PRIVATE_KEY=<deployer-private-key>
  ALCHEMY_API_KEY=<alchemy-api-key>
  ETHERSCAN_API_KEY=<basescan-api-key>

  # API Backend
  DATABASE_URL=postgresql://...
  JWT_SECRET=<strong-random-secret>
  VAULT_FACTORY_ADDRESS=<to-be-set-after-deployment>

  # Frontend
  NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=<to-be-set-after-deployment>
  NEXT_PUBLIC_API_BASE_URL=https://api.familywallet.io
  ```

- [ ] **デプロイヤーウォレット準備**
  - [ ] Base Sepoliaで十分なETH残高（0.1 ETH以上推奨）
  - [ ] Base Mainnetで十分なETH残高（0.5 ETH以上推奨）
  - [ ] ウォレットの秘密鍵を安全に保管

- [ ] **バックアップ作成**
  - [ ] データベース全体のバックアップ
  - [ ] 現在のコントラクトアドレス一覧
  - [ ] 現在の環境変数設定

## Phase 1: Smart Contract Deployment

### 1.1 Base Sepolia Testnet デプロイ

#### Pre-deployment

- [ ] **コントラクトコンパイル確認**
  ```bash
  cd /path/to/contracts
  pnpm hardhat compile
  # Verify no compilation errors
  ```

- [ ] **ガス価格確認**
  ```bash
  # Check current gas price on Base Sepolia
  curl https://sepolia.basescan.org/api?module=proxy&action=eth_gasPrice
  ```

- [ ] **デプロイスクリプト確認**
  ```bash
  # Review deployment script
  cat ignition/modules/VaultFactory.ts
  ```

#### Deployment

- [ ] **VaultFactory.solデプロイ（Base Sepolia）**
  ```bash
  pnpm hardhat ignition deploy ./ignition/modules/VaultFactory.ts --network baseSepolia
  ```
  - **デプロイ成功時に記録**:
    - VaultFactory address: `____________________`
    - Transaction hash: `____________________`
    - Gas used: `____________________`
    - Deployment cost: `____________________`

- [ ] **コントラクト検証（Basescan）**
  ```bash
  pnpm hardhat verify --network baseSepolia <VAULT_FACTORY_ADDRESS>
  ```
  - [ ] Basescanで検証済みマークが表示されることを確認

#### Post-deployment Verification

- [ ] **デプロイ確認**
  ```bash
  # Verify contract code
  curl "https://api-sepolia.basescan.org/api?module=contract&action=getabi&address=<VAULT_FACTORY_ADDRESS>"
  ```

- [ ] **機能テスト**
  ```bash
  # Test vault creation
  pnpm hardhat run scripts/test-vault-creation.ts --network baseSepolia
  ```

- [ ] **outputs/contracts-baseSepolia.json更新確認**
  ```bash
  cat outputs/contracts-baseSepolia.json
  # Verify VaultFactory address is recorded
  ```

### 1.2 Base Mainnet デプロイ

⚠️ **Warning**: Mainnetデプロイは慎重に実行してください。十分なテストが完了してから実行します。

#### Pre-deployment

- [ ] **Sepoliaデプロイが完全に動作することを確認**
- [ ] **最終コードレビュー完了**
- [ ] **セキュリティ監査完了**（推奨）
- [ ] **チーム全体の承認取得**

#### Deployment

- [ ] **VaultFactory.solデプロイ（Base Mainnet）**
  ```bash
  pnpm hardhat ignition deploy ./ignition/modules/VaultFactory.ts --network base
  ```
  - **デプロイ成功時に記録**:
    - VaultFactory address: `____________________`
    - Transaction hash: `____________________`
    - Gas used: `____________________`
    - Deployment cost: `____________________`

- [ ] **コントラクト検証（Basescan）**
  ```bash
  pnpm hardhat verify --network base <VAULT_FACTORY_ADDRESS>
  ```

#### Post-deployment Verification

- [ ] **Basescanで確認**
  - [ ] コントラクトが検証済み
  - [ ] Read/Write Contract機能が動作
  - [ ] Eventsが正しく表示される

- [ ] **outputs/contracts-base.json更新確認**

### Rollback Plan (Smart Contracts)

**ロールバック不可**: スマートコントラクトは一度デプロイすると削除できません

**代替策**:
1. 新しいバージョンをデプロイ
2. フロントエンド/バックエンドで旧アドレスを使用し続ける
3. 必要に応じてUpgradeableパターンで実装（将来的）

## Phase 2: Database Migration

### 2.1 Pre-migration

- [ ] **メンテナンス通知**
  - [ ] ユーザーに事前通知（24時間前）
  - [ ] ステータスページ更新

- [ ] **データベースバックアップ**
  ```bash
  pg_dump $DATABASE_URL -F c -b -v -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).backup
  ```
  - Backup file size: `____________________`
  - Backup location: `____________________`

- [ ] **APIサーバー停止**
  ```bash
  # Stop all API instances
  docker-compose stop api
  # OR
  kubectl scale deployment/family-wallet-api --replicas=0
  ```

### 2.2 Migration Execution

- [ ] **マイグレーション実行**
  ```bash
  psql $DATABASE_URL -f migrations/manual/001_id_design_refactor.sql
  ```
  - Execution time: `____________________`
  - Rows affected: `____________________`

- [ ] **データ整合性検証**
  ```sql
  -- Run validation queries
  SELECT COUNT(*) FROM vaults WHERE address IS NULL;  -- Should be 0
  SELECT COUNT(*) FROM vaults WHERE caip10 IS NULL;  -- Should be 0
  SELECT COUNT(*) FROM vaults WHERE uuid IS NULL;    -- Should be 0
  ```

- [ ] **インデックス作成確認**
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'vaults';
  ```

### 2.3 Post-migration

- [ ] **パフォーマンステスト**
  ```sql
  EXPLAIN ANALYZE SELECT * FROM vaults WHERE address = '0x...';
  -- Should use index scan
  ```

- [ ] **データ検証**
  - [ ] 全Vault数が一致
  - [ ] 全MemberがVaultに紐付いている
  - [ ] CAIP-10フォーマットが正しい

### Rollback Plan (Database)

- [ ] **ロールバック実行（問題発生時）**
  ```bash
  psql $DATABASE_URL -f migrations/manual/001_id_design_refactor_rollback.sql
  ```

- [ ] **バックアップからリストア（最終手段）**
  ```bash
  pg_restore -h <host> -U <username> -d <database> -v backup_pre_migration_*.backup
  ```

## Phase 3: API Backend Deployment

### 3.1 Pre-deployment

- [ ] **環境変数更新**
  ```bash
  # Update .env or AWS Secrets Manager
  VAULT_FACTORY_ADDRESS=<deployed-address-from-step-1>
  JWT_SECRET=<generate-strong-secret>
  ```

- [ ] **JWT Secret生成**
  ```bash
  # Generate secure random secret
  openssl rand -hex 32
  ```

### 3.2 Deployment

- [ ] **新しいAPIバージョンビルド**
  ```bash
  docker build -t family-wallet-api:id-refactor .
  ```

- [ ] **Staging環境デプロイ**
  ```bash
  # Deploy to staging first
  docker-compose -f docker-compose.staging.yml up -d
  ```

- [ ] **Staging環境テスト**
  ```bash
  # Test new endpoints
  curl https://staging-api.familywallet.io/api/vaults
  curl https://staging-api.familywallet.io/api/auth/health
  ```

- [ ] **Production環境デプロイ**
  ```bash
  # Deploy to production
  kubectl apply -f k8s/api-deployment.yaml
  # OR
  docker-compose up -d api
  ```

### 3.3 Post-deployment Verification

- [ ] **Health check**
  ```bash
  curl https://api.familywallet.io/health
  ```

- [ ] **API endpoints動作確認**
  ```bash
  # Test vault endpoints
  curl https://api.familywallet.io/api/vaults/address/0x...
  curl https://api.familywallet.io/api/vaults/caip10/eip155:8453:0x...
  curl https://api.familywallet.io/api/vaults/uuid/<uuid>

  # Test session endpoints
  curl -X POST https://api.familywallet.io/api/auth/create-session \
    -H "Content-Type: application/json" \
    -d '{"userAddress":"0x...","chainId":84532,"signature":"0x..."}'
  ```

- [ ] **ログ確認**
  ```bash
  # Check for errors
  kubectl logs -f deployment/family-wallet-api
  # OR
  docker-compose logs -f api
  ```

### Rollback Plan (API)

- [ ] **前バージョンにロールバック**
  ```bash
  kubectl rollout undo deployment/family-wallet-api
  # OR
  docker-compose up -d api:previous-tag
  ```

## Phase 4: Frontend Deployment

### 4.1 Pre-deployment

- [ ] **環境変数更新**
  ```bash
  # Vercel Environment Variables
  NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=<deployed-address>
  NEXT_PUBLIC_API_BASE_URL=https://api.familywallet.io
  ```

- [ ] **ビルドテスト**
  ```bash
  pnpm build
  # Verify no build errors
  ```

### 4.2 Deployment

- [ ] **Preview環境デプロイ**
  ```bash
  vercel --prod=false
  ```
  - Preview URL: `____________________`

- [ ] **Preview環境テスト**
  - [ ] ウォレット接続動作確認
  - [ ] Vault作成フロー確認
  - [ ] セッション認証確認
  - [ ] CAIP-10表示確認

- [ ] **Production環境デプロイ**
  ```bash
  vercel --prod
  ```
  - Production URL: `____________________`

### 4.3 Post-deployment Verification

- [ ] **主要機能テスト**
  - [ ] ウォレット接続
  - [ ] Vault作成
  - [ ] Vault詳細表示
  - [ ] セッション認証
  - [ ] チェーン切り替え

- [ ] **パフォーマンス確認**
  - [ ] Lighthouse score > 90
  - [ ] First Contentful Paint < 1.5s
  - [ ] Time to Interactive < 3.0s

- [ ] **クロスブラウザテスト**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### Rollback Plan (Frontend)

- [ ] **前バージョンにロールバック**
  ```bash
  vercel rollback <deployment-url>
  ```

## Phase 5: Post-Deployment

### 5.1 Monitoring Setup

- [ ] **アラート設定**
  - [ ] API error rate > 5%
  - [ ] Database connection errors
  - [ ] Contract deployment failures

- [ ] **ログ監視**
  ```bash
  # Set up log aggregation
  # - CloudWatch Logs
  # - Datadog
  # - Sentry for error tracking
  ```

- [ ] **メトリクス確認**
  - [ ] API response time
  - [ ] Database query performance
  - [ ] Contract interaction success rate

### 5.2 User Communication

- [ ] **リリースノート公開**
  - [ ] 新機能説明
  - [ ] マイグレーション詳細
  - [ ] 既知の問題

- [ ] **ドキュメント更新**
  - [ ] API documentation
  - [ ] User guide
  - [ ] Developer documentation

- [ ] **メンテナンス完了通知**
  - [ ] ステータスページ更新
  - [ ] ユーザーへのメール通知
  - [ ] SNS告知

### 5.3 Post-deployment Tasks

- [ ] **セッションクリーンアップCron設定**
  ```bash
  # Add to crontab
  0 * * * * curl -X POST https://api.familywallet.io/api/auth/cleanup-sessions
  ```

- [ ] **データベースバックアップスケジュール**
  ```bash
  # Daily backups at 3 AM
  0 3 * * * pg_dump $DATABASE_URL -F c -b -v -f /backups/family_wallet_$(date +\%Y\%m\%d).backup
  ```

- [ ] **監視ダッシュボード作成**
  - Vault creation rate
  - Active sessions count
  - API error rate
  - Database performance

## Verification Checklist

### Functional Verification

- [ ] **Vault Creation**
  - [ ] CREATE2による決定論的アドレス生成
  - [ ] UUID → Addressマッピング正常動作
  - [ ] CAIP-10識別子正常生成
  - [ ] イベント正常発火

- [ ] **Vault Retrieval**
  - [ ] Address検索動作
  - [ ] UUID検索動作
  - [ ] CAIP-10検索動作
  - [ ] ChainID絞り込み動作

- [ ] **Session Management**
  - [ ] JWT発行正常動作
  - [ ] 署名検証正常動作
  - [ ] セッション有効期限管理
  - [ ] チェーン移行動作

- [ ] **Multi-chain Support**
  - [ ] Base Sepolia動作確認
  - [ ] Base Mainnet動作確認
  - [ ] ChainID切り替え動作

### Performance Verification

- [ ] **Database Performance**
  - [ ] Address検索 < 10ms
  - [ ] UUID検索 < 10ms
  - [ ] CAIP-10検索 < 10ms
  - [ ] Vault一覧取得 < 100ms

- [ ] **API Performance**
  - [ ] GET /vaults/:address < 200ms
  - [ ] GET /vaults/:uuid < 200ms
  - [ ] POST /auth/create-session < 500ms
  - [ ] POST /vaults (create) < 1000ms

- [ ] **Contract Performance**
  - [ ] VaultFactory.createVault ガス < 500,000
  - [ ] VaultFactory.predictVaultAddress ガス < 50,000

### Security Verification

- [ ] **JWT Security**
  - [ ] Strong secret key設定済み
  - [ ] Token expiration動作
  - [ ] CSRF保護動作（nonce）

- [ ] **Contract Security**
  - [ ] Access control正常動作
  - [ ] ReentrancyGuard動作
  - [ ] Input validation動作

- [ ] **API Security**
  - [ ] CORS設定正常
  - [ ] Rate limiting動作
  - [ ] Input sanitization動作

## Rollback Decision Tree

```
問題発生
├── Smart Contract Issue
│   ├── Deployment失敗 → 再デプロイ
│   ├── 機能不全 → 新バージョンデプロイ（修正後）
│   └── クリティカル → フロントエンド/バックエンドで旧アドレス使用
│
├── Database Issue
│   ├── Migration失敗 → Rollback script実行
│   ├── データ不整合 → 手動修正 or バックアップからリストア
│   └── パフォーマンス問題 → インデックス再構築
│
├── API Issue
│   ├── デプロイ失敗 → 前バージョンにロールバック
│   ├── 機能不全 → 前バージョンにロールバック
│   └── パフォーマンス問題 → スケーリング調整
│
└── Frontend Issue
    ├── デプロイ失敗 → Vercel rollback
    ├── 機能不全 → Vercel rollback
    └── パフォーマンス問題 → ビルド最適化 & 再デプロイ
```

## Sign-off

### Pre-deployment Sign-off

- [ ] **Technical Lead**: `__________` Date: `__________`
- [ ] **DevOps Lead**: `__________` Date: `__________`
- [ ] **Product Manager**: `__________` Date: `__________`

### Post-deployment Sign-off

- [ ] **Technical Lead**: `__________` Date: `__________`
  - All tests passed
  - No critical issues

- [ ] **DevOps Lead**: `__________` Date: `__________`
  - Monitoring configured
  - Backups verified

- [ ] **Product Manager**: `__________` Date: `__________`
  - User communication completed
  - Documentation updated

## Notes and Issues

### Deployment Notes

```
Date: ____________________
Deployed by: ____________________
Notes:
____________________
____________________
____________________
```

### Issues Encountered

```
Issue #1:
Description: ____________________
Resolution: ____________________
Time: ____________________

Issue #2:
Description: ____________________
Resolution: ____________________
Time: ____________________
```

## Post-Mortem (After 1 week)

- [ ] **Metrics Review**
  - [ ] Vault creation rate compared to baseline
  - [ ] API performance metrics
  - [ ] Error rates
  - [ ] User feedback

- [ ] **Lessons Learned**
  - What went well: `____________________`
  - What could be improved: `____________________`
  - Action items: `____________________`

## References

- Migration Guide: `/migrations/MIGRATION_GUIDE.md`
- ID Design Spec: `/.kiro/specs/family_wallet/id-design-refactor.md`
- API Documentation: `/docs/api.md`
- Contract Documentation: `/contracts/README.md`
