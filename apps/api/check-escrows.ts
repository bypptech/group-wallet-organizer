import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkEscrows() {
  const escrowColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'escrows'
    ORDER BY ordinal_position;
  `;
  console.log('=== Escrows Table Columns ===');
  escrowColumns.forEach((c: any) => 
    console.log(`- ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`)
  );
}

checkEscrows();
