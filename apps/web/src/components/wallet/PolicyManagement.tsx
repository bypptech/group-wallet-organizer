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
import { Textarea } from '../ui/textarea';
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
  Archive,
  Loader2
} from 'lucide-react';
import { usePoliciesAPI, useCreatePolicyAPI, useUpdatePolicyAPI, useEnablePolicyAPI, useDisablePolicyAPI, useArchivePolicyAPI, useSchedulePolicyUpdateAPI, useEmergencyUpdatePolicyAPI } from '@/hooks/usePoliciesAPI';
import { useVault } from '@/hooks/useVaults';
import { ZERO_HASH } from '@/lib/contracts';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

type UserRole = 'requester' | 'approver' | 'owner' | 'viewer';

interface PolicyManagementProps {
  currentRole: UserRole;
  vaultId?: string;
}

export function PolicyManagement({ currentRole, vaultId }: PolicyManagementProps) {
  // Show message if no vault is selected
  if (!vaultId) {
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Policy Management
            </h3>
            <p className="text-muted-foreground mb-6">
              Create and manage approval policies for your groups.
              Policies define approval thresholds, timelocks, and other rules.
            </p>
            <p className="text-sm text-muted-foreground">
              Select a group from <strong>My Groups</strong> to view group-specific policies,
              or create global policies here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [policyToArchive, setPolicyToArchive] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    policyId: '',
    scheduledDate: '',
    minApprovals: '2',
    maxAmount: '1000',
    cooldownHours: '24',
  });
  const [createFormData, setCreateFormData] = useState({
    minApprovals: '2',
    maxAmount: '1000',
    cooldownHours: '24',
    rolesRoot: ZERO_HASH,
    ownersRoot: ZERO_HASH,
  });
  const [updateFormData, setUpdateFormData] = useState({
    policyId: '',
    minApprovals: '2',
    maxAmount: '1000',
    cooldownHours: '24',
  });
  const [emergencyFormData, setEmergencyFormData] = useState({
    policyId: '',
    minApprovals: '2',
    maxAmount: '1000',
    cooldownHours: '24',
    reason: '',
  });

  // API hooks
  const { data: policiesData, isLoading: isLoadingPolicies, refetch: refetchPolicies } = usePoliciesAPI(vaultId);
  const { vault } = useVault(vaultId);
  const { mutate: createPolicy, isPending: isCreating } = useCreatePolicyAPI();
  const { mutate: updatePolicy, isPending: isUpdating } = useUpdatePolicyAPI();
  const { mutate: enablePolicy, isPending: isEnabling } = useEnablePolicyAPI();
  const { mutate: disablePolicy, isPending: isDisabling } = useDisablePolicyAPI();
  const { mutate: archivePolicy, isPending: isArchiving } = useArchivePolicyAPI();
  const { mutate: scheduleUpdate, isPending: isScheduling } = useSchedulePolicyUpdateAPI();
  const { mutate: emergencyUpdate, isPending: isEmergencyUpdating } = useEmergencyUpdatePolicyAPI();

  // Mock policies data (fallback)
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

  // Convert API Policy to display format (compatible with legacy mock format)
  const convertPolicyToDisplay = (policy: any) => {
    // Calculate timelock in hours
    const timelockHours = policy.timelock ? Math.floor(policy.timelock / 3600) : 0;

    return {
      id: policy.id,
      name: policy.name,
      threshold: `${policy.threshold || 0}/${policy.threshold || 0}`, // Format as "2/3"
      timelock: `${timelockHours}h`,
      rolesRoot: policy.rolesRoot,
      status: policy.active ? 'active' : 'inactive',
      description: policy.description || '',
      createdAt: policy.createdAt,
      lastUpdated: policy.updatedAt || policy.createdAt,
      scheduledUpdate: null,
      usageCount: 0, // TODO: Get actual usage count from API
      minApprovals: policy.threshold || 0,
      maxAmount: policy.maxAmount || '0',
      cooldownHours: timelockHours,
    };
  };

  // Use API policies if available, otherwise fall back to mock data
  const displayPolicies = policiesData?.policies && policiesData.policies.length > 0
    ? policiesData.policies.map(convertPolicyToDisplay)
    : mockPolicies;

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

  // Auto-refresh policies when vault changes
  React.useEffect(() => {
    if (vaultId) {
      refetchPolicies();
    }
  }, [vaultId, refetchPolicies]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Policy Management</h1>
          <p className="text-muted-foreground">Manage approval policies and guardian operations</p>
        </div>
        {canManagePolicies && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minApprovals">Minimum Approvals</Label>
                    <Input
                      id="minApprovals"
                      type="number"
                      min="1"
                      value={createFormData.minApprovals}
                      onChange={(e) => setCreateFormData({ ...createFormData, minApprovals: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cooldownHours">Cooldown Period (hours)</Label>
                    <Input
                      id="cooldownHours"
                      type="number"
                      min="0"
                      value={createFormData.cooldownHours}
                      onChange={(e) => setCreateFormData({ ...createFormData, cooldownHours: e.target.value })}
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Maximum Amount (USDC)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={createFormData.maxAmount}
                    onChange={(e) => setCreateFormData({ ...createFormData, maxAmount: e.target.value })}
                    placeholder="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rolesRoot">Roles Merkle Root</Label>
                  <Input
                    id="rolesRoot"
                    type="text"
                    value={createFormData.rolesRoot}
                    onChange={(e) => setCreateFormData({ ...createFormData, rolesRoot: e.target.value as `0x${string}` })}
                    placeholder="0x0000000000000000000000000000000000000000000000000000000000000000"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownersRoot">Owners Merkle Root</Label>
                  <Input
                    id="ownersRoot"
                    type="text"
                    value={createFormData.ownersRoot}
                    onChange={(e) => setCreateFormData({ ...createFormData, ownersRoot: e.target.value as `0x${string}` })}
                    placeholder="0x0000000000000000000000000000000000000000000000000000000000000000"
                    className="font-mono text-sm"
                  />
                </div>


                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!vaultId) {
                        alert('Vault ID is required');
                        return;
                      }

                      if (!vault?.address) {
                        alert('Vault address not found');
                        return;
                      }

                      // Generate unique policyId (bytes32) using vault address
                      const policyId = keccak256(
                        encodeAbiParameters(
                          parseAbiParameters('address vault, uint256 nonce'),
                          [vault.address as `0x${string}`, BigInt(Date.now())]
                        )
                      );

                      const policyData = {
                        type: 'payment' as const,
                        vaultId: vaultId,
                        policyId: policyId,
                        name: `Policy ${Date.now()}`,
                        description: 'Created from UI',
                        threshold: parseInt(createFormData.minApprovals),
                        timelock: parseInt(createFormData.cooldownHours) * 3600, // Convert hours to seconds
                        rolesRoot: createFormData.rolesRoot,
                        ownersRoot: createFormData.ownersRoot,
                        maxAmount: createFormData.maxAmount,
                        active: true,
                      };

                      console.log('[PolicyManagement] Creating policy with data:', policyData);

                      createPolicy(policyData, {
                        onSuccess: () => {
                          console.log('[PolicyManagement] Policy created successfully');
                          // Refetch policies to show the new policy
                          refetchPolicies();

                          setShowCreateDialog(false);
                          setCreateFormData({
                            minApprovals: '2',
                            maxAmount: '1000',
                            cooldownHours: '24',
                            rolesRoot: ZERO_HASH,
                            ownersRoot: ZERO_HASH,
                          });
                        },
                        onError: (error) => {
                          console.error('[PolicyManagement] Policy creation failed:', error);
                          alert(`Policy creation failed: ${error.message}`);
                        },
                      });
                    }}
                    disabled={isCreating || !vaultId || !vault?.address}
                  >
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Policy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Update Policy Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Policy updates require approval from other owners and go through a timelock period.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="update-minApprovals">Minimum Approvals</Label>
                <Input
                  id="update-minApprovals"
                  type="number"
                  min="1"
                  value={updateFormData.minApprovals}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, minApprovals: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-cooldownHours">Cooldown Period (hours)</Label>
                <Input
                  id="update-cooldownHours"
                  type="number"
                  min="0"
                  value={updateFormData.cooldownHours}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, cooldownHours: e.target.value })}
                  placeholder="24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-maxAmount">Maximum Amount (USDC)</Label>
              <Input
                id="update-maxAmount"
                type="number"
                min="0"
                step="0.01"
                value={updateFormData.maxAmount}
                onChange={(e) => setUpdateFormData({ ...updateFormData, maxAmount: e.target.value })}
                placeholder="1000"
              />
            </div>


            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUpdateDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!updateFormData.policyId) {
                    alert('Policy ID is required');
                    return;
                  }
                  updatePolicy({
                    policyId: updateFormData.policyId,
                    minApprovals: parseInt(updateFormData.minApprovals),
                    maxAmount: updateFormData.maxAmount,
                    cooldownHours: parseInt(updateFormData.cooldownHours),
                  }, {
                    onSuccess: () => {
                      // Refetch policies to show the updated policy
                      refetchPolicies();

                      setShowUpdateDialog(false);
                      setUpdateFormData({
                        policyId: '',
                        minApprovals: '2',
                        maxAmount: '1000',
                        cooldownHours: '24',
                      });
                    },
                  });
                }}
                disabled={isUpdating || !updateFormData.policyId}
              >
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Policy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Update Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Policy Update
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Emergency updates bypass normal approval processes and should only be used in critical situations. This action will be logged and audited.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency-minApprovals">Minimum Approvals</Label>
                <Input
                  id="emergency-minApprovals"
                  type="number"
                  min="1"
                  value={emergencyFormData.minApprovals}
                  onChange={(e) => setEmergencyFormData({ ...emergencyFormData, minApprovals: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-cooldownHours">Cooldown Period (hours)</Label>
                <Input
                  id="emergency-cooldownHours"
                  type="number"
                  min="0"
                  value={emergencyFormData.cooldownHours}
                  onChange={(e) => setEmergencyFormData({ ...emergencyFormData, cooldownHours: e.target.value })}
                  placeholder="24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-maxAmount">Maximum Amount (USDC)</Label>
              <Input
                id="emergency-maxAmount"
                type="number"
                min="0"
                step="0.01"
                value={emergencyFormData.maxAmount}
                onChange={(e) => setEmergencyFormData({ ...emergencyFormData, maxAmount: e.target.value })}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-reason">Emergency Reason (Required)</Label>
              <Textarea
                id="emergency-reason"
                value={emergencyFormData.reason}
                onChange={(e) => setEmergencyFormData({ ...emergencyFormData, reason: e.target.value })}
                placeholder="Explain why this emergency update is necessary..."
                rows={4}
                className="resize-none"
              />
            </div>


            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmergencyDialog(false)}
                disabled={isEmergencyUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!emergencyFormData.policyId) {
                    alert('Policy ID is required');
                    return;
                  }
                  if (!emergencyFormData.reason.trim()) {
                    alert('Emergency reason is required');
                    return;
                  }
                  emergencyUpdate({
                    policyId: emergencyFormData.policyId,
                    minApprovals: parseInt(emergencyFormData.minApprovals),
                    maxAmount: emergencyFormData.maxAmount,
                    cooldownHours: parseInt(emergencyFormData.cooldownHours),
                    reason: emergencyFormData.reason,
                  }, {
                    onSuccess: () => {
                      setShowEmergencyDialog(false);
                      setEmergencyFormData({
                        policyId: '',
                        minApprovals: '2',
                        maxAmount: '1000',
                        cooldownHours: '24',
                        reason: '',
                      });
                    },
                  });
                }}
                disabled={isEmergencyUpdating || !emergencyFormData.policyId || !emergencyFormData.reason.trim()}
              >
                {isEmergencyUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Execute Emergency Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Policy Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archive Policy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to archive this policy? This action cannot be undone. The policy will be disabled and removed from the active policy list.
              </AlertDescription>
            </Alert>

            {policyToArchive && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Policy ID</div>
                <div className="font-mono text-sm">{policyToArchive}</div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowArchiveDialog(false);
                  setPolicyToArchive(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (policyToArchive) {
                    archivePolicy(policyToArchive, {
                      onSuccess: () => {
                        setShowArchiveDialog(false);
                        setPolicyToArchive(null);
                      },
                    });
                  }
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Policy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Update Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Policy Update
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Schedule a future policy update. The update will be proposed at the scheduled time and will still require approval from other owners.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="schedule-date">Scheduled Date & Time</Label>
              <Input
                id="schedule-date"
                type="datetime-local"
                value={scheduleFormData.scheduledDate}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduledDate: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-minApprovals">Minimum Approvals</Label>
                <Input
                  id="schedule-minApprovals"
                  type="number"
                  min="1"
                  value={scheduleFormData.minApprovals}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, minApprovals: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-cooldownHours">Cooldown Period (hours)</Label>
                <Input
                  id="schedule-cooldownHours"
                  type="number"
                  min="0"
                  value={scheduleFormData.cooldownHours}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, cooldownHours: e.target.value })}
                  placeholder="24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-maxAmount">Maximum Amount (USDC)</Label>
              <Input
                id="schedule-maxAmount"
                type="number"
                min="0"
                step="0.01"
                value={scheduleFormData.maxAmount}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, maxAmount: e.target.value })}
                placeholder="1000"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowScheduleDialog(false);
                  setScheduleFormData({
                    policyId: '',
                    scheduledDate: '',
                    minApprovals: '2',
                    maxAmount: '1000',
                    cooldownHours: '24',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!scheduleFormData.policyId || !scheduleFormData.scheduledDate) {
                    alert('Policy ID and scheduled date are required');
                    return;
                  }
                  scheduleUpdate({
                    policyId: scheduleFormData.policyId,
                    scheduledDate: scheduleFormData.scheduledDate,
                  }, {
                    onSuccess: () => {
                      setShowScheduleDialog(false);
                      setScheduleFormData({
                        policyId: '',
                        scheduledDate: '',
                        minApprovals: '2',
                        maxAmount: '1000',
                        cooldownHours: '24',
                      });
                    },
                  });
                }}
                disabled={isScheduling || !scheduleFormData.policyId || !scheduleFormData.scheduledDate}
              >
                {isScheduling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {!isScheduling && <Calendar className="h-4 w-4 mr-2" />}
                Schedule Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Section */}
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">About Approval Policies</p>
            <p className="text-sm text-muted-foreground">
              Policies are reusable approval rules that can be assigned to any group.
              Create policies here and assign them in <strong>Group Settings</strong>.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside ml-2 mt-2">
              <li><strong>Threshold:</strong> Minimum number of approvals required</li>
              <li><strong>Timelock:</strong> Waiting period before execution</li>
              <li><strong>Amount Limits:</strong> Maximum transaction amounts</li>
              <li><strong>Cooldown Period:</strong> Time between policy updates</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Policies</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPolicies ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading policies...</span>
                </div>
              ) : displayPolicies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No policies found. Create your first policy to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {displayPolicies.map((policy) => (
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
                          {vault?.policyId === policy.id && (
                            <Badge variant="default" className="bg-blue-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Currently Active
                            </Badge>
                          )}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Parse threshold and timelock from policy data
                              const threshold = policy.threshold.split('/')[0]; // "2/3" -> "2"
                              const timelockMatch = policy.timelock.match(/(\d+)h/);
                              const timelockHours = timelockMatch ? timelockMatch[1] : '24';

                              setUpdateFormData({
                                policyId: policy.id,
                                minApprovals: threshold,
                                maxAmount: '1000', // TODO: Get from actual policy data
                                cooldownHours: timelockHours,
                              });
                              setShowUpdateDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPolicyToArchive(policy.id);
                              setShowArchiveDialog(true);
                            }}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Details */}
          {selectedPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Policy Details</CardTitle>
              </CardHeader>
              <CardContent>
                {displayPolicies
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
                          <Button
                            variant="outline"
                            onClick={() => {
                              const threshold = policy.threshold.split('/')[0];
                              const timelockMatch = policy.timelock.match(/(\d+)h/);
                              const timelockHours = timelockMatch ? timelockMatch[1] : '24';

                              setUpdateFormData({
                                policyId: policy.id,
                                minApprovals: threshold,
                                maxAmount: '1000', // TODO: Get from actual policy data
                                cooldownHours: timelockHours,
                              });
                              setShowUpdateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Policy
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const threshold = policy.threshold.split('/')[0];
                              const timelockMatch = policy.timelock.match(/(\d+)h/);
                              const timelockHours = timelockMatch ? timelockMatch[1] : '24';

                              setScheduleFormData({
                                policyId: policy.id,
                                scheduledDate: '',
                                minApprovals: threshold,
                                maxAmount: '1000',
                                cooldownHours: timelockHours,
                              });
                              setShowScheduleDialog(true);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Update
                          </Button>
                          {policy.status === 'draft' && (
                            <Button
                              onClick={() => {
                                if (policy.id) {
                                  enablePolicy(policy.id);
                                }
                              }}
                              disabled={isEnabling}
                            >
                              {isEnabling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              {!isEnabling && <CheckCircle className="h-4 w-4 mr-2" />}
                              Enable Policy
                            </Button>
                          )}
                          {policy.status === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (policy.id) {
                                    disablePolicy(policy.id);
                                  }
                                }}
                                disabled={isDisabling}
                              >
                                {isDisabling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {!isDisabling && <XCircle className="h-4 w-4 mr-2" />}
                                Disable Policy
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  setPolicyToArchive(policy.id);
                                  setShowArchiveDialog(true);
                                }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive Policy
                              </Button>
                            </>
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
                        onClick={() => {
                          if (operation.type === 'policy_override' && selectedPolicy) {
                            const policy = displayPolicies.find(p => p.id === selectedPolicy);
                            if (policy) {
                              const threshold = policy.threshold.split('/')[0];
                              const timelockMatch = policy.timelock.match(/(\d+)h/);
                              const timelockHours = timelockMatch ? timelockMatch[1] : '24';

                              setEmergencyFormData({
                                policyId: policy.id,
                                minApprovals: threshold,
                                maxAmount: '1000',
                                cooldownHours: timelockHours,
                                reason: '',
                              });
                              setShowEmergencyDialog(true);
                            }
                          }
                        }}
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
                <span className="font-medium">{displayPolicies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Policies</span>
                <span className="font-medium">{displayPolicies.filter(p => p.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Draft Policies</span>
                <span className="font-medium">{displayPolicies.filter(p => p.status === 'draft' || p.status === 'inactive').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Usage</span>
                <span className="font-medium">{displayPolicies.reduce((sum, p) => sum + (p.usageCount || 0), 0)}</span>
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