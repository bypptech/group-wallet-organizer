import { useMemo } from 'react';
import { useGetPoliciesForVault, useGetPolicy } from './usePolicyManager';
import { useReadContracts } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { policyManagerABI, getContractAddress } from '@/lib/contracts';
import type { Policy } from '@/types/policy';

/**
 * Hook for fetching multiple policies data for a vault
 * Uses wagmi's useReadContracts (multicall) for efficient batch reading
 */
export function usePoliciesData(vaultAddress: `0x${string}` | undefined) {
  // Get all policy IDs for the vault
  const { policyIds, isLoading: isLoadingIds, error: idsError, refetch: refetchIds } = useGetPoliciesForVault(vaultAddress);

  // Create contract calls for each policy ID
  const contracts = useMemo(() => {
    if (!policyIds || policyIds.length === 0) return [];

    return policyIds.map((policyId) => ({
      address: getContractAddress('policyManager', baseSepolia.id) as `0x${string}`,
      abi: policyManagerABI,
      functionName: 'getPolicy' as const,
      args: [policyId] as const,
      chainId: baseSepolia.id,
    }));
  }, [policyIds]);

  // Fetch all policies in a single multicall
  const { data: policiesData, isLoading: isLoadingPolicies, error: policiesError, refetch: refetchPolicies } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // Format the policies data
  const policies = useMemo(() => {
    if (!policyIds || !policiesData) return [];

    return policyIds.map((policyId, index) => {
      const result = policiesData[index];
      const policy = result?.status === 'success' ? result.result as Policy : null;

      return formatPolicyForDisplay(policy, policyId);
    });
  }, [policyIds, policiesData]);

  const refetchAll = async () => {
    await refetchIds();
    await refetchPolicies();
  };

  return {
    policies,
    policyIds: policyIds || [],
    isLoading: isLoadingIds || isLoadingPolicies,
    error: idsError || policiesError,
    refetch: refetchAll,
  };
}

/**
 * Hook for fetching a single policy with enriched data
 */
export function usePolicyData(policyId: bigint | undefined) {
  const { policy, isLoading, error, refetch } = useGetPolicy(policyId);

  const enrichedPolicy = useMemo(() => {
    if (!policy) return null;

    return {
      ...policy,
      id: policyId?.toString() || '',
      // Convert bigint values to user-friendly formats
      minApprovalsNumber: Number(policy.minApprovals),
      cooldownPeriodHours: Number(policy.cooldownPeriod) / 3600,
      // Format status
      isActive: policy.isActive,
      status: policy.isActive ? 'active' : 'inactive',
    };
  }, [policy, policyId]);

  return {
    policy: enrichedPolicy,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Format policy data for display
 */
export function formatPolicyForDisplay(policy: Policy | null, policyId: bigint) {
  if (!policy) {
    return {
      id: `POL-${policyId.toString().padStart(3, '0')}`,
      name: 'Unknown Policy',
      threshold: '0/0',
      timelock: '0h',
      rolesRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      status: 'unknown' as const,
      description: 'Policy data not available',
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      scheduledUpdate: null,
      usageCount: 0,
    };
  }

  const cooldownHours = Number(policy.cooldownPeriod) / 3600;

  return {
    id: `POL-${policyId.toString().padStart(3, '0')}`,
    name: `Policy ${policyId}`,
    threshold: `${policy.minApprovals}/3`, // TODO: Get total approvers from contract
    timelock: `${cooldownHours}h`,
    rolesRoot: policy.rolesRoot,
    ownersRoot: policy.ownersRoot,
    status: policy.isActive ? ('active' as const) : ('inactive' as const),
    description: `Min approvals: ${policy.minApprovals}, Max amount: ${policy.maxAmount.toString()}, Cooldown: ${cooldownHours}h`,
    createdAt: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0],
    scheduledUpdate: null, // TODO: Implement scheduled updates
    usageCount: 0, // TODO: Get from Subgraph
    maxAmount: policy.maxAmount,
    minApprovals: policy.minApprovals,
    cooldownPeriod: policy.cooldownPeriod,
  };
}
