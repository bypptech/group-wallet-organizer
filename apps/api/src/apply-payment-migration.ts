import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // Override with local .env if exists

const DATABASE_URL = process.env.DATABASE_URL;

async function applyPaymentMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Add payment fields to invites table
    const statements = [
      'ALTER TABLE invites ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT FALSE',
      'ALTER TABLE invites ADD COLUMN IF NOT EXISTS payment_amount VARCHAR(78)',
      'ALTER TABLE invites ADD COLUMN IF NOT EXISTS payment_token VARCHAR(42)',
      'ALTER TABLE invites ADD COLUMN IF NOT EXISTS payment_recipient VARCHAR(42)',
      'ALTER TABLE invites ADD COLUMN IF NOT EXISTS payment_tx_hash VARCHAR(66)',
      'ALTER TABLE invites ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP',
      'CREATE INDEX IF NOT EXISTS invite_payment_required_idx ON invites(payment_required)',
      'CREATE INDEX IF NOT EXISTS invite_payment_completed_idx ON invites(payment_completed_at)',
    ];

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 70)}...`);
      await client.query(statement);
    }

    console.log('✓ Payment migration applied successfully!');
    console.log('✓ Added 6 columns and 2 indexes to invites table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyPaymentMigration();
