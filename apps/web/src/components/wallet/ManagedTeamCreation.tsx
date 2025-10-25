import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import type { Address } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useCreateCollection } from '@/hooks/useCollections';
import { useAccount } from 'wagmi';
import { useCreateVault } from '@/hooks/useVaults';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Coins,
  AlertCircle,
  Crown
} from 'lucide-react';
import { UNIFIED_FORM_STYLES } from '@/styles/form-styles';

interface ManagedTeamCreationProps {
  onTeamCreated?: (vaultId: string, collectionId: string) => void;
  onCancel?: () => void;
}

interface ParticipantInput {
  address?: string;
  name: string;
  allocatedAmount: string;
  inviteToken?: string;
}

export function ManagedTeamCreation({ onTeamCreated, onCancel }: ManagedTeamCreationProps) {
  // Form step management
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Team/Vault Info
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [requiredWeight, setRequiredWeight] = useState('1');

  // Collection Info
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [token, setToken] = useState<Address>('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'); // USDC default
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: '', allocatedAmount: '' }
  ]);

  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const { mutate: createVault, isPending: isCreatingVault } = useCreateVault();
  const { mutate: createCollection, isPending: isCreatingCollection } = useCreateCollection();

  const [creationStep, setCreationStep] = useState<'idle' | 'creating-vault' | 'creating-collection' | 'completed'>('idle');

  const addParticipant = () => {
    setParticipants([...participants, { name: '', allocatedAmount: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof ParticipantInput, value: string) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const calculateTotalAmount = () => {
    return participants.reduce((sum, p) => {
      const amount = parseFloat(p.allocatedAmount || '0');
      return sum + amount;
    }, 0);
  };

  const validateStep1 = () => {
    if (!teamName.trim()) {
      toast({
        title: 'Team name required',
        description: 'Please enter a team name',
        variant: 'destructive',
      });
      return false;
    }

    if (!collectionName.trim()) {
      toast({
        title: 'Collection name required',
        description: 'Please enter a collection name',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!userAddress) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    const validParticipants = participants.filter(p =>
      p.name.trim() && p.allocatedAmount && parseFloat(p.allocatedAmount) > 0
    );

    if (validParticipants.length === 0) {
      toast({
        title: 'Add members',
        description: 'Please add at least one member with name and amount',
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

  const handleCreateManagedTeam = async () => {
    if (!validateStep2() || !userAddress) {
      return;
    }

    setCreationStep('creating-vault');

    // Generate a unique vault address for the managed team
    const newVaultAddress = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}` as Address;

    // Step 1: Create Collection Group (Vault)
    createVault(
      {
        name: teamName,
        description: teamDescription,
        address: newVaultAddress,
        creatorAddress: userAddress,
        requiredWeight: parseInt(requiredWeight),
        metadata: {
          type: 'collection-group',
          createdFor: 'leader-lockn-pay',
        },
      },
      {
        onSuccess: (createdVault) => {
          console.log('[ManagedTeamCreation] Vault created:', createdVault);
          setCreationStep('creating-collection');

          // Step 2: Create initial Collection
          const validParticipants = participants
            .filter(p => p.name.trim() && p.allocatedAmount && parseFloat(p.allocatedAmount) > 0)
            .map(p => ({
              address: p.address as Address | undefined,
              name: p.name,
              allocatedAmount: (BigInt(Math.floor(parseFloat(p.allocatedAmount) * 1_000_000))).toString(),
            }));

          createCollection(
            {
              vaultId: createdVault.id,
              vaultAddress: createdVault.address as Address,
              name: collectionName,
              description: collectionDescription,
              token,
              deadline: deadline ? new Date(deadline).toISOString() : undefined,
              participants: validParticipants,
              createdBy: userAddress,
              note,
            },
            {
              onSuccess: (collection) => {
                setCreationStep('completed');

                toast({
                  title: 'Managed Team created successfully!',
                  description: `${teamName} has been created with the first collection: ${collectionName}`,
                });

                if (onTeamCreated) {
                  onTeamCreated(createdVault.id, collection.id);
                }
              },
              onError: (error) => {
                setCreationStep('idle');
                toast({
                  title: 'Failed to create collection',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            }
          );
        },
        onError: (error) => {
          setCreationStep('idle');
          toast({
            title: 'Failed to create managed team',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const isCreating = creationStep !== 'idle' && creationStep !== 'completed';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Create Payment Collection
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mt-2">
          Set up a team and collect payments from members for expenses you've covered
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto"
      >
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
              Members
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        {/* Form Card */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-indigo-500/20">
                <Crown className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-white">
                {currentStep === 1 ? 'Step 1: Basic Information' : 'Step 2: Members to Collect From'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            {currentStep === 1 && (
              <>
                {/* Team & Collection Names */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="teamName" className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                      Team Name *
                    </Label>
                    <Input
                      id="teamName"
                      placeholder="Music Festival Squad"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="h-12 sm:h-14 text-base sm:text-lg border-2 border-white/20 focus:border-purple-400"
                    />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Group members who owe you money
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="collectionName" className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                      Collection Name *
                    </Label>
                    <Input
                      id="collectionName"
                      placeholder="Summer Music Festival 2025"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      className="h-12 sm:h-14 text-base sm:text-lg border-2 border-white/20 focus:border-cyan-400"
                    />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      What expense did you pay for?
                    </p>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="teamDescription" className="text-base font-semibold text-white">
                      Team Description (Optional)
                    </Label>
                    <Textarea
                      id="teamDescription"
                      placeholder="Friends who share expenses for events and activities..."
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      className="min-h-[100px] text-base resize-none border-2 border-white/20 focus:border-white/40"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="collectionDescription" className="text-base font-semibold text-white">
                      Collection Description (Optional)
                    </Label>
                    <Textarea
                      id="collectionDescription"
                      placeholder="I paid for festival tickets, camping gear, and transportation. Please reimburse your share..."
                      value={collectionDescription}
                      onChange={(e) => setCollectionDescription(e.target.value)}
                      className="min-h-[100px] text-base resize-none border-2 border-white/20 focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Collection Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="token" className="text-base font-semibold text-white">Token</Label>
                    <Input
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value as Address)}
                      className="h-12 text-base border-2 border-white/20 focus:border-white/40"
                      placeholder="0x..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Default: USDC (Sepolia)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="deadline" className="text-base font-semibold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Deadline (Optional)
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="h-12 text-base border-2 border-white/20 focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-3">
                  <Label htmlFor="note" className="text-base font-semibold text-white">
                    Payment Request Note (Optional)
                  </Label>
                  <Input
                    id="note"
                    placeholder="Please reimburse by next Friday"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-12 text-base border-2 border-white/20 focus:border-white/40"
                  />
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>

                {/* Participants */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <Label className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                        Members to Collect From *
                      </Label>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Add each person who owes you money and their share
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="glass border-purple-500/50 h-11 sm:h-12 text-base shrink-0"
                      onClick={addParticipant}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Member
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {participants.map((participant, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-4 sm:p-6 rounded-xl border border-white/10"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5 space-y-2">
                            <Label className="text-sm sm:text-base font-medium text-white">Name *</Label>
                            <Input
                              placeholder="John"
                              value={participant.name}
                              onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                              className="h-11 sm:h-12 text-base border-2 border-white/20 focus:border-purple-400"
                            />
                          </div>

                          <div className="md:col-span-5 space-y-2">
                            <Label className="text-sm sm:text-base font-medium text-white">
                              Wallet Address (Optional)
                            </Label>
                            <Input
                              placeholder="0x... or leave blank"
                              value={participant.address || ''}
                              onChange={(e) => updateParticipant(index, 'address', e.target.value)}
                              className="h-11 sm:h-12 text-sm sm:text-base font-mono border-2 border-white/20 focus:border-white/40"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm sm:text-base font-medium text-white">Amount (USDC) *</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="100"
                                value={participant.allocatedAmount}
                                onChange={(e) => updateParticipant(index, 'allocatedAmount', e.target.value)}
                                className="h-11 sm:h-12 text-base font-semibold border-2 border-white/20 focus:border-cyan-400"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-11 sm:h-12 w-11 sm:w-12 shrink-0"
                                onClick={() => removeParticipant(index)}
                                disabled={participants.length === 1}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Total Amount Summary */}
                <div className="glass p-5 sm:p-6 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <Coins className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-white text-base sm:text-lg font-semibold">Total Amount to Collect</h4>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          From {participants.filter(p => p.allocatedAmount).length} member{participants.filter(p => p.allocatedAmount).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-mono text-3xl sm:text-4xl font-bold text-cyan-400">
                        {calculateTotalAmount().toFixed(2)}
                      </p>
                      <p className="text-sm sm:text-base text-muted-foreground font-semibold">USDC</p>
                    </div>
                  </div>
                </div>

                {/* Info Message */}
                <div className="glass p-4 sm:p-5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm sm:text-base text-blue-200 leading-relaxed">
                        As the team leader, you'll be able to track payment status from each member and send payment requests. You can create additional collections for future expenses.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 mt-6">
          {currentStep === 2 && (
            <Button
              variant="outline"
              className="glass border-white/20 h-12 sm:h-14 text-base px-6"
              onClick={handlePreviousStep}
              disabled={isCreating}
            >
              Back
            </Button>
          )}
          {currentStep === 1 && onCancel && (
            <Button
              variant="outline"
              className="glass border-white/20 h-12 sm:h-14 text-base px-6"
              onClick={onCancel}
              disabled={isCreating}
            >
              Cancel
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
              onClick={handleCreateManagedTeam}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 mr-2 animate-spin" />
                  {creationStep === 'creating-vault' ? 'Creating Team...' : 'Creating Collection...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  Create Payment Collection
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
