/**
 * Escrow Service
 *
 * Subgraphからエスクローデータを取得し、Neonデータベースにキャッシュ
 */

import { getDatabase, escrowDrafts, timelines, type NewEscrowDraft, type NewTimeline } from "../db/client.js";
import { eq, and, desc } from "drizzle-orm";
import { request, gql } from "graphql-request";
import { AuditService } from "./audit-service.js";

/**
 * エスクロー情報（Subgraphから）
 */
export interface EscrowData {
  escrowId: string;
  vaultId: string;
  requester: string;
  recipient: string;
  token: string;
  amount: string;
  target?: string;
  data?: string;
  reason?: string;
  status: string;
  createdAt: number;
  approvalCount: number;
  releaseTime?: number;
  txHash?: string;
}

/**
 * タイムラインイベント
 */
export interface TimelineEvent {
  escrowId: string;
  eventType: string;
  actor: string;
  txHash?: string;
  userOpHash?: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * EscrowService クラス
 */
export class EscrowService {
  private subgraphUrl: string;

  constructor(subgraphUrl?: string) {
    this.subgraphUrl = subgraphUrl || process.env.SUBGRAPH_URL || "";
  }

  /**
   * Subgraphからエスクロー一覧を取得
   */
  async fetchEscrowsFromSubgraph(vaultId?: string): Promise<EscrowData[]> {
    if (!this.subgraphUrl) {
      console.warn("Subgraph URL not configured");
      return [];
    }

    const query = gql`
      query GetEscrows($vaultId: String) {
        escrows(
          where: { vaultId: $vaultId }
          orderBy: createdAt
          orderDirection: desc
        ) {
          id
          escrowId
          vaultId
          requester
          recipient
          token
          amount
          target
          data
          reason
          status
          createdAt
          approvalCount
          releaseTime
          txHash
        }
      }
    `;

    try {
      const data = await request<{ escrows: EscrowData[] }>(
        this.subgraphUrl,
        query,
        { vaultId }
      );
      return data.escrows;
    } catch (error) {
      console.error("Failed to fetch escrows from subgraph:", error);
      return [];
    }
  }

  /**
   * Subgraphからエスクロー詳細を取得
   */
  async fetchEscrowByIdFromSubgraph(escrowId: string): Promise<EscrowData | null> {
    if (!this.subgraphUrl) {
      console.warn("Subgraph URL not configured");
      return null;
    }

    const query = gql`
      query GetEscrow($escrowId: String!) {
        escrow(id: $escrowId) {
          id
          escrowId
          vaultId
          requester
          recipient
          token
          amount
          target
          data
          reason
          status
          createdAt
          approvalCount
          releaseTime
          txHash
        }
      }
    `;

    try {
      const data = await request<{ escrow: EscrowData | null }>(
        this.subgraphUrl,
        query,
        { escrowId }
      );
      return data.escrow;
    } catch (error) {
      console.error("Failed to fetch escrow from subgraph:", error);
      return null;
    }
  }

  /**
   * エスクロードラフトをNeonに保存
   */
  async createEscrowDraft(draft: Omit<NewEscrowDraft, "id" | "createdAt" | "updatedAt">) {
    const db = getDatabase();

    const newDraft: NewEscrowDraft = {
      ...draft,
      status: draft.status || "draft",
    };

    const result = await db.insert(escrowDrafts).values(newDraft).returning();

    // 監査ログ記録
    try {
      await AuditService.log({
        vaultId: draft.vaultId,
        actor: draft.requester,
        action: "escrow_draft_created",
        resource: "escrow_draft",
        resourceId: result[0].id,
        data: {
          recipient: draft.recipient,
          amount: draft.amount,
          token: draft.token,
        },
      });
    } catch (error) {
      console.error("Failed to log escrow draft creation:", error);
    }

    return result[0];
  }

  /**
   * エスクロードラフトを更新（オンチェーン送信後）
   */
  async updateEscrowDraft(
    id: string,
    updates: {
      escrowId?: string;
      status?: string;
      txHash?: string;
    }
  ) {
    const db = getDatabase();

    const result = await db
      .update(escrowDrafts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(escrowDrafts.id, id))
      .returning();

    // 監査ログ記録（オンチェーン送信時）
    if (result[0] && updates.txHash) {
      try {
        await AuditService.logEscrowAction({
          vaultId: result[0].vaultId,
          actor: result[0].requester,
          action: "create",
          escrowId: updates.escrowId || id,
          txHash: updates.txHash,
          data: {
            recipient: result[0].recipient,
            amount: result[0].amount,
            token: result[0].token,
          },
        });
      } catch (error) {
        console.error("Failed to log escrow creation:", error);
      }
    }

    return result[0];
  }

  /**
   * エスクロードラフト一覧取得
   */
  async getEscrowDrafts(vaultId: string, status?: string) {
    const db = getDatabase();

    const conditions = [eq(escrowDrafts.vaultId, vaultId)];
    if (status) {
      conditions.push(eq(escrowDrafts.status, status));
    }

    const result = await db
      .select()
      .from(escrowDrafts)
      .where(and(...conditions))
      .orderBy(desc(escrowDrafts.createdAt));

    return result;
  }

  /**
   * Subgraphからタイムラインイベントを取得
   */
  async fetchTimelineFromSubgraph(escrowId: string): Promise<TimelineEvent[]> {
    if (!this.subgraphUrl) {
      console.warn("Subgraph URL not configured");
      return [];
    }

    const query = gql`
      query GetTimeline($escrowId: String!) {
        events(
          where: { escrowId: $escrowId }
          orderBy: timestamp
          orderDirection: asc
        ) {
          id
          escrowId
          eventType
          actor
          txHash
          userOpHash
          timestamp
          data
        }
      }
    `;

    try {
      const data = await request<{ events: TimelineEvent[] }>(
        this.subgraphUrl,
        query,
        { escrowId }
      );
      return data.events;
    } catch (error) {
      console.error("Failed to fetch timeline from subgraph:", error);
      return [];
    }
  }

  /**
   * タイムラインイベントをNeonに保存
   */
  async createTimelineEvent(event: Omit<NewTimeline, "id" | "timestamp">) {
    const db = getDatabase();

    const newEvent: NewTimeline = {
      ...event,
      timestamp: new Date(),
    };

    const result = await db.insert(timelines).values(newEvent).returning();
    return result[0];
  }

  /**
   * タイムライン取得（Neonから）
   */
  async getTimeline(escrowId: string) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(timelines)
      .where(eq(timelines.escrowId, escrowId))
      .orderBy(timelines.timestamp);

    return result;
  }

  /**
   * Subgraphデータを同期（キャッシュ更新）
   */
  async syncEscrowFromSubgraph(escrowId: string) {
    // Subgraphからデータ取得
    const escrowData = await this.fetchEscrowByIdFromSubgraph(escrowId);
    if (!escrowData) {
      return null;
    }

    // Neonのドラフトを更新
    const db = getDatabase();

    // 既存ドラフトを検索
    const existing = await db
      .select()
      .from(escrowDrafts)
      .where(eq(escrowDrafts.escrowId, escrowId))
      .limit(1);

    if (existing.length > 0) {
      // 更新
      const result = await db
        .update(escrowDrafts)
        .set({
          status: escrowData.status,
          txHash: escrowData.txHash,
          updatedAt: new Date(),
        })
        .where(eq(escrowDrafts.escrowId, escrowId))
        .returning();

      return result[0];
    } else {
      // 新規作成（Subgraphから取得したデータをキャッシュ）
      const newDraft: NewEscrowDraft = {
        vaultId: escrowData.vaultId, // UUID形式に変換が必要な場合あり
        escrowId: escrowData.escrowId,
        requester: escrowData.requester,
        recipient: escrowData.recipient,
        token: escrowData.token,
        amount: escrowData.amount,
        target: escrowData.target,
        data: escrowData.data,
        reason: escrowData.reason,
        status: "on-chain",
        txHash: escrowData.txHash,
      };

      const result = await db.insert(escrowDrafts).values(newDraft).returning();
      return result[0];
    }
  }

  /**
   * エスクロー統計情報取得
   */
  async getEscrowStats(vaultId: string) {
    const db = getDatabase();

    const drafts = await db
      .select()
      .from(escrowDrafts)
      .where(eq(escrowDrafts.vaultId, vaultId));

    const stats = {
      total: drafts.length,
      draft: drafts.filter((d) => d.status === "draft").length,
      submitted: drafts.filter((d) => d.status === "submitted").length,
      onChain: drafts.filter((d) => d.status === "on-chain").length,
    };

    return stats;
  }
}

/**
 * シングルトンインスタンス
 */
let escrowServiceInstance: EscrowService | null = null;

/**
 * EscrowServiceインスタンス取得
 */
export function getEscrowService(): EscrowService {
  if (!escrowServiceInstance) {
    escrowServiceInstance = new EscrowService();
  }
  return escrowServiceInstance;
}
