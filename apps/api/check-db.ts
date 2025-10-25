import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkDatabase() {
  try {
    // Check existing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('=== Existing Tables ===');
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Check policies table structure
    console.log('\n=== Policies Table Columns ===');
    const policiesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'policies'
      ORDER BY ordinal_position;
    `;
    policiesColumns.forEach((c: any) => 
      console.log(`- ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`)
    );
    
    // Check if escrow_drafts exists
    const escrowDraftsExists = tables.some((t: any) => t.table_name === 'escrow_drafts');
    console.log(`\n=== escrow_drafts table exists: ${escrowDraftsExists} ===`);
    
    if (escrowDraftsExists) {
      const escrowColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'escrow_drafts'
        ORDER BY ordinal_position;
      `;
      console.log('\n=== Escrow_Drafts Table Columns ===');
      escrowColumns.forEach((c: any) => 
        console.log(`- ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`)
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
