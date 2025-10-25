/**
 * useVaultIdentifier Hook
 *
 * Unified vault identifier management
 * - Fetch vault information by various identifiers (address, UUID, CAIP-10)
 * - Create VaultIdentifier objects
 * - Format vault identifiers for display
 */

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import type { Address } from 'viem'
import type { UUID, VaultIdentifier, CAIP10Address } from '@/packages/shared'
import {
  toCAIP10,
  parseCAIP10,
  createVaultIdentifier,
  shortenAddress,
  formatVaultDisplay,
} from '@/packages/shared'
import { useVaultFactory } from './useVaultFactory'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Vault data from API
 */
export interface VaultData {
  id: string
  address: Address
  chainId: number
  caip10: CAIP10Address
  uuid: UUID
  name: string
  description?: string
  salt?: string
  factoryAddress?: Address
  createdAt: string
  updatedAt: string
}

/**
 * Search parameters for vault lookup
 */
export type VaultSearchParams =
  | { address: Address; chainId?: number }
  | { uuid: UUID }
  | { caip10: CAIP10Address }

/**
 * Hook configuration
 */
interface UseVaultIdentifierConfig {
  enabled?: boolean
  staleTime?: number
}

/**
 * useVaultIdentifier Hook
 */
export function useVaultIdentifier(
  searchParams: VaultSearchParams,
  config: UseVaultIdentifierConfig = {}
) {
  const chainId = useChainId()
  const vaultFactory = useVaultFactory()

  /**
   * Determine query key based on search params
   */
  const getQueryKey = () => {
    if ('address' in searchParams) {
      return ['vault', 'by-address', searchParams.address, searchParams.chainId || chainId]
    }
    if ('uuid' in searchParams) {
      return ['vault', 'by-uuid', searchParams.uuid]
    }
    if ('caip10' in searchParams) {
      return ['vault', 'by-caip10', searchParams.caip10]
    }
    return ['vault', 'unknown']
  }

  /**
   * Fetch vault data from API
   */
  const {
    data: vaultData,
    isLoading,
    error,
    refetch,
  } = useQuery<VaultData>({
    queryKey: getQueryKey(),
    queryFn: async (): Promise<VaultData> => {
      let url = `${API_BASE_URL}/vaults`

      if ('address' in searchParams) {
        url += `/address/${searchParams.address}`
        if (searchParams.chainId) {
          url += `?chainId=${searchParams.chainId}`
        }
      } else if ('uuid' in searchParams) {
        url += `/uuid/${searchParams.uuid}`
      } else if ('caip10' in searchParams) {
        url += `/caip10/${encodeURIComponent(searchParams.caip10)}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch vault: ${response.statusText}`)
      }

      const data: VaultData = await response.json()
      return data
    },
    enabled: config.enabled !== false,
    staleTime: config.staleTime || 5 * 60 * 1000, // 5 minutes
  })

  /**
   * Create VaultIdentifier from vault data
   */
  const vaultIdentifier: VaultIdentifier | null = vaultData
    ? createVaultIdentifier(
        vaultData.address,
        vaultData.chainId,
        vaultData.uuid,
        vaultData.name,
        {
          salt: vaultData.salt as `0x${string}` | undefined,
          factoryAddress: vaultData.factoryAddress,
        }
      )
    : null

  /**
   * Format vault for display
   */
  const displayName = vaultIdentifier ? formatVaultDisplay(vaultIdentifier) : ''

  /**
   * Get CAIP-10 identifier
   */
  const caip10 = vaultData?.caip10 || null

  /**
   * Parse CAIP-10 if available
   */
  const parsedCAIP10 = caip10
    ? parseCAIP10(caip10)
    : null

  /**
   * Check if vault exists on-chain
   */
  const { data: existsOnChain } = useQuery({
    queryKey: ['vault', 'exists', vaultData?.address],
    queryFn: async () => {
      if (!vaultData?.address) return false
      return await vaultFactory.isVault(vaultData.address)
    },
    enabled: !!vaultData?.address,
  })

  return {
    // Data
    vaultData,
    vaultIdentifier,
    caip10,
    parsedCAIP10,

    // Display
    displayName,
    shortAddress: vaultData ? shortenAddress(vaultData.address) : '',

    // State
    isLoading,
    error: error as Error | null,
    exists: !!vaultData,
    existsOnChain: existsOnChain || false,

    // Actions
    refetch,
  }
}

/**
 * Hook to search for multiple vaults
 */
export function useVaults(filters?: {
  chainId?: number
  userAddress?: Address
}) {
  const chainId = useChainId()

  const {
    data: vaults,
    isLoading,
    error,
    refetch,
  } = useQuery<VaultData[]>({
    queryKey: ['vaults', 'list', filters?.chainId || chainId, filters?.userAddress],
    queryFn: async (): Promise<VaultData[]> => {
      let url = `${API_BASE_URL}/vaults`
      const params = new URLSearchParams()

      if (filters?.chainId) {
        params.append('chainId', filters.chainId.toString())
      }
      if (filters?.userAddress) {
        params.append('userAddress', filters.userAddress)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch vaults: ${response.statusText}`)
      }

      const data: VaultData[] = await response.json()
      return data
    },
  })

  /**
   * Convert all vaults to VaultIdentifiers
   */
  const vaultIdentifiers: VaultIdentifier[] =
    vaults?.map((vault) =>
      createVaultIdentifier(vault.address, vault.chainId, vault.uuid, vault.name, {
        salt: vault.salt as `0x${string}` | undefined,
        factoryAddress: vault.factoryAddress,
      })
    ) || []

  return {
    vaults,
    vaultIdentifiers,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}

/**
 * Hook to create VaultIdentifier from partial data
 */
export function useCreateVaultIdentifier() {
  const chainId = useChainId()

  const create = useCallback(
    (params: {
      address: Address
      uuid: UUID
      name: string
      chainId?: number
      salt?: `0x${string}`
      factoryAddress?: Address
    }): VaultIdentifier => {
      return createVaultIdentifier(
        params.address,
        params.chainId || chainId,
        params.uuid,
        params.name,
        {
          salt: params.salt,
          factoryAddress: params.factoryAddress,
        }
      )
    },
    [chainId]
  )

  return { create }
}

/**
 * Hook for CAIP-10 utilities
 */
export function useCAIP10() {
  const chainId = useChainId()

  const toCAIP = useCallback(
    (address: Address, chain?: number): CAIP10Address => {
      return toCAIP10(chain || chainId, address)
    },
    [chainId]
  )

  const parseCAIP = useCallback((caip10: CAIP10Address) => {
    return parseCAIP10(caip10)
  }, [])

  return {
    toCAIP10: toCAIP,
    parseCAIP10: parseCAIP,
    currentChainId: chainId,
  }
}
