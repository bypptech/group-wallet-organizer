/**
 * Vitest Setup File
 * テスト環境の初期化（実DB使用）
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as dotenv from 'dotenv';
import { initializeDatabaseFromEnv, getDatabase, closeDatabase } from '../src/db/client.js';
import { auditLogs, vaults, members, policies, invites, escrowDrafts, timelines, notifications } from '../src/db/schema.js';

// 既存の環境変数をクリア（テスト環境のみ使用）
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNeonUrl = process.env.NEON_DATABASE_URL;

// テスト用環境変数読み込み
const testEnvLoaded = dotenv.config({ path: '.env.test' });

// テスト用環境変数設定
process.env.NODE_ENV = 'test';

// データベース初期化
let isDbInitialized = false;
let testDatabaseUrl: string | undefined;

beforeAll(async () => {
  try {
    // .env.testが存在する場合のみテスト用URLを使用
    if (testEnvLoaded.parsed?.DATABASE_URL) {
      testDatabaseUrl = testEnvLoaded.parsed.DATABASE_URL;
      console.log('🧪 Initializing test database from .env.test...');
    } else {
      console.warn('⚠️  .env.test not found or DATABASE_URL not set.');
      console.warn('   Create .env.test with test database URL to run integration tests.');
      console.warn('   Skipping database tests...');
      return;
    }

    // テスト用DB初期化
    initializeDatabaseFromEnv({ DATABASE_URL: testDatabaseUrl });
    isDbInitialized = true;

    console.log('✅ Test database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
    console.error('   Skipping database tests...');
    isDbInitialized = false;
  }
});

beforeEach(async () => {
  if (!isDbInitialized) return;

  try {
    // 各テスト前にテーブルをクリア
    const db = getDatabase();

    await db.delete(auditLogs);
    await db.delete(notifications);
    await db.delete(timelines);
    await db.delete(escrowDrafts);
    await db.delete(invites);
    await db.delete(policies);
    await db.delete(members);
    await db.delete(vaults);

    // console.log('🧹 Test data cleared');
  } catch (error) {
    console.error('Failed to clear test data:', error);
    throw error;
  }
});

afterEach(async () => {
  // 必要に応じてクリーンアップ
});

afterAll(async () => {
  if (isDbInitialized) {
    console.log('🔒 Closing test database connection');
    await closeDatabase();
  }
  console.log('✅ Test cleanup complete');
});
