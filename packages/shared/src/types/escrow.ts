/**
 * Escrow (エスクロー) 型定義
 *
 * Policy-Based Architecture - "Policy as Oracle Pattern":
 * Escrow は On-chain 実行 + Off-chain 進捗管理を担当
 * - Payment Escrow: 支払い実行とその進捗管理
 * - Collection Escrow: 集金実行とその進捗管理
 *
 * 重要な設計原則:
 * - Off-chain で承認フローを管理（draft → submitted → approved）
 * - Policy 条件を満たしたら On-chain に登録
 * - On-chain では資金移動のみ実行（最小限のガスコスト）
 * - 進捗追跡は Off-chain（Database）で管理
 */

/**
 * エスクロータイプ
 */
export type EscrowType = 'payment' | 'collection';

/**
 * エスクロー状態
 *
 * Off-chain 進捗管理の状態遷移:
 * draft → submitted → approved → on-chain → executed → completed
 *
 * 各状態の意味:
 * - draft: ローカル編集中（Policy 検証前）
 * - submitted: 承認待ち（Policy 条件を満たすための承認を集めている）
 * - approved: 承認完了（Policy 条件を満たした、On-chain 登録待ち）
 * - on-chain: On-chain 登録済み（EscrowExecutor に登録済み、Timelock 中）
 * - executed: On-chain 実行済み（資金移動完了、確認待ち）
 * - completed: 完了（すべての処理完了）
 * - cancelled: キャンセル
 * - expired: 期限切れ
 */
export type EscrowStatus =
  | 'draft'        // ドラフト（ローカル編集中）
  | 'submitted'    // 提出済み（承認待ち）
  | 'approved'     // 承認済み（Policy 条件を満たした）
  | 'on-chain'     // On-chain 登録済み（Timelock 中）
  | 'executed'     // On-chain 実行済み（資金移動完了）
  | 'completed'    // 完了
  | 'cancelled'    // キャンセル
  | 'expired';     // 期限切れ

/**
 * 承認情報
 *
 * Off-chain で管理される Guardian の承認記録
 * Policy の threshold 条件を満たすために使用
 */
export interface Approval {
  /** Guardian ID (UUID) */
  guardianId: string;
  /** Guardian のウォレットアドレス */
  guardianAddress: string;
  /** 承認日時（ISO 8601） */
  approvedAt: string;
  /** 署名（将来的な署名検証用、オプション） */
  signature?: string;
  /** Merkle Proof（Policy の rolesRoot 検証用、オプション） */
  merkleProof?: string[];
}

/**
 * Collection参加者の支払状態
 */
export type ParticipantStatus = 'pending' | 'partial' | 'paid' | 'overdue';

/**
 * Collection参加者情報
 */
export interface CollectionParticipant {
  /** 参加者ID（一意識別子） */
  id: string;
  /** 参加者のウォレットアドレス（オプション - 招待URLで後から紐付け可能） */
  address?: string;
  /** 表示名（オプション） */
  name?: string;
  /** 割当金額（wei as string） */
  allocatedAmount: string;
  /** 支払済金額（wei as string） */
  paidAmount: string;
  /** 支払状態 */
  status: ParticipantStatus;
  /** 支払日時（ISO 8601形式） */
  paidAt?: string;
  /** トランザクションハッシュ */
  txHash?: string;
  /** 最終支払日時（部分支払の場合） */
  lastPaymentAt?: string;
}

/**
 * Escrow 基本型（DB schema に対応）
 *
 * On-chain 実行 + Off-chain 進捗管理:
 * - Off-chain: 承認フロー管理、進捗追跡
 * - On-chain: 資金移動実行のみ（approved 状態になったら登録）
 */
export interface Escrow {
  // === Off-chain 識別子 ===
  /** Database UUID (Primary Key) */
  id: string;
  /** Vault UUID */
  vaultId: string;
  /** Policy UUID（検証ルールへの参照） */
  policyId: string;

  // === メタデータ ===
  /** エスクロータイプ */
  type: EscrowType;
  /** エスクロー名 */
  name: string;
  /** エスクロー説明 */
  description?: string;

  // === トランザクション詳細 ===
  /** トークンアドレス（address(0) = ETH） */
  token: string;
  /** 総額（wei as string） */
  totalAmount: string;

  // === Payment Escrow フィールド (type='payment' の場合) ===
  /** 支払い要求者 */
  requester?: string;
  /** 受取人 */
  recipient?: string;
  /** コールターゲット（スマートコントラクト呼び出し用） */
  target?: string;
  /** コールデータ（スマートコントラクト呼び出し用） */
  data?: string;
  /** 支払い理由 */
  reason?: string;

  // === Collection Escrow フィールド (type='collection' の場合) ===
  /** 集金済金額（wei as string） */
  collectedAmount?: string;
  /** 参加者リスト */
  participants?: CollectionParticipant[];

  // === Off-chain 進捗管理 ===
  /** ステータス（draft → submitted → approved → on-chain → executed → completed） */
  status: EscrowStatus;
  /** 承認記録（Policy threshold 条件を満たすため） */
  approvals: Approval[];
  /** 支払期限（ISO 8601） */
  deadline?: string;
  /** 予定リリース日時（ISO 8601） */
  scheduledReleaseAt?: string;
  /** 有効期限（ISO 8601） */
  expiresAt?: string;

  // === On-chain 参照（approved → on-chain 後にセット） ===
  /** On-chain escrow ID（EscrowExecutor.sol 内の ID） */
  onChainEscrowId?: number;
  /** 登録トランザクションハッシュ */
  txHash?: string;
  /** 実行トランザクションハッシュ */
  executionTxHash?: string;

  // === タイムスタンプ ===
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Payment Escrow 型（type discriminated union）
 */
export interface PaymentEscrow extends Escrow {
  type: 'payment';
  requester: string;
  recipient: string;
  target?: string;
  data?: string;
  reason?: string;
  collectedAmount?: never;
  participants?: never;
}

/**
 * Collection Escrow 型（type discriminated union）
 */
export interface CollectionEscrow extends Escrow {
  type: 'collection';
  collectedAmount: string;
  participants: CollectionParticipant[];
  requester?: never;
  recipient?: never;
  target?: never;
  data?: never;
  reason?: never;
}

/**
 * Payment Escrow 作成パラメータ
 */
export interface CreatePaymentEscrowParams {
  /** Vault UUID */
  vaultId: string;
  /** Policy UUID */
  policyId: string;
  /** エスクロー名 */
  name: string;
  /** エスクロー説明 */
  description?: string;
  /** トークンアドレス */
  token: string;
  /** 総額（wei as string） */
  totalAmount: string;
  /** 支払い要求者 */
  requester: string;
  /** 受取人 */
  recipient: string;
  /** コールターゲット */
  target?: string;
  /** コールデータ */
  data?: string;
  /** 支払い理由 */
  reason?: string;
  /** 支払期限 */
  deadline?: Date;
  /** 予定リリース日時 */
  scheduledReleaseAt?: Date;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Collection Escrow 作成パラメータ
 */
export interface CreateCollectionEscrowParams {
  /** Vault UUID */
  vaultId: string;
  /** Policy UUID */
  policyId: string;
  /** 集金名 */
  name: string;
  /** 集金説明 */
  description?: string;
  /** トークンアドレス */
  token: string;
  /** 支払期限 */
  deadline?: Date;
  /** 参加者リスト */
  participants: {
    address: string;
    name?: string;
    allocatedAmount: string;
  }[];
  /** 作成者のアドレス */
  createdBy: string;
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Escrow 更新パラメータ
 */
export interface UpdateEscrowParams {
  /** Escrow ID */
  escrowId: string;
  /** エスクロー名 */
  name?: string;
  /** エスクロー説明 */
  description?: string;
  /** ステータス */
  status?: EscrowStatus;
  /** 支払期限 */
  deadline?: string;
  /** Collection: 参加者リスト */
  participants?: CollectionParticipant[];
  /** その他のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * Collection支払記録パラメータ
 */
export interface RecordCollectionPaymentParams {
  /** Escrow ID */
  escrowId: string;
  /** 支払者のアドレス */
  participantAddress: string;
  /** 支払額（wei as string） */
  amount: string;
  /** トランザクションハッシュ */
  txHash: string;
}

/**
 * Escrow 一覧取得パラメータ
 */
export interface GetEscrowsParams {
  /** Vault UUID */
  vaultId: string;
  /** Policy UUID */
  policyId?: string;
  /** エスクロータイプでフィルタ */
  type?: EscrowType;
  /** ステータスでフィルタ */
  status?: EscrowStatus;
}

/**
 * Collection統計情報
 */
export interface CollectionStats {
  /** 総参加者数 */
  totalParticipants: number;
  /** 支払済参加者数 */
  paidParticipants: number;
  /** 未払参加者数 */
  pendingParticipants: number;
  /** 目標金額 */
  totalAmount: string;
  /** 集金済金額 */
  collectedAmount: string;
  /** 達成率（0-100） */
  completionRate: number;
}

/**
 * Policy 検証結果
 *
 * API サーバーが Escrow を Policy に対して検証した結果
 */
export interface ValidationResult {
  /** 検証が成功したか */
  valid: boolean;
  /** エラーメッセージ（検証失敗時） */
  errors: string[];
  /** 警告メッセージ（検証成功だが注意が必要） */
  warnings: string[];
}

/**
 * Escrow 承認パラメータ
 */
export interface ApproveEscrowParams {
  /** Escrow ID */
  escrowId: string;
  /** Guardian ID */
  guardianId: string;
  /** Guardian アドレス */
  guardianAddress: string;
  /** 署名（オプション） */
  signature?: string;
}
