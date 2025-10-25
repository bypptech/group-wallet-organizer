import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Web3/Blockchain専用のQueryClient設定
 * The GraphやContract読み取りに最適化
 */
export const web3QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // デフォルトのキャッシュ戦略
      staleTime: 10000, // 10秒間はキャッシュを新鮮とみなす
      gcTime: 5 * 60 * 1000, // 5分間キャッシュを保持

      // リアルタイム更新設定
      refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
      refetchOnReconnect: true, // ネットワーク再接続時に再取得
      refetchOnMount: true, // マウント時に再取得

      // エラー時のリトライ設定
      retry: 2, // 2回までリトライ
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // ネットワークモード
      networkMode: 'online', // オンライン時のみクエリ実行
    },
    mutations: {
      retry: 1, // トランザクション失敗時は1回リトライ
      networkMode: 'online',
    },
  },
});

/**
 * クエリキーのプリフィックス定義
 */
export const queryKeys = {
  // The Graph関連
  escrows: (vaultAddress?: string) => ['escrows', vaultAddress].filter(Boolean),
  escrowById: (escrowId: string) => ['escrow', escrowId],
  escrowStats: (vaultAddress?: string) => ['escrowStats', vaultAddress].filter(Boolean),
  policies: (vaultAddress?: string) => ['policies', vaultAddress].filter(Boolean),
  policyById: (policyId: string) => ['policy', policyId],

  // Contract読み取り
  approvalState: (escrowId: string) => ['approvalState', escrowId],
  escrowDetail: (escrowId: string) => ['escrowDetail', escrowId],
  vaultMembers: (vaultAddress: string) => ['vaultMembers', vaultAddress],

  // ユーザー関連
  userEscrows: (userAddress?: string) => ['userEscrows', userAddress].filter(Boolean),
  userNotifications: (userAddress?: string) => ['userNotifications', userAddress].filter(Boolean),
} as const;
