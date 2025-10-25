-- Rollback Migration: ID Design Refactor
-- Date: 2025-10-12
-- Description: Rollback changes from 001_id_design_refactor.sql

-- WARNING: This rollback will restore the old schema but may lose some data
-- Make sure to backup the database before running this rollback!

-- ============================================
-- Step 1: Drop sessions table
-- ============================================

DROP TABLE IF EXISTS sessions CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions();

-- ============================================
-- Step 2: Restore old column names
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='vaults' AND column_name='vault_id_deprecated') THEN
    ALTER TABLE vaults RENAME COLUMN vault_id_deprecated TO vault_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='vaults' AND column_name='vault_address_deprecated') THEN
    ALTER TABLE vaults RENAME COLUMN vault_address_deprecated TO vault_address;
  END IF;
END $$;

-- ============================================
-- Step 3: Drop new constraints and indexes
-- ============================================

DROP INDEX IF EXISTS vault_address_idx;
DROP INDEX IF EXISTS vault_caip10_idx;
DROP INDEX IF EXISTS vault_uuid_idx;
DROP INDEX IF EXISTS vault_chain_id_idx;

ALTER TABLE vaults DROP CONSTRAINT IF EXISTS vaults_address_unique;
ALTER TABLE vaults DROP CONSTRAINT IF EXISTS vaults_caip10_unique;
ALTER TABLE vaults DROP CONSTRAINT IF EXISTS vaults_uuid_unique;

-- ============================================
-- Step 4: Recreate old indexes
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS vault_id_idx ON vaults(vault_id);
CREATE INDEX IF NOT EXISTS vault_address_idx ON vaults(vault_address);

-- ============================================
-- Step 5: Drop new columns
-- ============================================

ALTER TABLE vaults DROP COLUMN IF EXISTS address;
ALTER TABLE vaults DROP COLUMN IF EXISTS chain_id;
ALTER TABLE vaults DROP COLUMN IF EXISTS caip10;
ALTER TABLE vaults DROP COLUMN IF EXISTS uuid;
ALTER TABLE vaults DROP COLUMN IF EXISTS salt;
ALTER TABLE vaults DROP COLUMN IF EXISTS factory_address;

-- ============================================
-- Rollback Complete
-- ============================================

-- To verify the rollback:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vaults'
-- ORDER BY ordinal_position;
