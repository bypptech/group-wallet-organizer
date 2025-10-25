import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Crown,
  ArrowLeft,
  Coins,
  Users,
  TrendingUp,
  Sparkles,
  Settings,
  UserPlus,
  Loader2,
  Calendar,
  Mail,
  Shield,
  User,
  Wallet,
  DollarSign,
  Copy,
  Check,
  Link2,
  CheckCircle
} from 'lucide-react';
import { useVault } from '@/hooks/useVaults';
import { useCollections, useAddParticipant, useRecordPayment } from '@/hooks/useCollections';
import { VaultIdentifierDisplay } from './VaultIdentifierDisplay';
import { useToast } from '@/hooks/use-toast';
import type { ParticipantStatus } from '@shared/types/collection';
import type { Address } from 'viem';

interface ManagedGroupDetailProps {
  vaultId?: string;
  onNavigateToList?: () => void;
  onNavigateToCollectionDetail?: (collectionId: string) => void;
  onNavigateToCollectionCreation?: () => void;
}

export function ManagedGroupDetail({
  vaultId,
  onNavigateToList,
  onNavigateToCollectionDetail,
  onNavigateToCollectionCreation
}: ManagedGroupDetailProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [newMemberAmount, setNewMemberAmount] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [copiedParticipantId, setCopiedParticipantId] = useState<string | null>(null);

  const { toast } = useToast();

  // Fetch vault data with members
  const { vault, members, isLoading: vaultLoading } = useVault(vaultId);

  // Fetch collections data
  const { collections, isLoading: collectionsLoading } = useCollections(vaultId);

  // Get the first collection for display in Collections tab
  const primaryCollection = collections && collections.length > 0 ? collections[0] : null;

  // Add participant mutation
  const { mutate: addParticipant, isPending: isAddingParticipant } = useAddParticipant();

  // Record payment mutation
  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordPayment();

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amountWei: string | undefined) => {
    if (!amountWei || amountWei === '0') {
      return '0.00';
    }
    try {
      const amount = Number(BigInt(amountWei)) / 1_000_000;
      return amount.toFixed(2);
    } catch (error) {
      console.error('Error formatting amount:', amountWei, error);
      return '0.00';
    }
  };

  const getStatusBadge = (status: ParticipantStatus) => {
    const badges = {
      pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
      partial: { label: 'Partial', className: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
      paid: { label: 'Paid', className: 'bg-green-500/20 text-green-300 border-green-500/50' },
      overdue: { label: 'Overdue', className: 'bg-red-500/20 text-red-300 border-red-500/50' },
    };
    const badge = badges[status];
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  // Calculate collection statistics
  const collectionStats = useMemo(() => {
    if (!primaryCollection) {
      return {
        completionRate: 0,
        totalParticipants: 0,
        paidParticipants: 0,
        hasDeadline: false,
        deadline: null,
        participants: []
      };
    }

    const participants = primaryCollection.participants || [];

    const totalParticipants = participants.length;
    const paidParticipants = participants.filter((p: any) => p.status === 'paid').length;

    // collectedAmount and totalAmount are at the root level of collection, not in metadata
    const collectedAmount = primaryCollection.collectedAmount ? BigInt(primaryCollection.collectedAmount) : 0n;
    const totalAmount = primaryCollection.totalAmount ? BigInt(primaryCollection.totalAmount) : 0n;
    const completionRate = totalAmount > 0n
      ? Number((collectedAmount * 100n) / totalAmount)
      : 0;

    return {
      completionRate,
      totalParticipants,
      paidParticipants,
      hasDeadline: !!primaryCollection.deadline,
      deadline: primaryCollection.deadline,
      participants
    };
  }, [primaryCollection]);

  // Handle add member
  const handleAddMember = async () => {
    // Validate name (required)
    if (!newMemberName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a member name',
        variant: 'destructive',
      });
      return;
    }

    // Validate amount (required)
    if (!newMemberAmount.trim() || parseFloat(newMemberAmount) <= 0) {
      toast({
        title: 'Amount required',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    // Validate wallet address if provided (optional)
    if (newMemberAddress.trim() && !/^0x[a-fA-F0-9]{40}$/.test(newMemberAddress)) {
      toast({
        title: 'Invalid address',
        description: 'Please enter a valid Ethereum address',
        variant: 'destructive',
      });
      return;
    }

    // Check if primary collection exists
    if (!primaryCollection?.id) {
      toast({
        title: 'No collection found',
        description: 'Please create a collection first',
        variant: 'destructive',
      });
      return;
    }

    // Convert amount to USDC base units (6 decimals)
    const amountInBaseUnits = (BigInt(Math.floor(parseFloat(newMemberAmount) * 1_000_000))).toString();

    addParticipant(
      {
        collectionId: primaryCollection.id,
        name: newMemberName,
        address: newMemberAddress.trim() ? (newMemberAddress as Address) : undefined,
        allocatedAmount: amountInBaseUnits,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Member added successfully!',
            description: `${newMemberName} has been added to the team with ${newMemberAmount} USDC.`,
          });

          // Reset form
          setNewMemberName('');
          setNewMemberAddress('');
          setNewMemberAmount('');
          setIsAddMemberDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: 'Failed to add member',
            description: error instanceof Error ? error.message : 'An error occurred',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Generate invite URL for specific participant
  const generateParticipantInviteUrl = (participantId: string) => {
    if (!primaryCollection?.id || !vaultId) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/invite/collection/${primaryCollection.id}?vault=${vaultId}&participant=${participantId}`;
  };

  // Handle copy participant invite URL
  const handleCopyParticipantInviteUrl = async (participantId: string) => {
    const inviteUrl = generateParticipantInviteUrl(participantId);
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedParticipantId(participantId);
      toast({
        title: 'Invite URL copied!',
        description: 'Share this link with the member to join the collection',
      });
      setTimeout(() => setCopiedParticipantId(null), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Handle record payment
  const handleRecordPayment = (participantId: string, participantName: string) => {
    if (!primaryCollection?.id) {
      toast({
        title: 'Collection not found',
        description: 'Unable to record payment',
        variant: 'destructive',
      });
      return;
    }

    recordPayment(
      {
        collectionId: primaryCollection.id,
        participantId,
        vaultId,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Payment recorded!',
            description: `Payment for ${participantName} has been marked as complete`,
          });
        },
        onError: (error) => {
          toast({
            title: 'Failed to record payment',
            description: error instanceof Error ? error.message : 'An error occurred',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!vaultId) {
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No vault selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vaultLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToList}
            className="hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-white">Managed Team</h2>
            <p className="text-muted-foreground">Team details</p>
          </div>
        </div>

        <Card className="glass border-red-500/20 bg-red-500/5">
          <CardContent className="p-12 text-center">
            <Crown className="h-16 w-16 text-red-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Team Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The team you're looking for could not be found or you don't have access to it.
            </p>
            <Button
              onClick={onNavigateToList}
              variant="outline"
              className="border-white/10 hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Managed Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6"
      >
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToList}
            className="hover:bg-white/5 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 shrink-0">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{vault.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{vault.description}</p>
              </div>
            </div>
          </div>
        </div>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 shrink-0 text-xs sm:text-sm">
          <Crown className="h-3 w-3 mr-1" />
          Leader
        </Badge>
      </motion.div>

      {/* Vault Identifier */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 sm:mb-6"
      >
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <VaultIdentifierDisplay
              vaultIdentifier={vault}
              showCopy={true}
              showExplorer={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 sm:mb-6 glass-card p-1 w-full sm:w-auto">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white data-[state=active]:border-white/30 flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-white data-[state=active]:border-white/30 flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-4 sm:space-y-6">
            {collectionsLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : !primaryCollection ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Coins className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Collections Yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create a new collection to start tracking payments
                  </p>
                  <Button
                    className="gradient-primary text-white hover-glow"
                    onClick={onNavigateToCollectionCreation}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create First Collection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="glass-card">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {collectionStats.completionRate.toFixed(1)}%
                      </div>
                      <Progress value={collectionStats.completionRate} className="h-1.5 sm:h-2" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                        {formatAmount(primaryCollection.collectedAmount)} / {formatAmount(primaryCollection.totalAmount)} USDC
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Participants
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {collectionStats.paidParticipants} / {collectionStats.totalParticipants}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {collectionStats.totalParticipants - collectionStats.paidParticipants} pending
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Deadline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      {collectionStats.hasDeadline ? (
                        <>
                          <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                            {formatDate(collectionStats.deadline!)}
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {new Date(collectionStats.deadline!) < new Date() ? 'Overdue' : 'Upcoming'}
                          </p>
                        </>
                      ) : (
                        <div className="text-base sm:text-xl text-muted-foreground">
                          No deadline
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Members & Payment Status */}
                <Card className="glass-card">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-3 sm:pb-4 p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                      </div>
                      <span className="text-white text-base sm:text-lg font-semibold">Members & Payment Status</span>
                      {collectionStats.participants.length > 0 && (
                        <Badge variant="outline" className="border-white/20 text-muted-foreground text-xs">
                          {collectionStats.participants.length} {collectionStats.participants.length === 1 ? 'Member' : 'Members'}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      onClick={() => setIsAddMemberDialogOpen(true)}
                      className="gradient-primary text-white hover-glow w-full sm:w-auto"
                      size="sm"
                    >
                      <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Add Member</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    {/* Owner Section */}
                    {members && members.length > 0 && (() => {
                      const owner = members.find((m: any) => m.role === 'owner');
                      if (!owner) return null;

                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Crown className="h-4 w-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Owner</h3>
                          </div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0 }}
                            className="glass p-4 rounded-xl border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-indigo-500/5"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="ring-2 ring-purple-500/50">
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                  {owner.name ? owner.name.charAt(0).toUpperCase() : owner.address ? owner.address.slice(2, 4).toUpperCase() : 'O'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-white">
                                    {owner.name || 'Vault Owner'}
                                  </p>
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Owner
                                  </Badge>
                                </div>
                                {owner.address && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Wallet className="h-3 w-3" />
                                    <code className="truncate">
                                      {owner.address.slice(0, 6)}...{owner.address.slice(-4)}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })()}

                    {/* Participants Section */}
                    {collectionStats.participants.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-400" />
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Members</h3>
                        </div>
                      </div>
                    )}
                    {collectionStats.participants.length > 0 ? (
                      <div className="space-y-4">
                        {collectionStats.participants.map((participant: any, index: number) => (
                          <motion.div
                            key={participant.address || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * (index + 1) }}
                            whileHover={{ scale: 1.01, x: 5 }}
                            className="glass p-4 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                  {participant.name ? participant.name.charAt(0).toUpperCase() : participant.address ? participant.address.slice(2, 4).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-white">
                                    {participant.name || 'Unnamed Participant'}
                                  </p>
                                  {getStatusBadge(participant.status)}
                                </div>
                                {participant.address ? (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Wallet className="h-3 w-3" />
                                    <code className="truncate">
                                      {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                                    </code>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-amber-400">
                                    <Wallet className="h-3 w-3" />
                                    <span>Pending wallet connection</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Allocated</p>
                                    <p className="text-sm text-white font-medium">
                                      {formatAmount(participant.allocatedAmount)} USDC
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Paid</p>
                                    <p className="text-sm text-white font-medium">
                                      {formatAmount(participant.paidAmount)} USDC
                                    </p>
                                  </div>
                                </div>
                                {participant.paidAt && (
                                  <div className="text-xs text-muted-foreground">
                                    Paid on {formatDate(participant.paidAt)}
                                  </div>
                                )}

                                {/* Divider */}
                                <div className="border-t border-white/10 my-3"></div>

                                {/* Copy Invite URL Button */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyParticipantInviteUrl(participant.id)}
                                    disabled={!!participant.address}
                                    className="glass border-indigo-500/50 text-xs flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {participant.address ? (
                                      <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                                    ) : copiedParticipantId === participant.id ? (
                                      <Check className="h-3 w-3 mr-1 text-green-400" />
                                    ) : (
                                      <Copy className="h-3 w-3 mr-1" />
                                    )}
                                    {participant.address ? 'Wallet Connected' : copiedParticipantId === participant.id ? 'Invite Link Copied!' : 'Copy Invite Link'}
                                  </Button>
                                  {participant.status !== 'paid' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRecordPayment(participant.id, participant.name)}
                                      disabled={isRecordingPayment}
                                      className="glass border-purple-500/50 text-xs flex-1"
                                    >
                                      {isRecordingPayment ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <DollarSign className="h-3 w-3 mr-1" />
                                      )}
                                      Record
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            {participant.status === 'partial' && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <Progress
                                  value={Number((BigInt(participant.paidAmount) * 100n) / BigInt(participant.allocatedAmount))}
                                  className="h-1.5"
                                />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground mb-4">No members yet</p>
                        <Button
                          onClick={() => setIsAddMemberDialogOpen(true)}
                          className="gradient-primary text-white hover-glow"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add First Member
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Settings className="h-6 w-6 text-amber-400" />
                    </div>
                    <span className="text-white text-lg font-semibold">Team Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Settings coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="glass-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add New Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new member to your managed team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name" className="text-white">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="member-name"
                placeholder="John Doe"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="glass border-white/20 text-white placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-address" className="text-white">
                Wallet Address (Optional)
              </Label>
              <Input
                id="member-address"
                placeholder="0x..."
                value={newMemberAddress}
                onChange={(e) => setNewMemberAddress(e.target.value)}
                className="glass border-white/20 text-white placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if member hasn't connected wallet yet
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-amount" className="text-white">
                Amount (USDC) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="member-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newMemberAmount}
                onChange={(e) => setNewMemberAmount(e.target.value)}
                className="glass border-white/20 text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddMemberDialogOpen(false)}
              className="border-white/20 hover:bg-white/5"
              disabled={isAddingParticipant}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={isAddingParticipant}
              className="gradient-primary text-white hover-glow"
            >
              {isAddingParticipant ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
