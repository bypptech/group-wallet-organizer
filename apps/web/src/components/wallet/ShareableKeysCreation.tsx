import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Key, Users, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { useVaults } from '@/hooks/useVaults';
import { useCreateShareableKeyAPI } from '@/hooks/useShareableKeysAPI';
import { useQueryClient } from '@tanstack/react-query';
import { UNIFIED_FORM_STYLES } from '@/styles/form-styles';

interface ShareableKeysCreationProps {
  onBack?: () => void;
  onComplete?: (keyId: string) => void;
}

export function ShareableKeysCreation({ onBack, onComplete }: ShareableKeysCreationProps) {
  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  // Form state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [keyName, setKeyName] = useState('');
  const [keyDescription, setKeyDescription] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [keyType, setKeyType] = useState<'vault' | 'escrow' | 'custom'>('vault');
  const [selectedVault, setSelectedVault] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [hasMaxUses, setHasMaxUses] = useState(false);

  // Fetch vaults from API
  const { vaults } = useVaults(userAddress);
  const createKeyMutation = useCreateShareableKeyAPI();

  // Transform vaults for display
  const availableVaults = vaults.map((vault) => ({
    id: vault.id,
    name: vault.name || 'Unnamed Vault',
    type: vault.metadata?.type === 'collection-group' ? 'collection' : 'team',
    address: vault.address,
  }));

  const validateStep1 = () => {
    if (!keyName.trim()) {
      toast({
        title: 'Key name required',
        description: 'Please enter a key name',
        variant: 'destructive',
      });
      return false;
    }

    if (!selectedDevice) {
      toast({
        title: 'Device required',
        description: 'Please select a device',
        variant: 'destructive',
      });
      return false;
    }

    if (!selectedVault) {
      toast({
        title: 'Vault required',
        description: 'Please select a vault',
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

  const handleCreateKey = async () => {
    if (!userAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a shareable key',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create shareable key via API
      const newKey = await createKeyMutation.mutateAsync({
        name: keyName,
        description: keyDescription || undefined,
        keyType: 'vault',
        vaultId: selectedVault,
        permissions: [], // Empty array - permissions feature not implemented
        expiresAt: hasExpiration ? expirationDate : undefined,
        maxUses: hasMaxUses ? parseInt(maxUses) : undefined,
        createdBy: userAddress,
        metadata: {
          device: selectedDevice, // device01, device02, or all
        },
      });

      toast({
        title: 'Key Created Successfully',
        description: `Shareable key "${keyName}" has been created`,
      });

      // Invalidate device access cache to reflect new permissions
      queryClient.invalidateQueries({ queryKey: ['deviceAccess'] });

      onComplete?.(newKey.id);
    } catch (error) {
      console.error('Failed to create shareable key:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create shareable key',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Create Share Key
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Grant secure access to your vault resources
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
              currentStep === 1
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {currentStep === 1 ? '1' : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <span className={`text-sm sm:text-base font-medium ${currentStep === 1 ? 'text-white' : 'text-muted-foreground'}`}>
              Key Info
            </span>
          </div>
          <div className="w-12 sm:w-16 h-0.5 bg-white/20"></div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
              currentStep === 2
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        {/* Form Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20">
                <Key className="h-6 w-6 text-amber-400" />
              </div>
              <span className="text-white text-lg sm:text-xl font-semibold">
                {currentStep === 1 ? 'Key Information' : 'Advanced Settings'}
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
                {/* Key Name */}
                <div className="space-y-2">
                  <Label htmlFor="keyName" className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-amber-400" />
                    Key Name *
                  </Label>
                  <Input
                    id="keyName"
                    placeholder="Festival Access Key"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="h-12 sm:h-14 text-base sm:text-lg border-2 border-white/20 focus:border-amber-400"
                  />
                  <p className="text-sm text-muted-foreground">
                    A descriptive name for this shareable key
                  </p>
                </div>

                {/* Device Selection */}
                <div className="space-y-2">
                  <Label htmlFor="device" className="text-white font-semibold text-base sm:text-lg">
                    Target Device *
                  </Label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg border-2 border-white/20 focus:border-amber-400">
                      <SelectValue placeholder="Select a device..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="device01">Device01</SelectItem>
                      <SelectItem value="device02" disabled>Device02</SelectItem>
                      <SelectItem value="all" disabled>All Devices</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Which device will use this key
                  </p>
                </div>

                {/* Vault Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vault" className="text-white font-semibold text-base sm:text-lg">
                    Select Vault *
                  </Label>
                  <Select value={selectedVault} onValueChange={setSelectedVault}>
                    <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg border-2 border-white/20 focus:border-amber-400">
                      <SelectValue placeholder="Choose a vault..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVaults.map((vault) => (
                        <SelectItem key={vault.id} value={vault.id}>
                          {vault.name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {vault.type}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Which vault this key will access
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="keyDescription" className="text-white font-semibold text-base sm:text-lg">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="keyDescription"
                    placeholder="Grant access to festival vault for viewing and requesting funds..."
                    value={keyDescription}
                    onChange={(e) => setKeyDescription(e.target.value)}
                    className="min-h-[100px] text-base resize-none border-2 border-white/20 focus:border-white/40"
                  />
                  <p className="text-sm text-muted-foreground">
                    Additional details about this key's purpose
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Advanced Settings */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                  <h3 className="text-white font-semibold text-lg sm:text-xl">Optional Settings</h3>
                </div>

                {/* Expiration */}
                <div className="p-5 rounded-lg glass space-y-4 border-2 border-white/10">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="has-expiration"
                      checked={hasExpiration}
                      onCheckedChange={(checked) => setHasExpiration(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="has-expiration" className="text-white font-semibold cursor-pointer text-base sm:text-lg">
                        Set Expiration Date
                      </Label>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Automatically revoke this key after a specific date
                      </p>
                    </div>
                  </div>
                  {hasExpiration && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-7 space-y-2"
                    >
                      <Label htmlFor="expiration-date" className="text-white font-semibold text-base">
                        Expiration Date
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="expiration-date"
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          className="h-11 sm:h-12 text-base border-2 border-white/20 focus:border-amber-400"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Max Uses */}
                <div className="p-5 rounded-lg glass space-y-4 border-2 border-white/10">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="has-max-uses"
                      checked={hasMaxUses}
                      onCheckedChange={(checked) => setHasMaxUses(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="has-max-uses" className="text-white font-semibold cursor-pointer text-base sm:text-lg">
                        Limit Number of Uses
                      </Label>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Automatically revoke this key after it has been used a certain number of times
                      </p>
                    </div>
                  </div>
                  {hasMaxUses && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-7 space-y-2"
                    >
                      <Label htmlFor="max-uses" className="text-white font-semibold text-base">
                        Maximum Uses
                      </Label>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <Input
                          id="max-uses"
                          type="number"
                          min="1"
                          placeholder="10"
                          value={maxUses}
                          onChange={(e) => setMaxUses(e.target.value)}
                          className="h-11 sm:h-12 text-base border-2 border-white/20 focus:border-amber-400 w-40"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm sm:text-base text-amber-200/80">
                    💡 Both settings are optional. If not set, the key will remain active indefinitely until manually revoked.
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
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={handleCreateKey}
                  disabled={createKeyMutation.isPending}
                >
                  {createKeyMutation.isPending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Key className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                      </motion.div>
                      Creating Key...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                      Create Share Key
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
