import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import type { Address } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useCreateVault } from '@/hooks/useVaults';
import { useAccount } from 'wagmi';
import {
  Users,
  Settings,
  CheckCircle2,
  Crown,
  RefreshCw,
  Shield,
  Clock,
  Zap
} from 'lucide-react';

interface GroupCreationProps {
  currentRole?: string;
  vaultId?: string;
  onGroupCreated?: (vaultId: string, vaultData?: any) => void;
  mode?: 'team' | 'collection';
  title?: string;
  description?: string;
  showMemberInvite?: boolean;
  showAdvancedSettings?: boolean;
}

export function GroupCreation({
  currentRole = 'owner',
  vaultId,
  onGroupCreated,
  mode = 'team',
  title: customTitle,
  description: customDescription,
  showMemberInvite = true,
  showAdvancedSettings = true
}: GroupCreationProps) {
  console.log('[GroupCreation] Rendering GroupCreation component with mode:', mode);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [requiredWeight, setRequiredWeight] = useState(3);
  const [timelock, setTimelock] = useState(0);
  const [autoApprove, setAutoApprove] = useState(false);
  const [paymasterEnabled, setPaymasterEnabled] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();
  const { address: userAddress } = useAccount();

  // Create vault mutation
  const { mutate: createVault, isPending: isCreating } = useCreateVault();

  // Mode-specific configuration
  const pageTitle = customTitle || (mode === 'collection' ? 'Create Collection Group' : 'Create New Team');
  const pageDescription = customDescription || (mode === 'collection'
    ? 'Create a group for managing collections and payments'
    : 'Create a new team for collaborative asset management');

  const validateStep1 = () => {
    if (!groupName.trim()) {
      toast({
        title: 'Team name required',
        description: 'Please enter a team name',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleCreateGroup = () => {
    if (!userAddress) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create a group',
        variant: 'destructive',
      });
      return;
    }

    // Generate a unique vault address (in production, this would come from a smart contract)
    const newVaultAddress = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}` as Address;

    createVault(
      {
        name: groupName,
        description: groupDescription || (mode === 'collection'
          ? `Collection group managed by ${userAddress}`
          : 'Vault Team for shared asset management'),
        address: newVaultAddress,
        creatorAddress: userAddress,
        // Only include requiredWeight for Team Pay (non-collection mode)
        ...(mode !== 'collection' && { requiredWeight }),
        timelock: timelock,
        settings: {
          autoApprove,
          paymasterEnabled,
          webhooksEnabled: false,
          notificationsEnabled: true,
        },
        metadata: mode === 'collection' ? {
          type: 'collection-group',
          createdFor: 'leader-lockn-pay',
        } : undefined,
        // Add creator as owner in members array
        members: [
          {
            address: userAddress,
            role: 'owner',
            weight: 3,
            joinedAt: new Date().toISOString(),
          }
        ],
      },
      {
        onSuccess: (createdVault) => {
          console.log('[GroupCreation] onSuccess called, vault:', createdVault);
          setIsSubmitted(true); // Mark as submitted to prevent double-click

          // Navigate to My Groups list FIRST - before showing toast
          console.log('[GroupCreation] About to call onGroupCreated, callback exists?', !!onGroupCreated);
          if (onGroupCreated && createdVault.id) {
            console.log('[GroupCreation] Calling onGroupCreated with vaultId:', createdVault.id);
            // Pass both vault ID and the full vault data including metadata
            onGroupCreated(createdVault.id, {
              ...createdVault,
              metadata: {
                ...createdVault.metadata,
                // Only include requiredWeight for Team Pay (non-collection mode)
                ...(mode !== 'collection' && { requiredWeight }),
                timelock,
              }
            });
            console.log('[GroupCreation] onGroupCreated called successfully');
          } else {
            console.log('[GroupCreation] onGroupCreated callback is missing or vault.id is undefined');
          }

          // Show success toast after navigation
          toast({
            title: 'Group created successfully',
            description: `You are now the Owner of ${groupName}`,
          });
        },
        onError: (error) => {
          toast({
            title: 'Failed to create group',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          {pageTitle}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          {pageDescription}
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
              currentStep === 1
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {currentStep === 1 ? '1' : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <span className={`text-sm sm:text-base font-medium ${currentStep === 1 ? 'text-white' : 'text-muted-foreground'}`}>
              Basic Info
            </span>
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-white/20"></div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
              currentStep === 2
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                : 'bg-white/10 text-white/40'
            }`}>
              2
            </div>
            <span className={`text-sm sm:text-base font-medium ${currentStep === 2 ? 'text-white' : 'text-muted-foreground'}`}>
              Settings
            </span>
          </div>
        </div>
      </motion.div>

      {/* Single Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="glass-card max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-white text-lg sm:text-xl font-semibold">
                {currentStep === 1 ? 'Team Information' : 'Team Settings'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-white font-semibold text-base sm:text-lg">
                    Team Name *
                  </Label>
                  <Input
                    id="groupName"
                    placeholder="Smith Family Vault"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-12 sm:h-14 text-base sm:text-lg border-2 border-white/20 focus:border-purple-400"
                  />
                  <p className="text-sm text-muted-foreground">
                    A descriptive name for your team
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white font-semibold text-base sm:text-lg">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={mode === 'collection'
                      ? "Describe the purpose of this collection group"
                      : "Team vault for managing shared assets and expenses"}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="min-h-[120px] text-base resize-none border-2 border-white/20 focus:border-white/40"
                  />
                  <p className="text-sm text-muted-foreground">
                    Add details about the purpose of this team
                  </p>
                </div>

                {/* Creator Info */}
                <div className="p-4 rounded-lg glass border-2 border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-base">Your Role: Owner</h4>
                      <p className="text-sm text-muted-foreground">
                        You will be automatically assigned as the Owner
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      As Owner, you have full administrative privileges including member management and team settings
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Advanced Settings */}
            {showAdvancedSettings && currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                  <h3 className="text-white font-semibold text-lg sm:text-xl">Configuration</h3>
                </div>

                {/* Required Weight - Only for Team Pay */}
                {mode !== 'collection' && (
                  <div className="space-y-2">
                    <Label htmlFor="requiredWeight" className="text-white font-semibold text-base sm:text-lg">
                      Required Weight Threshold
                    </Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <Input
                        id="requiredWeight"
                        type="number"
                        min="1"
                        max="10"
                        value={requiredWeight}
                        onChange={(e) => setRequiredWeight(parseInt(e.target.value) || 1)}
                        className="h-11 sm:h-12 text-base border-2 border-white/20 focus:border-purple-400 w-32"
                      />
                      <span className="text-sm sm:text-base text-muted-foreground">
                        Total weight needed for approval
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Transactions require this combined weight from members to be approved
                    </p>
                  </div>
                )}

                {/* Timelock */}
                <div className="space-y-2">
                  <Label htmlFor="timelock" className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Timelock (seconds)
                  </Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Input
                      id="timelock"
                      type="number"
                      min="0"
                      max="604800"
                      value={timelock}
                      onChange={(e) => setTimelock(parseInt(e.target.value) || 0)}
                      className="h-11 sm:h-12 text-base border-2 border-white/20 focus:border-cyan-400 w-40"
                    />
                    <span className="text-sm sm:text-base text-muted-foreground">
                      Delay before execution
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    0 = no delay, 86400 = 1 day, 604800 = 1 week
                  </p>
                </div>

                {/* Policy Settings */}
                <div className="p-5 rounded-lg glass space-y-4 border-2 border-white/10">
                  <h4 className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-400" />
                    Policy Settings
                  </h4>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex-1">
                      <span className="text-sm sm:text-base text-white font-medium">Enable Paymaster</span>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Cover gas fees for members (requires setup)
                      </p>
                    </div>
                    <Switch
                      checked={paymasterEnabled}
                      onCheckedChange={setPaymasterEnabled}
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm sm:text-base text-blue-200/80">
                    💡 These settings define how transactions are approved and executed in your team
                  </p>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-white/10 flex gap-4">
              {currentStep === 2 && (
                <Button
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold border-white/20 hover:bg-white/10"
                  onClick={handlePreviousStep}
                >
                  ← Back
                </Button>
              )}

              {currentStep === 1 ? (
                <Button
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  onClick={handleNextStep}
                >
                  Next Step
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.div>
                </Button>
              ) : (
                <Button
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || isCreating || isSubmitted}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 mr-2 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                      Create Team
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
