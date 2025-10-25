# ID Design Refactor Migration Guide

このガイドは、ID設計のリファクタリング（bytes32 → Ethereum address + CAIP-10）を実施するためのデータベースマイグレーション手順書です。

## 目次

1. [マイグレーション概要](#マイグレーション概要)
2. [事前準備](#事前準備)
3. [マイグレーション実行手順](#マイグレーション実行手順)
4. [検証手順](#検証手順)
5. [ロールバック手順](#ロールバック手順)
6. [トラブルシューティング](#トラブルシューティング)

## マイグレーション概要

### 変更内容

#### vaultsテーブル
- **追加カラム**:
  - `address` (VARCHAR(42)): Ethereum address (Primary identifier)
  - `chain_id` (INTEGER): Chain ID for multi-chain support
  - `caip10` (VARCHAR(100)): CAIP-10 identifier (eip155:chainId:address)
  - `uuid` (UUID): RFC 4122 UUID for CREATE2 deployment
  - `salt` (VARCHAR(66)): CREATE2 salt (bytes32 as hex)
  - `factory_address` (VARCHAR(42)): VaultFactory contract address

- **インデックス追加**:
  - `vault_address_idx` (UNIQUE): address column
  - `vault_caip10_idx` (UNIQUE): caip10 column
  - `vault_uuid_idx` (UNIQUE): uuid column
  - `vault_chain_id_idx`: chain_id column

#### sessionsテーブル (新規作成)
- JWT authentication sessions
- User address + chain ID based
- Token expiration management
- IP address and user agent tracking

### 影響範囲

- **データベーステーブル**: vaults, sessions
- **API サービス**: VaultService, SessionService (新規)
- **フロントエンド**: useVaultFactory, useSession, useVaultIdentifier hooks (新規)
- **スマートコントラクト**: GuardianModule (bytes32 → address リファクタ)

### ダウンタイム

- **推定時間**: 5-10分 (データ量により変動)
- **メンテナンスウィンドウ**: 30分を推奨

## 事前準備

### 1. データベースバックアップ

```bash
# PostgreSQL database backup
pg_dump -h <host> -U <username> -d <database_name> -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).backup

# Verify backup file
ls -lh backup_*.backup
```

### 2. 環境変数の確認

```bash
# .env file should contain:
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-for-jwt
```

### 3. 依存関係の確認

```bash
# Verify PostgreSQL version (>= 12.0)
psql --version

# Verify database connection
psql $DATABASE_URL -c "SELECT version();"
```

### 4. マイグレーションファイルの確認

```bash
# Verify migration files exist
ls -l migrations/manual/

# Expected files:
# - 001_id_design_refactor.sql
# - 001_id_design_refactor_rollback.sql
```

### 5. ステージング環境でのテスト実行

```bash
# Run migration on staging database first
psql $STAGING_DATABASE_URL -f migrations/manual/001_id_design_refactor.sql

# Run verification queries (see Verification section)
# If successful, run rollback to test rollback script
psql $STAGING_DATABASE_URL -f migrations/manual/001_id_design_refactor_rollback.sql
```

## マイグレーション実行手順

### Step 1: メンテナンスモード設定

```bash
# Stop API servers to prevent data writes during migration
docker-compose stop api

# Or if using systemd
sudo systemctl stop family-wallet-api
```

### Step 2: データベース接続確認

```bash
# Connect to production database
psql $DATABASE_URL

# Verify current schema
\d vaults
\d sessions
```

### Step 3: トランザクション開始

```sql
-- Start a transaction for safety
BEGIN;

-- Check current state
SELECT COUNT(*) as vault_count FROM vaults;
SELECT COUNT(*) as member_count FROM members;
```

### Step 4: マイグレーション実行

```bash
# Execute migration script
psql $DATABASE_URL -f migrations/manual/001_id_design_refactor.sql
```

マイグレーションスクリプトは以下の処理を実行します:

1. **vaultsテーブルの変更**:
   - 新しいカラムを追加 (address, chain_id, caip10, uuid, salt, factory_address)
   - 既存データを新しい形式に変換
   - インデックスを作成
   - NOT NULL制約を追加

2. **membersテーブルの変更**:
   - インデックスを追加

3. **sessionsテーブルの作成**:
   - 新しいテーブルを作成
   - インデックスを作成

### Step 5: マイグレーション検証

```sql
-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vaults'
AND column_name IN ('address', 'chain_id', 'caip10', 'uuid', 'salt', 'factory_address');

-- Verify data migration
SELECT
  id,
  address,
  chain_id,
  caip10,
  uuid,
  name
FROM vaults
LIMIT 5;

-- Verify CAIP-10 format
SELECT caip10
FROM vaults
WHERE caip10 NOT LIKE 'eip155:%:%';
-- Should return 0 rows

-- Verify sessions table exists
\d sessions
```

### Step 6: トランザクションコミット

```sql
-- If verification passed, commit the transaction
COMMIT;

-- If issues found, rollback
-- ROLLBACK;
```

### Step 7: アプリケーション再起動

```bash
# Restart API servers
docker-compose start api

# Or if using systemd
sudo systemctl start family-wallet-api

# Verify API is running
curl http://localhost:3001/health
```

### Step 8: アプリケーションレベルの検証

```bash
# Test vault retrieval by address
curl http://localhost:3001/api/vaults/address/0x1234567890123456789012345678901234567890

# Test vault retrieval by CAIP-10
curl http://localhost:3001/api/vaults/caip10/eip155:8453:0x1234567890123456789012345678901234567890

# Test session creation
curl -X POST http://localhost:3001/api/auth/create-session \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"0x...","chainId":84532,"signature":"0x..."}'
```

## 検証手順

### データ整合性チェック

```sql
-- 1. Verify all vaults have required fields
SELECT COUNT(*) as vaults_missing_address
FROM vaults
WHERE address IS NULL OR address = '';
-- Should return 0

SELECT COUNT(*) as vaults_missing_chain_id
FROM vaults
WHERE chain_id IS NULL;
-- Should return 0

SELECT COUNT(*) as vaults_missing_caip10
FROM vaults
WHERE caip10 IS NULL OR caip10 = '';
-- Should return 0

SELECT COUNT(*) as vaults_missing_uuid
FROM vaults
WHERE uuid IS NULL;
-- Should return 0

-- 2. Verify CAIP-10 format consistency
SELECT address, chain_id, caip10
FROM vaults
WHERE caip10 != CONCAT('eip155:', chain_id, ':', address);
-- Should return 0 rows (all CAIP-10 identifiers should match)

-- 3. Verify unique constraints
SELECT address, COUNT(*) as count
FROM vaults
GROUP BY address
HAVING COUNT(*) > 1;
-- Should return 0 rows (all addresses should be unique)

SELECT caip10, COUNT(*) as count
FROM vaults
GROUP BY caip10
HAVING COUNT(*) > 1;
-- Should return 0 rows (all CAIP-10 identifiers should be unique)

SELECT uuid, COUNT(*) as count
FROM vaults
GROUP BY uuid
HAVING COUNT(*) > 1;
-- Should return 0 rows (all UUIDs should be unique)

-- 4. Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vaults'
AND indexname IN ('vault_address_idx', 'vault_caip10_idx', 'vault_uuid_idx', 'vault_chain_id_idx');
-- Should return 4 rows

-- 5. Verify sessions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
-- Should show all sessions table columns

-- 6. Verify member count matches
SELECT
  v.id as vault_id,
  v.address,
  COUNT(m.id) as member_count
FROM vaults v
LEFT JOIN members m ON v.id = m.vault_id
GROUP BY v.id, v.address
ORDER BY member_count DESC
LIMIT 10;
-- Verify member counts look reasonable
```

### パフォーマンステスト

```sql
-- Test index performance
EXPLAIN ANALYZE
SELECT * FROM vaults WHERE address = '0x1234567890123456789012345678901234567890';
-- Should show index scan, not seq scan

EXPLAIN ANALYZE
SELECT * FROM vaults WHERE caip10 = 'eip155:8453:0x1234567890123456789012345678901234567890';
-- Should show index scan, not seq scan

EXPLAIN ANALYZE
SELECT * FROM vaults WHERE uuid = '123e4567-e89b-12d3-a456-426614174000';
-- Should show index scan, not seq scan

EXPLAIN ANALYZE
SELECT * FROM vaults WHERE chain_id = 8453;
-- Should show index scan for large datasets
```

## ロールバック手順

問題が発生した場合は、以下の手順でロールバックを実行します:

### Step 1: アプリケーション停止

```bash
# Stop API servers
docker-compose stop api
```

### Step 2: データベースバックアップ（現在の状態）

```bash
# Backup current state before rollback
pg_dump -h <host> -U <username> -d <database_name> -F c -b -v -f rollback_backup_$(date +%Y%m%d_%H%M%S).backup
```

### Step 3: ロールバック実行

```bash
# Execute rollback script
psql $DATABASE_URL -f migrations/manual/001_id_design_refactor_rollback.sql
```

ロールバックスクリプトは以下の処理を実行します:

1. sessionsテーブルを削除
2. vaultsテーブルから新しいカラムを削除
3. 新しいインデックスを削除

### Step 4: ロールバック検証

```sql
-- Verify new columns are removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'vaults'
AND column_name IN ('address', 'chain_id', 'caip10', 'uuid', 'salt', 'factory_address');
-- Should return 0 rows

-- Verify sessions table is dropped
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'sessions';
-- Should return 0 rows

-- Verify original data is intact
SELECT COUNT(*) as vault_count FROM vaults;
-- Should match pre-migration count
```

### Step 5: 旧バージョンのコードをデプロイ

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and deploy
docker-compose build api
docker-compose up -d api
```

## トラブルシューティング

### Issue 1: マイグレーションがタイムアウトする

**原因**: 大量のデータがある場合、マイグレーションに時間がかかる

**解決策**:
```sql
-- Increase statement timeout
SET statement_timeout = '30min';

-- Run migration in batches
UPDATE vaults
SET
  address = vault_address,
  chain_id = 8453,
  caip10 = CONCAT('eip155:8453:', vault_address),
  uuid = gen_random_uuid()
WHERE id IN (
  SELECT id FROM vaults WHERE address IS NULL LIMIT 1000
);
-- Repeat until all rows are updated
```

### Issue 2: CAIP-10フォーマットが不正

**原因**: chain_idやaddressが不正な値

**解決策**:
```sql
-- Find invalid records
SELECT id, address, chain_id
FROM vaults
WHERE
  address IS NULL
  OR address = ''
  OR chain_id IS NULL
  OR chain_id <= 0;

-- Fix invalid records manually
UPDATE vaults
SET
  address = '<correct-address>',
  chain_id = <correct-chain-id>,
  caip10 = CONCAT('eip155:', <correct-chain-id>, ':', '<correct-address>')
WHERE id = '<vault-id>';
```

### Issue 3: ユニーク制約違反

**原因**: 重複したaddress, caip10, またはuuidが存在

**解決策**:
```sql
-- Find duplicates
SELECT address, COUNT(*) as count
FROM vaults
GROUP BY address
HAVING COUNT(*) > 1;

-- Manually resolve duplicates before adding unique constraint
-- Option 1: Delete duplicate records
-- Option 2: Update duplicate records with new values
```

### Issue 4: インデックス作成が遅い

**原因**: 大量のデータがある場合、インデックス作成に時間がかかる

**解決策**:
```sql
-- Create indexes concurrently (allows reads/writes during creation)
CREATE UNIQUE INDEX CONCURRENTLY vault_address_idx ON vaults(address);
CREATE UNIQUE INDEX CONCURRENTLY vault_caip10_idx ON vaults(caip10);
CREATE UNIQUE INDEX CONCURRENTLY vault_uuid_idx ON vaults(uuid);
CREATE INDEX CONCURRENTLY vault_chain_id_idx ON vaults(chain_id);
```

### Issue 5: アプリケーションエラー

**原因**: 新しいAPIエンドポイントやhooksが正しく動作しない

**解決策**:
```bash
# Check API logs
docker-compose logs -f api

# Verify environment variables
docker-compose exec api printenv | grep DATABASE_URL
docker-compose exec api printenv | grep JWT_SECRET

# Test API endpoints manually
curl -v http://localhost:3001/api/vaults
```

## マイグレーション後の推奨事項

### 1. モニタリング設定

```sql
-- Create monitoring view for vault statistics
CREATE OR REPLACE VIEW vault_stats AS
SELECT
  chain_id,
  COUNT(*) as vault_count,
  COUNT(DISTINCT address) as unique_addresses
FROM vaults
GROUP BY chain_id;

-- Query vault stats
SELECT * FROM vault_stats;
```

### 2. 定期的なデータ検証

```bash
# Create cron job for daily data validation
0 2 * * * psql $DATABASE_URL -f /path/to/validation_queries.sql >> /var/log/vault_validation.log 2>&1
```

### 3. セッションクリーンアップ

```bash
# Create cron job for expired session cleanup (every hour)
0 * * * * curl -X POST http://localhost:3001/api/auth/cleanup-sessions
```

### 4. バックアップスケジュール

```bash
# Daily backups at 3 AM
0 3 * * * pg_dump $DATABASE_URL -F c -b -v -f /backups/family_wallet_$(date +\%Y\%m\%d).backup

# Weekly full backups on Sunday at 4 AM
0 4 * * 0 pg_dump $DATABASE_URL -F c -b -v -f /backups/family_wallet_full_$(date +\%Y\%m\%d).backup
```

## 参考情報

- **CAIP-10 Specification**: https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md
- **CREATE2 Specification**: https://eips.ethereum.org/EIPS/eip-1014
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **PostgreSQL Migration Guide**: https://www.postgresql.org/docs/current/ddl-alter.html

## サポート

問題が発生した場合は、以下の情報を含めて報告してください:

1. エラーメッセージ（完全なスタックトレース）
2. データベースログ
3. APIログ
4. マイグレーション実行時のコマンド履歴
5. データベースバージョンとスキーマ情報

## チェックリスト

- [ ] データベースバックアップ完了
- [ ] ステージング環境でテスト完了
- [ ] メンテナンスウィンドウ確保
- [ ] チーム全体に通知済み
- [ ] ロールバック手順確認済み
- [ ] マイグレーション実行完了
- [ ] データ整合性検証完了
- [ ] パフォーマンステスト完了
- [ ] アプリケーション動作確認完了
- [ ] モニタリング設定完了
- [ ] ドキュメント更新完了
