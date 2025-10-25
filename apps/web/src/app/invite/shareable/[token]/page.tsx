'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, DollarSign, Check, AlertCircle, Key, Shield, Wallet, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { USDC_ADDRESS, erc20ABI } from '@/lib/contracts';
import { baseSepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';

interface InviteData {
  id: string;
  vaultId: string;
  role: string;
  expiresAt: string;
  paymentRequired: boolean;
  paymentAmount?: string;
  paymentToken?: string;
  paymentRecipient?: string;
  metadata?: any;
}

type PaymentStep = 'idle' | 'approving' | 'approved' | 'transferring' | 'transferred' | 'verifying' | 'completed';

export default function ShareableKeyInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'connect' | 'payment' | 'accept' | 'success'>('connect');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');

  // Contract interactions
  const { writeContract: approveUSDC, data: approveHash, isPending: isApprovePending } = useWriteContract();
  const { writeContract: transferUSDC, data: transferHash, isPending: isTransferPending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isTransferConfirming, isSuccess: isTransferConfirmed } = useWaitForTransactionReceipt({ hash: transferHash });

  // Read USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS[baseSepolia.id],
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && chainId === baseSepolia.id,
    },
  });

  // Read USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS[baseSepolia.id],
    abi: erc20ABI,
    functionName: 'allowance',
    args: address && inviteData?.paymentRecipient
      ? [address, inviteData.paymentRecipient as `0x${string}`]
      : undefined,
    query: {
      enabled: !!address && !!inviteData?.paymentRecipient && chainId === baseSepolia.id,
    },
  });

  // Fetch invite data
  useEffect(() => {
    if (!token) return;

    const fetchInvite = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiUrl}/invites/${token}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Invite not found or expired');
        }

        const data = await res.json();
        setInviteData(data.invite);

        if (isConnected) {
          setStep(data.invite.paymentRequired ? 'payment' : 'accept');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, isConnected]);

  // Monitor approve transaction
  useEffect(() => {
    if (isApproveConfirmed && paymentStep === 'approving') {
      setPaymentStep('approved');
      toast({
        title: 'Approval Successful',
        description: 'USDC spending approved. Now initiating transfer...',
      });
      refetchAllowance();
      // Auto-start transfer
      setTimeout(() => handleTransfer(), 1000);
    }
  }, [isApproveConfirmed]);

  // Monitor transfer transaction
  useEffect(() => {
    if (isTransferConfirmed && transferHash && paymentStep === 'transferring') {
      setPaymentStep('transferred');
      toast({
        title: 'Payment Successful',
        description: 'USDC payment completed. Verifying...',
      });
      // Complete invite acceptance
      acceptInvite(transferHash);
    }
  }, [isTransferConfirmed, transferHash]);

  // Handle approve
  const handleApprove = async () => {
    if (!inviteData || !address) return;

    try {
      const amountWei = BigInt(inviteData.paymentAmount!);
      setPaymentStep('approving');

      approveUSDC({
        address: USDC_ADDRESS[baseSepolia.id],
        abi: erc20ABI,
        functionName: 'approve',
        args: [inviteData.paymentRecipient as `0x${string}`, amountWei],
      });
    } catch (err) {
      setPaymentStep('idle');
      toast({
        title: 'Approval failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Handle transfer
  const handleTransfer = async () => {
    if (!inviteData || !address) return;

    try {
      const amountWei = BigInt(inviteData.paymentAmount!);
      setPaymentStep('transferring');

      transferUSDC({
        address: USDC_ADDRESS[baseSepolia.id],
        abi: erc20ABI,
        functionName: 'transfer',
        args: [inviteData.paymentRecipient as `0x${string}`, amountWei],
      });
    } catch (err) {
      setPaymentStep('approved');
      toast({
        title: 'Transfer failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Accept invite
  const acceptInvite = async (txHash?: `0x${string}`) => {
    if (!address) return;

    try {
      setPaymentStep('verifying');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature: '0x00', // Mock signature
          paymentTxHash: txHash,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to accept invite');
      }

      setPaymentStep('completed');
      setStep('success');
      toast({
        title: 'Success!',
        description: 'You have successfully joined the vault',
      });

      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      setPaymentStep('transferred');
      toast({
        title: 'Failed to join',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = () => {
    if (!usdcBalance || !inviteData?.paymentAmount) return false;
    return usdcBalance >= BigInt(inviteData.paymentAmount);
  };

  // Check if approval is sufficient
  const hasApproval = () => {
    if (!usdcAllowance || !inviteData?.paymentAmount) return false;
    return usdcAllowance >= BigInt(inviteData.paymentAmount);
  };

  const formatUSDC = (amountWei: string) => {
    return (Number(amountWei) / 1_000_000).toFixed(2);
  };

  const getProgressValue = () => {
    switch (paymentStep) {
      case 'idle': return 0;
      case 'approving': return 25;
      case 'approved': return 50;
      case 'transferring': return 75;
      case 'transferred': return 90;
      case 'verifying': return 95;
      case 'completed': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <Card className="glass-card border-red-500/20 max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Invite Not Found</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')} className="glass border-white/20">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
      <Card className="glass-card border-amber-500/20 max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-500/10">
              <Key className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white">Shareable Key Invitation</CardTitle>
              <CardDescription>You've been invited to join a vault</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invite Info */}
          <div className="glass p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-white">Invitation Details</h3>
            <Separator className="bg-white/10" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Role</span>
                <Badge variant="outline" className="capitalize">{inviteData.role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Expires</span>
                <span className="text-white text-sm">
                  {new Date(inviteData.expiresAt).toLocaleDateString()}
                </span>
              </div>
              {inviteData.paymentRequired && (
                <>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Payment Required</span>
                    <span className="text-amber-400 font-bold">
                      {formatUSDC(inviteData.paymentAmount!)} USDC
                    </span>
                  </div>
                  {address && chainId === baseSepolia.id && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Your USDC Balance</span>
                      <span className="text-white text-sm font-medium">
                        {usdcBalance !== undefined ? formatUnits(usdcBalance, 6) : '...'} USDC
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Wrong Network Alert */}
          {isConnected && chainId !== baseSepolia.id && (
            <Alert className="border-red-500/20 bg-red-500/5">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-red-400">Wrong Network</AlertTitle>
              <AlertDescription>
                Please switch to Base Sepolia network in your wallet to continue.
              </AlertDescription>
            </Alert>
          )}

          {/* Insufficient Balance Alert */}
          {isConnected && inviteData.paymentRequired && !hasSufficientBalance() && chainId === baseSepolia.id && (
            <Alert className="border-red-500/20 bg-red-500/5">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-red-400">Insufficient Balance</AlertTitle>
              <AlertDescription>
                You need at least {formatUSDC(inviteData.paymentAmount!)} USDC to join.
                Current balance: {usdcBalance !== undefined ? formatUnits(usdcBalance, 6) : '0'} USDC
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Progress */}
          {inviteData.paymentRequired && step === 'payment' && paymentStep !== 'idle' && (
            <div className="glass p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Payment Progress</span>
                <span className="text-xs text-muted-foreground">{getProgressValue()}%</span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${paymentStep === 'approving' || paymentStep === 'approved' ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  Approve
                </div>
                <div className={`flex items-center gap-1 ${paymentStep === 'transferring' || paymentStep === 'transferred' ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  Transfer
                </div>
                <div className={`flex items-center gap-1 ${paymentStep === 'completed' ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  Verify
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isConnected ? (
            <Alert className="border-blue-500/20 bg-blue-500/5">
              <Wallet className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-400">Connect Wallet</AlertTitle>
              <AlertDescription>
                Please connect your wallet to continue with the invitation.
              </AlertDescription>
            </Alert>
          ) : chainId !== baseSepolia.id ? (
            <Button disabled className="w-full">
              Switch to Base Sepolia Network
            </Button>
          ) : step === 'payment' ? (
            <div className="space-y-3">
              {!hasApproval() ? (
                <Button
                  onClick={handleApprove}
                  disabled={isApprovePending || isApproveConfirming || !hasSufficientBalance()}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isApprovePending || isApproveConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isApprovePending ? 'Confirm in wallet...' : 'Approving USDC...'}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Step 1: Approve {formatUSDC(inviteData.paymentAmount!)} USDC
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleTransfer}
                  disabled={isTransferPending || isTransferConfirming || paymentStep === 'verifying'}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {isTransferPending || isTransferConfirming || paymentStep === 'verifying' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isTransferPending ? 'Confirm in wallet...' : paymentStep === 'verifying' ? 'Verifying...' : 'Processing payment...'}
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Step 2: Pay {formatUSDC(inviteData.paymentAmount!)} USDC & Join
                    </>
                  )}
                </Button>
              )}
              {transferHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${transferHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-amber-400 hover:underline"
                >
                  View transaction
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : step === 'accept' ? (
            <Button
              onClick={() => acceptInvite()}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept Invitation (Free)
            </Button>
          ) : (
            <Alert className="border-green-500/20 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">Success!</AlertTitle>
              <AlertDescription>
                You have successfully joined the vault. Redirecting...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
