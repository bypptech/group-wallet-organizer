/**
 * usePolicyManager hook (Stub)
 *
 * Temporary stub file to prevent import errors.
 * This will be properly implemented in future phases.
 */

export function useCreatePolicy() {
  return {
    createPolicy: async () => {},
    isPending: false,
    error: null,
  };
}

export function useEnablePolicy() {
  return {
    enablePolicy: async () => {},
    isPending: false,
    error: null,
  };
}

export function useDisablePolicy() {
  return {
    disablePolicy: async () => {},
    isPending: false,
    error: null,
  };
}

export function useProposePolicyUpdate() {
  return {
    proposePolicyUpdate: async () => {},
    isPending: false,
    error: null,
  };
}

export function useEmergencyUpdatePolicy() {
  return {
    emergencyUpdatePolicy: async () => {},
    isPending: false,
    error: null,
  };
}

export function useGetPoliciesForVault() {
  return {
    policies: [],
    isLoading: false,
    error: null,
  };
}

/**
 * ポリシー管理フック
 * usePolicy.tsのフックを再エクスポートして、PolicyManagementコンポーネントとの互換性を維持
 */

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { getContractAddress, policyManagerABI } from '@/lib/contracts';
import { useVaultStore } from '@/store/useVaultStore';

export {
  useCreatePolicy,
  useProposeUpdatePolicy as useProposePolicyUpdate,
  useApprovePolicyUpdate,
  useEmergencyUpdatePolicy,
  usePolicy as useGetPolicy,
  usePoliciesByVault as useGetPoliciesForVault,
  type PolicyConfig,
} from './usePolicy';

/**
 * ポリシー有効化フック
 */
export const useEnablePolicy = () => {
  const [isEnabling, setIsEnabling] = useState(false);
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

  const enablePolicy = async (policyId: bigint) => {
    try {
      setIsEnabling(true);

      const POLICY_MANAGER_ADDRESS = getContractAddress('policyManager', baseSepolia.id);

      writeContract({
        address: POLICY_MANAGER_ADDRESS,
        abi: policyManagerABI,
        functionName: 'enablePolicy',
        args: [policyId],
      });

      addNotification({
        type: 'policy_updated',
        title: 'Policy Enabled',
        message: 'Policy has been enabled successfully',
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to enable policy');
      console.error('Enable policy error:', error);

      addNotification({
        type: 'policy_updated',
        title: 'Policy Enable Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  return {
    enablePolicy,
    isEnabling: isEnabling || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * ポリシー無効化フック
 */
export const useDisablePolicy = () => {
  const [isDisabling, setIsDisabling] = useState(false);
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

  const disablePolicy = async (policyId: bigint) => {
    try {
      setIsDisabling(true);

      const POLICY_MANAGER_ADDRESS = getContractAddress('policyManager', baseSepolia.id);

      writeContract({
        address: POLICY_MANAGER_ADDRESS,
        abi: policyManagerABI,
        functionName: 'disablePolicy',
        args: [policyId],
      });

      addNotification({
        type: 'policy_updated',
        title: 'Policy Disabled',
        message: 'Policy has been disabled successfully',
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to disable policy');
      console.error('Disable policy error:', error);

      addNotification({
        type: 'policy_updated',
        title: 'Policy Disable Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsDisabling(false);
    }
  };

  return {
    disablePolicy,
    isDisabling: isDisabling || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    transactionHash: hash,
  };
};
