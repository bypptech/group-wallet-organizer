import React, { useState } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { motion } from 'motion/react';
import { Dashboard } from './wallet/Dashboard';
import { EscrowDetail } from './wallet/EscrowDetail';
import { EscrowCreateWizard } from './wallet/EscrowCreateWizard';
import { PolicyManagement } from './wallet/PolicyManagement';
import { NotificationCenter } from './wallet/NotificationCenter';
import { VaultSettings } from './wallet/VaultSettings';
import { AuditLogViewer } from './wallet/AuditLogViewer';
import { MobileView } from './wallet/MobileView';
import { AccessibilityGuide } from './wallet/AccessibilityGuide';
import { ApprovalsHub } from './wallet/ApprovalsHub';
import { GroupCreation } from './wallet/GroupCreation';
import { EscrowReleaseConsole } from './wallet/EscrowReleaseConsole';
import { Monitor, Tablet, Smartphone, Users, Shield, Settings, Eye, Sparkles, Zap, Rocket, UserPlus, Send, CheckCircle2 } from 'lucide-react';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';
type ScreenType = 'dashboard' | 'escrow-detail' | 'escrow-create' | 'policy' | 'notifications' | 'settings' | 'audit' | 'accessibility' | 'approvals-hub' | 'group-creation' | 'escrow-release';
type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export function FamilyWalletWireframe() {
  const [currentRole, setCurrentRole] = useState<UserRole>('requester');
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');

  const roleConfig = {
    requester: { 
      icon: Rocket, 
      label: 'Requester (家庭メンバー)', 
      color: 'gradient-secondary text-white',
      bgGradient: 'from-sky-500 to-cyan-500',
      description: 'エスクローを新規作成し進捗を把握'
    },
    approver: { 
      icon: Shield, 
      label: 'Approver / Guardian', 
      color: 'gradient-accent text-white',
      bgGradient: 'from-emerald-500 to-green-500',
      description: '承認キュー処理、ライブセッション、マルチシグ承認'
    },
    owner: { 
      icon: Sparkles, 
      label: 'Owner / Admin', 
      color: 'gradient-primary text-white',
      bgGradient: 'from-indigo-500 to-purple-500',
      description: 'グループ管理、招待発行、エスクロー実行権限'
    },
    viewer: { 
      icon: Eye, 
      label: 'Viewer', 
      color: 'gradient-warning text-white',
      bgGradient: 'from-amber-500 to-orange-500',
      description: '履歴・監査の閲覧'
    }
  };

  const viewportConfig = {
    desktop: { icon: Monitor, label: 'Desktop (1440px)', width: 'max-w-7xl', color: 'text-blue-400' },
    tablet: { icon: Tablet, label: 'Tablet (1024px)', width: 'max-w-4xl', color: 'text-purple-400' },
    mobile: { icon: Smartphone, label: 'Mobile (375px)', width: 'max-w-sm', color: 'text-green-400' }
  };

  const screenNavigation = [
    { id: 'dashboard', label: 'Dashboard', roles: ['requester', 'approver', 'owner', 'viewer'] },
    { id: 'escrow-detail', label: 'Escrow Detail', roles: ['requester', 'approver', 'owner', 'viewer'] },
    { id: 'escrow-create', label: 'Escrow Create', roles: ['requester'] },
    { id: 'policy', label: 'Policy Management', roles: ['owner', 'approver'] },
    { id: 'notifications', label: 'Notifications', roles: ['requester', 'approver', 'owner'] },
    { id: 'settings', label: 'Group Settings', roles: ['owner'] },
    { id: 'audit', label: 'Audit Log', roles: ['owner', 'viewer'] },
    { id: 'approvals-hub', label: 'Approvals Hub', roles: ['approver', 'owner'] },
    { id: 'group-creation', label: 'Group Creation & Invite', roles: ['owner'] },
    { id: 'escrow-release', label: 'Escrow Release Console', roles: ['owner', 'approver'] },
    { id: 'accessibility', label: 'Accessibility Guide', roles: ['requester', 'approver', 'owner', 'viewer'] }
  ];

  const availableScreens = screenNavigation.filter(screen => 
    screen.roles.includes(currentRole)
  );

  const renderContent = () => {
    if (viewportSize === 'mobile') {
      return <MobileView currentRole={currentRole} />;
    }

    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard currentRole={currentRole} />;
      case 'escrow-detail':
        return <EscrowDetail currentRole={currentRole} />;
      case 'escrow-create':
        return <EscrowCreateWizard />;
      case 'policy':
        return <PolicyManagement currentRole={currentRole} />;
      case 'notifications':
        return <NotificationCenter currentRole={currentRole} />;
      case 'settings':
        return <VaultSettings />;
      case 'audit':
        return <AuditLogViewer currentRole={currentRole} />;
      case 'approvals-hub':
        return <ApprovalsHub currentRole={currentRole} />;
      case 'group-creation':
        return <GroupCreation currentRole={currentRole} />;
      case 'escrow-release':
        return <EscrowReleaseConsole currentRole={currentRole} />;
      case 'accessibility':
        return <AccessibilityGuide currentRole={currentRole} />;
      default:
        return <Dashboard currentRole={currentRole} />;
    }
  };

  const RoleIcon = roleConfig[currentRole].icon;

  return (
    <div className="min-h-screen p-6">
      {/* Hero Section with Animated Background */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative mb-8"
      >
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse-glow">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Family Wallet Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">
                  Multi-signature escrow management reimagined
                </p>
              </div>
            </motion.div>
        
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Role Selector */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      User Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={currentRole} onValueChange={(value: UserRole) => setCurrentRole(value)}>
                      <SelectTrigger className="glass border-white/20 hover:border-white/40 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {Object.entries(roleConfig).map(([role, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={role} value={role} className="hover:bg-white/10">
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Badge className={`${roleConfig[currentRole].color} px-3 py-1 hover-glow`}>
                        <RoleIcon className="h-4 w-4 mr-2" />
                        {roleConfig[currentRole].label}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {roleConfig[currentRole].description}
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Viewport Selector */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Monitor className="h-5 w-5 text-cyan-400" />
                      Viewport Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={viewportSize} onValueChange={(value: ViewportSize) => setViewportSize(value)}>
                      <TabsList className="glass grid w-full grid-cols-3 p-1">
                        {Object.entries(viewportConfig).map(([size, config]) => {
                          const Icon = config.icon;
                          return (
                            <TabsTrigger 
                              key={size} 
                              value={size} 
                              className="text-xs data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all hover:bg-white/10"
                            >
                              <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                              {size}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                    </Tabs>
                    <motion.p 
                      className="text-sm text-muted-foreground mt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {viewportConfig[viewportSize].label}
                    </motion.p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Screen Navigator */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Rocket className="h-5 w-5 text-emerald-400" />
                      Screen Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={currentScreen} 
                      onValueChange={(value: ScreenType) => setCurrentScreen(value)}
                      disabled={viewportSize === 'mobile'}
                    >
                      <SelectTrigger className="glass border-white/20 hover:border-white/40 transition-all disabled:opacity-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {availableScreens.map((screen) => (
                          <SelectItem key={screen.id} value={screen.id} className="hover:bg-white/10">
                            {screen.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {viewportSize === 'mobile' && (
                      <motion.p 
                        className="text-sm text-amber-400 mt-3 flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Smartphone className="h-4 w-4" />
                        Mobile view uses tab navigation
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Available Screens for Current Role */}
            <motion.div 
              className="mt-6 pt-6 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-sm text-muted-foreground mb-3 block">Available screens for this role:</span>
              <div className="flex flex-wrap gap-2">
                {availableScreens.map((screen, index) => (
                  <motion.div
                    key={screen.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge 
                      variant={currentScreen === screen.id ? "default" : "secondary"}
                      className={`text-sm cursor-pointer px-3 py-1 transition-all hover-glow ${
                        currentScreen === screen.id 
                          ? 'gradient-primary text-white' 
                          : 'glass border-white/20 hover:border-white/40'
                      }`}
                      onClick={() => viewportSize !== 'mobile' && setCurrentScreen(screen.id as ScreenType)}
                    >
                      {screen.label}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Wireframe Content */}
      <motion.div 
        className={`mx-auto ${viewportConfig[viewportSize].width}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="glass-card rounded-2xl min-h-[700px] hover-lift overflow-hidden">
          <div className="relative">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-20 blur-xl animate-gradient"></div>
            <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Wireframe Notes */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="glass rounded-xl p-6 inline-block">
          <p className="text-muted-foreground mb-2">
            ✨ This wireframe demonstrates role-based UI differences and responsive breakpoints.
          </p>
          <p className="text-muted-foreground">
            🚀 Switch between roles and viewport sizes to see how the interface adapts.
          </p>
        </div>
      </motion.div>
    </div>
  );
}