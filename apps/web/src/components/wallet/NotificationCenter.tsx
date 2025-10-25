import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface NotificationCenterProps {
  currentRole: UserRole;
}

export function NotificationCenter({ currentRole }: NotificationCenterProps) {
  const [webPushEnabled, setWebPushEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  const mockNotifications = [
    {
      id: 1,
      title: 'Escrow ESC-2024-001 requires approval',
      message: 'Tom Smith has requested 0.5 ETH for holiday shopping',
      type: 'approval_required',
      priority: 'high',
      read: false,
      timestamp: '2024-12-25 10:30:00',
      targetRoles: ['approver'],
      actions: ['approve', 'reject']
    },
    {
      id: 2,
      title: 'Paymaster balance warning',
      message: 'Gas sponsor pool is running low (0.1 ETH remaining)',
      type: 'system_warning',
      priority: 'medium',
      read: false,
      timestamp: '2024-12-25 09:15:00',
      targetRoles: ['owner'],
      actions: ['top_up']
    },
    {
      id: 3,
      title: 'Your escrow was approved',
      message: 'ESC-2024-001 has received 2/3 required approvals',
      type: 'status_update',
      priority: 'normal',
      read: true,
      timestamp: '2024-12-25 08:45:00',
      targetRoles: ['requester'],
      actions: []
    },
    {
      id: 4,
      title: 'Policy update scheduled',
      message: 'High Value Policy will be updated on Dec 30, 2024',
      type: 'policy_update',
      priority: 'normal',
      read: true,
      timestamp: '2024-12-24 16:20:00',
      targetRoles: ['owner', 'approver'],
      actions: ['review']
    },
    {
      id: 5,
      title: 'New family member added',
      message: 'Sarah Smith has been added to the vault with Viewer role',
      type: 'member_update',
      priority: 'low',
      read: true,
      timestamp: '2024-12-24 14:10:00',
      targetRoles: ['owner'],
      actions: []
    }
  ];

  const mockDevices = [
    {
      id: 'dev-001',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      platform: 'iOS',
      lastSeen: '2024-12-25 10:45:00',
      pushEnabled: true,
      expoToken: 'ExponentPushToken[abc123...]'
    },
    {
      id: 'dev-002',
      name: 'MacBook Pro',
      type: 'desktop',
      platform: 'macOS',
      lastSeen: '2024-12-25 10:30:00',
      pushEnabled: true,
      expoToken: null
    },
    {
      id: 'dev-003',
      name: 'Chrome Browser',
      type: 'browser',
      platform: 'Web',
      lastSeen: '2024-12-25 10:25:00',
      pushEnabled: false,
      expoToken: null
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_required': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'system_warning': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'status_update': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'policy_update': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'member_update': return <Bell className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = mockNotifications;
    
    if (selectedTab === 'personal') {
      filtered = filtered.filter(n => n.targetRoles.includes(currentRole));
    } else if (selectedTab === 'system') {
      filtered = filtered.filter(n => n.type.includes('system') || n.type.includes('policy'));
    }
    
    return filtered;
  };

  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const personalUnreadCount = mockNotifications.filter(n => !n.read && n.targetRoles.includes(currentRole)).length;
  const systemUnreadCount = mockNotifications.filter(n => !n.read && (n.type.includes('system') || n.type.includes('policy'))).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Notification Center</h1>
          <p className="text-muted-foreground">Manage your notifications and push settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="relative">
                    All
                    {unreadCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 text-xs">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="relative">
                    Personal
                    {personalUnreadCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 text-xs">{personalUnreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="system" className="relative">
                    System
                    {systemUnreadCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 text-xs">{systemUnreadCount}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="space-y-3">
                    {getFilteredNotifications().map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 border rounded-lg ${
                          notification.read ? 'opacity-60' : 'bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          )}
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="font-medium">{notification.title}</div>
                                <div className="text-sm text-muted-foreground">{notification.message}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {notification.timestamp}
                              </div>
                              <div className="flex items-center gap-1">
                                {notification.actions.map((action) => (
                                  <Button key={action} size="sm" variant="outline" className="h-6 text-xs">
                                    {action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                                  </Button>
                                ))}
                                {!notification.read && (
                                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="mt-4">
                  <div className="space-y-3">
                    {getFilteredNotifications().map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 border rounded-lg ${
                          notification.read ? 'opacity-60' : 'bg-blue-50/50'
                        }`}
                      >
                        {/* Same notification content as above */}
                        <div className="flex items-start gap-3">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          )}
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="font-medium">{notification.title}</div>
                                <div className="text-sm text-muted-foreground">{notification.message}</div>
                              </div>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="system" className="mt-4">
                  <div className="space-y-3">
                    {getFilteredNotifications().map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 border rounded-lg ${
                          notification.read ? 'opacity-60' : 'bg-blue-50/50'
                        }`}
                      >
                        {/* Same notification content as above */}
                        <div className="flex items-start gap-3">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          )}
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="font-medium">{notification.title}</div>
                                <div className="text-sm text-muted-foreground">{notification.message}</div>
                              </div>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Push Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="web-push">Web Push Notifications</Label>
                <Switch 
                  id="web-push"
                  checked={webPushEnabled} 
                  onCheckedChange={setWebPushEnabled}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Notification Types</Label>
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
                    <span className="text-sm">System Warnings</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Policy Changes</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registered Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Registered Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDevices.map((device) => (
                  <div key={device.id} className="flex items-start justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{device.name}</div>
                      <div className="text-xs text-muted-foreground">{device.platform}</div>
                      <div className="text-xs text-muted-foreground">
                        Last seen: {device.lastSeen}
                      </div>
                      {device.expoToken && (
                        <div className="text-xs text-muted-foreground">
                          Expo token registered
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {device.pushEnabled ? (
                        <Bell className="h-4 w-4 text-green-500" />
                      ) : (
                        <BellOff className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-xs text-muted-foreground">
                <p>Push tokens are automatically registered when you use the mobile app.</p>
                <p className="mt-1">Last sync: 2024-12-25 10:45:00</p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Sent (24h)</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Successfully Delivered</span>
                <span className="font-medium text-green-600">11</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Failed</span>
                <span className="font-medium text-red-600">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Delivery Rate</span>
                <span className="font-medium">91.7%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}