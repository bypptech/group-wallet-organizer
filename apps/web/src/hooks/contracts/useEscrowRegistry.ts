import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useChainId } from 'wagmi'
import { escrowRegistryABI, getContractAddress } from '@/lib/contracts'

/**
 * Hook to read from EscrowRegistry contract
 */
export function useReadEscrowRegistry() {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  return {
    address,
    chainId,
  }
}

/**
 * Hook to get a specific escrow
 */
export function useEscrow(escrowId: bigint | undefined) {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  return useReadContract({
    address,
    abi: escrowRegistryABI,
    functionName: 'getEscrow',
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  })
}

/**
 * Hook to get approval state for an escrow
 */
export function useApprovalState(escrowId: bigint | undefined) {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  return useReadContract({
    address,
    abi: escrowRegistryABI,
    functionName: 'getApprovalState',
    args: escrowId !== undefined ? [escrowId] : undefined,
    query: {
      enabled: escrowId !== undefined,
    },
  })
}

/**
 * Hook to get escrows by vault
 */
export function useVaultEscrows(vaultAddress: `0x${string}` | undefined) {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  return useReadContract({
    address,
    abi: escrowRegistryABI,
    functionName: 'getEscrowsByVault',
    args: vaultAddress ? [vaultAddress] : undefined,
    query: {
      enabled: !!vaultAddress,
    },
  })
}

/**
 * Hook to create an escrow
 */
export function useCreateEscrow() {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const createEscrow = async (params: {
    vaultAddress: `0x${string}`
    recipient: `0x${string}`
    tokenAddress: `0x${string}`
    amount: bigint
    escrowType: number
    approvalType: number
    title: string
    description: string
    scheduledReleaseAt: bigint
    expiresAt: bigint
    metadataHash: `0x${string}`
  }) => {
    return writeContract({
      address,
      abi: escrowRegistryABI,
      functionName: 'createEscrow',
      args: [params],
    })
  }

  return {
    createEscrow,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

/**
 * Hook to approve an escrow release
 */
export function useApproveRelease() {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const approveRelease = async (
    escrowId: bigint,
    merkleProof: `0x${string}`[]
  ) => {
    return writeContract({
      address,
      abi: escrowRegistryABI,
      functionName: 'approveRelease',
      args: [escrowId, merkleProof],
    })
  }

  return {
    approveRelease,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

/**
 * Hook to release an escrow
 */
export function useReleaseEscrow() {
  const chainId = useChainId()
  const address = getContractAddress('escrowRegistry', chainId)

  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const releaseEscrow = async (escrowId: bigint) => {
    return writeContract({
      address,
      abi: escrowRegistryABI,
      functionName: 'release',
      args: [escrowId],
    })
  }

  return {
    releaseEscrow,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}
