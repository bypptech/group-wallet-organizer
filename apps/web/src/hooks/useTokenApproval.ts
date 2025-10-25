import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { maxUint256 } from 'viem';
import type { Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';

/**
 * トークン承認用のカスタムフック
 * jpyc-gachaから移植したベストプラクティス実装
 */
export function useTokenApproval() {
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * トークンを承認する
   * @param tokenAddress - トークンのアドレス
   * @param spenderAddress - 承認先のアドレス
   * @param amount - 承認する数量（undefinedの場合は無制限）
   */
  const approve = async (
    tokenAddress: Address,
    spenderAddress: Address,
    amount?: bigint
  ) => {
    // 数量が指定されていない場合は無制限承認
    const approvalAmount = amount !== undefined ? amount : maxUint256;

    return writeContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ] as const,
      functionName: 'approve',
      args: [spenderAddress, approvalAmount],
      chainId: baseSepolia.id, // Force transaction on Base Sepolia
    });
  };

  return {
    approve,
    hash,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}

/**
 * トークンの承認額を取得するフック
 */
export function useTokenAllowance(
  tokenAddress: Address | undefined,
  ownerAddress: Address | undefined,
  spenderAddress: Address | undefined
) {
  const { data: allowance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'allowance',
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    chainId: baseSepolia.id, // Force read from Base Sepolia regardless of connected chain
    query: {
      enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress,
    },
  });

  return {
    allowance,
    isLoading,
    error,
    refetch,
  };
}

/**
 * トークン残高を取得するフック
 */
export function useTokenBalance(
  tokenAddress: Address | undefined,
  accountAddress: Address | undefined
) {
  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'balanceOf',
    args: accountAddress ? [accountAddress] : undefined,
    chainId: baseSepolia.id, // Force read from Base Sepolia regardless of connected chain
    query: {
      enabled: !!tokenAddress && !!accountAddress,
      refetchInterval: 10000, // 10秒ごとに再取得
    },
  });

  // デバッグログ
  console.log('[useTokenBalance Hook] tokenAddress:', tokenAddress);
  console.log('[useTokenBalance Hook] accountAddress:', accountAddress);
  console.log('[useTokenBalance Hook] enabled:', !!tokenAddress && !!accountAddress);
  console.log('[useTokenBalance Hook] isLoading:', isLoading);
  console.log('[useTokenBalance Hook] error:', error);
  console.log('[useTokenBalance Hook] balance:', balance);

  return {
    balance,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 承認が必要かチェックするヘルパー関数
 */
export function useNeedsApproval(
  tokenAddress: Address | undefined,
  ownerAddress: Address | undefined,
  spenderAddress: Address | undefined,
  requiredAmount: bigint | undefined
) {
  const { allowance, isLoading, refetch } = useTokenAllowance(
    tokenAddress,
    ownerAddress,
    spenderAddress
  );

  const needsApproval = requiredAmount !== undefined && allowance !== undefined
    ? allowance < requiredAmount
    : true;

  return {
    needsApproval,
    currentAllowance: allowance,
    isLoading,
    refetch,
  };
}
