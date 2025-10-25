import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import type { VaultIdentifier, MemberIdentifier } from '@shared/types/identifiers'
import { createVaultIdentifier, createMemberIdentifier } from '@shared/utils/identifiers'
import type { VaultMember } from './useVaultSettings'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * API Response型定義（バックエンドから返される生データ）
 */
interface VaultAPIResponse {
  id: string
  address: string
  name: string
  description: string
  chainId: number
  caip10: string
  uuid: string
  salt?: string
  factoryAddress?: string
  policyId?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  isDemo?: boolean
  demoReadOnly?: boolean
  members?: MemberAPIResponse[]
  pendingInvitesCount?: number
}

/**
 * Member API Response型定義（バックエンドから返される生データ）
 */
interface MemberAPIResponse {
  id: string
  vaultId: string
  address: string
  chainId: number
  name?: string
  email?: string
  role: 'owner' | 'guardian' | 'requester' | 'viewer' | 'approver'
  weight?: number
  joinedAt?: string
  addedAt?: string  // Backend uses addedAt instead of joinedAt
  addedBy?: string
  lastActivity?: string | null
  metadata?: Record<string, unknown>
}

/**
 * APIレスポンスからMemberIdentifierに変換
 */
function adaptMemberAPIResponseToIdentifier(
  apiMember: MemberAPIResponse,
  vaultChainId: number,
  vaultAddress: Address
): MemberIdentifier {
  return createMemberIdentifier({
    id: apiMember.id,
    vaultId: vaultAddress, // Use vault address, not UUID
    address: apiMember.address as Address,
    chainId: apiMember.chainId || vaultChainId,
    role: apiMember.role,
    weight: apiMember.weight,
    displayName: apiMember.metadata?.displayName as string | undefined || apiMember.name,
    joinedAt: apiMember.joinedAt || apiMember.addedAt,  // Support both field names
    addedBy: apiMember.addedBy as Address | undefined,
  })
}

/**
 * 拡張Member型（MemberIdentifier + 追加データ）
 */
export interface ExtendedMember extends MemberIdentifier {
  email?: string
  lastActivity?: string | null
}

/**
 * Vault統計情報の型定義
 */
export interface VaultStats {
  totalMembers: number
  totalEscrows: number
  pendingApprovals: number
  totalVolume?: string
  totalBalance?: string
  requiredApprovals?: number
}

/**
 * APIレスポンスからVaultIdentifierに変換
 */
function adaptVaultAPIResponseToIdentifier(apiVault: VaultAPIResponse): VaultIdentifier {
  return createVaultIdentifier({
    address: apiVault.address as `0x${string}`,
    chainId: apiVault.chainId,
    name: apiVault.name,
    uuid: apiVault.uuid,
    salt: apiVault.salt as `0x${string}` | undefined,
    factoryAddress: apiVault.factoryAddress as `0x${string}` | undefined,
  })
}

/**
 * 拡張Vault型（VaultIdentifier + 追加データ）
 */
export interface ExtendedVault extends VaultIdentifier {
  id: string // Database ID
  description?: string
  policyId?: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  members?: ExtendedMember[] // Members array (included in /vaults API response)
  pendingInvitesCount?: number // Pending invites count (included in /vaults API response)
}

/**
 * APIレスポンスから拡張Vault型に変換
 */
function adaptVaultAPIResponseToExtended(apiVault: any): ExtendedVault {
  console.log('[adaptVaultAPIResponseToExtended] Input apiVault:', {
    id: apiVault.id,
    address: apiVault.address,
    chainId: apiVault.chainId,
    name: apiVault.name,
    uuid: apiVault.uuid,
    hasMembers: !!apiVault.members,
    membersCount: apiVault.members?.length,
  });

  try {
    const identifier = adaptVaultAPIResponseToIdentifier(apiVault)
    console.log('[adaptVaultAPIResponseToExtended] Identifier created:', identifier);

    // Convert members if present
    // Pass vault address (not vaultId UUID) to member adapter
    const members = apiVault.members?.map((m: MemberAPIResponse) => {
      try {
        return adaptMemberAPIResponseToIdentifier(m, apiVault.chainId, apiVault.address);
      } catch (error) {
        console.error('[adaptVaultAPIResponseToExtended] Failed to convert member:', m.address, error);
        return null;
      }
    }).filter((m): m is NonNullable<typeof m> => m !== null);

    console.log('[adaptVaultAPIResponseToExtended] Converted members:', members?.length || 0);

    const result = {
      ...identifier,
      id: apiVault.id,
      description: apiVault.description,
      policyId: apiVault.policyId,
      createdAt: apiVault.createdAt,
      updatedAt: apiVault.updatedAt,
      metadata: apiVault.metadata,
      members: members, // Include members array
      pendingInvitesCount: apiVault.pendingInvitesCount || 0, // Include pending invites count
      isDemo: apiVault.isDemo || false, // Include demo mode flag
      demoReadOnly: apiVault.demoReadOnly || false, // Include demo read-only flag
    }

    console.log('[adaptVaultAPIResponseToExtended] Result:', result);
    return result;
  } catch (error) {
    console.error('[adaptVaultAPIResponseToExtended] ERROR:', error);
    console.error('[adaptVaultAPIResponseToExtended] apiVault full data:', apiVault);
    throw error;
  }
}

/**
 * 単一Vault情報を取得するフック
 * @returns VaultIdentifierを含む拡張Vault情報
 */
export const useVault = (vaultId?: string) => {
  console.log('[useVault] Hook called with vaultId:', vaultId);

  const {
    data: vaultData,
    isLoading,
    error,
    refetch: fetchVault,
  } = useQuery<ExtendedVault>({
    queryKey: ['vault', vaultId],
    queryFn: async () => {
      console.log('[useVault] queryFn called, vaultId:', vaultId);
      if (!vaultId) {
        console.error('[useVault] ERROR: vaultId is undefined in queryFn!');
        throw new Error('Vault ID is required');
      }

      console.log('[useVault] Fetching vault from API:', `${API_BASE_URL}/vaults/${vaultId}`);
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`)
      if (!response.ok) {
        console.error('[useVault] API request failed:', response.status, response.statusText);
        throw new Error('Failed to fetch vault')
      }
      const responseData = await response.json()

      // Debug: Log the API response
      console.log('[useVault] API Response for fetchVault:', responseData)

      // Handle API response structure: { vault, members } or direct vault object
      const apiVault: VaultAPIResponse = responseData.vault || responseData

      return adaptVaultAPIResponseToExtended(apiVault)
    },
    enabled: !!vaultId,
    retry: false,
  })

  console.log('[useVault] Query result:', { vaultData, isLoading, error });

  // Extract members from the cached vault response
  // Since /vaults/:id already returns { vault, members }, we use that data
  const { data: cachedVaultResponse } = useQuery<{ vault: VaultAPIResponse; members: VaultMember[] }>({
    queryKey: ['vault-full', vaultId],
    queryFn: async () => {
      if (!vaultId) throw new Error('Vault ID is required');

      console.log('[useVault] Fetching full vault data (vault + members):', `${API_BASE_URL}/vaults/${vaultId}`);
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vault')
      }
      return response.json()
    },
    enabled: !!vaultId,
    retry: false,
  })

  const members = cachedVaultResponse?.members || []
  console.log('[useVault] Extracted members from cache:', members);

  return {
    vault: vaultData,
    members,
    isLoading: isLoading,
    error,
    fetchVault,
    fetchMembers: fetchVault, // Refetching vault will also update members
  }
}

/**
 * Vault統計情報を取得するフック
 */
export const useVaultStats = (vaultId?: string): VaultStats => {
  const { data: stats } = useQuery<VaultStats>({
    queryKey: ['vault', vaultId, 'stats'],
    queryFn: async () => {
      if (!vaultId) {
        return {
          totalMembers: 0,
          totalEscrows: 0,
          pendingApprovals: 0,
        }
      }

      try {
        const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/stats`)
        if (!response.ok) {
          return {
            totalMembers: 0,
            totalEscrows: 0,
            pendingApprovals: 0,
          }
        }
        return response.json()
      } catch (error) {
        return {
          totalMembers: 0,
          totalEscrows: 0,
          pendingApprovals: 0,
        }
      }
    },
    enabled: !!vaultId,
    retry: false,
  })

  return stats || {
    totalMembers: 0,
    totalEscrows: 0,
    pendingApprovals: 0,
  }
}

/**
 * Vault一覧を取得するフック
 * @returns VaultIdentifierを含む拡張Vault配列
 */
export const useVaults = (userAddress?: Address) => {
  const {
    data: vaults = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ExtendedVault[]>({
    queryKey: ['vaults', userAddress],
    queryFn: async () => {
      // If no address, fetch demo vaults
      const fetchUrl = !userAddress
        ? `${API_BASE_URL}/vaults?demo=true` // Fetch demo vaults when no wallet connected
        : `${API_BASE_URL}/vaults?address=${userAddress}` // Filter by address

      console.log('[useVaults] ===== FETCHING VAULTS =====')
      console.log('[useVaults] userAddress:', userAddress)
      console.log('[useVaults] fetchUrl:', fetchUrl)

      const response = await fetch(fetchUrl)
      console.log('[useVaults] Response status:', response.status, response.statusText)

      if (!response.ok) {
        console.error('[useVaults] API request failed:', response.status, response.statusText)
        throw new Error('Failed to fetch vaults')
      }

      const data = await response.json()
      console.log('[useVaults] Raw API response:', data)

      const apiVaults: VaultAPIResponse[] = data.vaults || []
      console.log('[useVaults] API vaults count:', apiVaults.length)

      // Debug: Log the API response with members info
      console.log('[useVaults] API vaults detail:', apiVaults.map(v => ({
        id: v.id,
        name: v.name,
        address: v.address,
        isDemo: v.isDemo,
        hasMembers: !!v.members,
        membersCount: v.members?.length,
        membersList: v.members?.map(m => ({ address: m.address, role: m.role, name: m.name, displayName: m.metadata?.displayName }))
      })))

      const extendedVaults = apiVaults.map(adaptVaultAPIResponseToExtended)

      // Debug: Log after adaptation
      console.log('[useVaults] After adaptation:', extendedVaults.map(v => ({
        id: v.id,
        name: v.name,
        address: v.address,
        hasMembers: !!v.members,
        membersCount: v.members?.length
      })))
      console.log('[useVaults] ===== FETCH COMPLETE =====')

      return extendedVaults
    },
    enabled: true, // Always enabled in dev mode, even without address
    retry: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  })

  return {
    vaults,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Vault作成のパラメータ型
 */
export interface CreateVaultParams {
  name: string
  description?: string
  address: Address  // Vault contract address
  creatorAddress: Address
  chainId?: number
  requiredWeight?: number
  metadata?: Record<string, any>  // Allow passing custom metadata including type
}

/**
 * 新しいVaultを作成するフック
 */
export const useCreateVault = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateVaultParams): Promise<ExtendedVault> => {
      // Generate vaultId (bytes32) from address
      const vaultId = `0x${params.address.slice(2).padStart(64, '0')}`
      const chainId = params.chainId || 84532 // Default to Base Sepolia

      // APIが期待する形式に変換
      const apiParams = {
        vaultId,
        name: params.name,
        description: params.description || '',
        address: params.address,
        chainId,
        metadata: {
          creatorAddress: params.creatorAddress,
          requiredWeight: params.requiredWeight,
          // Merge any additional metadata passed from the component
          ...params.metadata,
        }
      }

      const response = await fetch(`${API_BASE_URL}/vaults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiParams),
      })

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      if (!response.ok) {
        if (isJson) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create vault')
        } else {
          const text = await response.text()
          throw new Error(`Failed to create vault: ${text.substring(0, 100)}`)
        }
      }

      if (!isJson) {
        const text = await response.text()
        throw new Error(`Expected JSON response but got: ${text.substring(0, 100)}`)
      }

      const responseData = await response.json()

      // Debug: Log the API response
      console.log('API Response for createVault:', responseData)

      // API returns { vault: {...} }, extract the vault object
      const apiVault: VaultAPIResponse = responseData.vault || responseData

      // Ensure address field exists (fallback to address from request)
      if (!apiVault.address && params.address) {
        console.warn('API did not return address field, using address from request')
        apiVault.address = params.address
      }

      return adaptVaultAPIResponseToExtended(apiVault)
    },
    onSuccess: (newVault, variables) => {
      // Invalidate vaults query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['vaults', variables.creatorAddress] })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
    },
  })
}

/**
 * Vault更新のパラメータ型
 */
export interface UpdateVaultParams {
  vaultId: string
  policyId?: string
  name?: string
  description?: string
  metadata?: Record<string, unknown>
}

/**
 * Vaultを更新するフック
 */
export const useUpdateVault = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateVaultParams): Promise<ExtendedVault> => {
      const { vaultId, ...updateData } = params
      console.log('[useUpdateVault] Sending PATCH request:', { vaultId, updateData });

      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[useUpdateVault] Request failed:', error);
        throw new Error(error.error || 'Failed to update vault')
      }

      const responseData = await response.json()
      console.log('[useUpdateVault] Response received:', responseData);

      // API response now includes both vault and members
      const apiVault: VaultAPIResponse = responseData.vault || responseData
      return adaptVaultAPIResponseToExtended(apiVault)
    },
    onSuccess: (updatedVault) => {
      // Invalidate vault queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['vault', updatedVault.id] })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
    },
  })
}
