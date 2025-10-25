import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Address } from 'viem'
import type { Escrow } from '@/lib/graphql'
import type { PolicyConfig } from '@/hooks/usePolicyEditor'

/**
 * Vault状態の型定義
 */
export interface VaultState {
  // 現在のVault情報
  currentVault: {
    address: Address | null
    name: string | null
    owner: Address | null
    members: Address[]
    role: 'owner' | 'guardian' | 'requester' | 'viewer' | null
  }

  // エスクロー情報
  escrows: {
    items: Escrow[]
    isLoading: boolean
    lastFetched: number | null
  }

  // ポリシー情報
  policies: {
    items: PolicyConfig[]
    isLoading: boolean
    lastFetched: number | null
  }

  // 通知情報
  notifications: {
    unreadCount: number
    items: Notification[]
  }

  // UI状態
  ui: {
    sidebarOpen: boolean
    selectedEscrowId: string | null
    filter: {
      status: number | null
      type: number | null
    }
  }
}

/**
 * 通知の型定義
 */
export interface Notification {
  id: string
  type: 'approval_request' | 'escrow_created' | 'escrow_released' | 'policy_updated' | 'member_added'
  title: string
  message: string
  timestamp: number
  read: boolean
  escrowId?: string
  link?: string
}

/**
 * Vault状態管理のアクション
 */
interface VaultActions {
  // Vault情報の更新
  setCurrentVault: (vault: Partial<VaultState['currentVault']>) => void
  clearCurrentVault: () => void

  // エスクロー管理
  setEscrows: (escrows: Escrow[]) => void
  addEscrow: (escrow: Escrow) => void
  updateEscrow: (escrowId: string, updates: Partial<Escrow>) => void
  removeEscrow: (escrowId: string) => void
  setEscrowsLoading: (loading: boolean) => void

  // ポリシー管理
  setPolicies: (policies: PolicyConfig[]) => void
  addPolicy: (policy: PolicyConfig) => void
  updatePolicy: (policyId: string, updates: Partial<PolicyConfig>) => void
  removePolicy: (policyId: string) => void
  setPoliciesLoading: (loading: boolean) => void

  // 通知管理
  addNotification: (notification: Omit<Notification, 'id'>) => void
  markNotificationAsRead: (notificationId: string) => void
  clearNotifications: () => void
  removeNotification: (notificationId: string) => void

  // UI状態管理
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSelectedEscrowId: (escrowId: string | null) => void
  setFilter: (filter: Partial<VaultState['ui']['filter']>) => void
  clearFilter: () => void

  // リセット
  reset: () => void
}

/**
 * 初期状態
 */
const initialState: VaultState = {
  currentVault: {
    address: null,
    name: null,
    owner: null,
    members: [],
    role: null,
  },
  escrows: {
    items: [],
    isLoading: false,
    lastFetched: null,
  },
  policies: {
    items: [],
    isLoading: false,
    lastFetched: null,
  },
  notifications: {
    unreadCount: 0,
    items: [],
  },
  ui: {
    sidebarOpen: true,
    selectedEscrowId: null,
    filter: {
      status: null,
      type: null,
    },
  },
}

/**
 * Vault状態管理ストア
 */
export const useVaultStore = create<VaultState & VaultActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Vault情報の更新
      setCurrentVault: (vault) =>
        set((state) => ({
          currentVault: { ...state.currentVault, ...vault },
        })),

      clearCurrentVault: () =>
        set({
          currentVault: initialState.currentVault,
        }),

      // エスクロー管理
      setEscrows: (escrows) =>
        set({
          escrows: {
            items: escrows,
            isLoading: false,
            lastFetched: Date.now(),
          },
        }),

      addEscrow: (escrow) =>
        set((state) => ({
          escrows: {
            ...state.escrows,
            items: [escrow, ...state.escrows.items],
            lastFetched: Date.now(),
          },
        })),

      updateEscrow: (escrowId, updates) =>
        set((state) => ({
          escrows: {
            ...state.escrows,
            items: state.escrows.items.map((escrow) =>
              escrow.id === escrowId ? { ...escrow, ...updates } : escrow
            ),
            lastFetched: Date.now(),
          },
        })),

      removeEscrow: (escrowId) =>
        set((state) => ({
          escrows: {
            ...state.escrows,
            items: state.escrows.items.filter((escrow) => escrow.id !== escrowId),
            lastFetched: Date.now(),
          },
        })),

      setEscrowsLoading: (loading) =>
        set((state) => ({
          escrows: { ...state.escrows, isLoading: loading },
        })),

      // ポリシー管理
      setPolicies: (policies) =>
        set({
          policies: {
            items: policies,
            isLoading: false,
            lastFetched: Date.now(),
          },
        }),

      addPolicy: (policy) =>
        set((state) => ({
          policies: {
            ...state.policies,
            items: [...state.policies.items, policy],
            lastFetched: Date.now(),
          },
        })),

      updatePolicy: (policyId, updates) =>
        set((state) => ({
          policies: {
            ...state.policies,
            items: state.policies.items.map((policy, index) =>
              index.toString() === policyId ? { ...policy, ...updates } : policy
            ),
            lastFetched: Date.now(),
          },
        })),

      removePolicy: (policyId) =>
        set((state) => ({
          policies: {
            ...state.policies,
            items: state.policies.items.filter((_, index) => index.toString() !== policyId),
            lastFetched: Date.now(),
          },
        })),

      setPoliciesLoading: (loading) =>
        set((state) => ({
          policies: { ...state.policies, isLoading: loading },
        })),

      // 通知管理
      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
          }
          return {
            notifications: {
              items: [newNotification, ...state.notifications.items],
              unreadCount: state.notifications.unreadCount + 1,
            },
          }
        }),

      markNotificationAsRead: (notificationId) =>
        set((state) => {
          const notification = state.notifications.items.find((n) => n.id === notificationId)
          if (notification && !notification.read) {
            return {
              notifications: {
                items: state.notifications.items.map((n) =>
                  n.id === notificationId ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.notifications.unreadCount - 1),
              },
            }
          }
          return state
        }),

      clearNotifications: () =>
        set({
          notifications: {
            items: [],
            unreadCount: 0,
          },
        }),

      removeNotification: (notificationId) =>
        set((state) => {
          const notification = state.notifications.items.find((n) => n.id === notificationId)
          return {
            notifications: {
              items: state.notifications.items.filter((n) => n.id !== notificationId),
              unreadCount: notification && !notification.read
                ? Math.max(0, state.notifications.unreadCount - 1)
                : state.notifications.unreadCount,
            },
          }
        }),

      // UI状態管理
      setSidebarOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: open },
        })),

      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
        })),

      setSelectedEscrowId: (escrowId) =>
        set((state) => ({
          ui: { ...state.ui, selectedEscrowId: escrowId },
        })),

      setFilter: (filter) =>
        set((state) => ({
          ui: {
            ...state.ui,
            filter: { ...state.ui.filter, ...filter },
          },
        })),

      clearFilter: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            filter: initialState.ui.filter,
          },
        })),

      // リセット
      reset: () => set(initialState),
    }),
    {
      name: 'vault-storage', // ローカルストレージのキー名
      storage: createJSONStorage(() => localStorage),
      // シリアライズ時に除外するキー
      partialize: (state) => ({
        currentVault: state.currentVault,
        ui: {
          sidebarOpen: state.ui.sidebarOpen,
          filter: state.ui.filter,
        },
        // エスクローとポリシーはキャッシュしない（常に最新データを取得）
      }),
    }
  )
)

/**
 * Vaultストアからの選択的なデータ取得用フック
 */
export const useCurrentVault = () => useVaultStore((state) => state.currentVault)
export const useEscrows = () => useVaultStore((state) => state.escrows)
export const usePolicies = () => useVaultStore((state) => state.policies)
export const useNotifications = () => useVaultStore((state) => state.notifications)
export const useVaultUI = () => useVaultStore((state) => state.ui)

/**
 * フィルタリングされたエスクロー一覧を取得
 */
export const useFilteredEscrows = () => {
  const escrows = useEscrows()
  const filter = useVaultUI()

  const filtered = escrows.items.filter((escrow) => {
    if (filter.filter.status !== null && Number(escrow.status) !== filter.filter.status) {
      return false
    }
    if (filter.filter.type !== null && Number(escrow.escrowType) !== filter.filter.type) {
      return false
    }
    return true
  })

  return {
    ...escrows,
    items: filtered,
  }
}

/**
 * 未読通知の数を取得
 */
export const useUnreadNotificationCount = () =>
  useVaultStore((state) => state.notifications.unreadCount)
