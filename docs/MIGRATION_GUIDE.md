# Policy as Oracle Pattern - Migration Guide

## 概要

このガイドでは、既存の EscrowRegistry ベースのアーキテクチャから新しい **Policy as Oracle Pattern** への移行手順を説明します。

## アーキテクチャの変更点

### Before: EscrowRegistry Pattern
```
┌─────────────────────────────────────┐
│ EscrowRegistry.sol                   │
│ - Policy 情報を On-chain に保存     │
│ - Guardian リスト全体を保存         │
│ - 承認状態を On-chain で管理        │
│ - ガスコストが高い                  │
└─────────────────────────────────────┘
```

### After: Policy as Oracle Pattern
```
┌────────────────────┐    ┌────────────────────┐
│ Off-chain (API)    │    │ On-chain (Executor)│
│ - Policy 検証      │───>│ - 実行のみ         │
│ - 承認管理         │    │ - 最小限のデータ   │
│ - Merkle Proof生成 │    │ - ガスコスト削減   │
└────────────────────┘    └────────────────────┘
```

## マイグレーション手順

### Phase 1: データベース マイグレーション

#### 1.1 マイグレーション実行

```bash
# 本番環境での実行前に、必ずバックアップを取得してください
pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql

# マイグレーション実行
psql -h <host> -U <user> -d <database> -f apps/api/migrations/add_policy_oracle_pattern.sql
```

#### 1.2 変更内容の確認

```sql
-- escrows テーブルの新しいカラムを確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'escrows'
  AND column_name IN ('on_chain_id', 'on_chain_tx_hash', 'executed_at', 'cancelled_at');

-- escrow_approvals テーブルの作成を確認
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'escrow_approvals';

-- インデックスの確認
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('escrows', 'escrow_approvals');
```

#### 1.3 ロールバック手順（問題が発生した場合）

```bash
# マイグレーションのロールバック
psql -h <host> -U <user> -d <database> -f apps/api/migrations/add_policy_oracle_pattern_rollback.sql

# バックアップからの復元（最終手段）
psql -h <host> -U <user> -d <database> < backup_YYYYMMDD_HHMMSS.sql
```

### Phase 2: スマートコントラクト デプロイ

#### 2.1 EscrowExecutor.sol のデプロイ

```bash
cd contracts

# Hardhat を使用する場合
npx hardhat run scripts/deploy-escrow-executor.ts --network base-sepolia

# または Foundry を使用する場合
forge create --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  contracts/EscrowExecutor.sol:EscrowExecutor
```

#### 2.2 環境変数の設定

デプロイ後、以下の環境変数を設定:

```bash
# .env.production
ESCROW_EXECUTOR_ADDRESS=0x... # デプロイされたコントラクトアドレス
EXECUTOR_PRIVATE_KEY=0x...     # Executor ロールの秘密鍵
BASE_SEPOLIA_RPC_URL=https://... # Base Sepolia RPC エンドポイント
```

#### 2.3 権限設定

```solidity
// EXECUTOR_ROLE を API サーバーアカウントに付与
await escrowExecutor.grantRole(EXECUTOR_ROLE, executorAddress);
```

### Phase 3: API サーバー デプロイ

#### 3.1 依存関係のインストール

```bash
cd apps/api
pnpm install
```

#### 3.2 環境変数の確認

```bash
# .env
DATABASE_URL=postgresql://...
ESCROW_EXECUTOR_ADDRESS=0x...
EXECUTOR_PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC_URL=https://...
```

#### 3.3 サーバー再起動

```bash
# 開発環境
pnpm dev

# 本番環境
pnpm build
pnpm start
```

### Phase 4: フロントエンド デプロイ

#### 4.1 ビルドと検証

```bash
cd apps/web
pnpm build

# ビルドエラーがないことを確認
```

#### 4.2 デプロイ

```bash
# Vercel の場合
vercel --prod

# または手動デプロイ
pnpm start
```

### Phase 5: データ移行（既存 Escrow がある場合）

#### 5.1 既存 Escrow の状態確認

```sql
-- 既存 Escrow の状態を確認
SELECT
  id,
  status,
  type,
  total_amount,
  created_at
FROM escrows
WHERE status NOT IN ('completed', 'cancelled')
ORDER BY created_at DESC;
```

#### 5.2 承認データの移行

既存の承認データがある場合、escrow_approvals テーブルに移行:

```sql
-- 既存の承認データを新しいテーブルに移行
-- Note: 既存システムの承認データ構造に応じて調整が必要
INSERT INTO escrow_approvals (escrow_id, guardian_id, guardian_address, approved_at)
SELECT
  e.id,
  m.id,
  m.address,
  NOW() -- または既存の承認日時
FROM escrows e
JOIN members m ON m.vault_id = e.vault_id AND m.role = 'guardian'
WHERE e.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM escrow_approvals ea
    WHERE ea.escrow_id = e.id AND ea.guardian_id = m.id
  );
```

## 検証手順

### 1. API エンドポイントの動作確認

```bash
# 承認進捗の取得
curl http://localhost:3001/api/escrows/<escrow-id>/approvals

# Escrow の承認
curl -X POST http://localhost:3001/api/escrows/<escrow-id>/approve \
  -H "Content-Type: application/json" \
  -d '{
    "guardianId": "xxx",
    "guardianAddress": "0x..."
  }'

# Policy 検証
curl -X POST http://localhost:3001/api/escrows/<escrow-id>/validate

# On-chain 状態の取得
curl http://localhost:3001/api/escrows/<escrow-id>/onchain
```

### 2. スマートコントラクトの動作確認

```bash
# On-chain Escrow の登録確認
cast call $ESCROW_EXECUTOR_ADDRESS \
  "getEscrow(uint256)" \
  <on-chain-id> \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# Escrow カウンターの確認
cast call $ESCROW_EXECUTOR_ADDRESS \
  "getEscrowCounter()" \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### 3. エンドツーエンド テスト

1. **Escrow 作成**:
   - フロントエンドから新しい Escrow を作成
   - status が 'draft' → 'submitted' に遷移することを確認

2. **承認フロー**:
   - Guardian が承認を追加
   - 承認進捗バーが更新されることを確認
   - 必要承認数に達したら 'approved' に遷移

3. **On-chain 登録**:
   - approved 状態になったら自動的に On-chain 登録
   - onChainId と onChainTxHash が設定されることを確認
   - BaseScan でトランザクションを確認

4. **実行**:
   - POST `/escrows/:id/execute` で資金リリース
   - status が 'executed' に遷移
   - executedAt が設定されることを確認

## トラブルシューティング

### 問題: On-chain 登録が失敗する

**原因**:
- Executor アカウントの ETH 残高不足
- RPC エンドポイントの接続エラー
- コントラクトアドレスの誤設定

**解決策**:
```bash
# Executor アカウントの残高確認
cast balance $EXECUTOR_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL

# RPC 接続テスト
cast block-number --rpc-url $BASE_SEPOLIA_RPC_URL

# 環境変数の確認
echo $ESCROW_EXECUTOR_ADDRESS
echo $EXECUTOR_PRIVATE_KEY
```

### 問題: 承認が保存されない

**原因**:
- escrow_approvals テーブルが作成されていない
- Guardian の権限不足

**解決策**:
```sql
-- テーブルの存在確認
SELECT * FROM escrow_approvals LIMIT 1;

-- Guardian の確認
SELECT m.* FROM members m
WHERE m.address = '<guardian-address>'
  AND m.role IN ('guardian', 'approver');
```

### 問題: Merkle Proof 検証エラー

**原因**:
- Guardian アドレスが Policy の rolesRoot に含まれていない
- Merkle Proof の生成エラー

**解決策**:
```typescript
// Guardian リストから Merkle Root を再生成
const policyValidator = getPolicyValidatorService();
const rolesRoot = await policyValidator.generateRolesRoot([
  '0x...',
  '0x...',
]);

// Policy を更新
await updatePolicy({
  id: policyId,
  rolesRoot,
});
```

## モニタリング

### 重要なメトリクス

1. **承認待ち Escrow 数**:
```sql
SELECT COUNT(*) FROM escrows
WHERE status = 'submitted';
```

2. **On-chain 登録成功率**:
```sql
SELECT
  COUNT(*) FILTER (WHERE on_chain_id IS NOT NULL) * 100.0 / COUNT(*) as success_rate
FROM escrows
WHERE status IN ('approved', 'on-chain', 'executed');
```

3. **平均承認時間**:
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 60 as avg_approval_minutes
FROM escrows
WHERE status = 'approved'
  AND created_at > NOW() - INTERVAL '7 days';
```

### ログ監視

重要なログパターン:
```
[EscrowApprovalService] Escrow <id> meets policy conditions
[OnChainExecutorService] Escrow registered with onChainId: <id>
[OnChainExecutorService] Execution confirmed in block <number>
```

エラーログパターン:
```
Failed to register escrow on-chain
Failed to approve escrow
Failed to validate escrow
```

## ロールバック計画

### 緊急時のロールバック手順

1. **フロントエンドのロールバック**:
```bash
# Vercel の場合
vercel rollback <deployment-url>
```

2. **API サーバーのロールバック**:
```bash
git revert <commit-hash>
git push origin main
# CI/CD が自動的に再デプロイ
```

3. **データベースのロールバック**:
```bash
psql -h <host> -U <user> -d <database> \
  -f apps/api/migrations/add_policy_oracle_pattern_rollback.sql
```

4. **スマートコントラクトのパーズ**:
```solidity
// ADMIN_ROLE で pause() を呼び出し
await escrowExecutor.pause();
```

## サポートとお問い合わせ

問題が発生した場合:
1. GitHub Issues: https://github.com/your-org/family-wallet/issues
2. Discord: #tech-support チャンネル
3. Email: support@family-wallet.com

## 参考資料

- [Policy as Oracle Pattern 設計書](../ARCHITECTURE.md)
- [EscrowExecutor.sol 仕様](../contracts/EscrowExecutor.md)
- [API エンドポイント仕様](../API_SPEC.md)
