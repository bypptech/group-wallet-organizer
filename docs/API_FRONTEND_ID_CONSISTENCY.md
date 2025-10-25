# API ⇄ フロントエンド ID整合性分析

## 📊 調査結果サマリー

### ✅ 正常に整合している箇所
### ⚠️ 不整合・改善が必要な箇所

---

## 1. Vault識別ID

### API側の実装

```typescript
// POST /vaults - Vault作成
{
  vaultAddress: string,  // リクエスト: Vaultコントラクトアドレス
  chainId: number,
  name: string,
  // ...
}

// レスポンス
{
  vault: {
    id: uuid,           // DBの主キー
    address: string,    // Vaultアドレス
    uuid: uuid,         // アプリ側識別用
    chainId: number,
    caip10: string,
    // ...
  }
}

// GET /vaults/:id - Vault取得
// :id は以下のいずれかを受け付ける:
// - vault.id (UUID)
// - vault.address (0x...)
// - vault.uuid (UUID)
```

### フロントエンド側の実装

```typescript
// useInviteManager.ts
const useInviteManager = (vaultAddress?: Address) => {
  // vaultAddress を使用 (0x...)

  createInviteWithSignature: async () => {
    vaultId: vaultAddress,  // ⚠️ API送信時にvaultIdとして送信
  }
}

// useVaults.ts
const useVault = (vaultId?: string) => {
  // vaultId を使用（UUID or Address）
  fetch(`${API_BASE_URL}/vaults/${vaultId}`)

  // レスポンスの後処理
  if ((apiVault as any).vaultAddress) {
    apiVault.address = (apiVault as any).vaultAddress  // ⚠️ 後方互換処理
  }
}
```

### 🔍 問題点

1. **命名の不統一**:
   - フロントエンド: `vaultAddress` を使用
   - API送信時: `vaultId` として送信
   - API側: `vaultAddress` で受け取り → `address` に保存

2. **後方互換処理の存在**:
   ```typescript
   if ((apiVault as any).vaultAddress) {
     apiVault.address = (apiVault as any).vaultAddress
   }
   ```
   これは過去に`vaultAddress`というフィールドが存在したことを示唆

3. **IDの種類の混在**:
   - `vault.id` (UUID): DBの主キー
   - `vault.address` (0x...): Vaultコントラクトアドレス
   - `vault.uuid` (UUID): アプリ側識別用
   - フロントエンドでは主に`address`を使用

---

## 2. Member識別

### API側

```typescript
// members テーブル
{
  id: uuid,              // DBの主キー
  vaultId: uuid,         // vault.id を参照
  address: string,       // メンバーのウォレットアドレス
  role: string,
  weight: number,
  // ...
}
```

### フロントエンド側

```typescript
// useVaults.ts
interface ExtendedMember extends Member {
  vaultId: string  // ✅ 正しく使用
}

// APIレスポンスの変換
{
  ...apiMember,
  vaultId: apiMember.vaultId as Address,  // ⚠️ UUIDをAddressにキャスト
}
```

### 🔍 問題点

**型の不一致**:
- API: `vaultId` は UUID (string)
- フロントエンド: `vaultId as Address` に強制キャスト
  - `Address`型は通常`0x...`形式を期待

---

## 3. Invite関連

### API側

```typescript
// invites テーブル
{
  id: uuid,
  vaultId: uuid,         // vault.id を参照
  token: string,
  // ...
}

// POST /invites
{
  vaultId: string,       // vault.address を期待
  role: string,
  // ...
}
```

### フロントエンド側

```typescript
// useInviteManager.ts
createInviteWithSignature: async () => {
  const requestBody = {
    vaultId: vaultAddress,  // 0x... アドレスを送信
    role: options?.role || 'viewer',
    // ...
  }
}

// useGroupCreation.ts
const { data: pendingInvites } = useQuery({
  queryKey: ['invites', vaultId],
  queryFn: async () => {
    const response = await fetch(`${API_BASE_URL}/invites?vaultId=${vaultId}`)
  }
})
```

### 🔍 問題点

**IDの種類の混在**:
- フロントエンドは `vaultAddress` (0x...) を送信
- API側の`invites`テーブルは `vaultId` (UUID) で保存
- API側で`vaultAddress`を受け取って`vault.id`に変換する処理が必要

---

## 📋 整合性マトリックス

| 用途 | API側 | フロントエンド側 | 整合性 | 備考 |
|------|-------|-----------------|--------|------|
| Vault主キー | `vault.id` (UUID) | 直接使用せず | ✅ | DBアクセスのみ |
| Vaultアドレス | `vault.address` (0x...) | `vaultAddress` (0x...) | ⚠️ | 命名不統一 |
| VaultアプリID | `vault.uuid` (UUID) | 使用されていない | ⚠️ | 未活用 |
| Member参照 | `member.vaultId` (UUID) | `member.vaultId as Address` | ❌ | 型不一致 |
| Invite参照 | `invite.vaultId` (UUID) | `vaultAddress` (0x...) | ❌ | ID種類が異なる |

---

## 🔧 推奨修正

### 優先度: 高

#### 1. フロントエンドの型定義修正

```typescript
// types/vault.ts
interface Vault {
  id: string              // UUID - DBの主キー
  address: Address        // 0x... - Vaultコントラクトアドレス
  uuid: string            // UUID - アプリ側識別用
  chainId: number
  caip10: string
  name: string
  // ...
}

interface Member {
  id: string
  vaultId: string         // UUID - vault.id を参照（Addressではない）
  address: Address        // 0x... - メンバーのウォレットアドレス
  role: string
  // ...
}
```

#### 2. useInviteManager の修正

```typescript
// 現在
const useInviteManager = (vaultAddress?: Address) => {
  createInviteWithSignature: async () => {
    vaultId: vaultAddress,  // ❌ アドレスをIDとして送信
  }
}

// 推奨
const useInviteManager = (vaultAddress: Address, vaultId: string) => {
  createInviteWithSignature: async () => {
    vaultId: vaultAddress,  // API側で変換される
    // または
    vaultId: vaultId,       // UUIDを直接送信
  }
}
```

#### 3. API側の柔軟な対応（既に実装済み）

```typescript
// GET /vaults/:id
// ✅ すでにaddressとUUIDの両方に対応している
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (id.startsWith('0x') && id.length === 42) {
    // Ethereum address で検索
    vault = await db.select().from(vaults).where(eq(vaults.address, id))
  } else {
    // UUID で検索
    vault = await db.select().from(vaults).where(eq(vaults.id, id))
  }
})
```

### 優先度: 中

#### 4. フロントエンド全体で命名統一

```typescript
// 統一案1: address を使用
vaultAddress → address

// 統一案2: 用途を明示
vaultAddress → vaultContractAddress
vaultId → vaultDatabaseId
vaultUuid → vaultAppId
```

#### 5. 後方互換コードの削除

```typescript
// ❌ 削除候補
if ((apiVault as any).vaultAddress) {
  apiVault.address = (apiVault as any).vaultAddress
}
```

---

## 📝 結論

### 現状の問題

1. **命名の不統一**: `vaultId` vs `vaultAddress` vs `address`
2. **型の不一致**: UUIDを`Address`型にキャスト
3. **後方互換コード**: 過去のフィールド名の名残
4. **ID種類の混在**: UUID、アドレス、CAIP-10が混在

### 推奨対応

✅ **短期対応（必須）**:
1. フロントエンドの型定義を正確にする
2. `member.vaultId as Address` のような誤ったキャストを修正

⚠️ **中期対応（推奨）**:
1. 命名規則を統一する
2. 後方互換コードを削除

### 評価

**整合性スコア**: 6.5/10

- API側は柔軟に対応している（address/UUID両対応）
- フロントエンド側の型定義と命名に改善の余地あり
- 機能的には動作するが、型安全性に課題

---

## 🎯 アクションアイテム

### すぐに対応すべき

- [ ] `member.vaultId as Address` の型キャストを修正
- [ ] フロントエンドの型定義ファイル作成/修正
- [ ] 後方互換コード（`vaultAddress`フォールバック）の削除

### 時間があれば対応

- [ ] 命名規則の統一（`vaultAddress` vs `vault.address`）
- [ ] `vault.uuid`の活用検討
- [ ] ドキュメント整備
