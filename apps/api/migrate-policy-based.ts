import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('=== Starting Policy-Based Architecture Migration ===\n');
  
  try {
    // Step 1: Add new columns to policies table
    console.log('Step 1: Extending policies table...');
    await sql`
      ALTER TABLE policies 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS collection_config JSONB;
    `;
    
    // Set default values for existing records
    await sql`
      UPDATE policies 
      SET type = 'payment', 
          name = COALESCE(metadata->>'name', 'Default Payment Policy'),
          description = COALESCE(metadata->>'description', '')
      WHERE type IS NULL;
    `;
    
    // Make type and name NOT NULL
    await sql`
      ALTER TABLE policies 
      ALTER COLUMN type SET NOT NULL,
      ALTER COLUMN name SET NOT NULL;
    `;
    
    // Make payment fields nullable
    await sql`
      ALTER TABLE policies 
      ALTER COLUMN threshold DROP NOT NULL,
      ALTER COLUMN timelock DROP NOT NULL,
      ALTER COLUMN roles_root DROP NOT NULL,
      ALTER COLUMN owners_root DROP NOT NULL;
    `;
    
    console.log('✓ Policies table extended\n');
    
    // Step 2: Create escrows table
    console.log('Step 2: Creating escrows table...');
    await sql`
      CREATE TABLE IF NOT EXISTS escrows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
        policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
        
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        
        token VARCHAR(42) NOT NULL,
        total_amount VARCHAR(78) NOT NULL,
        
        requester VARCHAR(42),
        recipient VARCHAR(42),
        target VARCHAR(42),
        data TEXT,
        reason TEXT,
        
        collected_amount VARCHAR(78),
        participants JSONB,
        
        status VARCHAR(50) DEFAULT 'draft',
        deadline TIMESTAMP,
        scheduled_release_at TIMESTAMP,
        expires_at TIMESTAMP,
        
        escrow_id VARCHAR(66) UNIQUE,
        tx_hash VARCHAR(66),
        
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB
      );
    `;
    console.log('✓ Escrows table created\n');
    
    // Step 3: Create indexes
    console.log('Step 3: Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS policy_type_idx ON policies(type);
      CREATE INDEX IF NOT EXISTS policy_vault_type_idx ON policies(vault_id, type);
      
      CREATE INDEX IF NOT EXISTS escrow_escrow_id_idx ON escrows(escrow_id);
      CREATE INDEX IF NOT EXISTS escrow_vault_idx ON escrows(vault_id);
      CREATE INDEX IF NOT EXISTS escrow_policy_idx ON escrows(policy_id);
      CREATE INDEX IF NOT EXISTS escrow_status_idx ON escrows(status);
      CREATE INDEX IF NOT EXISTS escrow_type_idx ON escrows(type);
      CREATE INDEX IF NOT EXISTS escrow_vault_type_idx ON escrows(vault_id, type);
    `;
    console.log('✓ Indexes created\n');
    
    console.log('=== Migration completed successfully! ===');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrate();
