import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useRecordPayment } from '@/hooks/useCollections';
import { DollarSign, RefreshCw, CheckCircle2 } from 'lucide-react';

interface CollectionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  participantAddress: string;
  participantName?: string;
  allocatedAmount: string;
  paidAmount: string;
}

export function CollectionPaymentDialog({
  open,
  onOpenChange,
  collectionId,
  participantAddress,
  participantName,
  allocatedAmount,
  paidAmount,
}: CollectionPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const { toast } = useToast();
  const { mutate: recordPayment, isPending } = useRecordPayment();

  const formatAmount = (amountWei: string) => {
    const amt = Number(BigInt(amountWei)) / 1_000_000;
    return amt.toFixed(2);
  };

  const remainingAmount = () => {
    const allocated = BigInt(allocatedAmount);
    const paid = BigInt(paidAmount);
    return Number(allocated - paid) / 1_000_000;
  };

  const handleSubmit = () => {
    if (!amount || !txHash) {
      toast({
        title: 'Missing information',
        description: 'Please enter both amount and transaction hash',
        variant: 'destructive',
      });
      return;
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    // Convert to wei (USDC has 6 decimals)
    const amountWei = (BigInt(Math.floor(amountFloat * 1_000_000))).toString();

    recordPayment(
      {
        collectionId,
        participantAddress,
        amount: amountWei,
        txHash,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Payment recorded',
            description: `Successfully recorded payment of ${amount} USDC`,
          });
          onOpenChange(false);
          setAmount('');
          setTxHash('');
        },
        onError: (error) => {
          toast({
            title: 'Failed to record payment',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-purple-500/20 max-w-[95vw] sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-white flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Record Payment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
            Record a payment for {participantName || 'participant'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* Payment Info */}
          <div className="glass p-3 sm:p-4 rounded-lg border border-white/10">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-muted-foreground">Allocated Amount</p>
                <p className="text-white font-medium">{formatAmount(allocatedAmount)} USDC</p>
              </div>
              <div>
                <p className="text-muted-foreground">Already Paid</p>
                <p className="text-white font-medium">{formatAmount(paidAmount)} USDC</p>
              </div>
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
              <p className="text-muted-foreground text-xs sm:text-sm">Remaining Amount</p>
              <p className="text-base sm:text-lg font-bold text-cyan-400">{remainingAmount().toFixed(2)} USDC</p>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-white text-xs sm:text-sm">
              Payment Amount (USDC) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the amount that was paid in USDC
            </p>
          </div>

          {/* Transaction Hash Input */}
          <div>
            <Label htmlFor="txHash" className="text-white text-xs sm:text-sm">
              Transaction Hash *
            </Label>
            <Input
              id="txHash"
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="glass border-white/20 text-white mt-1.5 sm:mt-2 text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The transaction hash of the payment on-chain
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="glass border-white/20 w-full sm:w-auto text-xs sm:text-sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="gradient-primary text-white hover-glow w-full sm:w-auto text-xs sm:text-sm"
            onClick={handleSubmit}
            disabled={!amount || !txHash || isPending}
          >
            {isPending ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Record Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
