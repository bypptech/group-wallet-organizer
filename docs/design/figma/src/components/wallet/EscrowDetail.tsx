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
import { toast } from 'sonner@2.0.3';
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
  Activity
} from 'lucide-react';
import { BundlerStatus } from './LoadingStates';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface EscrowDetailProps {
  currentRole: UserRole;
}

export function EscrowDetail({ currentRole }: EscrowDetailProps) {
  const [approvalState, setApprovalState] = useState<'idle' | 'merkle-proof' | 'bundler-sending' | 'success' | 'failed'>('idle');
  const [merkleProof, setMerkleProof] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [sponsorshipToast, setSponsorshipToast] = useState<'success' | 'failed' | null>(null);

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

  const mockPaymasterCheck = {
    status: 'success',
    sponsorshipAvailable: true,
    estimatedGas: '0.002 ETH',
    reason: 'Sufficient balance in sponsor pool',
    fallbackRequired: false,
    poolBalance: '2.45 ETH',
    dailyLimit: '5.0 ETH',
    dailyUsed: '1.2 ETH'
  };

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

  // Show sponsorship toast notifications
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Escrow Detail</h1>
          <p className="text-muted-foreground">ESC-2024-001 • {mockEscrow.description}</p>
        </div>
        <Badge className={
          mockEscrow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          mockEscrow.status === 'approved' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }>
          {mockEscrow.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <span className="font-medium">{mockEscrow.amount}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Token</label>
                  <div className="font-medium">{mockEscrow.token}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Deadline</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{mockEscrow.deadline}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Policy ID</label>
                  <div className="font-medium">{mockEscrow.policyId}</div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm text-muted-foreground">Recipient Address</label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted p-1 rounded text-sm">{mockEscrow.recipient}</code>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Escrow ID</label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted p-1 rounded text-sm">{mockEscrow.shortId.slice(0, 10)}...{mockEscrow.shortId.slice(-6)}</code>
                    <Button variant="ghost" size="icon">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Full ID</summary>
                    <code className="block bg-muted p-2 rounded text-xs mt-1 break-all">
                      {mockEscrow.fullId}
                    </code>
                  </details>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Required Approvals</span>
                  <span className="font-medium">
                    {mockEscrow.currentApprovals} / {mockEscrow.requiredApprovals}
                  </span>
                </div>
                <Progress 
                  value={(mockEscrow.currentApprovals / mockEscrow.requiredApprovals) * 100} 
                  className="h-3"
                />
                <div className="text-sm text-muted-foreground">
                  {mockEscrow.requiredApprovals - mockEscrow.currentApprovals} more approval(s) needed
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paymaster Sponsorship */}
          <Card>
            <CardHeader>
              <CardTitle>Paymaster Sponsorship Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {mockPaymasterCheck.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <div className="font-medium">
                      {mockPaymasterCheck.sponsorshipAvailable ? 'Sponsorship Available' : 'Sponsorship Unavailable'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estimated gas: {mockPaymasterCheck.estimatedGas}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mockPaymasterCheck.reason}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Detailed Sponsorship Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Pool Balance</label>
                    <div className="font-medium">{mockPaymasterCheck.poolBalance}</div>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Daily Limit</label>
                    <div className="font-medium">{mockPaymasterCheck.dailyLimit}</div>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Daily Used</label>
                    <div className="font-medium">{mockPaymasterCheck.dailyUsed}</div>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Fallback Required</label>
                    <div className="font-medium">{mockPaymasterCheck.fallbackRequired ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {mockPaymasterCheck.fallbackRequired && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Paymaster sponsorship may fail. Transaction will fallback to user wallet for gas payment.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeline.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {getTimelineIcon(event.type)}
                      {index < mockTimeline.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.action}</span>
                        <span className="text-sm text-muted-foreground">by {event.user}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{event.details}</div>
                      <div className="text-xs text-muted-foreground">{event.timestamp}</div>
                      
                      {/* Transaction Details */}
                      {event.txHash && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">Tx Hash:</span>
                            <code className="text-xs bg-muted p-1 rounded">{event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}</code>
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* UserOperation Hash */}
                      {event.userOpHash && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">UserOp:</span>
                          <code className="text-xs bg-muted p-1 rounded">{event.userOpHash.slice(0, 10)}...{event.userOpHash.slice(-8)}</code>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Paymaster Response */}
                      {event.paymasterResponse && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">Paymaster:</span>
                          <Badge variant="outline" className="text-xs">
                            {event.paymasterResponse.code} - {event.paymasterResponse.message}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Sponsor Cost */}
                      {event.sponsorCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">Gas Cost:</span>
                          <span className="text-xs font-medium text-green-600">{event.sponsorCost}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Approval Actions */}
          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Approval Actions
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
                  {mockPaymasterCheck.fallbackRequired && (
                    <div className="mt-1 text-yellow-600">
                      ⚠️ Paymaster may fail - prepare for gas fallback
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Created By</label>
                <div className="font-medium">{mockEscrow.creator}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Created At</label>
                <div className="font-medium">{mockEscrow.createdAt}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Bundler Job ID</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted p-1 rounded">{mockEscrow.bundlerJobId}</code>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Last Update</label>
                <div className="text-sm text-muted-foreground">2024-12-25 14:30:00</div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border rounded p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">John Smith</span>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <p className="text-sm">Approved for holiday expenses. Please keep receipts.</p>
                </div>
                <div className="border rounded p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">Mary Smith</span>
                    <span className="text-xs text-muted-foreground">30m ago</span>
                  </div>
                  <p className="text-sm">Looks good to me. Approved via mobile.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}