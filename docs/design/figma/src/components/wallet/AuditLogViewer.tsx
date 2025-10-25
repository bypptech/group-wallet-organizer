import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  ExternalLink,
  Hash,
  User,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface AuditLogViewerProps {
  currentRole: UserRole;
}

export function AuditLogViewer({ currentRole }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVault, setSelectedVault] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  const mockAuditLogs = [
    {
      id: 'AL-001',
      timestamp: '2024-12-25 10:30:00',
      action: 'escrow.created',
      user: 'Tom Smith',
      userRole: 'requester',
      vault: 'Smith Family Vault',
      escrowId: 'ESC-2024-001',
      details: 'Created escrow for 0.5 ETH holiday shopping',
      txHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome/120.0.0.0',
      status: 'success'
    },
    {
      id: 'AL-002',
      timestamp: '2024-12-25 11:15:00',
      action: 'policy.verified',
      user: 'System',
      userRole: 'system',
      vault: 'Smith Family Vault',
      escrowId: 'ESC-2024-001',
      details: 'Policy POL-001 verification passed',
      txHash: null,
      ipAddress: null,
      userAgent: 'System Process',
      status: 'success'
    },
    {
      id: 'AL-003',
      timestamp: '2024-12-25 12:00:00',
      action: 'escrow.approved',
      user: 'John Smith',
      userRole: 'owner',
      vault: 'Smith Family Vault',
      escrowId: 'ESC-2024-001',
      details: 'Approved escrow with comment: "Approved for holiday expenses"',
      txHash: '0xdef456ghi789jkl012mno345pqr678stu901vwx234yz567ab',
      ipAddress: '192.168.1.101',
      userAgent: 'Safari/17.0',
      status: 'success'
    },
    {
      id: 'AL-004',
      timestamp: '2024-12-25 12:30:00',
      action: 'notification.sent',
      user: 'System',
      userRole: 'system',
      vault: 'Smith Family Vault',
      escrowId: 'ESC-2024-001',
      details: 'Push notification sent to Mary Smith for approval',
      txHash: null,
      ipAddress: null,
      userAgent: 'Notification Service',
      status: 'success'
    },
    {
      id: 'AL-005',
      timestamp: '2024-12-25 14:30:00',
      action: 'escrow.approved',
      user: 'Mary Smith',
      userRole: 'approver',
      vault: 'Smith Family Vault',
      escrowId: 'ESC-2024-001',
      details: 'Approved escrow via mobile app',
      txHash: '0xghi789jkl012mno345pqr678stu901vwx234yz567abc890de',
      ipAddress: '10.0.0.50',
      userAgent: 'Mobile App iOS/1.2.0',
      status: 'success'
    },
    {
      id: 'AL-006',
      timestamp: '2024-12-25 15:00:00',
      action: 'paymaster.sponsored',
      user: 'System',
      userRole: 'system',
      vault: 'Smith Family Vault',
      escrowId: 'ESC-2024-001',
      details: 'Gas sponsorship approved for transaction',
      txHash: '0xjkl012mno345pqr678stu901vwx234yz567abc890def123gh',
      ipAddress: null,
      userAgent: 'Paymaster Service',
      status: 'success'
    },
    {
      id: 'AL-007',
      timestamp: '2024-12-24 16:20:00',
      action: 'policy.updated',
      user: 'John Smith',
      userRole: 'owner',
      vault: 'Smith Family Vault',
      escrowId: null,
      details: 'Updated High Value Policy threshold to 3/3',
      txHash: '0xmno345pqr678stu901vwx234yz567abc890def123ghi456jk',
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      status: 'success'
    },
    {
      id: 'AL-008',
      timestamp: '2024-12-24 14:10:00',
      action: 'member.added',
      user: 'John Smith',
      userRole: 'owner',
      vault: 'Smith Family Vault',
      escrowId: null,
      details: 'Added Sarah Smith as Viewer role',
      txHash: null,
      ipAddress: '192.168.1.101',
      userAgent: 'Chrome/120.0.0.0',
      status: 'success'
    }
  ];

  const actionTypes = [
    'escrow.created',
    'escrow.approved',
    'escrow.rejected',
    'escrow.released',
    'policy.updated',
    'member.added',
    'member.removed',
    'paymaster.sponsored',
    'notification.sent'
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('escrow')) return <Hash className="h-4 w-4 text-blue-500" />;
    if (action.includes('policy')) return <Settings className="h-4 w-4 text-purple-500" />;
    if (action.includes('member')) return <User className="h-4 w-4 text-green-500" />;
    if (action.includes('notification')) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredLogs = mockAuditLogs.filter(log => {
    if (searchTerm && !log.details.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.user.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.action.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedAction !== 'all' && log.action !== selectedAction) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Audit Log Viewer</h1>
          <p className="text-muted-foreground">View and export detailed audit logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="vault">Vault</Label>
              <Select value={selectedVault} onValueChange={setSelectedVault}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vaults</SelectItem>
                  <SelectItem value="smith-family">Smith Family Vault</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">Last 24 Hours</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(log => log.status === 'success').length}
            </div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.status === 'failed').length}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(filteredLogs.map(log => log.user)).size}
            </div>
            <div className="text-sm text-muted-foreground">Unique Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-mono">{log.timestamp}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{log.user}</div>
                      <Badge variant="outline" className="text-xs">
                        {log.userRole}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 max-w-md">
                      <div className="text-sm">{log.details}</div>
                      {log.escrowId && (
                        <Badge variant="outline" className="text-xs">
                          {log.escrowId}
                        </Badge>
                      )}
                      {log.ipAddress && (
                        <div className="text-xs text-muted-foreground">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.txHash ? (
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted p-1 rounded">
                          {log.txHash.slice(0, 12)}...
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No transaction</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="text-sm capitalize">{log.status}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4>CSV Export</h4>
              <p className="text-sm text-muted-foreground">
                Export filtered logs as CSV file for spreadsheet analysis
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV ({filteredLogs.length} records)
              </Button>
            </div>
            <div className="space-y-2">
              <h4>JSON Export</h4>
              <p className="text-sm text-muted-foreground">
                Export filtered logs as JSON file for programmatic analysis
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export JSON ({filteredLogs.length} records)
              </Button>
            </div>
            <div className="space-y-2">
              <h4>Custom Report</h4>
              <p className="text-sm text-muted-foreground">
                Generate custom audit report with selected fields
              </p>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}