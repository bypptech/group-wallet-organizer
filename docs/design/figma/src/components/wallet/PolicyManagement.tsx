import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  Clock, 
  Users, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Calendar,
  Archive
} from 'lucide-react';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface PolicyManagementProps {
  currentRole: UserRole;
}

export function PolicyManagement({ currentRole }: PolicyManagementProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const mockPolicies = [
    {
      id: 'POL-001',
      name: 'Standard Policy',
      threshold: '2/3',
      timelock: '24h',
      rolesRoot: '0x1a2b3c4d...',
      status: 'active',
      description: 'Default policy for regular family expenses',
      createdAt: '2024-01-15',
      lastUpdated: '2024-12-01',
      scheduledUpdate: null,
      usageCount: 15
    },
    {
      id: 'POL-002',
      name: 'High Value Policy',
      threshold: '3/3',
      timelock: '72h',
      rolesRoot: '0x5e6f7g8h...',
      status: 'active',
      description: 'Enhanced security for large transactions',
      createdAt: '2024-01-15',
      lastUpdated: '2024-11-15',
      scheduledUpdate: '2024-12-30',
      usageCount: 5
    },
    {
      id: 'POL-003',
      name: 'Emergency Policy',
      threshold: '1/3',
      timelock: '1h',
      rolesRoot: '0x9i0j1k2l...',
      status: 'draft',
      description: 'Fast approval for emergency situations',
      createdAt: '2024-12-20',
      lastUpdated: '2024-12-20',
      scheduledUpdate: null,
      usageCount: 0
    }
  ];

  const mockGuardianOperations = [
    {
      id: 'GO-001',
      type: 'emergency_pause',
      description: 'Emergency pause all escrow operations',
      availableUntil: '2024-12-31 23:59:59',
      status: 'available'
    },
    {
      id: 'GO-002',
      type: 'policy_override',
      description: 'Override policy requirements for urgent transactions',
      availableUntil: '2024-12-31 23:59:59',
      status: 'available'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManagePolicies = currentRole === 'owner';
  const canViewGuardianOps = currentRole === 'approver' || currentRole === 'owner';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Policy Management</h1>
          <p className="text-muted-foreground">Manage approval policies and guardian operations</p>
        </div>
        {canManagePolicies && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPolicies.map((policy) => (
                  <div 
                    key={policy.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPolicy === policy.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPolicy(policy.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4>{policy.name}</h4>
                          <Badge className={getStatusColor(policy.status)}>
                            {policy.status}
                          </Badge>
                          {policy.scheduledUpdate && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Update Scheduled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Threshold: {policy.threshold}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Timelock: {policy.timelock}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Used {policy.usageCount} times
                          </div>
                        </div>
                      </div>
                      {canManagePolicies && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Archive className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Policy Details */}
          {selectedPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Policy Details</CardTitle>
              </CardHeader>
              <CardContent>
                {mockPolicies
                  .filter(p => p.id === selectedPolicy)
                  .map(policy => (
                    <div key={policy.id} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Policy ID</Label>
                          <div className="font-mono text-sm">{policy.id}</div>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Badge className={getStatusColor(policy.status)}>
                            {policy.status}
                          </Badge>
                        </div>
                        <div>
                          <Label>Approval Threshold</Label>
                          <div className="font-medium">{policy.threshold}</div>
                        </div>
                        <div>
                          <Label>Timelock Period</Label>
                          <div className="font-medium">{policy.timelock}</div>
                        </div>
                        <div>
                          <Label>Created</Label>
                          <div className="text-sm">{policy.createdAt}</div>
                        </div>
                        <div>
                          <Label>Last Updated</Label>
                          <div className="text-sm">{policy.lastUpdated}</div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label>Roles Root Hash</Label>
                        <div className="font-mono text-sm bg-muted p-2 rounded">
                          {policy.rolesRoot}
                        </div>
                      </div>

                      {policy.scheduledUpdate && (
                        <Alert>
                          <Calendar className="h-4 w-4" />
                          <AlertDescription>
                            This policy has a scheduled update on {policy.scheduledUpdate}
                          </AlertDescription>
                        </Alert>
                      )}

                      {canManagePolicies && (
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Policy
                          </Button>
                          <Button variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Update
                          </Button>
                          {policy.status === 'draft' && (
                            <Button>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Finalize Policy
                            </Button>
                          )}
                          {policy.status === 'active' && (
                            <Button variant="destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Archive Policy
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guardian Operations */}
          {canViewGuardianOps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Guardian Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockGuardianOperations.map((operation) => (
                    <div key={operation.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">{operation.description}</div>
                        <Badge variant="outline" className="text-xs">
                          {operation.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Available until: {operation.availableUntil}
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full"
                        disabled={currentRole !== 'owner'}
                      >
                        <AlertTriangle className="h-3 w-3 mr-2" />
                        Execute
                      </Button>
                    </div>
                  ))}
                </div>
                
                {currentRole !== 'owner' && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Guardian operations require Owner privileges
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Policy Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Policies</span>
                <span className="font-medium">{mockPolicies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Policies</span>
                <span className="font-medium">{mockPolicies.filter(p => p.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Draft Policies</span>
                <span className="font-medium">{mockPolicies.filter(p => p.status === 'draft').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Usage</span>
                <span className="font-medium">{mockPolicies.reduce((sum, p) => sum + p.usageCount, 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canManagePolicies && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy Template
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Policy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  Archived Policies
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}