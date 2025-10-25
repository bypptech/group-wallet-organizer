/**
 * Script to create comments table in Neon database
 */
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in environment variables");
  process.exit(1);
}

async function createCommentsTable() {
  try {
    console.log("🔌 Connecting to Neon database...");
    const sql = neon(DATABASE_URL);

    console.log("📝 Creating comments table...");

    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        escrow_id uuid NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
        author varchar(42) NOT NULL,
        author_name varchar(255),
        content text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        metadata jsonb
      )
    `;

    console.log("📝 Creating indexes...");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS comment_escrow_idx ON comments(escrow_id)`;
    await sql`CREATE INDEX IF NOT EXISTS comment_author_idx ON comments(author)`;
    await sql`CREATE INDEX IF NOT EXISTS comment_created_idx ON comments(created_at)`;

    console.log("✅ Comments table created successfully!");

    // Verify table creation
    console.log("\n🔍 Verifying table creation...");
    const result = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'comments'
      ORDER BY ordinal_position;
    `;

    console.log("\n📊 Comments table structure:");
    console.table(result);

    // Check indexes
    console.log("\n🔍 Checking indexes...");
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'comments';
    `;

    console.log("\n📊 Comments table indexes:");
    console.table(indexes);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating comments table:", error);
    process.exit(1);
  }
}

createCommentsTable();
