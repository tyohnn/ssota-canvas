import { sql } from 'drizzle-orm';

// Migration: Add user management fields for Story UM-001
export const addUserManagementFields = sql`
  -- Add clerk_id column (unique identifier for Clerk integration)
  ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

  -- Add status column for soft delete functionality
  ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

  -- Add deleted_at column for soft delete timestamp
  ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

  -- Add indexes for performance optimization
  CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users (clerk_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
  CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

  -- Update existing users to have clerk_id = id (migration for existing data)
  UPDATE users SET clerk_id = id WHERE clerk_id IS NULL;

  -- Ensure clerk_id is not null after migration
  ALTER TABLE users ALTER COLUMN clerk_id SET NOT NULL;
`;