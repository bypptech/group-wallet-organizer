import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, DollarSign, Check, AlertCircle, Key, Shield, Wallet, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { USDC_ADDRESS, erc20ABI } from '@/lib/contracts';
import { baseSepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';
import { CustomConnectButton } from '@/components/wallet/CustomConnectButton';

interface InviteData {
  id: string;
  vaultId: string;
  role: string;
  weight: number;
  expiresAt: string;
  paymentRequired: boolean;
  paymentAmount?: string;
  paymentToken?: string;
  paymentRecipient?: string;
  usedAt?: string | null;
  metadata?: any;
}

type PaymentStep = 'idle' | 'approving' | 'approved' | 'transferring' | 'transferred' | 'verifying' | 'completed';

export default function ShareableKeyInvitePage(props: { params?: { token?: string } }) {
  const [match, params] = useRoute('/invite/shareable/:token');
  const [, setLocation] = useLocation();
  const token = (params?.token || props.params?.token) as string;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiUrl}/invites/${token}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Invite not found or expired');
        }

        const data = await res.json();
        setInviteData(data.invite);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  // Monitor approve transaction
  useEffect(() => {
    console.log('[Approve Monitor]', { isApproveConfirmed, paymentStep, approveHash });
    if (isApproveConfirmed && paymentStep === 'approving') {
      console.log('[Approve Monitor] Setting paymentStep to approved');
      setPaymentStep('approved');
      toast({
        title: 'Approval Successful',
        description: 'USDC spending approved. Now initiating transfer...',
      });
      refetchAllowance();
      // Auto-start transfer
      setTimeout(() => handleTransfer(), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveConfirmed, paymentStep]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTransferConfirmed, transferHash, paymentStep]);

  // Handle approve
  const handleApprove = async () => {
    console.log('[handleApprove] Called', { inviteData, address });
    if (!inviteData || !address) {
      console.log('[handleApprove] Missing data, returning');
      return;
    }

    try {
      const amountWei = BigInt(inviteData.paymentAmount!);
      console.log('[handleApprove] Amount:', amountWei.toString());
      console.log('[handleApprove] Recipient:', inviteData.paymentRecipient);
      console.log('[handleApprove] USDC Address:', USDC_ADDRESS[baseSepolia.id]);

      setPaymentStep('approving');

      const result = approveUSDC({
        address: USDC_ADDRESS[baseSepolia.id],
        abi: erc20ABI,
        functionName: 'approve',
        args: [inviteData.paymentRecipient as `0x${string}`, amountWei],
      });
      console.log('[handleApprove] approveUSDC result:', result);
    } catch (err) {
      console.error('[handleApprove] Error:', err);
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

  // Accept invite (for free invites or after payment)
  const acceptInvite = async (txHash?: `0x${string}`) => {
    if (!address) return;

    try {
      setAccepting(true);
      setPaymentStep('verifying');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiUrl}/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature: '0x' + '0'.repeat(130), // Mock signature
          paymentTxHash: txHash,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to accept invite');
      }

      setPaymentStep('completed');
      setSuccess(true);
      toast({
        title: 'Success!',
        description: 'You have successfully joined the vault',
      });

      setTimeout(() => setLocation('/wallet-demo'), 3000);
    } catch (err) {
      setPaymentStep('transferred');
      toast({
        title: 'Failed to join',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  // Helper functions
  const hasSufficientBalance = () => {
    if (!usdcBalance || !inviteData?.paymentAmount) return false;
    return usdcBalance >= BigInt(inviteData.paymentAmount);
  };

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'guardian':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'requester':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'approver':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'viewer':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading invite details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold">Welcome to the Vault!</h2>
                <p className="text-muted-foreground mt-2">
                  You've successfully joined as a {inviteData?.role}
                </p>
                {inviteData?.paymentRequired && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment of {formatUSDC(inviteData.paymentAmount!)} USDC completed
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to wallet dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Invite not found'}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setLocation('/')} className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if invite is expired or used
  const isExpired = new Date(inviteData.expiresAt) < new Date();
  const isUsed = !!inviteData.usedAt;

  if (isExpired || isUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>{isExpired ? 'Invite Expired' : 'Invite Already Used'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {isExpired
                  ? 'This invite link has expired. Please request a new one.'
                  : 'This invite link has already been used.'}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setLocation('/')} className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main invite display (Team Pay style)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            <CardTitle>Shareable Key Invitation</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join a Family Wallet vault
            {inviteData.paymentRequired && ' (Payment Required)'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Invitation Details */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="outline" className={`${getRoleBadgeColor(inviteData.role)}`}>
                {inviteData.role.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Voting Weight:</span>
              <span className="text-sm font-medium">{inviteData.weight}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expires:</span>
              <span className="text-sm">
                {new Date(inviteData.expiresAt).toLocaleDateString()}
              </span>
            </div>

            {/* Payment Information (if required) */}
            {inviteData.paymentRequired && (
              <>
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Required:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatUSDC(inviteData.paymentAmount!)} USDC
                  </span>
                </div>
                {isConnected && chainId === baseSepolia.id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Your Balance:</span>
                    <span className="text-sm font-medium">
                      {usdcBalance !== undefined ? formatUnits(usdcBalance, 6) : '...'} USDC
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Network Warning */}
          {isConnected && chainId !== baseSepolia.id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wrong Network</AlertTitle>
              <AlertDescription>
                Please switch to Base Sepolia network in your wallet.
              </AlertDescription>
            </Alert>
          )}

          {/* Insufficient Balance Warning */}
          {isConnected && inviteData.paymentRequired && !hasSufficientBalance() && chainId === baseSepolia.id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Insufficient Balance</AlertTitle>
              <AlertDescription>
                You need at least {formatUSDC(inviteData.paymentAmount!)} USDC.
                Current balance: {usdcBalance !== undefined ? formatUnits(usdcBalance, 6) : '0'} USDC
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Progress (only show when payment is in progress) */}
          {inviteData.paymentRequired && paymentStep !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Progress</span>
                <span className="text-xs text-muted-foreground">{getProgressValue()}%</span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${['approving', 'approved', 'transferring', 'transferred', 'verifying', 'completed'].includes(paymentStep) ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {['approving', 'approved', 'transferring', 'transferred', 'verifying', 'completed'].includes(paymentStep) && <Check className="h-3 w-3" />}
                  Approve
                </div>
                <div className={`flex items-center gap-1 ${['transferring', 'transferred', 'verifying', 'completed'].includes(paymentStep) ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {['transferring', 'transferred', 'verifying', 'completed'].includes(paymentStep) && <Check className="h-3 w-3" />}
                  Transfer
                </div>
                <div className={`flex items-center gap-1 ${paymentStep === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {paymentStep === 'completed' && <Check className="h-3 w-3" />}
                  Verify
                </div>
              </div>
            </div>
          )}

          {/* Wallet Connection / Action Buttons */}
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to {inviteData.paymentRequired ? 'proceed with payment and ' : ''}accept this invitation
                </AlertDescription>
              </Alert>
              <CustomConnectButton />
            </div>
          ) : chainId !== baseSepolia.id ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wrong Network</AlertTitle>
                <AlertDescription>
                  You're connected to the wrong network. Please switch to Base Sepolia to continue.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => switchChain({ chainId: baseSepolia.id })}
                disabled={isSwitchingChain}
                className="w-full"
                variant="default"
              >
                {isSwitchingChain ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Switching Network...
                  </>
                ) : (
                  <>
                    Switch to Base Sepolia
                  </>
                )}
              </Button>
            </div>
          ) : inviteData.paymentRequired ? (
            // Payment Required Flow
            <div className="space-y-3">
              {paymentStep === 'idle' || paymentStep === 'approving' ? (
                <Button
                  onClick={handleApprove}
                  disabled={isApprovePending || isApproveConfirming || !hasSufficientBalance() || hasApproval()}
                  className="w-full"
                >
                  {isApprovePending || isApproveConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isApprovePending ? 'Confirm in wallet...' : 'Approving...'}
                    </>
                  ) : hasApproval() ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      USDC Approved
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Approve {formatUSDC(inviteData.paymentAmount!)} USDC
                    </>
                  )}
                </Button>
              ) : null}

              {(hasApproval() || ['approved', 'transferring', 'transferred', 'verifying'].includes(paymentStep)) && (
                <Button
                  onClick={handleTransfer}
                  disabled={isTransferPending || isTransferConfirming || accepting || paymentStep === 'verifying'}
                  className="w-full"
                >
                  {isTransferPending || isTransferConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isTransferPending ? 'Confirm payment...' : 'Processing...'}
                    </>
                  ) : accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying payment...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay {formatUSDC(inviteData.paymentAmount!)} USDC & Join
                    </>
                  )}
                </Button>
              )}

              {transferHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${transferHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-blue-500 hover:underline"
                >
                  View transaction on BaseScan
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            // Free Invite Flow
            <Button
              onClick={() => acceptInvite()}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining vault...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
