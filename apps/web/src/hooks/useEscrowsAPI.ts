/**
 * Hook for fetching escrows from API (not blockchain)
 * Updated for Policy-Based Architecture (Payment & Collection Escrows)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Escrow,
  PaymentEscrow,
  CollectionEscrow,
  EscrowType,
  EscrowStatus,
  RecordCollectionPaymentParams,
  CollectionStats,
} from '@shared/types/escrow';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Re-export shared types for convenience
export type {
  Escrow,
  PaymentEscrow,
  CollectionEscrow,
  EscrowType,
  EscrowStatus,
  CollectionStats,
};

// Payment Escrow creation params
export interface CreatePaymentEscrowParams {
  type: 'payment';
  vaultId: string;
  policyId: string;
  name: string;
  description?: string;
  requester: string;
  recipient: string;
  token: string;
  totalAmount: string;
  target?: string;
  data?: string;
  reason?: string;
  deadline?: string;
  scheduledReleaseAt?: string;
  metadata?: Record<string, unknown>;
}

// Collection Escrow creation params
export interface CreateCollectionEscrowParams {
  type: 'collection';
  vaultId: string;
  policyId: string;
  name: string;
  description?: string;
  token: string;
  totalAmount: string;
  participants: {
    address: string;
    name?: string;
    allocatedAmount: string;
  }[];
  deadline?: string;
  metadata?: Record<string, unknown>;
}

export type CreateEscrowParams = CreatePaymentEscrowParams | CreateCollectionEscrowParams;

export interface UpdateEscrowParams {
  escrowId: string;
  name?: string;
  description?: string;
  status?: EscrowStatus;
  deadline?: string;
  metadata?: Record<string, unknown>;
}

export interface GetEscrowsParams {
  vaultId?: string;
  policyId?: string;
  type?: EscrowType;
  status?: EscrowStatus;
}

/**
 * Fetch escrows (with optional filters)
 */
export const useEscrowsAPI = (params?: GetEscrowsParams) => {
  return useQuery({
    queryKey: ['escrows', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.vaultId) {
        searchParams.append('vaultId', params.vaultId);
      }
      if (params?.policyId) {
        searchParams.append('policyId', params.policyId);
      }
      if (params?.type) {
        searchParams.append('type', params.type);
      }
      if (params?.status) {
        searchParams.append('status', params.status);
      }

      const url = `${API_BASE_URL}/escrows${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch escrows');
      }

      const data = await response.json();
      return data as { escrows: Escrow[] };
    },
  });
};

/**
 * Fetch a single escrow
 */
export const useEscrowAPI = (escrowId: string | undefined) => {
  return useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: async () => {
      if (!escrowId) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch escrow');
      }

      const data = await response.json();
      return data.escrow as Escrow;
    },
    enabled: !!escrowId,
  });
};

/**
 * Create a new escrow (Payment or Collection)
 */
export const useCreateEscrowAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEscrowParams) => {
      const response = await fetch(`${API_BASE_URL}/escrows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useEscrowsAPI] Create escrow failed:', error);
        if (error.details) {
          console.error('[useEscrowsAPI] Validation details:', error.details);
        }
        throw new Error(error.error || 'Failed to create escrow');
      }

      const data = await response.json();
      return data.escrow as Escrow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrows', { vaultId: variables.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
  });
};

/**
 * Update an escrow
 */
export const useUpdateEscrowAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateEscrowParams) => {
      const { escrowId, ...updateData } = params;

      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update escrow');
      }

      const data = await response.json();
      return data.escrow as Escrow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escrow', data.id] });
      queryClient.invalidateQueries({ queryKey: ['escrows', { vaultId: data.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
  });
};

/**
 * Record payment for Collection Escrow
 */
export const useRecordCollectionPaymentAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RecordCollectionPaymentParams & { escrowId: string }) => {
      const { escrowId, ...paymentData } = params;

      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      const data = await response.json();
      return data.escrow as CollectionEscrow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escrow', data.id] });
      queryClient.invalidateQueries({ queryKey: ['escrows', { vaultId: data.vaultId }] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
  });
};

/**
 * Calculate collection statistics
 */
export const calculateCollectionStats = (escrow: CollectionEscrow): CollectionStats => {
  const participants = escrow.participants || [];
  const totalParticipants = participants.length;
  const paidParticipants = participants.filter(p => p.status === 'paid').length;
  const pendingParticipants = participants.filter(
    p => p.status === 'pending' || p.status === 'partial'
  ).length;

  const totalAmount = BigInt(escrow.totalAmount);
  const collectedAmount = BigInt(escrow.collectedAmount || '0');
  const completionRate = totalAmount > 0n ? Number((collectedAmount * 100n) / totalAmount) : 0;

  return {
    totalParticipants,
    paidParticipants,
    pendingParticipants,
    totalAmount: escrow.totalAmount,
    collectedAmount: escrow.collectedAmount || '0',
    completionRate,
  };
};

/**
 * Approval Progress API Types
 */
export interface ApprovalProgress {
  currentApprovals: number;
  requiredApprovals: number;
  approvals: Array<{
    guardianId: string;
    guardianAddress: string;
    approvedAt: string;
    signature?: string;
    merkleProof?: string[];
  }>;
  isApproved: boolean;
}

/**
 * Get approval progress for an escrow
 */
export const useEscrowApprovalProgressAPI = (escrowId: string) => {
  return useQuery({
    queryKey: ['escrow-approvals', escrowId],
    queryFn: async (): Promise<ApprovalProgress> => {
      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/approvals`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch approval progress');
      }

      return response.json();
    },
    enabled: !!escrowId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

/**
 * Approve an escrow
 */
export const useApproveEscrowAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      escrowId: string;
      guardianId: string;
      guardianAddress: string;
      signature?: string;
    }) => {
      const { escrowId, ...approvalData } = params;

      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve escrow');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrow', variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ['escrow-approvals', variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
  });
};

/**
 * Validate escrow against policy
 */
export const useValidateEscrowAPI = (escrowId: string) => {
  return useQuery({
    queryKey: ['escrow-validation', escrowId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/validate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to validate escrow');
      }

      return response.json();
    },
    enabled: !!escrowId,
  });
};

/**
 * Timeline types
 */
export interface TimelineEvent {
  id: string;
  escrowId: string;
  eventType: string;
  actor: string;
  txHash?: string;
  userOpHash?: string;
  data?: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get timeline for an escrow
 */
export const useEscrowTimelineAPI = (escrowId: string) => {
  return useQuery({
    queryKey: ['escrow-timeline', escrowId],
    queryFn: async (): Promise<{ timeline: TimelineEvent[] }> => {
      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/timeline`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch timeline');
      }

      return response.json();
    },
    enabled: !!escrowId,
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

/**
 * Paymaster check types
 */
export interface PaymasterCheck {
  canSponsor: boolean;
  reason: string;
  balance: string;
  estimatedCost: string;
  token: string;
  enabled: boolean;
  healthStatus?: string;
  dailyUsage?: string;
  dailyLimit?: string;
  monthlyLimit?: string;
  autoRefillEnabled?: boolean;
  fallbackEnabled?: boolean;
}

/**
 * Get paymaster sponsorship check for an escrow
 */
export const useEscrowPaymasterCheckAPI = (escrowId: string) => {
  return useQuery({
    queryKey: ['escrow-paymaster-check', escrowId],
    queryFn: async (): Promise<PaymasterCheck> => {
      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/paymaster-check`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch paymaster check');
      }

      return response.json();
    },
    enabled: !!escrowId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
};

/**
 * Comments types
 */
export interface EscrowComment {
  id: string;
  escrowId: string;
  author: string;
  authorName?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get comments for an escrow
 */
export const useEscrowCommentsAPI = (escrowId: string) => {
  return useQuery({
    queryKey: ['escrow-comments', escrowId],
    queryFn: async (): Promise<{ comments: EscrowComment[]; total: number }> => {
      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/comments`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch comments');
      }

      return response.json();
    },
    enabled: !!escrowId,
    refetchInterval: 15000, // Poll every 15 seconds
  });
};

/**
 * Add a comment to an escrow
 */
export const useAddEscrowCommentAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      escrowId: string;
      content: string;
      author?: string;
      authorName?: string;
    }) => {
      const { escrowId, ...commentData } = params;

      const response = await fetch(`${API_BASE_URL}/escrows/${escrowId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to add comment');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrow-comments', variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ['escrow-timeline', variables.escrowId] });
    },
  });
};
