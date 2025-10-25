-- Add demo mode support to vaults table
-- Migration: add_demo_mode.sql

-- Add isDemo and demoReadOnly columns to vaults table
ALTER TABLE vaults
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS demo_read_only BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for quick demo vault lookup
CREATE INDEX IF NOT EXISTS vault_is_demo_idx ON vaults(is_demo) WHERE is_demo = TRUE;

-- Comment on columns
COMMENT ON COLUMN vaults.is_demo IS 'Flag indicating if this is a demo vault accessible to all users';
COMMENT ON COLUMN vaults.demo_read_only IS 'Flag indicating if demo vault is read-only';
