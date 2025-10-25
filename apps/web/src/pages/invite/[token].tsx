import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { CustomConnectButton } from '@/components/wallet/CustomConnectButton';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface InviteData {
  id: string;
  token: string;
  vaultId: string;
  role: 'owner' | 'guardian' | 'requester' | 'viewer' | 'approver';
  weight: number;
  expiresAt: string;
  createdBy: string;
  usedAt?: string | null;
  usedBy?: string | null;
}

export default function InviteTokenPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/invite/:token');
  const { address, isConnected } = useAccount();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inviteCode = params?.token;

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link - missing invite code');
      setLoading(false);
      return;
    }

    // 招待情報を取得
    fetchInviteDetails();
  }, [inviteCode]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[InvitePage] Fetching invite details for token:', inviteCode);

      // APIから取得
      const response = await fetch(`${API_BASE_URL}/invites/${inviteCode}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invite not found');
        }
        if (response.status === 410) {
          const data = await response.json();
          throw new Error(data.error || 'Invite has expired or been used');
        }
        throw new Error('Failed to load invite details');
      }

      const data = await response.json();
      console.log('[InvitePage] Invite data received:', data);
      setInvite(data.invite);
    } catch (err) {
      console.error('[InvitePage] Failed to fetch invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!address || !invite) return;

    try {
      setAccepting(true);
      setError(null);

      console.log('[InvitePage] Accepting invite:', { token: invite.token, address });

      // TODO: EIP-712署名で承諾を証明
      // const signature = await signTypedDataAsync({...})

      const response = await fetch(`${API_BASE_URL}/invites/${invite.token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature: '0x' + '0'.repeat(130), // Mock signature
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to accept invite');
      }

      console.log('[InvitePage] Invite accepted successfully');
      setSuccess(true);

      // 3秒後にウォレットデモページへリダイレクト
      setTimeout(() => {
        navigate('/wallet-demo');
      }, 3000);
    } catch (err) {
      console.error('[InvitePage] Failed to accept invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setAccepting(false);
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
                  You've successfully joined as a {invite?.role}
                </p>
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

  if (error || !invite) {
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
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 有効期限チェック
  const isExpired = new Date(invite.expiresAt) < new Date();
  const isUsed = !!invite.usedAt;

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
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Vault Invitation</CardTitle>
          </div>
          <CardDescription>You've been invited to join a Family Wallet vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Role:</span>
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(
                  invite.role
                )}`}
              >
                {invite.role.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vault ID:</span>
              <span className="text-xs font-mono">
                {invite.vaultId.slice(0, 6)}...{invite.vaultId.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Voting Weight:</span>
              <span className="text-sm font-medium">{invite.weight}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expires:</span>
              <span className="text-sm">
                {new Date(invite.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Please connect your wallet to accept this invitation
                </AlertDescription>
              </Alert>
              <CustomConnectButton />
            </div>
          ) : (
            <div className="space-y-2">
              <Alert>
                <AlertDescription>Connected as {address?.slice(0, 6)}...{address?.slice(-4)}</AlertDescription>
              </Alert>
              <Button
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
            Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
