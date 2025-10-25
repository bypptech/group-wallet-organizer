/**
 * Add unique IDs to existing collection participants
 *
 * This script adds a unique ID to all participants in collections
 * that don't already have an ID field.
 */

import * as dotenv from 'dotenv';
import { initializeDatabase, getDatabase, escrows } from '../db/client.js';
import { eq } from 'drizzle-orm';
import type { CollectionParticipant } from '@shared/types/escrow';

// Load environment variables
dotenv.config();

async function addParticipantIds() {
  console.log('[Migration] Starting participant ID migration...');

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  await initializeDatabase({ connectionString });
  const db = getDatabase();

  // Get all collections
  const allEscrows = await db
    .select()
    .from(escrows)
    .where(eq(escrows.type, 'collection'));

  console.log(`[Migration] Found ${allEscrows.length} collections`);

  let updatedCount = 0;

  for (const escrow of allEscrows) {
    const participants = (escrow.participants as CollectionParticipant[]) || [];

    // Check if any participant is missing an ID
    const needsUpdate = participants.some((p: any) => !p.id);

    if (!needsUpdate) {
      console.log(`[Migration] Collection ${escrow.id} - All participants already have IDs`);
      continue;
    }

    console.log(`[Migration] Collection ${escrow.id} - Adding IDs to ${participants.length} participants`);

    // Add IDs to participants that don't have them
    const updatedParticipants = participants.map((p: any) => {
      if (p.id) {
        return p;
      }

      const participantId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[Migration]   - Adding ID ${participantId} to participant: ${p.name || p.address || 'Unknown'}`);

      return {
        id: participantId,
        ...p,
      };
    });

    // Update the collection
    await db
      .update(escrows)
      .set({
        participants: updatedParticipants as any,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, escrow.id));

    updatedCount++;
    console.log(`[Migration] Collection ${escrow.id} - Updated successfully`);
  }

  console.log(`[Migration] Migration completed! Updated ${updatedCount} collections`);
}

// Run the migration
addParticipantIds()
  .then(() => {
    console.log('[Migration] Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] Error:', error);
    process.exit(1);
  });
