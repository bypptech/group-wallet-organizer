import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useGroupCreation } from '../../hooks/useGroupCreation';
import { useToast } from '../../hooks/use-toast';
import {
  Users,
  UserPlus,
  QrCode,
  Link,
  Copy,
  Shield,
  Mail,
  CheckCircle2,
  Crown,
  RefreshCw,
  Share2,
  Loader2
} from 'lucide-react';

interface GroupCreationEnhancedProps {
  currentRole: string;
  vaultId?: string;
}

export function GroupCreationEnhanced({ currentRole, vaultId }: GroupCreationEnhancedProps) {
  const { toast } = useToast();
  const {
    invites,
    isLoadingInvites,
    createInvite,
    isCreatingInvite,
    deleteInvite,
    generateInviteLink,
    copyToClipboard,
  } = useGroupCreation(vaultId);

  const [currentStep, setCurrentStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [requiredWeight, setRequiredWeight] = useState(3);
  const [inviteMethod, setInviteMethod] = useState<'link' | 'qr' | 'email'>('link');
  const [inviteExpiry, setInviteExpiry] = useState('7');
  const [newMemberRole, setNewMemberRole] = useState<'owner' | 'guardian' | 'requester' | 'viewer'>('guardian');
  const [newMemberWeight, setNewMemberWeight] = useState(1);
  const [inviteEmail, setInviteEmail] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);

  const steps = [
    { id: 1, title: 'グループ設定', icon: Users },
    { id: 2, title: 'ロール・重み設定', icon: Shield },
    { id: 3, title: '招待生成', icon: UserPlus },
    { id: 4, title: '確認・完了', icon: CheckCircle2 }
  ];

  const roleConfig = {
    owner: {
      label: 'Owner',
      description: 'グループ管理権限',
      color: 'from-purple-500 to-indigo-500',
      defaultWeight: 2
    },
    guardian: {
      label: 'Guardian',
      description: '承認権限',
      color: 'from-amber-500 to-orange-500',
      defaultWeight: 1
    },
    requester: {
      label: 'Requester',
      description: 'リクエスト権限',
      color: 'from-green-500 to-emerald-500',
      defaultWeight: 0
    },
    viewer: {
      label: 'Viewer',
      description: '閲覧のみ',
      color: 'from-blue-500 to-cyan-500',
      defaultWeight: 0
    },
  };

  const handleGenerateInvite = async () => {
    if (!vaultId) {
      toast({
        title: 'エラー',
        description: 'Vault IDが設定されていません',
        variant: 'destructive',
      });
      return;
    }

    if (inviteMethod === 'email' && !inviteEmail) {
      toast({
        title: 'エラー',
        description: 'メールアドレスを入力してください',
        variant: 'destructive',
      });
      return;
    }

    const expiresInDays = parseInt(inviteExpiry);
    const expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);

    createInvite(
      {
        vaultId,
        role: newMemberRole,
        weight: newMemberWeight,
        expiresAt,
        method: inviteMethod,
        email: inviteMethod === 'email' ? inviteEmail : undefined,
      },
      {
        onSuccess: (data) => {
          toast({
            title: '招待を生成しました',
            description: `${roleConfig[newMemberRole].label}の招待リンクを作成しました`,
          });
          setInviteEmail('');
        },
        onError: (error) => {
          toast({
            title: '招待生成に失敗',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleCopyInvite = async (inviteToken: string) => {
    const link = generateInviteLink(inviteToken);
    try {
      await copyToClipboard(link);
      toast({
        title: 'コピーしました',
        description: '招待リンクをクリップボードにコピーしました',
      });
    } catch (error) {
      toast({
        title: 'コピー失敗',
        description: 'クリップボードへのコピーに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    deleteInvite(inviteId, {
      onSuccess: () => {
        toast({
          title: '招待を削除しました',
          description: '招待リンクを無効化しました',
        });
      },
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <Label htmlFor="groupName" className="text-white">グループ名</Label>
              <Input
                id="groupName"
                placeholder="田中ファミリー"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="glass border-white/20 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="requiredWeight" className="text-white">必要重み閾値</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="requiredWeight"
                  type="number"
                  min="1"
                  max="10"
                  value={requiredWeight}
                  onChange={(e) => setRequiredWeight(parseInt(e.target.value))}
                  className="glass border-white/20 text-white w-24"
                />
                <span className="text-muted-foreground">
                  承認に必要な重みの合計値
                </span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">グループポリシー設定</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">自動承認モード</span>
                  <Switch
                    checked={autoApprove}
                    onCheckedChange={setAutoApprove}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  閾値到達時に自動実行するかどうか
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">ロール</Label>
                <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                  <SelectTrigger className="glass border-white/20 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {Object.entries(roleConfig).map(([role, config]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.color}`}></div>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">重み</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={newMemberWeight}
                  onChange={(e) => setNewMemberWeight(parseInt(e.target.value))}
                  className="glass border-white/20 text-white mt-2"
                />
              </div>
            </div>

            <div className="glass p-4 rounded-lg">
              <h4 className="text-white font-medium mb-3">選択中のロール詳細</h4>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${roleConfig[newMemberRole].color}`}>
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {roleConfig[newMemberRole].label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {roleConfig[newMemberRole].description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Tabs value={inviteMethod} onValueChange={(value: any) => setInviteMethod(value)}>
              <TabsList className="glass grid w-full grid-cols-3 p-1">
                <TabsTrigger value="link" className="data-[state=active]:bg-white/20">
                  <Link className="h-4 w-4 mr-2" />
                  リンク
                </TabsTrigger>
                <TabsTrigger value="qr" className="data-[state=active]:bg-white/20">
                  <QrCode className="h-4 w-4 mr-2" />
                  QRコード
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-white/20">
                  <Mail className="h-4 w-4 mr-2" />
                  メール
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-white">有効期限</Label>
                    <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                      <SelectTrigger className="glass border-white/20 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="1">1日</SelectItem>
                        <SelectItem value="7">7日</SelectItem>
                        <SelectItem value="30">30日</SelectItem>
                        <SelectItem value="365">1年</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label htmlFor="inviteEmail" className="text-white">招待先メールアドレス</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="glass border-white/20 text-white mt-2"
                    />
                  </div>
                </TabsContent>

                <Button
                  className="gradient-primary text-white hover-glow w-full"
                  onClick={handleGenerateInvite}
                  disabled={isCreatingInvite || (inviteMethod === 'email' && !inviteEmail)}
                >
                  {isCreatingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      招待を生成
                    </>
                  )}
                </Button>
              </div>
            </Tabs>

            {/* Generated Invites */}
            {isLoadingInvites ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : invites.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-white font-medium">生成された招待</h4>
                {invites.map((invite) => (
                  <Card key={invite.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${roleConfig[invite.role as keyof typeof roleConfig]?.color || 'from-gray-500 to-gray-600'}`}>
                            {invite.method === 'email' ? <Mail className="h-4 w-4 text-white" /> :
                             invite.method === 'qr' ? <QrCode className="h-4 w-4 text-white" /> :
                             <Link className="h-4 w-4 text-white" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {roleConfig[invite.role as keyof typeof roleConfig]?.label || invite.role} (重み: {invite.weight})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              期限: {new Date(invite.expiresAt * 1000).toLocaleDateString('ja-JP')}
                              {invite.email && ` • ${invite.email}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass border-white/20"
                            onClick={() => handleCopyInvite(invite.inviteToken)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="glass border-white/20"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 p-2 glass rounded text-xs font-mono text-cyan-400 break-all">
                        {generateInviteLink(invite.inviteToken)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-4"
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">グループ作成準備完了</h3>
              <p className="text-muted-foreground">設定を確認して、グループを作成してください</p>
            </div>

            <div className="glass p-6 rounded-lg space-y-4">
              <h4 className="text-white font-medium">グループ設定</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">グループ名</span>
                  <p className="text-white">{groupName || '未設定'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">必要重み閾値</span>
                  <p className="text-white">{requiredWeight}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">招待数</span>
                  <p className="text-white">{invites.length}件</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1 gradient-primary text-white hover-glow">
                <Crown className="h-4 w-4 mr-2" />
                グループを作成
              </Button>
              <Button
                variant="outline"
                className="glass border-white/20"
                onClick={() => setCurrentStep(1)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                最初から
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Group Creation & Invite
        </h1>
        <p className="text-muted-foreground mt-1">
          新しいファミリーグループを作成し、メンバーを招待
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all
                  ${isActive ? 'gradient-primary text-white animate-pulse-glow' :
                    isCompleted ? 'gradient-accent text-white' :
                    'glass border-white/20 text-muted-foreground'}
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-xs mt-2 ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </motion.div>

              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 transition-all
                  ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-white/20'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="glass-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-white">
            {steps.find(s => s.id === currentStep)?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 max-w-2xl mx-auto">
        <Button
          variant="outline"
          className="glass border-white/20"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          前へ
        </Button>
        <Button
          className="gradient-secondary text-white hover-glow"
          onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          disabled={currentStep === 4}
        >
          次へ
        </Button>
      </div>

      {/* Invitation Status Panel */}
      {invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 w-80"
        >
          <Card className="glass-card border-cyan-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5 text-cyan-400" />
                招待ステータス
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">生成済み:</span>
                  <span className="text-white">{invites.length}件</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">承認済み:</span>
                  <span className="text-green-400">{invites.filter(i => i.acceptedBy).length}件</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">期限切れ:</span>
                  <span className="text-red-400">{invites.filter(i => i.expiresAt * 1000 < Date.now()).length}件</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
