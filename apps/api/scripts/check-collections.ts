import { getDatabase, escrows } from '../src/db/client.js';
import { initializeDatabaseFromEnv } from '../src/db/client.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkCollections() {
  initializeDatabaseFromEnv(process.env);
  const db = getDatabase();
  
  console.log('Checking collections in database...\n');
  
  const collections = await db
    .select()
    .from(escrows)
    .where(eq(escrows.type, 'collection'))
    .limit(10);
  
  console.log(`Found ${collections.length} collections:\n`);
  
  collections.forEach((col: any) => {
    console.log(`ID: ${col.id}`);
    console.log(`Name: ${col.name}`);
    console.log(`Vault ID: ${col.vaultId}`);
    console.log(`Type: ${col.type}`);
    console.log(`Participants: ${JSON.stringify(col.participants)}`);
    console.log('---\n');
  });
  
  process.exit(0);
}

checkCollections().catch(console.error);
