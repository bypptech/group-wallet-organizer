import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { 
  Shield, 
  Clock, 
  Users, 
  Zap, 
  Play, 
  Pause, 
  CheckCircle2, 
  Timer,
  QrCode,
  Signature,
  Weight,
  AlertTriangle,
  TrendingUp,
  Eye,
  Send
} from 'lucide-react';

interface ApprovalsHubProps {
  currentRole: string;
}

export function ApprovalsHub({ currentRole }: ApprovalsHubProps) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [proofInput, setProofInput] = useState('');

  // Mock data for demonstration
  const pendingApprovals = [
    {
      id: '0x1234...5678',
      title: '家族旅行費用',
      requester: '田中花子',
      amount: '500,000 JPY',
      currentWeight: 2,
      requiredWeight: 3,
      totalSigners: 5,
      deadline: '2024-10-15',
      timeLeft: '2日 4時間',
      urgency: 'medium',
      type: 'MULTISIG'
    },
    {
      id: '0x2345...6789',
      title: '教育費支援',
      requester: '田中太郎',
      amount: '200,000 JPY',
      currentWeight: 1,
      requiredWeight: 2,
      totalSigners: 4,
      deadline: '2024-10-20',
      timeLeft: '7日 12時間',
      urgency: 'low',
      type: 'TIMELOCK'
    },
    {
      id: '0x3456...7890',
      title: '緊急医療費',
      requester: '田中一郎',
      amount: '300,000 JPY',
      currentWeight: 2,
      requiredWeight: 3,
      totalSigners: 5,
      deadline: '2024-10-08',
      timeLeft: '6時間',
      urgency: 'high',
      type: 'ORACLE'
    }
  ];

  const readyToExecute = [
    {
      id: '0x4567...8901',
      title: '住宅ローン支払い',
      requester: '田中母',
      amount: '1,000,000 JPY',
      currentWeight: 4,
      requiredWeight: 3,
      approvedAt: '2024-10-01 14:30',
      type: 'MULTISIG'
    }
  ];

  const myRequests = [
    {
      id: '0x5678...9012',
      title: '車購入資金',
      amount: '2,000,000 JPY',
      status: 'PENDING',
      currentWeight: 1,
      requiredWeight: 4,
      createdAt: '2024-09-28'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-yellow-500 to-amber-500';
      case 'low': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTISIG': return Users;
      case 'TIMELOCK': return Timer;
      case 'ORACLE': return Eye;
      default: return Shield;
    }
  };

  const renderApprovalCard = (escrow: any, showActions = true) => {
    const TypeIcon = getTypeIcon(escrow.type);
    const progressPercentage = (escrow.currentWeight / escrow.requiredWeight) * 100;

    return (
      <motion.div
        key={escrow.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="mb-4"
      >
        <Card className="glass-card hover-lift cursor-pointer border-white/10" 
              onClick={() => setSelectedEscrow(selectedEscrow === escrow.id ? null : escrow.id)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${getUrgencyColor(escrow.urgency || 'low')} animate-pulse-glow`}>
                  <TypeIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">{escrow.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    依頼者: {escrow.requester} • {escrow.amount}
                  </p>
                </div>
              </div>
              <Badge className={`gradient-${escrow.urgency === 'high' ? 'danger' : escrow.urgency === 'medium' ? 'warning' : 'accent'} text-white`}>
                {escrow.type}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    承認進捗 ({escrow.currentWeight}/{escrow.requiredWeight})
                  </span>
                  <span className="text-sm text-white">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-white/10"
                />
              </div>

              {/* Timeline Info */}
              {escrow.timeLeft && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-muted-foreground">残り時間:</span>
                  <span className={`${escrow.urgency === 'high' ? 'text-red-400' : 'text-white'}`}>
                    {escrow.timeLeft}
                  </span>
                </div>
              )}

              {/* Expanded Details */}
              {selectedEscrow === escrow.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-white/10"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Escrow ID:</span>
                      <p className="text-white font-mono">{escrow.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">署名者数:</span>
                      <p className="text-white">{escrow.totalSigners}名</p>
                    </div>
                  </div>

                  {showActions && currentRole === 'approver' && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        className="gradient-primary text-white hover-glow"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLiveSessionActive(!liveSessionActive);
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        ライブ署名開始
                      </Button>
                      <Button 
                        variant="outline" 
                        className="glass border-white/20 text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Signature className="h-4 w-4 mr-2" />
                        非同期承認
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Approvals Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            マルチシグ承認とライブセッション管理
          </p>
        </div>
        
        {liveSessionActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="glass-card p-4 border-green-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">ライブセッション中</span>
              <Button 
                size="sm" 
                variant="outline"
                className="ml-2 text-white border-white/20"
                onClick={() => setLiveSessionActive(false)}
              >
                <Pause className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: '承認待ち', value: '3', icon: Clock, color: 'from-amber-500 to-orange-500' },
          { title: '実行準備完了', value: '1', icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
          { title: '自分の依頼', value: '1', icon: Users, color: 'from-blue-500 to-cyan-500' },
          { title: '今日の承認', value: '5', icon: TrendingUp, color: 'from-purple-500 to-indigo-500' }
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass grid w-full grid-cols-3 p-1">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Clock className="h-4 w-4 mr-2" />
            承認待ち ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger 
            value="ready" 
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            実行準備完了 ({readyToExecute.length})
          </TabsTrigger>
          <TabsTrigger 
            value="mine" 
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            自分の依頼 ({myRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals */}
        <TabsContent value="pending" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">承認が必要なエスクロー</h3>
              <Badge className="gradient-warning text-white">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {pendingApprovals.filter(e => e.urgency === 'high').length} 件緊急
              </Badge>
            </div>
            
            {pendingApprovals.map(escrow => renderApprovalCard(escrow))}
          </motion.div>
        </TabsContent>

        {/* Ready to Execute */}
        <TabsContent value="ready" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">実行準備完了</h3>
            
            {readyToExecute.map(escrow => (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="mb-4"
              >
                <Card className="glass-card hover-lift border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse-glow">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{escrow.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {escrow.amount} • 承認完了: {escrow.approvedAt}
                          </p>
                        </div>
                      </div>
                      <Button className="gradient-accent text-white hover-glow">
                        <Send className="h-4 w-4 mr-2" />
                        実行する
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* My Requests */}
        <TabsContent value="mine" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">自分が作成したエスクロー</h3>
            
            {myRequests.map(escrow => renderApprovalCard(escrow, false))}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Live Session Modal */}
      {liveSessionActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className="glass-card border-green-500/30 w-80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                ライブ署名セッション
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <QrCode className="h-4 w-4 text-cyan-400" />
                  <span className="text-muted-foreground">セッションURL:</span>
                </div>
                <div className="glass p-2 rounded font-mono text-xs text-cyan-400">
                  wss://live.familywallet.app/session/abc123
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-white" />
                  <span className="text-sm text-white">参加者: 2/3</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Merkle Proof Input Section */}
      {currentRole === 'approver' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Signature className="h-5 w-5 text-purple-400" />
                Merkle Proof 入力
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="proof" className="text-white">Proof データ</Label>
                <Input
                  id="proof"
                  placeholder="0x..."
                  value={proofInput}
                  onChange={(e) => setProofInput(e.target.value)}
                  className="glass border-white/20 text-white mt-2"
                />
              </div>
              <Button className="gradient-primary text-white hover-glow">
                <Zap className="h-4 w-4 mr-2" />
                署名を送信
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}