/**
 * MemberIdentifierDisplay Component
 *
 * Displays member identifier information with CAIP-10 support
 * and multi-chain compatibility.
 */

import { useState } from 'react';
import { Check, Copy, ExternalLink, User, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MemberIdentifier } from '@shared/types/identifiers';
import { getExplorerAddressUrl } from '@shared/utils/identifiers';
import { cn } from '@/lib/utils';

export interface MemberIdentifierDisplayProps {
  /** Member identifier to display */
  memberIdentifier: MemberIdentifier;

  /** Display format */
  format?: 'short' | 'full' | 'caip10' | 'name' | 'role';

  /** Show copy button */
  showCopy?: boolean;

  /** Show block explorer link */
  showExplorer?: boolean;

  /** Show role badge */
  showRoleBadge?: boolean;

  /** Show weight indicator */
  showWeight?: boolean;

  /** Show user icon */
  showIcon?: boolean;

  /** Additional CSS classes */
  className?: string;
}

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  guardian: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  requester: 'bg-green-500/20 text-green-300 border-green-500/30',
  viewer: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  approver: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  guardian: 'Guardian',
  requester: 'Requester',
  viewer: 'Viewer',
  approver: 'Approver',
};

/**
 * MemberIdentifierDisplay Component
 */
export function MemberIdentifierDisplay({
  memberIdentifier,
  format = 'short',
  showCopy = false,
  showExplorer = false,
  showRoleBadge = true,
  showWeight = false,
  showIcon = true,
  className,
}: MemberIdentifierDisplayProps) {
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

  const renderContent = () => {
    switch (format) {
      case 'short':
        return (
          <span className="font-mono text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
            {memberIdentifier.displayName || memberIdentifier.shortAddress}
          </span>
        );

      case 'full':
        return (
          <span className="font-mono text-xs sm:text-sm break-all">
            {memberIdentifier.displayName && (
              <span className="font-semibold mr-1 sm:mr-2">{memberIdentifier.displayName}</span>
            )}
            {memberIdentifier.address}
          </span>
        );

      case 'caip10':
        return (
          <span className="font-mono text-xs sm:text-sm break-all">
            {memberIdentifier.caip10}
          </span>
        );

      case 'name':
        return (
          <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
            {memberIdentifier.displayName || memberIdentifier.shortAddress}
          </span>
        );

      case 'role':
        return (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
              {memberIdentifier.displayName || memberIdentifier.shortAddress}
            </span>
            <Badge className={cn('text-xs', ROLE_STYLES[memberIdentifier.role])}>
              {ROLE_LABELS[memberIdentifier.role]}
            </Badge>
          </div>
        );

      default:
        return (
          <span className="font-mono text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
            {memberIdentifier.shortAddress}
          </span>
        );
    }
  };

  const getCopyText = () => {
    switch (format) {
      case 'caip10':
        return memberIdentifier.caip10;
      case 'name':
        return memberIdentifier.displayName || memberIdentifier.address;
      default:
        return memberIdentifier.address;
    }
  };

  return (
    <div className={cn('flex items-center gap-1.5 sm:gap-2 flex-wrap', className)}>
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
        {showIcon && <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />}
        {renderContent()}
      </div>

      {showRoleBadge && format !== 'role' && (
        <Badge className={cn('text-xs', ROLE_STYLES[memberIdentifier.role])}>
          <Shield className="w-3 h-3 mr-1" />
          {ROLE_LABELS[memberIdentifier.role]}
        </Badge>
      )}

      {showWeight && memberIdentifier.weight !== undefined && (
        <Badge variant="outline" className="text-xs">
          Weight: {memberIdentifier.weight}
        </Badge>
      )}

      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(getCopyText())}
          className="h-5 sm:h-6 px-1.5 sm:px-2 shrink-0"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      )}

      {showExplorer && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-5 sm:h-6 px-1.5 sm:px-2 shrink-0"
        >
          <a
            href={getExplorerAddressUrl(memberIdentifier.chainId, memberIdentifier.address)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      )}
    </div>
  );
}

/**
 * Compact Member List Display
 * Shows multiple members in a compact format
 */
export interface MemberListDisplayProps {
  members: MemberIdentifier[];
  maxDisplay?: number;
  showRoleBadges?: boolean;
  className?: string;
}

export function MemberListDisplay({
  members,
  maxDisplay = 5,
  showRoleBadges = true,
  className,
}: MemberListDisplayProps) {
  const displayMembers = members.slice(0, maxDisplay);
  const remaining = members.length - maxDisplay;

  return (
    <div className={cn('flex flex-col gap-1.5 sm:gap-2', className)}>
      {displayMembers.map((member) => (
        <MemberIdentifierDisplay
          key={member.id}
          memberIdentifier={member}
          format="role"
          showCopy={true}
          showExplorer={true}
          showRoleBadge={showRoleBadges}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs sm:text-sm text-muted-foreground">
          +{remaining} more member{remaining !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

/**
 * Member Role Summary
 * Shows role distribution summary
 */
export interface MemberRoleSummaryProps {
  members: MemberIdentifier[];
  className?: string;
}

export function MemberRoleSummary({ members, className }: MemberRoleSummaryProps) {
  const roleCounts = members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn('flex flex-wrap gap-1.5 sm:gap-2', className)}>
      {Object.entries(roleCounts).map(([role, count]) => (
        <Badge key={role} className={cn('text-xs', ROLE_STYLES[role])}>
          <Shield className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">{ROLE_LABELS[role]}: </span>
          <span className="sm:hidden">{ROLE_LABELS[role].slice(0, 1)}: </span>
          {count}
        </Badge>
      ))}
    </div>
  );
}
