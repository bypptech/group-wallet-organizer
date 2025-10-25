/**
 * Policy type definition
 */
export interface Policy {
  maxAmount: bigint;
  cooldownPeriod: bigint;
  minApprovals: bigint;
  rolesRoot: `0x${string}`;
  ownersRoot: `0x${string}`;
  isActive: boolean;
}

/**
 * Display policy type with formatted values
 */
export interface DisplayPolicy {
  id: string;
  name: string;
  threshold: string;
  timelock: string;
  rolesRoot: `0x${string}`;
  ownersRoot: `0x${string}`;
  status: 'active' | 'inactive' | 'unknown';
  description: string;
  createdAt: string;
  lastUpdated: string;
  scheduledUpdate: string | null;
  usageCount: number;
  maxAmount?: bigint;
  minApprovals?: bigint;
  cooldownPeriod?: bigint;
}
