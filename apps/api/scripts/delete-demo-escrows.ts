import { initializeDatabaseFromEnv, escrows, vaults } from '../src/db';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const db = initializeDatabaseFromEnv(process.env as Record<string, string>);
const DEMO_VAULT_ADDRESS = '0xDEMO000000000000000000000000000000000001';

async function deleteDemoEscrows() {
  console.log('🗑️  Deleting existing demo escrows...');

  try {
    // Find demo vault
    const demoVault = await db.query.vaults.findFirst({
      where: eq(vaults.address, DEMO_VAULT_ADDRESS)
    });

    if (!demoVault) {
      console.log('⚠️  Demo vault not found, nothing to delete');
      return;
    }

    // Delete escrows for demo vault
    const result = await db.delete(escrows)
      .where(eq(escrows.vaultId, demoVault.id))
      .returning();

    console.log(`✅ Deleted ${result.length} demo escrows`);
  } catch (error) {
    console.error('❌ Error deleting demo escrows:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  deleteDemoEscrows()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
