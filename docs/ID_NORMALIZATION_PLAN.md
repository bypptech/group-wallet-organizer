# ID体系の正規化計画

## 現状分析

### Database (apps/api/src/db/schema.ts)
```typescript
export const vaults = pgTable("vaults", {
  id: uuid("id").primaryKey().defaultRandom(),              // DB主キー
  address: varchar("address", { length: 42 }).notNull().unique(),  // コントラクトアドレス
  chainId: integer("chain_id").notNull(),
  caip10: varchar("caip10", { length: 100 }).notNull().unique(),
  uuid: uuid("uuid").notNull().unique(),                    // アプリ識別子
  salt: varchar("salt", { length: 66 }),
  // ...
});

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),  // FK: vaults.id
  address: varchar("address", { length: 42 }).notNull(),
  // ...
});

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  vaultId: uuid("vault_id").notNull().references(() => vaults.id),  // FK: vaults.id
  // ...
});
```

### API (apps/api/src/routes/vaults.ts, invites.ts)
```typescript
// POST /vaults - 入力
{
  vaultAddress: string,  // 0x...
  chainId: number,
  uuid: string,
  // ...
}

// GET /vaults/:id - パラメータ
// id = vaults.id (UUID) | vaults.address (0x...) | vaults.uuid (UUID)

// レスポンス
{
  id: uuid,        // DB主キー
  address: string, // コントラクトアドレス
  uuid: uuid,      // アプリ識別子
  // ...
}

// POST /invites - 入力
{
  vaultId: string,  // vaults.address (0x...)を受け取る
  // ...
}
```

### Frontend (apps/web/src/hooks/useVaults.ts, useInviteManager.ts)
```typescript
// useVaults.ts
export interface Vault {
  id: string;              // DB主キー (UUID)
  address: Address;        // コントラクトアドレス (0x...)
  uuid: string;            // アプリ識別子
  // ...
}

export interface Member {
  id: string;
  vaultId: Address;        // ❌ 型エラー: 実際はUUIDだがAddress型
  address: Address;
  // ...
}

// useInviteManager.ts
const useInviteManager = (vaultAddress?: Address) => {
  createInviteWithSignature: async () => {
    vaultId: vaultAddress,  // ⚠️ addressをvaultIdとして送信
  }
}
```

## 問題点

### 1. 命名の不統一
- API入力: `vaultAddress`
- DB保存: `address`
- Frontend参照: `vaultAddress` → `vaultId`

### 2. 型の不一致
- `member.vaultId`: 実際はUUID (FK: vaults.id)
- Frontend定義: `vaultId: Address`
- 強制キャスト: `apiMember.vaultId as Address`

### 3. ID用途の曖昧さ
- `vaults.id`: DB主キー (UUID)
- `vaults.address`: コントラクトアドレス (0x...)
- `vaults.uuid`: アプリ識別子 (UUID)
- どれを「vaultId」と呼ぶべきか不明確

## 正の定義案

### 案A: DB主キー中心 (推奨)

**利点**:
- 外部キー制約が自然
- アドレス変更に強い
- RDB設計のベストプラクティス

**命名規則**:
- `vaults.id` (UUID) → 「vaultId」と呼ぶ
- `vaults.address` (0x...) → 「vaultAddress」と呼ぶ
- `vaults.uuid` (UUID) → 「vaultUuid」と呼ぶ

**API設計**:
```typescript
// POST /vaults - 入力
{
  address: Address,        // コントラクトアドレス
  chainId: number,
  uuid: string,            // アプリ識別子
  // ...
}

// レスポンス
{
  id: string,              // DB主キー → "vaultId"
  address: Address,        // コントラクトアドレス
  uuid: string,            // アプリ識別子
  // ...
}

// POST /invites - 入力
{
  vaultId: string,         // vaults.id (UUID)
  // ...
}
```

**Frontend設計**:
```typescript
export interface Vault {
  id: string;              // vaults.id (UUID) - DB主キー
  address: Address;        // vaults.address (0x...)
  uuid: string;            // vaults.uuid - アプリ識別子
  // ...
}

export interface Member {
  id: string;              // members.id
  vaultId: string;         // members.vault_id (FK: vaults.id)
  address: Address;        // members.address (メンバーのウォレット)
  // ...
}
```

### 案B: コントラクトアドレス中心

**利点**:
- Web3ユーザーに直感的
- ブロックチェーン上の一意性

**欠点**:
- 外部キー制約が複雑
- チェーン移行時に問題
- マルチチェーン対応が困難

**却下理由**: 既にDBがUUID主キーで設計済み

## 推奨: 案A (DB主キー中心)

### 正の定義

| 概念 | DB列名 | 型 | 用途 | API/Frontend名 |
|------|--------|------|------|----------------|
| DB主キー | vaults.id | UUID | 内部参照・FK | vaultId |
| コントラクトアドレス | vaults.address | varchar(42) | ブロックチェーン参照 | vaultAddress |
| アプリ識別子 | vaults.uuid | UUID | アプリレベル識別 | vaultUuid |
| チェーンID | vaults.chain_id | integer | ネットワーク識別 | chainId |
| CAIP-10 | vaults.caip10 | varchar(100) | マルチチェーン識別 | caip10 |

### 外部キー参照

| テーブル | FK列名 | 参照先 | 意味 |
|---------|--------|--------|------|
| members | vault_id | vaults.id | このメンバーが所属するVault |
| invites | vault_id | vaults.id | この招待が対象とするVault |
| policies | vault_id | vaults.id | このポリシーが適用されるVault |
| sessions | vault_id | vaults.id | このセッションのVault |
| timelines | vault_id | vaults.id | このイベントのVault |

## 修正マッピング

### Database: 修正不要 ✅
現在の設計がすでに正

### API: 修正箇所

#### apps/api/src/routes/vaults.ts

**Before**:
```typescript
// POST /vaults - Line 37-50
const newVault = {
  address: validatedData.vaultAddress,  // ❌ vaultAddress
  chainId: validatedData.chainId,
  caip10: validatedData.caip10,
  uuid: validatedData.uuid,
  // ...
};
```

**After**:
```typescript
// POST /vaults
const newVault = {
  address: validatedData.address,       // ✅ address
  chainId: validatedData.chainId,
  caip10: validatedData.caip10,
  uuid: validatedData.uuid,
  // ...
};
```

#### apps/api/src/routes/invites.ts

**Before**:
```typescript
// Line 150
const [existingVault] = await db
  .select()
  .from(vaults)
  .where(eq(vaults.address, validated.vaultId))  // ⚠️ vaultIdにaddressが来る前提
  .limit(1);
```

**After**:
```typescript
// vaultIdはUUID (vaults.id) を受け取る
const [existingVault] = await db
  .select()
  .from(vaults)
  .where(eq(vaults.id, validated.vaultId))       // ✅ vaults.idで検索
  .limit(1);
```

### Frontend: 修正箇所

#### apps/web/src/hooks/useVaults.ts

**Before - Line 54**:
```typescript
{
  ...apiMember,
  vaultId: apiMember.vaultId as Address,  // ❌ UUID → Address型キャスト
}
```

**After**:
```typescript
{
  ...apiMember,
  vaultId: apiMember.vaultId,             // ✅ string (UUID)のまま
}
```

**Before - Line 149-155**:
```typescript
// 後方互換コード
if ((apiVault as any).vaultAddress) {
  apiVault.address = (apiVault as any).vaultAddress
}
```

**After**:
```typescript
// 削除 - もう不要
```

**Before - 型定義**:
```typescript
export interface Member {
  id: string;
  vaultId: Address;        // ❌ 間違った型
  address: Address;
  // ...
}
```

**After**:
```typescript
export interface Member {
  id: string;
  vaultId: string;         // ✅ UUID文字列
  address: Address;        // メンバーのウォレットアドレス
  // ...
}
```

#### apps/web/src/hooks/useInviteManager.ts

**Before - Line 165**:
```typescript
const useInviteManager = (vaultAddress?: Address) => {
  createInviteWithSignature: async () => {
    vaultId: vaultAddress,  // ❌ addressをvaultIdとして送信
  }
}
```

**After**:
```typescript
const useInviteManager = (vaultId?: string) => {  // ✅ パラメータ名変更
  createInviteWithSignature: async () => {
    vaultId: vaultId,                             // ✅ UUID (vaults.id)
  }
}
```

**呼び出し元の修正も必要**:
```typescript
// Before
const { createInviteWithSignature } = useInviteManager(vault.address)

// After
const { createInviteWithSignature } = useInviteManager(vault.id)
```

## 実装順序

1. **Phase 1: Frontend型定義修正** (破壊的変更なし)
   - Member.vaultIdの型を`Address` → `string`に変更
   - 型キャストを削除

2. **Phase 2: Frontend関数シグネチャ修正**
   - useInviteManagerのパラメータを`vaultAddress` → `vaultId`に変更
   - 呼び出し元を`vault.address` → `vault.id`に変更

3. **Phase 3: API入力検証修正**
   - POST /vaultsの入力を`vaultAddress` → `address`に変更
   - POST /invitesのvaultId検索を`vaults.address` → `vaults.id`に変更

4. **Phase 4: クリーンアップ**
   - 後方互換コードを削除
   - ドキュメント更新

## リスク評価

### 低リスク
- Frontend型定義修正: 既存コードは動作し続ける
- 型安全性の向上のみ

### 中リスク
- useInviteManagerパラメータ変更: 呼び出し元の修正が必要
- テストで確認可能

### 高リスク
- API入力スキーマ変更: クライアント側の修正が必須
- 段階的デプロイ推奨

## 検証計画

各フェーズ後に以下を確認:
1. TypeScriptコンパイルエラーなし
2. Vault作成が成功
3. Member追加が成功
4. Invite作成が成功
5. 既存データへのアクセスが正常

---

作成日: 2025-10-12
