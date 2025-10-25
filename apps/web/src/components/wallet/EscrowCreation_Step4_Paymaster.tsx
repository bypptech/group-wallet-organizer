import React from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import {
  CreditCard,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Wallet
} from 'lucide-react';

interface Step4PaymasterProps {
  paymasterCheckState: 'unchecked' | 'checking' | 'success' | 'daily_limit' | 'insufficient_balance' | 'failed';
  gasFallbackSelected: boolean;
  onCheckPaymaster: () => void;
  onToggleFallback: () => void;
}

export function Step4Paymaster({
  paymasterCheckState,
  gasFallbackSelected,
  onCheckPaymaster,
  onToggleFallback,
}: Step4PaymasterProps) {
  const renderPaymasterStatus = () => {
    switch (paymasterCheckState) {
      case 'unchecked':
        return (
          <Alert className="border-blue-200 bg-blue-50/10">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <div className="font-medium mb-1">Gas Fee Sponsorship Available</div>
              <div className="text-sm">
                Check if this transaction qualifies for sponsored gas fees through the Paymaster service.
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'checking':
        return (
          <Alert className="border-blue-200 bg-blue-50/10">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            <AlertDescription className="text-blue-200">
              <div className="font-medium mb-1">Checking Paymaster Eligibility...</div>
              <div className="text-sm">
                Verifying sponsorship availability and gas limits...
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'success':
        return (
          <Alert className="border-green-200 bg-green-50/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <div className="font-medium mb-1">✓ Gas Fees Will Be Sponsored</div>
              <div className="text-sm space-y-1">
                <div>This transaction qualifies for free gas through the Paymaster service.</div>
                <div className="mt-2 text-xs opacity-80">
                  • Estimated gas cost: ~0.0001 ETH (sponsored)
                  • Remaining daily limit: Available
                  • Paymaster pool: Sufficient balance
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'daily_limit':
        return (
          <Alert className="border-yellow-200 bg-yellow-50/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              <div className="font-medium mb-1">Daily Sponsorship Limit Reached</div>
              <div className="text-sm">
                The Paymaster has reached its daily sponsorship limit. You can either wait until tomorrow
                or pay gas fees from your own wallet.
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'insufficient_balance':
        return (
          <Alert className="border-yellow-200 bg-yellow-50/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              <div className="font-medium mb-1">Paymaster Pool Balance Low</div>
              <div className="text-sm">
                The Paymaster pool has insufficient balance to sponsor this transaction.
                You'll need to pay gas fees from your own wallet.
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'failed':
        return (
          <Alert className="border-red-200 bg-red-50/10">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              <div className="font-medium mb-1">Paymaster Check Failed</div>
              <div className="text-sm">
                Unable to verify Paymaster sponsorship. You'll need to pay gas fees from your own wallet.
              </div>
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  const showFallbackOption = ['daily_limit', 'insufficient_balance', 'failed'].includes(paymasterCheckState);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Gas Fee Configuration</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure how gas fees will be paid for this transaction.
        </p>
      </div>

      {/* What is a Paymaster? */}
      <Alert className="border-white/10 bg-white/5">
        <Info className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground">
          <div className="font-medium mb-1">What is a Paymaster?</div>
          <div className="text-sm">
            A Paymaster is a service that can sponsor gas fees for your transactions.
            If eligible, you won't need to pay any gas fees from your wallet.
          </div>
        </AlertDescription>
      </Alert>

      {/* Check Paymaster Button */}
      {paymasterCheckState === 'unchecked' && (
        <div className="flex flex-col items-center py-6 space-y-4">
          <Button
            onClick={onCheckPaymaster}
            variant="outline"
            size="lg"
            className="w-full max-w-md"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Check Gas Sponsorship
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Click to verify if this transaction qualifies for sponsored gas fees
          </p>
        </div>
      )}

      {/* Paymaster Status */}
      {paymasterCheckState !== 'unchecked' && renderPaymasterStatus()}

      {/* Retry Button */}
      {['daily_limit', 'insufficient_balance', 'failed'].includes(paymasterCheckState) && (
        <Button
          onClick={onCheckPaymaster}
          variant="outline"
          size="sm"
          disabled={paymasterCheckState === 'checking'}
        >
          {paymasterCheckState === 'checking' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          Retry Check
        </Button>
      )}

      {/* Fallback Option */}
      {showFallbackOption && (
        <>
          <Separator />

          <div>
            <Label className="text-base">Fallback Payment Method</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Choose how to proceed without Paymaster sponsorship
            </p>

            <div className="space-y-3">
              {/* Option 1: User pays gas */}
              <button
                type="button"
                onClick={() => onToggleFallback()}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  gasFallbackSelected
                    ? 'border-blue-400 bg-blue-50/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    gasFallbackSelected ? 'border-blue-400' : 'border-white/30'
                  }`}>
                    {gasFallbackSelected && (
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-white" />
                      <span className="font-medium text-white">Pay Gas from My Wallet</span>
                      <Badge variant="outline" className="ml-auto">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      You'll pay the gas fees (~0.0001 ETH) from your connected wallet
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Wait (future enhancement) */}
              <button
                type="button"
                disabled
                className="w-full p-4 rounded-lg border-2 border-white/10 bg-white/5 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full border-2 border-white/30" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-white" />
                      <span className="font-medium text-white">Wait for Paymaster Reset</span>
                      <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Schedule this transaction for when the Paymaster resets (tomorrow)
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Gas Estimate Display */}
      {paymasterCheckState === 'success' && (
        <div className="p-4 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Estimated Gas Cost</span>
            <span className="text-sm font-medium text-white line-through">~0.0001 ETH</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Cost</span>
            <span className="text-lg font-bold text-green-400">FREE</span>
          </div>
        </div>
      )}

      {gasFallbackSelected && (
        <div className="p-4 border border-white/10 rounded-lg bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Gas Cost</span>
            <span className="text-sm font-medium text-white">~0.0001 ETH</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This amount will be deducted from your wallet when the transaction is executed
          </p>
        </div>
      )}
    </div>
  );
}
