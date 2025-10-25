import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  useAuditLogs,
  getEventTypeLabel,
  getEventTypeIcon,
  getSeverityBadgeColor,
  getRelativeTime,
  type AuditLog,
  type AuditLogFilter,
} from '@/hooks/useAuditLogs';
import {
  FileText,
  Download,
  Filter,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  Calendar,
  User,
  Activity,
  Shield,
} from 'lucide-react';
import type { Address } from 'viem';

interface AuditLogViewerEnhancedProps {
  vaultId: string;
  userAddress?: Address;
}

export function AuditLogViewerEnhanced({ vaultId, userAddress }: AuditLogViewerEnhancedProps) {
  const [filter, setFilter] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const {
    logs,
    stats,
    criticalLogs,
    isLoadingLogs,
    isLoadingStats,
    logsError,
    downloadCSV,
    refetchLogs,
  } = useAuditLogs(vaultId, filter);

  // 検索フィルタリング
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query) ||
      log.actor.toLowerCase().includes(query) ||
      log.eventType.toLowerCase().includes(query)
    );
  });

  const handleFilterChange = (key: keyof AuditLogFilter, value: any) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilter({
      limit: 50,
      offset: 0,
    });
    setSearchQuery('');
  };

  const getSeverityIcon = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-4 sm:mb-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track all activities and changes in your vault
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="glass-card hover-glow">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                      </div>
                      <div className="font-mono text-sm sm:text-lg font-semibold text-white">{stats.totalEvents}</div>
                      <div className="text-xs text-muted-foreground">Total Events</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="glass-card hover-glow">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                      </div>
                      <div className="font-mono text-sm sm:text-lg font-semibold text-red-400">{stats.criticalEvents}</div>
                      <div className="text-xs text-muted-foreground">Critical</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="glass-card hover-glow">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                      </div>
                      <div className="font-mono text-sm sm:text-lg font-semibold text-amber-400">{stats.warningEvents}</div>
                      <div className="text-xs text-muted-foreground">Warnings</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="glass-card hover-glow">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                      </div>
                      <div className="font-mono text-sm sm:text-lg font-semibold text-green-400">{stats.infoEvents}</div>
                      <div className="text-xs text-muted-foreground">Info</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                  </div>
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-xs sm:text-sm">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 glass border-white/20 text-sm"
                    />
                  </div>
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={filter.eventType || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('eventType', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="escrow_created">Escrow Created</SelectItem>
                      <SelectItem value="escrow_approved">Escrow Approved</SelectItem>
                      <SelectItem value="escrow_released">Escrow Released</SelectItem>
                      <SelectItem value="escrow_cancelled">Escrow Cancelled</SelectItem>
                      <SelectItem value="member_added">Member Added</SelectItem>
                      <SelectItem value="member_removed">Member Removed</SelectItem>
                      <SelectItem value="settings_updated">Settings Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity */}
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={filter.severity || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('severity', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto text-xs sm:text-sm">
                  Clear Filters
                </Button>
                <Button variant="outline" onClick={() => refetchLogs()} className="w-full sm:w-auto text-xs sm:text-sm">
                  Refresh
                </Button>
                <Button variant="outline" onClick={downloadCSV} className="w-full sm:w-auto text-xs sm:text-sm">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="glass-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  </div>
                  Audit Logs
                  {isLoadingLogs && <Loader2 className="h-4 w-4 animate-spin text-purple-400" />}
                </CardTitle>
              </CardHeader>
            <CardContent>
              {logsError && (
                <div className="text-center py-8 text-red-500">
                  Error loading logs: {logsError.message}
                </div>
              )}

              {!isLoadingLogs && filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No logs found
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                    className={`glass p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedLog?.id === log.id
                        ? 'border-purple-500/50 bg-purple-500/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="mt-1 shrink-0">
                          {getSeverityIcon(log.severity)}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base sm:text-lg">{getEventTypeIcon(log.eventType)}</span>
                            <span className="font-medium text-white text-sm sm:text-base truncate">{log.action}</span>
                            <Badge className={`${getSeverityBadgeColor(log.severity)} text-xs shrink-0`}>
                              {log.severity}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {log.description}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{log.actor.slice(0, 6)}...{log.actor.slice(-4)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              {getRelativeTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {filteredLogs.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(filteredLogs.length, filter.limit || 50)} of{' '}
                    {stats?.totalEvents || 0} logs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(filter.offset || 0) === 0}
                      onClick={() =>
                        handleFilterChange(
                          'offset',
                          Math.max(0, (filter.offset || 0) - (filter.limit || 50))
                        )
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filteredLogs.length < (filter.limit || 50)}
                      onClick={() =>
                        handleFilterChange('offset', (filter.offset || 0) + (filter.limit || 50))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Selected Log Details */}
          {selectedLog ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="glass-card">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg">Log Details</CardTitle>
                </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Event Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base sm:text-lg">{getEventTypeIcon(selectedLog.eventType)}</span>
                    <span className="font-medium text-white text-sm sm:text-base">{getEventTypeLabel(selectedLog.eventType)}</span>
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Actor</Label>
                  <div className="font-mono text-xs sm:text-sm text-white mt-1">
                    {selectedLog.actor.slice(0, 6)}...{selectedLog.actor.slice(-4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Role: {selectedLog.actorRole}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Timestamp</Label>
                  <div className="text-xs sm:text-sm text-white mt-1">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getRelativeTime(selectedLog.timestamp)}
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Severity</Label>
                  <div className="mt-1">
                    <Badge className={`${getSeverityBadgeColor(selectedLog.severity)} text-xs`}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                </div>
                {selectedLog.targetType && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">Target</Label>
                      <div className="text-xs sm:text-sm text-white mt-1">
                        {selectedLog.targetType}
                        {selectedLog.targetId && (
                          <span className="text-muted-foreground ml-1">
                            ({selectedLog.targetId})
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedLog.ipAddress && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">IP Address</Label>
                      <div className="font-mono text-xs sm:text-sm text-white mt-1">{selectedLog.ipAddress}</div>
                    </div>
                  </>
                )}
                {Object.keys(selectedLog.metadata).length > 0 && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <Label className="text-xs sm:text-sm text-muted-foreground">Metadata</Label>
                      <pre className="text-[10px] sm:text-xs bg-black/30 text-white p-2 sm:p-3 rounded-lg mt-1 overflow-auto border border-white/10">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="glass-card">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg">Log Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <Shield className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">Select a log to view details</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Critical Logs */}
          {criticalLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="glass-card hover-glow">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                    </div>
                    <span>Critical Events</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                  {criticalLogs.slice(0, 5).map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="glass p-2 sm:p-3 rounded-lg border border-red-500/30 cursor-pointer hover:border-red-500/50 transition-all"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="font-medium text-white text-xs sm:text-sm truncate">{log.action}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {getRelativeTime(log.timestamp)}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Stats */}
          {stats && Object.keys(stats.eventsByType).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="glass-card hover-glow">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                    </div>
                    <span>Events by Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                  {Object.entries(stats.eventsByType)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count], index) => (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg">{getEventTypeIcon(type as AuditLog['eventType'])}</span>
                          <span className="text-xs sm:text-sm text-white">{getEventTypeLabel(type as AuditLog['eventType'])}</span>
                        </div>
                        <Badge variant="outline" className="bg-white/5 border-white/20 text-white text-xs shrink-0">
                          {count}
                        </Badge>
                      </motion.div>
                    ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
