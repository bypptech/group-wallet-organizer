import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
  Key
} from 'lucide-react';

export function VaultSettings() {
  const [inviteLink, setInviteLink] = useState('https://familywallet.app/invite/abc123def456');

  const mockMembers = [
    {
      id: 'mem-001',
      name: 'John Smith',
      email: 'john@smith.com',
      role: 'owner',
      joinedAt: '2024-01-15',
      lastActivity: '2024-12-25 10:30:00',
      walletAddress: '0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C'
    },
    {
      id: 'mem-002',
      name: 'Mary Smith',
      email: 'mary@smith.com',
      role: 'approver',
      joinedAt: '2024-01-20',
      lastActivity: '2024-12-25 09:15:00',
      walletAddress: '0x8f9e2c1b5a6d3e4f7c8a9b0c1d2e3f4g5h6i7j8k'
    },
    {
      id: 'mem-003',
      name: 'Tom Smith',
      email: 'tom@smith.com',
      role: 'requester',
      joinedAt: '2024-02-01',
      lastActivity: '2024-12-25 11:00:00',
      walletAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t'
    },
    {
      id: 'mem-004',
      name: 'Sarah Smith',
      email: 'sarah@smith.com',
      role: 'viewer',
      joinedAt: '2024-12-24',
      lastActivity: '2024-12-24 18:30:00',
      walletAddress: '0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g'
    }
  ];

  const mockPaymasterStatus = {
    balance: '2.45 ETH',
    dailyUsage: '0.12 ETH',
    monthlyLimit: '5.0 ETH',
    healthStatus: 'healthy',
    lastTopUp: '2024-12-20 15:30:00',
    autoRefill: true,
    fallbackEnabled: true,
    refillThreshold: '1.0 ETH'
  };

  const mockWebhooks = [
    {
      id: 'wh-001',
      url: 'https://api.myapp.com/webhooks/escrow',
      events: ['escrow.created', 'escrow.approved', 'escrow.released'],
      status: 'active',
      lastDelivery: '2024-12-25 10:30:00',
      deliveryRate: 98.5
    },
    {
      id: 'wh-002',
      url: 'https://notify.example.com/family-wallet',
      events: ['approval.required', 'paymaster.low_balance'],
      status: 'active',
      lastDelivery: '2024-12-25 09:15:00',
      deliveryRate: 100
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'approver': return 'bg-green-100 text-green-800';
      case 'requester': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {member.joinedAt} • Last active: {member.lastActivity}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-3 w-3" />
                        </Button>
                        {member.role !== 'owner' && (
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
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
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-lg font-medium">{mockPaymasterStatus.balance}</div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-lg font-medium">{mockPaymasterStatus.dailyUsage}</div>
                  <div className="text-sm text-muted-foreground">Daily Usage</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className="text-lg font-medium">{mockPaymasterStatus.monthlyLimit}</div>
                  <div className="text-sm text-muted-foreground">Monthly Limit</div>
                </div>
                <div className="text-center p-3 border rounded">
                  <div className={`text-lg font-medium ${getHealthColor(mockPaymasterStatus.healthStatus)}`}>
                    {mockPaymasterStatus.healthStatus}
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
                    value={mockPaymasterStatus.refillThreshold}
                    readOnly
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="monthly-limit">Monthly Spending Limit</Label>
                  <Input 
                    id="monthly-limit"
                    value={mockPaymasterStatus.monthlyLimit}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refill">Enable Auto-refill</Label>
                  <Switch 
                    id="auto-refill"
                    checked={mockPaymasterStatus.autoRefill}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="fallback">Enable Fallback to User Wallets</Label>
                  <Switch 
                    id="fallback"
                    checked={mockPaymasterStatus.fallbackEnabled}
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
            </CardContent>
          </Card>

          {/* API & Webhook Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                API & Webhook Settings
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
                  <Button size="sm">
                    <Webhook className="h-3 w-3 mr-2" />
                    Add Webhook
                  </Button>
                </div>
                <div className="space-y-3">
                  {mockWebhooks.map((webhook) => (
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
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last delivery: {webhook.lastDelivery}
                      </div>
                    </div>
                  ))}
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
              <div>
                <Label>Vault Name</Label>
                <div className="font-medium">Smith Family Vault</div>
              </div>
              <div>
                <Label>Vault ID</Label>
                <div className="font-mono text-sm">VLT-001-2024</div>
              </div>
              <div>
                <Label>Created</Label>
                <div className="text-sm">January 15, 2024</div>
              </div>
              <div>
                <Label>Total Members</Label>
                <div className="font-medium">{mockMembers.length}</div>
              </div>
              <div>
                <Label>Active Escrows</Label>
                <div className="font-medium">3</div>
              </div>
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
              <div className="flex items-center justify-between">
                <span className="text-sm">Multi-sig Protection</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Timelock Enabled</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Guardian Access</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Rate Limiting</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Webhook Verification</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
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