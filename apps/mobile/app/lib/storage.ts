/**
 * AsyncStorage wrapper for offline caching and data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  WALLET_SESSIONS: '@family_wallet:sessions',
  USER_SETTINGS: '@family_wallet:settings',
  CACHED_ESCROWS: '@family_wallet:escrows',
  CACHED_APPROVALS: '@family_wallet:approvals',
  CACHED_TIMELINE: '@family_wallet:timeline',
  CACHED_MEMBERS: '@family_wallet:members',
  LAST_SYNC: '@family_wallet:last_sync',
  BIOMETRIC_ENABLED: '@family_wallet:biometric_enabled',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

// Generic storage operations
export const storage = {
  /**
   * Get item from storage
   */
  async getItem<T = any>(key: StorageKey): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  /**
   * Set item in storage
   */
  async setItem<T = any>(key: StorageKey, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  /**
   * Remove item from storage
   */
  async removeItem(key: StorageKey): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Get multiple items
   */
  async multiGet(keys: StorageKey[]): Promise<Record<string, any>> {
    try {
      const storageKeys = keys.map((key) => STORAGE_KEYS[key]);
      const values = await AsyncStorage.multiGet(storageKeys);
      const result: Record<string, any> = {};

      values.forEach(([key, value]) => {
        const storageKey = Object.keys(STORAGE_KEYS).find(
          (k) => STORAGE_KEYS[k as StorageKey] === key
        ) as StorageKey;
        result[storageKey] = value ? JSON.parse(value) : null;
      });

      return result;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return {};
    }
  },

  /**
   * Set multiple items
   */
  async multiSet(items: Partial<Record<StorageKey, any>>): Promise<boolean> {
    try {
      const pairs = Object.entries(items).map(([key, value]) => [
        STORAGE_KEYS[key as StorageKey],
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs as [string, string][]);
      return true;
    } catch (error) {
      console.error('Error setting multiple items:', error);
      return false;
    }
  },
};

// Specific data type operations
export const walletStorage = {
  /**
   * Save WalletConnect sessions
   */
  async saveSessions(sessions: Record<string, any>): Promise<boolean> {
    return storage.setItem('WALLET_SESSIONS', sessions);
  },

  /**
   * Get WalletConnect sessions
   */
  async getSessions(): Promise<Record<string, any> | null> {
    return storage.getItem('WALLET_SESSIONS');
  },

  /**
   * Clear sessions
   */
  async clearSessions(): Promise<boolean> {
    return storage.removeItem('WALLET_SESSIONS');
  },
};

export const settingsStorage = {
  /**
   * Save user settings
   */
  async saveSettings(settings: {
    pushEnabled?: boolean;
    soundEnabled?: boolean;
    biometricEnabled?: boolean;
  }): Promise<boolean> {
    const current = await storage.getItem('USER_SETTINGS');
    const updated = { ...current, ...settings };
    return storage.setItem('USER_SETTINGS', updated);
  },

  /**
   * Get user settings
   */
  async getSettings(): Promise<{
    pushEnabled: boolean;
    soundEnabled: boolean;
    biometricEnabled: boolean;
  }> {
    const settings = await storage.getItem<{
      pushEnabled?: boolean;
      soundEnabled?: boolean;
      biometricEnabled?: boolean;
    }>('USER_SETTINGS');

    return {
      pushEnabled: settings?.pushEnabled ?? true,
      soundEnabled: settings?.soundEnabled ?? true,
      biometricEnabled: settings?.biometricEnabled ?? false,
    };
  },
};

export const cacheStorage = {
  /**
   * Cache escrows data
   */
  async cacheEscrows(escrows: any[]): Promise<boolean> {
    await storage.setItem('LAST_SYNC', Date.now());
    return storage.setItem('CACHED_ESCROWS', escrows);
  },

  /**
   * Get cached escrows
   */
  async getCachedEscrows(): Promise<any[] | null> {
    return storage.getItem('CACHED_ESCROWS');
  },

  /**
   * Cache approvals data
   */
  async cacheApprovals(approvals: any[]): Promise<boolean> {
    await storage.setItem('LAST_SYNC', Date.now());
    return storage.setItem('CACHED_APPROVALS', approvals);
  },

  /**
   * Get cached approvals
   */
  async getCachedApprovals(): Promise<any[] | null> {
    return storage.getItem('CACHED_APPROVALS');
  },

  /**
   * Cache timeline events
   */
  async cacheTimeline(events: any[]): Promise<boolean> {
    await storage.setItem('LAST_SYNC', Date.now());
    return storage.setItem('CACHED_TIMELINE', events);
  },

  /**
   * Get cached timeline
   */
  async getCachedTimeline(): Promise<any[] | null> {
    return storage.getItem('CACHED_TIMELINE');
  },

  /**
   * Cache members data
   */
  async cacheMembers(members: any[]): Promise<boolean> {
    await storage.setItem('LAST_SYNC', Date.now());
    return storage.setItem('CACHED_MEMBERS', members);
  },

  /**
   * Get cached members
   */
  async getCachedMembers(): Promise<any[] | null> {
    return storage.getItem('CACHED_MEMBERS');
  },

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<number | null> {
    return storage.getItem('LAST_SYNC');
  },

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<boolean> {
    const keys: StorageKey[] = [
      'CACHED_ESCROWS',
      'CACHED_APPROVALS',
      'CACHED_TIMELINE',
      'CACHED_MEMBERS',
      'LAST_SYNC',
    ];

    try {
      await Promise.all(keys.map((key) => storage.removeItem(key)));
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },
};

export const biometricStorage = {
  /**
   * Enable biometric authentication
   */
  async enableBiometric(): Promise<boolean> {
    return storage.setItem('BIOMETRIC_ENABLED', true);
  },

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<boolean> {
    return storage.setItem('BIOMETRIC_ENABLED', false);
  },

  /**
   * Check if biometric is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await storage.getItem<boolean>('BIOMETRIC_ENABLED');
    return enabled ?? false;
  },
};
