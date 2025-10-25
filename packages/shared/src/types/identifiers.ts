/**
 * Type Definitions for Family Wallet Identifiers
 *
 * This module provides type-safe identifier types following CAIP-10 standard
 * for multi-chain account identification and vault management.
 *
 * @see https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md
 */

// ============================================
// CAIP-10 Types
// ============================================

/**
 * CAIP-10 Account ID Format: chain_id:account_address
 * Example: eip155:8453:0x1234567890123456789012345678901234567890
 */
export type CAIP10Address = `eip155:${number}:0x${string}`;

/**
 * Ethereum address (20 bytes)
 */
export type Address = `0x${string}`;

/**
 * Bytes32 hex string (32 bytes)
 */
export type Bytes32 = `0x${string}`;

/**
 * UUID string (RFC 4122 format)
 */
export type UUID = string;

// ============================================
// Vault Identifier Types
// ============================================

/**
 * Complete Vault Identifier
 * Contains all necessary information to identify and interact with a vault
 */
export interface VaultIdentifier {
  /** Vault contract address (primary identifier) */
  address: Address;

  /** Chain ID where the vault is deployed */
  chainId: number;

  /** CAIP-10 formatted identifier for multi-chain compatibility */
  caip10: CAIP10Address;

  /** UUID associated with the vault (16 bytes, RFC 4122) */
  uuid: UUID;

  /** Salt used for CREATE2 deployment (optional) */
  salt?: Bytes32;

  /** Factory contract address that deployed this vault (optional) */
  factoryAddress?: Address;

  /** Human-readable vault name */
  name: string;

  /** Shortened address for display (e.g., "0x1234...7890") */
  shortAddress: string;
}

/**
 * User Identifier (EOA or smart account)
 */
export interface UserIdentifier {
  /** User's address */
  address: Address;

  /** Chain ID */
  chainId: number;

  /** CAIP-10 formatted identifier */
  caip10: CAIP10Address;

  /** User's role in the vault (if applicable) */
  role?: 'owner' | 'guardian' | 'requester' | 'viewer';

  /** Shortened address for display */
  shortAddress: string;
}

// ============================================
// Member Identifier Types
// ============================================

/**
 * Member Identifier
 * Identifies a vault member with multi-chain support
 */
export interface MemberIdentifier {
  /** Member ID (database UUID) */
  id: UUID;

  /** Associated vault ID (references vaults.id - database UUID) */
  vaultId: UUID;

  /** Member's Ethereum address */
  address: Address;

  /** Chain ID where the member is registered */
  chainId: number;

  /** CAIP-10 formatted identifier for the member */
  caip10: CAIP10Address;

  /** CAIP-10 formatted identifier for the vault */
  vaultCaip10: CAIP10Address;

  /** Member role in the vault */
  role: 'owner' | 'guardian' | 'requester' | 'viewer' | 'approver';

  /** Approval weight (for multi-sig voting) */
  weight?: number;

  /** Display name or label */
  displayName?: string;

  /** Shortened member address for display */
  shortAddress: string;

  /** Shortened vault address for display */
  shortVaultAddress: string;

  /** When the member joined */
  joinedAt?: string;

  /** Address of who added this member */
  addedBy?: Address;
}

// ============================================
// Transaction Identifier Types
// ============================================

/**
 * Transaction Identifier
 */
export interface TransactionIdentifier {
  /** Transaction hash */
  txHash: Bytes32;

  /** Chain ID where the transaction occurred */
  chainId: number;

  /** Block number */
  blockNumber: number;

  /** UserOperation hash (for AA transactions, optional) */
  userOpHash?: Bytes32;

  /** From address */
  from: Address;

  /** To address */
  to: Address;

  /** Transaction status */
  status: 'pending' | 'success' | 'failed';
}

/**
 * Escrow Identifier
 * Identifies an escrow with multi-chain support
 */
export interface EscrowIdentifier {
  /** Escrow ID (database UUID) */
  id: UUID;

  /** Associated vault address */
  vaultAddress: Address;

  /** Chain ID */
  chainId: number;

  /** CAIP-10 formatted identifier for the vault */
  vaultCaip10: CAIP10Address;

  /** On-chain escrow ID (bytes32, optional - null for drafts) */
  escrowId?: Bytes32;

  /** Escrow status */
  status: 'draft' | 'pending' | 'approved' | 'ready' | 'released' | 'cancelled' | 'expired';

  /** Requester address */
  requester: Address;

  /** Recipient address */
  recipient: Address;

  /** Token address being escrowed */
  token: Address;

  /** Amount being escrowed */
  amount: string;

  /** Shortened vault address for display */
  shortVaultAddress: string;

  /** Reason or description */
  reason?: string;
}

// ============================================
// Policy Identifier Types
// ============================================

/**
 * Policy Identifier
 * Identifies a policy with multi-chain support
 */
export interface PolicyIdentifier {
  /** Policy ID (database UUID) */
  id: UUID;

  /** Associated vault address */
  vaultAddress: Address;

  /** Chain ID */
  chainId: number;

  /** CAIP-10 formatted identifier for the vault */
  vaultCaip10: CAIP10Address;

  /** On-chain policy ID (bytes32) */
  policyId: Bytes32;

  /** Policy status */
  active: boolean;

  /** Approval threshold */
  threshold: number;

  /** Timelock in seconds */
  timelock: number;

  /** Shortened vault address for display */
  shortVaultAddress: string;

  /** Shortened policy ID for display */
  shortPolicyId: string;
}

// ============================================
// Session Identifier Types
// ============================================

/**
 * Session Identifier for authentication
 */
export interface SessionIdentifier {
  /** Session ID (database UUID) */
  id: UUID;

  /** User address associated with this session */
  userAddress: Address;

  /** Chain ID */
  chainId: number;

  /** Session token (JWT) */
  token: string;

  /** Expiration timestamp */
  expiresAt: Date;

  /** Creation timestamp */
  createdAt: Date;
}

// ============================================
// Helper Types
// ============================================

/**
 * Chain information
 */
export interface ChainInfo {
  /** Chain ID */
  chainId: number;

  /** Chain name */
  name: string;

  /** RPC URL */
  rpcUrl: string;

  /** Block explorer URL */
  blockExplorer: string;

  /** Native currency symbol */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Address Book Entry
 */
export interface AddressBookEntry {
  /** Address */
  address: Address;

  /** Label/nickname */
  label: string;

  /** Chain ID (optional - if omitted, valid for all chains) */
  chainId?: number;

  /** Tags for categorization */
  tags?: string[];

  /** Notes */
  notes?: string;
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if a string is a valid CAIP-10 address
 */
export function isCAIP10Address(value: string): value is CAIP10Address {
  return /^eip155:\d+:0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isAddress(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Check if a string is a valid bytes32
 */
export function isBytes32(value: string): value is Bytes32 {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Check if a string is a valid UUID
 */
export function isUUID(value: string): value is UUID {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
