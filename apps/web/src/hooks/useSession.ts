/**
 * useSession Hook
 *
 * User authentication session management
 * - Create and manage JWT sessions
 * - Validate session tokens
 * - Handle session expiration
 * - CSRF protection via session tracking
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useChainId, useSignMessage } from 'wagmi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Session data structure
 */
export interface Session {
  id: string
  userAddress: Address
  chainId: number
  token: string
  expiresAt: string
  createdAt: string
  lastAccessedAt: string
}

/**
 * Session creation response
 */
interface CreateSessionResponse {
  session: Session
  token: string
}

/**
 * Session validation response
 */
interface ValidateSessionResponse {
  valid: boolean
  session?: Session
  error?: string
}

/**
 * useSession Hook
 */
export function useSession() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const queryClient = useQueryClient()

  // Local state for session token
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('session_token')
  })

  /**
   * Save session token to localStorage
   */
  const saveToken = useCallback((token: string) => {
    localStorage.setItem('session_token', token)
    setSessionToken(token)
  }, [])

  /**
   * Clear session token
   */
  const clearToken = useCallback(() => {
    localStorage.removeItem('session_token')
    setSessionToken(null)
  }, [])

  /**
   * Create session mutation
   */
  const {
    mutateAsync: createSession,
    isPending: isCreatingSession,
    error: createSessionError,
  } = useMutation({
    mutationFn: async (): Promise<CreateSessionResponse> => {
      if (!userAddress) {
        throw new Error('Wallet not connected')
      }

      // Create message to sign for authentication
      const message = `Sign this message to authenticate with Family Wallet\n\nAddress: ${userAddress}\nChain ID: ${chainId}\nTimestamp: ${Date.now()}`

      // Request signature from user
      const signature = await signMessageAsync({ message })

      // Send authentication request to API
      const response = await fetch(`${API_BASE_URL}/auth/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          chainId,
          message,
          signature,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create session')
      }

      const data: CreateSessionResponse = await response.json()

      // Save token locally
      saveToken(data.token)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  /**
   * Validate current session
   */
  const {
    data: sessionValidation,
    isLoading: isValidating,
    error: validationError,
    refetch: revalidateSession,
  } = useQuery<ValidateSessionResponse>({
    queryKey: ['session', 'validate', sessionToken],
    queryFn: async (): Promise<ValidateSessionResponse> => {
      if (!sessionToken) {
        return { valid: false, error: 'No session token' }
      }

      const response = await fetch(`${API_BASE_URL}/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      })

      if (!response.ok) {
        clearToken()
        return { valid: false, error: 'Invalid session' }
      }

      const data: ValidateSessionResponse = await response.json()

      if (!data.valid) {
        clearToken()
      }

      return data
    },
    enabled: !!sessionToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Revalidate every 10 minutes
  })

  /**
   * Logout mutation
   */
  const {
    mutateAsync: logout,
    isPending: isLoggingOut,
  } = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!sessionToken) return

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      })

      clearToken()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  /**
   * Refresh session mutation
   */
  const {
    mutateAsync: refreshSession,
    isPending: isRefreshing,
  } = useMutation({
    mutationFn: async (): Promise<Session> => {
      if (!sessionToken) {
        throw new Error('No active session')
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to refresh session')
      }

      const data: { session: Session } = await response.json()
      return data.session
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  /**
   * Auto-create session on wallet connection
   */
  useEffect(() => {
    if (userAddress && !sessionToken && !isCreatingSession) {
      // Optionally auto-create session
      // createSession()
    }
  }, [userAddress, sessionToken, isCreatingSession])

  /**
   * Clear session on wallet disconnection
   */
  useEffect(() => {
    if (!userAddress && sessionToken) {
      clearToken()
    }
  }, [userAddress, sessionToken, clearToken])

  /**
   * Handle chain change
   */
  useEffect(() => {
    const currentSession = sessionValidation?.session
    if (currentSession && currentSession.chainId !== chainId && sessionToken) {
      // Chain changed - need to migrate or recreate session
      console.log('Chain changed, session may need to be recreated')
      // Could automatically call migrateSession API here
    }
  }, [chainId, sessionValidation, sessionToken])

  // Computed values
  const isAuthenticated = !!sessionToken && sessionValidation?.valid === true
  const session = sessionValidation?.session
  const isExpired = session
    ? new Date(session.expiresAt) < new Date()
    : false

  return {
    // State
    session,
    sessionToken,
    isAuthenticated,
    isExpired,

    // Loading states
    isCreatingSession,
    isValidating,
    isLoggingOut,
    isRefreshing,

    // Errors
    createSessionError: createSessionError as Error | null,
    validationError: validationError as Error | null,

    // Actions
    createSession,
    logout,
    refreshSession,
    revalidateSession,
    clearToken,

    // Utilities
    getAuthHeaders: () => ({
      Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
    }),
  }
}

/**
 * Hook for protected API requests with session token
 */
export function useAuthenticatedFetch() {
  const { sessionToken, isAuthenticated } = useSession()

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!isAuthenticated || !sessionToken) {
        throw new Error('Not authenticated')
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        throw new Error('Session expired')
      }

      return response
    },
    [sessionToken, isAuthenticated]
  )

  return { authenticatedFetch, isAuthenticated }
}
