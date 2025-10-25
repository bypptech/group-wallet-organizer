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
  CreditCard
} from 'lucide-react';

export function EscrowCreateWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [paymasterCheckState, setPaymasterCheckState] = useState<'unchecked' | 'checking' | 'success' | 'daily_limit' | 'insufficient_balance' | 'failed'>('unchecked');
  const [gasFallbackSelected, setGasFallbackSelected] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    token: 'ETH',
    recipient: '',
    deadline: '',
    policyId: 'POL-001',
    templateId: ''
  });

  const steps = [
    { id: 1, title: 'Overview', description: 'Basic escrow information' },
    { id: 2, title: 'Payment Details', description: 'Amount and recipient' },
    { id: 3, title: 'Execution Settings', description: 'Policies and deadlines' },
    { id: 4, title: 'Review & Submit', description: 'Confirm and create' }
  ];

  const mockTemplates = [
    { id: 'TEMP-001', name: 'Monthly Allowance', amount: '0.1 ETH', description: 'Regular monthly spending' },
    { id: 'TEMP-002', name: 'Shopping Fund', amount: '0.5 ETH', description: 'Holiday shopping budget' },
    { id: 'TEMP-003', name: 'Emergency Fund', amount: '1.0 ETH', description: 'Emergency expenses' }
  ];

  const mockPolicies = [
    { id: 'POL-001', name: 'Standard Policy', threshold: '2/3', timelock: '24h' },
    { id: 'POL-002', name: 'High Value Policy', threshold: '3/3', timelock: '72h' },
    { id: 'POL-003', name: 'Emergency Policy', threshold: '1/3', timelock: '1h' }
  ];

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
    
    if (step === 1) {
      if (!formData.title.trim()) {
        errors.title = 'Title is required';
      }
      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      }
    }
    
    if (step === 2) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        errors.amount = 'Valid amount is required';
      }
      if (!formData.recipient.trim()) {
        errors.recipient = 'Recipient address is required';
      } else if (!formData.recipient.startsWith('0x') || formData.recipient.length !== 42) {
        errors.recipient = 'Invalid Ethereum address format';
      }
    }
    
    if (step === 3) {
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
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkPaymaster = () => {
    setPaymasterCheckState('checking');
    
    // Simulate API call
    setTimeout(() => {
      // Simulate different outcomes based on form data
      const amount = parseFloat(formData.amount || '0');
      
      if (amount > 5) {
        setPaymasterCheckState('daily_limit');
      } else if (amount > 10) {
        setPaymasterCheckState('insufficient_balance');
      } else if (Math.random() > 0.8) {
        setPaymasterCheckState('failed');
      } else {
        setPaymasterCheckState('success');
      }
    }, 1500);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        checkPaymaster();
      }
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4">Escrow Overview</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Holiday Shopping Fund"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={validationErrors.title ? 'border-destructive' : ''}
                  />
                  {validationErrors.title && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.title}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this escrow..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={validationErrors.description ? 'border-destructive' : ''}
                  />
                  {validationErrors.description && (
                    <div className="text-sm text-destructive mt-1">{validationErrors.description}</div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3">Use Template (Optional)</h4>
              <div className="space-y-3">
                {mockTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.templateId === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      handleInputChange('templateId', template.id);
                      handleInputChange('title', template.name);
                      handleInputChange('amount', template.amount.split(' ')[0]);
                      handleInputChange('description', template.description);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                      <Badge variant="outline">{template.amount}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="mb-4">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="0.5"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={validationErrors.amount ? 'border-destructive' : ''}
                />
                {validationErrors.amount && (
                  <div className="text-sm text-destructive mt-1">{validationErrors.amount}</div>
                )}
              </div>
              <div>
                <Label htmlFor="token">Token</Label>
                <Select value={formData.token} onValueChange={(value) => handleInputChange('token', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="DAI">DAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <div className="flex gap-2">
                <Input
                  id="recipient"
                  placeholder="0x742d35Cc6634C0532925a3b8D58AC57CF76B7e0C"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange('recipient', e.target.value)}
                  className={validationErrors.recipient ? 'border-destructive' : ''}
                />
                <Button variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {validationErrors.recipient && (
                <div className="text-sm text-destructive mt-1">{validationErrors.recipient}</div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4" />
                Estimated Value
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{formData.amount || '0'} {formData.token}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas (estimated):</span>
                  <span className="font-medium">0.002 ETH</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formData.amount || '0'} {formData.token} + gas</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="mb-4">Execution Settings</h3>
            
            <div>
              <Label htmlFor="policyId">Approval Policy</Label>
              <Select value={formData.policyId} onValueChange={(value) => handleInputChange('policyId', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockPolicies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{policy.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {policy.threshold} • {policy.timelock}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className={validationErrors.deadline ? 'border-destructive' : ''}
              />
              {validationErrors.deadline && (
                <div className="text-sm text-destructive mt-1">{validationErrors.deadline}</div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                Policy Details
              </h4>
              {mockPolicies
                .filter(p => p.id === formData.policyId)
                .map(policy => (
                  <div key={policy.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span>Required Approvals:</span>
                      <span className="font-medium">{policy.threshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timelock Period:</span>
                      <span className="font-medium">{policy.timelock}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Paymaster Sponsorship Check Results */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Paymaster Sponsorship Check
              </h4>
              
              {paymasterCheckState === 'unchecked' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Sponsorship will be checked when you proceed to the next step.
                  </AlertDescription>
                </Alert>
              )}

              {paymasterCheckState === 'checking' && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Checking paymaster sponsorship availability...
                  </AlertDescription>
                </Alert>
              )}

              {paymasterCheckState === 'success' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-2">
                      <div className="font-medium">Sponsorship Available</div>
                      <div className="text-sm">Gas will be sponsored by the family paymaster</div>
                      <div className="text-sm">Estimated cost: {mockSponsorshipResults.success.estimatedGas}</div>
                      <div className="text-sm">Pool balance: {mockSponsorshipResults.success.poolBalance}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {paymasterCheckState === 'daily_limit' && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <div className="space-y-2">
                      <div className="font-medium">Daily Limit Exceeded</div>
                      <div className="text-sm">{mockSponsorshipResults.daily_limit.reason}</div>
                      <div className="text-sm">Remaining today: {mockSponsorshipResults.daily_limit.dailyRemaining}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {paymasterCheckState === 'insufficient_balance' && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <div className="font-medium">Insufficient Balance</div>
                      <div className="text-sm">{mockSponsorshipResults.insufficient_balance.reason}</div>
                      <div className="text-sm">Pool balance: {mockSponsorshipResults.insufficient_balance.poolBalance}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {paymasterCheckState === 'failed' && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <div className="font-medium">Sponsorship Failed</div>
                      <div className="text-sm">{mockSponsorshipResults.failed.reason}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Gas Fallback Option */}
              {(paymasterCheckState === 'daily_limit' || paymasterCheckState === 'insufficient_balance' || paymasterCheckState === 'failed') && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Gas Fallback Option
                  </h5>
                  <div className="text-sm text-muted-foreground">
                    You can proceed with user wallet gas payment as fallback.
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setGasFallbackSelected(!gasFallbackSelected)}
                  >
                    {gasFallbackSelected ? 'Cancel Fallback' : 'Use Gas Fallback'}
                  </Button>
                  {gasFallbackSelected && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You will pay gas fees from your connected wallet (~0.002 ETH estimated).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
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
                    <div className="font-medium">{formData.amount} {formData.token}</div>
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
                  <div className="font-medium">{formData.policyId}</div>
                </div>
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1>Create New Escrow</h1>
        <p className="text-muted-foreground">Set up a new escrow request for family approval</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.id ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3>{steps[currentStep - 1].title}</h3>
          <p className="text-muted-foreground text-sm">{steps[currentStep - 1].description}</p>
        </div>
        <Progress value={(currentStep / 4) * 100} className="mt-4" />
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button>
            Create Escrow
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}