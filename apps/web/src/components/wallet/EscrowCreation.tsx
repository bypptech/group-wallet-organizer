import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Coins,
  Calendar,
  Target,
  FileText,
  Copy,
  XCircle,
  Clock,
  Loader2,
  CreditCard,
  Plus
} from 'lucide-react';
import { VaultIdentifierDisplay } from './VaultIdentifierDisplay';
import { PolicyCreationModal } from './PolicyCreationModal';
import { Step2Policy } from './EscrowCreation_Step2_Policy';
import { Step4Paymaster } from './EscrowCreation_Step4_Paymaster';
import { useCreateEscrowAPI } from '../../hooks/useEscrowsAPI';
import { usePoliciesAPI } from '../../hooks/usePoliciesAPI';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { UNIFIED_FORM_STYLES } from '@/styles/form-styles';

interface EscrowCreationProps {
  vaultId: string;
  defaultPolicyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EscrowCreation({ vaultId, defaultPolicyId, onSuccess, onCancel }: EscrowCreationProps) {
  const { address: walletAddress } = useAccount();
  const { mutate: createEscrow, isPending: isCreating } = useCreateEscrowAPI();

  // Fetch policies for this vault
  const { data: policiesData, isLoading: isPoliciesLoading, refetch: refetchPolicies } = usePoliciesAPI({
    vaultId,
    type: 'payment',
    // Note: Removed 'active: true' filter to show all payment policies
    // TODO: Re-enable active filter once policy activation is implemented
  });

  // Debug: Log policies data
  console.log('[EscrowCreation] Policies loaded:', {
    vaultId,
    isLoading: isPoliciesLoading,
    policiesCount: policiesData?.policies?.length || 0,
    policies: policiesData?.policies,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [paymasterCheckState, setPaymasterCheckState] = useState<'unchecked' | 'checking' | 'success' | 'daily_limit' | 'insufficient_balance' | 'failed'>('success'); // Default to success (gas sponsorship enabled)
  const [gasFallbackSelected, setGasFallbackSelected] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  
  // Token addresses for Base Sepolia
  const SUPPORTED_TOKENS = {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    USDT: '0x0Fd5C3F9B5a3d9eC6dbD6AC28ee4D7cc51E55F2a', // Base Sepolia USDT (example)
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    token: SUPPORTED_TOKENS.USDC, // Fixed to USDC
    recipient: '',
    deadline: '',
    policyId: defaultPolicyId || ''
  });

  const steps = [
    { id: 1, title: 'Payment Details', description: 'Overview, amount, recipient & gas' },
    { id: 2, title: 'Policy Selection', description: 'Choose approval rules' },
    { id: 3, title: 'Review & Submit', description: 'Confirm and create' }
  ];


  // Get policies from API (payment policies only)
  const availablePolicies = policiesData?.policies || [];

  // Helper function to get token symbol from address
  const getTokenSymbol = (tokenAddress: string): string => {
    switch (tokenAddress) {
      case SUPPORTED_TOKENS.ETH:
        return 'ETH';
      case SUPPORTED_TOKENS.USDC:
        return 'USDC';
      case SUPPORTED_TOKENS.USDT:
        return 'USDT';
      default:
        return 'Unknown';
    }
  };

  // Helper function to get token decimals from address
  const getTokenDecimals = (tokenAddress: string): number => {
    switch (tokenAddress) {
      case SUPPORTED_TOKENS.ETH:
        return 18;
      case SUPPORTED_TOKENS.USDC:
        return 6;
      case SUPPORTED_TOKENS.USDT:
        return 6;
      default:
        return 18; // Default to 18 decimals
    }
  };

  // Helper function to convert amount to smallest unit (wei/smallest token unit)
  const convertToSmallestUnit = (amount: string, tokenAddress: string): string => {
    if (!amount || amount === '0') return '0';

    const decimals = getTokenDecimals(tokenAddress);
    const amountFloat = parseFloat(amount);

    if (isNaN(amountFloat) || amountFloat <= 0) {
      throw new Error('Invalid amount');
    }

    // Use string manipulation to avoid floating point precision issues
    const [integerPart, decimalPart = ''] = amount.split('.');
    const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    const result = integerPart + paddedDecimal;

    // Remove leading zeros
    return BigInt(result).toString();
  };

  const mockSponsorshipResults = {
    success: {
      status: 'success',
      available: true,
      estimatedGas: '0.002 ETH',
      reason: 'Sufficient paymaster balance',
      poolBalance: '2.45 ETH',
      dailyRemaining: '3.8 ETH'
    },
    daily_limit: {
      status: 'failed',
      available: false,
      estimatedGas: '0.002 ETH',
      reason: 'Daily spending limit exceeded',
      poolBalance: '2.45 ETH',
      dailyRemaining: '0.0 ETH'
    },
    insufficient_balance: {
      status: 'failed',
      available: false,
      estimatedGas: '0.002 ETH',
      reason: 'Insufficient paymaster balance',
      poolBalance: '0.001 ETH',
      dailyRemaining: '3.8 ETH'
    },
    failed: {
      status: 'failed',
      available: false,
      estimatedGas: '0.002 ETH',
      reason: 'Paymaster service unavailable',
      poolBalance: 'Unknown',
      dailyRemaining: 'Unknown'
    }
  };

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};

    // Step 1: Payment Details validation (includes Overview + Payment + Gas)
    if (step === 1) {
      if (!formData.title.trim()) {
        errors.title = 'Title is required';
      }
      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        errors.amount = 'Valid amount is required';
      }
      if (!formData.recipient.trim()) {
        errors.recipient = 'Recipient address is required';
      } else if (!formData.recipient.startsWith('0x') || formData.recipient.length !== 42) {
        errors.recipient = 'Invalid Ethereum address format';
      }
      if (!formData.deadline) {
        errors.deadline = 'Deadline is required';
      } else {
        const deadlineDate = new Date(formData.deadline);
        const now = new Date();
        if (deadlineDate <= now) {
          errors.deadline = 'Deadline must be in the future';
        }
      }
    }

    // Step 2: Policy validation
    if (step === 2) {
      if (!formData.policyId) {
        errors.policyId = 'Please select or create a policy';
      }
    }

    // Step 3: Final validation before submission
    if (step === 3) {
      // Re-validate all previous steps
      if (!formData.title.trim()) errors.title = 'Title is required';
      if (!formData.description.trim()) errors.description = 'Description is required';
      if (!formData.policyId) errors.policyId = 'Policy is required';
      if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount is required';
      if (!formData.recipient.trim()) {
        errors.recipient = 'Recipient address is required';
      } else if (!formData.recipient.startsWith('0x') || formData.recipient.length !== 42) {
        errors.recipient = 'Invalid Ethereum address format';
      }
      if (!formData.deadline) {
        errors.deadline = 'Deadline is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkPaymaster = () => {
    setPaymasterCheckState('checking');

    // Simulate API call
    setTimeout(() => {
      // Simulate different outcomes based on form data
      const amount = parseFloat(formData.amount || '0');

      console.log('[EscrowCreation] Paymaster check - amount:', amount);

      // More realistic simulation:
      // - amounts > 10: daily limit exceeded
      // - amounts > 50: insufficient paymaster balance
      // - 95% success rate for normal amounts
      if (amount > 50) {
        console.log('[EscrowCreation] Paymaster check result: insufficient_balance');
        setPaymasterCheckState('insufficient_balance');
      } else if (amount > 10) {
        console.log('[EscrowCreation] Paymaster check result: daily_limit');
        setPaymasterCheckState('daily_limit');
      } else if (Math.random() > 0.95) {
        console.log('[EscrowCreation] Paymaster check result: failed (random)');
        setPaymasterCheckState('failed');
      } else {
        console.log('[EscrowCreation] Paymaster check result: success');
        setPaymasterCheckState('success');
      }
    }, 1500);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Auto-trigger Paymaster check when moving from Step 1 (Payment Details with Gas)
      if (currentStep === 1 && paymasterCheckState === 'unchecked') {
        checkPaymaster();
      }
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.policyId) {
      toast.error('Please select a policy');
      return;
    }

    // Validate recipient address
    if (!formData.recipient || !/^0x[a-fA-F0-9]{40}$/.test(formData.recipient)) {
      toast.error('Please enter a valid recipient Ethereum address');
      return;
    }

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Convert amount to smallest unit (wei for ETH, smallest unit for USDC/USDT)
    let amountInSmallestUnit: string;
    try {
      amountInSmallestUnit = convertToSmallestUnit(formData.amount, formData.token);
      console.log('[EscrowCreation] Amount conversion:', {
        input: formData.amount,
        token: getTokenSymbol(formData.token),
        decimals: getTokenDecimals(formData.token),
        output: amountInSmallestUnit,
      });
    } catch (error) {
      toast.error('Invalid amount format');
      console.error('[EscrowCreation] Amount conversion error:', error);
      return;
    }

    // Create escrow payload
    const escrowData = {
      type: 'payment' as const,
      vaultId,
      policyId: formData.policyId,
      name: formData.title,
      description: formData.description,
      requester: walletAddress,
      recipient: formData.recipient,
      token: formData.token,
      totalAmount: amountInSmallestUnit,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      reason: formData.description,
      metadata: {
        gasFallback: gasFallbackSelected,
        paymasterCheck: paymasterCheckState,
      },
    };

    console.log('[EscrowCreation] Creating escrow with data:', escrowData);

    createEscrow(escrowData, {
      onSuccess: (data) => {
        toast.success('Escrow created successfully!', {
          description: `${formData.title} has been submitted for approval`,
        });
        console.log('[EscrowCreation] Created escrow:', data);
        onSuccess?.();
      },
      onError: (error: any) => {
        console.error('[EscrowCreation] Create escrow error:', error);

        // Parse validation errors if available
        let errorMessage = 'Failed to create escrow';
        let errorDescription = error.message;

        if (error.message.includes('Validation error')) {
          errorMessage = 'Validation Error';
          errorDescription = 'Please check all required fields are filled correctly';
        } else if (error.message.includes('vaultId')) {
          errorMessage = 'Invalid Group';
          errorDescription = 'Please select a valid group';
        } else if (error.message.includes('policyId')) {
          errorMessage = 'Invalid Policy';
          errorDescription = 'Please select a valid approval policy';
        } else if (error.message.includes('recipient')) {
          errorMessage = 'Invalid Recipient';
          errorDescription = 'Please enter a valid Ethereum address';
        } else if (error.message.includes('amount')) {
          errorMessage = 'Invalid Amount';
          errorDescription = 'Please enter a valid amount';
        }

        toast.error(errorMessage, {
          description: errorDescription,
        });
      },
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Combined Payment Details (Overview + Payment + Gas Configuration)
        return (
          <div className={UNIFIED_FORM_STYLES.spacing.section}>
            <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
              <h3 className="mb-4 text-lg font-semibold">Escrow Overview</h3>
              <div className="space-y-4">
                <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
                  <Label htmlFor="title" className={UNIFIED_FORM_STYLES.label.base}>Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Holiday Shopping Fund"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`${UNIFIED_FORM_STYLES.input.base} ${validationErrors.title ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.title && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.title}</div>
                  )}
                </div>
                <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
                  <Label htmlFor="description" className={UNIFIED_FORM_STYLES.label.base}>Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this escrow..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`${UNIFIED_FORM_STYLES.textarea.base} ${validationErrors.description ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.description && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.description}</div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
              <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>
              <div className="space-y-4">
                <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
                  <Label htmlFor="amount" className={UNIFIED_FORM_STYLES.label.base}>Amount (USDC)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`${UNIFIED_FORM_STYLES.input.number} ${validationErrors.amount ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.amount && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.amount}</div>
                  )}
                </div>

                <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
                  <Label htmlFor="recipient" className={UNIFIED_FORM_STYLES.label.base}>Recipient Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipient"
                      placeholder="0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C"
                      value={formData.recipient}
                      onChange={(e) => handleInputChange('recipient', e.target.value)}
                      className={`${UNIFIED_FORM_STYLES.input.base} ${validationErrors.recipient ? 'border-destructive' : ''}`}
                    />
                    <Button variant="outline" size="icon" className="h-12 w-12">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {validationErrors.recipient && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.recipient}</div>
                  )}
                </div>

                <div className={UNIFIED_FORM_STYLES.spacing.fieldGroup}>
                  <Label htmlFor="deadline" className={UNIFIED_FORM_STYLES.label.base}>Payment Deadline (DD/MM/YYYY)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className={`${UNIFIED_FORM_STYLES.input.base} ${validationErrors.deadline ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.deadline && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.deadline}</div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Set a deadline for when this payment should be completed
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Gas Fee Configuration - Hidden but enabled by default */}
            <div style={{ display: 'none' }}>
              <Step4Paymaster
                paymasterCheckState="success"
                gasFallbackSelected={false}
                onCheckPaymaster={checkPaymaster}
                onToggleFallback={() => setGasFallbackSelected(false)}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4" />
                Estimated Value
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total Amount:</span>
                  <span className="text-cyan-400">{formData.amount || '0'} USDC</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Gas fees are sponsored by the platform
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        // Step 2: Policy Selection/Creation
        return (
          <Step2Policy
            formData={formData}
            availablePolicies={availablePolicies}
            isPoliciesLoading={isPoliciesLoading}
            validationErrors={validationErrors}
            onInputChange={handleInputChange}
            onCreatePolicyClick={() => setShowPolicyModal(true)}
          />
        );

      case 3:
        // Step 5: Review & Submit
        return (
          <div className="space-y-6">
            <h3 className="mb-4">Review & Submit</h3>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Escrow Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <div className="font-medium">{formData.title || 'Untitled Escrow'}</div>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <div className="font-medium">{formData.amount} {getTokenSymbol(formData.token)}</div>
                  </div>
                  <div>
                    <Label>Recipient</Label>
                    <div className="font-mono text-sm">{formData.recipient || 'Not set'}</div>
                  </div>
                  <div>
                    <Label>Deadline</Label>
                    <div className="font-medium">{formData.deadline || 'Not set'}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Description</Label>
                  <div className="text-sm">{formData.description || 'No description provided'}</div>
                </div>

                <div>
                  <Label>Policy</Label>
                  <div className="font-medium">
                    {availablePolicies.find(p => p.id === formData.policyId)?.name || formData.policyId || 'Not selected'}
                  </div>
                  {formData.policyId && availablePolicies.find(p => p.id === formData.policyId) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const policy = availablePolicies.find(p => p.id === formData.policyId);
                        return policy?.type === 'payment'
                          ? `${policy.threshold || 'N/A'} approvals${policy.timelock ? ` • ${policy.timelock}s timelock` : ''}`
                          : '';
                      })()}
                    </div>
                  )}
                </div>

                {/* Paymaster Status Summary - Hidden as gas is always sponsored */}
                {false && paymasterCheckState !== 'unchecked' && (
                  <>
                    <Separator />
                    <div>
                      <Label>Gas Payment</Label>
                      <div className="text-sm mt-1">
                        {paymasterCheckState === 'success' && (
                          <span className="text-green-600 font-medium">✓ Sponsored by Paymaster</span>
                        )}
                        {paymasterCheckState === 'checking' && (
                          <span className="text-blue-600">Checking sponsorship...</span>
                        )}
                        {(paymasterCheckState === 'daily_limit' || paymasterCheckState === 'insufficient_balance' || paymasterCheckState === 'failed') && (
                          <span className="text-yellow-600">
                            {gasFallbackSelected ? 'Paid from your wallet' : 'Paymaster unavailable'}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Ready to Submit</div>
                  <div className="text-sm text-blue-700">
                    Your escrow will be created and sent for approval according to the selected policy.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl">Create New Escrow</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Set up a new escrow request for family approval</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${
                currentStep >= step.id ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <span className="text-xs sm:text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-16 lg:w-20 h-0.5 mx-1 sm:mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="text-base sm:text-lg">{steps[currentStep - 1].title}</h3>
          <p className="text-muted-foreground text-xs sm:text-sm">{steps[currentStep - 1].description}</p>
        </div>
        <Progress value={(currentStep / 3) * 100} className="mt-3 sm:mt-4 h-1.5 sm:h-2" />
      </div>

      {/* Step Content */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="w-full sm:w-auto text-xs sm:text-sm"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Previous
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext} className="w-full sm:w-auto text-xs sm:text-sm">
            Next
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isCreating} className="w-full sm:w-auto text-xs sm:text-sm">
            {isCreating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Escrow
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Policy Creation Modal */}
      <PolicyCreationModal
        open={showPolicyModal}
        vaultId={vaultId}
        onPolicyCreated={(newPolicyId) => {
          console.log('[EscrowCreation] New policy created:', newPolicyId);
          // Set the newly created policy as selected
          setFormData((prev) => ({ ...prev, policyId: newPolicyId }));
          setShowPolicyModal(false);
          // Refetch policies to include the new one
          refetchPolicies();
          toast.success('Policy created successfully');
        }}
        onCancel={() => setShowPolicyModal(false)}
      />
    </div>
  );
}