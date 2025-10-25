-- Migration: Add payment fields to invites table for Shareable Keys
-- Date: 2025-10-23
-- Description: Enables USDC payment requirements for Shareable Key invitations

-- Add payment-related columns to invites table
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_amount VARCHAR(78),
  ADD COLUMN IF NOT EXISTS payment_token VARCHAR(42),
  ADD COLUMN IF NOT EXISTS payment_recipient VARCHAR(42),
  ADD COLUMN IF NOT EXISTS payment_tx_hash VARCHAR(66),
  ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP;

-- Create indexes for payment fields
CREATE INDEX IF NOT EXISTS invite_payment_required_idx ON invites(payment_required);
CREATE INDEX IF NOT EXISTS invite_payment_completed_idx ON invites(payment_completed_at);

-- Add comment to table
COMMENT ON COLUMN invites.payment_required IS 'Whether this invite requires USDC payment';
COMMENT ON COLUMN invites.payment_amount IS 'Payment amount in wei (BigInt as string, 6 decimals for USDC)';
COMMENT ON COLUMN invites.payment_token IS 'ERC20 token contract address (e.g., USDC)';
COMMENT ON COLUMN invites.payment_recipient IS 'Address to receive the payment';
COMMENT ON COLUMN invites.payment_tx_hash IS 'Transaction hash of the payment';
COMMENT ON COLUMN invites.payment_completed_at IS 'Timestamp when payment was completed';
