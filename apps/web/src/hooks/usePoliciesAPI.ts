/**
 * Hook for fetching policies from API (not blockchain)
 * Updated for Policy-Based Architecture (Payment & Collection Policies)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  Policy, 
  PaymentPolicy, 
  CollectionPolicy,
  PolicyType 
} from '@shared/types/policy';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Re-export shared types for convenience
export type { Policy, PaymentPolicy, CollectionPolicy, PolicyType };

// Legacy type for backward compatibility (will be removed later)
export interface LegacyPolicy {
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

// Payment Policy creation params
export interface CreatePaymentPolicyParams {
  type: 'payment';
  vaultId: string;
  policyId: string; // bytes32 hex
  name: string;
  description?: string;
  threshold: number;
  timelock: number;
  rolesRoot: string;
  ownersRoot: string;
  maxAmount?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

// Collection Policy creation params  
export interface CreateCollectionPolicyParams {
  type: 'collection';
  vaultId: string;
  policyId: string; // bytes32 hex
  name: string;
  description?: string;
  collectionConfig: {
    allowPartialPayment?: boolean;
    autoComplete?: boolean;
    defaultDeadline?: string;
    reminderSettings?: {
      enabled: boolean;
      daysBefore: number;
    };
  };
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export type CreatePolicyParams = CreatePaymentPolicyParams | CreateCollectionPolicyParams;

export interface UpdatePolicyParams {
  policyId: string;
  name?: string;
  description?: string;
  active?: boolean;
  // Payment policy fields
  threshold?: number;
  timelock?: number;
  maxAmount?: string;
  // Collection policy fields
  collectionConfig?: {
    allowPartialPayment?: boolean;
    autoComplete?: boolean;
    defaultDeadline?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface GetPoliciesParams {
  vaultId?: string;
  type?: PolicyType;
  active?: boolean;
}

/**
 * Fetch policies for a vault (with optional type filter)
 */
export const usePoliciesAPI = (params?: GetPoliciesParams) => {
  return useQuery({
    queryKey: ['policies', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.vaultId) {
        searchParams.append('vaultId', params.vaultId);
      }
      if (params?.type) {
        searchParams.append('type', params.type);
      }
      if (params?.active !== undefined) {
        searchParams.append('active', String(params.active));
      }

      const url = `${API_BASE_URL}/policies${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      return data as { policies: Policy[] };
    },
  });
};

/**
 * Fetch a single policy
 */
export const usePolicyAPI = (policyId: string | undefined) => {
  return useQuery({
    queryKey: ['policy', policyId],
    queryFn: async () => {
      if (!policyId) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }

      const data = await response.json();
      return data.policy as Policy;
    },
    enabled: !!policyId,
  });
};

/**
 * Create a new policy (Payment or Collection)
 */
export const useCreatePolicyAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePolicyParams) => {
      const response = await fetch(`${API_BASE_URL}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create policy');
      }

      const data = await response.json();
      return data.policy as Policy;
    },
    onSuccess: (_, variables) => {
      // Invalidate policies query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['policies', { vaultId: variables.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

/**
 * Update a policy
 */
export const useUpdatePolicyAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdatePolicyParams) => {
      const { policyId, ...updateData } = params;

      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update policy');
      }

      const data = await response.json();
      return data.policy as Policy;
    },
    onSuccess: (data) => {
      // Invalidate both the specific policy and the list
      queryClient.invalidateQueries({ queryKey: ['policy', data.id] });
      queryClient.invalidateQueries({ queryKey: ['policies', { vaultId: data.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

/**
 * Enable a policy
 */
export const useEnablePolicyAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enable policy');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy.id] });
      queryClient.invalidateQueries({ queryKey: ['policies', { vaultId: data.policy.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

/**
 * Disable a policy
 */
export const useDisablePolicyAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable policy');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy.id] });
      queryClient.invalidateQueries({ queryKey: ['policies', { vaultId: data.policy.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

/**
 * Archive (delete) a policy
 */
export const useArchivePolicyAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyId: string) => {
      const response = await fetch(`${API_BASE_URL}/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive policy');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all policies queries
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

/**
 * Schedule a policy update
 */
export const useSchedulePolicyUpdateAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { policyId: string; scheduledDate: string }) => {
      const response = await fetch(`${API_BASE_URL}/policies/${params.policyId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: params.scheduledDate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule policy update');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy.id] });
      queryClient.invalidateQueries({ queryKey: ['policies', { vaultId: data.policy.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

/**
 * Emergency update a policy
 */
export const useEmergencyUpdatePolicyAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      policyId: string;
      minApprovals: number;
      maxAmount: string;
      cooldownHours: number;
      reason: string;
    }) => {
      const { policyId, ...updateData } = params;

      const response = await fetch(`${API_BASE_URL}/policies/${policyId}/emergency-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform emergency update');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy.id] });
      queryClient.invalidateQueries({ queryKey: ['policies', { vaultId: data.policy.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};
