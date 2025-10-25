import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, AlertTriangle, RefreshCw, Database } from 'lucide-react';

// Loading Components
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-1">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-2 w-12" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function EscrowListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty States
export function EmptyEscrowList() {
  return (
    <div className="text-center py-12">
      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No escrows found</h3>
      <p className="text-muted-foreground mb-4">
        You haven't created any escrows yet. Start by creating your first escrow request.
      </p>
      <Button>
        Create First Escrow
      </Button>
    </div>
  );
}

export function EmptyNotifications() {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h4 className="font-medium mb-1">No notifications</h4>
      <p className="text-sm text-muted-foreground">
        All caught up! You'll see new notifications here.
      </p>
    </div>
  );
}

export function EmptyAuditLog() {
  return (
    <div className="text-center py-12">
      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No audit events found</h3>
      <p className="text-muted-foreground mb-4">
        No events match your current filters. Try adjusting your search criteria.
      </p>
      <Button variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );
}

// Error States
export function DataLoadError({ onRetry, message = "Failed to load data" }: { onRetry?: () => void; message?: string }) {
  return (
    <Alert className="border-destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium">Error Loading Data</div>
          <div className="text-sm mt-1">{message}</div>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function APIError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="space-y-2">
            <div className="font-medium text-destructive">API Request Failed</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <div className="text-xs text-muted-foreground">
              Timestamp: {new Date().toISOString()}
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry Request
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Spinner Component
export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 py-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Bundler Status Component
export function BundlerStatus({ status }: { status: 'idle' | 'sending' | 'success' | 'failed' }) {
  const statusConfig = {
    idle: { icon: null, text: 'Ready to send', color: 'text-muted-foreground' },
    sending: { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: 'Sending to bundler...', color: 'text-blue-600' },
    success: { icon: '✓', text: 'Transaction sent', color: 'text-green-600' },
    failed: { icon: '✗', text: 'Failed to send', color: 'text-red-600' }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}