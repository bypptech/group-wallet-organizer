/**
 * EscrowIdentifierDisplay Component
 *
 * Displays escrow identifier information with CAIP-10 support
 * and multi-chain compatibility.
 */

import { useState } from 'react';
import { Check, Copy, ExternalLink, Lock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EscrowIdentifier } from '@shared/types/identifiers';
import { getExplorerAddressUrl, shortenAddress } from '@shared/utils/identifiers';
import { cn } from '@/lib/utils';

export interface EscrowIdentifierDisplayProps {
  /** Escrow identifier to display */
  escrowIdentifier: EscrowIdentifier;

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

  /** Additional CSS classes */
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ready: 'bg-green-500/20 text-green-300 border-green-500/30',
  released: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  expired: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  ready: 'Ready',
  released: 'Released',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/**
 * Format token amount from wei/smallest unit to human readable
 */
function formatTokenAmount(amount: string | number, decimals: number = 6): string {
  if (!amount || amount === '0' || amount === 0) return '0';
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * EscrowIdentifierDisplay Component
 */
export function EscrowIdentifierDisplay({
  escrowIdentifier,
  format = 'short',
  showCopy = false,
  showExplorer = false,
  showStatusBadge = true,
  showVault = false,
  className,
}: EscrowIdentifierDisplayProps) {
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

  const escrowIdDisplay = escrowIdentifier.escrowId
    ? `${escrowIdentifier.escrowId.slice(0, 10)}...${escrowIdentifier.escrowId.slice(-8)}`
    : escrowIdentifier.id.slice(0, 8);

  const renderContent = () => {
    switch (format) {
      case 'short':
        return (
          <span className="font-mono text-sm">
            Escrow {escrowIdDisplay}
          </span>
        );

      case 'full':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm">
              {escrowIdentifier.escrowId || `ID: ${escrowIdentifier.id}`}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{shortenAddress(escrowIdentifier.requester)}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{shortenAddress(escrowIdentifier.recipient)}</span>
            </div>
          </div>
        );

      case 'caip10':
        return (
          <span className="font-mono text-sm break-all">
            {escrowIdentifier.vaultCaip10}
          </span>
        );

      case 'summary':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">Escrow {escrowIdDisplay}</span>
              {showStatusBadge && (
                <Badge className={cn('text-xs', STATUS_STYLES[escrowIdentifier.status])}>
                  {STATUS_LABELS[escrowIdentifier.status]}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatTokenAmount(escrowIdentifier.amount, 6)} USDC
              {escrowIdentifier.reason && ` · ${escrowIdentifier.reason}`}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{shortenAddress(escrowIdentifier.requester)}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{shortenAddress(escrowIdentifier.recipient)}</span>
            </div>
          </div>
        );

      default:
        return (
          <span className="font-mono text-sm">
            Escrow {escrowIdDisplay}
          </span>
        );
    }
  };

  const getCopyText = () => {
    switch (format) {
      case 'caip10':
        return escrowIdentifier.vaultCaip10;
      case 'full':
        return escrowIdentifier.escrowId || escrowIdentifier.id;
      default:
        return escrowIdentifier.id;
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-muted-foreground" />
          {renderContent()}
        </div>

        {showStatusBadge && format !== 'summary' && (
          <Badge className={cn('text-xs', STATUS_STYLES[escrowIdentifier.status])}>
            {STATUS_LABELS[escrowIdentifier.status]}
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

        {showExplorer && escrowIdentifier.vaultAddress && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-6 px-2"
          >
            <a
              href={getExplorerAddressUrl(
                escrowIdentifier.chainId,
                escrowIdentifier.vaultAddress
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
          Vault: {escrowIdentifier.shortVaultAddress}
        </div>
      )}
    </div>
  );
}

/**
 * Escrow List Display
 * Shows multiple escrows in a compact format
 */
export interface EscrowListDisplayProps {
  escrows: EscrowIdentifier[];
  maxDisplay?: number;
  showVault?: boolean;
  className?: string;
}

export function EscrowListDisplay({
  escrows,
  maxDisplay = 5,
  showVault = false,
  className,
}: EscrowListDisplayProps) {
  const displayEscrows = escrows.slice(0, maxDisplay);
  const remaining = escrows.length - maxDisplay;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {displayEscrows.map((escrow) => (
        <EscrowIdentifierDisplay
          key={escrow.id}
          escrowIdentifier={escrow}
          format="summary"
          showCopy={true}
          showExplorer={true}
          showVault={showVault}
        />
      ))}
      {remaining > 0 && (
        <span className="text-sm text-muted-foreground">
          +{remaining} more escrow{remaining !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

/**
 * Escrow Status Summary
 * Shows status distribution summary
 */
export interface EscrowStatusSummaryProps {
  escrows: EscrowIdentifier[];
  className?: string;
}

export function EscrowStatusSummary({ escrows, className }: EscrowStatusSummaryProps) {
  const statusCounts = escrows.reduce((acc, escrow) => {
    acc[escrow.status] = (acc[escrow.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Object.entries(statusCounts).map(([status, count]) => (
        <Badge key={status} className={cn('text-xs', STATUS_STYLES[status])}>
          {STATUS_LABELS[status]}: {count}
        </Badge>
      ))}
    </div>
  );
}
