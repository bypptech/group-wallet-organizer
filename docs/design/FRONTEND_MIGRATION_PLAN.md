# Policy-Based Architecture - フロントエンド段階的移行プラン

## 概要

このドキュメントは、Policy-Based Architectureへのフロントエンド移行を段階的に実施するための詳細プランです。

## 現状分析

### バックエンド状態
- ✅ データベーススキーマ: 完全移行完了 (policies + escrows)
- ✅ API Routes: Payment/Collection両対応
- ✅ 型定義: shared packageで完全定義
- ✅ レガシー互換性: collections.ts経由で後方互換性確保

### フロントエンド状態
- ⚠️ API Hooks: 旧型定義を使用
- ⚠️ Components: Payment Policyのみ対応
- ⚠️ Collection: 独立した実装 (escrows APIへの統合が必要)

## 移行戦略

### 原則
1. **後方互換性維持**: 既存機能を破壊しない
2. **段階的実装**: フェーズごとにコミット・テスト
3. **型安全性**: shared typesを活用
4. **ユーザー影響最小化**: 既存UIは動作し続ける

## Phase 1: 基盤整備 (優先度: 高)

### 1.1 API Client型定義の統一
**ファイル**: `apps/web/src/hooks/*.ts`
**目的**: shared packageの型定義を使用

#### 更新対象
```typescript
// Before
interface Policy {
  id: string;
  threshold: number;
  // ... old fields
}

// After
import { Policy, PaymentPolicy, CollectionPolicy } from '@shared/types/policy';
```

**作業内容**:
- [ ] `usePolicy.ts`: Policy型をsharedからimport
- [ ] `usePolicyManager.ts`: CRUD操作の型をshared型に更新
- [ ] `useEscrows.ts`: Escrow型をsharedからimport
- [ ] `useCollections.ts`: CollectionEscrow型として再定義

**影響範囲**: API hooksのみ（UI変更なし）
**リスク**: 低（型定義の置き換えのみ）

### 1.2 API Endpoints更新
**目的**: 新しいAPI構造に対応

#### 更新内容
```typescript
// Policies API
GET /policies?type=payment|collection  // typeフィルタ追加
POST /policies { type: 'payment' | 'collection', ... }

// Escrows API  
GET /escrows?type=payment|collection  // typeフィルタ追加
POST /escrows { type: 'payment' | 'collection', ... }
POST /escrows/:id/payment  // Collection支払記録
```

**作業内容**:
- [ ] `usePolicy.ts`: typeパラメータ対応
- [ ] `useEscrows.ts`: 新escrows endpointに切り替え
- [ ] `useCollections.ts`: /collections → /escrows?type=collection

**影響範囲**: API通信層のみ
**リスク**: 中（APIエンドポイント変更）

## Phase 2: Policy機能拡張 (優先度: 高)

### 2.1 PolicyCreation - Collection Policy対応
**ファイル**: `apps/web/src/components/wallet/PolicyCreation.tsx`

#### UI変更
```tsx
// 1. Policy Type選択
<Select value={policyType} onValueChange={setPolicyType}>
  <SelectItem value="payment">Payment Policy</SelectItem>
  <SelectItem value="collection">Collection Policy</SelectItem>
</Select>

// 2. 条件分岐フォーム表示
{policyType === 'payment' && (
  <PaymentPolicyForm />  // 既存のフォーム
)}
{policyType === 'collection' && (
  <CollectionPolicyForm />  // 新規追加
)}
```

#### CollectionPolicyForm内容
```tsx
<CollectionPolicyForm>
  <Label>Policy Name</Label>
  <Input name="name" />
  
  <Label>Description</Label>
  <Textarea name="description" />
  
  <Separator />
  
  <h3>Collection Settings</h3>
  
  <Checkbox name="allowPartialPayment">
    Allow Partial Payment
  </Checkbox>
  
  <Checkbox name="autoComplete">
    Auto-complete when all paid
  </Checkbox>
  
  <Label>Default Deadline (days)</Label>
  <Input type="number" name="defaultDeadline" />
</CollectionPolicyForm>
```

**作業内容**:
- [ ] Type selector UI追加
- [ ] CollectionPolicyForm component作成
- [ ] Form validation追加
- [ ] API呼び出し更新

**影響範囲**: Policy作成UIのみ
**リスク**: 低（新機能追加）

### 2.2 PolicyList - Type表示・フィルタ
**ファイル**: `apps/web/src/components/wallet/PolicyList.tsx`

#### UI変更
```tsx
// 1. Typeフィルタ
<Tabs value={filterType} onValueChange={setFilterType}>
  <TabsList>
    <TabsTrigger value="all">All Policies</TabsTrigger>
    <TabsTrigger value="payment">Payment</TabsTrigger>
    <TabsTrigger value="collection">Collection</TabsTrigger>
  </TabsList>
</Tabs>

// 2. Policy Card表示
<Badge variant={policy.type === 'payment' ? 'default' : 'secondary'}>
  {policy.type === 'payment' ? 'Payment' : 'Collection'}
</Badge>
```

**作業内容**:
- [ ] Type filter tabs追加
- [ ] Policy type badge表示
- [ ] Filter logic実装

**影響範囲**: Policy一覧表示
**リスク**: 低（表示拡張）

### 2.3 PolicyDetail - Collection設定表示
**ファイル**: `apps/web/src/components/wallet/PolicyDetail.tsx`

#### 表示内容
```tsx
{policy.type === 'payment' && <PaymentPolicyDetails policy={policy} />}
{policy.type === 'collection' && <CollectionPolicyDetails policy={policy} />}

// CollectionPolicyDetails
<CollectionPolicyDetails>
  <DetailRow label="Type" value="Collection Policy" />
  <DetailRow 
    label="Partial Payment" 
    value={config.allowPartialPayment ? "Allowed" : "Not Allowed"} 
  />
  <DetailRow 
    label="Auto Complete" 
    value={config.autoComplete ? "Yes" : "No"} 
  />
  <DetailRow 
    label="Default Deadline" 
    value={`${config.defaultDeadline} days`} 
  />
</CollectionPolicyDetails>
```

**作業内容**:
- [ ] Type discriminationロジック追加
- [ ] CollectionPolicyDetails component作成

**影響範囲**: Policy詳細表示
**リスク**: 低（表示拡張）

## Phase 3: Escrow機能統合 (優先度: 中)

### 3.1 EscrowCreation - Type選択
**ファイル**: `apps/web/src/components/wallet/EscrowCreation.tsx`

#### UI変更
```tsx
// 1. Escrow Type選択
<Select value={escrowType} onValueChange={setEscrowType}>
  <SelectItem value="payment">Payment Request</SelectItem>
  <SelectItem value="collection">Collection Request</SelectItem>
</Select>

// 2. Policy選択フィルタ
<Select value={selectedPolicyId}>
  {policies
    .filter(p => p.type === escrowType)
    .map(p => (
      <SelectItem key={p.id} value={p.id}>
        {p.name}
      </SelectItem>
    ))}
</Select>

// 3. 条件分岐フォーム
{escrowType === 'payment' && <PaymentEscrowForm />}
{escrowType === 'collection' && <CollectionEscrowForm />}
```

**作業内容**:
- [ ] Type selector追加
- [ ] Policy list filtering
- [ ] CollectionEscrowForm作成 (既存CollectionCreation.tsxを参考)

**影響範囲**: Escrow作成UI
**リスク**: 中（既存Payment flowに影響）

### 3.2 EscrowList - Type表示・フィルタ
**ファイル**: `apps/web/src/components/wallet/EscrowList.tsx`

#### UI変更（PolicyListと同様）
```tsx
<Tabs value={filterType}>
  <TabsTrigger value="all">All Escrows</TabsTrigger>
  <TabsTrigger value="payment">Payments</TabsTrigger>
  <TabsTrigger value="collection">Collections</TabsTrigger>
</Tabs>
```

**作業内容**:
- [ ] Type filter追加
- [ ] Badge表示追加
- [ ] API呼び出し更新（?type= parameter）

**影響範囲**: Escrow一覧
**リスク**: 低（表示拡張）

## Phase 4: Collection統合 (優先度: 中)

### 4.1 CollectionList - Escrows APIへの移行
**ファイル**: `apps/web/src/components/wallet/CollectionList.tsx`

#### 変更内容
```typescript
// Before
const { data: collections } = useCollections(vaultId);

// After
const { data: escrows } = useEscrows(vaultId, { type: 'collection' });
const collections = escrows?.filter(e => e.type === 'collection');
```

**作業内容**:
- [ ] useCollections → useEscrows移行
- [ ] データ構造マッピング（必要に応じて）

**影響範囲**: Collection一覧表示
**リスク**: 中（データソース変更）

### 4.2 CollectionCreation - Escrows API使用
**ファイル**: `apps/web/src/components/wallet/CollectionCreation.tsx`

#### 変更内容
```typescript
// Before
const { mutate: createCollection } = useCreateCollection();

// After
const { mutate: createEscrow } = useCreateEscrow();
createEscrow({
  type: 'collection',
  vaultId,
  policyId, // Collection Policyを選択
  name,
  participants,
  ...
});
```

**作業内容**:
- [ ] API呼び出しをcreateEscrowに変更
- [ ] Policy選択UI追加
- [ ] データ構造を新escrow形式に変換

**影響範囲**: Collection作成
**リスク**: 高（既存機能の書き換え）

### 4.3 CollectionDetail - 統合表示
**ファイル**: `apps/web/src/components/wallet/CollectionDetail.tsx`

#### 統合方針
```tsx
// Option 1: EscrowDetailに統合
<EscrowDetail escrowId={id}>
  {escrow.type === 'collection' && (
    <CollectionParticipants participants={escrow.participants} />
  )}
</EscrowDetail>

// Option 2: 独立コンポーネント維持（Escrow APIを使用）
<CollectionDetail collectionId={id}>
  {/* 既存UIを維持、データソースのみ変更 */}
</CollectionDetail>
```

**作業内容**:
- [ ] データ取得をuseEscrowに変更
- [ ] UI統合 or 独立維持の判断
- [ ] 支払記録API更新 (POST /escrows/:id/payment)

**影響範囲**: Collection詳細表示
**リスク**: 中（データ構造変更）

## Phase 5: 統合テスト (優先度: 高)

### 5.1 E2Eテストシナリオ

#### Payment Policy + Payment Escrow
1. Payment Policy作成
2. Payment Escrow作成（作成したPolicyを選択）
3. Escrow承認・実行
4. 結果確認

#### Collection Policy + Collection Escrow
1. Collection Policy作成
2. Collection Escrow作成（作成したPolicyを選択）
3. 参加者が支払実行
4. 全員支払完了→ステータス更新確認

#### 混在シナリオ
1. Payment Policy + Collection Policy共存確認
2. フィルタ動作確認
3. 一覧表示確認

### 5.2 テストチェックリスト
- [ ] Payment Policy CRUD操作
- [ ] Collection Policy CRUD操作
- [ ] Payment Escrow CRUD操作
- [ ] Collection Escrow CRUD操作
- [ ] Type filtering (Policy/Escrow)
- [ ] Collection支払記録
- [ ] レガシーCollection API互換性
- [ ] エラーハンドリング

## 実装優先順位

### 🔴 Phase 1 (必須・即時実施)
- API Client型定義統一
- API Endpoints更新

→ **理由**: バックエンド変更への対応、型安全性確保

### 🟡 Phase 2 (重要・1週間以内)
- PolicyCreation - Collection対応
- PolicyList - Type表示

→ **理由**: 新機能の基盤、ユーザー価値提供

### 🟢 Phase 3-4 (通常・2週間以内)
- Escrow機能統合
- Collection統合

→ **理由**: UI統合、UX向上

### ⚪ Phase 5 (継続)
- 統合テスト
- バグ修正

## ロールバック戦略

### 各Phaseのロールバックポイント

**Phase 1後**: 型定義のみ変更、UI影響なし
- ロールバック: Git revert

**Phase 2後**: Policy作成UIに新機能追加
- ロールバック: Type selector非表示化

**Phase 3-4後**: Escrow/Collection統合
- ロールバック: レガシーAPI経由に戻す（collections.tsが互換性確保）

## リスク管理

### 高リスク項目
1. **CollectionCreation書き換え** (Phase 4.2)
   - 軽減策: レガシーAPI維持、段階的移行

2. **Escrow API統合** (Phase 3.1)
   - 軽減策: Payment flow先行テスト

### 中リスク項目
1. **API Endpoints変更** (Phase 1.2)
   - 軽減策: レガシーエンドポイント併存

2. **Collection統合** (Phase 4.x)
   - 軽減策: 既存UIコンポーネント再利用

## 完了基準

### Phase 1
- [ ] すべてのAPI hooksがshared typesを使用
- [ ] 型エラーゼロ
- [ ] 既存機能が正常動作

### Phase 2
- [ ] Collection Policy作成可能
- [ ] Policy一覧でtype表示・フィルタ可能
- [ ] Policy詳細でcollection設定表示

### Phase 3
- [ ] Collection Escrow作成可能（新API経由）
- [ ] Escrow一覧でtype表示・フィルタ可能

### Phase 4
- [ ] Collection機能が完全にEscrows API使用
- [ ] 支払記録が新API経由で動作

### Phase 5
- [ ] 全E2Eテストパス
- [ ] パフォーマンス問題なし
- [ ] ユーザー報告バグゼロ

## タイムライン

```
Week 1: Phase 1 (基盤整備)
Week 2: Phase 2 (Policy拡張) + Phase 3開始
Week 3: Phase 3 (Escrow統合) + Phase 4開始
Week 4: Phase 4 (Collection統合) + Phase 5
Week 5: Phase 5 (統合テスト) + バグ修正
```

## 次のアクション

1. **Phase 1.1開始**: API Client型定義の統一
2. チーム承認後、Phase 1.2実施
3. 各Phaseごとにコミット・レビュー

---

**作成日**: 2025-10-13
**最終更新**: 2025-10-13
**Status**: Draft → Review → Approved → In Progress
