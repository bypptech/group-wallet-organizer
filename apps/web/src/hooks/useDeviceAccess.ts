import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

interface DeviceAccessResponse {
  devices: string[];
  keys: Array<{
    keyId: string;
    device: string;
    keyName: string;
    keyStatus: string;
    authStatus: string;
  }>;
  totalKeys: number;
}

/**
 * ユーザーがアクセス可能なデバイス一覧を取得するカスタムフック
 *
 * 権限の変更を反映するタイミング:
 * - ウォレット接続時に自動取得
 * - ウィンドウフォーカス時に再取得
 * - 手動でrefetch()を呼び出した時
 * - Shareable Keys関連のアクション後に手動更新
 */
export const useDeviceAccess = () => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // ウォレット切断時にキャッシュをクリア
  useEffect(() => {
    if (!isConnected || !address) {
      console.log('[useDeviceAccess] Wallet disconnected, clearing cache');
      queryClient.removeQueries({ queryKey: ['deviceAccess'] });
    }
  }, [isConnected, address, queryClient]);

  const query = useQuery<DeviceAccessResponse>({
    queryKey: ['deviceAccess', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/shareable-keys/my-accessible-devices?address=${address}`;
      console.log('[useDeviceAccess] Fetching from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useDeviceAccess] API Error:', response.status, errorText);
        throw new Error(`Failed to fetch device access: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useDeviceAccess] Received data:', data);
      return data;
    },
    enabled: isConnected && !!address,
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
    staleTime: 60000, // 60秒間はキャッシュを使用（頻繁な再取得を防ぐ）
  });

  /**
   * 特定のデバイスへのアクセス権限をチェック
   */
  const hasAccessToDevice = (deviceId: string): boolean => {
    // ウォレット未接続時は常にfalse
    if (!isConnected || !address || !query.data) return false;

    // "all" デバイスへのアクセスがある場合は全デバイスにアクセス可能
    if (query.data.devices.includes('all')) return true;

    return query.data.devices.includes(deviceId);
  };

  /**
   * 少なくとも1つのデバイスへのアクセス権限があるかチェック
   */
  const hasAnyAccess = (): boolean => {
    // ウォレット未接続時は常にfalse
    if (!isConnected || !address) return false;
    return (query.data?.devices.length || 0) > 0;
  };

  return {
    devices: isConnected && address ? (query.data?.devices || []) : [],
    keys: isConnected && address ? (query.data?.keys || []) : [],
    totalKeys: isConnected && address ? (query.data?.totalKeys || 0) : 0,
    hasAccessToDevice,
    hasAnyAccess,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
