/**
 * Migrate Existing Users to Closed Beta System
 *
 * This script updates existing users' beta status.
 * Run this script ONCE after deploying the beta access migration.
 *
 * Usage:
 *   pnpm tsx scripts/migrate-existing-users.ts
 */

import { adminDb } from '@/db';
import { profiles } from '@/db/schema';
import { lt, isNull } from 'drizzle-orm';

async function migrateExistingUsers() {
  console.log('🚀 Starting user migration to closed beta system...\n');

  try {
    // Get all existing users created before the migration date
    // Adjust this date to match your deployment date
    const migrationDate = new Date('2025-11-27T00:00:00Z');

    const existingUsers = await adminDb
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        created_at: profiles.created_at,
        beta_status: profiles.beta_status,
      })
      .from(profiles)
      .where(
        // Find users created before migration AND with null deleted_at
        lt(profiles.created_at, migrationDate)
      );

    console.log(`📊 Found ${existingUsers.length} existing users\n`);

    if (existingUsers.length === 0) {
      console.log('✅ No users to migrate. Done!\n');
      return;
    }

    // Display users
    console.log('Users to migrate:');
    console.log('─'.repeat(80));
    existingUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.email} (${user.name || 'No name'}) - Created: ${user.created_at.toLocaleDateString()}`
      );
    });
    console.log('─'.repeat(80));
    console.log();

    // Ask for confirmation (in production, you might want to automate this)
    console.log(
      '⚠️  This script will set all these users to beta_status = "pending"'
    );
    console.log(
      'ℹ️  You should manually review and approve users after this migration.\n'
    );
    console.log(
      '💡 To approve users, use: pnpm tsx scripts/approve-beta-users.ts [email]\n'
    );

    // Update all existing users to pending status
    const updateResult = await adminDb
      .update(profiles)
      .set({
        beta_status: 'pending',
        updated_at: new Date(),
      })
      .where(lt(profiles.created_at, migrationDate));

    console.log(`✅ Successfully updated ${existingUsers.length} users\n`);

    // Summary
    console.log('📋 Migration Summary:');
    console.log(`   Total users migrated: ${existingUsers.length}`);
    console.log(`   Status set to: pending`);
    console.log();
    console.log('📝 Next Steps:');
    console.log('   1. Review the user list in Supabase Studio');
    console.log('   2. Approve active users using the approve script');
    console.log(
      '   3. Communicate with users about the closed beta transition'
    );
    console.log();
    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateExistingUsers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
