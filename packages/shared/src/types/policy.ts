/**
 * Policy (ポリシー) 型定義
 *
 * Policy-Based Architecture - "Policy as Oracle Pattern":
 * Policy は Off-chain で管理される検証ルール（Oracle的役割）
 * - Payment Policy: 支払い承認に関する検証ルール
 * - Collection Policy: 集金に関する検証ルール
 *
 * 重要な設計原則:
 * - Policy は Off-chain（Database）で管理
 * - API サーバーが Policy を参照して Escrow を検証
 * - On-chain には最小限の情報のみ保存（ガスコスト削減）
 */

/**
 * ポリシータイプ
 */
export type PolicyType = 'payment' | 'collection';

/**
 * Collection Policy の設定
 */
export interface CollectionConfig {
  /** 部分支払いを許可するか */
  allowPartialPayment?: boolean;
  /** 全員支払完了で自動的にcompleteにするか */
  autoComplete?: boolean;
  /** 支払期限（ISO 8601形式） */
  defaultDeadline?: string;
  /** リマインダー設定 */
  reminderSettings?: {
    enabled: boolean;
    daysBefore: number;
  };
}

/**
 * Policy 基本型（DB schema に対応）
 *
 * Off-chain 検証ルールとして機能:
 * - Escrow 作成時の検証条件
 * - 承認フローの制御ルール
 * - API サーバーが参照する「外部オラクル情報」
 */
export interface Policy {
  // === Off-chain 識別子 ===
  /** Database UUID (Primary Key) */
  id: string;
  /** Vault UUID */
  vaultId: string;

  // === メタデータ ===
  /** ポリシータイプ */
  type: PolicyType;
  /** ポリシー名 */
  name: string;
  /** ポリシー説明 */
  description?: string;

  // === Payment Policy 検証ルール (type='payment' の場合) ===
  /** 承認必要数 */
  threshold?: number;
  /** タイムロック（秒） */
  timelock?: number;
  /** ロール Merkle Root（承認者の権限検証用） */
  rolesRoot?: string;
  /** オーナー Merkle Root（オーナーの検証用） */
  ownersRoot?: string;
  /** 最大金額（wei as string） */
  maxAmount?: string;

  // === Collection Policy 検証ルール (type='collection' の場合) ===
  /** 集金設定 */
  collectionConfig?: CollectionConfig;

  // === 状態管理 ===
  /** アクティブ状態（無効化されたポリシーは検証に使用できない） */
  active: boolean;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;

  // === On-chain 参照（オプション、将来的に on-chain 登録する場合用） ===
  /** On-chain policy ID (bytes32 as hex) - 現在は未使用 */
  onChainPolicyId?: string;
  /** On-chain 登録済みフラグ */
  registeredOnChain?: boolean;
  /** 登録トランザクションハッシュ */
  txHash?: string;
}

/**
 * Payment Policy 型（type discriminated union）
 */
export interface PaymentPolicy extends Policy {
  type: 'payment';
  threshold: number;
  timelock: number;
  rolesRoot: string;
  ownersRoot: string;
  maxAmount?: string;
  collectionConfig?: never;
}

/**
 * Collection Policy 型（type discriminated union）
 */
export interface CollectionPolicy extends Policy {
  type: 'collection';
  collectionConfig: CollectionConfig;
  threshold?: never;
  timelock?: never;
  rolesRoot?: never;
  ownersRoot?: never;
  maxAmount?: never;
}

/**
 * Payment Policy 作成パラメータ
 */
export interface CreatePaymentPolicyParams {
  /** Vault UUID */
  vaultId: string;
  /** ポリシー名 */
  name: string;
  /** ポリシー説明 */
  description?: string;
  /** 承認必要数 */
  threshold: number;
  /** タイムロック（秒） */
  timelock: number;
  /** ロールMerkleルート */
  rolesRoot: string;
  /** オーナーMerkleルート */
  ownersRoot: string;
  /** 最大金額（wei as string） */
  maxAmount?: string;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Collection Policy 作成パラメータ
 */
export interface CreateCollectionPolicyParams {
  /** Vault UUID */
  vaultId: string;
  /** ポリシー名 */
  name: string;
  /** ポリシー説明 */
  description?: string;
  /** 集金設定 */
  collectionConfig: CollectionConfig;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Policy 更新パラメータ
 */
export interface UpdatePolicyParams {
  /** Policy ID */
  policyId: string;
  /** ポリシー名 */
  name?: string;
  /** ポリシー説明 */
  description?: string;
  /** アクティブ状態 */
  active?: boolean;
  /** Payment Policy: 最大金額 */
  maxAmount?: string;
  /** Collection Policy: 集金設定 */
  collectionConfig?: CollectionConfig;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Policy 一覧取得パラメータ
 */
export interface GetPoliciesParams {
  /** Vault UUID */
  vaultId: string;
  /** ポリシータイプでフィルタ */
  type?: PolicyType;
  /** アクティブ状態でフィルタ */
  active?: boolean;
}
