import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle, Plus, Info, CheckCircle } from 'lucide-react';
import type { Policy } from '../../types/policy';

interface Step2PolicyProps {
  formData: {
    policyId: string;
  };
  availablePolicies: Policy[];
  isPoliciesLoading: boolean;
  validationErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  onCreatePolicyClick: () => void;
}

export function Step2Policy({
  formData,
  availablePolicies,
  isPoliciesLoading,
  validationErrors,
  onInputChange,
  onCreatePolicyClick,
}: Step2PolicyProps) {
  const selectedPolicy = availablePolicies.find(p => p.id === formData.policyId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Payment Approval Policy</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select or create a policy that defines how this payment will be approved.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50/10">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          <div className="font-medium mb-1">What is a Payment Policy?</div>
          <div className="text-sm">
            A payment policy defines the approval rules for escrow transactions:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Required number of guardian approvals (threshold)</li>
              <li>Optional timelock period for additional security</li>
              <li>Maximum transaction amount limits</li>
              <li>Guardian and owner addresses for verification</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Policy Selection */}
      <div>
        <Label htmlFor="policyId">Select Approval Policy *</Label>

        {/* Debug: Show policy count */}
        {availablePolicies.length > 0 && (
          <div className="text-xs text-muted-foreground mb-1">
            {availablePolicies.length} policy(ies) available
          </div>
        )}

        <div className="flex gap-2">
          <Select
            value={formData.policyId}
            onValueChange={(value) => {
              console.log('[Step2Policy] Policy selected:', value);
              onInputChange('policyId', value);
            }}
            disabled={isPoliciesLoading}
          >
            <SelectTrigger className={`flex-1 ${validationErrors.policyId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={
                isPoliciesLoading
                  ? "Loading policies..."
                  : availablePolicies.length === 0
                    ? "No policies - create one"
                    : "Select a policy"
              } />
            </SelectTrigger>
            <SelectContent>
              {availablePolicies.map((policy) => (
                <SelectItem key={policy.id} value={policy.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{policy.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {policy.type === 'payment' && policy.threshold ? `${policy.threshold} approvals` : ''}
                      {policy.type === 'payment' && policy.timelock ? ` • ${policy.timelock}s` : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Create Policy Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onCreatePolicyClick}
            disabled={isPoliciesLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        {validationErrors.policyId && (
          <div className="text-sm text-destructive mt-1">{validationErrors.policyId}</div>
        )}

        {availablePolicies.length === 0 && !isPoliciesLoading && (
          <Alert className="mt-2 border-blue-200 bg-blue-50/10">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <div className="font-medium mb-1">No Payment Policies Found</div>
              <div className="text-sm">
                This group doesn't have any payment approval policies yet.
                Click the <strong>Create New</strong> button to create your first policy.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Selected Policy Details */}
      {selectedPolicy && (
        <div className="mt-4 p-4 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-white">{selectedPolicy.name}</h4>
              {selectedPolicy.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedPolicy.description}</p>
              )}
            </div>
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
          </div>

          <div className="space-y-2 text-sm">
            {selectedPolicy.type === 'payment' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Approvals:</span>
                  <span className="text-white font-medium">{selectedPolicy.threshold || 'N/A'}</span>
                </div>
                {selectedPolicy.timelock !== undefined && selectedPolicy.timelock > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timelock Period:</span>
                    <span className="text-white font-medium">{selectedPolicy.timelock}s</span>
                  </div>
                )}
                {selectedPolicy.maxAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maximum Amount:</span>
                    <span className="text-white font-medium">
                      {/* Convert from smallest unit to display unit */}
                      {(Number(selectedPolicy.maxAmount) / 1e18).toFixed(6)} tokens
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${selectedPolicy.active ? 'text-green-400' : 'text-yellow-400'}`}>
                    {selectedPolicy.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Policy Requirements Info */}
      {selectedPolicy && (
        <Alert className="border-green-200 bg-green-50/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-200">
            <div className="text-sm">
              <div className="font-medium mb-1">Policy Selected</div>
              <div>
                This escrow will require{' '}
                <strong>{selectedPolicy.threshold || 0} guardian approval(s)</strong>
                {selectedPolicy.timelock && selectedPolicy.timelock > 0 && (
                  <span> and a <strong>{selectedPolicy.timelock}s timelock period</strong></span>
                )} before execution.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
