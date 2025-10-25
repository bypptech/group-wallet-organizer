import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCollection } from '@/hooks/useCollections';
import type { ParticipantStatus } from '@shared/types/collection';
import {
  Users,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  Wallet,
  ArrowLeft,
  Settings,
  FileText
} from 'lucide-react';

interface CollectionDetailProps {
  collectionId: string;
  onBack?: () => void;
  onRecordPayment?: (participantAddress: string) => void;
}

export function CollectionDetail({ collectionId, onBack, onRecordPayment }: CollectionDetailProps) {
  const { collection, stats, isLoading, error } = useCollection(collectionId);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error || !collection || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">Failed to load collection</p>
        </div>
      </div>
    );
  }

  const metadata = collection.metadata || {};
  const participants = collection.participants || [];
  const isCompleted = collection.status === 'on-chain';
  const hasDeadline = collection.deadline;
  const isOverdue = hasDeadline && new Date(collection.deadline!) < new Date() && !isCompleted;

  if (!participants || !Array.isArray(participants)) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">Collection data is incomplete</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amountWei: string | undefined) => {
    if (!amountWei || amountWei === '0') {
      return '0.00';
    }
    try {
      const amount = Number(BigInt(amountWei)) / 1_000_000;
      return amount.toFixed(2);
    } catch (error) {
      console.error('Error formatting amount:', amountWei, error);
      return '0.00';
    }
  };

  const getStatusBadge = (status: ParticipantStatus) => {
    const badges = {
      pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
      partial: { label: 'Partial', className: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
      paid: { label: 'Paid', className: 'bg-green-500/20 text-green-300 border-green-500/50' },
      overdue: { label: 'Overdue', className: 'bg-red-500/20 text-red-300 border-red-500/50' },
    };
    const badge = badges[status];
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          className="glass border-white/20 mb-3 sm:mb-4 text-sm sm:text-base"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          Back to Collections
        </Button>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{collection.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Created {formatDate(collection.createdAt)}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-xs sm:text-sm">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Completed
              </Badge>
            )}
            {isOverdue && (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/50 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass grid w-full grid-cols-3 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-purple-500/20 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {stats.completionRate.toFixed(1)}%
                </div>
                <Progress value={stats.completionRate} className="h-1.5 sm:h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatAmount(metadata.collectedAmount)} / {formatAmount(metadata.totalAmount)} USDC
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {stats.paidParticipants} / {stats.totalParticipants}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingParticipants} pending
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Deadline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {hasDeadline ? (
                  <>
                    <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {formatDate(collection.deadline!)}
                    </div>
                    <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {isOverdue ? 'Overdue' : 'Upcoming'}
                    </p>
                  </>
                ) : (
                  <div className="text-lg sm:text-xl text-muted-foreground">
                    No deadline
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Collection Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Collection Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {collection.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-white">{collection.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Token</p>
                  <code className="text-white text-xs sm:text-sm break-all">
                    {collection.token.slice(0, 6)}...{collection.token.slice(-4)}
                  </code>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-white font-semibold text-sm sm:text-base">{formatAmount(metadata.totalAmount)} USDC</p>
                </div>
              </div>

              {metadata.note && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Note</p>
                  <p className="text-white text-sm sm:text-base">{metadata.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="glass-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Payment Status ({participants.length} members)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2 sm:space-y-3">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.address || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass p-3 sm:p-4 rounded-lg border border-white/10"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 shrink-0">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate text-sm sm:text-base">
                            {participant.name || 'Unnamed Participant'}
                          </h4>
                          {participant.address && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mt-1">
                              <Wallet className="h-3 w-3 shrink-0" />
                              <code className="truncate">
                                {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                              </code>
                            </div>
                          )}
                          {!participant.address && (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-amber-400 mt-1">
                              <Wallet className="h-3 w-3 shrink-0" />
                              <span>Pending wallet connection</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Allocated</p>
                          <p className="text-xs sm:text-sm text-white font-medium">
                            {formatAmount(participant.allocatedAmount)} USDC
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="text-xs sm:text-sm text-white font-medium">
                            {formatAmount(participant.paidAmount)} USDC
                          </p>
                        </div>
                      </div>

                      {participant.paidAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Paid on {formatDate(participant.paidAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                      {getStatusBadge(participant.status)}
                      {participant.status !== 'paid' && onRecordPayment && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass border-purple-500/50 text-xs flex-1 sm:flex-none"
                          onClick={() => onRecordPayment(participant.address)}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Record
                        </Button>
                      )}
                    </div>
                  </div>

                  {participant.status === 'partial' && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                      <Progress
                        value={Number((BigInt(participant.paidAmount) * 100n) / BigInt(participant.allocatedAmount))}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Collection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">General</h3>

                <div className="glass p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Collection Name</p>
                      <p className="text-sm text-muted-foreground">{collection.name}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white font-medium">Status</p>
                      <p className="text-sm text-muted-foreground capitalize">{collection.status}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white font-medium">Created At</p>
                      <p className="text-sm text-muted-foreground">{formatDate(collection.createdAt)}</p>
                    </div>
                  </div>

                  {collection.deadline && (
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <div>
                        <p className="text-white font-medium">Deadline</p>
                        <p className="text-sm text-muted-foreground">{formatDate(collection.deadline)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Token Configuration</h3>

                <div className="glass p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Token Address</p>
                      <code className="text-sm text-muted-foreground">{collection.token}</code>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white font-medium">Vault Address</p>
                      <code className="text-sm text-muted-foreground">{collection.vaultAddress}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Audit Information</h3>

                <div className="glass p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">Collection ID</p>
                      <code className="text-sm text-muted-foreground">{collection.id}</code>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white font-medium">Vault ID</p>
                      <code className="text-sm text-muted-foreground">{collection.vaultId}</code>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white font-medium">Created By</p>
                      <code className="text-sm text-muted-foreground">
                        {collection.createdBy.slice(0, 6)}...{collection.createdBy.slice(-4)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
