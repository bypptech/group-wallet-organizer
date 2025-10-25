-- Rollback: Policy as Oracle Pattern - On-chain Integration
-- Date: 2025-10-18
-- Description: Rollback escrow_approvals table and on-chain integration fields

-- ============================================
-- Drop Escrow Approvals Table
-- ============================================

DROP TABLE IF EXISTS escrow_approvals;

-- ============================================
-- Remove On-chain Integration Fields from Escrows
-- ============================================

ALTER TABLE escrows
  DROP COLUMN IF EXISTS on_chain_id,
  DROP COLUMN IF EXISTS on_chain_tx_hash,
  DROP COLUMN IF EXISTS executed_at,
  DROP COLUMN IF EXISTS cancelled_at;

-- Drop index
DROP INDEX IF EXISTS escrow_on_chain_id_idx;
