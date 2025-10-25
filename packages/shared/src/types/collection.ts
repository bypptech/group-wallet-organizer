/**
 * Collection (集金管理) 型定義
 *
 * Escrow metadata を拡張して集金管理機能を実現
 */

/**
 * 集金参加者の状態
 */
export type ParticipantStatus = 'pending' | 'partial' | 'paid' | 'overdue';

/**
 * 集金参加者の情報
 */
export interface CollectionParticipant {
  /** 参加者のウォレットアドレス */
  address: string;
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
 * Collection用のmetadata構造
 */
export interface CollectionMetadata {
  /** Collectionタイプ識別子 */
  type: 'collection';
  /** 目標金額（wei as string） */
  totalAmount: string;
  /** 現在の集金額（wei as string） */
  collectedAmount: string;
  /** 支払期限（ISO 8601形式、オプション） */
  deadline?: string;
  /** 参加者リスト */
  participants: CollectionParticipant[];
  /** 全員支払完了で自動的にcompleteにするか */
  autoComplete?: boolean;
  /** 作成者のメモ */
  note?: string;
}

/**
 * Collection作成時のパラメータ
 */
export interface CreateCollectionParams {
  /** VaultのUUID */
  vaultId: string;
  /** Vaultのコントラクトアドレス */
  vaultAddress: string;
  /** 集金名 */
  name: string;
  /** 説明（オプション） */
  description?: string;
  /** トークンアドレス（USDC等） */
  token: string;
  /** 支払期限（ISO 8601形式、オプション） */
  deadline?: string;
  /** 参加者リスト */
  participants: {
    address: string;
    name?: string;
    allocatedAmount: string;
  }[];
  /** 作成者のアドレス */
  createdBy: string;
  /** メモ（オプション） */
  note?: string;
}

/**
 * 支払記録のパラメータ
 */
export interface CollectionPaymentParams {
  /** Collection ID（escrowDraft.id） */
  collectionId: string;
  /** 支払者のアドレス */
  participantAddress: string;
  /** 支払額（wei as string） */
  amount: string;
  /** トランザクションハッシュ */
  txHash: string;
}

/**
 * Collection更新パラメータ
 */
export interface UpdateCollectionParams {
  collectionId: string;
  deadline?: string;
  note?: string;
  participants?: CollectionParticipant[];
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
