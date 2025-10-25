/**
 * useVaultFactory Hook
 *
 * VaultFactory contract interaction hook
 * - Create vaults with CREATE2 deterministic deployment
 * - Predict vault addresses
 * - Query vault information by UUID/address
 */

import { useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { type Address, type Hash, parseAbi } from 'viem'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UUID, VaultIdentifier, CAIP10Address } from '@/packages/shared'
import { toCAIP10, createVaultIdentifier } from '@/packages/shared'

/**
 * VaultFactory ABI (minimal for CREATE2 operations)
 */
const VAULT_FACTORY_ABI = parseAbi([
  'function createVault(bytes16 uuid, address owner, string name) external returns (address vaultAddress)',
  'function predictVaultAddress(bytes16 uuid, address owner) external view returns (address)',
  'function getVaultByUuid(bytes16 uuid) external view returns (address vaultAddress, bool exists, bytes32 salt)',
  'function getUuidByVault(address vaultAddress) external view returns (bytes16 uuid, bool exists)',
  'function getCAIP10(address vaultAddress) external view returns (string caip10)',
  'function isVault(address vaultAddress) external view returns (bool)',
  'event VaultCreated(address indexed vaultAddress, bytes16 indexed uuid, address indexed owner, bytes32 salt, string caip10)',
])

/**
 * Hook configuration
 */
interface UseVaultFactoryConfig {
  factoryAddress?: Address
  enabled?: boolean
}

/**
 * Create vault parameters
 */
interface CreateVaultParams {
  uuid: UUID
  name: string
  owner?: Address
}

/**
 * VaultFactory hook return type
 */
interface UseVaultFactoryReturn {
  // Mutations
  createVault: (params: CreateVaultParams) => Promise<{ address: Address; hash: Hash }>
  isCreating: boolean
  createError: Error | null

  // Queries
  predictAddress: (uuid: UUID, owner?: Address) => Promise<Address | null>
  getVaultByUuid: (uuid: UUID) => Promise<{ address: Address; exists: boolean; salt: Hash } | null>
  getUuidByVault: (address: Address) => Promise<{ uuid: string; exists: boolean } | null>
  getCAIP10: (address: Address) => Promise<CAIP10Address | null>
  isVault: (address: Address) => Promise<boolean>

  // State
  factoryAddress: Address | undefined
  chainId: number | undefined
}

/**
 * Default factory addresses per chain
 */
const DEFAULT_FACTORY_ADDRESSES: Record<number, Address> = {
  8453: '0x0000000000000000000000000000000000000000' as Address, // Base - TODO: Update after deployment
  84532: '0x0000000000000000000000000000000000000000' as Address, // Base Sepolia - TODO: Update
}

/**
 * Convert UUID string to bytes16
 */
function uuidToBytes16(uuid: UUID): `0x${string}` {
  const hex = uuid.replace(/-/g, '')
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID length: ${hex.length}`)
  }
  return `0x${hex}`
}

/**
 * Convert bytes16 to UUID string
 */
function bytes16ToUuid(bytes: `0x${string}`): UUID {
  const hex = bytes.slice(2) // Remove 0x
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

/**
 * useVaultFactory Hook
 */
export function useVaultFactory(config: UseVaultFactoryConfig = {}): UseVaultFactoryReturn {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const queryClient = useQueryClient()

  // Determine factory address
  const factoryAddress = config.factoryAddress || DEFAULT_FACTORY_ADDRESSES[chainId]

  /**
   * Create Vault Mutation
   */
  const {
    mutateAsync: createVault,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: async (params: CreateVaultParams): Promise<{ address: Address; hash: Hash }> => {
      if (!walletClient || !publicClient || !factoryAddress) {
        throw new Error('Wallet not connected or factory address not configured')
      }

      const owner = params.owner || userAddress
      if (!owner) {
        throw new Error('Owner address is required')
      }

      // Convert UUID to bytes16
      const uuidBytes = uuidToBytes16(params.uuid)

      // Simulate transaction first
      const { request } = await publicClient.simulateContract({
        address: factoryAddress,
        abi: VAULT_FACTORY_ABI,
        functionName: 'createVault',
        args: [uuidBytes, owner, params.name],
        account: walletClient.account,
      })

      // Execute transaction
      const hash = await walletClient.writeContract(request)

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Parse VaultCreated event to get address
      const log = receipt.logs.find((log) => {
        try {
          const decoded = publicClient.decodeEventLog({
            abi: VAULT_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          })
          return decoded.eventName === 'VaultCreated'
        } catch {
          return false
        }
      })

      if (!log) {
        throw new Error('VaultCreated event not found in transaction receipt')
      }

      const decoded = publicClient.decodeEventLog({
        abi: VAULT_FACTORY_ABI,
        data: log.data,
        topics: log.topics,
      })

      const vaultAddress = (decoded.args as any).vaultAddress as Address

      return { address: vaultAddress, hash }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
    },
  })

  /**
   * Predict vault address
   */
  const predictAddress = useCallback(
    async (uuid: UUID, owner?: Address): Promise<Address | null> => {
      if (!publicClient || !factoryAddress) return null

      const ownerAddress = owner || userAddress
      if (!ownerAddress) return null

      try {
        const uuidBytes = uuidToBytes16(uuid)
        const address = await publicClient.readContract({
          address: factoryAddress,
          abi: VAULT_FACTORY_ABI,
          functionName: 'predictVaultAddress',
          args: [uuidBytes, ownerAddress],
        })
        return address as Address
      } catch (error) {
        console.error('Failed to predict vault address:', error)
        return null
      }
    },
    [publicClient, factoryAddress, userAddress]
  )

  /**
   * Get vault by UUID
   */
  const getVaultByUuid = useCallback(
    async (uuid: UUID): Promise<{ address: Address; exists: boolean; salt: Hash } | null> => {
      if (!publicClient || !factoryAddress) return null

      try {
        const uuidBytes = uuidToBytes16(uuid)
        const result = await publicClient.readContract({
          address: factoryAddress,
          abi: VAULT_FACTORY_ABI,
          functionName: 'getVaultByUuid',
          args: [uuidBytes],
        })

        const [vaultAddress, exists, salt] = result as [Address, boolean, Hash]

        return { address: vaultAddress, exists, salt }
      } catch (error) {
        console.error('Failed to get vault by UUID:', error)
        return null
      }
    },
    [publicClient, factoryAddress]
  )

  /**
   * Get UUID by vault address
   */
  const getUuidByVault = useCallback(
    async (address: Address): Promise<{ uuid: string; exists: boolean } | null> => {
      if (!publicClient || !factoryAddress) return null

      try {
        const result = await publicClient.readContract({
          address: factoryAddress,
          abi: VAULT_FACTORY_ABI,
          functionName: 'getUuidByVault',
          args: [address],
        })

        const [uuidBytes, exists] = result as [`0x${string}`, boolean]

        return { uuid: bytes16ToUuid(uuidBytes), exists }
      } catch (error) {
        console.error('Failed to get UUID by vault:', error)
        return null
      }
    },
    [publicClient, factoryAddress]
  )

  /**
   * Get CAIP-10 identifier
   */
  const getCAIP10 = useCallback(
    async (address: Address): Promise<CAIP10Address | null> => {
      if (!publicClient || !factoryAddress) return null

      try {
        const caip10 = await publicClient.readContract({
          address: factoryAddress,
          abi: VAULT_FACTORY_ABI,
          functionName: 'getCAIP10',
          args: [address],
        })

        return caip10 as CAIP10Address
      } catch (error) {
        console.error('Failed to get CAIP-10:', error)
        return null
      }
    },
    [publicClient, factoryAddress]
  )

  /**
   * Check if address is a vault
   */
  const isVault = useCallback(
    async (address: Address): Promise<boolean> => {
      if (!publicClient || !factoryAddress) return false

      try {
        const result = await publicClient.readContract({
          address: factoryAddress,
          abi: VAULT_FACTORY_ABI,
          functionName: 'isVault',
          args: [address],
        })

        return result as boolean
      } catch (error) {
        console.error('Failed to check if vault:', error)
        return false
      }
    },
    [publicClient, factoryAddress]
  )

  return {
    // Mutations
    createVault,
    isCreating,
    createError: createError as Error | null,

    // Queries
    predictAddress,
    getVaultByUuid,
    getUuidByVault,
    getCAIP10,
    isVault,

    // State
    factoryAddress,
    chainId,
  }
}
