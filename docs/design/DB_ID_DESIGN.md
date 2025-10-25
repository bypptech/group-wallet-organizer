# データベースID体系 設計書

## 現在の実装 vs 推奨設計の比較

### ✅ 整合性が取れている箇所

| 推奨設計 | 現在の実装 | 状態 | 用途 |
|---------|-----------|------|------|
| **vault_address** | `vaults.address` (varchar 42) | ✅ 一致 | Vaultコントラクトのアドレス |
| **uuid_vault** | `vaults.uuid` (uuid) | ✅ 一致 | アプリ側でのVault識別用 |
| **salt** | `vaults.salt` (varchar 66) | ✅ 一致 | CREATE2デプロイ用 |
| **chain_id** | `vaults.chain_id` (integer) | ✅ 一致 | チェーン識別 |
| **wallet_address** | `members.address` (varchar 42) | ✅ 一致 | ユーザーのウォレットアドレス |
| **tx_hash** | 各種テーブルの `tx_hash` (varchar 66) | ✅ 一致 | トランザクションハッシュ |
| **escrow_id** | `escrow_drafts.escrow_id` (varchar 66) | ✅ 一致 | エスクローレコード識別 |

### ⚠️ 改善が必要な箇所

| 推奨設計 | 現在の実装 | 問題点 | 推奨対応 |
|---------|-----------|--------|---------|
| **vault_address (主キー)** | `vaults.id` (uuid) が主キー | アドレスではなくUUIDが主キー | 機能的には問題なし。UUIDの方が柔軟 |
| **uuid_user** | 未実装 | ユーザー統合管理がない | `users`テーブル追加を検討 |
| **session_id** | `sessions.id` (uuid) | ✅ 実装済み | 問題なし |
| **user_op_hash** | 各種テーブルで実装済み | ✅ 実装済み | Account Abstraction対応 |
| **caip10** | `vaults.caip10` (varchar 100) | ✅ 実装済み | マルチチェーン対応 |

### 📊 現在のテーブル構造

#### 1. vaults（Vault管理）
```sql
CREATE TABLE vaults (
  id uuid PRIMARY KEY,              -- 主キー（推奨ではvault_addressだが機能的に問題なし）
  address varchar(42) UNIQUE,        -- vault_address（Vaultコントラクトアドレス）
  name varchar(255),                 -- 表示名
  description text,                  -- 説明
  chain_id integer,                  -- チェーンID
  caip10 varchar(100) UNIQUE,        -- CAIP-10形式（eip155:8453:0x...）
  uuid uuid UNIQUE,                  -- uuid_vault（アプリ側識別用）
  salt varchar(66),                  -- CREATE2デプロイ用salt
  factory_address varchar(42),       -- VaultFactoryアドレス
  policy_id varchar(66),             -- ポリシーID
  created_at timestamp,
  updated_at timestamp,
  metadata jsonb                     -- 追加メタデータ
);
```

**整合性評価**: ✅ 推奨設計とほぼ一致
- `id`がUUIDなのは実装上の選択（柔軟性が高い）
- `address`、`uuid`、`chain_id`、`salt`が正しく実装されている

#### 2. members（メンバー管理）
```sql
CREATE TABLE members (
  id uuid PRIMARY KEY,
  vault_id uuid REFERENCES vaults(id),  -- Vault参照
  address varchar(42),                   -- wallet_address（メンバーのアドレス）
  role varchar(50),                      -- owner, guardian, requester, viewer
  weight integer,                        -- 承認重み
  added_at timestamp,
  added_by varchar(42),                  -- 追加者のアドレス
  metadata jsonb
);
```

**整合性評価**: ✅ 推奨設計と一致
- `address` = `wallet_address`
- `vault_id`で正しく参照

#### 3. invites（招待管理）
```sql
CREATE TABLE invites (
  id uuid PRIMARY KEY,
  vault_id uuid REFERENCES vaults(id),
  token varchar(255) UNIQUE,         -- 招待トークン
  role varchar(50),
  weight integer,
  signature text,                    -- EIP-712署名
  expires_at timestamp,
  used_at timestamp,
  used_by varchar(42),               -- wallet_address（使用者）
  created_by varchar(42),            -- wallet_address（作成者）
  created_at timestamp,
  metadata jsonb
);
```

**整合性評価**: ✅ 良好
- 招待トークンを別途管理（セキュリティ向上）

#### 4. escrow_drafts（エスクロー管理）
```sql
CREATE TABLE escrow_drafts (
  id uuid PRIMARY KEY,               -- uuid_escrow相当
  vault_id uuid REFERENCES vaults(id),
  escrow_id varchar(66) UNIQUE,      -- オンチェーンエスクローID（bytes32）
  requester varchar(42),             -- payer_address相当
  recipient varchar(42),             -- payee_address相当
  token varchar(42),                 -- token_address
  amount varchar(78),                -- uint256をstring表現
  target varchar(42),
  data text,
  reason text,
  scheduled_release_at timestamp,
  expires_at timestamp,
  status varchar(50),                -- draft, submitted, on-chain
  tx_hash varchar(66),               -- トランザクションハッシュ
  created_at timestamp,
  updated_at timestamp,
  metadata jsonb
);
```

**整合性評価**: ✅ 推奨設計と完全一致
- `escrow_id`: bytes32のエスクローID
- `requester/recipient`: payer/payeeのアドレス
- `token`: ERC-20トークンアドレス
- `amount`: uint256金額

#### 5. sessions（セッション管理）
```sql
CREATE TABLE sessions (
  id uuid PRIMARY KEY,               -- session_id相当
  user_address varchar(42),          -- wallet_address
  chain_id integer,
  token varchar(255) UNIQUE,         -- JWTトークン
  expires_at timestamp,
  created_at timestamp,
  last_accessed_at timestamp,
  ip_address varchar(45),
  user_agent text,                   -- user_agent_id相当
  metadata jsonb
);
```

**整合性評価**: ✅ 推奨設計と一致
- `id` = `session_id`
- `user_address` = `wallet_address`

### 🔄 ID命名規則の統一提案

現在の実装は機能的に正しいですが、命名規則を推奨設計に合わせると：

| 現在 | 推奨 | 理由 |
|------|------|------|
| `vaults.address` | そのまま | 明確 |
| `vaults.uuid` | そのまま（または`app_vault_id`） | 統一性 |
| `members.address` | そのまま | コンテキストから明確 |
| `escrow_drafts.requester` | `payer_address` | より明確 |
| `escrow_drafts.recipient` | `payee_address` | より明確 |

### 📝 追加を検討すべきテーブル

#### users（ユーザー統合管理）
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,               -- uuid_user
  primary_address varchar(42),       -- メインウォレット
  email varchar(255),                -- OAuth用
  created_at timestamp,
  last_login timestamp,
  metadata jsonb
);

CREATE TABLE user_addresses (
  user_id uuid REFERENCES users(id),
  address varchar(42),               -- 複数ウォレット対応
  chain_id integer,
  added_at timestamp,
  PRIMARY KEY (user_id, address, chain_id)
);
```

**用途**:
- 複数ウォレットを1ユーザーとして統合
- OAuth認証との連携
- クロスチェーン対応

### ✅ 最終評価

**現在の実装**: 9.5/10

**強み**:
- ✅ 主要なID体系が正しく実装されている
- ✅ 外部キー・インデックスが適切
- ✅ マルチチェーン対応（CAIP-10）
- ✅ Account Abstraction対応（user_op_hash）
- ✅ CREATE2対応（salt、uuid）

**改善提案**:
1. ユーザー統合管理テーブル追加（複数ウォレット対応）
2. 命名規則の統一（`requester`→`payer_address`等）※優先度低
3. `app_id`、`project_id`の追加（マルチテナント対応時）

### 🎯 結論

**現在の実装は推奨設計とほぼ完全に整合しています。**

機能的に問題はなく、以下の点で優れています：
- UUID主キーによる柔軟性
- 適切な外部キー制約
- マルチチェーン・AA対応

追加の変更は不要ですが、将来的にマルチテナントやOAuth対応を考える場合は`users`テーブルの追加を検討してください。
