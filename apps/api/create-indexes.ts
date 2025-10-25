import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function createIndexes() {
  console.log('Creating indexes...\n');
  
  const indexes = [
    { name: 'policy_type_idx', query: 'CREATE INDEX IF NOT EXISTS policy_type_idx ON policies(type)' },
    { name: 'policy_vault_type_idx', query: 'CREATE INDEX IF NOT EXISTS policy_vault_type_idx ON policies(vault_id, type)' },
    { name: 'escrow_escrow_id_idx', query: 'CREATE INDEX IF NOT EXISTS escrow_escrow_id_idx ON escrows(escrow_id)' },
    { name: 'escrow_vault_idx', query: 'CREATE INDEX IF NOT EXISTS escrow_vault_idx ON escrows(vault_id)' },
    { name: 'escrow_policy_idx', query: 'CREATE INDEX IF NOT EXISTS escrow_policy_idx ON escrows(policy_id)' },
    { name: 'escrow_status_idx', query: 'CREATE INDEX IF NOT EXISTS escrow_status_idx ON escrows(status)' },
    { name: 'escrow_type_idx', query: 'CREATE INDEX IF NOT EXISTS escrow_type_idx ON escrows(type)' },
    { name: 'escrow_vault_type_idx', query: 'CREATE INDEX IF NOT EXISTS escrow_vault_type_idx ON escrows(vault_id, type)' },
  ];
  
  for (const { name, query } of indexes) {
    try {
      await sql.unsafe(query);
      console.log(`✓ ${name}`);
    } catch (error) {
      console.error(`✗ ${name}:`, error);
    }
  }
  
  console.log('\n=== Index creation completed ===');
}

createIndexes();
