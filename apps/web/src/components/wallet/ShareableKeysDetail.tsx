import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Key,
  Users,
  Clock,
  Copy,
  Check,
  Trash2,
  Power,
  ExternalLink,
  Calendar,
  Activity,
  Loader2,
  UserPlus,
  Mail,
  User,
  DollarSign,
  Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { useShareableKeyAPI, useShareableKeyUsageAPI, useRevokeShareableKeyAPI } from '@/hooks/useShareableKeysAPI';
import { useVault } from '@/hooks/useVaults';
import { usePendingInvites, useInviteManager } from '@/hooks/useInviteManager';
import { getRoleBadgeColor, getAvailableRoles, VAULT_ROLES, type VaultRole } from '@/lib/constants/roles';
import { MemberIdentifierDisplay } from './MemberIdentifierDisplay';
import { USDC_ADDRESS } from '@/lib/contracts';
import { baseSepolia } from 'wagmi/chains';

interface ShareableKeysDetailProps {
  keyId: string;
  onBack?: () => void;
  onNavigateToIotControl?: (deviceId: string) => void;
}

export function ShareableKeysDetail({ keyId, onBack, onNavigateToIotControl }: ShareableKeysDetailProps) {
  const { toast } = useToast();
  const { address: userAddress, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState<VaultRole>('requester');
  const [inviteExpiryDays, setInviteExpiryDays] = useState(7);

  // Payment settings
  const [requirePayment, setRequirePayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRecipient, setPaymentRecipient] = useState<'vault' | 'creator'>('vault');

  // Fetch key details and usage from API
  const { data: keyDetail, isLoading, error } = useShareableKeyAPI(keyId);
  const { data: usageData } = useShareableKeyUsageAPI(keyId);
  const usageHistory = Array.isArray(usageData) ? usageData : [];
  const revokeKeyMutation = useRevokeShareableKeyAPI();

  // Debug: Log usage history
  console.log('[ShareableKeysDetail] keyId:', keyId);
  console.log('[ShareableKeysDetail] usageData from API:', usageData);
  console.log('[ShareableKeysDetail] usageHistory array:', usageHistory);
  console.log('[ShareableKeysDetail] usageHistory length:', usageHistory.length);
  console.log('[ShareableKeysDetail] usageHistory IDs:', usageHistory.map(u => u.id));

  // Fetch vault information if keyDetail has vaultId
  const { vault, members, isLoading: isVaultLoading } = useVault(keyDetail?.vaultId);

  // Debug log
  console.log('ShareableKeysDetail - keyDetail:', keyDetail);
  console.log('ShareableKeysDetail - vault:', vault);

  // Use invite manager hook for the vault (use vaultId, not address)
  const {
    createInviteWithSignature,
    error: inviteError,
  } = useInviteManager(keyDetail?.vaultId || '');

  // Fetch pending invites for this vault (use vaultId, not address)
  const {
    invites: pendingInvites,
    isLoading: isLoadingInvites,
    revokeInvite,
  } = usePendingInvites(keyDetail?.vaultId);

  const handleGenerateInvite = async () => {
    console.log('=== INVITE GENERATION START ===');
    console.log('handleGenerateInvite called', {
      vault,
      vaultAddress: vault?.address,
      inviteRole,
      inviteExpiryDays,
      requirePayment,
      paymentAmount,
      paymentRecipient
    });
    console.log('isConnected:', isConnected);
    console.log('walletAddress:', userAddress);

    if (!vault?.address) {
      console.error('Vault address not available:', vault);
      toast({
        title: 'Vault not loaded',
        description: 'Please wait for vault data to load',
        variant: 'destructive',
      });
      return;
    }

    // Validate payment amount if payment is required
    if (requirePayment) {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Invalid payment amount',
          description: 'Please enter a valid payment amount greater than 0',
          variant: 'destructive',
        });
        return;
      }
    }

    console.log('Setting isGeneratingInvite to true');
    setIsGeneratingInvite(true);
    try {
      // Convert USDC amount to wei (6 decimals)
      const paymentAmountWei = requirePayment
        ? BigInt(Math.floor(parseFloat(paymentAmount) * 1_000_000)).toString()
        : undefined;

      // Determine recipient address
      const recipientAddress = requirePayment
        ? (paymentRecipient === 'vault' ? vault.address : userAddress)
        : undefined;

      console.log('Payment data:', {
        paymentAmountWei,
        recipientAddress,
        usdcAddress: USDC_ADDRESS[baseSepolia.id]
      });

      const result = await createInviteWithSignature({
        role: inviteRole,
        expiresIn: inviteExpiryDays * 24 * 60 * 60, // Convert days to seconds
        maxUses: 1,
        // Payment fields
        paymentRequired: requirePayment,
        paymentAmount: paymentAmountWei,
        paymentToken: requirePayment ? USDC_ADDRESS[baseSepolia.id] : undefined,
        paymentRecipient: recipientAddress,
      });

      if (result) {
        setGeneratedInviteLink(result.inviteLink);
        toast({
          title: 'Invite generated successfully',
          description: requirePayment
            ? `New invite link created for ${inviteRole} role with ${paymentAmount} USDC payment required`
            : `New invite link created for ${inviteRole} role`,
        });
      }
    } catch (err) {
      console.error('Failed to generate invite:', err);
      toast({
        title: 'Failed to generate invite',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      console.log('Setting isGeneratingInvite to false');
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyGeneratedInvite = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    toast({
      title: 'Copied to clipboard',
      description: 'Invite link has been copied',
    });
  };

  const handleRevokeKey = async () => {
    if (!keyDetail) return;

    try {
      await revokeKeyMutation.mutateAsync(keyId);
      toast({
        title: 'Key Revoked',
        description: `Key "${keyDetail.name}" has been revoked`,
      });

      // Invalidate device access cache to reflect revoked permissions
      queryClient.invalidateQueries({ queryKey: ['deviceAccess'] });

      // Navigate back after a short delay
      setTimeout(() => onBack?.(), 1500);
    } catch (error) {
      console.error('Failed to revoke key:', error);
      toast({
        title: 'Revocation Failed',
        description: error instanceof Error ? error.message : 'Failed to revoke shareable key',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeInvite(inviteId);
      toast({
        title: 'Invite Revoked',
        description: 'The invite link has been revoked successfully',
      });
    } catch (error) {
      console.error('Failed to revoke invite:', error);
      toast({
        title: 'Revocation Failed',
        description: error instanceof Error ? error.message : 'Failed to revoke invite',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: 'active' | 'expired' | 'revoked') => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'revoked':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading key details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !keyDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="p-3 rounded-full bg-red-500/20 w-fit mx-auto">
              <Key className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Key</h3>
              <p className="text-sm text-muted-foreground">
                {error?.message || 'Key not found'}
              </p>
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              className="glass border-white/20 hover:border-amber-500/50"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/5 shrink-0">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 shrink-0">
                <Key className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{keyDetail.name}</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground truncate ml-10 sm:ml-12">
              {keyDetail.description || 'No description'}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusColor(keyDetail.status)} shrink-0`}>
          {keyDetail.status.charAt(0).toUpperCase() + keyDetail.status.slice(1)}
        </Badge>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Card
          className={`glass-card ${
            keyDetail.status !== 'active'
              ? 'opacity-50'
              : keyDetail.metadata?.device === 'device01' && onNavigateToIotControl
                ? 'hover-glow cursor-pointer'
                : ''
          }`}
          onClick={() => {
            if (keyDetail.status === 'active' && keyDetail.metadata?.device === 'device01' && onNavigateToIotControl) {
              console.log('[ShareableKeysDetail] Navigate to IoT Control for device:', keyDetail.metadata.device);
              onNavigateToIotControl(keyDetail.metadata.device);
            }
          }}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${
                keyDetail.status !== 'active'
                  ? 'from-gray-500/20 to-gray-600/20'
                  : 'from-cyan-500/20 to-blue-500/20'
              }`}>
                <Smartphone className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  keyDetail.status !== 'active' ? 'text-gray-400' : 'text-cyan-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-semibold ${
                  keyDetail.status !== 'active' ? 'text-gray-400' : 'text-white'
                }`}>
                  {keyDetail.metadata?.device === 'all'
                    ? 'All Devices'
                    : keyDetail.metadata?.device === 'device01'
                      ? 'Device 01'
                      : keyDetail.metadata?.device === 'device02'
                        ? 'Device 02'
                        : 'Not Set'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Device Access</p>
              </div>
              {keyDetail.metadata?.device === 'device01' && onNavigateToIotControl && (
                <ExternalLink className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                  keyDetail.status !== 'active' ? 'text-gray-500' : 'text-cyan-400'
                }`} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">{keyDetail.sharedWith} Users</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Shared With</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">
                  {keyDetail.usageCount}
                  {keyDetail.maxUses && `/${keyDetail.maxUses}`}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Uses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">
                  {keyDetail.expiresAt ? formatDate(keyDetail.expiresAt) : 'No Expiration'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Expires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Key Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 space-y-4 sm:space-y-6"
        >
          {/* Key Details */}
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                Key Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-start py-2 border-b border-white/10">
                  <span className="text-sm text-muted-foreground">Key Type</span>
                  <Badge variant="outline" className="capitalize">
                    {keyDetail.keyType}
                  </Badge>
                </div>
                {keyDetail.vaultName && (
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-sm text-muted-foreground">Vault Name</span>
                    <span className="text-sm text-white font-medium">{keyDetail.vaultName}</span>
                  </div>
                )}
                {keyDetail.vaultId && (
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-sm text-muted-foreground">Vault ID</span>
                    <span className="text-sm text-white font-mono text-xs">{keyDetail.vaultId}</span>
                  </div>
                )}
                {keyDetail.vaultAddress && (
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-sm text-muted-foreground">Vault Address</span>
                    <span className="text-sm text-white font-mono text-xs">
                      {keyDetail.vaultAddress.slice(0, 6)}...{keyDetail.vaultAddress.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start py-2 border-b border-white/10">
                  <span className="text-sm text-muted-foreground">Created By</span>
                  <span className="text-sm text-white font-mono text-xs">
                    {keyDetail.createdBy.slice(0, 6)}...{keyDetail.createdBy.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-white/10">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm text-white font-medium">{formatDate(keyDetail.createdAt)}</span>
                </div>
                {keyDetail.maxUses && (
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-sm text-muted-foreground">Max Uses</span>
                    <span className="text-sm text-white font-medium">{keyDetail.maxUses}</span>
                  </div>
                )}
                {keyDetail.lastUsed && (
                  <div className="flex justify-between items-start py-2 border-b border-white/10">
                    <span className="text-sm text-muted-foreground">Last Used</span>
                    <span className="text-sm text-white font-medium">{formatDateTime(keyDetail.lastUsed)}</span>
                  </div>
                )}
                <div className="flex justify-between items-start py-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(keyDetail.status)}>
                    {keyDetail.status.charAt(0).toUpperCase() + keyDetail.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                Usage History
              </h2>
              <div className="space-y-2">
                {usageHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No usage recorded yet</p>
                  </div>
                ) : (
                  usageHistory.map((usage) => (
                    <div
                      key={usage.id}
                      className="flex items-center justify-between p-3 rounded-lg glass hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium font-mono">{usage.userAddress}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(usage.usedAt)}</p>
                        </div>
                      </div>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vault Members */}
          {vault && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="glass-card">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                    </div>
                    <span className="text-white text-base sm:text-lg font-semibold">Vault Members</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {isVaultLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found for this vault
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member: any, index: number) => (
                        <motion.div
                          key={member.id || member.address}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className="glass p-3 sm:p-4 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow"
                        >
                          <div className="flex items-start sm:items-center justify-between gap-2">
                            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                <AvatarFallback className="text-xs sm:text-sm">
                                  {member.displayName ? member.displayName.split(' ').map((n: string) => n[0]).join('') : member.address.slice(2, 4).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                                <MemberIdentifierDisplay
                                  memberIdentifier={member}
                                  format="role"
                                  showCopy={true}
                                  showExplorer={true}
                                  showWeight={false}
                                />
                                {vault?.name && (
                                  <div className="text-xs text-white/70 flex items-center gap-1 truncate">
                                    <Users className="h-3 w-3 shrink-0" />
                                    <span className="font-medium">Team:</span>
                                    <span className="truncate">{vault.name}</span>
                                  </div>
                                )}
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
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Pending Invites */}
          {vault && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="glass-card">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <span className="text-white text-base sm:text-lg font-semibold">Pending Invites</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {isLoadingInvites ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingInvites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
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
                            className="glass p-4 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getRoleBadgeColor(invite.role)}>
                                    {invite.role}
                                  </Badge>
                                  {invite.paymentRequired && invite.paymentAmount && (
                                    <Badge variant="outline" className="text-amber-400 border-amber-400">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      {(parseInt(invite.paymentAmount) / 1_000_000).toFixed(2)} USDC
                                    </Badge>
                                  )}
                                  {isExpiringSoon && (
                                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                                {vault?.name && (
                                  <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Users className="h-3 w-3" />
                                    <span className="font-medium">Team:</span>
                                    <span>{vault.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  Created: {new Date(invite.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={`/invite/${invite.token.slice(0, 6)}${'*'.repeat(52)}${invite.token.slice(-6)}`}
                                    readOnly
                                    disabled
                                    className="font-mono text-xs h-8 text-muted-foreground"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="ml-2 cursor-not-allowed opacity-50"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Actions Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Actions Card */}
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Power className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                Actions
              </h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full glass border-red-500/20 hover:border-red-500/50 text-red-400 justify-start"
                  onClick={handleRevokeKey}
                  disabled={keyDetail.status !== 'active'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={(open) => {
        setShowInviteDialog(open);
        if (!open) {
          setGeneratedInviteLink('');
          setInviteRole('requester');
          setInviteExpiryDays(7);
          setRequirePayment(false);
          setPaymentAmount('');
          setPaymentRecipient('vault');
        }
      }}>
        <DialogContent className="glass-card border-white/20 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Generate an invite link for a new member. They can join the vault by clicking the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="invite-role" className="text-white">Member Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: VaultRole) => setInviteRole(value)}
              >
                <SelectTrigger id="invite-role" className="glass border-white/20">
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
              <Label htmlFor="invite-expiry" className="text-white">Expires In (days)</Label>
              <Input
                id="invite-expiry"
                type="number"
                min="1"
                max="30"
                value={inviteExpiryDays}
                onChange={(e) => setInviteExpiryDays(parseInt(e.target.value) || 7)}
                className="glass border-white/20"
              />
              <p className="text-sm text-muted-foreground">
                The invite link will expire after {inviteExpiryDays} day{inviteExpiryDays !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Payment Settings - Shareable Keys Only */}
            <div className="space-y-4 p-4 rounded-lg glass border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="require-payment"
                  checked={requirePayment}
                  onCheckedChange={(checked) => setRequirePayment(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="require-payment" className="text-white font-medium cursor-pointer flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-400" />
                    Require USDC Payment
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    New members must pay to join this vault via Shareable Key
                  </p>
                </div>
              </div>

              {requirePayment && (
                <div className="ml-7 space-y-4">
                  {/* Payment Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount" className="text-white text-sm">
                      Payment Amount (USDC)
                    </Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="glass border-white/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the amount in USDC (e.g., 10 USDC)
                    </p>
                  </div>

                  {/* Payment Recipient */}
                  <div className="space-y-2">
                    <Label htmlFor="payment-recipient" className="text-white text-sm">
                      Payment Recipient
                    </Label>
                    <Select
                      value={paymentRecipient}
                      onValueChange={(value: 'vault' | 'creator') => setPaymentRecipient(value)}
                    >
                      <SelectTrigger id="payment-recipient" className="glass border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vault">
                          Vault Address ({vault?.address?.slice(0, 6)}...{vault?.address?.slice(-4)})
                        </SelectItem>
                        <SelectItem value="creator">
                          Your Address ({userAddress?.slice(0, 6)}...{userAddress?.slice(-4)})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose who receives the payment
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Invite Link */}
            {generatedInviteLink && (
              <div className="space-y-2">
                <Label className="text-white">Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedInviteLink}
                    readOnly
                    className="font-mono text-sm glass border-white/20"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyGeneratedInvite}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-400 flex items-center gap-1">
                  <Check className="h-4 w-4" />
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
                    setShowInviteDialog(false);
                    setGeneratedInviteLink('');
                  }}
                  className="glass border-white/20"
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
                  setShowInviteDialog(false);
                  setGeneratedInviteLink('');
                  setInviteRole('requester');
                  setInviteExpiryDays(7);
                  setRequirePayment(false);
                  setPaymentAmount('');
                  setPaymentRecipient('vault');
                }}
                className="w-full"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
