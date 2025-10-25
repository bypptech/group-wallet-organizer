import { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion } from 'framer-motion';
import {
  Wallet,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ChevronRight,
  RefreshCw,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';
import { EmptyEscrowList } from './LoadingStates';
import { useEscrowsAPI, useEscrowApprovalProgressAPI, type EscrowStatus as APIEscrowStatus, type Escrow } from '../../hooks/useEscrowsAPI';
import { useVault } from '../../hooks/useVaults';
import { formatEther } from 'viem';
import { ArrowLeft } from 'lucide-react';
import { GroupHeader } from './GroupHeader';

type EscrowStatus = 'all' | APIEscrowStatus;

interface EscrowListProps {
  vaultId?: string;
  onCreateEscrow?: () => void;
  onEscrowClick?: (escrowId: string) => void;
  onBackToGroup?: () => void;
}

export function EscrowList({ vaultId, onCreateEscrow, onEscrowClick, onBackToGroup }: EscrowListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EscrowStatus>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');

  // Fetch vault data to display context
  const { vault, isLoading: isVaultLoading } = useVault(vaultId);

  // Fetch escrows from Neon DB via API
  const { data: escrowsData, isLoading, isError, refetch } = useEscrowsAPI({ vaultId });

  const escrows = escrowsData?.escrows || [];

  // Calculate statistics
  const stats = useMemo(() => {
    const total = escrows.length;
    const pending = escrows.filter(e => e.status === 'submitted').length;
    const approved = escrows.filter(e => e.status === 'approved' || e.status === 'on-chain').length;
    const completed = escrows.filter(e => e.status === 'completed').length;

    return { total, pending, approved, completed };
  }, [escrows]);

  // Filter and sort escrows
  const filteredEscrows = useMemo(() => {
    return escrows
      .filter(escrow => {
        const matchesSearch = escrow.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             escrow.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             escrow.recipient?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || escrow.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'amount':
            return Number(BigInt(b.totalAmount) - BigInt(a.totalAmount));
          case 'status':
            return (a.status || '').localeCompare(b.status || '');
          default:
            return 0;
        }
      });
  }, [escrows, searchQuery, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'submitted': return 'gradient-warning text-white hover-glow';
      case 'approved': return 'gradient-accent text-white hover-glow';
      case 'on-chain': return 'gradient-primary text-white hover-glow';
      case 'completed': return 'gradient-secondary text-white hover-glow';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'expired': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'glass border-white/20 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
      case 'submitted':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'on-chain':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get token decimals from token address
  const getTokenDecimals = (tokenAddress: string): number => {
    const lowerToken = tokenAddress.toLowerCase();
    // Common stablecoins on Base (6 decimals)
    if (lowerToken.includes('usdc') || lowerToken.includes('usdt')) {
      return 6;
    }
    // Default to 6 decimals for USDC (our standard token)
    return 6;
  };

  // Get token symbol from address - Always USDC
  const getTokenSymbol = (tokenAddress: string, decimals: number): string => {
    const lowerToken = tokenAddress.toLowerCase();
    if (lowerToken.includes('usdc')) return 'USDC';
    if (lowerToken.includes('usdt')) return 'USDT';
    // Default to USDC for all tokens
    return 'USDC';
  };

  // Format amount for display based on token
  const formatAmount = (amount: string, tokenAddress: string) => {
    try {
      const decimals = getTokenDecimals(tokenAddress);
      const symbol = getTokenSymbol(tokenAddress, decimals);

      // Always use 6-decimal formatting for USDC
      const amountBigInt = BigInt(amount);
      const divisor = BigInt(1000000); // 10^6
      const wholePart = amountBigInt / divisor;
      const fractionalPart = amountBigInt % divisor;

      // Format fractional part with leading zeros
      const fractionalStr = fractionalPart.toString().padStart(6, '0');
      // Take only first 2 decimal places for display
      const displayFractional = fractionalStr.slice(0, 2);

      return `${wholePart}.${displayFractional} ${symbol}`;
    } catch {
      return '0 USDC';
    }
  };

  // Escrow Card with real-time approval data from DB
  const EscrowCard = ({ escrow, index }: { escrow: Escrow; index: number }) => {
    // Fetch approval data from database for this specific escrow
    const { data: approvalData, isLoading: isLoadingApprovals } = useEscrowApprovalProgressAPI(escrow.id);

    const currentApprovals = approvalData?.currentApprovals ?? 0;
    const requiredApprovals = approvalData?.requiredApprovals ?? 3;

    return (
      <motion.div
        key={escrow.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 + index * 0.1 }}
        whileHover={{ scale: 1.01, x: 5 }}
        className="glass p-3 sm:p-4 rounded-xl border-white/10 hover:border-white/30 transition-all cursor-pointer hover-glow"
        onClick={() => onEscrowClick?.(escrow.id)}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
          {/* Left: Escrow Info */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-semibold text-white text-base sm:text-lg truncate">{escrow.name || `Escrow ${escrow.id.slice(0, 8)}`}</div>
                <Badge className={getStatusColor(escrow.status || 'draft')}>
                  <span className="flex items-center gap-1 text-xs">
                    {getStatusIcon(escrow.status || 'draft')}
                    {escrow.status || 'draft'}
                  </span>
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="hidden sm:inline">Created: </span>{new Date(escrow.createdAt).toLocaleDateString()}
                </div>
                {escrow.deadline && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline">Due: </span>{new Date(escrow.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
              {escrow.recipient && (
                <div className="text-xs font-mono text-muted-foreground mt-1 truncate">
                  To: {escrow.recipient.slice(0, 6)}...{escrow.recipient.slice(-4)}
                </div>
              )}
              {escrow.description && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {escrow.description}
                </div>
              )}
            </div>
          </div>

          {/* Center: Amount */}
          <div className="text-left lg:text-center px-0 lg:px-6 w-full lg:w-auto">
            <div className="flex items-center gap-1 text-cyan-400 font-mono text-lg sm:text-xl font-bold">
              <DollarSign className="h-5 w-5" />
              {formatAmount(escrow.totalAmount, escrow.token)}
            </div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>

          {/* Right: Approvals & Action */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              {isLoadingApprovals ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : (
                <>
                  <div className="text-white font-medium text-sm mb-1">
                    Approvals: {currentApprovals}/{requiredApprovals}
                  </div>
                  <Progress
                    value={(currentApprovals / requiredApprovals) * 100}
                    className="w-24 h-2"
                  />
                </>
              )}
            </div>
            <motion.div
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="p-8">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Failed to load escrows</h3>
            <p className="text-muted-foreground mb-4">Unable to fetch escrow data from the database</p>
            <Button onClick={() => refetch()} variant="outline" className="glass border-white/20">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Button */}
      {/* Group Header */}
      {vaultId && <GroupHeader vaultId={vaultId} />}

      {/* Page Title */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <motion.h2
            className="text-2xl font-semibold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Escrow History
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            All escrow transactions for this group ({filteredEscrows.length} total)
          </motion.p>
        </div>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="icon"
              className="glass border-white/20 hover:border-white/40"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="gradient-primary text-white hover-glow"
              onClick={onCreateEscrow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Escrow
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Statistics Panels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {/* Total Escrows */}
        <Card className="glass-card border-white/10 hover:border-white/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Escrows</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Wallet className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="glass-card border-white/10 hover:border-white/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="glass-card border-white/10 hover:border-white/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="glass-card border-white/10 hover:border-white/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-purple-400">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass border-white/20"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EscrowStatus)}>
                <SelectTrigger className="glass border-white/20">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="on-chain">On-Chain</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="glass border-white/20">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="amount">Amount (Highest)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <Badge className="gradient-primary text-white px-4 py-2 hover-glow">
                  {filteredEscrows.length} Escrows
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Escrow List */}
      {filteredEscrows.length === 0 ? (
        <EmptyEscrowList />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredEscrows.map((escrow, index) => (
                  <EscrowCard key={escrow.id} escrow={escrow} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
