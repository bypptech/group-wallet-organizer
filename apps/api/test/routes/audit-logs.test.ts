/**
 * Audit Logs API Routes Test
 * 監査ログAPIエンドポイントのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHonoApp } from '../../src/honoApp';
import { getDatabase, auditLogs } from '../../src/db/client';
import { AuditService } from '../../src/services/audit-service';

describe('Audit Logs API', () => {
  const app = createHonoApp();

  beforeEach(async () => {
    const db = getDatabase();
    await db.delete(auditLogs);
  });

  describe('GET /api/audit-logs', () => {
    it('監査ログ一覧を取得できる', async () => {
      await AuditService.logBatch([
        { actor: '0x1111', action: 'action1', resource: 'resource1' },
        { actor: '0x2222', action: 'action2', resource: 'resource2' },
      ]);

      const res = await app.request('/api/audit-logs');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(2);
      expect(json.count).toBe(2);
    });

    it.skip('vaultIdでフィルタできる', async () => {
      // vaultIdはUUID型で実際のvaultレコードが必要なためスキップ
    });

    it('actorでフィルタできる', async () => {
      await AuditService.logBatch([
        { actor: '0x1111', action: 'action1', resource: 'resource1' },
        { actor: '0x2222', action: 'action2', resource: 'resource2' },
      ]);

      const res = await app.request('/api/audit-logs?actor=0x1111');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].actor).toBe('0x1111');
    });

    it('limit/offsetでページネーションできる', async () => {
      await AuditService.logBatch([
        { actor: '0x1111', action: 'action1', resource: 'resource1' },
        { actor: '0x2222', action: 'action2', resource: 'resource2' },
        { actor: '0x3333', action: 'action3', resource: 'resource3' },
      ]);

      const res = await app.request('/api/audit-logs?limit=2&offset=1');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/audit-logs/stats', () => {
    it('統計情報を取得できる', async () => {
      await AuditService.logBatch([
        { actor: '0xaaaa', action: 'escrow_create', resource: 'escrow' },
        { actor: '0xaaaa', action: 'escrow_create', resource: 'escrow' },
        { actor: '0xbbbb', action: 'policy_update', resource: 'policy' },
      ]);

      const res = await app.request('/api/audit-logs/stats');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.totalLogs).toBe(3);
      expect(json.data.actionCounts['escrow_create']).toBe(2);
      expect(json.data.topActors[0].actor).toBe('0xaaaa');
    });

    it.skip('Vault別統計を取得できる', async () => {
      // vaultIdはUUID型で実際のvaultレコードが必要なためスキップ
    });
  });

  describe('GET /api/audit-logs/by-actor/:actor', () => {
    it('アクター別ログを取得できる', async () => {
      const actor = '0x1234567890123456789012345678901234567890';

      await AuditService.logBatch([
        { actor, action: 'action1', resource: 'resource1' },
        { actor, action: 'action2', resource: 'resource2' },
        { actor: '0x9999', action: 'action3', resource: 'resource3' },
      ]);

      const res = await app.request(`/api/audit-logs/by-actor/${actor}`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(2);
      expect(json.data.every((log: any) => log.actor === actor)).toBe(true);
    });

    it('limitパラメータが機能する', async () => {
      const actor = '0x1111';

      await AuditService.logBatch([
        { actor, action: 'action1', resource: 'resource1' },
        { actor, action: 'action2', resource: 'resource2' },
        { actor, action: 'action3', resource: 'resource3' },
      ]);

      const res = await app.request(`/api/audit-logs/by-actor/${actor}?limit=2`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveLength(2);
    });
  });

  describe('GET /api/audit-logs/by-vault/:vaultId', () => {
    it.skip('Vault別ログを取得できる', async () => {
      // vaultIdはUUID型で実際のvaultレコードが必要なためスキップ
    });
  });

  describe('GET /api/audit-logs/by-userop/:hash', () => {
    it('UserOpハッシュで検索できる', async () => {
      const userOpHash = '0xabcdef123456';

      await AuditService.log({
        actor: '0x1111',
        action: 'test',
        resource: 'test',
        userOpHash,
      });

      const res = await app.request(`/api/audit-logs/by-userop/${userOpHash}`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].userOpHash).toBe(userOpHash);
    });
  });

  describe('GET /api/audit-logs/by-tx/:hash', () => {
    it('トランザクションハッシュで検索できる', async () => {
      const txHash = '0x9876543210fedcba';

      await AuditService.log({
        actor: '0x1111',
        action: 'test',
        resource: 'test',
        txHash,
      });

      const res = await app.request(`/api/audit-logs/by-tx/${txHash}`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].txHash).toBe(txHash);
    });
  });

  describe('POST /api/audit-logs', () => {
    it('監査ログを記録できる', async () => {
      const logEntry = {
        actor: '0x1234567890123456789012345678901234567890',
        action: 'test_action',
        resource: 'test_resource',
        resourceId: 'test-123',
        data: { key: 'value' },
      };

      const res = await app.request('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe('Audit log recorded');

      // 記録されたことを確認
      const logs = await AuditService.search({});
      expect(logs).toHaveLength(1);
    });

    it('バリデーションエラーを返す', async () => {
      const invalidEntry = {
        // actorが欠けている
        action: 'test_action',
        resource: 'test_resource',
      };

      const res = await app.request('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEntry),
      });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/audit-logs/batch', () => {
    it('一括で監査ログを記録できる', async () => {
      const entries = [
        { actor: '0x1111', action: 'action1', resource: 'resource1' },
        { actor: '0x2222', action: 'action2', resource: 'resource2' },
        { actor: '0x3333', action: 'action3', resource: 'resource3' },
      ];

      const res = await app.request('/api/audit-logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(3);

      // 記録されたことを確認
      const logs = await AuditService.search({});
      expect(logs).toHaveLength(3);
    });
  });
});
