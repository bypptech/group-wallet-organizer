import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Home, 
  ScanLine, 
  Activity, 
  Settings, 
  Bell,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wallet,
  Users,
  QrCode,
  Smartphone,
  BellOff,
  MessageSquare,
  UserPlus,
  Send
} from 'lucide-react';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface MobileViewProps {
  currentRole: UserRole;
}

export function MobileView({ currentRole }: MobileViewProps) {
  const [activeTab, setActiveTab] = useState('home');

  const mockKPIs = {
    pendingApprovals: 3,
    urgentEscrows: 1,
    paymasterBalance: '2.45 ETH',
    notificationDelivery: 98
  };

  const mockEscrows = [
    {
      id: 'ESC-2024-001',
      amount: '0.5 ETH',
      status: 'pending',
      deadline: '2024-12-30',
      approvals: 2,
      required: 3,
      description: 'Holiday shopping funds'
    },
    {
      id: 'ESC-2024-002',
      amount: '1.2 ETH',
      status: 'approved',
      deadline: '2024-12-28',
      approvals: 3,
      required: 3,
      description: 'Emergency car repair'
    }
  ];

  const mockTimeline = [
    {
      id: 1,
      timestamp: '10:30 AM',
      action: 'Escrow Created',
      user: 'Tom Smith',
      type: 'created',
      description: 'ESC-2024-001 for 0.5 ETH'
    },
    {
      id: 2,
      timestamp: '12:00 PM',
      action: 'Approval Granted',
      user: 'John Smith',
      type: 'approved',
      description: 'Approved ESC-2024-001'
    },
    {
      id: 3,
      timestamp: '2:30 PM',
      action: 'Approval Granted',
      user: 'Mary Smith',
      type: 'approved',
      description: 'Approved ESC-2024-001 via mobile'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'released': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created': return <QrCode className="h-4 w-4 text-blue-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2>Family Wallet</h2>
            <p className="text-sm opacity-90">Smith Family Vault</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsContent value="home" className="p-4 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">{mockKPIs.pendingApprovals}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-red-600">{mockKPIs.urgentEscrows}</div>
                <div className="text-xs text-muted-foreground">Urgent</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Escrows */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Escrows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockEscrows.map((escrow) => (
                <div key={escrow.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-sm">{escrow.id}</div>
                      <div className="text-xs text-muted-foreground">{escrow.description}</div>
                    </div>
                    <Badge className={getStatusColor(escrow.status)}>
                      {escrow.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{escrow.amount}</span>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {escrow.approvals}/{escrow.required}
                      </div>
                      <Progress 
                        value={(escrow.approvals / escrow.required) * 100} 
                        className="w-12 h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {currentRole === 'requester' && (
            <Button className="w-full">
              <QrCode className="h-4 w-4 mr-2" />
              Create New Escrow
            </Button>
          )}
          {currentRole === 'approver' && (
            <Button className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Review Approvals ({mockKPIs.pendingApprovals})
            </Button>
          )}
        </TabsContent>

        <TabsContent value="scan" className="p-4 space-y-4">
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                QR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <QrCode className="h-16 w-16 mx-auto text-gray-400" />
                  <p className="text-sm text-muted-foreground">Point camera at QR code</p>
                  <Button variant="outline" size="sm">
                    Enable Camera
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {currentRole === 'approver' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-sm">ESC-2024-001</div>
                      <div className="text-xs text-muted-foreground">0.5 ETH • Holiday shopping</div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">urgent</Badge>
                  </div>
                  
                  {/* Sponsorship Status */}
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Sponsorship Available</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback Instructions */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">Fallback Mode</div>
                  <div className="text-xs text-muted-foreground">
                    If sponsorship fails, transaction will use your wallet gas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTimeline.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {getTimelineIcon(event.type)}
                      {index < mockTimeline.length - 1 && (
                        <div className="w-px h-6 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-medium">{event.action}</div>
                      <div className="text-xs text-muted-foreground">{event.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.user} • {event.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Recent Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium">John Smith</span>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <p className="text-sm">Approved for holiday expenses. Please keep receipts.</p>
              </div>
              <div className="p-3 border rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium">Mary Smith</span>
                  <span className="text-xs text-muted-foreground">30m ago</span>
                </div>
                <p className="text-sm">Looks good to me. Approved via mobile.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="p-4 space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Wallet Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">WalletConnect</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                  Connected
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                0x742d...7e0C
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="mobile-push">Enable Push</Label>
                <Switch id="mobile-push" defaultChecked />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approval Requests</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status Updates</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Alerts</span>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>Expo Push Token: Registered</p>
                <p>Last sync: 2024-12-25 10:45:00</p>
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Device</span>
                <span className="text-sm">iPhone 15 Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">App Version</span>
                <span className="text-sm">1.2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Update</span>
                <span className="text-sm">2024-12-20</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              View Family Members
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notification History
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Security Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Navigation */}
      <div className="border-t bg-white p-2">
        <TabsList className="grid w-full grid-cols-4 bg-transparent">
          <TabsTrigger 
            value="home" 
            className="flex flex-col gap-1 data-[state=active]:bg-primary/10"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs">Home</span>
          </TabsTrigger>
          <TabsTrigger 
            value="scan" 
            className="flex flex-col gap-1 data-[state=active]:bg-primary/10"
          >
            <ScanLine className="h-4 w-4" />
            <span className="text-xs">Scan</span>
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="flex flex-col gap-1 data-[state=active]:bg-primary/10"
          >
            <Activity className="h-4 w-4" />
            <span className="text-xs">Timeline</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex flex-col gap-1 data-[state=active]:bg-primary/10"
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs">Settings</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );
}