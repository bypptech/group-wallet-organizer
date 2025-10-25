# Group & Invite vs Collection Participants - 関係性の解説

## 概要

Family WalletにおけるGroup/Inviteシステムと、Collection Escrowの参加者リスト (participants) は、**異なる目的を持つ独立したシステム**です。

---

## データ構造

### 1. Vault Members (メンバー管理)

```typescript
// Database: members table
{
  id: UUID,
  vaultId: UUID,              // 所属Vault
  address: Address,           // メンバーのウォレットアドレス
  role: 'owner' | 'guardian' | 'requester' | 'viewer' | 'approver',
  weight: number,             // 承認権重み
  addedAt: Date,
  addedBy: Address,
  metadata: JSONB
}
```

**目的**: Vaultへのアクセス権限管理
- Vaultの資金を管理できる人
- Payment承認ができる人
- 閲覧のみできる人

### 2. Invite System (招待システム)

```typescript
// Database: invites table
{
  id: UUID,
  vaultId: UUID,
  inviteCode: string,         // 招待コード
  role: string,               // 招待先の役割
  expiresAt: Date,
  createdBy: Address,
  metadata: JSONB
}
```

**目的**: 新しいメンバーをVaultに追加する手段
- Invite linkを生成
- 承認されたらmembersテーブルに追加

### 3. Collection Escrow Participants (集金参加者)

```typescript
// Database: escrows table (type='collection')
{
  id: UUID,
  vaultId: UUID,
  policyId: UUID,
  type: 'collection',
  participants: [              // JSONB配列
    {
      address: Address,        // 支払うべき人のアドレス
      name?: string,           // 表示名
      allocatedAmount: string, // 割当金額
      paidAmount: string,      // 支払済み金額
      status: 'pending' | 'partial' | 'paid' | 'overdue',
      paidAt?: Date,
      txHash?: string
    }
  ],
  collectedAmount: string,     // 集金総額
  totalAmount: string,         // 目標金額
}
```

**目的**: 特定のCollection（集金イベント）への支払い追跡
- この集金に誰がいくら払うべきか
- 誰が支払い済みか
- 残金はいくらか

---

## 関係性の整理

### ❌ 誤解: "Collectionの参加者 = Vaultのメンバー"

**これは必ずしも真ではありません。**

### ✅ 正しい理解

```
Vault Members (membersテーブル)
  ├── Owner/Guardian: Vaultを管理する人
  ├── Requester: Payment requestできる人
  └── Viewer: 閲覧のみの人

Collection Participants (escrows.participants)
  ├── 参加者A: この集金イベントで1000円払う人
  ├── 参加者B: この集金イベントで2000円払う人
  └── 参加者C: この集金イベントで500円払う人
```

**重要な違い**:
- **Vault Members**: Vaultへの継続的なアクセス権限
- **Collection Participants**: 特定の集金イベントへの支払い義務

---

## 実際のユースケース

### ケース1: ファミリー旅行の資金集め

```typescript
// Vault Members (Vaultを管理できる家族)
members = [
  { address: '0xFather', role: 'owner' },
  { address: '0xMother', role: 'guardian' },
  { address: '0xSon', role: 'viewer' }
];

// Collection: 旅行資金
collectionEscrow = {
  name: '沖縄旅行の資金',
  participants: [
    { address: '0xFather', allocatedAmount: '50000' },   // 父: 5万円
    { address: '0xMother', allocatedAmount: '50000' },   // 母: 5万円
    { address: '0xSon', allocatedAmount: '30000' },      // 息子: 3万円
    { address: '0xGrandma', allocatedAmount: '20000' }   // 祖母: 2万円 (Memberではない!)
  ]
};
```

**ポイント**:
- `0xGrandma`はVault Memberではない（Vaultを管理できない）
- しかし、この旅行の資金提供者として参加
- Collectionへの支払いは可能だが、Vaultの承認などはできない

### ケース2: 友人グループでの割り勘

```typescript
// Vault Members (共同ウォレット管理者)
members = [
  { address: '0xAlice', role: 'owner' },
  { address: '0xBob', role: 'guardian' }
];

// Collection: 飲み会の割り勘
collectionEscrow = {
  name: '忘年会の割り勘',
  participants: [
    { address: '0xAlice', allocatedAmount: '5000' },
    { address: '0xBob', allocatedAmount: '5000' },
    { address: '0xCarol', allocatedAmount: '5000' },    // Member外
    { address: '0xDave', allocatedAmount: '5000' },     // Member外
    { address: '0xEve', allocatedAmount: '5000' }       // Member外
  ]
};
```

**ポイント**:
- Alice & BobだけがVault Member（Vaultを管理）
- Carol, Dave, EveはMemberではないが、この割り勘イベントの参加者
- 誰でもCollectionに支払いできる（Vaultアクセス権不要）

---

## 設計上の独立性

### Vault Members ≠ Collection Participants の理由

#### 1. **柔軟性**
- Vaultメンバーでない人も集金対象にできる
- 一時的なイベントごとに参加者を変更可能
- 友人・親戚など、Vault管理権限を与えたくない人からも集金可能

#### 2. **セキュリティ**
- Collection参加 = Vaultへの支払いのみ
- Vault Member = Vaultの資金管理権限
- 権限の分離により、不要なアクセス権を与えない

#### 3. **実用性**
- 旅行、イベント、割り勘など、都度参加者が変わる
- Vaultメンバーを毎回追加/削除する必要がない
- 外部の人も簡単に参加可能

---

## 実装上のフロー

### Collection作成時

```typescript
// 1. Collection Policy選択
const policy = await fetchPolicies({ type: 'collection' });

// 2. 参加者リストを手動入力
const participants = [
  { address: '0xA...', name: 'Alice', allocatedAmount: '1000' },
  { address: '0xB...', name: 'Bob', allocatedAmount: '2000' },
  { address: '0xC...', name: 'Carol', allocatedAmount: '1500' }
];

// 3. Collection Escrow作成
await createEscrow({
  type: 'collection',
  vaultId,
  policyId,
  participants,  // ← Vault Membersとは独立
});
```

### オプション機能: Member自動追加

**将来的な拡張として**、UI上でVault Membersから参加者を選択できる機能は追加可能:

```tsx
// CollectionCreation.tsx (オプション機能)
<Button onClick={addMembersAsParticipants}>
  Vault Membersから追加
</Button>

const addMembersAsParticipants = () => {
  const vaultMembers = await fetchMembers(vaultId);
  
  // Membersを参加者候補として表示
  const suggestions = vaultMembers.map(m => ({
    address: m.address,
    name: m.metadata?.name || shortenAddress(m.address),
    allocatedAmount: '' // ユーザーが入力
  }));
  
  setParticipantSuggestions(suggestions);
};
```

---

## まとめ

### 現在の設計

| 項目 | Vault Members | Collection Participants |
|------|--------------|------------------------|
| **目的** | Vaultアクセス権限管理 | 特定集金イベントの支払い追跡 |
| **永続性** | Vaultが存在する限り継続 | Collection完了まで |
| **権限** | Vault操作権限あり | 支払い義務のみ |
| **対象者** | 家族・信頼できる人 | 誰でも（一時的参加者含む） |
| **追加方法** | Invite system | Collection作成時に指定 |
| **データ保存** | `members` table | `escrows.participants` (JSONB) |

### 設計のメリット

1. ✅ **柔軟性**: Vaultメンバー外からも集金可能
2. ✅ **セキュリティ**: 権限の分離
3. ✅ **シンプル**: 都度参加者を指定するだけ
4. ✅ **拡張性**: 将来的にMemberからの自動追加も可能

### 推奨実装

**現時点**: Collection作成時に参加者を手動入力
**将来**: UI上でVault Membersを候補として表示し、選択できる機能を追加

---

## 参考: Data Flow

```
User Action: "沖縄旅行の集金を作成"
    ↓
[1] Collection Policy選択
    (allowPartialPayment, deadline, reminderなどのルール)
    ↓
[2] 参加者リスト入力
    - 父: 5万円
    - 母: 5万円  
    - 息子: 3万円
    - 祖母: 2万円 (← Vault MemberでなくてもOK)
    ↓
[3] Collection Escrow作成
    escrows table (type='collection')
    ↓
[4] 各参加者が支払い
    participants[i].paidAmount更新
    ↓
[5] 全額集まったら完了
    status: 'completed'
```

この設計により、Vaultの管理権限と集金イベントへの参加を明確に分離し、柔軟な資金管理を実現しています。
