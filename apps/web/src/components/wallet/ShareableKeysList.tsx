import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Plus, Key, Users, Clock, Shield, Loader2, ArrowRight } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useShareableKeysAPI } from '@/hooks/useShareableKeysAPI';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface ShareableKeysListProps {
  onNavigateToCreation?: () => void;
  onNavigateToDetail?: (keyId: string) => void;
  onNavigateToTeamPay?: () => void;
  hasTeams?: boolean;
  filterVaultId?: string;
}

const ITEMS_PER_PAGE = 5;

export function ShareableKeysList({
  onNavigateToCreation,
  onNavigateToDetail,
  onNavigateToTeamPay,
  hasTeams = false,
  filterVaultId
}: ShareableKeysListProps) {
  const { address: userAddress } = useAccount();
  const [showNoTeamDialog, setShowNoTeamDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch shareable keys from API
  const { data: allShareableKeysData, isLoading, error } = useShareableKeysAPI(userAddress);
  console.log('[ShareableKeysList] Raw data:', allShareableKeysData, 'isArray:', Array.isArray(allShareableKeysData));

  // Handle different response formats
  let allShareableKeys: any[] = [];
  if (Array.isArray(allShareableKeysData)) {
    allShareableKeys = allShareableKeysData;
  } else if (allShareableKeysData && typeof allShareableKeysData === 'object' && 'keys' in allShareableKeysData) {
    allShareableKeys = Array.isArray((allShareableKeysData as any).keys) ? (allShareableKeysData as any).keys : [];
  }
  console.log('[ShareableKeysList] Extracted keys:', allShareableKeys);

  // Filter keys by vaultId if provided
  const shareableKeys = filterVaultId
    ? allShareableKeys.filter((key) => key.vaultId === filterVaultId)
    : allShareableKeys;

  console.log('[ShareableKeysList] Processed data:', {
    userAddress,
    filterVaultId,
    allShareableKeysCount: allShareableKeys.length,
    filteredShareableKeysCount: shareableKeys.length,
    isLoading,
    error,
    shareableKeys: shareableKeys.map(k => ({ id: k.id, name: k.name, vaultId: k.vaultId }))
  });

  // Pagination calculations
  const totalPages = Math.ceil(shareableKeys.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedKeys = shareableKeys.slice(startIndex, endIndex);

  // Handle Create Key button click
  const handleCreateKey = () => {
    if (!hasTeams) {
      setShowNoTeamDialog(true);
    } else {
      onNavigateToCreation?.();
    }
  };

  const getStatusColor = (status: ShareableKey['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'revoked':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getTypeIcon = (type: ShareableKey['keyType']) => {
    switch (type) {
      case 'vault':
        return Shield;
      case 'escrow':
        return Key;
      case 'custom':
        return Users;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 7) return `Expires in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading shareable keys...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="p-3 rounded-full bg-red-500/20 w-fit mx-auto">
              <Key className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Keys</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="glass border-white/20 hover:border-amber-500/50"
            >
              Retry
            </Button>
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
            Share Keys
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base lg:text-lg mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Secure key sharing and Access devices
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover-glow w-full sm:w-auto"
            onClick={handleCreateKey}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            <span className="text-sm sm:text-base">Create New Key</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">{shareableKeys.length} Keys</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">
                  {shareableKeys.reduce((sum, key) => sum + key.sharedWith, 0)} Users
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Shared</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">
                  {shareableKeys.filter((k) => k.status === 'active').length} Active
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Keys Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-white font-semibold">
                  {shareableKeys.filter((k) => k.expiresAt).length} Expiring
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">With Deadline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Keys List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-3 sm:space-y-4"
      >
        {shareableKeys.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 sm:p-12 text-center">
              <Key className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Share Keys Yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Create your first share key to grant secure access to your vaults and resources
              </p>
              <Button
                onClick={handleCreateKey}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
          {paginatedKeys.map((key, index) => {
            const TypeIcon = getTypeIcon(key.keyType);
            return (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <Card
                  className="glass-card hover-glow cursor-pointer group"
                  onClick={() => onNavigateToDetail?.(key.id)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Icon */}
                      <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 shrink-0 self-start sm:self-auto">
                        <TypeIcon className="h-6 w-6 sm:h-7 sm:w-7 text-amber-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate group-hover:text-amber-400 transition-colors">
                              {key.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{key.description}</p>
                          </div>
                          <Badge className={`${getStatusColor(key.status)} shrink-0`}>
                            {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm text-white font-semibold truncate">{key.sharedWith} users</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Shared With</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm text-white font-semibold truncate">
                                {key.permissions.length} perms
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Permissions</p>
                            </div>
                          </div>

                          {key.expiresAt && (
                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-white font-semibold truncate">
                                  {formatDate(key.expiresAt)}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Expiration</p>
                              </div>
                            </div>
                          )}
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
                Showing {startIndex + 1}-{Math.min(endIndex, shareableKeys.length)} of{' '}
                {shareableKeys.length} keys
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
      </motion.div>

      {/* No Team Dialog */}
      <Dialog open={showNoTeamDialog} onOpenChange={setShowNoTeamDialog}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Create a Team First</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You need to create a Team before you can create Shareable Keys. Teams help you organize and manage access to your vaults and resources.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Card className="glass-card border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shrink-0">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">What is a Team?</h4>
                    <p className="text-sm text-muted-foreground">
                      A Team is a group of vaults that you can manage together. Once you create a Team, you can create Shareable Keys to grant access to team members.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNoTeamDialog(false)}
              className="glass border-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowNoTeamDialog(false);
                onNavigateToTeamPay?.();
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              Go to Team Pay
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
