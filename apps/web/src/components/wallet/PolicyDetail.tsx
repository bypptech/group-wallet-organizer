import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import {
  Shield,
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react';
import { VaultIdentifierDisplay } from './VaultIdentifierDisplay';

type UserRole = 'requester' | 'guardian' | 'owner' | 'viewer';

interface PolicyDetailProps {
  currentRole: UserRole;
  policyId: string; // Policy ID is required for editing
  onBack: () => void;
  onSave: (policyData: any) => void;
}

export function PolicyDetail({ currentRole, policyId, onBack, onSave }: PolicyDetailProps) {
  const canManage = currentRole === 'owner' || currentRole === 'guardian';

  // Mock existing policy data
  const existingPolicy = {
    id: policyId,
    name: 'Standard Family Policy',
    description: 'Default policy for regular family expenses',
    minApprovals: 2,
    maxAmount: '1000',
    cooldownHours: 24,
    status: 'active',
  };

  const [formData, setFormData] = useState({
    name: existingPolicy.name,
    description: existingPolicy.description,
    minApprovals: existingPolicy.minApprovals.toString(),
    maxAmount: existingPolicy.maxAmount,
    cooldownHours: existingPolicy.cooldownHours.toString(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Policy name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const minApprovals = parseInt(formData.minApprovals);
    if (isNaN(minApprovals) || minApprovals < 1) {
      newErrors.minApprovals = 'Minimum approvals must be at least 1';
    }

    const maxAmount = parseFloat(formData.maxAmount);
    if (isNaN(maxAmount) || maxAmount <= 0) {
      newErrors.maxAmount = 'Maximum amount must be greater than 0';
    }

    const cooldown = parseInt(formData.cooldownHours);
    if (isNaN(cooldown) || cooldown < 0) {
      newErrors.cooldownHours = 'Cooldown must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSave({
      ...formData,
      id: policyId,
      minApprovals: parseInt(formData.minApprovals),
      maxAmount: parseFloat(formData.maxAmount),
      cooldownHours: parseInt(formData.cooldownHours),
    });
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <Card className="glass border-white/10">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Access Denied
            </h3>
            <p className="text-muted-foreground mb-6">
              You need Owner or Guardian role to manage policies
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Edit Policy
            </h2>
            <p className="text-muted-foreground">
              Editing: {existingPolicy.name}
            </p>
          </div>
        </div>
        <Badge variant={existingPolicy.status === 'active' ? 'default' : 'secondary'}>
          {existingPolicy.status === 'active' ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <AlertTriangle className="h-3 w-3 mr-1" />
          )}
          {existingPolicy.status}
        </Badge>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
              <CardDescription>
                Configure the approval rules and constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Policy Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Policy Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard Family Policy"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe when this policy should be used..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              <Separator />

              {/* Approval Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Approval Rules</h3>

                {/* Min Approvals */}
                <div className="space-y-2">
                  <Label htmlFor="minApprovals" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Minimum Approvals Required
                  </Label>
                  <Input
                    id="minApprovals"
                    type="number"
                    min="1"
                    placeholder="2"
                    value={formData.minApprovals}
                    onChange={(e) => handleChange('minApprovals', e.target.value)}
                    className={errors.minApprovals ? 'border-red-500' : ''}
                  />
                  {errors.minApprovals && (
                    <p className="text-xs text-red-500">{errors.minApprovals}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Number of approvers needed before transaction can be executed
                  </p>
                </div>

                {/* Max Amount */}
                <div className="space-y-2">
                  <Label htmlFor="maxAmount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Maximum Transaction Amount (USDC)
                  </Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                    value={formData.maxAmount}
                    onChange={(e) => handleChange('maxAmount', e.target.value)}
                    className={errors.maxAmount ? 'border-red-500' : ''}
                  />
                  {errors.maxAmount && (
                    <p className="text-xs text-red-500">{errors.maxAmount}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum amount allowed per transaction under this policy
                  </p>
                </div>

                {/* Cooldown Period */}
                <div className="space-y-2">
                  <Label htmlFor="cooldownHours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Cooldown Period (Hours)
                  </Label>
                  <Input
                    id="cooldownHours"
                    type="number"
                    min="0"
                    placeholder="24"
                    value={formData.cooldownHours}
                    onChange={(e) => handleChange('cooldownHours', e.target.value)}
                    className={errors.cooldownHours ? 'border-red-500' : ''}
                  />
                  {errors.cooldownHours && (
                    <p className="text-xs text-red-500">{errors.cooldownHours}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Waiting time after approval before transaction can be executed (0 for immediate)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  className="gradient-primary text-white hover-glow flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Policy Guidelines</p>
              <ul className="text-xs space-y-1">
                <li>• Policies can be assigned to multiple groups</li>
                <li>• Changes take effect immediately for new transactions</li>
                <li>• Active transactions use the policy at creation time</li>
                <li>• Consider security vs convenience trade-offs</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm">Policy Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used by groups:</span>
                <span className="text-white font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-white">2024-01-15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated:</span>
                <span className="text-white">2024-12-01</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
