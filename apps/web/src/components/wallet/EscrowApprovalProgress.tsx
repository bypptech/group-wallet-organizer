/**
 * EscrowApprovalProgress Component
 *
 * Policy as Oracle Pattern - 承認進捗の可視化
 * Off-chain での承認状況と On-chain 状態を表示
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import {
  CheckCircle,
  Clock,
  Shield,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Approval {
  guardianId: string;
  guardianAddress: string;
  guardianName?: string;
  approvedAt: string;
  signature?: string;
}

export interface EscrowApprovalProgressProps {
  escrowId: string;
  status: string;
  currentApprovals: number;
  requiredApprovals: number;
  approvals: Approval[];
  policyName?: string;
  onChainId?: string;
  onChainTxHash?: string;
  onApprove?: () => void;
  canApprove?: boolean;
  isApproving?: boolean;
}

export function EscrowApprovalProgress({
  escrowId,
  status,
  currentApprovals,
  requiredApprovals,
  approvals,
  policyName,
  onChainId,
  onChainTxHash,
  onApprove,
  canApprove = false,
  isApproving = false,
}: EscrowApprovalProgressProps) {
  const progressPercentage = (currentApprovals / requiredApprovals) * 100;
  const isApproved = currentApprovals >= requiredApprovals;
  const isOnChain = status === 'on-chain' || status === 'executed';

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'on-chain':
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <Shield className="h-3 w-3" />
            On-chain
          </Badge>
        );
      case 'executed':
        return (
          <Badge variant="default" className="gap-1 bg-purple-500">
            <CheckCircle className="h-3 w-3" />
            Executed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Approval Progress</CardTitle>
          {getStatusBadge()}
        </div>
        {policyName && (
          <p className="text-sm text-muted-foreground">Policy: {policyName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {currentApprovals} / {requiredApprovals} Approvals
            </span>
            <span className="text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {isApproved && (
            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              All required approvals received
            </p>
          )}
        </div>

        <Separator />

        {/* Approval List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Guardians</h4>
          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approvals yet. Waiting for guardian approvals...
            </p>
          ) : (
            <div className="space-y-2">
              {approvals.map((approval, index) => (
                <div
                  key={approval.guardianId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {approval.guardianName
                        ? approval.guardianName.charAt(0).toUpperCase()
                        : 'G'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {approval.guardianName || 'Guardian'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {approval.guardianAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(approval.approvedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approval Action */}
        {canApprove && status === 'submitted' && !isApproved && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                You are authorized to approve this escrow.
              </p>
              <Button
                onClick={onApprove}
                disabled={isApproving}
                className="w-full"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Approve Escrow
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* On-chain Information */}
        {isOnChain && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                On-chain Status
              </h4>
              <div className="space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                {onChainId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      On-chain ID
                    </span>
                    <span className="text-sm font-mono">{onChainId}</span>
                  </div>
                )}
                {onChainTxHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Transaction
                    </span>
                    <a
                      href={`https://sepolia.basescan.org/tx/${onChainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on BaseScan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900 font-medium">
                    Registered on Base Sepolia
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Policy Information */}
        {status === 'submitted' && !isApproved && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  Awaiting Guardian Approval
                </p>
                <p className="text-xs text-amber-700">
                  This escrow requires {requiredApprovals} guardian approval
                  {requiredApprovals > 1 ? 's' : ''} before it can be
                  registered on-chain and executed.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
