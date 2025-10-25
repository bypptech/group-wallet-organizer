import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { 
  Send, 
  Clock, 
  Shield, 
  Eye, 
  Users, 
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Filter,
  Search,
  Download,
  ExternalLink,
  Zap,
  Award,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  Target,
  Gauge
} from 'lucide-react';

interface EscrowReleaseConsoleProps {
  currentRole: string;
}

export function EscrowReleaseConsole({ currentRole }: EscrowReleaseConsoleProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEscrows, setSelectedEscrows] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Mock data for demonstration
  const escrowData = [
    {
      id: '0x1234...5678',
      title: '家族旅行費用',
      requester: '田中花子',
      amount: '500,000 JPY',
      type: 'MULTISIG',
      status: 'READY_TO_RELEASE',
      condition: '3-of-5 マルチシグ',
      approvedAt: '2024-10-01 14:30',
      deadline: '2024-10-15',
      currentWeight: 4,
      requiredWeight: 3,
      totalSigners: 5,
      gasEstimate: '0.002 ETH',
      priority: 'medium',
      receipts: 2
    },
    {
      id: '0x2345...6789',
      title: '教育費支援',
      requester: '田中太郎',
      amount: '200,000 JPY',
      type: 'TIMELOCK',
      status: 'TIMELOCK_PASSED',
      condition: '48時間経過後',
      approvedAt: '2024-09-29 10:00',
      deadline: '2024-10-20',
      currentWeight: 3,
      requiredWeight: 2,
      totalSigners: 4,
      gasEstimate: '0.001 ETH',
      priority: 'low',
      receipts: 1
    },
    {
      id: '0x3456...7890',
      title: '医療費緊急支援',
      requester: '田中一郎',
      amount: '300,000 JPY',
      type: 'ORACLE',
      status: 'ORACLE_CONFIRMED',
      condition: 'Oracle 承認済み',
      approvedAt: '2024-10-01 16:45',
      deadline: '2024-10-08',
      currentWeight: 5,
      requiredWeight: 3,
      totalSigners: 5,
      gasEstimate: '0.003 ETH',
      priority: 'high',
      receipts: 0
    },
    {
      id: '0x4567...8901',
      title: '住宅修繕費',
      requester: '田中母',
      amount: '800,000 JPY',
      type: 'MILESTONE',
      status: 'MILESTONE_COMPLETED',
      condition: '修繕完了証明',
      approvedAt: '2024-09-30 12:20',
      deadline: '2024-11-01',
      currentWeight: 4,
      requiredWeight: 4,
      totalSigners: 6,
      gasEstimate: '0.004 ETH',
      priority: 'medium',
      receipts: 3
    }
  ];

  const filterOptions = [
    { value: 'all', label: '全て', count: escrowData.length },
    { value: 'MULTISIG', label: 'マルチシグ', count: escrowData.filter(e => e.type === 'MULTISIG').length },
    { value: 'TIMELOCK', label: 'タイムロック', count: escrowData.filter(e => e.type === 'TIMELOCK').length },
    { value: 'ORACLE', label: 'Oracle', count: escrowData.filter(e => e.type === 'ORACLE').length },
    { value: 'MILESTONE', label: 'マイルストーン', count: escrowData.filter(e => e.type === 'MILESTONE').length }
  ];

  const executionStats = {
    readyToRelease: 4,
    totalValue: '1,800,000 JPY',
    estimatedGas: '0.010 ETH',
    avgProcessingTime: '2.3分'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY_TO_RELEASE': return 'from-green-500 to-emerald-500';
      case 'TIMELOCK_PASSED': return 'from-blue-500 to-cyan-500';
      case 'ORACLE_CONFIRMED': return 'from-purple-500 to-indigo-500';
      case 'MILESTONE_COMPLETED': return 'from-amber-500 to-orange-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTISIG': return Users;
      case 'TIMELOCK': return Timer;
      case 'ORACLE': return Eye;
      case 'MILESTONE': return Target;
      default: return Shield;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const filteredEscrows = escrowData.filter(escrow => {
    const matchesFilter = selectedFilter === 'all' || escrow.type === selectedFilter;
    const matchesSearch = escrow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelectEscrow = (escrowId: string) => {
    setSelectedEscrows(prev => 
      prev.includes(escrowId) 
        ? prev.filter(id => id !== escrowId)
        : [...prev, escrowId]
    );
  };

  const handleBatchRelease = async () => {
    setBatchProcessing(true);
    // Simulate batch processing
    setTimeout(() => {
      setBatchProcessing(false);
      setSelectedEscrows([]);
    }, 3000);
  };

  const renderEscrowCard = (escrow: any) => {
    const TypeIcon = getTypeIcon(escrow.type);
    const isSelected = selectedEscrows.includes(escrow.id);

    return (
      <motion.div
        key={escrow.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="mb-4"
      >
        <Card className={`glass-card hover-lift cursor-pointer transition-all ${
          isSelected ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10'
        }`} 
        onClick={() => handleSelectEscrow(escrow.id)}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getStatusColor(escrow.status)} animate-pulse-glow`}>
                  <TypeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{escrow.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    依頼者: {escrow.requester} • {escrow.amount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`gradient-${escrow.priority === 'high' ? 'danger' : escrow.priority === 'medium' ? 'warning' : 'accent'} text-white`}>
                  {escrow.type}
                </Badge>
                <div className={`text-sm ${getPriorityColor(escrow.priority)}`}>
                  ●
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-xs text-muted-foreground">Escrow ID</span>
                <p className="text-sm text-white font-mono">{escrow.id}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">解放条件</span>
                <p className="text-sm text-white">{escrow.condition}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">承認重み</span>
                <p className="text-sm text-white">{escrow.currentWeight}/{escrow.requiredWeight}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">ガス見積</span>
                <p className="text-sm text-white">{escrow.gasEstimate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <span className="text-muted-foreground">承認:</span>
                  <span className="text-white">{escrow.approvedAt}</span>
                </div>
                {escrow.receipts > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-green-400" />
                    <span className="text-white">{escrow.receipts} 件</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="glass border-white/20 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="gradient-accent text-white hover-glow"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  実行
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Escrow Release Console
          </h1>
          <p className="text-muted-foreground mt-1">
            条件を満たしたエスクローの実行管理
          </p>
        </div>

        {selectedEscrows.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-4"
          >
            <Badge className="gradient-secondary text-white px-3 py-1">
              {selectedEscrows.length} 件選択中
            </Badge>
            <Button 
              className="gradient-primary text-white hover-glow"
              onClick={handleBatchRelease}
              disabled={batchProcessing}
            >
              {batchProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  処理中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  一括実行
                </>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            title: '実行可能', 
            value: executionStats.readyToRelease.toString(), 
            icon: CheckCircle2, 
            color: 'from-green-500 to-emerald-500',
            description: '件のエスクロー'
          },
          { 
            title: '総価値', 
            value: executionStats.totalValue, 
            icon: DollarSign, 
            color: 'from-blue-500 to-cyan-500',
            description: '実行予定額'
          },
          { 
            title: 'ガス見積', 
            value: executionStats.estimatedGas, 
            icon: Zap, 
            color: 'from-purple-500 to-indigo-500',
            description: '合計手数料'
          },
          { 
            title: '平均処理時間', 
            value: executionStats.avgProcessingTime, 
            icon: Gauge, 
            color: 'from-amber-500 to-orange-500',
            description: '実行完了まで'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} animate-pulse-glow`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-white">検索</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="タイトル、依頼者、ID で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass border-white/20 text-white pl-10"
                />
              </div>
            </div>

            <div className="md:w-48">
              <Label className="text-white">条件タイプ</Label>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="glass border-white/20 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {option.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" className="glass border-white/20">
                <Filter className="h-4 w-4 mr-2" />
                フィルタ
              </Button>
              <Button variant="outline" className="glass border-white/20">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escrow List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            実行可能なエスクロー ({filteredEscrows.length})
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>並び順:</span>
            <Select defaultValue="priority">
              <SelectTrigger className="glass border-white/20 text-white w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="priority">優先度</SelectItem>
                <SelectItem value="amount">金額</SelectItem>
                <SelectItem value="deadline">期限</SelectItem>
                <SelectItem value="created">作成日時</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredEscrows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="glass-card p-8 rounded-lg">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">エスクローが見つかりません</h3>
              <p className="text-muted-foreground">
                検索条件またはフィルタを変更してください
              </p>
            </div>
          </motion.div>
        ) : (
          <div>
            {filteredEscrows.map(escrow => renderEscrowCard(escrow))}
          </div>
        )}
      </div>

      {/* Batch Processing Status */}
      {batchProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 w-80"
        >
          <Card className="glass-card border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                一括処理中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">進捗:</span>
                  <span className="text-white">2/{selectedEscrows.length}</span>
                </div>
                <Progress value={66} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Bundler で処理中... 完了までしばらくお待ちください
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Receipt SBT Generation Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass p-4 rounded-lg border-l-4 border-green-500"
      >
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-green-400" />
          <div>
            <h4 className="text-white font-medium">Receipt SBT について</h4>
            <p className="text-sm text-muted-foreground mt-1">
              エスクロー実行完了後、Receipt SBT（Soulbound Token）が自動発行されます。
              この SBT は実行証明として利用でき、監査ログに自動追加されます。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}