-- Migration: ID Design Refactor
-- Date: 2025-10-12
-- Description: Refactor vault identifiers to use address as primary identifier,
--              add CAIP-10 support, CREATE2 deployment info, and sessions table

-- ============================================
-- Step 1: Add new columns to vaults table
-- ============================================

-- Add new columns (nullable first for existing data)
ALTER TABLE vaults
ADD COLUMN IF NOT EXISTS address VARCHAR(42),
ADD COLUMN IF NOT EXISTS chain_id INTEGER,
ADD COLUMN IF NOT EXISTS caip10 VARCHAR(100),
ADD COLUMN IF NOT EXISTS uuid UUID,
ADD COLUMN IF NOT EXISTS salt VARCHAR(66),
ADD COLUMN IF NOT EXISTS factory_address VARCHAR(42);

-- ============================================
-- Step 2: Migrate existing data
-- ============================================

-- For existing vaults, we'll use vault_address as the new address column
-- and generate UUIDs. This assumes chain_id 8453 (Base) for existing vaults.
UPDATE vaults
SET
  address = vault_address,
  chain_id = 8453,
  caip10 = CONCAT('eip155:8453:', vault_address),
  uuid = gen_random_uuid()  -- PostgreSQL 13+ function
WHERE address IS NULL;

-- ============================================
-- Step 3: Make columns NOT NULL
-- ============================================

ALTER TABLE vaults
ALTER COLUMN address SET NOT NULL,
ALTER COLUMN chain_id SET NOT NULL,
ALTER COLUMN caip10 SET NOT NULL,
ALTER COLUMN uuid SET NOT NULL;

-- ============================================
-- Step 4: Add unique constraints and indexes
-- ============================================

-- Add unique constraints
ALTER TABLE vaults ADD CONSTRAINT vaults_address_unique UNIQUE (address);
ALTER TABLE vaults ADD CONSTRAINT vaults_caip10_unique UNIQUE (caip10);
ALTER TABLE vaults ADD CONSTRAINT vaults_uuid_unique UNIQUE (uuid);

-- Add indexes
CREATE INDEX IF NOT EXISTS vault_address_idx ON vaults(address);
CREATE INDEX IF NOT EXISTS vault_caip10_idx ON vaults(caip10);
CREATE INDEX IF NOT EXISTS vault_uuid_idx ON vaults(uuid);
CREATE INDEX IF NOT EXISTS vault_chain_id_idx ON vaults(chain_id);

-- ============================================
-- Step 5: Drop old columns and constraints
-- ============================================

-- Drop old unique constraint on vault_id
DROP INDEX IF EXISTS vault_id_idx;

-- Drop old vault_address index (we have a new one on address column)
DROP INDEX IF EXISTS vault_address_idx;

-- Mark vault_id as deprecated (don't drop immediately for safety)
-- In a future migration, after confirming all services are updated:
-- ALTER TABLE vaults DROP COLUMN vault_id;
-- ALTER TABLE vaults DROP COLUMN vault_address;

-- For now, just rename to indicate deprecated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='vaults' AND column_name='vault_id') THEN
    ALTER TABLE vaults RENAME COLUMN vault_id TO vault_id_deprecated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='vaults' AND column_name='vault_address') THEN
    ALTER TABLE vaults RENAME COLUMN vault_address TO vault_address_deprecated;
  END IF;
END $$;

-- ============================================
-- Step 6: Create sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),  -- IPv4/IPv6
  user_agent TEXT,
  metadata JSONB
);

-- Add indexes for sessions
CREATE UNIQUE INDEX IF NOT EXISTS session_token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS session_user_address_idx ON sessions(user_address);
CREATE INDEX IF NOT EXISTS session_expires_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS session_chain_id_idx ON sessions(chain_id);

-- ============================================
-- Step 7: Add comments for documentation
-- ============================================

COMMENT ON COLUMN vaults.address IS 'Primary vault identifier - Ethereum address (20 bytes)';
COMMENT ON COLUMN vaults.chain_id IS 'Chain ID where the vault is deployed (e.g., 8453 for Base)';
COMMENT ON COLUMN vaults.caip10 IS 'CAIP-10 formatted identifier: eip155:chainId:address';
COMMENT ON COLUMN vaults.uuid IS 'UUID for deterministic CREATE2 deployment';
COMMENT ON COLUMN vaults.salt IS 'CREATE2 salt (bytes32) used for deployment';
COMMENT ON COLUMN vaults.factory_address IS 'VaultFactory contract address that deployed this vault';

COMMENT ON TABLE sessions IS 'User authentication sessions with JWT tokens';
COMMENT ON COLUMN sessions.user_address IS 'Ethereum address of authenticated user';
COMMENT ON COLUMN sessions.chain_id IS 'Chain ID for the session context';
COMMENT ON COLUMN sessions.token IS 'JWT authentication token';

-- ============================================
-- Step 8: Create cleanup function for expired sessions
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration Complete
-- ============================================

-- To verify the migration:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vaults'
-- ORDER BY ordinal_position;
