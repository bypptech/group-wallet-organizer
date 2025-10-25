/**
 * Custom hook for WalletConnect integration
 */

import { useState, useEffect, useCallback } from 'react';
import { IWeb3Wallet } from '@walletconnect/web3wallet';
import {
  initializeWalletConnect,
  pairWithUri,
  getActiveSessions,
  disconnectSession as wcDisconnectSession,
} from '../lib/walletconnect';
import { walletStorage } from '../lib/storage';

export const useWalletConnect = () => {
  const [web3wallet, setWeb3wallet] = useState<IWeb3Wallet | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WalletConnect on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const wallet = await initializeWalletConnect();
        setWeb3wallet(wallet);
        setIsInitialized(true);

        // Get active sessions
        const activeSessions = getActiveSessions();
        setSessions(activeSessions);

        // Save sessions to storage
        await walletStorage.saveSessions(activeSessions);
      } catch (err) {
        console.error('Failed to initialize WalletConnect:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Pair with dApp using URI
  const pair = useCallback(async (uri: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await pairWithUri(uri);

      // Update sessions
      const activeSessions = getActiveSessions();
      setSessions(activeSessions);

      // Save to storage
      await walletStorage.saveSessions(activeSessions);
    } catch (err) {
      console.error('Failed to pair:', err);
      setError(err instanceof Error ? err.message : 'Failed to pair');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect a session
  const disconnect = useCallback(async (topic: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await wcDisconnectSession(topic);

      // Update sessions
      const activeSessions = getActiveSessions();
      setSessions(activeSessions);

      // Save to storage
      await walletStorage.saveSessions(activeSessions);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get connected accounts
  const getConnectedAccounts = useCallback(() => {
    const accounts: string[] = [];
    Object.values(sessions).forEach((session: any) => {
      if (session.namespaces?.eip155?.accounts) {
        accounts.push(...session.namespaces.eip155.accounts);
      }
    });
    return accounts;
  }, [sessions]);

  return {
    web3wallet,
    isInitialized,
    isLoading,
    error,
    sessions,
    pair,
    disconnect,
    getConnectedAccounts,
  };
};
