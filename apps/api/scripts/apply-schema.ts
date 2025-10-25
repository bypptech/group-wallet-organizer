import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "../src/db/schema.js";
import ws from "ws";
import * as dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function applySchema() {
  console.log("[Schema] Applying schema changes...");

  try {
    // Create authorized_users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS authorized_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_id UUID NOT NULL REFERENCES shareable_keys(id) ON DELETE CASCADE,
        user_address VARCHAR(42) NOT NULL,
        vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
        authorized_by VARCHAR(42) NOT NULL,
        authorized_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        revoked_at TIMESTAMP,
        revoked_by VARCHAR(42),
        metadata JSONB,
        CONSTRAINT authorized_users_unique UNIQUE (key_id, user_address)
      );
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS authorized_users_key_idx ON authorized_users(key_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS authorized_users_address_idx ON authorized_users(user_address);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS authorized_users_vault_idx ON authorized_users(vault_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS authorized_users_status_idx ON authorized_users(status);`);

    console.log("[Schema] ✓ authorized_users table created successfully");
    console.log("[Schema] ✓ Indexes created successfully");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("[Schema] Error applying schema:", error);
    await pool.end();
    process.exit(1);
  }
}

applySchema();
