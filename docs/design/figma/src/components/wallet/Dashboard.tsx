import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarInitials } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { motion } from 'motion/react';
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Bell, 
  Plus, 
  Shield, 
  Settings,
  ChevronRight,
  TrendingUp,
  Users,
  RefreshCw,
  Zap,
  Sparkles,
  Rocket,
  Star,
  Send
} from 'lucide-react';
import { DashboardSkeleton, EmptyEscrowList, DataLoadError, EscrowListSkeleton } from './LoadingStates';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface DashboardProps {
  currentRole: UserRole;
}

export function Dashboard({ currentRole }: DashboardProps) {
  const [dataState, setDataState] = useState<'loading' | 'loaded' | 'error' | 'empty'>('loaded');
  const [mockAPIResponse, setMockAPIResponse] = useState('success'); // success, error, empty

  const mockKPIs = {
    pendingApprovals: 3,
    urgentEscrows: 1,
    paymasterBalance: '2.45 ETH',
    notificationDelivery: 98,
    lastUpdated: '2024-12-25 10:45:00'
  };

  const mockNotifications = [
    {
      id: 1,
      title: 'Escrow ESC-2024-001 pending approval',
      time: '5 minutes ago',
      type: 'approval',
      read: false
    },
    {
      id: 2,
      title: 'Paymaster balance low warning',
      time: '1 hour ago',
      type: 'warning',
      read: false
    },
    {
      id: 3,
      title: 'Policy updated: New spending limits',
      time: '2 hours ago',
      type: 'info',
      read: true
    }
  ];

  const mockRecentEscrows = [
    {
      id: 'ESC-2024-001',
      amount: '0.5 ETH',
      status: 'pending',
      deadline: '2024-12-30',
      approvals: 2,
      required: 3
    },
    {
      id: 'ESC-2024-002',
      amount: '1.2 ETH',
      status: 'approved',
      deadline: '2024-12-28',
      approvals: 3,
      required: 3
    },
    {
      id: 'ESC-2024-003',
      amount: '0.8 ETH',
      status: 'released',
      deadline: '2024-12-25',
      approvals: 3,
      required: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'gradient-warning text-white hover-glow';
      case 'approved': return 'gradient-accent text-white hover-glow';
      case 'released': return 'gradient-secondary text-white hover-glow';
      case 'cancelled': return 'gradient-danger text-white hover-glow';
      default: return 'glass border-white/20 text-white hover-glow';
    }
  };

  const getRoleSpecificCTA = () => {
    switch (currentRole) {
      case 'requester':
        return (
          <div className="space-y-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full gradient-secondary text-white hover-glow text-lg py-3">
                <Rocket className="h-5 w-5 mr-2" />
                Create New Escrow
              </Button>
            </motion.div>
            <div className="grid grid-cols-2 gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </motion.div>
            </div>
          </div>
        );
      case 'approver':
        return (
          <div className="space-y-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full gradient-accent text-white hover-glow text-lg py-3">
                <Shield className="h-5 w-5 mr-2" />
                Approvals Hub ({mockKPIs.pendingApprovals})
              </Button>
            </motion.div>
            <div className="grid grid-cols-2 gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <Send className="h-4 w-4 mr-2" />
                  Release Console
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <Settings className="h-4 w-4 mr-2" />
                  Policy
                </Button>
              </motion.div>
            </div>
          </div>
        );
      case 'owner':
        return (
          <div className="space-y-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full gradient-primary text-white hover-glow text-lg py-3">
                <Users className="h-5 w-5 mr-2" />
                Group Creation & Invite
              </Button>
            </motion.div>
            <div className="grid grid-cols-3 gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <Shield className="h-4 w-4 mr-2" />
                  Approvals
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <Send className="h-4 w-4 mr-2" />
                  Release
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" className="w-full glass border-white/20 text-white hover:border-white/40">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </motion.div>
            </div>
          </div>
        );
      case 'viewer':
        return (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full gradient-warning text-white hover-glow text-lg py-3">
              <TrendingUp className="h-5 w-5 mr-2" />
              View Analytics & Audit Log
            </Button>
          </motion.div>
        );
    }
  };

  // Simulate different data states for wireframe demonstration
  const handleStateChange = (state: string) => {
    setDataState(state as any);
  };

  // Show loading skeleton
  if (dataState === 'loading') {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-8">
      {/* Header with State Demo Controls */}
      <motion.div 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Family Wallet Dashboard
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Welcome back to your family vault ✨
          </motion.p>
        </div>
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Badge className="gradient-primary text-white px-4 py-2 hover-glow animate-pulse-glow">
            <Star className="h-4 w-4 mr-2" />
            Smith Family Vault
          </Badge>
          
          {/* Wireframe State Controls */}
          <Select value={dataState} onValueChange={handleStateChange}>
            <SelectTrigger className="w-36 glass border-white/20 hover:border-white/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="loaded">✅ Loaded</SelectItem>
              <SelectItem value="loading">⏳ Loading</SelectItem>
              <SelectItem value="empty">📭 Empty</SelectItem>
              <SelectItem value="error">❌ Error</SelectItem>
            </SelectContent>
          </Select>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button variant="ghost" size="icon" className="relative hover-glow">
              <Bell className="h-5 w-5" />
              {mockKPIs.pendingApprovals > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full gradient-danger text-white flex items-center justify-center text-xs animate-pulse-glow"
                >
                  {mockKPIs.pendingApprovals}
                </motion.div>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Error State */}
      {dataState === 'error' && (
        <DataLoadError 
          onRetry={() => setDataState('loaded')} 
          message="Failed to fetch dashboard data from API"
        />
      )}

      {/* New Features Banner */}
      {currentRole === 'owner' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <Card className="glass-card hover-lift relative overflow-hidden border-cyan-500/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 animate-pulse-glow">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">🎉 New Features Available!</h3>
                    <p className="text-muted-foreground">
                      Advanced group management and multi-signature workflows are now ready
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="gradient-secondary text-white hover-glow">
                      <Shield className="h-4 w-4 mr-2" />
                      Approvals Hub
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="gradient-accent text-white hover-glow">
                      <Send className="h-4 w-4 mr-2" />
                      Release Console
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {currentRole === 'approver' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <Card className="glass-card hover-lift relative overflow-hidden border-green-500/30">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse-glow">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">⚡ Enhanced Approval System</h3>
                    <p className="text-muted-foreground">
                      Live sessions, batch processing, and real-time signature tracking
                    </p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="gradient-accent text-white hover-glow">
                    <Shield className="h-4 w-4 mr-2" />
                    Go to Approvals Hub
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.div
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm flex items-center justify-between text-white">
                Pending Approvals
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover-glow">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </motion.div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 animate-pulse-glow">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <motion.div 
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.2 }}
                  >
                    {mockKPIs.pendingApprovals}
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Requires attention</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-3 opacity-70">
                Updated: {mockKPIs.lastUpdated}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm text-white">Urgent Escrows</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 animate-pulse-glow">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <motion.div 
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.3 }}
                  >
                    {mockKPIs.urgentEscrows}
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Expiring soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm text-white">Paymaster Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 animate-pulse-glow">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div>
                  <motion.div 
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.4 }}
                  >
                    {mockKPIs.paymasterBalance}
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Gas sponsor pool</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm text-white">Notification Delivery</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 animate-pulse-glow">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <motion.div 
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.5 }}
                  >
                    {mockKPIs.notificationDelivery}%
                  </motion.div>
                  <p className="text-sm text-muted-foreground">System health</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Action Panel */}
        <motion.div 
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          {/* Role-specific CTA */}
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <Zap className="h-6 w-6 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {getRoleSpecificCTA()}
            </CardContent>
          </Card>

          {/* Recent Escrows */}
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center justify-between text-white text-xl">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-purple-400" />
                  Recent Escrows
                </div>
                <Badge className="gradient-primary text-white px-3 py-1 hover-glow">
                  {dataState === 'empty' ? 0 : mockRecentEscrows.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {dataState === 'empty' ? (
                <EmptyEscrowList />
              ) : (
                <div className="space-y-4">
                  {mockRecentEscrows.map((escrow, index) => (
                    <motion.div 
                      key={escrow.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="glass p-4 rounded-xl border-white/10 hover:border-white/30 transition-all cursor-pointer hover-glow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                            <Wallet className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white text-lg">{escrow.id}</div>
                            <div className="text-cyan-400 font-mono">{escrow.amount}</div>
                            <div className="text-xs font-mono text-muted-foreground">
                              0x{escrow.id.toLowerCase().replace('esc-', '').replace('-', '')}...abc123
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge className={getStatusColor(escrow.status)}>
                              {escrow.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              Due: {escrow.deadline}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {escrow.approvals}/{escrow.required}
                            </div>
                            <Progress 
                              value={(escrow.approvals / escrow.required) * 100} 
                              className="w-16 h-2 mt-1"
                            />
                          </div>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
        >
          {/* Notifications */}
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  Recent Notifications
                </div>
                <Badge className="gradient-secondary text-white px-2 py-1 hover-glow">
                  {mockNotifications.filter(n => !n.read).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {mockNotifications.map((notification, index) => (
                  <motion.div 
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`glass p-3 rounded-lg border-white/10 hover:border-white/30 transition-all cursor-pointer ${
                      notification.read ? 'opacity-60' : 'hover-glow'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mt-1 animate-pulse-glow" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{notification.title}</div>
                        <div className="text-xs text-muted-foreground">{notification.time}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vault Members */}
          <Card className="glass-card hover-lift relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-emerald-500/10 to-green-500/10 rounded-full blur-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-white">
                <Users className="h-5 w-5 text-emerald-400" />
                Vault Members
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {[
                  { name: 'John Smith', role: 'Owner', initials: 'JS', gradient: 'from-purple-500 to-indigo-500' },
                  { name: 'Mary Smith', role: 'Approver', initials: 'MS', gradient: 'from-emerald-500 to-green-500' },
                  { name: 'Tom Smith', role: 'Requester', initials: 'TS', gradient: 'from-cyan-500 to-blue-500' }
                ].map((member, index) => (
                  <motion.div 
                    key={member.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="glass p-3 rounded-lg border-white/10 hover:border-white/30 transition-all cursor-pointer hover-glow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-semibold animate-pulse-glow`}>
                        {member.initials}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{member.name}</div>
                        <Badge className="glass border-white/20 text-xs mt-1 hover-glow">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}