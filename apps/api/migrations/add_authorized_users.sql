-- Migration: Create authorized_users table for Shareable Key access control
-- Date: 2025-10-23
-- Description: Tracks which users are authorized to use specific Shareable Keys
--              Automatically syncs with Vault membership changes

-- Create authorized_users table
CREATE TABLE IF NOT EXISTS authorized_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES shareable_keys(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL,
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,

  -- Authorization Details
  authorized_by VARCHAR(42) NOT NULL,
  authorized_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(42),

  -- Metadata
  metadata JSONB,

  -- Ensure unique constraint: one user can only be authorized once per key
  CONSTRAINT authorized_users_unique UNIQUE (key_id, user_address)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS authorized_users_key_idx ON authorized_users(key_id);
CREATE INDEX IF NOT EXISTS authorized_users_address_idx ON authorized_users(user_address);
CREATE INDEX IF NOT EXISTS authorized_users_vault_idx ON authorized_users(vault_id);
CREATE INDEX IF NOT EXISTS authorized_users_status_idx ON authorized_users(status);

-- Add comments to table and columns
COMMENT ON TABLE authorized_users IS 'Tracks authorized users for Shareable Keys, synced with Vault membership';
COMMENT ON COLUMN authorized_users.key_id IS 'Reference to the Shareable Key';
COMMENT ON COLUMN authorized_users.user_address IS 'Ethereum address of the authorized user';
COMMENT ON COLUMN authorized_users.vault_id IS 'Reference to the Vault (for membership tracking)';
COMMENT ON COLUMN authorized_users.authorized_by IS 'Address that granted authorization (creator or system)';
COMMENT ON COLUMN authorized_users.status IS 'Authorization status: active, revoked';
