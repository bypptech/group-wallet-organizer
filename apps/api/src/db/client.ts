/**
 * Neon PostgreSQL データベースクライアント
 *
 * Drizzle ORMとNeon Serverlessを使用したデータベース接続
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema.js";

/**
 * データベース接続設定
 */
export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeout?: number;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG = {
  maxConnections: 10,
  idleTimeout: 30000, // 30 seconds
};

/**
 * Drizzle DBインスタンス
 */
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * データベース接続を初期化
 *
 * @param config - データベース設定
 * @returns Drizzle DBインスタンス
 */
export function initializeDatabase(config: DatabaseConfig) {
  if (db) {
    return db;
  }

  const { connectionString } = config;

  // Neon HTTPクライアント作成
  const sql = neon(connectionString);

  // Drizzle ORM初期化
  db = drizzle(sql, { schema });

  return db;
}

/**
 * データベースインスタンスを取得
 *
 * @returns Drizzle DBインスタンス
 * @throws データベースが初期化されていない場合
 */
export function getDatabase() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

/**
 * データベース接続をクローズ
 */
export async function closeDatabase() {
  // HTTP接続なのでクリーンアップ不要
  db = null;
}

/**
 * ヘルスチェック
 *
 * @returns データベース接続が正常かどうか
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!db) return false;

    // Simple query to check connection
    const sql = neon(process.env.DATABASE_URL || "");
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * 環境変数からデータベースを初期化
 *
 * @param env - 環境変数オブジェクト
 * @returns Drizzle DBインスタンス
 */
export function initializeDatabaseFromEnv(env: Record<string, string | undefined>) {
  const connectionString = env.DATABASE_URL || env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or NEON_DATABASE_URL environment variable is required"
    );
  }

  return initializeDatabase({
    connectionString,
    maxConnections: env.DATABASE_MAX_CONNECTIONS
      ? parseInt(env.DATABASE_MAX_CONNECTIONS, 10)
      : undefined,
    idleTimeout: env.DATABASE_IDLE_TIMEOUT
      ? parseInt(env.DATABASE_IDLE_TIMEOUT, 10)
      : undefined,
  });
}

// Export schema types for convenience
export * from "./schema.js";
