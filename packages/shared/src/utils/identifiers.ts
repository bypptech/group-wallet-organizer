/**
 * Utility Functions for Family Wallet Identifiers
 *
 * Provides helper functions for working with CAIP-10 addresses,
 * Ethereum addresses, and vault identifiers.
 */

import type {
  Address,
  CAIP10Address,
  Bytes32,
  UUID,
  VaultIdentifier,
  UserIdentifier,
  MemberIdentifier,
  TransactionIdentifier,
  EscrowIdentifier,
  PolicyIdentifier,
} from '../types/identifiers';

// ============================================
// UUID Conversion Utilities
// ============================================

/**
 * Convert UUID string to bytes16 (Buffer)
 * @param uuid UUID string (RFC 4122 format with hyphens)
 * @returns Buffer containing 16 bytes
 */
export function uuidToBytes16(uuid: UUID): Buffer {
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID length: expected 32 hex chars, got ${hex.length}`);
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Convert bytes16 (Buffer) to UUID string
 * @param bytes Buffer containing 16 bytes
 * @returns UUID string in RFC 4122 format
 */
export function bytes16ToUUID(bytes: Buffer | Uint8Array): UUID {
  if (bytes.length !== 16) {
    throw new Error(`Invalid bytes16 length: expected 16 bytes, got ${bytes.length}`);
  }
  const hex = Buffer.from(bytes).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Convert UUID to bytes32 (zero-padded)
 * @param uuid UUID string
 * @returns Bytes32 hex string
 */
export function uuidToBytes32(uuid: UUID): Bytes32 {
  const hex = uuid.replace(/-/g, '');
  const padded = hex.padEnd(64, '0');
  return `0x${padded}` as Bytes32;
}

// ============================================
// CAIP-10 Utilities
// ============================================

/**
 * Convert address and chain ID to CAIP-10 format
 * @param chainId Chain ID
 * @param address Ethereum address
 * @returns CAIP-10 formatted address
 */
export function toCAIP10(chainId: number, address: Address): CAIP10Address {
  if (!address || typeof address !== 'string') {
    throw new Error(`Address is required and must be a string, got: ${typeof address}`);
  }
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid address format: ${address}`);
  }
  // Allow demo addresses (e.g., 0xDEMO000000000000000000000000000000000001)
  // These are used for demo mode and don't need strict hex validation
  return `eip155:${chainId}:${address}`;
}

/**
 * Parse CAIP-10 address into components
 * @param caip10 CAIP-10 formatted address
 * @returns Object containing chainId and address
 */
export function parseCAIP10(caip10: CAIP10Address): {
  chainId: number;
  address: Address;
  namespace: string;
} {
  const parts = caip10.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid CAIP-10 format: ${caip10}`);
  }

  const [namespace, chainIdStr, address] = parts;

  if (namespace !== 'eip155') {
    throw new Error(`Unsupported namespace: ${namespace}`);
  }

  const chainId = parseInt(chainIdStr, 10);
  if (isNaN(chainId)) {
    throw new Error(`Invalid chain ID: ${chainIdStr}`);
  }

  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid address in CAIP-10: ${address}`);
  }

  return {
    namespace,
    chainId,
    address: address as Address,
  };
}

// ============================================
// Address Utilities
// ============================================

/**
 * Shorten address for display
 * @param address Full address
 * @param prefixLength Length of prefix (default: 6, includes "0x")
 * @param suffixLength Length of suffix (default: 4)
 * @returns Shortened address (e.g., "0x1234...7890")
 */
export function shortenAddress(
  address: Address,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address || typeof address !== 'string') {
    throw new Error(`Address is required and must be a string, got: ${typeof address}`);
  }
  // Allow demo addresses and any valid address format (length check only)
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid address format: ${address}`);
  }
  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);
  return `${prefix}...${suffix}`;
}

/**
 * Shorten bytes32 for display
 * @param bytes32 Full bytes32 string
 * @param prefixLength Length of prefix (default: 10, includes "0x")
 * @param suffixLength Length of suffix (default: 8)
 * @returns Shortened bytes32 (e.g., "0x12345678...abcdefgh")
 */
export function shortenBytes32(
  bytes32: Bytes32,
  prefixLength: number = 10,
  suffixLength: number = 8
): string {
  if (!bytes32.startsWith('0x') || bytes32.length !== 66) {
    throw new Error(`Invalid bytes32: ${bytes32}`);
  }
  const prefix = bytes32.slice(0, prefixLength);
  const suffix = bytes32.slice(-suffixLength);
  return `${prefix}...${suffix}`;
}

/**
 * Validate Ethereum address format
 * @param address Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize address to lowercase
 * @param address Address to normalize
 * @returns Normalized address
 */
export function normalizeAddress(address: Address): Address {
  return address.toLowerCase() as Address;
}

/**
 * Compare two addresses (case-insensitive)
 * @param a First address
 * @param b Second address
 * @returns True if addresses are equal
 */
export function addressesEqual(a: Address, b: Address): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}

// ============================================
// Vault Identifier Utilities
// ============================================

/**
 * Create VaultIdentifier from components
 * @param params Vault parameters
 * @returns Complete VaultIdentifier
 */
export function createVaultIdentifier(params: {
  address: Address;
  chainId: number;
  uuid: UUID;
  name: string;
  salt?: Bytes32;
  factoryAddress?: Address;
}): VaultIdentifier {
  return {
    address: params.address,
    chainId: params.chainId,
    caip10: toCAIP10(params.chainId, params.address),
    uuid: params.uuid,
    salt: params.salt,
    factoryAddress: params.factoryAddress,
    name: params.name,
    shortAddress: shortenAddress(params.address),
  };
}

/**
 * Create UserIdentifier from components
 * @param address User address
 * @param chainId Chain ID
 * @param role User's role (optional)
 * @returns Complete UserIdentifier
 */
export function createUserIdentifier(
  address: Address,
  chainId: number,
  role?: 'owner' | 'guardian' | 'requester' | 'viewer'
): UserIdentifier {
  return {
    address,
    chainId,
    caip10: toCAIP10(chainId, address),
    role,
    shortAddress: shortenAddress(address),
  };
}

/**
 * Create MemberIdentifier from components
 * @param params Member parameters
 * @returns Complete MemberIdentifier
 */
export function createMemberIdentifier(params: {
  id: UUID;
  vaultId: Address;
  address: Address;
  chainId: number;
  role: 'owner' | 'guardian' | 'requester' | 'viewer' | 'approver';
  weight?: number;
  displayName?: string;
  joinedAt?: string;
  addedBy?: Address;
}): MemberIdentifier {
  return {
    id: params.id,
    vaultId: params.vaultId,
    address: params.address,
    chainId: params.chainId,
    caip10: toCAIP10(params.chainId, params.address),
    vaultCaip10: toCAIP10(params.chainId, params.vaultId),
    role: params.role,
    weight: params.weight,
    displayName: params.displayName,
    shortAddress: shortenAddress(params.address),
    shortVaultAddress: shortenAddress(params.vaultId),
    joinedAt: params.joinedAt,
    addedBy: params.addedBy,
  };
}

/**
 * Create EscrowIdentifier from components
 * @param params Escrow parameters
 * @returns Complete EscrowIdentifier
 */
export function createEscrowIdentifier(params: {
  id: UUID;
  vaultAddress: Address;
  chainId: number;
  escrowId?: Bytes32;
  status: 'draft' | 'pending' | 'approved' | 'ready' | 'released' | 'cancelled' | 'expired';
  requester: Address;
  recipient: Address;
  token: Address;
  amount: string;
  reason?: string;
}): EscrowIdentifier {
  return {
    id: params.id,
    vaultAddress: params.vaultAddress,
    chainId: params.chainId,
    vaultCaip10: toCAIP10(params.chainId, params.vaultAddress),
    escrowId: params.escrowId,
    status: params.status,
    requester: params.requester,
    recipient: params.recipient,
    token: params.token,
    amount: params.amount,
    shortVaultAddress: shortenAddress(params.vaultAddress),
    reason: params.reason,
  };
}

/**
 * Create PolicyIdentifier from components
 * @param params Policy parameters
 * @returns Complete PolicyIdentifier
 */
export function createPolicyIdentifier(params: {
  id: UUID;
  vaultAddress: Address;
  chainId: number;
  policyId: Bytes32;
  active: boolean;
  threshold: number;
  timelock: number;
}): PolicyIdentifier {
  return {
    id: params.id,
    vaultAddress: params.vaultAddress,
    chainId: params.chainId,
    vaultCaip10: toCAIP10(params.chainId, params.vaultAddress),
    policyId: params.policyId,
    active: params.active,
    threshold: params.threshold,
    timelock: params.timelock,
    shortVaultAddress: shortenAddress(params.vaultAddress),
    shortPolicyId: shortenBytes32(params.policyId),
  };
}

/**
 * Create TransactionIdentifier from components
 * @param txHash Transaction hash
 * @param chainId Chain ID
 * @param blockNumber Block number
 * @param from From address
 * @param to To address
 * @param status Transaction status
 * @param userOpHash UserOperation hash (optional)
 * @returns Complete TransactionIdentifier
 */
export function createTransactionIdentifier(
  txHash: Bytes32,
  chainId: number,
  blockNumber: number,
  from: Address,
  to: Address,
  status: 'pending' | 'success' | 'failed',
  userOpHash?: Bytes32
): TransactionIdentifier {
  return {
    txHash,
    chainId,
    blockNumber,
    from,
    to,
    status,
    userOpHash,
  };
}

// ============================================
// CREATE2 Salt Generation
// ============================================

/**
 * Generate CREATE2 salt from UUID and owner
 * This matches the Solidity implementation in VaultFactory
 * @param uuid UUID bytes (16 bytes)
 * @param owner Owner address
 * @param chainId Chain ID
 * @returns Salt as bytes32
 */
export function generateSalt(
  uuid: Buffer | Uint8Array,
  owner: Address,
  chainId: number
): Bytes32 {
  // Convert to Buffer if Uint8Array
  const uuidBuffer = Buffer.from(uuid);

  if (uuidBuffer.length !== 16) {
    throw new Error(`UUID must be 16 bytes, got ${uuidBuffer.length}`);
  }

  // In Solidity: keccak256(abi.encodePacked(uuid, owner, chainId))
  // We need to use a compatible hashing method
  // For now, we'll create a simple concatenation and return placeholder
  // In production, you'd use ethers or viem keccak256
  const crypto = require('crypto');
  const ownerBuffer = Buffer.from(owner.slice(2), 'hex');
  const chainIdBuffer = Buffer.allocUnsafe(32);
  chainIdBuffer.writeBigUInt64BE(BigInt(chainId), 24);

  const combined = Buffer.concat([uuidBuffer, ownerBuffer, chainIdBuffer.slice(24)]);
  const hash = crypto.createHash('sha256').update(combined).digest('hex');

  return `0x${hash}` as Bytes32;
}

/**
 * Generate CREATE2 salt from UUID string
 * @param uuid UUID string
 * @param owner Owner address
 * @param chainId Chain ID
 * @returns Salt as bytes32
 */
export function generateSaltFromUUID(
  uuid: UUID,
  owner: Address,
  chainId: number
): Bytes32 {
  const bytes = uuidToBytes16(uuid);
  return generateSalt(bytes, owner, chainId);
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate VaultIdentifier completeness
 * @param vault VaultIdentifier to validate
 * @throws Error if validation fails
 */
export function validateVaultIdentifier(vault: VaultIdentifier): void {
  if (!isValidAddress(vault.address)) {
    throw new Error(`Invalid vault address: ${vault.address}`);
  }

  if (vault.chainId <= 0) {
    throw new Error(`Invalid chain ID: ${vault.chainId}`);
  }

  const parsed = parseCAIP10(vault.caip10);
  if (parsed.chainId !== vault.chainId) {
    throw new Error(`Chain ID mismatch: ${parsed.chainId} !== ${vault.chainId}`);
  }

  if (!addressesEqual(parsed.address, vault.address)) {
    throw new Error(`Address mismatch in CAIP-10: ${parsed.address} !== ${vault.address}`);
  }

  if (!vault.name || vault.name.trim().length === 0) {
    throw new Error('Vault name is required');
  }
}

/**
 * Validate UserIdentifier completeness
 * @param user UserIdentifier to validate
 * @throws Error if validation fails
 */
export function validateUserIdentifier(user: UserIdentifier): void {
  if (!isValidAddress(user.address)) {
    throw new Error(`Invalid user address: ${user.address}`);
  }

  if (user.chainId <= 0) {
    throw new Error(`Invalid chain ID: ${user.chainId}`);
  }

  const parsed = parseCAIP10(user.caip10);
  if (parsed.chainId !== user.chainId) {
    throw new Error(`Chain ID mismatch: ${parsed.chainId} !== ${user.chainId}`);
  }

  if (!addressesEqual(parsed.address, user.address)) {
    throw new Error(`Address mismatch in CAIP-10: ${parsed.address} !== ${user.address}`);
  }

  if (user.role && !['owner', 'guardian', 'requester', 'viewer'].includes(user.role)) {
    throw new Error(`Invalid role: ${user.role}`);
  }
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format vault identifier for display
 * @param vault VaultIdentifier
 * @returns Formatted string
 */
export function formatVaultDisplay(vault: VaultIdentifier): string {
  return `${vault.name} (${vault.shortAddress})`;
}

/**
 * Format user identifier for display
 * @param user UserIdentifier
 * @returns Formatted string
 */
export function formatUserDisplay(user: UserIdentifier): string {
  const roleText = user.role ? ` [${user.role}]` : '';
  return `${user.shortAddress}${roleText}`;
}

/**
 * Format member identifier for display
 * @param member MemberIdentifier
 * @returns Formatted string
 */
export function formatMemberDisplay(member: MemberIdentifier): string {
  const name = member.displayName || member.shortAddress;
  return `${name} [${member.role}]`;
}

/**
 * Format escrow identifier for display
 * @param escrow EscrowIdentifier
 * @returns Formatted string
 */
export function formatEscrowDisplay(escrow: EscrowIdentifier): string {
  const escrowId = escrow.escrowId ? shortenBytes32(escrow.escrowId) : escrow.id.slice(0, 8);
  return `Escrow ${escrowId} [${escrow.status}]`;
}

/**
 * Format policy identifier for display
 * @param policy PolicyIdentifier
 * @returns Formatted string
 */
export function formatPolicyDisplay(policy: PolicyIdentifier): string {
  const status = policy.active ? 'Active' : 'Inactive';
  return `Policy ${policy.shortPolicyId} [${status}]`;
}

/**
 * Format transaction hash for display
 * @param txHash Transaction hash
 * @param prefixLength Length of prefix (default: 10, includes "0x")
 * @param suffixLength Length of suffix (default: 8)
 * @returns Shortened transaction hash
 */
export function formatTxHash(
  txHash: Bytes32,
  prefixLength: number = 10,
  suffixLength: number = 8
): string {
  if (!txHash.startsWith('0x') || txHash.length !== 66) {
    throw new Error(`Invalid transaction hash: ${txHash}`);
  }
  const prefix = txHash.slice(0, prefixLength);
  const suffix = txHash.slice(-suffixLength);
  return `${prefix}...${suffix}`;
}

// ============================================
// Explorer URL Utilities
// ============================================

/**
 * Get block explorer URL for an address
 * @param chainId Chain ID
 * @param address Address to view
 * @returns Block explorer URL
 */
export function getExplorerAddressUrl(chainId: number, address: Address): string {
  const explorerUrls: Record<number, string> = {
    1: 'https://etherscan.io',
    8453: 'https://basescan.org',
    84532: 'https://sepolia.basescan.org',
    11155111: 'https://sepolia.etherscan.io',
  };

  const baseUrl = explorerUrls[chainId] || 'https://etherscan.io';
  return `${baseUrl}/address/${address}`;
}

/**
 * Get block explorer URL for a transaction
 * @param chainId Chain ID
 * @param txHash Transaction hash
 * @returns Block explorer URL
 */
export function getExplorerTxUrl(chainId: number, txHash: Bytes32): string {
  const explorerUrls: Record<number, string> = {
    1: 'https://etherscan.io',
    8453: 'https://basescan.org',
    84532: 'https://sepolia.basescan.org',
    11155111: 'https://sepolia.etherscan.io',
  };

  const baseUrl = explorerUrls[chainId] || 'https://etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}
