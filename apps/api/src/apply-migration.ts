import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Client } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

async function applyMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    // Run migration statements one by one
    const statements = [
      'ALTER TABLE "invites" DROP CONSTRAINT IF EXISTS "invites_vault_id_vaults_id_fk"',
      'ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_vault_id_vaults_id_fk"',
      'ALTER TABLE "policies" DROP CONSTRAINT IF EXISTS "policies_vault_id_vaults_id_fk"',
      'ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_vault_id_vaults_id_fk"',
      'ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_vault_id_vaults_id_fk"',
      'ALTER TABLE "escrow_drafts" DROP CONSTRAINT IF EXISTS "escrow_drafts_vault_id_vaults_id_fk"',
      'DROP INDEX IF EXISTS "vault_address_idx"',
      'ALTER TABLE "invites" ALTER COLUMN "vault_id" TYPE varchar(42)',
      'ALTER TABLE "notifications" ALTER COLUMN "vault_id" TYPE varchar(42)',
      'ALTER TABLE "policies" ALTER COLUMN "vault_id" TYPE varchar(42)',
      'ALTER TABLE "members" ALTER COLUMN "vault_id" TYPE varchar(42)',
      'ALTER TABLE "audit_logs" ALTER COLUMN "vault_id" TYPE varchar(42)',
      'ALTER TABLE "escrow_drafts" ALTER COLUMN "vault_id" TYPE varchar(42)',
      'ALTER TABLE "vaults" DROP CONSTRAINT IF EXISTS "vaults_pkey"',
      'ALTER TABLE "vaults" ADD PRIMARY KEY ("vault_address")',
      'ALTER TABLE "invites" ADD CONSTRAINT "invites_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action',
      'ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action',
      'ALTER TABLE "policies" ADD CONSTRAINT "policies_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action',
      'ALTER TABLE "members" ADD CONSTRAINT "members_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action',
      'ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action',
      'ALTER TABLE "escrow_drafts" ADD CONSTRAINT "escrow_drafts_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action',
    ];

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await client.query(statement);
    }

    console.log('✓ Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
