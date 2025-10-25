import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useVaultSettings, type UpdateMemberRequest, type UpdateVaultRequest } from '@/hooks/useVaultSettings';
import {
  Users,
  Wallet,
  Settings,
  UserPlus,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  Shield,
  Webhook,
  Key,
  Loader2
} from 'lucide-react';
import type { Address } from 'viem';

interface VaultSettingsEnhancedProps {
  vaultId: string;
  userAddress: Address;
}

export function VaultSettingsEnhanced({ vaultId, userAddress }: VaultSettingsEnhancedProps) {
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'owner' | 'guardian' | 'requester' | 'viewer'>('viewer');
  const [editWeight, setEditWeight] = useState<number>(1);

  const {
    vault,
    members,
    webhooks,
    paymasterInfo,
    isLoadingVault,
    isLoadingMembers,
    isLoadingWebhooks,
    isLoadingPaymaster,
    updateVault,
    isUpdatingVault,
    addMember,
    updateMember,
    removeMember,
    isAddingMember,
    isUpdatingMember,
    isRemovingMember,
    addWebhook,
    removeWebhook,
    isAddingWebhook,
    isRemovingWebhook,
    refetchVault,
    refetchMembers,
    refetchWebhooks,
    refetchPaymaster,
    getRoleLabel,
    getRoleColor,
  } = useVaultSettings(vaultId);

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: '招待リンクをコピーしました',
      });
    } catch (error) {
      toast({
        title: 'コピーに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMember = async (memberId: string) => {
    const data: UpdateMemberRequest = {
      role: editRole,
      weight: editWeight,
    };

    updateMember({ memberId, data }, {
      onSuccess: () => {
        toast({
          title: 'メンバーを更新しました',
        });
        setEditingMemberId(null);
      },
      onError: (error) => {
        toast({
          title: 'メンバー更新に失敗',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    removeMember(memberId, {
      onSuccess: () => {
        toast({
          title: 'メンバーを削除しました',
        });
      },
      onError: (error) => {
        toast({
          title: 'メンバー削除に失敗',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpdateVaultSettings = async (settings: Partial<typeof vault.settings>) => {
    const data: UpdateVaultRequest = {
      settings,
    };

    updateVault(data, {
      onSuccess: () => {
        toast({
          title: 'Vault設定を更新しました',
        });
        refetchVault();
      },
      onError: (error) => {
        toast({
          title: 'Vault設定の更新に失敗',
          description: error instanceof Error ? error.message : '不明なエラー',
          variant: 'destructive',
        });
      },
    });
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoadingVault) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1>Vault Settings</h1>
        <p className="text-muted-foreground">Manage vault members, paymaster, and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vault Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Vault Members
                {isLoadingMembers && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.userAddress.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="font-medium font-mono text-sm">
                          {member.userAddress.slice(0, 6)}...{member.userAddress.slice(-4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added: {new Date(member.addedAt).toLocaleDateString()}
                          {member.lastActivity && ` • Active: ${new Date(member.lastActivity).toLocaleString()}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Weight: {member.weight}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingMemberId === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="owner">Owner</option>
                            <option value="guardian">Guardian</option>
                            <option value="requester">Requester</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <Input
                            type="number"
                            value={editWeight}
                            onChange={(e) => setEditWeight(parseInt(e.target.value))}
                            className="w-20"
                            min={1}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMember(member.id)}
                            disabled={isUpdatingMember}
                          >
                            {isUpdatingMember ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMemberId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge className={getRoleColor(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingMemberId(member.id);
                                setEditRole(member.role);
                                setEditWeight(member.weight);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {member.role !== 'owner' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={isRemovingMember}
                              >
                                {isRemovingMember ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Invite Section */}
              <div className="space-y-3">
                <h4>Invite New Member</h4>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    placeholder="Generate invite link first"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyInviteLink}
                    disabled={!inviteLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate New Invite
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Share Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paymaster Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Paymaster Configuration
                {isLoadingPaymaster && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymasterInfo ? (
                <>
                  {/* Status Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-medium">{paymasterInfo.balance}</div>
                      <div className="text-sm text-muted-foreground">Current Balance</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-medium">{paymasterInfo.dailyUsage}</div>
                      <div className="text-sm text-muted-foreground">Daily Usage</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-medium">{paymasterInfo.monthlyLimit}</div>
                      <div className="text-sm text-muted-foreground">Monthly Limit</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className={`text-lg font-medium ${getHealthColor(paymasterInfo.healthStatus)}`}>
                        {paymasterInfo.healthStatus}
                      </div>
                      <div className="text-sm text-muted-foreground">Status</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Configuration Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="refill-threshold">Auto-refill Threshold</Label>
                      <Input
                        id="refill-threshold"
                        value={paymasterInfo.refillThreshold}
                        readOnly
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="monthly-limit">Monthly Spending Limit</Label>
                      <Input
                        id="monthly-limit"
                        value={paymasterInfo.monthlyLimit}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-refill">Enable Auto-refill</Label>
                      <Switch
                        id="auto-refill"
                        checked={paymasterInfo.autoRefill}
                        onCheckedChange={(checked) =>
                          handleUpdateVaultSettings({ paymasterEnabled: checked })
                        }
                        disabled={isUpdatingVault}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fallback">Enable Fallback to User Wallets</Label>
                      <Switch
                        id="fallback"
                        checked={paymasterInfo.fallbackEnabled}
                        disabled={isUpdatingVault}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button>
                      <Wallet className="h-4 w-4 mr-2" />
                      Top Up Paymaster
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Paymaster情報を取得できませんでした
                </div>
              )}
            </CardContent>
          </Card>

          {/* API & Webhook Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                API & Webhook Settings
                {isLoadingWebhooks && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="api-key"
                    value="your-api-key-here"
                    type="password"
                    readOnly
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Use this key to authenticate API requests
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4>Configured Webhooks</h4>
                  <Button
                    size="sm"
                    disabled={isAddingWebhook}
                  >
                    {isAddingWebhook ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Webhook className="h-3 w-3 mr-2" />
                    )}
                    Add Webhook
                  </Button>
                </div>
                <div className="space-y-3">
                  {webhooks.length > 0 ? (
                    webhooks.map((webhook) => (
                      <div key={webhook.id} className="p-3 border rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <div className="font-mono text-sm">{webhook.url}</div>
                            <div className="text-xs text-muted-foreground">
                              Events: {webhook.events.join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {webhook.deliveryRate}% delivery
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeWebhook(webhook.id)}
                              disabled={isRemovingWebhook}
                            >
                              {isRemovingWebhook ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last delivery: {webhook.lastDelivery || 'Never'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Webhookが設定されていません
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vault Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vault Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vault && (
                <>
                  <div>
                    <Label>Vault Name</Label>
                    <div className="font-medium">{vault.name}</div>
                  </div>
                  <div>
                    <Label>Vault Address</Label>
                    <div className="font-mono text-sm">
                      {vault.vaultAddress.slice(0, 6)}...{vault.vaultAddress.slice(-4)}
                    </div>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <div className="text-sm">{new Date(vault.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Label>Total Members</Label>
                    <div className="font-medium">{members.length}</div>
                  </div>
                  <div>
                    <Label>Required Weight</Label>
                    <div className="font-medium">{vault.settings.requiredWeight}</div>
                  </div>
                  <div>
                    <Label>Timelock</Label>
                    <div className="font-medium">{vault.settings.timelock}s</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vault && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Multi-sig Protection</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Timelock Enabled</span>
                    {vault.settings.timelock > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Approve</span>
                    {vault.settings.autoApprove ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Paymaster Enabled</span>
                    {vault.settings.paymasterEnabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications</span>
                    {vault.settings.notificationsEnabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Key className="h-4 w-4 mr-2" />
                Rotate API Key
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Export Member List
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Backup Configuration
              </Button>
              <Button variant="destructive" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Archive Vault
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
