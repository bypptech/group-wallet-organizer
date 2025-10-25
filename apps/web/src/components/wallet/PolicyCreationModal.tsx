import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

// Define local type for auto-generated policy (not in the hook yet)
interface CreatePaymentPolicyWithAddresses {
  type: 'payment';
  vaultId: string;
  name: string;
  description?: string;
  threshold: number;
  timelock?: number;
  guardianAddresses: string[];
  ownerAddresses: string[];
  maxAmount?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

interface PolicyCreationModalProps {
  open: boolean;
  vaultId: string;
  guardianAddresses?: string[]; // Optional: Auto-populate from vault
  ownerAddresses?: string[]; // Optional: Auto-populate from vault
  onPolicyCreated: (policyId: string) => void;
  onCancel: () => void;
}

interface PolicyFormData {
  name: string;
  description: string;
  threshold: string;
  timelock: string;
  guardianAddresses: string[];
  ownerAddresses: string[];
  maxAmount: string;
}

export function PolicyCreationModal({
  open,
  vaultId,
  guardianAddresses = [],
  ownerAddresses = [],
  onPolicyCreated,
  onCancel,
}: PolicyCreationModalProps) {
  // Use fetch directly since the API supports auto-generated Merkle roots
  const [isCreating, setIsCreating] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    description: '',
    threshold: '1',
    timelock: '0',
    guardianAddresses: [],
    ownerAddresses: [],
    maxAmount: '',
  });

  const [guardianInputs, setGuardianInputs] = useState<string[]>(['']);
  const [ownerInputs, setOwnerInputs] = useState<string[]>(['']);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens (only on open, not on every render)
  useEffect(() => {
    if (open) {
      console.log('[PolicyCreationModal] Modal opened, resetting form');
      setFormData({
        name: '',
        description: '',
        threshold: '1',
        timelock: '0',
        guardianAddresses: [],
        ownerAddresses: [],
        maxAmount: '',
      });
      setGuardianInputs(['']);
      setOwnerInputs(['']);
      setValidationErrors({});
    }
  }, [open]); // Only reset when modal opens, not when addresses change

  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    console.log('[PolicyCreationModal] Input change:', field, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user types
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleGuardianAddressChange = (index: number, value: string) => {
    const newInputs = [...guardianInputs];
    newInputs[index] = value;
    setGuardianInputs(newInputs);

    // Update formData with valid addresses only
    const validAddresses = newInputs.filter(
      (addr) => addr.trim() !== '' && addr.startsWith('0x') && addr.length === 42
    );
    setFormData((prev) => ({ ...prev, guardianAddresses: validAddresses }));
  };

  const handleOwnerAddressChange = (index: number, value: string) => {
    const newInputs = [...ownerInputs];
    newInputs[index] = value;
    setOwnerInputs(newInputs);

    // Update formData with valid addresses only
    const validAddresses = newInputs.filter(
      (addr) => addr.trim() !== '' && addr.startsWith('0x') && addr.length === 42
    );
    setFormData((prev) => ({ ...prev, ownerAddresses: validAddresses }));
  };

  const addGuardianInput = () => {
    setGuardianInputs([...guardianInputs, '']);
  };

  const removeGuardianInput = (index: number) => {
    const newInputs = guardianInputs.filter((_, i) => i !== index);
    setGuardianInputs(newInputs.length === 0 ? [''] : newInputs);
  };

  const addOwnerInput = () => {
    setOwnerInputs([...ownerInputs, '']);
  };

  const removeOwnerInput = (index: number) => {
    const newInputs = ownerInputs.filter((_, i) => i !== index);
    setOwnerInputs(newInputs.length === 0 ? [''] : newInputs);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Policy name is required';
    }

    const threshold = parseInt(formData.threshold);
    if (isNaN(threshold) || threshold < 1) {
      errors.threshold = 'Threshold must be at least 1';
    }

    const timelock = parseInt(formData.timelock);
    if (isNaN(timelock) || timelock < 0) {
      errors.timelock = 'Timelock must be 0 or greater';
    }

    if (formData.guardianAddresses.length === 0) {
      errors.guardianAddresses = 'At least one guardian address is required';
    }

    if (threshold > formData.guardianAddresses.length) {
      errors.threshold = `Threshold cannot exceed number of guardians (${formData.guardianAddresses.length})`;
    }

    if (formData.ownerAddresses.length === 0) {
      errors.ownerAddresses = 'At least one owner address is required';
    }

    if (formData.maxAmount && formData.maxAmount.trim() !== '') {
      const maxAmount = parseFloat(formData.maxAmount);
      if (isNaN(maxAmount) || maxAmount <= 0) {
        errors.maxAmount = 'Max amount must be a positive number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsCreating(true);

    try {
      // Convert maxAmount to smallest unit (wei) if provided
      let maxAmountInSmallestUnit: string | undefined;
      if (formData.maxAmount && formData.maxAmount.trim() !== '') {
        // Assuming 18 decimals for simplicity - adjust based on token
        const decimals = 18;
        const amountFloat = parseFloat(formData.maxAmount);
        const multiplier = BigInt(10 ** decimals);
        maxAmountInSmallestUnit = (BigInt(Math.floor(amountFloat * 10 ** 6)) * multiplier / BigInt(10 ** 6)).toString();
      }

      const payload: CreatePaymentPolicyWithAddresses = {
        type: 'payment' as const,
        vaultId,
        name: formData.name,
        description: formData.description || undefined,
        threshold: parseInt(formData.threshold),
        timelock: parseInt(formData.timelock),
        guardianAddresses: formData.guardianAddresses,
        ownerAddresses: formData.ownerAddresses,
        maxAmount: maxAmountInSmallestUnit,
        active: true,
      };

      console.log('[PolicyCreationModal] Creating policy:', payload);

      const response = await fetch(`${API_BASE_URL}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create policy');
      }

      const data = await response.json();
      console.log('[PolicyCreationModal] Policy created:', data);

      toast.success('Policy created successfully');
      onPolicyCreated(data.policy.id);
    } catch (error: any) {
      console.error('[PolicyCreationModal] Create policy error:', error);
      toast.error(error.message || 'Failed to create policy');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Payment Policy</DialogTitle>
          <DialogDescription>
            Define approval rules for payment escrows. Guardian addresses will be used to generate Merkle roots automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Policy Name */}
          <div>
            <Label htmlFor="policy-name">Policy Name *</Label>
            <Input
              id="policy-name"
              placeholder="e.g., Daily Expenses Policy"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={validationErrors.name ? 'border-destructive' : ''}
            />
            {validationErrors.name && (
              <div className="text-sm text-destructive mt-1">{validationErrors.name}</div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="policy-description">Description</Label>
            <Textarea
              id="policy-description"
              placeholder="Optional description of this policy's purpose"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Threshold and Timelock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="threshold">Required Approvals (Threshold) *</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                placeholder="1"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', e.target.value)}
                className={validationErrors.threshold ? 'border-destructive' : ''}
              />
              {validationErrors.threshold && (
                <div className="text-sm text-destructive mt-1">{validationErrors.threshold}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Number of guardian approvals needed
              </div>
            </div>

            <div>
              <Label htmlFor="timelock">Timelock (seconds)</Label>
              <Input
                id="timelock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.timelock}
                onChange={(e) => handleInputChange('timelock', e.target.value)}
                className={validationErrors.timelock ? 'border-destructive' : ''}
              />
              {validationErrors.timelock && (
                <div className="text-sm text-destructive mt-1">{validationErrors.timelock}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Delay before execution (0 for instant)
              </div>
            </div>
          </div>

          {/* Guardian Addresses */}
          <div>
            <Label>Guardian Addresses *</Label>
            <div className="space-y-2 mt-2">
              {guardianInputs.map((address, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C"
                    value={address}
                    onChange={(e) => handleGuardianAddressChange(index, e.target.value)}
                  />
                  {guardianInputs.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeGuardianInput(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addGuardianInput}>
                + Add Guardian
              </Button>
            </div>
            {validationErrors.guardianAddresses && (
              <div className="text-sm text-destructive mt-1">
                {validationErrors.guardianAddresses}
              </div>
            )}
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Valid guardian addresses: {formData.guardianAddresses.length}
              </AlertDescription>
            </Alert>
          </div>

          {/* Owner Addresses */}
          <div>
            <Label>Owner Addresses *</Label>
            <div className="space-y-2 mt-2">
              {ownerInputs.map((address, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C"
                    value={address}
                    onChange={(e) => handleOwnerAddressChange(index, e.target.value)}
                  />
                  {ownerInputs.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeOwnerInput(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOwnerInput}>
                + Add Owner
              </Button>
            </div>
            {validationErrors.ownerAddresses && (
              <div className="text-sm text-destructive mt-1">
                {validationErrors.ownerAddresses}
              </div>
            )}
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Valid owner addresses: {formData.ownerAddresses.length}
              </AlertDescription>
            </Alert>
          </div>

          {/* Max Amount */}
          <div>
            <Label htmlFor="max-amount">Max Amount (Optional)</Label>
            <Input
              id="max-amount"
              type="number"
              step="0.000001"
              placeholder="e.g., 1000 (in tokens)"
              value={formData.maxAmount}
              onChange={(e) => handleInputChange('maxAmount', e.target.value)}
              className={validationErrors.maxAmount ? 'border-destructive' : ''}
            />
            {validationErrors.maxAmount && (
              <div className="text-sm text-destructive mt-1">{validationErrors.maxAmount}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Maximum amount allowed per escrow (leave empty for no limit)
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm">
                <div className="font-medium mb-1">Automatic Merkle Root Generation</div>
                <div>
                  The system will automatically generate <code>rolesRoot</code> and{' '}
                  <code>ownersRoot</code> from the provided addresses for on-chain verification.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
