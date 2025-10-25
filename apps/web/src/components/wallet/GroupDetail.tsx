import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Users,
  Wallet,
  Settings,
  UserPlus,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Edit,
  Shield,
  Webhook,
  Key,
  Loader2,
  Clock,
  Mail,
  FileText,
  Plus,
  Sparkles,
  DollarSign,
  Calendar,
  Smartphone,
  Activity
} from 'lucide-react';
import { useVault, useVaultStats, type ExtendedMember } from '@/hooks/useVaults';
import { useInviteManager, usePendingInvites } from '@/hooks/useInviteManager';
import { useEscrowsAPI, type Escrow } from '@/hooks/useEscrowsAPI';
import { useVaultSettings } from '@/hooks/useVaultSettings';
import { useShareableKeysAPI } from '@/hooks/useShareableKeysAPI';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { VAULT_ROLES, getRoleBadgeColor, getAvailableRoles, type VaultRole } from '@/lib/constants/roles';
import { VaultIdentifierDisplay } from './VaultIdentifierDisplay';
import { MemberIdentifierDisplay, MemberRoleSummary } from './MemberIdentifierDisplay';
import { GroupHeader } from './GroupHeader';
import { createMemberIdentifier } from '@shared/utils/identifiers';
import type { Address } from 'viem';

interface GroupDetailProps {
  vaultId?: string;
  currentRole?: string;
  onNavigateToEscrowCreation?: (vaultId: string) => void;
  onNavigateToEscrowDetail?: (escrowId: string) => void;
  onNavigateToEscrowList?: (vaultId: string) => void;
  onNavigateToPolicyList?: (vaultId: string) => void;
  onNavigateToShareableKeyDetail?: (keyId: string) => void;
  onNavigateToIotControl?: (deviceId: string) => void;
  onNavigateBack?: () => void;
}

// Mock members converted to MemberIdentifier format
const mockMembers: ExtendedMember[] = [
  createMemberIdentifier({
    id: 'mem-001',
    vaultId: '0x636b998315e77408806CccFCC93af4D1179afc2f' as Address,
    address: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C' as Address,
    chainId: 84532,
    role: 'owner',
    displayName: 'John Smith',
    joinedAt: '2024-01-15',
  }),
  createMemberIdentifier({
    id: 'mem-002',
    vaultId: '0x636b998315e77408806CccFCC93af4D1179afc2f' as Address,
    address: '0x8f9e2c1b5a6d3e4f7c8a9b0c1d2e3f4a5b6c7d8e' as Address,
    chainId: 84532,
    role: 'approver',
    displayName: 'Mary Smith',
    joinedAt: '2024-01-20',
  }),
  createMemberIdentifier({
    id: 'mem-003',
    vaultId: '0x636b998315e77408806CccFCC93af4D1179afc2f' as Address,
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' as Address,
    chainId: 84532,
    role: 'requester',
    displayName: 'Tom Smith',
    joinedAt: '2024-02-01',
  }),
  createMemberIdentifier({
    id: 'mem-004',
    vaultId: '0x636b998315e77408806CccFCC93af4D1179afc2f' as Address,
    address: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b' as Address,
    chainId: 84532,
    role: 'viewer',
    displayName: 'Sarah Smith',
    joinedAt: '2024-12-24',
  }),
].map((member, index) => ({
  ...member,
  email: ['john@smith.com', 'mary@smith.com', 'tom@smith.com', 'sarah@smith.com'][index],
  lastActivity: ['2024-12-25 10:30:00', '2024-12-25 09:15:00', '2024-12-25 11:00:00', '2024-12-24 18:30:00'][index],
}));

export function GroupDetail({
  vaultId,
  currentRole = 'owner',
  onNavigateToEscrowCreation,
  onNavigateToEscrowDetail,
  onNavigateToEscrowList,
  onNavigateToPolicyList,
  onNavigateToShareableKeyDetail,
  onNavigateToIotControl,
  onNavigateBack,
}: GroupDetailProps) {
  // All useState hooks MUST be declared first at component top (React Hook rules)
  const [activeTab, setActiveTab] = useState<'general' | 'advanced'>('general');
  const [inviteLink, setInviteLink] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'guardian' | 'requester' | 'viewer'>('requester');
  const [inviteRole, setInviteRole] = useState<VaultRole>('requester');
  const [inviteExpiryDays, setInviteExpiryDays] = useState(7);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string>('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  // Paymaster states
  const [paymasterToken, setPaymasterToken] = useState<'USDC' | 'ETH' | 'JPYC'>('USDC');
  const [showPaymasterDialog, setShowPaymasterDialog] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymasterEnabled, setPaymasterEnabled] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false);
  const [refillThreshold, setRefillThreshold] = useState('');
  const [refillAmount, setRefillAmount] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  // Member Management states
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newRole, setNewRole] = useState<VaultRole>('requester');

  // Webhook Management states
  const [showAddWebhookDialog, setShowAddWebhookDialog] = useState(false);
  const [showEditWebhookDialog, setShowEditWebhookDialog] = useState(false);
  const [showDeleteWebhookDialog, setShowDeleteWebhookDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // API Key Management states
  const [showRotateApiKeyDialog, setShowRotateApiKeyDialog] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  // Other hooks
  const { toast } = useToast();
  const { address: walletAddress, isConnected } = useAccount();

  // Emoji avatars - Animal emoji selection based on address
  const avatarEmojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'];

  const getEmojiForAddress = (address: string): string => {
    // Use address hash to consistently get same emoji for same address
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarEmojis[hash % avatarEmojis.length];
  };

  // Vault data from API - MUST be called before any conditional returns (React Hook rules)
  const { vault, members: rawMembers, isLoading: isVaultLoading, error: vaultError, fetchVault } = useVault(vaultId);
  const stats = useVaultStats(vaultId);
  const {
    paymasterInfo,
    isLoadingPaymaster,
    updatePaymasterAsync,
    isUpdatingPaymaster,
    refetchPaymaster
  } = useVaultSettings(vaultId);

  // Populate paymaster form fields when data loads
  useEffect(() => {
    if (paymasterInfo) {
      setPaymasterEnabled(paymasterInfo.enabled);
      setPaymasterToken(paymasterInfo.token);
      setMonthlyLimit(paymasterInfo.monthlyLimit);
      setDailyLimit(paymasterInfo.dailyLimit);
      setAutoRefillEnabled(paymasterInfo.autoRefillEnabled);
      setRefillThreshold(paymasterInfo.refillThreshold);
      setRefillAmount(paymasterInfo.refillAmount);
      setFallbackEnabled(paymasterInfo.fallbackEnabled);
    }
  }, [paymasterInfo]);

  // Convert VaultMember to ExtendedMember format
  const members: ExtendedMember[] = useMemo(() => {
    if (!rawMembers || rawMembers.length === 0) return [];

    // vaultAddress is required for createMemberIdentifier
    const vaultAddress = vault?.address;
    if (!vaultAddress) {
      console.warn('[GroupDetail] Vault address not available, cannot create member identifiers');
      return [];
    }

    return (rawMembers || []).map((member: any) => {
      // If already in correct format, return as is
      if (member.shortAddress && member.caip10) {
        return member as ExtendedMember;
      }

      // Otherwise, convert from VaultMember to ExtendedMember
      // NOTE: vaultId parameter expects Address (0x...), not UUID
      return createMemberIdentifier({
        id: member.id || `mem-${member.address}`,
        vaultId: vaultAddress as Address,
        address: member.address as Address,
        chainId: vault?.chainId || 84532,
        role: member.role || 'viewer',
        weight: member.weight,
        displayName: member.name,
        joinedAt: member.joinedAt,
        addedBy: member.addedBy as Address | undefined,
      }) as ExtendedMember;
    });
  }, [rawMembers, vault]);

  // Debug: Log fetch status
  console.log('useVault status:', { vaultId, isVaultLoading, vaultError, hasVault: !!vault, membersCount: members.length });

  // Invite manager - use vault.address instead of vaultId
  const {
    isGenerating,
    createInviteWithSignature,
    error: inviteError,
  } = useInviteManager(vault?.id);

  // Pending invites
  const {
    invites: pendingInvites,
    isLoading: isLoadingInvites,
    revokeInvite,
  } = usePendingInvites(vault?.address);

  // Fetch escrows for this vault
  const { data: escrowsData, isLoading: isLoadingEscrows } = useEscrowsAPI({
    vaultId: vaultId,
  });

  // Fetch shareable keys for this vault
  const isDemo = vault?.isDemo || false;
  const { data: allShareableKeysData } = useShareableKeysAPI(walletAddress, {
    vaultId: isDemo ? vaultId : undefined,
    isDemo,
  });
  console.log('[GroupDetail] Shareable keys raw data:', allShareableKeysData, 'isArray:', Array.isArray(allShareableKeysData));

  // Handle different response formats
  let allShareableKeys: any[] = [];
  if (Array.isArray(allShareableKeysData)) {
    allShareableKeys = allShareableKeysData;
  } else if (allShareableKeysData && typeof allShareableKeysData === 'object' && 'keys' in allShareableKeysData) {
    allShareableKeys = Array.isArray((allShareableKeysData as any).keys) ? (allShareableKeysData as any).keys : [];
  }
  console.log('[GroupDetail] Extracted shareable keys:', allShareableKeys);

  const vaultShareableKeys = useMemo(() => {
    console.log('[GroupDetail] Filtering shareable keys:', {
      vaultId,
      vaultAddress: vault?.address,
      allKeysCount: allShareableKeys.length,
      allKeys: allShareableKeys.map(k => ({
        id: k.id,
        name: k.name,
        vaultId: k.vaultId,
        status: k.status
      }))
    });

    // Try matching both vaultId and vault.address
    const filtered = allShareableKeys.filter(key => {
      const matchById = key.vaultId === vaultId;
      const matchByAddress = vault?.address && key.vaultId === vault.address;
      const isActive = key.status === 'active';

      console.log('[GroupDetail] Key filter check:', {
        keyId: key.id,
        keyName: key.name,
        keyVaultId: key.vaultId,
        matchById,
        matchByAddress,
        isActive,
        willInclude: (matchById || matchByAddress) && isActive
      });

      return (matchById || matchByAddress) && isActive;
    });

    console.log('[GroupDetail] Filtered keys:', filtered.length);
    return filtered;
  }, [allShareableKeys, vaultId, vault?.address]);

  // Debug: Log vault and members data
  console.log('GroupDetail - Vault data:', { vaultId, vault, members, stats });
  console.log('GroupDetail - Shareable Keys:', vaultShareableKeys);

  // Use real data if available, otherwise fallback to mock data
  const displayMembers = members.length > 0 ? members : mockMembers;
  console.log('GroupDetail - Using members:', displayMembers.length > 0 ? 'API data' : 'mock data', displayMembers);

  // Calculate escrow statistics
  const escrowStats = useMemo(() => {
    const escrows = escrowsData?.escrows || [];
    return {
      pending: escrows.filter(e => e.status === 'submitted' || e.status === 'draft').length,
      approved: escrows.filter(e => e.status === 'approved').length,
      completed: escrows.filter(e => e.status === 'completed').length,
      total: escrows.length,
    };
  }, [escrowsData]);

  // Get recent escrows (latest 3)
  const recentEscrows = useMemo(() => {
    const escrows = escrowsData?.escrows || [];
    return escrows
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [escrowsData]);

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Status color and icon functions (matching EscrowList)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'submitted': return 'gradient-warning text-white hover-glow';
      case 'approved': return 'gradient-accent text-white hover-glow';
      case 'on-chain': return 'gradient-primary text-white hover-glow';
      case 'completed': return 'gradient-secondary text-white hover-glow';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'expired': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'glass border-white/20 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
      case 'submitted':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'on-chain':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Format amount for display (matching EscrowList)
  const getTokenDecimals = (tokenAddress: string): number => {
    const lowerToken = tokenAddress.toLowerCase();
    if (lowerToken.includes('usdc') || lowerToken.includes('usdt')) {
      return 6;
    }
    return 6; // Default to 6 decimals for USDC
  };

  const getTokenSymbol = (tokenAddress: string, decimals: number): string => {
    const lowerToken = tokenAddress.toLowerCase();
    if (lowerToken.includes('usdc')) return 'USDC';
    if (lowerToken.includes('usdt')) return 'USDT';
    return 'USDC'; // Default to USDC
  };

  const formatAmount = (amount: string, tokenAddress: string) => {
    try {
      const decimals = getTokenDecimals(tokenAddress);
      const symbol = getTokenSymbol(tokenAddress, decimals);

      // Always use 6-decimal formatting for USDC
      const amountBigInt = BigInt(amount);
      const divisor = BigInt(1000000); // 10^6
      const wholePart = amountBigInt / divisor;
      const fractionalPart = amountBigInt % divisor;

      // Format fractional part with leading zeros
      const fractionalStr = fractionalPart.toString().padStart(6, '0');
      // Take only first 2 decimal places for display
      const displayFractional = fractionalStr.slice(0, 2);

      return `${wholePart}.${displayFractional} ${symbol}`;
    } catch {
      return '0 USDC';
    }
  };

  // Generate new invite handler
  const handleGenerateInvite = async () => {
    console.log('=== INVITE GENERATION START ===');
    console.log('handleGenerateInvite called', { vault, vaultAddress: vault?.address, inviteRole, inviteExpiryDays });
    console.log('isConnected:', isConnected);
    console.log('walletAddress:', walletAddress);

    if (!vault?.address) {
      console.error('Vault address not available:', vault);
      toast({
        title: 'Vault not loaded',
        description: 'Please wait for vault data to load',
        variant: 'destructive',
      });
      return;
    }

    console.log('Setting isGeneratingInvite to true');
    setIsGeneratingInvite(true);
    try {
      const result = await createInviteWithSignature({
        role: inviteRole,
        expiresIn: inviteExpiryDays * 24 * 60 * 60, // Convert days to seconds
        maxUses: 1,
      });

      if (result) {
        setGeneratedInviteLink(result.inviteLink);
        toast({
          title: 'Invite generated successfully',
          description: `New invite link created for ${inviteRole} role`,
        });
      }
    } catch (err) {
      console.error('Invite generation error:', err);
      toast({
        title: 'Failed to generate invite',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  // Copy generated invite link to clipboard
  const handleCopyGeneratedInvite = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      toast({
        title: 'Copied to clipboard',
        description: 'Invite link has been copied',
      });
    }
  };

  // Copy invite link to clipboard
  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Copied to clipboard',
        description: 'Invite link has been copied',
      });
    }
  };

  // Revoke invite handler
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeInvite(inviteId);
      toast({
        title: 'Invite revoked',
        description: 'The invite link has been revoked successfully',
      });
    } catch (err) {
      toast({
        title: 'Failed to revoke invite',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Edit member role handler
  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setShowEditMemberDialog(true);
  };

  const handleUpdateMemberRole = async () => {
    if (!selectedMember) return;

    try {
      // TODO: Integrate with actual API/contract call
      toast({
        title: 'Member role updated',
        description: `${selectedMember.name || selectedMember.address}'s role has been updated to ${newRole}`,
      });
      setShowEditMemberDialog(false);
      setSelectedMember(null);
    } catch (err) {
      toast({
        title: 'Failed to update member role',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Remove member handler
  const handleRemoveMember = (member: any) => {
    setSelectedMember(member);
    setShowRemoveMemberDialog(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      // TODO: Integrate with actual API/contract call
      toast({
        title: 'Member removed',
        description: `${selectedMember.name || selectedMember.address} has been removed from the vault`,
      });
      setShowRemoveMemberDialog(false);
      setSelectedMember(null);
    } catch (err) {
      toast({
        title: 'Failed to remove member',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Webhook handlers
  const handleAddWebhook = async () => {
    if (!webhookUrl || selectedEvents.length === 0) {
      toast({
        title: 'Invalid webhook',
        description: 'Please provide URL and select at least one event',
        variant: 'destructive',
      });
      return;
    }

    try {
      // TODO: Integrate with actual API call
      toast({
        title: 'Webhook added',
        description: `Webhook ${webhookUrl} has been added successfully`,
      });
      setShowAddWebhookDialog(false);
      setWebhookUrl('');
      setSelectedEvents([]);
    } catch (err) {
      toast({
        title: 'Failed to add webhook',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEditWebhook = (webhook: any) => {
    setSelectedWebhook(webhook);
    setWebhookUrl(webhook.url);
    setSelectedEvents(webhook.events);
    setShowEditWebhookDialog(true);
  };

  const handleUpdateWebhook = async () => {
    try {
      // TODO: Integrate with actual API call
      toast({
        title: 'Webhook updated',
        description: `Webhook has been updated successfully`,
      });
      setShowEditWebhookDialog(false);
      setSelectedWebhook(null);
    } catch (err) {
      toast({
        title: 'Failed to update webhook',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWebhook = (webhook: any) => {
    setSelectedWebhook(webhook);
    setShowDeleteWebhookDialog(true);
  };

  const handleConfirmDeleteWebhook = async () => {
    try {
      // TODO: Integrate with actual API call
      toast({
        title: 'Webhook deleted',
        description: `Webhook has been deleted successfully`,
      });
      setShowDeleteWebhookDialog(false);
      setSelectedWebhook(null);
    } catch (err) {
      toast({
        title: 'Failed to delete webhook',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // API Key handlers
  const handleRotateApiKey = async () => {
    try {
      // TODO: Integrate with actual API call
      toast({
        title: 'API Key rotated',
        description: 'A new API key has been generated. Please save it securely.',
      });
      setShowRotateApiKeyDialog(false);
    } catch (err) {
      toast({
        title: 'Failed to rotate API key',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('your-api-key-here');
    toast({
      title: 'API Key copied',
      description: 'API key has been copied to clipboard',
    });
  };

  const toggleEventSelection = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  // Format paymaster data for display
  const formatTokenAmount = (amount: string, token: string) => {
    if (!amount || amount === '0') return `0 ${token}`;
    // Convert from wei/smallest unit to human readable (assuming 6 decimals for USDC, 18 for ETH/JPYC)
    const decimals = token === 'USDC' ? 6 : 18;
    const value = Number(amount) / Math.pow(10, decimals);
    return `${value.toLocaleString()} ${token}`;
  };

  // Get device display name
  const getDeviceDisplayName = (deviceId: string | undefined): string => {
    if (!deviceId) return 'Not Set';
    if (deviceId === 'all') return 'All Devices';
    if (deviceId === 'device01') return 'Device 01';
    if (deviceId === 'device02') return 'Device 02';
    return deviceId;
  };

  // Group keys by device
  const deviceGroups = useMemo(() => {
    const groups: Record<string, typeof vaultShareableKeys> = {};

    vaultShareableKeys.forEach(key => {
      const deviceId = key.metadata?.device || 'unassigned';
      if (!groups[deviceId]) {
        groups[deviceId] = [];
      }
      groups[deviceId].push(key);
    });

    console.log('[GroupDetail] Device groups:', groups);
    return groups;
  }, [vaultShareableKeys]);

  const mockWebhooks = [
    {
      id: 'wh-001',
      url: 'https://api.myapp.com/webhooks/escrow',
      events: ['escrow.created', 'escrow.approved', 'escrow.released'],
      status: 'active',
      lastDelivery: '2024-12-25 10:30:00',
      deliveryRate: 98.5
    },
    {
      id: 'wh-002',
      url: 'https://notify.example.com/family-wallet',
      events: ['approval.required', 'paymaster.low_balance'],
      status: 'active',
      lastDelivery: '2024-12-25 09:15:00',
      deliveryRate: 100
    }
  ];

  // Removed - using getRoleBadgeColor from shared constants

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Render error states or main content
  // NOTE: All hooks have been called above, so conditional rendering is safe here

  // Handle undefined vaultId
  if (!vaultId) {
    console.error('[GroupDetail] ERROR: vaultId is undefined!');
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Team Selected
            </h3>
            <p className="text-muted-foreground">
              Please select a team from My Teams to view details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle vault loading error
  if (vaultError) {
    console.error('[GroupDetail] Vault loading error:', vaultError);
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Error Loading Team
            </h3>
            <p className="text-muted-foreground mb-6">
              {vaultError instanceof Error ? vaultError.message : 'Failed to load team data'}
            </p>
            <Button
              onClick={() => fetchVault()}
              className="gradient-primary text-white hover-glow"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to get current user's role
  const getCurrentRole = () => {
    if (!walletAddress || !displayMembers) return null;
    const currentMember = displayMembers.find(m => m.address.toLowerCase() === walletAddress.toLowerCase());
    return currentMember?.role || null;
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'guardian':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'approver':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'requester':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatLastActivity = (lastActivity?: string | null) => {
    if (!lastActivity) return 'Never';
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const currentUserRole = getCurrentRole();

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Group Header */}
      {vaultId && <GroupHeader vaultId={vaultId} currentUserRole={currentUserRole} onNavigateToList={onNavigateBack} />}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'general' | 'advanced')} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <TabsList className="mb-4 sm:mb-6 glass-card rounded-xl p-1.5 h-auto">
            <TabsTrigger
              value="general"
              className="text-xs sm:text-sm py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white data-[state=active]:border-white/30"
            >
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              disabled
              className="text-xs sm:text-sm py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-white data-[state=active]:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="general">
          <div className="space-y-6">

          {/* Shareable Keys Section - Device-centric view */}
          {vaultShareableKeys.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <Card className="glass-card">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Key className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-white text-base sm:text-lg font-semibold">Shared Keys</span>
                      <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
                        Secure smart key sharing and Access devices
                      </p>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      {Object.keys(deviceGroups).length} devices
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid gap-3 sm:gap-4">
                    {Object.entries(deviceGroups).map(([deviceId, keys], deviceIndex) => (
                      <motion.div
                        key={deviceId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * deviceIndex }}
                        className="glass p-4 rounded-xl border-white/10"
                      >
                        {/* Device Header - Clickable */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            // Device 01 navigates to IoT Control, others to first key detail
                            if (deviceId === 'device01' && onNavigateToIotControl) {
                              console.log('[GroupDetail] Navigate to IoT Control for device:', deviceId);
                              onNavigateToIotControl(deviceId);
                            } else if (keys.length > 0 && onNavigateToShareableKeyDetail) {
                              console.log('[GroupDetail] Navigate to device first key:', keys[0].id);
                              onNavigateToShareableKeyDetail(keys[0].id);
                            }
                          }}
                          className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10 cursor-pointer hover:border-cyan-500/30 transition-all rounded-lg -mx-2 px-2 py-1"
                        >
                          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                            <Smartphone className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-base font-semibold text-white">
                              {getDeviceDisplayName(deviceId)}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {keys.length} shareable key{keys.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                            Active
                          </Badge>
                          <ExternalLink className="h-4 w-4 text-cyan-400 shrink-0" />
                        </motion.div>

                        {/* Keys for this device */}
                        <div className="space-y-2">
                          {keys.map((key, keyIndex) => {
                            const isInactive = key.status !== 'active';
                            return (
                              <motion.div
                                key={key.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 * keyIndex }}
                                whileHover={{ scale: isInactive ? 1 : 1.02, x: isInactive ? 0 : 5 }}
                                onClick={() => {
                                  console.log('[GroupDetail] Navigate to shareable key:', key.id);
                                  if (onNavigateToShareableKeyDetail) {
                                    onNavigateToShareableKeyDetail(key.id);
                                  }
                                }}
                                className={`glass-card p-3 rounded-lg border-white/5 transition-all ${
                                  isInactive
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:border-amber-500/30 hover-glow cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-lg bg-gradient-to-br shrink-0 ${
                                    isInactive
                                      ? 'from-gray-500/20 to-gray-600/20'
                                      : 'from-amber-500/20 to-orange-500/20'
                                  }`}>
                                    <Key className={`h-3.5 w-3.5 ${isInactive ? 'text-gray-400' : 'text-amber-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`text-sm font-semibold truncate ${isInactive ? 'text-gray-400' : 'text-white'}`}>
                                        {key.name}
                                      </h4>
                                      <Badge className={`text-[10px] px-1.5 py-0 ${
                                        key.status === 'active'
                                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                          : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                      }`}>
                                        {key.status}
                                      </Badge>
                                    </div>
                                    {key.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                        {key.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span>{key.sharedWith || 0}</span>
                                    </div>
                                    <ExternalLink className={`h-3 w-3 ${isInactive ? 'text-gray-500' : 'text-amber-400'}`} />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
          <Card className="glass-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                </div>
                <span className="text-white text-base sm:text-lg font-semibold">Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isVaultLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : displayMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members found for this vault
                </div>
              ) : (
                <div className="space-y-4">
                  <MemberRoleSummary members={displayMembers} className="mb-4" />
                  {displayMembers.map((member: ExtendedMember, index: number) => (
                    <motion.div
                      key={member.id || member.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.01, x: 5 }}
                      className="glass p-4 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow"
                    >
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                            <AvatarFallback className="text-lg sm:text-xl">
                              {getEmojiForAddress(member.address)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2 min-w-0">
                            <MemberIdentifierDisplay
                              memberIdentifier={member}
                              format="role"
                              showCopy={true}
                              showExplorer={true}
                              showWeight={true}
                              showIcon={false}
                            />
                            {member.email && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {member.joinedAt && <span className="block sm:inline">Joined: {member.joinedAt}</span>}
                              {member.lastActivity && <span className="block sm:inline">{member.joinedAt && ' • '}Last: {member.lastActivity}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleEditMember(member)}
                            disabled={member.role === 'owner'}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => handleRemoveMember(member)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add Member Button */}
              <Button
                onClick={() => setShowAddMemberDialog(true)}
                disabled={!isConnected || !vaultId}
                className="w-full text-sm sm:text-base mt-4"
              >
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Add New Member
              </Button>

              {inviteError && (
                <div className="text-sm text-destructive mt-2">
                  Error: {inviteError.message}
                </div>
              )}

              {/* Pending Invites - Nested inside Members */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  </div>
                  <h3 className="text-white text-base sm:text-lg font-semibold">Pending Invites</h3>
                </div>

                {isLoadingInvites ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No pending invites
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvites.map((invite: any, index: number) => {
                      const expiresAt = new Date(invite.expiresAt);
                      const now = new Date();
                      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isExpiringSoon = daysUntilExpiry <= 2;

                      return (
                        <motion.div
                          key={invite.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className="glass p-3 sm:p-4 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getRoleBadgeColor(invite.role)}>
                                  {invite.role}
                                </Badge>
                                {isExpiringSoon && (
                                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Created: {new Date(invite.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={`${window.location.origin}/invite/${invite.token}`}
                                  readOnly
                                  className="font-mono text-xs h-8"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
                                    toast({
                                      title: 'Copied to clipboard',
                                      description: 'Invite link has been copied',
                                    });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="ml-2"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Escrow Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
          <Card className="glass-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <span className="text-white text-base sm:text-lg font-semibold">Escrow Status</span>
                  <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
                    Overview of escrow statuses in this team
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (vaultId && onNavigateToEscrowCreation) {
                        console.log('[GroupDetail] Create Escrow for vault:', vaultId);
                        onNavigateToEscrowCreation(vaultId);
                      }
                    }}
                    disabled={!onNavigateToEscrowCreation}
                    className="gradient-primary text-white hover-glow text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('[GroupDetail] Navigate to Escrow List for vault:', vaultId);
                      if (vaultId && onNavigateToEscrowList) {
                        onNavigateToEscrowList(vaultId);
                      }
                    }}
                    disabled={!onNavigateToEscrowList}
                    className="text-xs sm:text-sm"
                  >
                    View All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoadingEscrows ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Status Summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <Card className="glass-card hover-glow">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                            </div>
                            <div className="font-mono text-xl sm:text-2xl font-bold text-blue-400">{escrowStats.pending}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <Card className="glass-card hover-glow">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                            </div>
                            <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">{escrowStats.approved}</div>
                            <div className="text-xs text-muted-foreground">Approved</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <Card className="glass-card hover-glow">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            </div>
                            <div className="font-mono text-xl sm:text-2xl font-bold text-green-400">{escrowStats.completed}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <Card className="glass-card hover-glow">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <div className="flex flex-col items-center gap-1 sm:gap-2">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                            </div>
                            <div className="font-mono text-xl sm:text-2xl font-bold text-white">{escrowStats.total}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Recent Escrows (最新3件) */}
                  {recentEscrows.length > 0 ? (
                    <div className="space-y-2">
                      {recentEscrows.map((escrow, index: number) => (
                        <motion.div
                          key={escrow.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className="glass p-3 sm:p-4 rounded-xl border-white/10 hover:border-white/30 transition-all cursor-pointer hover-glow"
                          onClick={() => {
                            console.log('[GroupDetail] View escrow:', escrow.id);
                            if (onNavigateToEscrowDetail) {
                              onNavigateToEscrowDetail(escrow.id);
                            }
                          }}
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
                            {/* Left: Escrow Info */}
                            <div className="flex items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
                                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-semibold text-white text-base sm:text-lg truncate">{escrow.name || `Escrow ${escrow.id.slice(0, 8)}`}</div>
                                  <Badge className={getStatusColor(escrow.status || 'draft')}>
                                    <span className="flex items-center gap-1 text-xs">
                                      {getStatusIcon(escrow.status || 'draft')}
                                      {escrow.status || 'draft'}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span className="hidden sm:inline">Created: </span>{new Date(escrow.createdAt).toLocaleDateString()}
                                  </div>
                                  {escrow.deadline && (
                                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                      <Clock className="h-3 w-3 shrink-0" />
                                      <span className="hidden sm:inline">Due: </span>{new Date(escrow.deadline).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                {escrow.recipient && (
                                  <div className="text-xs font-mono text-muted-foreground mt-1 truncate">
                                    To: {escrow.recipient.slice(0, 6)}...{escrow.recipient.slice(-4)}
                                  </div>
                                )}
                                {escrow.description && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {escrow.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Center: Amount */}
                            <div className="text-left lg:text-center px-0 lg:px-6 w-full lg:w-auto">
                              <div className="flex items-center gap-1 text-cyan-400 font-mono text-lg sm:text-xl font-bold">
                                <DollarSign className="h-5 w-5" />
                                {escrow.totalAmount ? formatAmount(escrow.totalAmount, escrow.token) : '0 USDC'}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Amount</div>
                            </div>

                            {/* Right: Approvals - placeholder for now */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-white font-medium text-sm mb-1">
                                  Approvals: 0/0
                                </div>
                                <Progress
                                  value={0}
                                  className="w-24 h-2"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="mb-4">No escrows yet for this team</div>
                      {onNavigateToEscrowCreation && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (vaultId) {
                              onNavigateToEscrowCreation(vaultId);
                            }
                          }}
                          className="gradient-primary text-white hover-glow"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create First Escrow
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* Paymaster Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{ display: 'none' }}
          >
          <Card className="glass-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                </div>
                <span className="text-white text-base sm:text-lg font-semibold">Paymaster Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              {/* Token Selector */}
              <div className="space-y-2">
                <Label htmlFor="paymaster-token">Paymaster Token</Label>
                <select
                  id="paymaster-token"
                  value={paymasterToken}
                  onChange={(e) => setPaymasterToken(e.target.value as 'USDC' | 'ETH')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="USDC">USDC (Stablecoin - Recommended)</option>
                  <option value="ETH">ETH (Native)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {paymasterToken === 'USDC'
                    ? 'Using USDC for gas sponsorship provides stable, predictable costs'
                    : 'Using ETH for gas sponsorship - costs may vary with market prices'}
                </p>
              </div>

              <Separator />

              {/* Status Overview */}
              {isLoadingPaymaster ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading paymaster status...</span>
                </div>
              ) : paymasterInfo ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="glass-card hover-glow">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                          </div>
                          <div className="font-mono text-sm sm:text-lg font-semibold text-cyan-400">{formatTokenAmount(paymasterInfo.balance, paymasterInfo.token)}</div>
                          <div className="text-xs text-muted-foreground">Current Balance</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card className="glass-card hover-glow">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                          </div>
                          <div className="font-mono text-sm sm:text-lg font-semibold text-amber-400">{formatTokenAmount(paymasterInfo.dailyUsage, paymasterInfo.token)}</div>
                          <div className="text-xs text-muted-foreground">Daily Usage</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <Card className="glass-card hover-glow">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                          </div>
                          <div className="font-mono text-sm sm:text-lg font-semibold text-purple-400">{formatTokenAmount(paymasterInfo.monthlyLimit, paymasterInfo.token)}</div>
                          <div className="text-xs text-muted-foreground">Monthly Limit</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Card className="glass-card hover-glow">
                      <CardContent className="p-3 sm:p-4 text-center">
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                          </div>
                          <div className={`text-sm sm:text-lg font-semibold ${getHealthColor(paymasterInfo.healthStatus)}`}>
                            {paymasterInfo.healthStatus}
                          </div>
                          <div className="text-xs text-muted-foreground">Status</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>Paymaster not configured for this vault</AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Configuration Options */}
              {paymasterInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="refill-threshold">Auto-refill Threshold</Label>
                      <Input
                        id="refill-threshold"
                        value={formatTokenAmount(paymasterInfo.refillThreshold, paymasterInfo.token)}
                        readOnly
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="monthly-limit">Monthly Spending Limit</Label>
                      <Input
                        id="monthly-limit"
                        value={formatTokenAmount(paymasterInfo.monthlyLimit, paymasterInfo.token)}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-refill">Enable Auto-refill</Label>
                      <Switch
                        id="auto-refill"
                        checked={paymasterInfo.autoRefillEnabled}
                        disabled
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fallback">Enable Fallback to User Wallets</Label>
                      <Switch
                        id="fallback"
                        checked={paymasterInfo.fallbackEnabled}
                        disabled
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowPaymasterDialog(true)}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="truncate">Configure Settings</span>
                </Button>
                <Button
                  onClick={() => setShowTopUpDialog(true)}
                  disabled={!paymasterInfo}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="truncate">Top Up Paymaster</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
              {/* API & Webhook Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Webhook className="h-6 w-6 text-amber-400" />
                    </div>
                    <span className="text-white text-lg font-semibold">API & Webhook Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="api-key"
                        value="your-api-key-here"
                        type={apiKeyVisible ? "text" : "password"}
                        readOnly
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Use this key to authenticate API requests
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4>Configured Webhooks</h4>
                      <Button size="sm" onClick={() => setShowAddWebhookDialog(true)}>
                        <Webhook className="h-3 w-3 mr-2" />
                        Add Webhook
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {mockWebhooks.map((webhook, index: number) => (
                        <motion.div
                          key={webhook.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className="glass p-4 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="space-y-1">
                              <div className="font-mono text-sm text-white">{webhook.url}</div>
                              <div className="text-xs text-muted-foreground">
                                Events: {webhook.events.join(', ')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {webhook.deliveryRate}% delivery
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditWebhook(webhook)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteWebhook(webhook)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last delivery: {webhook.lastDelivery}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
          </div>
        </TabsContent>
      </Tabs>

          {/* Edit Member Role Dialog */}
          <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Member Role</DialogTitle>
                <DialogDescription>
                  Change the role for {selectedMember?.name || selectedMember?.address}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="member-role">New Role</Label>
                  <select
                    id="member-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="requester">Requester - Can create escrow requests</option>
                    <option value="guardian">Guardian - Can approve requests</option>
                    <option value="owner">Owner - Full admin privileges</option>
                  </select>
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-2">Current Role: {selectedMember?.role}</div>
                  <div className="text-muted-foreground">
                    Changing to: <span className="font-medium text-foreground">{newRole}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditMemberDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateMemberRole}>
                  Update Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Remove Member Dialog */}
          <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Remove Member
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove this member from the vault?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="text-xl">
                        {selectedMember?.address ? getEmojiForAddress(selectedMember.address) : '👤'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {selectedMember?.name || `${selectedMember?.address.slice(0, 6)}...${selectedMember?.address.slice(-4)}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Role: {selectedMember?.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <strong>Warning:</strong> This action cannot be undone. The member will lose all access to this vault.
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRemoveMemberDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmRemoveMember}>
                  Remove Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Webhook Dialog */}
          <Dialog open={showAddWebhookDialog} onOpenChange={setShowAddWebhookDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Webhook</DialogTitle>
                <DialogDescription>
                  Configure a new webhook to receive real-time notifications
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://api.example.com/webhooks"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Select Events</Label>
                  <div className="space-y-2 mt-2">
                    {[
                      'escrow.created',
                      'escrow.approved',
                      'escrow.released',
                      'approval.required',
                      'paymaster.low_balance',
                      'member.added',
                      'member.removed',
                    ].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={event}
                          checked={selectedEvents.includes(event)}
                          onCheckedChange={() => toggleEventSelection(event)}
                        />
                        <label htmlFor={event} className="text-sm cursor-pointer">
                          {event}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddWebhookDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWebhook}>
                  Add Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Webhook Dialog */}
          <Dialog open={showEditWebhookDialog} onOpenChange={setShowEditWebhookDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Webhook</DialogTitle>
                <DialogDescription>
                  Update webhook configuration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-webhook-url">Webhook URL</Label>
                  <Input
                    id="edit-webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Select Events</Label>
                  <div className="space-y-2 mt-2">
                    {[
                      'escrow.created',
                      'escrow.approved',
                      'escrow.released',
                      'approval.required',
                      'paymaster.low_balance',
                      'member.added',
                      'member.removed',
                    ].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${event}`}
                          checked={selectedEvents.includes(event)}
                          onCheckedChange={() => toggleEventSelection(event)}
                        />
                        <label htmlFor={`edit-${event}`} className="text-sm cursor-pointer">
                          {event}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditWebhookDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateWebhook}>
                  Update Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Webhook Dialog */}
          <Dialog open={showDeleteWebhookDialog} onOpenChange={setShowDeleteWebhookDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Webhook
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this webhook?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="font-mono text-sm">{selectedWebhook?.url}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Events: {selectedWebhook?.events.join(', ')}
                  </div>
                </div>

                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <strong>Warning:</strong> This webhook will stop receiving events immediately.
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteWebhookDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDeleteWebhook}>
                  Delete Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rotate API Key Dialog */}
          <Dialog open={showRotateApiKeyDialog} onOpenChange={setShowRotateApiKeyDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Rotate API Key
                </DialogTitle>
                <DialogDescription>
                  Generate a new API key and invalidate the current one
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <strong>Warning:</strong> The current API key will be immediately invalidated. Make sure to update all integrations with the new key.
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-1">Current API Key:</div>
                  <div className="font-mono text-xs break-all">
                    your-api-key-here
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRotateApiKeyDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRotateApiKey}>
                  Rotate API Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Generate an invite link for a new member. They can join the vault by clicking the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="invite-role">Member Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: VaultRole) => setInviteRole(value)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role} value={role}>
                      {VAULT_ROLES[role].label} - {VAULT_ROLES[role].description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiry Days */}
            <div className="space-y-2">
              <Label htmlFor="invite-expiry">Expires In (days)</Label>
              <Input
                id="invite-expiry"
                type="number"
                min="1"
                max="30"
                value={inviteExpiryDays}
                onChange={(e) => setInviteExpiryDays(parseInt(e.target.value) || 7)}
              />
              <p className="text-sm text-gray-500">
                The invite link will expire after {inviteExpiryDays} day{inviteExpiryDays !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Generated Invite Link */}
            {generatedInviteLink && (
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedInviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyGeneratedInvite}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Invite link generated successfully
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {!generatedInviteLink ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberDialog(false);
                    setGeneratedInviteLink('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateInvite}
                  disabled={isGeneratingInvite || !isConnected}
                >
                  {isGeneratingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Invite'
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowAddMemberDialog(false);
                  setGeneratedInviteLink('');
                  setInviteRole('requester');
                  setInviteExpiryDays(7);
                }}
                className="w-full"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paymaster Settings Dialog */}
      <Dialog open={showPaymasterDialog} onOpenChange={setShowPaymasterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Paymaster Settings</DialogTitle>
            <DialogDescription>
              Set up gas sponsorship for your vault transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paymaster-enabled">Enable Paymaster</Label>
                <p className="text-sm text-muted-foreground">Sponsor gas fees for transactions</p>
              </div>
              <Switch
                id="paymaster-enabled"
                checked={paymasterEnabled}
                onCheckedChange={setPaymasterEnabled}
              />
            </div>

            {/* Token Selection */}
            <div>
              <Label htmlFor="paymaster-token">Token</Label>
              <select
                id="paymaster-token"
                value={paymasterToken}
                onChange={(e) => setPaymasterToken(e.target.value as 'USDC' | 'ETH' | 'JPYC')}
                className="w-full mt-1.5 px-3 py-2 border rounded-md bg-background"
              >
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
                <option value="JPYC">JPYC</option>
              </select>
            </div>

            {/* Monthly Limit */}
            <div>
              <Label htmlFor="monthly-limit">Monthly Limit (smallest unit)</Label>
              <Input
                id="monthly-limit"
                type="text"
                placeholder="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
              />
            </div>

            {/* Daily Limit */}
            <div>
              <Label htmlFor="daily-limit">Daily Limit (smallest unit)</Label>
              <Input
                id="daily-limit"
                type="text"
                placeholder="0"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
              />
            </div>

            {/* Auto-refill */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refill-enabled">Enable Auto-refill</Label>
                  <p className="text-sm text-muted-foreground">Automatically refill when balance is low</p>
                </div>
                <Switch
                  id="auto-refill-enabled"
                  checked={autoRefillEnabled}
                  onCheckedChange={setAutoRefillEnabled}
                />
              </div>

              {autoRefillEnabled && (
                <>
                  <div>
                    <Label htmlFor="refill-threshold">Refill Threshold (smallest unit)</Label>
                    <Input
                      id="refill-threshold"
                      type="text"
                      placeholder="0"
                      value={refillThreshold}
                      onChange={(e) => setRefillThreshold(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="refill-amount">Refill Amount (smallest unit)</Label>
                    <Input
                      id="refill-amount"
                      type="text"
                      placeholder="0"
                      value={refillAmount}
                      onChange={(e) => setRefillAmount(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Fallback */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fallback-enabled">Enable Fallback to User Wallets</Label>
                <p className="text-sm text-muted-foreground">Use user wallets if paymaster fails</p>
              </div>
              <Switch
                id="fallback-enabled"
                checked={fallbackEnabled}
                onCheckedChange={setFallbackEnabled}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymasterDialog(false);
                // Reset to current values if they exist
                if (paymasterInfo) {
                  setPaymasterEnabled(paymasterInfo.enabled);
                  setPaymasterToken(paymasterInfo.token);
                  setMonthlyLimit(paymasterInfo.monthlyLimit);
                  setDailyLimit(paymasterInfo.dailyLimit);
                  setAutoRefillEnabled(paymasterInfo.autoRefillEnabled);
                  setRefillThreshold(paymasterInfo.refillThreshold);
                  setRefillAmount(paymasterInfo.refillAmount);
                  setFallbackEnabled(paymasterInfo.fallbackEnabled);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await updatePaymasterAsync({
                    enabled: paymasterEnabled,
                    token: paymasterToken,
                    monthlyLimit,
                    dailyLimit,
                    autoRefillEnabled,
                    refillThreshold: autoRefillEnabled ? refillThreshold : '0',
                    refillAmount: autoRefillEnabled ? refillAmount : '0',
                    fallbackEnabled,
                  });

                  // Refetch paymaster data to reflect changes
                  await refetchPaymaster();

                  toast({
                    title: 'Paymaster settings updated',
                    description: 'Your paymaster configuration has been saved successfully.',
                  });
                  setShowPaymasterDialog(false);
                } catch (error) {
                  toast({
                    title: 'Failed to update paymaster settings',
                    description: error instanceof Error ? error.message : 'Unknown error',
                    variant: 'destructive',
                  });
                }
              }}
              disabled={isUpdatingPaymaster}
            >
              {isUpdatingPaymaster ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Up Paymaster Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Paymaster Balance</DialogTitle>
            <DialogDescription>
              Add funds to your paymaster to sponsor gas fees
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {paymasterInfo && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className="text-lg font-medium">{formatTokenAmount(paymasterInfo.balance, paymasterInfo.token)}</div>
              </div>
            )}

            <div>
              <Label htmlFor="top-up-amount">Amount ({paymasterInfo?.token || 'USDC'}) - smallest unit</Label>
              <Input
                id="top-up-amount"
                type="text"
                placeholder="Enter amount in smallest unit (e.g., 1000000 for 1 USDC)"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: For USDC (6 decimals), enter 1000000 for 1 USDC
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTopUpDialog(false);
                setTopUpAmount('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement top-up functionality
                // This will require calling the /paymaster/settings/:vaultId/top-up endpoint
                toast({
                  title: 'Top-up not implemented yet',
                  description: 'This feature will be available soon.',
                  variant: 'destructive',
                });
              }}
              disabled={!topUpAmount || topUpAmount === '0'}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}