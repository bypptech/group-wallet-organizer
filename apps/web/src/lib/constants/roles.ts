/**
 * Vault Role Definitions
 *
 * Used across Group Creation and Group Settings to ensure consistency
 */

export type VaultRole = 'owner' | 'guardian' | 'approver' | 'requester' | 'viewer';

export interface RoleConfig {
  label: string;
  description: string;
  color: string;
  defaultWeight: number;
  permissions: string[];
}

export const VAULT_ROLES: Record<VaultRole, RoleConfig> = {
  owner: {
    label: 'Owner',
    description: 'Full control over the vault',
    color: 'from-purple-500 to-indigo-500',
    defaultWeight: 3,
    permissions: [
      'Manage vault settings',
      'Add/remove members',
      'Approve transactions',
      'Create transactions',
      'View all data'
    ]
  },
  guardian: {
    label: 'Guardian',
    description: 'Emergency approver with high authority',
    color: 'from-amber-500 to-orange-500',
    defaultWeight: 2,
    permissions: [
      'Approve transactions',
      'Emergency actions',
      'View all data'
    ]
  },
  approver: {
    label: 'Approver',
    description: 'Can approve transactions',
    color: 'from-green-500 to-emerald-500',
    defaultWeight: 1,
    permissions: [
      'Approve transactions',
      'View transaction details'
    ]
  },
  requester: {
    label: 'Requester',
    description: 'Can create transaction requests',
    color: 'from-blue-500 to-cyan-500',
    defaultWeight: 0,
    permissions: [
      'Create transactions',
      'View own transactions'
    ]
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access',
    color: 'from-gray-500 to-slate-500',
    defaultWeight: 0,
    permissions: [
      'View transactions',
      'View vault information'
    ]
  }
};

/**
 * Get role badge color for UI display
 */
export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'guardian':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'approver':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'requester':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'viewer':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Get available roles for selection in UI
 */
export const getAvailableRoles = (): VaultRole[] => {
  return ['owner', 'guardian', 'approver', 'requester', 'viewer'];
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: VaultRole, permission: string): boolean => {
  return VAULT_ROLES[role].permissions.includes(permission);
};

/**
 * Get role weight for approval calculations
 */
export const getRoleWeight = (role: VaultRole): number => {
  return VAULT_ROLES[role].defaultWeight;
};
