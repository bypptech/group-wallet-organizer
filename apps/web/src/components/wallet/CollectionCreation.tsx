import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Address } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useCreateEscrowAPI } from '@/hooks/useEscrowsAPI';
import { usePoliciesAPI } from '@/hooks/usePoliciesAPI';
import { useAccount } from 'wagmi';
import { useVault } from '@/hooks/useVaults';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Coins,
  AlertCircle,
  Shield
} from 'lucide-react';

interface CollectionCreationProps {
  vaultId: string;
  onCollectionCreated?: (collectionId: string) => void;
}

interface ParticipantInput {
  address?: string;
  name: string;
  allocatedAmount: string;
  inviteToken?: string; // Token for invitation URL
}

export function CollectionCreation({ vaultId, onCollectionCreated }: CollectionCreationProps) {
  // Fetch vault data to get the vault address
  const { vault, isLoading: vaultLoading } = useVault(vaultId);
  const vaultAddress = vault?.address as Address | undefined;

  // Debug logging
  console.log('[CollectionCreation] Component mounted with props:', {
    vaultId,
    vaultIdType: typeof vaultId,
    vaultIdLength: vaultId?.length,
    vaultAddress,
    vaultLoading,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [token, setToken] = useState<Address>('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'); // USDC default
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: '', allocatedAmount: '' }
  ]);

  const { toast } = useToast();
  const { address: userAddress } = useAccount();
  const { mutate: createEscrow, isPending: isCreating } = useCreateEscrowAPI();
  
  // Fetch Collection Policies
  const { data: policiesData, isLoading: isPoliciesLoading } = usePoliciesAPI({
    vaultId,
    type: 'collection',
    active: true,
  });

  const policies = policiesData?.policies || [];

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

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: 'Collection name required',
        description: 'Please enter a collection name',
        variant: 'destructive',
      });
      return false;
    }

    if (!selectedPolicyId) {
      toast({
        title: 'Policy required',
        description: 'Please select a collection policy',
        variant: 'destructive',
      });
      return false;
    }

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
        title: 'Add participants',
        description: 'Please add at least one participant with name and amount',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleCreateCollection = () => {
    if (!validateForm() || !userAddress || !vaultAddress) {
      if (!vaultAddress) {
        toast({
          title: 'Vault address not available',
          description: 'Please wait for vault data to load',
          variant: 'destructive',
        });
      }
      return;
    }

    const validParticipants = participants
      .filter(p => p.name.trim() && p.allocatedAmount && parseFloat(p.allocatedAmount) > 0)
      .map(p => ({
        address: p.address as Address | undefined,
        name: p.name,
        // Convert to wei (assuming input is in token units, USDC has 6 decimals)
        allocatedAmount: (BigInt(Math.floor(parseFloat(p.allocatedAmount) * 1_000_000))).toString(),
      }));

    const totalAmount = validParticipants.reduce((sum, p) => {
      return sum + BigInt(p.allocatedAmount);
    }, 0n).toString();

    createEscrow(
      {
        type: 'collection',
        vaultId,
        policyId: selectedPolicyId,
        name,
        description: description || undefined,
        token,
        totalAmount,
        participants: validParticipants,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        metadata: note ? { note } : undefined,
      },
      {
        onSuccess: (escrow) => {
          toast({
            title: 'Collection created successfully',
            description: `${name} has been created with ${validParticipants.length} participants`,
          });

          if (onCollectionCreated) {
            onCollectionCreated(escrow.id);
          }

          // Reset form
          setName('');
          setDescription('');
          setSelectedPolicyId('');
          setDeadline('');
          setNote('');
          setParticipants([{ address: '', name: '', allocatedAmount: '' }]);
        },
        onError: (error) => {
          toast({
            title: 'Failed to create collection',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Create New Collection
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage shared payments and track contributions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
      <Card className="glass-card max-w-4xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
            </div>
            <span className="text-white text-base sm:text-lg font-semibold">Collection Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Policy Selector */}
          <div>
            <Label htmlFor="policy" className="text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Collection Policy *
            </Label>
            <Select
              value={selectedPolicyId}
              onValueChange={setSelectedPolicyId}
              disabled={isPoliciesLoading}
            >
              <SelectTrigger className="glass border-white/20 text-white mt-2">
                <SelectValue placeholder={isPoliciesLoading ? "Loading policies..." : "Select a collection policy..."} />
              </SelectTrigger>
              <SelectContent>
                {policies.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No collection policies available
                  </SelectItem>
                ) : (
                  policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.name}
                      {policy.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {policy.description}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Collection policies define rules like partial payments, auto-completion, and reminders
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="name" className="text-white text-sm sm:text-base">Collection Name *</Label>
              <Input
                id="name"
                placeholder="Family Trip to Okinawa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="token" className="text-white text-sm sm:text-base">Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value as Address)}
                className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
                placeholder="0x..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: USDC (Sepolia)
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white text-sm sm:text-base">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Collecting funds for our family trip..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
              rows={2}
            />
          </div>

          {/* Deadline and Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="deadline" className="text-white flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Payment Deadline (Optional)</span>
                <span className="sm:hidden">Deadline (Optional)</span>
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="note" className="text-white text-sm sm:text-base">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="Please pay by next Friday"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <Label className="text-white flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Participants *
              </Label>
              <Button
                size="sm"
                variant="outline"
                className="glass border-purple-500/50 text-xs sm:text-sm w-full sm:w-auto"
                onClick={addParticipant}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Add Participant
              </Button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {participants.map((participant, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-3 sm:p-4 rounded-lg border border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-end">
                    <div className="md:col-span-4">
                      <Label className="text-white text-xs">Name *</Label>
                      <Input
                        placeholder="Alice"
                        value={participant.name}
                        onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                        className="glass border-white/20 text-white text-xs sm:text-sm"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label className="text-white text-xs">Wallet Address (Optional)</Label>
                      <Input
                        placeholder="0x... or leave blank to send invite"
                        value={participant.address || ''}
                        onChange={(e) => updateParticipant(index, 'address', e.target.value)}
                        className="glass border-white/20 text-white text-xs sm:text-sm"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label className="text-white text-xs">Amount (USDC) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={participant.allocatedAmount}
                        onChange={(e) => updateParticipant(index, 'allocatedAmount', e.target.value)}
                        className="glass border-white/20 text-white text-xs sm:text-sm"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full md:w-auto"
                        onClick={() => removeParticipant(index)}
                        disabled={participants.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Total Amount Summary */}
          <div className="glass p-3 sm:p-4 rounded-lg border border-cyan-500/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shrink-0">
                  <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-white text-base sm:text-lg font-semibold">Total Collection Amount</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {participants.filter(p => p.allocatedAmount).length} participants
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="font-mono text-xl sm:text-2xl font-bold text-cyan-400">
                  {calculateTotalAmount().toFixed(2)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">USDC</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="glass p-2.5 sm:p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-yellow-200">
                  Participants will need to send payments to the vault address. Make sure all addresses are correct.
                </p>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex gap-3 sm:gap-4">
            <Button
              className="flex-1 gradient-primary text-white hover-glow text-sm sm:text-base"
              onClick={handleCreateCollection}
              disabled={!name.trim() || !selectedPolicyId || isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Create Collection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}