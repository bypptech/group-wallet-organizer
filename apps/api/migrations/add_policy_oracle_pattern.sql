-- Migration: Policy as Oracle Pattern - On-chain Integration
-- Date: 2025-10-18
-- Description: Add escrow_approvals table and on-chain integration fields

-- ============================================
-- Add On-chain Integration Fields to Escrows
-- ============================================

ALTER TABLE escrows
  ADD COLUMN IF NOT EXISTS on_chain_id VARCHAR(78),
  ADD COLUMN IF NOT EXISTS on_chain_tx_hash VARCHAR(66),
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add index for on_chain_id
CREATE INDEX IF NOT EXISTS escrow_on_chain_id_idx ON escrows(on_chain_id);

-- Add comments
COMMENT ON COLUMN escrows.on_chain_id IS 'EscrowExecutor contract on-chain ID';
COMMENT ON COLUMN escrows.on_chain_tx_hash IS 'On-chain registration transaction hash';
COMMENT ON COLUMN escrows.executed_at IS 'On-chain execution timestamp';
COMMENT ON COLUMN escrows.cancelled_at IS 'On-chain cancellation timestamp';

-- ============================================
-- Create Escrow Approvals Table
-- ============================================

CREATE TABLE IF NOT EXISTS escrow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  guardian_address VARCHAR(42) NOT NULL,
  approved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  signature TEXT,
  merkle_proof JSONB,
  metadata JSONB,
  CONSTRAINT unique_approval UNIQUE (escrow_id, guardian_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS approval_escrow_idx ON escrow_approvals(escrow_id);
CREATE INDEX IF NOT EXISTS approval_guardian_idx ON escrow_approvals(guardian_id);
CREATE INDEX IF NOT EXISTS approval_guardian_address_idx ON escrow_approvals(guardian_address);

-- Add comments
COMMENT ON TABLE escrow_approvals IS 'Off-chain guardian approvals for Policy as Oracle Pattern';
COMMENT ON COLUMN escrow_approvals.escrow_id IS 'Reference to escrows table';
COMMENT ON COLUMN escrow_approvals.guardian_id IS 'Reference to members table (guardian)';
COMMENT ON COLUMN escrow_approvals.guardian_address IS 'Guardian Ethereum address';
COMMENT ON COLUMN escrow_approvals.approved_at IS 'Approval timestamp';
COMMENT ON COLUMN escrow_approvals.signature IS 'Optional approval signature';
COMMENT ON COLUMN escrow_approvals.merkle_proof IS 'Merkle proof for guardian role verification';

-- ============================================
-- Update Escrow Status Enum (if needed)
-- ============================================

-- Note: PostgreSQL doesn't have built-in enum updates in SQL
-- If using enum type, this would need to be handled in application code
-- For varchar status field, no changes needed

-- The new status flow is:
-- draft → submitted → approved → on-chain → executed/cancelled

COMMENT ON COLUMN escrows.status IS 'Escrow status: draft, submitted, approved, on-chain, executed, cancelled';
