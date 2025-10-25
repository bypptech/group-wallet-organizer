import { useEffect, useState } from 'react';
import { useParams, useSearch } from 'wouter';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useDisconnect, useSwitchChain } from 'wagmi';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Crown,
  Users,
  Wallet,
  CheckCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Sparkles,
  ArrowRight,
  Info,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTokenApproval, useTokenBalance, useNeedsApproval } from '@/hooks/useTokenApproval';
import type { Address } from 'viem';
import { baseSepolia } from 'wagmi/chains';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// USDC contract address on Base Sepolia
// TODO: Update this with the correct USDC contract address for Base Sepolia
// Current address appears to be invalid - contract not found on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address;

// Base Sepolia の USDC アドレスが間違っている可能性があります
// 正しいアドレスを確認してください：
// - Base 公式ドキュメント: https://docs.base.org/tokens/list
// - Circle USDC: https://www.circle.com/en/usdc-multichain/base

// ERC20 ABI with balanceOf, transfer
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface ParticipantData {
  id: string;
  name: string;
  allocatedAmount: string;
  status: 'pending' | 'partial' | 'paid';
  address?: string;
}

interface CollectionData {
  id: string;
  name: string;
  vaultId: string;
  vaultName: string;
  vaultAddress?: string;
  deadline?: string;
}

type PaymentStep = 'connect' | 'confirm' | 'approving' | 'paying' | 'success';

export default function CollectionInvitePage() {
  const params = useParams<{ collectionId: string }>();
  const searchString = useSearch();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { toast } = useToast();

  const collectionId = params.collectionId;
  const searchParams = new URLSearchParams(searchString);
  const participantId = searchParams.get('participant');

  const [isLoading, setIsLoading] = useState(true);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('connect');

  // Token approval hooks (jpyc-gacha移植)
  const {
    approve,
    isPending: isApproving,
    isConfirming: isApprovingConfirming,
    isConfirmed: isApproved,
    hash: approveHash
  } = useTokenApproval();

  // Transfer transaction hooks
  const {
    writeContract: writeTransfer,
    data: transferHash,
    isPending: isTransferring
  } = useWriteContract();

  const {
    isLoading: isTransferConfirming,
    isSuccess: isTransferSuccess
  } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  // Get USDC balance (useTokenBalanceフックを使用)
  const {
    balance: usdcBalance,
    isLoading: isBalanceLoading,
    error: balanceError,
    refetch: refetchBalance
  } = useTokenBalance(
    USDC_ADDRESS,
    address
  );

  // デバッグ: バランス情報をログ出力
  useEffect(() => {
    console.log('========== Balance Debug ==========');
    console.log('[Balance Debug] isConnected:', isConnected);
    console.log('[Balance Debug] address:', address);
    console.log('[Balance Debug] chain:', chain);
    console.log('[Balance Debug] chainId:', chain?.id);
    console.log('[Balance Debug] chainName:', chain?.name);
    console.log('[Balance Debug] Expected chainId (Base Sepolia):', baseSepolia.id);
    console.log('[Balance Debug] Is correct network:', chain?.id === baseSepolia.id);
    console.log('[Balance Debug] USDC_ADDRESS:', USDC_ADDRESS);
    console.log('[Balance Debug] isBalanceLoading:', isBalanceLoading);
    console.log('[Balance Debug] balanceError:', balanceError);
    console.log('[Balance Debug] usdcBalance (raw):', usdcBalance);
    console.log('[Balance Debug] usdcBalance (string):', usdcBalance?.toString());
    console.log('[Balance Debug] formatted balance:', usdcBalance ? formatAmount(usdcBalance.toString()) : 'N/A');
    console.log('===================================');
  }, [address, usdcBalance, isBalanceLoading, balanceError, isConnected, chain]);

  // 必要な承認額を計算
  const requiredAmount = participant ? BigInt(participant.allocatedAmount) : undefined;

  // 承認が必要かチェック (jpyc-gacha移植)
  const { needsApproval, currentAllowance, refetch: refetchAllowance } = useNeedsApproval(
    USDC_ADDRESS,
    address,
    collection?.vaultAddress as Address | undefined,
    requiredAmount
  );

  // Format amount for display (USDC has 6 decimals)
  const formatAmount = (amountWei: string | bigint) => {
    try {
      const amount = Number(BigInt(amountWei)) / 1_000_000;
      return amount.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  // Shorten address for display
  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = usdcBalance && participant
    ? usdcBalance >= BigInt(participant.allocatedAmount)
    : false;

  // Fetch participant and collection data
  useEffect(() => {
    const fetchData = async () => {
      if (!collectionId || !participantId) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch collection data
        const collectionResponse = await fetch(`${API_BASE_URL}/collections/${collectionId}`);
        if (!collectionResponse.ok) throw new Error('Collection not found');
        const collectionData = await collectionResponse.json();

        // Fetch participant data
        const participantResponse = await fetch(
          `${API_BASE_URL}/collections/${collectionId}/participants/${participantId}`
        );
        if (!participantResponse.ok) throw new Error('Participant not found');
        const participantData = await participantResponse.json();

        setCollection(collectionData);
        setParticipant(participantData);

        // If already paid, go to success step
        if (participantData.status === 'paid') {
          setPaymentStep('success');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [collectionId, participantId]);

  // Track user's explicit connect action
  const [hasUserClickedConnect, setHasUserClickedConnect] = useState(false);

  // Disconnect wallet on mount to prevent auto-connection (only for this page)
  useEffect(() => {
    if (isConnected && !hasUserClickedConnect && paymentStep === 'connect') {
      console.log('[Payment] Auto-disconnecting wallet on mount');
      disconnect();
    }
  }, []);

  // Log connection state on mount
  useEffect(() => {
    console.log('[Payment] Initial state - isConnected:', isConnected, 'address:', address);
    console.log('[Payment] paymentStep:', paymentStep);
    console.log('[Payment] hasUserClickedConnect:', hasUserClickedConnect);
  }, []);

  // Auto-progress from connect to confirm step ONLY if user clicked connect button
  useEffect(() => {
    const updateWalletAddress = async () => {
      if (paymentStep === 'connect' && isConnected && address && hasUserClickedConnect) {
        console.log('[Payment] Wallet connected:', address);

        // Update participant's wallet address in API
        try {
          const response = await fetch(
            `${API_BASE_URL}/collections/${collectionId}/participants/${participantId}/link-wallet`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address }),
            }
          );

          if (!response.ok) {
            console.error('[Payment] Failed to update wallet address');
            toast({
              title: 'Warning',
              description: 'Failed to link wallet address. Please try again.',
              variant: 'destructive',
            });
            return;
          }

          const updatedParticipant = await response.json();
          setParticipant(updatedParticipant);
          console.log('[Payment] Wallet address updated, moving to confirm step');
          setPaymentStep('confirm');

          toast({
            title: 'Wallet Connected',
            description: 'Your wallet has been successfully linked.',
          });
        } catch (error) {
          console.error('[Payment] Error updating wallet address:', error);
          toast({
            title: 'Connection Error',
            description: 'Failed to link your wallet. Please try again.',
            variant: 'destructive',
          });
        }
      }
    };

    updateWalletAddress();
  }, [paymentStep, isConnected, address, hasUserClickedConnect, collectionId, participantId, toast]);

  // 承認完了時の処理
  useEffect(() => {
    if (isApproved && paymentStep === 'approving') {
      console.log('[Payment] Approval successful, refetching allowance');
      refetchAllowance();
      setPaymentStep('confirm');
      toast({
        title: 'Approval Successful',
        description: 'You can now proceed with the payment.',
      });
    }
  }, [isApproved, paymentStep, refetchAllowance, toast]);

  // Handle transfer success
  useEffect(() => {
    if (isTransferSuccess && transferHash) {
      console.log('[Payment] Transfer successful:', transferHash);

      // Record payment in API
      const recordPayment = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/collections/${collectionId}/participants/${participantId}/record-payment`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ txHash: transferHash }),
            }
          );

          if (!response.ok) {
            console.error('[Payment] Failed to record payment in API');
          } else {
            console.log('[Payment] Payment recorded in API');
          }
        } catch (error) {
          console.error('[Payment] Error recording payment:', error);
        }
      };

      recordPayment();
      setPaymentStep('success');

      toast({
        title: 'Payment Successful!',
        description: 'Your payment has been processed and recorded.',
      });
    }
  }, [isTransferSuccess, transferHash, collectionId, participantId, toast]);

  // Handle approval
  const handleApprove = async () => {
    if (!collection?.vaultAddress || !participant) {
      toast({
        title: 'Missing Information',
        description: 'Required payment information not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPaymentStep('approving');
      console.log('[Payment] Approving USDC for vault:', collection.vaultAddress);

      // 無制限承認でUXを改善（1回の承認で複数回使用可能）
      await approve(USDC_ADDRESS, collection.vaultAddress as Address);

      console.log('[Payment] Approval transaction initiated');
    } catch (err) {
      console.error('[Payment] Approval error:', err);
      setPaymentStep('confirm');
      toast({
        title: 'Approval Failed',
        description: err instanceof Error ? err.message : 'Failed to approve token',
        variant: 'destructive',
      });
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!collection?.vaultAddress || !participant) {
      toast({
        title: 'Missing Information',
        description: 'Required payment information not found.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasSufficientBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough USDC to complete this payment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const paymentAmount = BigInt(participant.allocatedAmount);
      console.log('[Payment] Payment amount:', paymentAmount.toString());
      console.log('[Payment] Transferring to vault:', collection.vaultAddress);

      setPaymentStep('paying');

      // Transfer transaction
      writeTransfer({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [collection.vaultAddress as Address, paymentAmount],
        chainId: baseSepolia.id,
      });

      console.log('[Payment] Transfer transaction initiated');
    } catch (err) {
      console.error('[Payment] Payment error:', err);
      setPaymentStep('confirm');
      toast({
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'Failed to process payment',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !participant || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="glass-card border-red-500/20 bg-red-500/5 max-w-md">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-2">Invalid Invitation</h3>
              <p className="text-muted-foreground">
                {error || 'This invitation link is invalid or has expired.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Crown className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Pay First</h1>
          </div>
          <p className="text-muted-foreground">You pay first, then collect from team members</p>
        </motion.div>

        {/* Collection Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                {collection.vaultName}
              </CardTitle>
              <CardDescription>{collection.name || 'Payment Collection'}</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Payment Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                Your Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Participant Info */}
              <div className="glass p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{participant.name}</h3>
                    {address && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Wallet className="h-3 w-3" />
                        <code>{shortenAddress(address)}</code>
                      </div>
                    )}
                  </div>
                  <Badge
                    className={
                      participant.status === 'paid'
                        ? 'bg-green-500/20 text-green-300 border-green-500/50'
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    }
                  >
                    {participant.status === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>

                {/* Amount Display */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Payment Amount</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-400" />
                    <p className="text-3xl font-bold text-white">
                      {formatAmount(participant.allocatedAmount)} USDC
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Connect Wallet */}
              {paymentStep === 'connect' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 mb-2">
                      Step 1 of 3
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet to continue
                    </p>
                  </div>

                  {/* Show connected wallet if already connected */}
                  {isConnected && address && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">Wallet Connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-3 w-3 text-muted-foreground" />
                        <code className="text-xs text-white">{shortenAddress(address)}</code>
                      </div>
                      <Button
                        onClick={() => {
                          console.log('[Payment] User proceeding with connected wallet');
                          setHasUserClickedConnect(true);
                        }}
                        className="w-full gradient-primary text-white hover-glow mt-2"
                        size="lg"
                      >
                        <ArrowRight className="h-5 w-5 mr-2" />
                        Continue with this Wallet
                      </Button>
                    </div>
                  )}

                  {/* Show connect button if not connected */}
                  {!isConnected && (
                    <>
                      <ConnectButton.Custom>
                        {({ openConnectModal }) => (
                          <Button
                            onClick={() => {
                              console.log('[Payment] User clicked Connect Wallet button');
                              setHasUserClickedConnect(true);
                              openConnectModal();
                            }}
                            className="w-full gradient-primary text-white hover-glow"
                            size="lg"
                          >
                            <Wallet className="h-5 w-5 mr-2" />
                            Connect Wallet
                          </Button>
                        )}
                      </ConnectButton.Custom>

                      <div className="text-xs text-center text-muted-foreground">
                        <p>Supported wallets:</p>
                        <p className="mt-1">MetaMask • Coinbase Wallet • WalletConnect • Rainbow</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Confirm Balance */}
              {paymentStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 mb-2">
                      Step 2 of 3
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Confirm your balance and payment details
                    </p>
                  </div>

                  {/* Connected Wallet Display */}
                  {isConnected && address && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-blue-300">Connected Wallet</span>
                        </div>
                        <code className="text-sm font-mono text-white">{shortenAddress(address)}</code>
                      </div>
                    </div>
                  )}

                  {/* Balance Display */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-muted-foreground">Your USDC Balance</span>
                      <span className="text-lg font-bold text-white">
                        {usdcBalance ? formatAmount(usdcBalance.toString()) : '0.00'} USDC
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-muted-foreground">Required Amount</span>
                      <span className="text-lg font-bold text-purple-400">
                        {formatAmount(participant.allocatedAmount)} USDC
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-muted-foreground">Recipient</span>
                      <code className="text-xs text-white">
                        {collection.vaultAddress ? shortenAddress(collection.vaultAddress) : 'N/A'}
                      </code>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="text-sm text-white">Base Sepolia</span>
                    </div>
                  </div>

                  {/* Network Warning */}
                  {chain && chain.id !== baseSepolia.id && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-3">
                          <p className="font-semibold">Wrong Network</p>
                          <p className="text-xs">
                            Please switch your wallet to <strong>Base Sepolia</strong> network.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Current: {chain.name} (Chain ID: {chain.id})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expected: Base Sepolia (Chain ID: {baseSepolia.id})
                          </p>
                          <Button
                            onClick={() => switchChain({ chainId: baseSepolia.id })}
                            disabled={isSwitchingChain}
                            className="w-full mt-2"
                            size="sm"
                          >
                            {isSwitchingChain ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Switching Network...
                              </>
                            ) : (
                              <>
                                Switch to Base Sepolia
                              </>
                            )}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Balance Status Alert */}
                  {balanceError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Unable to read USDC balance</p>
                          <p className="text-xs">
                            {chain?.id !== baseSepolia.id
                              ? 'Please switch to Base Sepolia network first.'
                              : 'There was an error reading your USDC balance. Please check your wallet connection.'}
                          </p>
                          {chain?.id === baseSepolia.id && (
                            <p className="text-xs text-muted-foreground">
                              Contract: {USDC_ADDRESS}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : hasSufficientBalance ? (
                    <Alert className="border-green-500/30 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        Sufficient balance to proceed with payment
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Insufficient USDC balance. Please add more USDC to your wallet.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Approval Information */}
                  {currentAllowance !== undefined && (
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">Token Allowance</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Current: {formatAmount(currentAllowance.toString())} USDC
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Approve Button (表示条件: needsApproval === true) */}
                    {needsApproval && (
                      <Button
                        onClick={handleApprove}
                        disabled={isApproving || isApprovingConfirming || !hasSufficientBalance}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        size="lg"
                      >
                        {isApproving || isApprovingConfirming ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            {isApproving ? 'Waiting for signature...' : 'Confirming approval...'}
                          </>
                        ) : (
                          <>
                            <Shield className="h-5 w-5 mr-2" />
                            Approve USDC
                          </>
                        )}
                      </Button>
                    )}

                    {/* Payment Button (無効化条件: needsApproval || !hasSufficientBalance) */}
                    <Button
                      onClick={handlePayment}
                      disabled={needsApproval || !hasSufficientBalance}
                      className="w-full gradient-primary text-white hover-glow"
                      size="lg"
                    >
                      <ArrowRight className="h-5 w-5 mr-2" />
                      {needsApproval ? 'Approve First to Proceed' : 'Proceed to Payment'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Approving */}
              {paymentStep === 'approving' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 mb-2">
                      Step 3 of 4
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Approving USDC token access
                    </p>
                  </div>

                  {/* Approving Status */}
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-400" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white mb-1">
                        {isApproving ? 'Waiting for approval...' : 'Confirming approval...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please check your wallet and approve the transaction
                      </p>
                    </div>
                  </div>

                  <Alert className="border-blue-500/30 bg-blue-500/10">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      This approval allows the vault to access your USDC tokens for payment. You only need to do this once.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 4: Payment */}
              {paymentStep === 'paying' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/50 mb-2">
                      Step 4 of 4
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Processing payment transaction
                    </p>
                  </div>

                  {/* Payment Status */}
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin text-green-400" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white mb-1">
                        {isTransferring ? 'Waiting for signature...' : 'Confirming payment...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isTransferring
                          ? 'Please sign the transaction in your wallet'
                          : 'Your transaction is being confirmed on the blockchain'}
                      </p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="p-4 border rounded-lg border-white/10 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-semibold text-white">
                        {formatAmount(participant.allocatedAmount)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">To</span>
                      <code className="text-xs text-white">
                        {collection.vaultAddress ? shortenAddress(collection.vaultAddress) : 'N/A'}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="text-sm text-white">Base Sepolia</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Step */}
              {paymentStep === 'success' && (
                <div className="glass p-6 rounded-xl border border-green-500/30 bg-green-500/5 text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                  <div>
                    <h4 className="text-2xl font-semibold text-white mb-2">Payment Complete!</h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment has been successfully processed and recorded.
                    </p>
                  </div>
                  {transferHash && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                      <code className="text-xs text-green-400 break-all">{transferHash}</code>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
