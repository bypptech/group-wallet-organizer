/**
 * useDemoMode Hook
 *
 * Provides demo mode detection and action permission checking
 */

import { useMemo } from 'react';

export interface DemoConfig {
  allowedActions: string[];
  restrictedActions: string[];
  displayNames?: Record<string, string>;
}

export interface DemoModeState {
  isDemo: boolean;
  canPerformAction: (action: string) => boolean;
  demoMessage: string | null;
  demoConfig: DemoConfig | null;
  getDisplayName: (address: string) => string;
}

/**
 * Demo vault constant - matches backend
 */
export const DEMO_VAULT_ADDRESS = '0xDEMO000000000000000000000000000000000001';
export const DEMO_VAULT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Check if a vault is in demo mode
 */
export function useDemoMode(vault: any | null): DemoModeState {
  const isDemo = useMemo(() => {
    if (!vault) return false;
    return vault.isDemo === true || vault.address === DEMO_VAULT_ADDRESS;
  }, [vault]);

  const demoConfig = useMemo<DemoConfig | null>(() => {
    if (!isDemo || !vault?.metadata?.demoConfig) return null;
    return vault.metadata.demoConfig;
  }, [isDemo, vault]);

  const canPerformAction = useMemo(() => {
    return (action: string): boolean => {
      if (!isDemo) return true;
      if (!demoConfig) return false;

      // Check if action is explicitly restricted
      if (demoConfig.restrictedActions?.includes(action)) {
        return false;
      }

      // Check if action is explicitly allowed
      if (demoConfig.allowedActions?.includes(action)) {
        return true;
      }

      // Default: allow read actions, restrict write actions
      const writeActions = ['create', 'update', 'delete', 'approve', 'send', 'add', 'remove'];
      const isWriteAction = writeActions.some(verb => action.toLowerCase().includes(verb));

      return !isWriteAction;
    };
  }, [isDemo, demoConfig]);

  const demoMessage = useMemo(() => {
    if (!isDemo) return null;
    return "You're viewing demo data. Connect your wallet to create your own vault with full access.";
  }, [isDemo]);

  const getDisplayName = useMemo(() => {
    return (address: string): string => {
      if (!isDemo || !demoConfig?.displayNames) {
        return address;
      }
      return demoConfig.displayNames[address] || address;
    };
  }, [isDemo, demoConfig]);

  return {
    isDemo,
    canPerformAction,
    demoMessage,
    demoConfig,
    getDisplayName
  };
}

/**
 * Hook to get demo vault ID when no wallet is connected
 * Returns null - the wallet-demo page should use vaults[0] instead
 */
export function useDefaultVaultId(connectedAddress?: string): string | null {
  return useMemo(() => {
    // Always return null - let the page component use vaults[0] for demo mode
    return null;
  }, [connectedAddress]);
}
