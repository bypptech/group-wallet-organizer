/**
 * Demo Data Seed Script
 *
 * Creates a demo vault with sample data for new users to explore
 */

import { initializeDatabaseFromEnv, vaults, members, escrows, policies, shareableKeys } from '../src/db';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize database connection
const db = initializeDatabaseFromEnv(process.env as Record<string, string>);

// Demo Vault Constants
const DEMO_VAULT_ADDRESS = '0xDEMO000000000000000000000000000000000001';
const DEMO_CHAIN_ID = 84532; // Base Sepolia
const DEMO_VAULT_UUID = '00000000-0000-0000-0000-000000000001';

// Demo User Addresses (valid hex format - only a-f, 0-9)
const DEMO_USERS = {
  ALICE: '0xa11ce00000000000000000000000000000000001', // Alice (a,1,c,e are valid hex)
  BOB: '0xb0b0000000000000000000000000000000000002', // Bob (b,0 are valid hex)
  CAROL: '0xca60100000000000000000000000000000000003', // Carol (c,a,6,0,1 are valid hex)
  DAVE: '0xdade000000000000000000000000000000000004', // Dave (d,a,e are valid hex - changed from 'dave')
};

export async function seedDemoData() {
  console.log('🌱 Starting demo data seed...');

  try {
    // 1. Check if demo vault already exists
    const existingVault = await db.query.vaults.findFirst({
      where: eq(vaults.address, DEMO_VAULT_ADDRESS)
    });

    let demoVaultId: string;

    if (existingVault) {
      console.log('✅ Demo vault already exists, skipping creation');
      demoVaultId = existingVault.id;
    } else {
      // 2. Create Demo Vault
      console.log('📦 Creating demo vault...');
      const [newVault] = await db.insert(vaults).values({
        address: DEMO_VAULT_ADDRESS,
        name: 'Demo Team Wallet',
        description: 'Explore features with pre-populated demo data. Connect your wallet to create your own!',
        chainId: DEMO_CHAIN_ID,
        caip10: `eip155:${DEMO_CHAIN_ID}:${DEMO_VAULT_ADDRESS}`,
        uuid: DEMO_VAULT_UUID,
        isDemo: true,
        demoReadOnly: true,
        metadata: {
          demoConfig: {
            allowedActions: [
              'view_vault',
              'view_escrows',
              'view_members',
              'view_policies',
              'view_shareable_keys',
              'view_comments'
            ],
            restrictedActions: [
              'create_escrow',
              'approve_escrow',
              'add_member',
              'remove_member',
              'create_shareable_key',
              'revoke_shareable_key',
              'send_payment',
              'add_comment'
            ],
            displayNames: {
              [DEMO_USERS.ALICE]: 'Alice (Owner)',
              [DEMO_USERS.BOB]: 'Bob (Guardian)',
              [DEMO_USERS.CAROL]: 'Carol (Requester)',
              [DEMO_USERS.DAVE]: 'Dave (Viewer)'
            }
          }
        }
      }).returning();

      demoVaultId = newVault.id;
      console.log(`✅ Demo vault created: ${demoVaultId}`);
    }

    // 3. Create Demo Members
    console.log('👥 Creating demo members...');
    const existingMembers = await db.query.members.findMany({
      where: eq(members.vaultId, demoVaultId)
    });

    if (existingMembers.length === 0) {
      await db.insert(members).values([
        {
          vaultId: demoVaultId,
          address: DEMO_USERS.ALICE,
          role: 'owner',
          weight: 2,
          addedBy: DEMO_USERS.ALICE,
          metadata: { displayName: 'Alice', avatar: '👩‍💼' }
        },
        {
          vaultId: demoVaultId,
          address: DEMO_USERS.BOB,
          role: 'guardian',
          weight: 1,
          addedBy: DEMO_USERS.ALICE,
          metadata: { displayName: 'Bob', avatar: '👨‍💻' }
        },
        {
          vaultId: demoVaultId,
          address: DEMO_USERS.CAROL,
          role: 'requester',
          weight: 1,
          addedBy: DEMO_USERS.ALICE,
          metadata: { displayName: 'Carol', avatar: '👩‍🔬' }
        },
        {
          vaultId: demoVaultId,
          address: DEMO_USERS.DAVE,
          role: 'viewer',
          weight: 0,
          addedBy: DEMO_USERS.ALICE,
          metadata: { displayName: 'Dave', avatar: '👨‍🎨' }
        }
      ]);
      console.log('✅ Demo members created');
    } else {
      console.log('✅ Demo members already exist, skipping');
    }

    // 4. Create Demo Policy
    console.log('📋 Creating demo policy...');
    const existingPolicies = await db.query.policies.findMany({
      where: eq(policies.vaultId, demoVaultId)
    });

    let demoPolicyId: string;

    if (existingPolicies.length === 0) {
      const [newPolicy] = await db.insert(policies).values({
        policyId: '0xDEMOPOLICY000000000000000000000000000000000000000000000000000001',
        vaultId: demoVaultId,
        type: 'payment',
        name: 'Standard Payment Policy',
        description: 'Requires 2 approvals for payments over 100 USDC',
        threshold: 2,
        timelock: 3600, // 1 hour
        maxAmount: '100000000', // 100 USDC
        active: true
      }).returning();
      demoPolicyId = newPolicy.id;
      console.log('✅ Demo policy created');
    } else {
      demoPolicyId = existingPolicies[0].id;
      console.log('✅ Demo policy already exists, skipping');
    }

    // 5. Create Demo Escrows
    console.log('💰 Creating demo escrows...');
    const existingEscrows = await db.query.escrows.findMany({
      where: eq(escrows.vaultId, demoVaultId)
    });

    if (existingEscrows.length === 0) {
      await db.insert(escrows).values([
        {
          vaultId: demoVaultId,
          policyId: demoPolicyId,
          type: 'payment',
          name: 'Team Lunch Expenses',
          description: 'Monthly team lunch gathering at Italian restaurant',
          token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
          totalAmount: '100000000', // 100 USDC
          requester: DEMO_USERS.CAROL,
          recipient: '0xRESTAURANT000000000000000000000000001',
          reason: 'Monthly team building activity',
          status: 'submitted',
          metadata: {
            category: 'Team Building',
            participants: 8,
            estimatedDate: '2025-11-15'
          }
        },
        {
          vaultId: demoVaultId,
          policyId: demoPolicyId,
          type: 'payment',
          name: 'Equipment Purchase',
          description: 'New laptop for development team member',
          token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          totalAmount: '500000000', // 500 USDC
          requester: DEMO_USERS.BOB,
          recipient: '0xELECTRONICS00000000000000000000000001',
          reason: 'Equipment upgrade for improved productivity',
          status: 'approved',
          metadata: {
            category: 'Equipment',
            item: 'MacBook Pro 14"',
            urgency: 'high'
          }
        },
        {
          vaultId: demoVaultId,
          policyId: demoPolicyId,
          type: 'payment',
          name: 'Software Subscriptions',
          description: 'Annual software licenses renewal',
          token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          totalAmount: '250000000', // 250 USDC
          requester: DEMO_USERS.ALICE,
          recipient: '0xSOFTWARE00000000000000000000000000001',
          reason: 'Essential tools for team productivity',
          status: 'draft',
          metadata: {
            category: 'Software',
            services: ['Figma', 'GitHub', 'Notion'],
            billingCycle: 'annual'
          }
        }
      ]);
      console.log('✅ Demo escrows created');
    } else {
      console.log('✅ Demo escrows already exist, skipping');
    }

    // 6. Create Demo Shareable Keys
    console.log('🔑 Creating demo shareable keys...');
    const existingKeys = await db.query.shareableKeys.findMany({
      where: eq(shareableKeys.vaultId, demoVaultId)
    });

    if (existingKeys.length === 0) {
      await db.insert(shareableKeys).values([
        {
          vaultId: demoVaultId,
          name: 'Accountant Access',
          description: 'Read-only access for external accountant',
          keyType: 'vault',
          permissions: ['view_vault', 'view_escrows', 'view_members'],
          shareUrl: 'https://wallet.example.com/invite/shareable/demo-accountant-key',
          token: 'demo-accountant-access-token-001',
          maxUses: null, // unlimited
          usageCount: 5,
          status: 'active',
          createdBy: DEMO_USERS.ALICE,
          metadata: {
            purpose: 'Financial audit',
            externalParty: 'ABC Accounting Firm'
          }
        },
        {
          vaultId: demoVaultId,
          name: 'Investor View Key',
          description: 'Limited view for potential investors',
          keyType: 'vault',
          permissions: ['view_vault'],
          shareUrl: 'https://wallet.example.com/invite/shareable/demo-investor-key',
          token: 'demo-investor-view-token-002',
          maxUses: 10,
          usageCount: 3,
          expiresAt: new Date('2025-12-31'),
          status: 'active',
          createdBy: DEMO_USERS.ALICE,
          metadata: {
            purpose: 'Due diligence',
            externalParty: 'XYZ Ventures'
          }
        }
      ]);
      console.log('✅ Demo shareable keys created');
    } else {
      console.log('✅ Demo shareable keys already exist, skipping');
    }

    console.log('');
    console.log('🎉 Demo data seed completed successfully!');
    console.log('');
    console.log('Demo Vault Info:');
    console.log(`  Address: ${DEMO_VAULT_ADDRESS}`);
    console.log(`  Chain: Base Sepolia (${DEMO_CHAIN_ID})`);
    console.log(`  UUID: ${DEMO_VAULT_UUID}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run if executed directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
