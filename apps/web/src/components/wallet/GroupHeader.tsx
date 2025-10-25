import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, Wallet, Clock, ArrowLeft } from 'lucide-react';
import { VaultIdentifierDisplay } from './VaultIdentifierDisplay';
import { VAULT_ROLES, getRoleBadgeColor, type VaultRole } from '@/lib/constants/roles';
import { useVault, useVaultStats } from '@/hooks/useVaults';
import { usePendingInvites } from '@/hooks/useInviteManager';

interface GroupHeaderProps {
  vaultId: string;
  currentUserRole?: VaultRole;
  onNavigateToList?: () => void;
}

export function GroupHeader({ vaultId, currentUserRole, onNavigateToList }: GroupHeaderProps) {
  const { vault, members } = useVault(vaultId);
  const stats = useVaultStats(vaultId);
  const { invites: pendingInvites } = usePendingInvites(vault?.address);

  const formatLastActivity = (lastActivity?: string): string => {
    if (!lastActivity) return 'Never';
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayMembers = members.length > 0 ? members : [];

  if (!vault) {
    return null;
  }

  const RoleIcon = currentUserRole ? VAULT_ROLES[currentUserRole as VaultRole]?.icon : null;

  return (
    <div className="mb-6 sm:mb-8">
      {/* Header */}
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
            onClick={onNavigateToList}
            className="hover:bg-white/5 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{vault.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground truncate">{vault.description || 'No description'}</p>
              </div>
            </div>
          </div>
        </div>
        {currentUserRole && (
          <Badge className={`${getRoleBadgeColor(currentUserRole)} shrink-0`}>
            {RoleIcon && <RoleIcon className="h-3 w-3 mr-1" />}
            <span className="text-xs sm:text-sm">{VAULT_ROLES[currentUserRole as VaultRole].label}</span>
          </Badge>
        )}
      </motion.div>

      {/* Team Wallet Address */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 sm:mb-6"
      >
        <Card className="glass-card border-2 border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Team Wallet Address
              </h3>
            </div>
            <VaultIdentifierDisplay
              vaultIdentifier={vault}
              showCopy={true}
              showExplorer={true}
            />
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
