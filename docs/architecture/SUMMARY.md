# アーキテクチャ再設計サマリー

## 実施内容

Payment Policy と Escrow の関係性を再設計し、「Policy as Oracle Pattern」を導入しました。

## 主な変更点

### 1. コンセプトの明確化

**Before（旧アーキテクチャ）**:
- PolicyとEscrowの両方がOn-chainで管理
- 責任分離が不明確
- 高いガスコスト
- 柔軟性の欠如

**After（新アーキテクチャ）**:
```
Payment Policy = Off-chain検証ルール（Oracle的役割）
Escrow = On-chain実行 + Off-chain進捗管理
```

### 2. 作成されたドキュメント

#### `/docs/architecture/policy-escrow-redesign.md`
- 現状の問題点分析
- 新アーキテクチャの詳細設計
- データモデル定義
- フロー図
- 利点の説明

#### `/docs/architecture/migration-plan.md`
- 5つのPhaseに分けた段階的移行計画
- Phase 1: 型定義更新（完了）
- Phase 2: API層実装
- Phase 3: Smart Contract簡素化
- Phase 4: UI/UX更新
- Phase 5: データ移行

### 3. 型定義の更新（Phase 1完了）

#### Policy型の変更
```typescript
export interface Policy {
  // Off-chain識別子
  id: string;                      // Database UUID
  vaultId: string;

  // 検証ルール
  threshold?: number;              // 承認必要数
  timelock?: number;               // タイムロック（秒）
  maxAmount?: string;              // 最大金額
  rolesRoot?: string;              // Merkle Root
  ownersRoot?: string;             // Merkle Root

  // 状態管理
  active: boolean;

  // On-chain参照（オプション、将来用）
  onChainPolicyId?: string;
  registeredOnChain?: boolean;
  txHash?: string;
}
```

#### Escrow型の変更
```typescript
export interface Escrow {
  // Off-chain識別子
  id: string;
  vaultId: string;
  policyId: string;                // Policy参照

  // Off-chain進捗管理
  status: EscrowStatus;            // 状態遷移管理
  approvals: Approval[];           // 承認記録（NEW）

  // On-chain参照
  onChainEscrowId?: number;        // EscrowExecutor.sol内のID
  txHash?: string;                 // 登録トランザクション
  executionTxHash?: string;        // 実行トランザクション（NEW）
}
```

#### 新しい型の追加
```typescript
// Guardian承認記録
export interface Approval {
  guardianId: string;
  guardianAddress: string;
  approvedAt: string;
  signature?: string;
  merkleProof?: string[];
}

// Policy検証結果
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

#### EscrowStatus の明確化
```typescript
export type EscrowStatus =
  | 'draft'        // ローカル編集中
  | 'submitted'    // 承認待ち
  | 'approved'     // Policy条件を満たした
  | 'on-chain'     // On-chain登録済み、Timelock中
  | 'executed'     // On-chain実行済み（NEW）
  | 'completed'    // 完了
  | 'cancelled'
  | 'expired';
```

## 状態遷移フロー

```
[Off-chain: Database]
draft → submitted → approved
         ↓               ↓
    承認を集める    Policy条件満たした
         ↓               ↓
    Approval記録   ValidationResult.valid = true

[On-chain: Smart Contract]
                 approved → on-chain → executed → completed
                     ↓           ↓          ↓
              API登録リクエスト  Timelock  資金移動
```

## 利点

### 1. ガスコスト削減
- Policy情報をOff-chainで管理（SSTORE不要）
- 節約: Policy作成あたり約100,000 gas

### 2. 柔軟性向上
- Policy検証ロジックをAPI層で実装
- スマートコントラクトのアップグレード不要
- 新しい検証ルールを簡単に追加可能

### 3. UX改善
- 即座のValidationフィードバック
- リアルタイムな承認進捗表示
- Policy条件の可視化

### 4. セキュリティ向上
- 責任の明確化
- Smart Contract: 資金移動のみ（最小限の攻撃面）
- API Server: 複雑なValidation（定期的な更新可能）

## 次のステップ

### Phase 2: API層実装（次の作業）
- [ ] PolicyValidatorService実装
- [ ] EscrowApprovalService実装
- [ ] API Endpoints追加
  - `POST /api/escrows/:id/approve`
  - `POST /api/escrows/:id/validate`

### Phase 3: Smart Contract
- [ ] EscrowExecutor.sol実装
- [ ] テスト・監査
- [ ] デプロイ

### Phase 4: UI/UX
- [ ] リアルタイム検証UI
- [ ] 承認進捗表示
- [ ] Policy条件の可視化

### Phase 5: Migration
- [ ] データ移行スクリプト
- [ ] 旧Contract廃止

## コミット履歴

1. **docs: Add Policy/Escrow architectural redesign documentation**
   - policy-escrow-redesign.md
   - migration-plan.md

2. **refactor(types): Update Policy and Escrow types for new architecture**
   - Policy型の更新
   - Escrow型の更新
   - Approval型の追加
   - ValidationResult型の追加
   - EscrowStatus明確化

## 関連ファイル

- `/docs/architecture/policy-escrow-redesign.md` - 詳細設計
- `/docs/architecture/migration-plan.md` - 移行計画
- `/packages/shared/src/types/policy.ts` - Policy型定義
- `/packages/shared/src/types/escrow.ts` - Escrow型定義

## 設計思想

> **Payment Policy = 外部検証ルール（Oracle的情報）**
> - Off-chainで管理（Database）
> - APIサーバーが参照して検証
> - 柔軟に変更可能、ガスコスト0

> **Escrow = On-chain実行 + Off-chain進捗管理**
> - Off-chainで承認フロー管理（draft → submitted → approved）
> - Policy条件を満たしたらOn-chain登録
> - On-chainでは資金移動のみ実行

この分離により、**Policy = Oracle、Escrow = Smart Contract実行**という明確な役割分担を実現します。
