import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
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
  Crown,
  Calendar,
  Search,
  Loader2,
  Coins
} from 'lucide-react';
import { useVaults } from '@/hooks/useVaults';
import { useAccount } from 'wagmi';

interface ManagedGroupListProps {
  onNavigateToDetail?: (vaultId: string) => void;
  onNavigateToCreate?: () => void;
}

const ITEMS_PER_PAGE = 5;

export function ManagedGroupList({ onNavigateToDetail, onNavigateToCreate }: ManagedGroupListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { address: userAddress } = useAccount();

  // Fetch user's vaults
  const { vaults, isLoading, error } = useVaults(userAddress);

  // Filter only vaults where user is owner AND vault is collection-group type
  const managedGroups = useMemo(() => {
    console.log('[ManagedGroupList] Filtering vaults:', {
      totalVaults: vaults.length,
      userAddress,
      searchQuery
    });

    return vaults.filter(vault => {
      // In development mode without wallet connection, show all collection groups
      const isDevelopment = import.meta.env.MODE === 'development';

      // Check if this is a collection group (created via Managed Teams)
      const isCollectionGroup = vault.metadata?.type === 'collection-group';

      let isOwner = false;
      if (userAddress) {
        // For collection groups, check creatorAddress in metadata
        // (since /vaults endpoint doesn't include members)
        if (isCollectionGroup && vault.metadata?.creatorAddress) {
          isOwner = vault.metadata.creatorAddress.toLowerCase() === userAddress.toLowerCase();
        } else if (vault.members) {
          // Fallback to members check for regular vaults
          const userMember = vault.members.find(m => m.address.toLowerCase() === userAddress.toLowerCase());
          isOwner = userMember?.role === 'owner';
        }
      } else if (isDevelopment) {
        // In dev mode without address, assume ownership for collection groups
        isOwner = true;
      }

      const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vault.description.toLowerCase().includes(searchQuery.toLowerCase());

      console.log('[ManagedGroupList] Vault filter check:', {
        name: vault.name,
        id: vault.id,
        metadata: vault.metadata,
        userAddress,
        isDevelopment,
        isOwner,
        isCollectionGroup,
        matchesSearch,
        willInclude: isOwner && isCollectionGroup && matchesSearch
      });

      return isOwner && isCollectionGroup && matchesSearch;
    }).sort((a, b) => {
      // Sort by last activity date (newest first)
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [vaults, searchQuery, userAddress]);

  // Pagination calculations
  const totalPages = Math.ceil(managedGroups.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGroups = managedGroups.slice(startIndex, endIndex);

  // Only require wallet connection in production mode
  if (!userAddress && import.meta.env.MODE !== 'development') {
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please connect your wallet to view managed teams</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="glass border-red-500/20 bg-red-500/5">
          <CardContent className="p-8 text-center">
            <p className="text-red-400">Error loading managed teams</p>
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
            Managed Teams
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base lg:text-lg mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You pay first, then collect from team members
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
                {managedGroups.length} {managedGroups.length === 1 ? 'team' : 'teams'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="glass-card hover-glow">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Managed Teams</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{managedGroups.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Collections</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">0</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20">
                  <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {managedGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass border-white/10">
              <CardContent className="p-12 text-center">
                <Crown className="h-16 w-16 text-purple-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No Managed Teams Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first team to start managing collections
                </p>
                <Button
                  onClick={onNavigateToCreate}
                  className="gradient-primary text-white hover-glow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
          {paginatedGroups.map((vault, index) => {
            console.log('[ManagedGroupList] Rendering vault card:', {
              name: vault.name,
              id: vault.id,
              hasMembers: !!vault.members,
              membersArray: vault.members,
              membersLength: vault.members?.length,
              pendingInvitesCount: vault.pendingInvitesCount,
              metadata: vault.metadata
            });
            // Total members = actual members + pending invites
            const actualMemberCount = vault.members?.length || 0;
            const pendingCount = vault.pendingInvitesCount || 0;
            const memberCount = actualMemberCount + pendingCount;
            console.log('[ManagedGroupList] Member count for', vault.name, ':', {
              actual: actualMemberCount,
              pending: pendingCount,
              total: memberCount
            });

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

            // Calculate last activity
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
                key={vault.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01, x: 5 }}
                onClick={() => {
                  console.log('[ManagedGroupList] Card clicked, vault:', { id: vault.id, name: vault.name, address: vault.address });
                  console.log('[ManagedGroupList] Calling onNavigateToDetail with vaultId:', vault.id);
                  onNavigateToDetail?.(vault.id);
                }}
                className="cursor-pointer"
              >
                <Card className="glass p-6 sm:p-7 lg:p-8 rounded-xl border-white/10 hover:border-white/30 transition-all hover-glow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 sm:gap-6 lg:gap-8">
                      {/* Left: Icon & Info */}
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-5 flex-1 min-w-0 w-full">
                        <div className="p-3 sm:p-4 lg:p-5 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 shrink-0">
                          <Crown className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 sm:gap-4 mb-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate">{vault.name}</h3>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 border-0 text-sm sm:text-base px-3 py-1">
                              Leader
                            </Badge>
                          </div>
                          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-2 line-clamp-2">{vault.description}</p>
                        </div>
                      </div>

                      {/* Right: Stats Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full lg:w-auto lg:min-w-[400px]">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base lg:text-lg text-white font-semibold truncate">
                              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">Team size</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-base sm:text-lg lg:text-xl text-cyan-400 font-mono font-semibold truncate">
                              0
                            </p>
                            <p className="text-sm text-muted-foreground truncate">Collections</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-base sm:text-lg lg:text-xl text-white font-medium truncate">{getLastActivity()}</p>
                            <p className="text-sm text-muted-foreground truncate">Last activity</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, managedGroups.length)} of{' '}
                {managedGroups.length} teams
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
