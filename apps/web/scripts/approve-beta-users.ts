/**
 * Approve Beta Users
 *
 * CLI tool to approve beta applications for users.
 *
 * Usage:
 *   # Approve single user
 *   pnpm tsx scripts/approve-beta-users.ts user@example.com
 *
 *   # Approve multiple users
 *   pnpm tsx scripts/approve-beta-users.ts user1@example.com user2@example.com
 *
 *   # Approve all pending users (use with caution!)
 *   pnpm tsx scripts/approve-beta-users.ts --all
 */

import { adminDb } from '@/db';
import { profiles } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

// Get admin user ID from environment or use a default
// In production, you should set this to your admin profile ID
const ADMIN_PROFILE_ID =
  process.env.ADMIN_PROFILE_ID || '00000000-0000-0000-0000-000000000000';

async function approveUser(email: string): Promise<boolean> {
  try {
    const [user] = await adminDb
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        beta_status: profiles.beta_status,
      })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return false;
    }

    if (user.beta_status === 'approved') {
      console.log(`ℹ️  User already approved: ${email}`);
      return true;
    }

    await adminDb
      .update(profiles)
      .set({
        beta_status: 'approved',
        beta_approved_at: new Date(),
        beta_approved_by: ADMIN_PROFILE_ID,
        updated_at: new Date(),
      })
      .where(eq(profiles.id, user.id));

    console.log(
      `✅ Approved: ${email} (${user.name || 'No name'}) - Status was: ${user.beta_status}`
    );
    return true;
  } catch (error) {
    console.error(`❌ Error approving ${email}:`, error);
    return false;
  }
}

async function approveAllPending(): Promise<void> {
  try {
    const pendingUsers = await adminDb
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
      })
      .from(profiles)
      .where(eq(profiles.beta_status, 'pending'));

    console.log(`📊 Found ${pendingUsers.length} pending users\n`);

    if (pendingUsers.length === 0) {
      console.log('✅ No pending users to approve\n');
      return;
    }

    console.log('⚠️  WARNING: This will approve ALL pending users!');
    console.log('Users to approve:');
    console.log('─'.repeat(80));
    pendingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`);
    });
    console.log('─'.repeat(80));
    console.log();

    // Update all
    await adminDb
      .update(profiles)
      .set({
        beta_status: 'approved',
        beta_approved_at: new Date(),
        beta_approved_by: ADMIN_PROFILE_ID,
        updated_at: new Date(),
      })
      .where(eq(profiles.beta_status, 'pending'));

    console.log(`✅ Successfully approved ${pendingUsers.length} users\n`);
  } catch (error) {
    console.error('❌ Error approving all users:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  pnpm tsx scripts/approve-beta-users.ts user@example.com');
    console.log(
      '  pnpm tsx scripts/approve-beta-users.ts user1@example.com user2@example.com'
    );
    console.log('  pnpm tsx scripts/approve-beta-users.ts --all');
    console.log();
    process.exit(1);
  }

  console.log('🚀 Beta User Approval Tool\n');

  if (args[0] === '--all') {
    await approveAllPending();
  } else {
    // Approve specific users
    let successCount = 0;
    for (const email of args) {
      const success = await approveUser(email);
      if (success) successCount++;
    }

    console.log();
    console.log('📋 Summary:');
    console.log(`   Total processed: ${args.length}`);
    console.log(`   Successfully approved: ${successCount}`);
    console.log(`   Failed: ${args.length - successCount}`);
  }

  console.log();
  console.log('✅ Done!\n');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
