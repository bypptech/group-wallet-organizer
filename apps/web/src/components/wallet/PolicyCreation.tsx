import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import {
  Shield,
  ArrowLeft,
  Save,
  Users,
  Clock,
  DollarSign,
  HandCoins,
  Wallet,
} from 'lucide-react';
import type { PolicyType } from '@shared/types/policy';

type UserRole = 'requester' | 'guardian' | 'owner' | 'viewer';

interface PolicyCreationProps {
  currentRole: UserRole;
  onBack: () => void;
  onSave: (policyData: any) => void;
}

export function PolicyCreation({ currentRole, onBack, onSave }: PolicyCreationProps) {
  const canManage = currentRole === 'owner' || currentRole === 'guardian';

  const [policyType, setPolicyType] = useState<PolicyType>('payment');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Payment fields
    minApprovals: '2',
    maxAmount: '1000',
    cooldownHours: '24',
    // Collection fields
    allowPartialPayment: true,
    autoComplete: false,
    defaultDeadlineDays: '7',
    reminderEnabled: true,
    reminderDaysBefore: '3',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (policyType === 'payment') {
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
    } else {
      const defaultDeadline = parseInt(formData.defaultDeadlineDays);
      if (isNaN(defaultDeadline) || defaultDeadline < 1) {
        newErrors.defaultDeadlineDays = 'Default deadline must be at least 1 day';
      }

      if (formData.reminderEnabled) {
        const reminderDays = parseInt(formData.reminderDaysBefore);
        if (isNaN(reminderDays) || reminderDays < 1) {
          newErrors.reminderDaysBefore = 'Reminder days must be at least 1';
        }
        if (reminderDays >= defaultDeadline) {
          newErrors.reminderDaysBefore = 'Reminder days must be less than deadline';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (policyType === 'payment') {
      onSave({
        type: 'payment',
        name: formData.name,
        description: formData.description,
        threshold: parseInt(formData.minApprovals),
        timelock: parseInt(formData.cooldownHours) * 3600,
        maxAmount: formData.maxAmount,
      });
    } else {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(formData.defaultDeadlineDays));

      onSave({
        type: 'collection',
        name: formData.name,
        description: formData.description,
        collectionConfig: {
          allowPartialPayment: formData.allowPartialPayment,
          autoComplete: formData.autoComplete,
          defaultDeadline: deadlineDate.toISOString(),
          reminderSettings: {
            enabled: formData.reminderEnabled,
            daysBefore: parseInt(formData.reminderDaysBefore),
          },
        },
      });
    }
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
              You need Owner or Guardian role to create policies
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Create New Policy
          </h2>
          <p className="text-muted-foreground">
            Select policy type and define rules
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
              <CardDescription>
                Select policy type and configure the rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Policy Type Selector */}
              <Tabs value={policyType} onValueChange={(v) => setPolicyType(v as PolicyType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payment" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment Policy
                  </TabsTrigger>
                  <TabsTrigger value="collection" className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4" />
                    Collection Policy
                  </TabsTrigger>
                </TabsList>

                {/* Common Fields */}
                <div className="space-y-4 mt-6">
                  {/* Policy Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Policy Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={policyType === 'payment' ? 'e.g., Standard Payment Policy' : 'e.g., Monthly Dues Collection'}
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
                      placeholder={policyType === 'payment' ? 'Describe when this payment policy should be used...' : 'Describe what this collection is for...'}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500">{errors.description}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Payment Policy Settings */}
                <TabsContent value="payment" className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Payment Rules</h3>

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
                </TabsContent>

                {/* Collection Policy Settings */}
                <TabsContent value="collection" className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Collection Settings</h3>

                  {/* Allow Partial Payment */}
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowPartialPayment">Allow Partial Payment</Label>
                      <p className="text-xs text-muted-foreground">
                        Members can pay their share in multiple installments
                      </p>
                    </div>
                    <Switch
                      id="allowPartialPayment"
                      checked={formData.allowPartialPayment}
                      onCheckedChange={(checked) => handleChange('allowPartialPayment', checked)}
                    />
                  </div>

                  {/* Auto Complete */}
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoComplete">Auto Complete</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically complete collection when full amount is received
                      </p>
                    </div>
                    <Switch
                      id="autoComplete"
                      checked={formData.autoComplete}
                      onCheckedChange={(checked) => handleChange('autoComplete', checked)}
                    />
                  </div>

                  {/* Default Deadline */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultDeadlineDays" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Default Deadline (Days)
                    </Label>
                    <Input
                      id="defaultDeadlineDays"
                      type="number"
                      min="1"
                      placeholder="7"
                      value={formData.defaultDeadlineDays}
                      onChange={(e) => handleChange('defaultDeadlineDays', e.target.value)}
                      className={errors.defaultDeadlineDays ? 'border-red-500' : ''}
                    />
                    {errors.defaultDeadlineDays && (
                      <p className="text-xs text-red-500">{errors.defaultDeadlineDays}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Default number of days for payment deadline
                    </p>
                  </div>

                  <Separator />

                  {/* Reminder Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="reminderEnabled">Enable Reminders</Label>
                        <p className="text-xs text-muted-foreground">
                          Send automatic payment reminders to participants
                        </p>
                      </div>
                      <Switch
                        id="reminderEnabled"
                        checked={formData.reminderEnabled}
                        onCheckedChange={(checked) => handleChange('reminderEnabled', checked)}
                      />
                    </div>

                    {formData.reminderEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="reminderDaysBefore">
                          Send Reminder (Days Before Deadline)
                        </Label>
                        <Input
                          id="reminderDaysBefore"
                          type="number"
                          min="1"
                          placeholder="3"
                          value={formData.reminderDaysBefore}
                          onChange={(e) => handleChange('reminderDaysBefore', e.target.value)}
                          className={errors.reminderDaysBefore ? 'border-red-500' : ''}
                        />
                        {errors.reminderDaysBefore && (
                          <p className="text-xs text-red-500">{errors.reminderDaysBefore}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Reminder will be sent this many days before the deadline
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  className="gradient-primary text-white hover-glow flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create {policyType === 'payment' ? 'Payment' : 'Collection'} Policy
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
              <p className="font-medium mb-2">
                {policyType === 'payment' ? 'Payment Policy' : 'Collection Policy'} Guidelines
              </p>
              {policyType === 'payment' ? (
                <ul className="text-xs space-y-1">
                  <li>• Policies define rules for outgoing payments</li>
                  <li>• Higher approvals = more security, less convenience</li>
                  <li>• Max amount limits prevent unauthorized large transfers</li>
                  <li>• Cooldown period adds extra security for large payments</li>
                </ul>
              ) : (
                <ul className="text-xs space-y-1">
                  <li>• Policies define rules for collecting funds</li>
                  <li>• Partial payments allow flexible contribution schedules</li>
                  <li>• Auto-complete simplifies collection management</li>
                  <li>• Reminders help ensure timely contributions</li>
                </ul>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
