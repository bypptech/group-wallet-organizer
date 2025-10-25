/**
 * PolicyIdentifierDisplay Component
 *
 * Displays policy identifier information with CAIP-10 support
 * and multi-chain compatibility.
 */

import { useState } from 'react';
import { Check, Copy, ExternalLink, FileText, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PolicyIdentifier } from '@shared/types/identifiers';
import { getExplorerAddressUrl } from '@shared/utils/identifiers';
import { cn } from '@/lib/utils';

export interface PolicyIdentifierDisplayProps {
  /** Policy identifier to display */
  policyIdentifier: PolicyIdentifier;

  /** Display format */
  format?: 'short' | 'full' | 'caip10' | 'summary';

  /** Show copy button */
  showCopy?: boolean;

  /** Show block explorer link */
  showExplorer?: boolean;

  /** Show status badge */
  showStatusBadge?: boolean;

  /** Show vault info */
  showVault?: boolean;

  /** Show threshold and timelock */
  showDetails?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * PolicyIdentifierDisplay Component
 */
export function PolicyIdentifierDisplay({
  policyIdentifier,
  format = 'short',
  showCopy = false,
  showExplorer = false,
  showStatusBadge = true,
  showVault = false,
  showDetails = false,
  className,
}: PolicyIdentifierDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimelock = (seconds: number): string => {
    if (seconds === 0) return 'No timelock';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const renderContent = () => {
    switch (format) {
      case 'short':
        return (
          <span className="font-mono text-sm">
            Policy {policyIdentifier.shortPolicyId}
          </span>
        );

      case 'full':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm break-all">
              {policyIdentifier.policyId}
            </span>
            {showDetails && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Threshold: {policyIdentifier.threshold}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimelock(policyIdentifier.timelock)}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'caip10':
        return (
          <span className="font-mono text-sm break-all">
            {policyIdentifier.vaultCaip10}
          </span>
        );

      case 'summary':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">
                Policy {policyIdentifier.shortPolicyId}
              </span>
              {showStatusBadge && (
                <Badge
                  variant={policyIdentifier.active ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {policyIdentifier.active ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{policyIdentifier.threshold} approvals</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimelock(policyIdentifier.timelock)}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <span className="font-mono text-sm">
            Policy {policyIdentifier.shortPolicyId}
          </span>
        );
    }
  };

  const getCopyText = () => {
    switch (format) {
      case 'caip10':
        return policyIdentifier.vaultCaip10;
      case 'full':
        return policyIdentifier.policyId;
      default:
        return policyIdentifier.id;
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-muted-foreground" />
          {renderContent()}
        </div>

        {showStatusBadge && format !== 'summary' && (
          <Badge
            variant={policyIdentifier.active ? 'default' : 'secondary'}
            className="text-xs"
          >
            {policyIdentifier.active ? 'Active' : 'Inactive'}
          </Badge>
        )}

        {showCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(getCopyText())}
            className="h-6 px-2"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        )}

        {showExplorer && policyIdentifier.vaultAddress && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-6 px-2"
          >
            <a
              href={getExplorerAddressUrl(
                policyIdentifier.chainId,
                policyIdentifier.vaultAddress
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        )}
      </div>

      {showVault && (
        <div className="text-xs text-muted-foreground">
          Vault: {policyIdentifier.shortVaultAddress}
        </div>
      )}
    </div>
  );
}

/**
 * Policy List Display
 * Shows multiple policies in a compact format
 */
export interface PolicyListDisplayProps {
  policies: PolicyIdentifier[];
  maxDisplay?: number;
  showVault?: boolean;
  className?: string;
}

export function PolicyListDisplay({
  policies,
  maxDisplay = 5,
  showVault = false,
  className,
}: PolicyListDisplayProps) {
  const displayPolicies = policies.slice(0, maxDisplay);
  const remaining = policies.length - maxDisplay;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {displayPolicies.map((policy) => (
        <PolicyIdentifierDisplay
          key={policy.id}
          policyIdentifier={policy}
          format="summary"
          showCopy={true}
          showExplorer={true}
          showVault={showVault}
        />
      ))}
      {remaining > 0 && (
        <span className="text-sm text-muted-foreground">
          +{remaining} more polic{remaining !== 1 ? 'ies' : 'y'}
        </span>
      )}
    </div>
  );
}

/**
 * Policy Details Card
 * Shows comprehensive policy information
 */
export interface PolicyDetailsCardProps {
  policy: PolicyIdentifier;
  className?: string;
}

export function PolicyDetailsCard({ policy, className }: PolicyDetailsCardProps) {
  const formatTimelock = (seconds: number): string => {
    if (seconds === 0) return 'No timelock';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || `${seconds}s`;
  };

  return (
    <div className={cn('bg-card border border-border rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Policy Details</h3>
        </div>
        <Badge variant={policy.active ? 'default' : 'secondary'}>
          {policy.active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Policy ID</div>
          <div className="font-mono text-sm break-all">{policy.policyId}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-1">Vault</div>
          <div className="font-mono text-sm">{policy.shortVaultAddress}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Approval Threshold</div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{policy.threshold}</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Timelock</div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{formatTimelock(policy.timelock)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-1">Chain</div>
          <Badge variant="outline" className="font-mono text-xs">
            {policy.chainId}
          </Badge>
        </div>
      </div>
    </div>
  );
}
