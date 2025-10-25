import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  MessageSquare,
  Shield,
  AlertTriangle,
  Coins,
  Calendar,
  Hash,
  Loader2,
  Key,
  DollarSign,
  Activity,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import { BundlerStatus } from './LoadingStates';
import {
  useEscrowAPI,
  useEscrowApprovalProgressAPI,
  useEscrowTimelineAPI,
  useApproveEscrowAPI,
  useEscrowPaymasterCheckAPI,
  useEscrowCommentsAPI,
  useAddEscrowCommentAPI,
  type TimelineEvent,
  type EscrowComment
} from '../../hooks/useEscrowsAPI';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface EscrowDetailProps {
  escrowId?: string;
  currentRole?: UserRole;
  onBack?: () => void;
}

export function EscrowDetail({ escrowId, currentRole = 'viewer', onBack }: EscrowDetailProps) {
  const [approvalState, setApprovalState] = useState<'idle' | 'merkle-proof' | 'bundler-sending' | 'success' | 'failed'>('idle');
  const [merkleProof, setMerkleProof] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [sponsorshipToast, setSponsorshipToast] = useState<'success' | 'failed' | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Get current wallet address
  const { address: currentAddress } = useAccount();

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Fetch real data from API
  const { data: escrowData, isLoading: isLoadingEscrow } = useEscrowAPI(escrowId);
  const { data: approvalData, isLoading: isLoadingApprovals } = useEscrowApprovalProgressAPI(escrowId || '');
  const { data: timelineData, isLoading: isLoadingTimeline } = useEscrowTimelineAPI(escrowId || '');
  const { data: paymasterData, isLoading: isLoadingPaymaster } = useEscrowPaymasterCheckAPI(escrowId || '');
  const { data: commentsData, isLoading: isLoadingComments } = useEscrowCommentsAPI(escrowId || '');
  const { mutate: approveEscrow } = useApproveEscrowAPI();
  const { mutate: addComment } = useAddEscrowCommentAPI();

  const escrow = escrowData;  // useEscrowAPI already returns the escrow object directly
  const timeline = timelineData?.timeline || [];
  const paymasterCheck = paymasterData;
  const comments = commentsData?.comments || [];

  // Known token addresses on Sepolia/Base Sepolia (all lowercase)
  const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
    // Sepolia testnet
    '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', decimals: 6 },
    '0x431d5dff03120afa4bdf332c61a6e1766ef37bdb': { symbol: 'JPYC', decimals: 18 },
    '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9': { symbol: 'PYUSD', decimals: 6 },
    // Base Sepolia (if needed)
    '0x036cbd53842c5426634e7929541ec2318f3dcf7e': { symbol: 'USDC', decimals: 6 },
  };

  // Get token decimals from token address
  const getTokenDecimals = (tokenAddress: string): number => {
    const lowerToken = tokenAddress.toLowerCase();
    const knownToken = KNOWN_TOKENS[lowerToken];
    if (knownToken) {
      return knownToken.decimals;
    }
    // Default to 18 for ETH and most ERC20 tokens
    return 18;
  };

  // Get token symbol from address
  const getTokenSymbol = (tokenAddress: string, decimals: number): string => {
    const lowerToken = tokenAddress.toLowerCase();
    const knownToken = KNOWN_TOKENS[lowerToken];
    if (knownToken) {
      return knownToken.symbol;
    }
    return decimals === 18 ? 'ETH' : 'tokens';
  };

  // Format amount for display based on token
  const formatAmount = (amount: string, tokenAddress: string) => {
    try {
      const decimals = getTokenDecimals(tokenAddress);
      const symbol = getTokenSymbol(tokenAddress, decimals);

      if (decimals === 18) {
        // Use formatEther for 18-decimal tokens (ETH)
        return `${formatEther(BigInt(amount))} ${symbol}`;
      } else if (decimals === 6) {
        // Use BigInt division for 6-decimal tokens (USDC, USDT) to avoid precision loss
        const amountBigInt = BigInt(amount);
        const divisor = BigInt(1000000); // 10^6
        const wholePart = amountBigInt / divisor;
        const fractionalPart = amountBigInt % divisor;

        // Format fractional part with leading zeros
        const fractionalStr = fractionalPart.toString().padStart(6, '0');
        // Take only first 2 decimal places for display
        const displayFractional = fractionalStr.slice(0, 2);

        return `${wholePart}.${displayFractional} ${symbol}`;
      }
      return `${amount} ${symbol}`;
    } catch {
      return '0';
    }
  };

  // Show sponsorship toast notifications (must be before early return to follow React hooks rules)
  React.useEffect(() => {
    if (sponsorshipToast === 'success') {
      toast.success('Sponsorship Successful', {
        description: 'Gas fees will be covered by the family paymaster',
        duration: 3000
      });
      setSponsorshipToast(null);
    } else if (sponsorshipToast === 'failed') {
      toast.error('Sponsorship Failed', {
        description: 'Please use your wallet for gas payment',
        duration: 5000
      });
      setSponsorshipToast(null);
    }
  }, [sponsorshipToast]);

  // Show loading state
  if (isLoadingEscrow || !escrow) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mockEscrow = {
    id: 'ESC-2024-001',
    shortId: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    fullId: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    amount: '0.5 ETH',
    token: 'ETH',
    deadline: '2024-12-30 23:59:59',
    policyId: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
    status: 'pending',
    currentApprovals: 2,
    requiredApprovals: 3,
    recipient: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C',
    creator: 'Tom Smith',
    createdAt: '2024-12-25 10:30:00',
    description: 'Holiday shopping funds for family gifts',
    bundlerJobId: 'BJ-2024-12-001'
  };

  const mockTimeline = [
    {
      id: 1,
      timestamp: '2024-12-25 10:30:00',
      action: 'Escrow Created',
      user: 'Tom Smith',
      type: 'created',
      details: 'Initial request submitted',
      txHash: null,
      userOpHash: null,
      paymasterResponse: null,
      sponsorCost: null
    },
    {
      id: 2,
      timestamp: '2024-12-25 11:15:00',
      action: 'Policy Check Passed',
      user: 'System',
      type: 'system',
      details: 'Spending limits and timelock verified',
      txHash: null,
      userOpHash: null,
      paymasterResponse: { code: 200, message: 'Policy validation successful' },
      sponsorCost: null
    },
    {
      id: 3,
      timestamp: '2024-12-25 12:00:00',
      action: 'Approval Granted',
      user: 'John Smith',
      type: 'approved',
      details: 'Approved with comment: "Approved for holiday expenses"',
      txHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123',
      userOpHash: '0x456789abc012def345678901234567890123456789012345678901234567890123',
      paymasterResponse: { code: 200, message: 'Sponsorship approved' },
      sponsorCost: '0.0021 ETH'
    },
    {
      id: 4,
      timestamp: '2024-12-25 14:30:00',
      action: 'Approval Granted',
      user: 'Mary Smith',
      type: 'approved',
      details: 'Approved via mobile app',
      txHash: '0xdef789abc012345678901234567890123456789012345678901234567890123456',
      userOpHash: '0x789012345678901234567890123456789012345678901234567890123456789012',
      paymasterResponse: { code: 200, message: 'Mobile sponsorship approved' },
      sponsorCost: '0.0019 ETH'
    },
    {
      id: 5,
      timestamp: 'Pending',
      action: 'Awaiting Final Approval',
      user: 'Sarah Smith',
      type: 'pending',
      details: 'Notification sent via push and email',
      txHash: null,
      userOpHash: null,
      paymasterResponse: null,
      sponsorCost: null
    }
  ];

  // No need for mock paymaster check - using real data from paymasterCheck

  const handleApproval = async (decision: 'approve' | 'reject') => {
    setApprovalState('merkle-proof');
    
    // Simulate Merkle proof requirement
    setTimeout(() => {
      if (merkleProof.length > 0) {
        setApprovalState('bundler-sending');
        
        // Simulate bundler sending
        setTimeout(() => {
          // Simulate sponsorship check
          const sponsorshipSuccess = Math.random() > 0.3; // 70% success rate
          setSponsorshipToast(sponsorshipSuccess ? 'success' : 'failed');
          
          if (sponsorshipSuccess) {
            setApprovalState('success');
            toast.success(`Escrow ${decision}d successfully`, {
              description: 'Transaction has been sponsored and sent to the blockchain'
            });
          } else {
            setApprovalState('failed');
            toast.error('Sponsorship failed', {
              description: 'Transaction will fallback to your wallet for gas payment',
              action: {
                label: 'Retry with Fallback',
                onClick: () => setApprovalState('idle')
              }
            });
          }
        }, 2000);
      }
    }, 1000);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!currentAddress) {
      toast.error('Please connect your wallet to add a comment');
      return;
    }

    if (!escrowId) {
      toast.error('Escrow ID is missing');
      return;
    }

    setIsAddingComment(true);

    addComment(
      {
        escrowId: escrowId,
        content: newComment.trim(),
        author: currentAddress,
        authorName: undefined, // Optional: can be added later
      },
      {
        onSuccess: () => {
          setNewComment('');
          setIsAddingComment(false);
          toast.success('Comment added successfully');
        },
        onError: (error) => {
          setIsAddingComment(false);
          console.error('Failed to add comment:', error);
          toast.error('Failed to add comment. Please try again.');
        },
      }
    );
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created': return <Hash className="h-4 w-4 text-blue-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'system': return <Shield className="h-4 w-4 text-purple-500" />;
      default: return <Hash className="h-4 w-4 text-gray-500" />;
    }
  };

  const canApprove = currentRole === 'approver' && mockEscrow.status === 'pending';

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

  return (
    <div className="p-8">
      {/* Header - matching GroupHeader design */}
      <div className="mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-white/5 shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{escrow.name}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground truncate">{escrow.description || 'No description'}</p>
                </div>
              </div>
            </div>
          </div>
          <Badge className={`${getStatusColor(escrow.status || 'draft')} shrink-0`}>
            <span className="flex items-center gap-1 text-xs">
              {getStatusIcon(escrow.status || 'draft')}
              {escrow.status || 'draft'}
            </span>
          </Badge>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Escrow Card - Matching EscrowList design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="glass p-3 sm:p-4 rounded-xl border-white/10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
                {/* Left: Escrow Info */}
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-white text-base sm:text-lg truncate">{escrow.name || `Escrow ${escrow.id.slice(0, 8)}`}</div>
                      <Badge className={`${getStatusColor(escrow.status || 'draft')} shrink-0`}>
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

                {/* Right: Approvals */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {isLoadingApprovals ? (
                      <div className="text-muted-foreground text-sm">Loading...</div>
                    ) : (
                      <>
                        <div className="text-white font-medium text-sm mb-1">
                          Approvals: {approvalData?.currentApprovals || 0}/{approvalData?.requiredApprovals || 0}
                        </div>
                        <Progress
                          value={((approvalData?.currentApprovals || 0) / (approvalData?.requiredApprovals || 1)) * 100}
                          className="w-24 h-2"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Approval Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <span className="text-white text-lg font-semibold">Approval Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Required Approvals</span>
                    <span className="text-white font-medium text-sm">
                      {approvalData?.currentApprovals || 0} / {approvalData?.requiredApprovals || 0}
                    </span>
                  </div>
                  <Progress
                    value={approvalData?.requiredApprovals ? ((approvalData.currentApprovals || 0) / approvalData.requiredApprovals) * 100 : 0}
                    className="h-2"
                  />
                  <div className="text-sm text-muted-foreground">
                    {(approvalData?.requiredApprovals || 0) - (approvalData?.currentApprovals || 0)} more approval(s) needed
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <Activity className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-white text-lg font-semibold">Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No timeline events yet
                    </div>
                  ) : (
                    timeline.map((event, index) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          {getTimelineIcon(event.eventType)}
                          {index < timeline.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{event.eventType.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className="text-sm text-muted-foreground">by {event.actor.slice(0, 6)}...{event.actor.slice(-4)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{JSON.stringify(event.data || {})}</div>
                          <div className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</div>

                          {/* Transaction Details */}
                          {event.txHash && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Tx Hash:</span>
                                <code className="text-xs bg-muted p-1 rounded font-mono">{event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}</code>
                                <Button variant="ghost" size="icon" className="h-5 w-5">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* UserOperation Hash */}
                          {event.userOpHash && (
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">UserOp:</span>
                              <code className="text-xs bg-muted p-1 rounded font-mono">{event.userOpHash.slice(0, 10)}...{event.userOpHash.slice(-8)}</code>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {/* Paymaster Response */}
                          {event.paymasterResponse && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Paymaster:</span>
                              <Badge variant="outline" className="text-xs">
                                {event.paymasterResponse.code} - {event.paymasterResponse.message}
                              </Badge>
                            </div>
                          )}

                          {/* Sponsor Cost */}
                          {event.sponsorCost && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-400" />
                              <span className="text-xs text-muted-foreground">Gas Cost:</span>
                              <span className="text-xs font-mono font-semibold text-green-400">{event.sponsorCost}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Approval Actions */}
          {canApprove && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <Shield className="h-6 w-6 text-green-400" />
                    </div>
                    <span className="text-white text-lg font-semibold">Approval Actions</span>
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                {/* Merkle Proof Input */}
                {approvalState === 'merkle-proof' && (
                  <div className="space-y-3">
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        Please provide your Merkle proof to verify your approval authority.
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="merkle-proof">Merkle Proof</Label>
                      <Input
                        id="merkle-proof"
                        placeholder="0x..."
                        value={merkleProof}
                        onChange={(e) => setMerkleProof(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Bundler Status */}
                {approvalState === 'bundler-sending' && (
                  <div className="space-y-3">
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Sending transaction to bundler...
                      </AlertDescription>
                    </Alert>
                    <BundlerStatus status="sending" />
                  </div>
                )}

                {/* Success State */}
                {approvalState === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Transaction successfully sent and sponsored!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Failed State */}
                {approvalState === 'failed' && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Sponsorship failed. Transaction will require manual gas payment.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="approval-comment">Approval Comment</Label>
                  <Textarea 
                    id="approval-comment"
                    placeholder="Add a comment for your approval decision..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleApproval('approve')}
                    disabled={approvalState === 'bundler-sending'}
                  >
                    {approvalState === 'bundler-sending' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Escrow
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleApproval('reject')}
                    disabled={approvalState === 'bundler-sending'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Escrow
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Your approval will be recorded on-chain and cannot be undone.
                  {paymasterCheck && paymasterCheck.fallbackEnabled && !paymasterCheck.canSponsor && (
                    <div className="mt-1 text-yellow-600">
                      ⚠️ Paymaster may fail - prepare for gas fallback
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Audit Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Activity className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="text-white text-lg font-semibold">Audit Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Created By</label>
                  <div className="font-semibold text-white mt-1">
                    {escrow.type === 'payment' && escrow.requester
                      ? `${escrow.requester.slice(0, 6)}...${escrow.requester.slice(-4)}`
                      : 'System'
                    }
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created At</label>
                  <div className="font-medium text-white mt-1">
                    {new Date(escrow.createdAt).toLocaleString()}
                  </div>
                </div>
                {escrow.metadata?.bundlerJobId && (
                  <div>
                    <label className="text-sm text-muted-foreground">Bundler Job ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted p-2 rounded font-mono flex-1">
                        {escrow.metadata.bundlerJobId as string}
                      </code>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {escrow.onChainEscrowId !== undefined && (
                  <div>
                    <label className="text-sm text-muted-foreground">On-Chain Escrow ID</label>
                    <div className="font-medium text-white mt-1">#{escrow.onChainEscrowId}</div>
                  </div>
                )}
                {escrow.txHash && (
                  <div>
                    <label className="text-sm text-muted-foreground">Transaction Hash</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted p-2 rounded font-mono flex-1">
                        {escrow.txHash.slice(0, 10)}...{escrow.txHash.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${escrow.txHash}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Last Update</label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(escrow.updatedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Comments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                    <MessageSquare className="h-6 w-6 text-pink-400" />
                  </div>
                  <span className="text-white text-lg font-semibold">
                    Comments
                    {comments.length > 0 && (
                      <Badge className="ml-2 bg-pink-500/20 text-pink-300 border-pink-500/30">
                        {comments.length}
                      </Badge>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment Form */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="glass border-white/20 text-white placeholder:text-muted-foreground resize-none"
                    rows={3}
                    disabled={isAddingComment}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={isAddingComment || !newComment.trim() || !currentAddress}
                      className="gradient-primary"
                    >
                      {isAddingComment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </>
                      )}
                    </Button>
                  </div>
                  {!currentAddress && (
                    <p className="text-xs text-yellow-500">
                      Please connect your wallet to add comments
                    </p>
                  )}
                </div>

                <Separator className="bg-white/10" />

                {/* Comments List */}
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="glass p-3 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-white">
                            {comment.authorName || `${comment.author.slice(0, 6)}...${comment.author.slice(-4)}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}