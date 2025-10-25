/**
 * モックデータ定義
 * データベース接続が利用できない環境用
 */

import type { Vault, Member, Notification, AuditLog } from '../db/schema.js';

// モックVault
export const mockVaults: Vault[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    vaultId: '0x1234567890123456789012345678901234567890123456789012345678901234',
    name: 'Smith Family Vault',
    description: 'Family treasury for household expenses',
    vaultAddress: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    policyId: '0xabcd1234567890123456789012345678901234567890123456789012345678ab',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-25'),
    metadata: {
      requiredWeight: 2,
      timelock: 86400,
      autoApprove: false,
      paymasterEnabled: true,
      webhooksEnabled: true,
      notificationsEnabled: true,
    },
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    vaultId: '0x2234567890123456789012345678901234567890123456789012345678901235',
    name: 'Business Vault',
    description: 'Company operational funds',
    vaultAddress: '0x8f9e2c1b5a6d3e4f7c8a9b0c1d2e3f4g5h6i7j8k',
    policyId: '0xbcde2345678901234567890123456789012345678901234567890123456789bc',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-12-20'),
    metadata: {
      requiredWeight: 3,
      timelock: 172800,
      autoApprove: false,
      paymasterEnabled: true,
      webhooksEnabled: false,
      notificationsEnabled: true,
    },
  },
];

// モックメンバー
export const mockMembers: Member[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    address: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    role: 'owner',
    weight: 2,
    addedAt: new Date('2024-01-15'),
    addedBy: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    metadata: { name: 'John Smith' },
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    address: '0x8f9e2c1b5a6d3e4f7c8a9b0c1d2e3f4g5h6i7j8k',
    role: 'guardian',
    weight: 1,
    addedAt: new Date('2024-01-20'),
    addedBy: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    metadata: { name: 'Mary Smith' },
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440004',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    role: 'requester',
    weight: 1,
    addedAt: new Date('2024-02-01'),
    addedBy: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    metadata: { name: 'Tom Smith' },
  },
];

// モック通知
export const mockNotifications: Notification[] = [
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440005',
    userId: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'escrow_created',
    title: 'New Escrow Created',
    message: 'Tom Smith created a new escrow for 0.5 ETH',
    read: false,
    data: { escrowId: 'ESC-2024-001', amount: '0.5 ETH' },
    createdAt: new Date('2024-12-25T10:30:00'),
    readAt: null,
    metadata: null,
  },
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440006',
    userId: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'escrow_approved',
    title: 'Escrow Approved',
    message: 'Mary Smith approved the escrow ESC-2024-001',
    read: true,
    data: { escrowId: 'ESC-2024-001', approver: 'Mary Smith' },
    createdAt: new Date('2024-12-25T12:00:00'),
    readAt: new Date('2024-12-25T12:05:00'),
    metadata: null,
  },
];

// モック監査ログ
export const mockAuditLogs: (Omit<AuditLog, 'id' | 'vaultId'> & { id: string; vaultId: string | null })[] = [
  {
    id: 'cc0e8400-e29b-41d4-a716-446655440007',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    actor: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    action: 'escrow.created',
    resource: 'escrow',
    resourceId: 'ESC-2024-001',
    txHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    userOpHash: null,
    data: {
      amount: '0.5 ETH',
      recipient: '0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g',
      reason: 'Holiday shopping',
    },
    timestamp: new Date('2024-12-25T10:30:00'),
    metadata: null,
  },
  {
    id: 'dd0e8400-e29b-41d4-a716-446655440008',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    actor: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    action: 'escrow.approved',
    resource: 'escrow',
    resourceId: 'ESC-2024-001',
    txHash: '0xdef456ghi789jkl012mno345pqr678stu901vwx234yz567ab',
    userOpHash: null,
    data: {
      escrowId: 'ESC-2024-001',
      comment: 'Approved for holiday expenses',
    },
    timestamp: new Date('2024-12-25T12:00:00'),
    metadata: null,
  },
  {
    id: 'ee0e8400-e29b-41d4-a716-446655440009',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    actor: '0x8f9e2c1b5a6d3e4f7c8a9b0c1d2e3f4g5h6i7j8k',
    action: 'escrow.approved',
    resource: 'escrow',
    resourceId: 'ESC-2024-001',
    txHash: '0xghi789jkl012mno345pqr678stu901vwx234yz567abc890de',
    userOpHash: null,
    data: {
      escrowId: 'ESC-2024-001',
      comment: 'Approved via mobile app',
    },
    timestamp: new Date('2024-12-25T14:30:00'),
    metadata: null,
  },
];

// モックポリシー
export interface MockPolicy {
  id: string;
  vaultId: string;
  name: string;
  threshold: string;
  timelock: string;
  rolesRoot: string;
  status: 'active' | 'draft' | 'archived';
  description: string;
  createdAt: string;
  lastUpdated: string;
  scheduledUpdate: string | null;
  usageCount: number;
  minApprovals: number;
  maxAmount: string;
  cooldownHours: number;
}

export const mockPolicies: MockPolicy[] = [
  {
    id: '0xabcd1234567890123456789012345678901234567890123456789012345678ab',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Standard Policy',
    threshold: '2/3',
    timelock: '24h',
    rolesRoot: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    status: 'active',
    description: 'Default policy for regular family expenses',
    createdAt: '2024-01-15',
    lastUpdated: '2024-12-01',
    scheduledUpdate: null,
    usageCount: 15,
    minApprovals: 2,
    maxAmount: '1000',
    cooldownHours: 24,
  },
  {
    id: '0xbcde2345678901234567890123456789012345678901234567890123456789bc',
    vaultId: '660e8400-e29b-41d4-a716-446655440001',
    name: 'High Value Policy',
    threshold: '3/3',
    timelock: '72h',
    rolesRoot: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    status: 'active',
    description: 'Enhanced security for large transactions',
    createdAt: '2024-01-15',
    lastUpdated: '2024-11-15',
    scheduledUpdate: '2024-12-30',
    usageCount: 5,
    minApprovals: 3,
    maxAmount: '5000',
    cooldownHours: 72,
  },
  {
    id: '0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    vaultId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Emergency Policy',
    threshold: '1/3',
    timelock: '1h',
    rolesRoot: '0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    status: 'draft',
    description: 'Fast approval for emergency situations',
    createdAt: '2024-12-20',
    lastUpdated: '2024-12-20',
    scheduledUpdate: null,
    usageCount: 0,
    minApprovals: 1,
    maxAmount: '500',
    cooldownHours: 1,
  },
];

// Paymasterモックデータ
export const mockPaymasterInfo = {
  balance: '2.45 ETH',
  dailyUsage: '0.12 ETH',
  monthlyLimit: '5.0 ETH',
  healthStatus: 'healthy' as const,
  lastTopUp: '2024-12-20T15:30:00',
  autoRefill: true,
  fallbackEnabled: true,
  refillThreshold: '1.0 ETH',
};

// 監査ログ統計
export const mockAuditStats = {
  totalEvents: 15,
  criticalEvents: 2,
  warningEvents: 3,
  infoEvents: 10,
  eventsByType: {
    'escrow_created': 5,
    'escrow_approved': 8,
    'escrow_released': 2,
    'member_added': 1,
    'settings_updated': 1,
  },
  eventsByActor: {
    '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C': 6,
    '0x8f9e2c1b5a6d3e4f7c8a9b0c1d2e3f4g5h6i7j8k': 5,
    '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t': 4,
  },
  recentActivity: [
    { date: '2024-12-25', count: 5 },
    { date: '2024-12-24', count: 3 },
    { date: '2024-12-23', count: 2 },
  ],
};
