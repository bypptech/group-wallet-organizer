import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { ESCROW_REGISTRY_ABI, ESCROW_REGISTRY_ADDRESS } from '@/lib/contracts';
import { useVaultStore } from '@/store/useVaultStore';

export interface CreateEscrowParams {
  vaultAddress: Address;
  recipient: Address;
  tokenAddress: Address;
  amount: string; // ETH string like "1.5"
  escrowType: number; // 0: Allowance, 1: Bill Payment, 2: Gift, 3: Reimbursement, 4: Other
  approvalType: number; // 0: Async, 1: Sync
  title: string;
  description: string;
  scheduledReleaseAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  metadataHash?: string;
}

/**
 * エスクロー作成フック
 */
export const useCreateEscrow = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addEscrow, addNotification } = useVaultStore();

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
   * エスクロー作成を実行
   */
  const createEscrow = async (params: CreateEscrowParams) => {
    try {
      setIsCreating(true);
      setError(null);

      // パラメータのバリデーション
      if (!params.vaultAddress || !params.recipient) {
        throw new Error('Vault address and recipient are required');
      }

      if (!params.amount || parseFloat(params.amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (params.expiresAt <= Date.now() / 1000) {
        throw new Error('Expiry time must be in the future');
      }

      if (params.scheduledReleaseAt > params.expiresAt) {
        throw new Error('Scheduled release must be before expiry');
      }

      // ETHの場合はparseEther、ERC20の場合は適切な単位に変換
      const amountInWei = params.tokenAddress === '0x0000000000000000000000000000000000000000'
        ? parseEther(params.amount)
        : parseEther(params.amount); // TODO: トークンのdecimalsに応じて調整

      // コントラクト呼び出し
      writeContract({
        address: ESCROW_REGISTRY_ADDRESS,
        abi: ESCROW_REGISTRY_ABI,
        functionName: 'createEscrow',
        args: [
          {
            vaultAddress: params.vaultAddress,
            recipient: params.recipient,
            tokenAddress: params.tokenAddress,
            amount: amountInWei,
            escrowType: params.escrowType,
            approvalType: params.approvalType,
            title: params.title,
            description: params.description,
            scheduledReleaseAt: BigInt(params.scheduledReleaseAt),
            expiresAt: BigInt(params.expiresAt),
            metadataHash: params.metadataHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
        ],
      });

      // 成功時の通知
      addNotification({
        type: 'escrow_created',
        title: 'Escrow Created',
        message: `Successfully created escrow: ${params.title}`,
        timestamp: Date.now(),
        read: false,
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create escrow');
      setError(error);
      console.error('Create escrow error:', error);

      // エラー通知
      addNotification({
        type: 'escrow_created',
        title: 'Escrow Creation Failed',
        message: error.message,
        timestamp: Date.now(),
        read: false,
      });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * ガス推定
   */
  const estimateGas = async (params: CreateEscrowParams): Promise<bigint | null> => {
    try {
      // TODO: estimateGas 実装
      // const gas = await publicClient.estimateContractGas({...})
      return BigInt(150000); // 仮の値
    } catch (err) {
      console.error('Gas estimation error:', err);
      return null;
    }
  };

  return {
    createEscrow,
    estimateGas,
    isCreating: isCreating || isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: error || writeError || confirmError,
    transactionHash: hash,
  };
};

/**
 * Paymaster スポンサーシップチェック
 */
export const usePaymasterCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [sponsorshipResult, setSponsorshipResult] = useState<{
    available: boolean;
    estimatedGas: string;
    reason: string;
    poolBalance: string;
    dailyRemaining: string;
  } | null>(null);

  const checkSponsorship = async (params: CreateEscrowParams) => {
    setIsChecking(true);

    try {
      // TODO: Paymaster API 呼び出し
      // const response = await fetch('/api/paymaster/check', {...})

      // モックレスポンス
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockResult = {
        available: true,
        estimatedGas: '0.002 ETH',
        reason: 'Sufficient paymaster balance',
        poolBalance: '2.45 ETH',
        dailyRemaining: '3.8 ETH',
      };

      setSponsorshipResult(mockResult);
      return mockResult;
    } catch (err) {
      console.error('Sponsorship check error:', err);
      const failedResult = {
        available: false,
        estimatedGas: '0.002 ETH',
        reason: 'Paymaster service unavailable',
        poolBalance: 'Unknown',
        dailyRemaining: 'Unknown',
      };
      setSponsorshipResult(failedResult);
      return failedResult;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkSponsorship,
    isChecking,
    sponsorshipResult,
  };
};
