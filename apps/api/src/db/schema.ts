/**
 * Drizzle ORM スキーマ定義
 * ファミリーウォレット API データベーススキーマ
 *
 * ## テーブル一覧
 * - vaults: Vault情報
 * - members: Vaultメンバー
 * - policies: ポリシー設定 (Payment/Collection)
 * - invites: 招待リンク
 * - escrows: エスクロー (Payment/Collection統合)
 * - escrow_approvals: エスクロー承認
 * - timelines: エスクロータイムライン
 * - notifications: 通知履歴
 * - audit_logs: 監査ログ
 * - paymaster_settings: Paymaster設定
 * - comments: コメント
 * - shareable_keys: 共有可能キー
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================
// Vaults Table
// ============================================

export const vaults = pgTable(
  "vaults",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Primary identifier - Ethereum address (20 bytes)
    address: varchar("address", { length: 42 }).notNull().unique(), // Ethereum address
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Multi-chain support
    chainId: integer("chain_id").notNull(), // Chain ID (e.g., 8453 for Base)
    caip10: varchar("caip10", { length: 100 }).notNull().unique(), // CAIP-10 format: eip155:8453:0x...
    // CREATE2 deployment info
    uuid: uuid("uuid").notNull().unique(), // UUID for deterministic deployment
    salt: varchar("salt", { length: 66 }), // CREATE2 salt (bytes32)
    factoryAddress: varchar("factory_address", { length: 42 }), // VaultFactory address
    // Policy reference
    policyId: varchar("policy_id", { length: 66 }), // bytes32 as hex
    // Demo mode
    isDemo: boolean("is_demo").notNull().default(false),
    demoReadOnly: boolean("demo_read_only").notNull().default(true),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    // Additional data
    metadata: jsonb("metadata"), // Additional vault metadata
  },
  (table) => ({
    addressIdx: uniqueIndex("vault_address_idx").on(table.address),
    caip10Idx: uniqueIndex("vault_caip10_idx").on(table.caip10),
    uuidIdx: uniqueIndex("vault_uuid_idx").on(table.uuid),
    chainIdIdx: index("vault_chain_id_idx").on(table.chainId),
  })
);

// ============================================
// Members Table
// ============================================

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),
    address: varchar("address", { length: 42 }).notNull(), // Ethereum address
    role: varchar("role", { length: 50 }).notNull(), // owner, guardian, requester, viewer, approver
    weight: integer("weight").default(1), // Approval weight
    addedAt: timestamp("added_at").notNull().defaultNow(),
    addedBy: varchar("added_by", { length: 42 }), // Ethereum address
    metadata: jsonb("metadata"), // Additional member metadata
  },
  (table) => ({
    vaultMemberIdx: uniqueIndex("vault_member_idx").on(table.vaultId, table.address),
    addressIdx: index("member_address_idx").on(table.address),
  })
);

// ============================================
// Policies Table
// ============================================

export const policies = pgTable(
  "policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: varchar("policy_id", { length: 66 }).notNull().unique(), // bytes32 as hex
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),
    
    // Policy Type & Identity
    type: varchar("type", { length: 50 }).notNull(), // 'payment' | 'collection'
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    
    // Payment Policy Settings
    threshold: integer("threshold"), // Required approvals (nullable for collection)
    timelock: integer("timelock"), // Timelock in seconds (nullable for collection)
    rolesRoot: varchar("roles_root", { length: 66 }), // Merkle root (nullable for collection)
    ownersRoot: varchar("owners_root", { length: 66 }), // Merkle root (nullable for collection)
    maxAmount: varchar("max_amount", { length: 78 }), // BigInt as string
    
    // Collection Policy Settings
    collectionConfig: jsonb("collection_config"), // Collection-specific rules
    
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    policyIdIdx: uniqueIndex("policy_id_idx").on(table.policyId),
    vaultIdIdx: index("policy_vault_idx").on(table.vaultId),
    typeIdx: index("policy_type_idx").on(table.type),
    vaultTypeIdx: index("policy_vault_type_idx").on(table.vaultId, table.type),
  })
);

// ============================================
// Invites Table
// ============================================

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(), // Unique invite token
    role: varchar("role", { length: 50 }).notNull(),
    weight: integer("weight").default(1),
    signature: text("signature").notNull(), // EIP-712 signature
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    usedBy: varchar("used_by", { length: 42 }), // Ethereum address
    createdBy: varchar("created_by", { length: 42 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    metadata: jsonb("metadata"),
    // Payment fields for Shareable Keys
    paymentRequired: boolean("payment_required").default(false),
    paymentAmount: varchar("payment_amount", { length: 78 }), // BigInt as string (USDC wei)
    paymentToken: varchar("payment_token", { length: 42 }), // ERC20 token address
    paymentRecipient: varchar("payment_recipient", { length: 42 }), // Payment destination address
    paymentTxHash: varchar("payment_tx_hash", { length: 66 }), // Transaction hash
    paymentCompletedAt: timestamp("payment_completed_at"), // Payment completion timestamp
  },
  (table) => ({
    tokenIdx: uniqueIndex("invite_token_idx").on(table.token),
    vaultIdIdx: index("invite_vault_idx").on(table.vaultId),
    expiresAtIdx: index("invite_expires_idx").on(table.expiresAt),
    paymentRequiredIdx: index("invite_payment_required_idx").on(table.paymentRequired),
    paymentCompletedIdx: index("invite_payment_completed_idx").on(table.paymentCompletedAt),
  })
);

// ============================================
// Escrows Table (Payment & Collection)
// ============================================

export const escrows = pgTable(
  "escrows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policies.id, { onDelete: "cascade" }),
    
    // Escrow Type & Identity
    type: varchar("type", { length: 50 }).notNull(), // 'payment' | 'collection'
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    
    // Transaction Details
    token: varchar("token", { length: 42 }).notNull(), // Token address
    totalAmount: varchar("total_amount", { length: 78 }).notNull(), // BigInt as string
    
    // Payment Escrow Fields (type='payment')
    requester: varchar("requester", { length: 42 }), // Payment requester
    recipient: varchar("recipient", { length: 42 }), // Payment recipient
    target: varchar("target", { length: 42 }), // Call target
    data: text("data"), // Call data
    reason: text("reason"), // Payment reason
    
    // Collection Escrow Fields (type='collection')
    collectedAmount: varchar("collected_amount", { length: 78 }), // Collected amount
    participants: jsonb("participants"), // Participant list with payment status
    
    // Status & Timeline
    status: varchar("status", { length: 50 }).default("draft"),
    // draft → submitted → approved → on-chain → completed/cancelled
    
    deadline: timestamp("deadline"),
    scheduledReleaseAt: timestamp("scheduled_release_at"),
    expiresAt: timestamp("expires_at"),
    
    // On-chain Data
    escrowId: varchar("escrow_id", { length: 66 }).unique(), // bytes32 as hex (legacy)
    txHash: varchar("tx_hash", { length: 66 }), // Transaction hash (legacy)

    // Policy as Oracle Pattern - On-chain Integration
    onChainId: varchar("on_chain_id", { length: 78 }), // EscrowExecutor on-chain ID
    onChainTxHash: varchar("on_chain_tx_hash", { length: 66 }), // On-chain registration tx hash
    executedAt: timestamp("executed_at"), // Execution timestamp
    cancelledAt: timestamp("cancelled_at"), // Cancellation timestamp

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    escrowIdIdx: index("escrow_escrow_id_idx").on(table.escrowId),
    vaultIdIdx: index("escrow_vault_idx").on(table.vaultId),
    policyIdIdx: index("escrow_policy_idx").on(table.policyId),
    statusIdx: index("escrow_status_idx").on(table.status),
    typeIdx: index("escrow_type_idx").on(table.type),
    vaultTypeIdx: index("escrow_vault_type_idx").on(table.vaultId, table.type),
  })
);

// ============================================
// Escrow Approvals Table
// ============================================

export const escrowApprovals = pgTable(
  "escrow_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escrowId: uuid("escrow_id")
      .notNull()
      .references(() => escrows.id, { onDelete: "cascade" }),
    guardianId: uuid("guardian_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    guardianAddress: varchar("guardian_address", { length: 42 }).notNull(),
    approvedAt: timestamp("approved_at").notNull().defaultNow(),
    signature: text("signature"), // Optional signature
    merkleProof: jsonb("merkle_proof"), // Merkle proof for role verification
    metadata: jsonb("metadata"),
  },
  (table) => ({
    escrowIdIdx: index("approval_escrow_idx").on(table.escrowId),
    guardianIdx: index("approval_guardian_idx").on(table.guardianId),
    // Unique constraint: one approval per guardian per escrow
    uniqueApprovalIdx: uniqueIndex("unique_approval_idx").on(
      table.escrowId,
      table.guardianId
    ),
  })
);

// ============================================
// Timelines Table
// ============================================

export const timelines = pgTable(
  "timelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escrowId: varchar("escrow_id", { length: 66 }).notNull(), // bytes32 as hex
    eventType: varchar("event_type", { length: 50 }).notNull(), // created, approved, released, etc.
    actor: varchar("actor", { length: 42 }).notNull(), // Ethereum address
    txHash: varchar("tx_hash", { length: 66 }), // Transaction hash
    userOpHash: varchar("user_op_hash", { length: 66 }), // UserOperation hash
    data: jsonb("data"), // Additional event data
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    escrowIdIdx: index("timeline_escrow_idx").on(table.escrowId),
    timestampIdx: index("timeline_timestamp_idx").on(table.timestamp),
    eventTypeIdx: index("timeline_event_type_idx").on(table.eventType),
  })
);

// ============================================
// Notifications Table
// ============================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 42 }).notNull(), // Ethereum address
    vaultId: uuid("vault_id").references(() => vaults.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // escrow_created, approval_needed, etc.
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false),
    data: jsonb("data"), // Additional notification data
    createdAt: timestamp("created_at").notNull().defaultNow(),
    readAt: timestamp("read_at"),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    userIdIdx: index("notification_user_idx").on(table.userId),
    readIdx: index("notification_read_idx").on(table.read),
    createdAtIdx: index("notification_created_idx").on(table.createdAt),
  })
);

// ============================================
// Sessions Table
// ============================================

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAddress: varchar("user_address", { length: 42 }).notNull(), // Ethereum address
    chainId: integer("chain_id").notNull(), // Chain ID
    token: varchar("token", { length: 255 }).notNull().unique(), // JWT token
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
    ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"), // Additional session data
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    userAddressIdx: index("session_user_address_idx").on(table.userAddress),
    expiresAtIdx: index("session_expires_idx").on(table.expiresAt),
    chainIdIdx: index("session_chain_id_idx").on(table.chainId),
  })
);

// ============================================
// Audit Logs Table
// ============================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: uuid("vault_id").references(() => vaults.id, { onDelete: "cascade" }),
    actor: varchar("actor", { length: 42 }).notNull(), // Ethereum address
    action: varchar("action", { length: 100 }).notNull(), // Action type
    resource: varchar("resource", { length: 100 }).notNull(), // Resource type (escrow, policy, etc.)
    resourceId: varchar("resource_id", { length: 66 }), // Resource ID
    txHash: varchar("tx_hash", { length: 66 }), // Transaction hash
    userOpHash: varchar("user_op_hash", { length: 66 }), // UserOperation hash
    data: jsonb("data"), // Additional audit data
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    actorIdx: index("audit_actor_idx").on(table.actor),
    actionIdx: index("audit_action_idx").on(table.action),
    timestampIdx: index("audit_timestamp_idx").on(table.timestamp),
  })
);

// ============================================
// Paymaster Settings Table
// ============================================

export const paymasterSettings = pgTable(
  "paymaster_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: uuid("vault_id")
      .notNull()
      .unique()
      .references(() => vaults.id, { onDelete: "cascade" }),

    // Paymaster Configuration
    enabled: boolean("enabled").default(false).notNull(),
    token: varchar("token", { length: 10 }).default("USDC").notNull(), // USDC, ETH, JPYC

    // Balance & Limits
    balance: varchar("balance", { length: 78 }).default("0").notNull(), // BigInt as string
    dailyUsage: varchar("daily_usage", { length: 78 }).default("0").notNull(), // BigInt as string
    monthlyLimit: varchar("monthly_limit", { length: 78 }).default("0").notNull(), // BigInt as string
    dailyLimit: varchar("daily_limit", { length: 78 }).default("0").notNull(), // BigInt as string

    // Auto-refill Settings
    autoRefillEnabled: boolean("auto_refill_enabled").default(false).notNull(),
    refillThreshold: varchar("refill_threshold", { length: 78 }).default("0").notNull(), // BigInt as string
    refillAmount: varchar("refill_amount", { length: 78 }).default("0").notNull(), // BigInt as string

    // Fallback Settings
    fallbackEnabled: boolean("fallback_enabled").default(true).notNull(),

    // Status
    healthStatus: varchar("health_status", { length: 20 }).default("healthy").notNull(), // healthy, warning, critical
    lastTopUpAt: timestamp("last_top_up_at"),
    lastResetAt: timestamp("last_reset_at").notNull().defaultNow(), // For daily/monthly reset

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Additional metadata
    metadata: jsonb("metadata"),
  },
  (table) => ({
    vaultIdIdx: uniqueIndex("paymaster_vault_idx").on(table.vaultId),
    enabledIdx: index("paymaster_enabled_idx").on(table.enabled),
    healthStatusIdx: index("paymaster_health_idx").on(table.healthStatus),
  })
);

// ============================================
// Comments Table
// ============================================

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escrowId: uuid("escrow_id")
      .notNull()
      .references(() => escrows.id, { onDelete: "cascade" }),
    author: varchar("author", { length: 42 }).notNull(), // Ethereum address
    authorName: varchar("author_name", { length: 255 }), // Optional display name
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadata: jsonb("metadata"), // Additional comment metadata (e.g., mentions, attachments)
  },
  (table) => ({
    escrowIdIdx: index("comment_escrow_idx").on(table.escrowId),
    authorIdx: index("comment_author_idx").on(table.author),
    createdAtIdx: index("comment_created_idx").on(table.createdAt),
  })
);

// ============================================
// Relations
// ============================================
// Note: Relations are defined but not exported to avoid compatibility issues
// They can be used in queries but are not part of the schema generation

// ============================================
// Type Exports
// ============================================

export type Vault = typeof vaults.$inferSelect;
export type NewVault = typeof vaults.$inferInsert;

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;

export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;

export type Escrow = typeof escrows.$inferSelect;
export type NewEscrow = typeof escrows.$inferInsert;

export type Timeline = typeof timelines.$inferSelect;
export type NewTimeline = typeof timelines.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type EscrowApproval = typeof escrowApprovals.$inferSelect;
export type NewEscrowApproval = typeof escrowApprovals.$inferInsert;

export type PaymasterSettings = typeof paymasterSettings.$inferSelect;
export type NewPaymasterSettings = typeof paymasterSettings.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

// ============================================
// Shareable Keys Table
// ============================================

export const shareableKeys = pgTable(
  "shareable_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vaultId: uuid("vault_id").references(() => vaults.id, { onDelete: "cascade" }),

    // Key Identity
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    keyType: varchar("key_type", { length: 50 }).notNull(), // 'vault' | 'escrow' | 'custom'

    // Permissions
    permissions: jsonb("permissions").notNull(), // Array of permission strings

    // Access Control
    shareUrl: text("share_url").notNull().unique(),
    token: varchar("token", { length: 255 }).notNull().unique(),

    // Limits & Expiration
    maxUses: integer("max_uses"), // null = unlimited
    usageCount: integer("usage_count").default(0).notNull(),
    expiresAt: timestamp("expires_at"),

    // Status
    status: varchar("status", { length: 50 }).default("active").notNull(), // 'active' | 'expired' | 'revoked'
    revokedAt: timestamp("revoked_at"),
    revokedBy: varchar("revoked_by", { length: 42 }), // Ethereum address

    // Creator
    createdBy: varchar("created_by", { length: 42 }).notNull(), // Ethereum address
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Additional metadata
    metadata: jsonb("metadata"),
  },
  (table) => ({
    tokenIdx: uniqueIndex("shareable_key_token_idx").on(table.token),
    shareUrlIdx: uniqueIndex("shareable_key_url_idx").on(table.shareUrl),
    vaultIdIdx: index("shareable_key_vault_idx").on(table.vaultId),
    createdByIdx: index("shareable_key_creator_idx").on(table.createdBy),
    statusIdx: index("shareable_key_status_idx").on(table.status),
  })
);

// ============================================
// Shareable Key Usage Table
// ============================================

export const shareableKeyUsage = pgTable(
  "shareable_key_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    keyId: uuid("key_id")
      .notNull()
      .references(() => shareableKeys.id, { onDelete: "cascade" }),

    // Usage Details
    userAddress: varchar("user_address", { length: 42 }).notNull(), // Ethereum address
    action: varchar("action", { length: 100 }).notNull(), // Action performed
    ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
    userAgent: text("user_agent"),

    // Timestamp
    usedAt: timestamp("used_at").notNull().defaultNow(),

    // Additional metadata
    metadata: jsonb("metadata"),
  },
  (table) => ({
    keyIdIdx: index("key_usage_key_idx").on(table.keyId),
    userAddressIdx: index("key_usage_user_idx").on(table.userAddress),
    usedAtIdx: index("key_usage_timestamp_idx").on(table.usedAt),
  })
);

export type ShareableKey = typeof shareableKeys.$inferSelect;
export type NewShareableKey = typeof shareableKeys.$inferInsert;

export type ShareableKeyUsage = typeof shareableKeyUsage.$inferSelect;
export type NewShareableKeyUsage = typeof shareableKeyUsage.$inferInsert;

// ============================================
// Authorized Users Table (Shareable Key Access Control)
// ============================================

export const authorizedUsers = pgTable(
  "authorized_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    keyId: uuid("key_id")
      .notNull()
      .references(() => shareableKeys.id, { onDelete: "cascade" }),
    userAddress: varchar("user_address", { length: 42 }).notNull(), // Ethereum address
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vaults.id, { onDelete: "cascade" }),

    // Authorization Details
    authorizedBy: varchar("authorized_by", { length: 42 }).notNull(), // Key creator or 'system'
    authorizedAt: timestamp("authorized_at").notNull().defaultNow(),

    // Status
    status: varchar("status", { length: 50 }).default("active").notNull(), // 'active' | 'revoked'
    revokedAt: timestamp("revoked_at"),
    revokedBy: varchar("revoked_by", { length: 42 }), // Who revoked the access

    // Metadata
    metadata: jsonb("metadata"),
  },
  (table) => ({
    keyIdIdx: index("authorized_users_key_idx").on(table.keyId),
    userAddressIdx: index("authorized_users_address_idx").on(table.userAddress),
    vaultIdIdx: index("authorized_users_vault_idx").on(table.vaultId),
    uniqueUserKey: uniqueIndex("authorized_users_unique_idx").on(table.keyId, table.userAddress),
  })
);

export type AuthorizedUser = typeof authorizedUsers.$inferSelect;
export type NewAuthorizedUser = typeof authorizedUsers.$inferInsert;
