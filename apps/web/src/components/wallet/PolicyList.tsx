import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Shield,
  Plus,
  Edit,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  Wallet,
  HandCoins,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { usePoliciesAPI } from '@/hooks/usePoliciesAPI';
import { useVault } from '@/hooks/useVaults';
import type { Policy, PaymentPolicy } from '@/hooks/usePoliciesAPI';

type PolicyType = 'payment' | 'collection';

type UserRole = 'requester' | 'guardian' | 'owner' | 'viewer';

interface PolicyListProps {
  vaultId?: string;
  currentRole: UserRole;
  onCreateNew: () => void;
  onEditPolicy: (policyId: string) => void;
  onBackToGroup?: () => void;
}

export function PolicyList({ vaultId, currentRole, onCreateNew, onEditPolicy, onBackToGroup }: PolicyListProps) {
  const canManage = currentRole === 'owner' || currentRole === 'guardian';
  const [typeFilter, setTypeFilter] = React.useState<PolicyType | 'all'>('all');

  // Fetch vault data to display context
  const { vault, isLoading: isVaultLoading } = useVault(vaultId);

  // Fetch policies from API (filtered by vault if vaultId provided)
  const { data, isLoading, error } = usePoliciesAPI(vaultId ? { vaultId } : undefined);
  const policies = data?.policies || [];

  // Filter policies by type
  const filteredPolicies = typeFilter === 'all'
    ? policies
    : policies.filter(p => p.type === typeFilter);

  // Count by type
  const paymentCount = policies.filter(p => p.type === 'payment').length;
  const collectionCount = policies.filter(p => p.type === 'collection').length;

  // Format display values for payment policies
  const formatPolicyDisplay = (policy: Policy) => {
    if (policy.type === 'payment') {
      const paymentPolicy = policy as PaymentPolicy;
      return {
        minApprovals: paymentPolicy.threshold || 0,
        maxAmount: paymentPolicy.maxAmount ? `${paymentPolicy.maxAmount} USDC` : 'No limit',
        cooldownHours: paymentPolicy.timelock ? Math.floor(paymentPolicy.timelock / 3600) : 0,
      };
    }
    // For collection policies or other types
    return {
      minApprovals: 0,
      maxAmount: 'N/A',
      cooldownHours: 0,
    };
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading policies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Failed to load policies. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb / Back Navigation */}
      {onBackToGroup && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToGroup}
            className="text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Group
          </Button>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {vault ? `${vault.name} - Payment Policies` : 'Payment Policies'}
          </h2>
          <p className="text-muted-foreground">
            {vault
              ? `Manage approval policies for this group (${policies.length} total)`
              : 'Create and manage approval policies for your vault'}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={onCreateNew}
            className="gradient-primary text-white hover-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Policy
          </Button>
        )}
      </motion.div>

      {/* Info Section */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">About Policies</p>
            <p className="text-sm text-muted-foreground">
              <strong>Payment Policies</strong> define rules for outgoing payments (approvals, limits, cooldown).
              <strong className="ml-1">Collection Policies</strong> define rules for fund collection (partial payment, auto-complete, reminders).
              {vault && (
                <span className="block mt-1">
                  Multiple escrows can use the same policy.
                </span>
              )}
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Type Filter Tabs */}
      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as PolicyType | 'all')}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">
            All Policies ({policies.length})
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payment ({paymentCount})
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Collection ({collectionCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Policy Cards */}
      {filteredPolicies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id} className="glass border-white/10 hover:border-white/20 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg text-white">
                      {policy.name}
                    </CardTitle>
                    <Badge
                      variant={policy.type === 'payment' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {policy.type === 'payment' ? (
                        <><Wallet className="h-3 w-3 mr-1" />Payment</>
                      ) : (
                        <><HandCoins className="h-3 w-3 mr-1" />Collection</>
                      )}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {policy.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge
                  variant={policy.active ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {policy.active ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {policy.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Policy Details */}
              <div className="space-y-2 text-sm">
                {policy.type === 'payment' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Min Approvals:</span>
                      <span className="text-white font-medium">{policy.threshold || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Max Amount:</span>
                      <span className="text-white font-medium">
                        {policy.maxAmount ? `${policy.maxAmount} USDC` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cooldown:</span>
                      <span className="text-white font-medium">
                        {policy.timelock ? `${Math.floor(policy.timelock / 3600)}h` : '0h'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Partial Payment:</span>
                      <span className="text-white font-medium">
                        {policy.collectionConfig?.allowPartialPayment ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Auto Complete:</span>
                      <span className="text-white font-medium">
                        {policy.collectionConfig?.autoComplete ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reminders:</span>
                      <span className="text-white font-medium">
                        {policy.collectionConfig?.reminderSettings?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Created {new Date(policy.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onEditPolicy(policy.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Policy
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      ) : (
        /* Empty State */
        <Card className="glass border-white/10">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {typeFilter === 'all' ? 'No Policies Yet' : `No ${typeFilter} Policies`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {typeFilter === 'all' 
                ? 'Create your first approval policy to get started'
                : `Create a ${typeFilter} policy to get started`
              }
            </p>
            {canManage && (
              <Button
                onClick={onCreateNew}
                className="gradient-primary text-white hover-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create {typeFilter === 'all' ? 'Policy' : `${typeFilter} Policy`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}