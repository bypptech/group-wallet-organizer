import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { motion } from 'framer-motion';
import {
  Users,
  Coins,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Sparkles,
  DollarSign,
  Calendar,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import type { ParticipantStatus } from '@shared/types/collection';

type UserRole = 'requester' | 'guardian' | 'owner' | 'viewer';

interface CollectionListProps {
  vaultId?: string;
  onNavigateToDetail?: (collectionId: string) => void;
  onNavigateToCreate?: () => void;
}

export function CollectionList({
  vaultId,
  onNavigateToDetail,
  onNavigateToCreate
}: CollectionListProps) {
  const { collections, isLoading, error, refetch } = useCollections(vaultId);

  // Warning if no vault is selected
  if (!vaultId) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center"
        >
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Vault Selected</h2>
          <p className="text-muted-foreground mb-6">
            Please select a vault from "My Teams" first to view and manage collections.
          </p>
        </motion.div>
      </div>
    );
  }

  const formatAmount = (amountWei: string | undefined) => {
    if (!amountWei) return '0.00';
    const amount = Number(BigInt(amountWei)) / 1_000_000;
    return amount.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string, hasDeadline: boolean, deadline?: string) => {
    if (status === 'on-chain') {
      return (
        <Badge className="gradient-secondary text-white hover-glow">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }

    const isOverdue = hasDeadline && deadline && new Date(deadline) < new Date();
    if (isOverdue) {
      return (
        <Badge className="gradient-danger text-white hover-glow">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge className="gradient-warning text-white hover-glow">
        <Clock className="h-3 w-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  const calculateStats = (collection: any) => {
    const metadata = collection.metadata;

    // Safety checks for undefined data
    if (!metadata || !metadata.participants || !Array.isArray(metadata.participants)) {
      return { totalParticipants: 0, paidParticipants: 0, completionRate: 0 };
    }

    const totalParticipants = metadata.participants.length;
    const paidParticipants = metadata.participants.filter(
      (p: any) => p.status === 'paid'
    ).length;

    const collectedAmount = metadata.collectedAmount ? BigInt(metadata.collectedAmount) : 0n;
    const totalAmount = metadata.totalAmount ? BigInt(metadata.totalAmount) : 0n;
    const completionRate = totalAmount > 0n
      ? Number((collectedAmount * 100n) / totalAmount)
      : 0;

    return { totalParticipants, paidParticipants, completionRate };
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-4">Failed to load collections</p>
          <Button onClick={() => refetch()} className="gradient-primary text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="min-w-0 flex-1">
          <motion.h2
            className="text-xl sm:text-2xl font-semibold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Teams I Fund
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base lg:text-lg mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Track shared payments and contributions
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full sm:w-auto"
        >
          <Button
            className="gradient-primary text-white hover-glow w-full sm:w-auto text-sm sm:text-base"
            onClick={onNavigateToCreate}
          >
            <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Create New Team
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="glass-card hover-glow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Collections</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{collections.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                  <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
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
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Collections</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {collections.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
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
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">-</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Collections List */}
      {collections.length === 0 ? (
        <Card className="glass border-white/10">
          <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
            <Coins className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              No Managed Teams Yet
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Create new team to start tracking shared payments
            </p>
            <Button
              className="gradient-primary text-white hover-glow text-sm sm:text-base"
              onClick={onNavigateToCreate}
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {collections.map((collection, index) => {
            const stats = calculateStats(collection);
            const metadata = collection.metadata;
            const hasDeadline = !!metadata.deadline;

            return (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.01, x: 5 }}
              >
                <Card
                  className="glass p-3 sm:p-4 rounded-xl border-white/10 hover:border-white/30 transition-all cursor-pointer hover-glow"
                  onClick={() => {
                    console.log('[CollectionList] Card clicked, collection:', { id: collection.id, name: collection.name });
                    onNavigateToDetail?.(collection.id);
                  }}
                >
                  <CardContent className="p-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                      {/* Left: Icon & Info */}
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 shrink-0">
                          <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                              {metadata.note || 'Unnamed Collection'}
                            </h3>
                            {getStatusBadge(collection.status, hasDeadline, metadata.deadline)}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap text-xs sm:text-sm">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Created {formatDate(collection.createdAt)}</span>
                            </p>
                            {hasDeadline && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>Deadline: {formatDate(metadata.deadline!)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Center: Progress */}
                      <div className="px-0 lg:px-6 lg:min-w-[200px]">
                        <div className="text-white font-medium text-xs sm:text-sm mb-1">
                          Progress: {stats.completionRate.toFixed(0)}%
                        </div>
                        <Progress value={stats.completionRate} className="h-1.5 sm:h-2" />
                      </div>

                      {/* Right: Stats */}
                      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                            <Users className="h-3 w-3" />
                            <span className="hidden sm:inline">Participants</span>
                          </div>
                          <div className="text-white font-semibold text-sm sm:text-base">
                            {stats.paidParticipants} / {stats.totalParticipants}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                            <DollarSign className="h-3 w-3 text-cyan-400" />
                            <span className="hidden sm:inline">Total</span>
                          </div>
                          <div className="text-cyan-400 font-mono font-bold text-sm sm:text-base">
                            {formatAmount(metadata.totalAmount)} USDC
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="hidden sm:block"
                        >
                          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
