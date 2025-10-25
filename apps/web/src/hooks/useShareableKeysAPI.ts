import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ShareableKey {
  id: string;
  name: string;
  description: string;
  keyType: 'vault' | 'escrow' | 'custom';
  vaultId?: string;
  vaultAddress?: Address;
  vaultName?: string;
  sharedWith: number;
  expiresAt?: string;
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
  permissions: string[];
  shareUrl: string;
  usageCount: number;
  maxUses?: number;
  lastUsed?: string;
  createdBy: Address;
}

export interface ShareableKeyUsage {
  id: string;
  keyId: string;
  userAddress: Address;
  usedAt: string;
  action: string;
}

export interface CreateShareableKeyInput {
  name: string;
  description?: string;
  keyType: 'vault' | 'escrow' | 'custom';
  vaultId?: string;
  permissions: string[];
  expiresAt?: string;
  maxUses?: number;
}

// Get all shareable keys for the current user
export function useShareableKeysAPI(userAddress?: Address, options?: { vaultId?: string; isDemo?: boolean }) {
  console.log('[useShareableKeysAPI] Called with:', {
    userAddress,
    options,
    isDemo: options?.isDemo,
    vaultId: options?.vaultId,
    willFetchDemo: !!(options?.isDemo && options?.vaultId)
  });

  return useQuery({
    queryKey: ['shareable-keys', userAddress, options?.vaultId, options?.isDemo],
    queryFn: async (): Promise<ShareableKey[]> => {
      // Demo mode: fetch keys by vault ID
      if (options?.isDemo && options?.vaultId) {
        const url = `${API_BASE_URL}/shareable-keys?demo=true&vaultId=${options.vaultId}`;
        console.log('[useShareableKeysAPI] Fetching demo keys from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error('[useShareableKeysAPI] Demo fetch failed:', response.status);
          throw new Error('Failed to fetch demo shareable keys');
        }
        const data = await response.json();
        console.log('[useShareableKeysAPI] Demo keys response:', data);
        return Array.isArray(data) ? data : [];
      }

      if (!userAddress) {
        console.log('[useShareableKeysAPI] No userAddress, returning empty array');
        return [];
      }

      const url = `${API_BASE_URL}/shareable-keys?createdBy=${userAddress}`;
      console.log('[useShareableKeysAPI] Fetching keys from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch shareable keys');
      }
      const data = await response.json();
      console.log('[useShareableKeysAPI] Keys response:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userAddress || (options?.isDemo && !!options?.vaultId),
  });
}

// Get a single shareable key by ID
export function useShareableKeyAPI(keyId: string) {
  return useQuery({
    queryKey: ['shareable-key', keyId],
    queryFn: async (): Promise<ShareableKey> => {
      const response = await fetch(`${API_BASE_URL}/shareable-keys/${keyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shareable key');
      }
      return response.json();
    },
    enabled: !!keyId,
  });
}

// Get usage history for a shareable key
export function useShareableKeyUsageAPI(keyId: string) {
  return useQuery({
    queryKey: ['shareable-key-usage', keyId],
    queryFn: async (): Promise<ShareableKeyUsage[]> => {
      const response = await fetch(`${API_BASE_URL}/shareable-keys/${keyId}/usage`);
      if (!response.ok) {
        throw new Error('Failed to fetch key usage');
      }
      const data = await response.json();
      return data.usage || [];
    },
    enabled: !!keyId,
  });
}

// Create a new shareable key
export function useCreateShareableKeyAPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShareableKeyInput & { createdBy: Address }): Promise<ShareableKey> => {
      const response = await fetch(`${API_BASE_URL}/shareable-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create shareable key');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch keys list
      queryClient.invalidateQueries({ queryKey: ['shareable-keys', variables.createdBy] });
    },
  });
}

// Revoke a shareable key
export function useRevokeShareableKeyAPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/shareable-keys/${keyId}/revoke`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke shareable key');
      }
    },
    onSuccess: (_, keyId) => {
      // Invalidate specific key and keys list
      queryClient.invalidateQueries({ queryKey: ['shareable-key', keyId] });
      queryClient.invalidateQueries({ queryKey: ['shareable-keys'] });
    },
  });
}

// Use a shareable key (record usage)
export function useShareableKeyAPI_Use() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      keyId,
      userAddress,
      action,
    }: {
      keyId: string;
      userAddress: Address;
      action: string;
    }): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/shareable-keys/${keyId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to record key usage');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate key details and usage history
      queryClient.invalidateQueries({ queryKey: ['shareable-key', variables.keyId] });
      queryClient.invalidateQueries({ queryKey: ['shareable-key-usage', variables.keyId] });
    },
  });
}
