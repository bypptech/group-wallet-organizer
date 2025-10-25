import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { policyManagerABI as POLICY_MANAGER_ABI, getContractAddress } from '@/lib/contracts';
import { useVaultStore } from '@/store/useVaultStore';
import { baseSepolia } from 'wagmi/chains';

// POLICY_MANAGER_ADDRESSを取得するヘルパー
const POLICY_MANAGER_ADDRESS = getContractAddress('policyManager', baseSepolia.id);

export interface PolicyConfig {
  id: string;
  vaultAddress: Address;
  minApprovals: number;
  maxAmount: bigint;
  cooldownPeriod: number;
  rolesRoot: string;
  ownersRoot: string;
  enabled: boolean;
}

/**
 * ポリシー作成フック
 */
export const useCreatePolicy = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { addPolicy, addNotification } = useVaultStore();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * ポリシーを作成
   */
  const createPolicy = async (
    vaultAddress: Address,
    minApprovals: number,
    maxAmount: bigint,
    cooldownPeriod: number,
    rolesRoot: string,
    ownersRoot: string
  ) => {
    try {
      setIsCreating(true);

      writeContract({
        address: POLICY_MANAGER_ADDRESS,
        abi: POLICY_MANAGER_ABI,
        functionName: 'createPolicy',
        args: [
          vaultAddress,
          BigInt(minApprovals),
          maxAmount,
          BigInt(cooldownPeriod),
          rolesRoot as `0x${string}`,
          ownersRoot as `0x${string}`,
        ],
      });

      addNotification({
        type: 'policy_updated',
        title: 'Policy Created',
        message: 'New policy has been created successfully',
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create policy');
      console.error('Create policy error:', error);

      addNotification({
        type: 'policy_updated',
        title: 'Policy Creation Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createPolicy,
    isCreating: isCreating || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * ポリシー更新提案フック
 */
export const useProposeUpdatePolicy = () => {
  const [isProposing, setIsProposing] = useState(false);
  const { addNotification } = useVaultStore();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * ポリシー更新を提案
   */
  const proposeUpdate = async (
    policyId: bigint,
    minApprovals: number,
    maxAmount: bigint,
    cooldownPeriod: number,
    rolesRoot: string,
    ownersRoot: string
  ) => {
    try {
      setIsProposing(true);

      writeContract({
        address: POLICY_MANAGER_ADDRESS,
        abi: POLICY_MANAGER_ABI,
        functionName: 'proposeUpdatePolicy',
        args: [
          policyId,
          BigInt(minApprovals),
          maxAmount,
          BigInt(cooldownPeriod),
          rolesRoot as `0x${string}`,
          ownersRoot as `0x${string}`,
        ],
      });

      addNotification({
        type: 'policy_updated',
        title: 'Policy Update Proposed',
        message: 'Policy update proposal submitted for approval',
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to propose policy update');
      console.error('Propose policy update error:', error);

      addNotification({
        type: 'policy_updated',
        title: 'Policy Proposal Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsProposing(false);
    }
  };

  return {
    proposeUpdate,
    isProposing: isProposing || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * ポリシー更新承認フック
 */
export const useApprovePolicyUpdate = () => {
  const [isApproving, setIsApproving] = useState(false);
  const { addNotification } = useVaultStore();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * ポリシー更新提案を承認
   */
  const approveUpdate = async (proposalId: bigint) => {
    try {
      setIsApproving(true);

      writeContract({
        address: POLICY_MANAGER_ADDRESS,
        abi: POLICY_MANAGER_ABI,
        functionName: 'approvePolicyUpdate',
        args: [proposalId],
      });

      addNotification({
        type: 'policy_updated',
        title: 'Policy Update Approved',
        message: 'Policy update proposal approved',
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to approve policy update');
      console.error('Approve policy update error:', error);

      addNotification({
        type: 'policy_updated',
        title: 'Policy Approval Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsApproving(false);
    }
  };

  return {
    approveUpdate,
    isApproving: isApproving || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * ポリシー取得フック
 */
export const usePolicy = (policyId: bigint | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: POLICY_MANAGER_ADDRESS,
    abi: POLICY_MANAGER_ABI,
    functionName: 'getPolicy',
    args: policyId !== undefined ? [policyId] : undefined,
    query: {
      enabled: policyId !== undefined,
      refetchInterval: 30000, // 30秒ごとに更新
    },
  });

  return {
    policy: data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Vault別ポリシー一覧取得フック
 */
export const usePoliciesByVault = (vaultAddress: Address | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: POLICY_MANAGER_ADDRESS,
    abi: POLICY_MANAGER_ABI,
    functionName: 'getPoliciesByVault',
    args: vaultAddress ? [vaultAddress] : undefined,
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 30000,
    },
  });

  return {
    policyIds: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Guardian緊急更新フック
 */
export const useEmergencyUpdatePolicy = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useVaultStore();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Guardian による緊急ポリシー更新
   */
  const emergencyUpdate = async (
    policyId: bigint,
    minApprovals: number,
    maxAmount: bigint,
    cooldownPeriod: number,
    reason: string
  ) => {
    try {
      setIsUpdating(true);

      writeContract({
        address: POLICY_MANAGER_ADDRESS,
        abi: POLICY_MANAGER_ABI,
        functionName: 'emergencyUpdatePolicy',
        args: [
          policyId,
          BigInt(minApprovals),
          maxAmount,
          BigInt(cooldownPeriod),
          reason,
        ],
      });

      addNotification({
        type: 'policy_updated',
        title: 'Emergency Policy Update',
        message: `Policy updated: ${reason}`,
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update policy');
      console.error('Emergency update error:', error);

      addNotification({
        type: 'policy_updated',
        title: 'Emergency Update Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    emergencyUpdate,
    isUpdating: isUpdating || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};
