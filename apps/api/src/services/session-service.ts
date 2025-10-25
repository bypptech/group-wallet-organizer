/**
 * Session Service
 *
 * ユーザー認証セッション管理のためのサービスクラス
 * - JWT トークン生成・検証
 * - セッション作成・取得・削除
 * - セッション有効期限管理
 */

import {
  getDatabase,
  sessions,
  type NewSession,
  type Session,
} from "../db/client.js";
import { eq, and, lt } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import type { Address } from "@/packages/shared";

/**
 * セッション作成パラメータ
 */
export interface CreateSessionParams {
  userAddress: Address;
  chainId: number;
  ipAddress?: string;
  userAgent?: string;
  expiresIn?: number; // セッション有効期間（秒）デフォルト: 24時間
}

/**
 * JWT ペイロード
 */
export interface JWTPayload {
  userAddress: Address;
  chainId: number;
  sessionId: string;
  iat: number; // Issued at
  exp: number; // Expiration time
}

/**
 * SessionService クラス
 */
export class SessionService {
  private readonly JWT_SECRET: string;
  private readonly DEFAULT_EXPIRES_IN = 24 * 60 * 60; // 24時間（秒）

  constructor(jwtSecret?: string) {
    this.JWT_SECRET = jwtSecret || process.env.JWT_SECRET || "default-secret-change-in-production";

    if (this.JWT_SECRET === "default-secret-change-in-production") {
      console.warn("⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!");
    }
  }

  /**
   * セッションを作成
   */
  async createSession(params: CreateSessionParams): Promise<{
    session: Session;
    token: string;
  }> {
    const db = await getDatabase();

    const expiresIn = params.expiresIn || this.DEFAULT_EXPIRES_IN;
    const now = Date.now();
    const expiresAt = new Date(now + expiresIn * 1000);

    // JWT ペイロード作成
    const payload: JWTPayload = {
      userAddress: params.userAddress,
      chainId: params.chainId,
      sessionId: crypto.randomUUID(), // 仮のセッションID（後で更新）
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // JWT トークン生成
    const token = await sign(payload, this.JWT_SECRET);

    // セッションをDBに保存
    const newSession: NewSession = {
      userAddress: params.userAddress,
      chainId: params.chainId,
      token,
      expiresAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    };

    const [session] = await db.insert(sessions).values(newSession).returning();

    return {
      session,
      token,
    };
  }

  /**
   * トークンを検証してセッションを取得
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    session?: Session;
    payload?: JWTPayload;
    error?: string;
  }> {
    try {
      // JWT トークン検証
      const payload = await verify(token, this.JWT_SECRET) as JWTPayload;

      // DBからセッションを取得
      const session = await this.getSessionByToken(token);

      if (!session) {
        return {
          valid: false,
          error: "Session not found",
        };
      }

      // セッション有効期限確認
      if (new Date() > session.expiresAt) {
        // 期限切れセッションを削除
        await this.deleteSession(session.id);
        return {
          valid: false,
          error: "Session expired",
        };
      }

      // 最終アクセス時刻を更新
      await this.updateLastAccessed(session.id);

      return {
        valid: true,
        session,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid token",
      };
    }
  }

  /**
   * トークンでセッションを取得
   */
  async getSessionByToken(token: string): Promise<Session | null> {
    const db = await getDatabase();

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    return session || null;
  }

  /**
   * ユーザーアドレスでセッションを取得
   */
  async getSessionsByUser(
    userAddress: Address,
    chainId?: number
  ): Promise<Session[]> {
    const db = await getDatabase();

    const conditions = chainId
      ? and(
          eq(sessions.userAddress, userAddress),
          eq(sessions.chainId, chainId)
        )
      : eq(sessions.userAddress, userAddress);

    const result = await db
      .select()
      .from(sessions)
      .where(conditions!);

    return result;
  }

  /**
   * セッションを削除
   */
  async deleteSession(sessionId: string): Promise<void> {
    const db = await getDatabase();

    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  /**
   * ユーザーの全セッションを削除（ログアウト）
   */
  async deleteAllUserSessions(
    userAddress: Address,
    chainId?: number
  ): Promise<number> {
    const db = await getDatabase();

    const conditions = chainId
      ? and(
          eq(sessions.userAddress, userAddress),
          eq(sessions.chainId, chainId)
        )
      : eq(sessions.userAddress, userAddress);

    const result = await db.delete(sessions).where(conditions!);

    return result.rowCount || 0;
  }

  /**
   * 期限切れセッションをクリーンアップ
   */
  async cleanupExpiredSessions(): Promise<number> {
    const db = await getDatabase();

    const result = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));

    return result.rowCount || 0;
  }

  /**
   * 最終アクセス時刻を更新
   */
  private async updateLastAccessed(sessionId: string): Promise<void> {
    const db = await getDatabase();

    await db
      .update(sessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  /**
   * セッションを更新（有効期限延長など）
   */
  async refreshSession(sessionId: string, expiresIn?: number): Promise<Session> {
    const db = await getDatabase();

    const extension = expiresIn || this.DEFAULT_EXPIRES_IN;
    const newExpiresAt = new Date(Date.now() + extension * 1000);

    const [updatedSession] = await db
      .update(sessions)
      .set({
        expiresAt: newExpiresAt,
        lastAccessedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    return updatedSession;
  }

  /**
   * アクティブセッション数を取得
   */
  async getActiveSessionCount(userAddress: Address): Promise<number> {
    const db = await getDatabase();

    const result = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userAddress, userAddress),
          lt(new Date(), sessions.expiresAt)
        )
      );

    return result.length;
  }

  /**
   * セッションの詳細情報を取得
   */
  async getSessionDetails(sessionId: string): Promise<{
    session: Session;
    isExpired: boolean;
    remainingTime: number; // 秒
  } | null> {
    const db = await getDatabase();

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session) {
      return null;
    }

    const now = new Date();
    const isExpired = now > session.expiresAt;
    const remainingTime = Math.max(
      0,
      Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000)
    );

    return {
      session,
      isExpired,
      remainingTime,
    };
  }

  /**
   * チェーン切り替え時のセッション移行
   */
  async migrateSessionToChain(
    currentSessionId: string,
    newChainId: number
  ): Promise<{
    session: Session;
    token: string;
  }> {
    const db = await getDatabase();

    // 現在のセッションを取得
    const [currentSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, currentSessionId))
      .limit(1);

    if (!currentSession) {
      throw new Error("Session not found");
    }

    // 新しいチェーンでセッションを作成
    const newSession = await this.createSession({
      userAddress: currentSession.userAddress as Address,
      chainId: newChainId,
      ipAddress: currentSession.ipAddress || undefined,
      userAgent: currentSession.userAgent || undefined,
    });

    // 古いセッションを削除
    await this.deleteSession(currentSessionId);

    return newSession;
  }
}
