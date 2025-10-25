import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import {
  Users,
  Plus,
  Settings,
  Shield,
  Calendar,
  TrendingUp,
  Search,
  Crown,
  Loader2,
  Key
} from 'lucide-react';
import { VAULT_ROLES, type VaultRole } from '@/lib/constants/roles';
import { useVaults, useVaultStats, type ExtendedVault } from '@/hooks/useVaults';
import { usePendingInvites } from '@/hooks/useInviteManager';
import { useAccount } from 'wagmi';
import { useShareableKeysAPI } from '@/hooks/useShareableKeysAPI';

interface GroupListProps {
  onNavigateToDetail?: (vaultId: string) => void;
  onNavigateToCreate?: () => void;
  onNavigateToShareableKeys?: (vaultId: string) => void;
  onOpenDeviceControl?: (keyId: string, keyName: string) => void;
}

interface VaultWithDetails extends ExtendedVault {
  memberCount: number;
  pendingInvites: number;
  requiredWeight: number;
  myRole: VaultRole;
  totalValue: string;
  lastActivity: string;
}

const ITEMS_PER_PAGE = 5;

export function GroupList({ onNavigateToDetail, onNavigateToCreate, onNavigateToShareableKeys, onOpenDeviceControl }: GroupListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { address: userAddress } = useAccount();

  // Fetch user's vaults
  const { vaults, isLoading, error } = useVaults(userAddress);

  // Fetch shareable keys for the user
  const { data: shareableKeysData } = useShareableKeysAPI(userAddress);
  console.log('[GroupList] Shareable keys raw data:', shareableKeysData, 'isArray:', Array.isArray(shareableKeysData));

  // Handle different response formats
  let shareableKeys: any[] = [];
  if (Array.isArray(shareableKeysData)) {
    shareableKeys = shareableKeysData;
  } else if (shareableKeysData && typeof shareableKeysData === 'object' && 'keys' in shareableKeysData) {
    shareableKeys = Array.isArray((shareableKeysData as any).keys) ? (shareableKeysData as any).keys : [];
  }
  console.log('[GroupList] Extracted shareable keys:', shareableKeys);

  console.log('[GroupList] Vaults data:', vaults.map(v => ({
    id: v.id,
    name: v.name,
    members: v.members,
    hasMembers: !!v.members,
    memberCount: v.members?.length
  })));

  // Sort by last activity (most recent first) and filter
  // Exclude collection-group type vaults (those are shown in Managed Teams)
  const sortedAndFilteredGroups = useMemo(() => {
    const filtered = vaults.filter((vault) => {
      // Exclude collection groups from Team List
      const isCollectionGroup = vault.metadata?.type === 'collection-group';
      if (isCollectionGroup) return false;

      const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vault.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    // Sort by last activity date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [vaults, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedAndFilteredGroups.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGroups = sortedAndFilteredGroups.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getRoleBadgeStyle = (role: VaultRole) => {
    const config = VAULT_ROLES[role];
    return `bg-gradient-to-r ${config.color}`;
  };

  // Calculate stats from actual vault data
  const totalGroups = vaults.length;
  const ownerGuardianCount = vaults.filter(v => {
    // Check the user's actual role in each vault from members data
    const userMember = v.members?.find(m => m.address.toLowerCase() === userAddress?.toLowerCase());
    return userMember && (userMember.role === 'owner' || userMember.role === 'guardian');
  }).length;

  if (!userAddress) {
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">Please connect your wallet to view your teams</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="glass border-red-500/20">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Teams</h3>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <motion.h2
            className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            My Teams
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base lg:text-lg mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Manage your vault teams
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            className="gradient-primary text-white hover-glow w-full sm:w-auto"
            onClick={onNavigateToCreate}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            <span className="text-sm sm:text-base">Create New Team</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Search */}
      <Card className="glass border-white/10">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 glass border-white/20 text-sm sm:text-base"
              />
            </div>
            <div className="flex items-center justify-center md:justify-end px-2 sm:px-4">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {sortedAndFilteredGroups.length} {sortedAndFilteredGroups.length === 1 ? 'team' : 'teams'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="glass-card hover-glow">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Teams</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{totalGroups}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="glass-card hover-glow">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Ownership</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{ownerGuardianCount}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Owner/Guardian roles</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Card className="glass-card hover-glow">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">-</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Coming soon</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Groups List */}
      <div className="space-y-3 sm:space-y-4">
        {sortedAndFilteredGroups.length === 0 ? (
          <Card className="glass border-white/10">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <Users className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No teams found' : 'No teams yet'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create your first vault team to get started'}
              </p>
              {!searchQuery && (
                <Button
                  className="gradient-primary text-white hover-glow"
                  onClick={onNavigateToCreate}
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm sm:text-base">Create Your First Team</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedGroups.map((vault) => {
              // Get all active shareable keys for this vault
              const vaultShareableKeys = shareableKeys.filter(
                (key) => key.vaultId === vault.id && key.status === 'active'
              );

              return (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  userAddress={userAddress}
                  onNavigateToDetail={onNavigateToDetail}
                  onNavigateToShareableKeys={onNavigateToShareableKeys}
                  onOpenDeviceControl={onOpenDeviceControl}
                  getRoleBadgeStyle={getRoleBadgeStyle}
                  vaultShareableKeys={vaultShareableKeys}
                />
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedAndFilteredGroups.length)} of{' '}
                  {sortedAndFilteredGroups.length} teams
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className={
                          currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface VaultCardProps {
  vault: ExtendedVault;
  userAddress: `0x${string}` | undefined;
  onNavigateToDetail?: (vaultId: string) => void;
  onNavigateToShareableKeys?: (vaultId: string) => void;
  onOpenDeviceControl?: (keyId: string, keyName: string) => void;
  getRoleBadgeStyle: (role: VaultRole) => string;
  vaultShareableKeys: any[];
}

function VaultCard({ vault, userAddress, onNavigateToDetail, onNavigateToShareableKeys, onOpenDeviceControl, getRoleBadgeStyle, vaultShareableKeys }: VaultCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine user's role in this vault from members data
  console.log('[VaultCard] Processing vault:', {
    vaultName: vault.name,
    vaultId: vault.id,
    userAddress,
    hasMembers: !!vault.members,
    membersCount: vault.members?.length,
    members: vault.members?.map(m => ({ address: m.address, role: m.role }))
  });

  const userMember = vault.members?.find(m => {
    const matches = m.address.toLowerCase() === userAddress?.toLowerCase();
    console.log('[VaultCard] Checking member:', {
      memberAddress: m.address,
      userAddress,
      matches,
      role: m.role
    });
    return matches;
  });

  console.log('[VaultCard] Found userMember:', userMember);
  const currentRole = (userMember?.role || 'viewer') as VaultRole;
  console.log('[VaultCard] Final role for', vault.name, ':', currentRole);

  // Fetch stats for this specific vault
  const stats = useVaultStats(vault.id);

  // Fetch pending invites for this vault
  const { invites: pendingInvites = [] } = usePendingInvites(vault.id);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate last activity (mock for now)
  const getLastActivity = () => {
    const now = new Date();
    const created = new Date(vault.createdAt);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(vault.createdAt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        console.log('[GroupList] Card clicked, vault:', { id: vault.id, name: vault.name, address: vault.address });
        console.log('[GroupList] Calling onNavigateToDetail with vaultId:', vault.id);
        onNavigateToDetail?.(vault.id);
      }}
      className="cursor-pointer"
    >
      <Card className="glass p-6 sm:p-7 lg:p-8 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow relative">
        {/* Shareable Keys Icon - Popover disabled */}
        {vaultShareableKeys.length > 0 && (
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
            <button
              className="relative p-3 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 hover:border-amber-500/50 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (vaultShareableKeys.length === 1) {
                  // Single key: open device control directly
                  onOpenDeviceControl?.(vaultShareableKeys[0].id, vaultShareableKeys[0].name);
                } else {
                  // Multiple keys: navigate to shareable keys list
                  onNavigateToShareableKeys?.(vault.id);
                }
              }}
            >
              <Key className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
              {vaultShareableKeys.length > 1 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  {vaultShareableKeys.length}
                </span>
              )}
            </button>
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 sm:gap-6 lg:gap-8">
            {/* Left: Icon & Info */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-5 flex-1 min-w-0 w-full">
              <div className="p-3 sm:p-4 lg:p-5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4 mb-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate">{vault.name}</h3>
                  <Badge className={`${getRoleBadgeStyle(currentRole)} text-white border-0 text-sm sm:text-base px-3 py-1`}>
                    {VAULT_ROLES[currentRole].label}
                  </Badge>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-2 line-clamp-2">{vault.description}</p>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full lg:w-auto lg:min-w-[400px] mt-12 sm:mt-14 lg:mt-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base lg:text-lg text-white font-semibold truncate">
                    {stats.totalMembers} Members
                  </p>
                  {pendingInvites.length > 0 && (
                    <p className="text-xs sm:text-sm text-amber-400 font-medium truncate">
                      +{pendingInvites.length} pending
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base lg:text-lg text-white font-semibold truncate">
                    Weight: {vault.metadata?.requiredWeight || stats.requiredApprovals || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Required</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                <div>
                  <p className="text-base sm:text-lg lg:text-xl text-cyan-400 font-mono font-semibold">
                    {stats.totalBalance || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Total value</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                <div>
                  <p className="text-base sm:text-lg lg:text-xl text-white font-medium">{getLastActivity()}</p>
                  <p className="text-sm text-muted-foreground">Last activity</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
