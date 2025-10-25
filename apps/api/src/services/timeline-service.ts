/**
 * Timeline Service
 *
 * エスクロー承認ステップの追跡とタイムライン管理
 */

import { getDatabase, timelines, type NewTimeline } from "../db/client.js";
import { eq, and, desc } from "drizzle-orm";

/**
 * タイムラインイベントタイプ
 */
export enum TimelineEventType {
  ESCROW_CREATED = "escrow_created",
  ESCROW_APPROVED = "escrow_approved",
  ESCROW_RELEASED = "escrow_released",
  ESCROW_CANCELLED = "escrow_cancelled",
  APPROVAL_REVOKED = "approval_revoked",
  THRESHOLD_REACHED = "threshold_reached",
  TIMELOCK_STARTED = "timelock_started",
  READY_FOR_RELEASE = "ready_for_release",
}

/**
 * タイムラインイベントデータ
 */
export interface TimelineEventData {
  escrowId: string;
  eventType: TimelineEventType | string;
  actor: string;
  txHash?: string;
  userOpHash?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * 承認進捗情報
 */
export interface ApprovalProgress {
  escrowId: string;
  currentApprovals: number;
  requiredApprovals: number;
  progress: number; // パーセンテージ
  approvers: string[];
  pendingApprovers: string[];
  thresholdReached: boolean;
  timelockStarted: boolean;
  readyForRelease: boolean;
}

/**
 * TimelineService クラス
 */
export class TimelineService {
  /**
   * タイムラインイベント作成
   */
  async createEvent(eventData: TimelineEventData) {
    const db = getDatabase();

    const newEvent: NewTimeline = {
      escrowId: eventData.escrowId,
      eventType: eventData.eventType,
      actor: eventData.actor,
      txHash: eventData.txHash,
      userOpHash: eventData.userOpHash,
      data: eventData.data,
      metadata: eventData.metadata,
      timestamp: new Date(),
    };

    const result = await db.insert(timelines).values(newEvent).returning();
    return result[0];
  }

  /**
   * タイムライン取得
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
   * 最新イベント取得
   */
  async getLatestEvent(escrowId: string, eventType?: string) {
    const db = getDatabase();

    let query = db
      .select()
      .from(timelines)
      .where(eq(timelines.escrowId, escrowId));

    if (eventType) {
      query = query.where(
        and(eq(timelines.escrowId, escrowId), eq(timelines.eventType, eventType))
      ) as any;
    }

    const result = await query.orderBy(desc(timelines.timestamp)).limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * イベントタイプ別取得
   */
  async getEventsByType(escrowId: string, eventType: string) {
    const db = getDatabase();

    const result = await db
      .select()
      .from(timelines)
      .where(and(eq(timelines.escrowId, escrowId), eq(timelines.eventType, eventType)))
      .orderBy(timelines.timestamp);

    return result;
  }

  /**
   * 承認イベント記録
   */
  async recordApproval(
    escrowId: string,
    approver: string,
    txHash?: string,
    userOpHash?: string,
    approvalData?: Record<string, any>
  ) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.ESCROW_APPROVED,
      actor: approver,
      txHash,
      userOpHash,
      data: {
        approver,
        ...approvalData,
      },
    });
  }

  /**
   * リリースイベント記録
   */
  async recordRelease(
    escrowId: string,
    releaser: string,
    txHash?: string,
    userOpHash?: string,
    releaseData?: Record<string, any>
  ) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.ESCROW_RELEASED,
      actor: releaser,
      txHash,
      userOpHash,
      data: {
        releaser,
        ...releaseData,
      },
    });
  }

  /**
   * キャンセルイベント記録
   */
  async recordCancellation(
    escrowId: string,
    canceller: string,
    reason?: string,
    txHash?: string,
    userOpHash?: string
  ) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.ESCROW_CANCELLED,
      actor: canceller,
      txHash,
      userOpHash,
      data: {
        canceller,
        reason,
      },
    });
  }

  /**
   * 承認取消イベント記録
   */
  async recordApprovalRevocation(
    escrowId: string,
    revoker: string,
    txHash?: string,
    userOpHash?: string
  ) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.APPROVAL_REVOKED,
      actor: revoker,
      txHash,
      userOpHash,
      data: {
        revoker,
      },
    });
  }

  /**
   * 閾値到達イベント記録
   */
  async recordThresholdReached(escrowId: string, currentApprovals: number, threshold: number) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.THRESHOLD_REACHED,
      actor: "system",
      data: {
        currentApprovals,
        threshold,
      },
    });
  }

  /**
   * タイムロック開始イベント記録
   */
  async recordTimelockStarted(escrowId: string, releaseTime: number) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.TIMELOCK_STARTED,
      actor: "system",
      data: {
        releaseTime,
        releaseTimeFormatted: new Date(releaseTime * 1000).toISOString(),
      },
    });
  }

  /**
   * リリース準備完了イベント記録
   */
  async recordReadyForRelease(escrowId: string) {
    return this.createEvent({
      escrowId,
      eventType: TimelineEventType.READY_FOR_RELEASE,
      actor: "system",
      data: {
        readyAt: new Date().toISOString(),
      },
    });
  }

  /**
   * 承認進捗計算
   */
  async calculateApprovalProgress(
    escrowId: string,
    requiredApprovals: number,
    allApprovers: string[]
  ): Promise<ApprovalProgress> {
    const approvalEvents = await this.getEventsByType(
      escrowId,
      TimelineEventType.ESCROW_APPROVED
    );

    const revocationEvents = await this.getEventsByType(
      escrowId,
      TimelineEventType.APPROVAL_REVOKED
    );

    // 承認したアドレスのセット
    const approvedSet = new Set<string>();
    approvalEvents.forEach((event) => {
      approvedSet.add(event.actor.toLowerCase());
    });

    // 取り消されたアドレスを除外
    revocationEvents.forEach((event) => {
      approvedSet.delete(event.actor.toLowerCase());
    });

    const currentApprovals = approvedSet.size;
    const approvers = Array.from(approvedSet);
    const pendingApprovers = allApprovers.filter(
      (addr) => !approvedSet.has(addr.toLowerCase())
    );

    const thresholdReached = currentApprovals >= requiredApprovals;
    const progress = Math.min((currentApprovals / requiredApprovals) * 100, 100);

    // タイムロック開始チェック
    const timelockEvent = await this.getLatestEvent(
      escrowId,
      TimelineEventType.TIMELOCK_STARTED
    );
    const timelockStarted = timelockEvent !== null;

    // リリース準備完了チェック
    const readyEvent = await this.getLatestEvent(
      escrowId,
      TimelineEventType.READY_FOR_RELEASE
    );
    const readyForRelease = readyEvent !== null;

    return {
      escrowId,
      currentApprovals,
      requiredApprovals,
      progress,
      approvers,
      pendingApprovers,
      thresholdReached,
      timelockStarted,
      readyForRelease,
    };
  }

  /**
   * アクター別イベント統計
   */
  async getActorStats(actor: string) {
    const db = getDatabase();

    const events = await db
      .select()
      .from(timelines)
      .where(eq(timelines.actor, actor));

    const stats = {
      total: events.length,
      approvals: events.filter((e) => e.eventType === TimelineEventType.ESCROW_APPROVED).length,
      releases: events.filter((e) => e.eventType === TimelineEventType.ESCROW_RELEASED).length,
      cancellations: events.filter(
        (e) => e.eventType === TimelineEventType.ESCROW_CANCELLED
      ).length,
      revocations: events.filter(
        (e) => e.eventType === TimelineEventType.APPROVAL_REVOKED
      ).length,
    };

    return stats;
  }

  /**
   * タイムライン統計
   */
  async getTimelineStats(escrowId: string) {
    const events = await this.getTimeline(escrowId);

    const eventTypes = new Map<string, number>();
    events.forEach((event) => {
      const count = eventTypes.get(event.eventType) || 0;
      eventTypes.set(event.eventType, count + 1);
    });

    return {
      totalEvents: events.length,
      eventTypes: Object.fromEntries(eventTypes),
      firstEvent: events[0],
      lastEvent: events[events.length - 1],
      duration:
        events.length > 0
          ? events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()
          : 0,
    };
  }
}

/**
 * シングルトンインスタンス
 */
let timelineServiceInstance: TimelineService | null = null;

/**
 * TimelineServiceインスタンス取得
 */
export function getTimelineService(): TimelineService {
  if (!timelineServiceInstance) {
    timelineServiceInstance = new TimelineService();
  }
  return timelineServiceInstance;
}
