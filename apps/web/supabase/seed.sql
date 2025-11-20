-- ============================================
-- Supabase Local Development Seed Data (OPTIONAL)
-- ============================================
-- ⚠️ This seed is DISABLED by default (see supabase/config.toml)
--
-- WHY: 
-- - We don't provide email/password login in production
-- - Adding dev-only UI breaks SSOT principles
-- - Developers should use Google OAuth (same as production)
-- - processUserRegistrationAction automatically creates all necessary data
--
-- WHEN TO USE:
-- - E2E testing that needs pre-existing accounts
-- - Specific test scenarios requiring known data
-- - Manual testing of multi-user features
--
-- TO ENABLE:
-- supabase db reset --seed
-- ============================================

-- Clean existing data (for idempotency)
DO $$ 
BEGIN
  -- Disable triggers temporarily to avoid constraint issues
  SET session_replication_role = replica;

  -- Delete in reverse dependency order
  DELETE FROM page_favorites WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM workspace_members WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM workspace_invitations WHERE invited_user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM pages WHERE workspace_id IN (
    SELECT id FROM workspaces WHERE organization_id IN (
      SELECT id FROM organizations WHERE owner_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333'
      )
    )
  );
  
  DELETE FROM workspaces WHERE organization_id IN (
    SELECT id FROM organizations WHERE owner_id IN (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333'
    )
  );
  
  DELETE FROM organization_members WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM invitations WHERE invitee_user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM notifications WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM organizations WHERE owner_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM profiles WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );
  
  DELETE FROM auth.users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );

  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
END $$;

-- ============================================
-- Test User 1: Admin User
-- ============================================

-- 0. Create Auth User (auth.users schema)
-- Note: For local development, you can either:
--   1. Enable email/password auth in supabase/config.toml
--   2. Use Magic Link via Inbucket (http://127.0.0.1:54324)
--   3. Replace with your actual Google account for OAuth testing
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@test.com',  -- 또는 실제 Google 계정 이메일
  crypt('password123', gen_salt('bf')),  -- 로컬 개발용 (이메일/비밀번호 활성화 시)
  NOW(),
  '{"provider":"email","providers":["email"]}',  -- 또는 '{"provider":"google","providers":["google"]}'
  '{"name":"Admin User","avatar_url":"https://avatar.vercel.sh/admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 1. Create Profile
INSERT INTO profiles (id, email, name, avatar_url, created_at, updated_at, user_type) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@test.com',
    'Admin User',
    'https://avatar.vercel.sh/admin',
    NOW(),
    NOW(),
    'ADMIN'
  );

-- 2. Create Default Organization
INSERT INTO organizations (id, name, organization_type, owner_id, is_default, created_at, updated_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Admin User''s Organization',
    'personal',
    '11111111-1111-1111-1111-111111111111',
    true,
    NOW(),
    NOW()
  );

-- 3. Create Organization Member (Owner)
INSERT INTO organization_members (id, organization_id, user_id, role, joined_at, created_at, updated_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner',
    NOW(),
    NOW(),
    NOW()
  );

-- 4. Create Default Workspace (Team Workspace)
INSERT INTO workspaces (id, organization_id, name, description, icon, is_default, is_personal, owner_id, deletable, created_by, created_at, updated_at) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'General',
    'Default team workspace',
    'users',
    true,
    false,
    NULL,
    false,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
  );

-- 5. Create Personal Workspace
INSERT INTO workspaces (id, organization_id, name, description, icon, is_default, is_personal, owner_id, deletable, created_by, created_at, updated_at) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Admin User''s Space',
    'Personal workspace',
    'user',
    false,
    true,
    '11111111-1111-1111-1111-111111111111',
    true,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
  );

-- 6. Add User to Workspaces
INSERT INTO workspace_members (workspace_id, user_id, joined_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', NOW());

-- 7. Create Welcome Page in Default Workspace
INSERT INTO pages (id, workspace_id, parent_id, title, icon, "order", depth, created_by, created_at, updated_at) VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    NULL,
    'Welcome',
    '👋',
    0,
    0,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
  );

-- 8. Create Getting Started Page in Personal Workspace
INSERT INTO pages (id, workspace_id, parent_id, title, icon, "order", depth, created_by, created_at, updated_at) VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    NULL,
    'Getting Started',
    '🚀',
    0,
    0,
    '11111111-1111-1111-1111-111111111111',
    NOW(),
    NOW()
  );

-- ============================================
-- Test User 2: General User
-- ============================================

-- 0. Create Auth User
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'user@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Test User","avatar_url":"https://avatar.vercel.sh/user"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 1. Create Profile
INSERT INTO profiles (id, email, name, avatar_url, created_at, updated_at, user_type) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'user@test.com',
    'Test User',
    'https://avatar.vercel.sh/user',
    NOW(),
    NOW(),
    'GENERAL'
  );

-- 2. Create Default Organization
INSERT INTO organizations (id, name, organization_type, owner_id, is_default, created_at, updated_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22',
    'Test User''s Organization',
    'personal',
    '22222222-2222-2222-2222-222222222222',
    true,
    NOW(),
    NOW()
  );

-- 3. Create Organization Member (Owner)
INSERT INTO organization_members (id, organization_id, user_id, role, joined_at, created_at, updated_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa23',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22',
    '22222222-2222-2222-2222-222222222222',
    'owner',
    NOW(),
    NOW(),
    NOW()
  );

-- 4. Create Default Workspace
INSERT INTO workspaces (id, organization_id, name, description, icon, is_default, is_personal, owner_id, deletable, created_by, created_at, updated_at) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22',
    'General',
    'Default team workspace',
    'users',
    true,
    false,
    NULL,
    false,
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  );

-- 5. Create Personal Workspace
INSERT INTO workspaces (id, organization_id, name, description, icon, is_default, is_personal, owner_id, deletable, created_by, created_at, updated_at) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa22',
    'Test User''s Space',
    'Personal workspace',
    'user',
    false,
    true,
    '22222222-2222-2222-2222-222222222222',
    true,
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  );

-- 6. Add User to Workspaces
INSERT INTO workspace_members (workspace_id, user_id, joined_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', '22222222-2222-2222-2222-222222222222', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23', '22222222-2222-2222-2222-222222222222', NOW());

-- 7. Create Welcome Page
INSERT INTO pages (id, workspace_id, parent_id, title, icon, "order", depth, created_by, created_at, updated_at) VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc22',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22',
    NULL,
    'Welcome',
    '👋',
    0,
    0,
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  );

-- 8. Create Getting Started Page in Personal Workspace
INSERT INTO pages (id, workspace_id, parent_id, title, icon, "order", depth, created_by, created_at, updated_at) VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc23',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb23',
    NULL,
    'My First Page',
    '📝',
    0,
    0,
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
  );

-- ============================================
-- Test User 3: Developer User
-- ============================================

-- 0. Create Auth User
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Developer User","avatar_url":"https://avatar.vercel.sh/dev"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 1. Create Profile
INSERT INTO profiles (id, email, name, avatar_url, created_at, updated_at, user_type) VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'dev@test.com',
    'Developer User',
    'https://avatar.vercel.sh/dev',
    NOW(),
    NOW(),
    'GENERAL'
  );

-- 2. Create Default Organization
INSERT INTO organizations (id, name, organization_type, owner_id, is_default, created_at, updated_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa33',
    'Developer User''s Organization',
    'startup',
    '33333333-3333-3333-3333-333333333333',
    true,
    NOW(),
    NOW()
  );

-- 3. Create Organization Member (Owner)
INSERT INTO organization_members (id, organization_id, user_id, role, joined_at, created_at, updated_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa34',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa33',
    '33333333-3333-3333-3333-333333333333',
    'owner',
    NOW(),
    NOW(),
    NOW()
  );

-- 4. Create Default Workspace
INSERT INTO workspaces (id, organization_id, name, description, icon, is_default, is_personal, owner_id, deletable, created_by, created_at, updated_at) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa33',
    'General',
    'Default team workspace',
    'users',
    true,
    false,
    NULL,
    false,
    '33333333-3333-3333-3333-333333333333',
    NOW(),
    NOW()
  );

-- 5. Create Personal Workspace
INSERT INTO workspaces (id, organization_id, name, description, icon, is_default, is_personal, owner_id, deletable, created_by, created_at, updated_at) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb34',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa33',
    'Developer User''s Space',
    'Personal workspace',
    'user',
    false,
    true,
    '33333333-3333-3333-3333-333333333333',
    true,
    '33333333-3333-3333-3333-333333333333',
    NOW(),
    NOW()
  );

-- 6. Add User to Workspaces
INSERT INTO workspace_members (workspace_id, user_id, joined_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33', '33333333-3333-3333-3333-333333333333', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb34', '33333333-3333-3333-3333-333333333333', NOW());

-- 7. Create Welcome Page
INSERT INTO pages (id, workspace_id, parent_id, title, icon, "order", depth, created_by, created_at, updated_at) VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc33',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb33',
    NULL,
    'Welcome',
    '👋',
    0,
    0,
    '33333333-3333-3333-3333-333333333333',
    NOW(),
    NOW()
  );

-- 8. Create Project Page in Personal Workspace
INSERT INTO pages (id, workspace_id, parent_id, title, icon, "order", depth, created_by, created_at, updated_at) VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc34',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb34',
    NULL,
    'My Projects',
    '💻',
    0,
    0,
    '33333333-3333-3333-3333-333333333333',
    NOW(),
    NOW()
  );

-- ============================================
-- Summary
-- ============================================
-- Created 3 test users with complete setups:
--
-- 1. Admin User (admin@test.com)
--    - UUID: 11111111-1111-1111-1111-111111111111
--    - Type: ADMIN
--    - Organization: Admin User's Organization
--    - Workspaces: General (team), Admin User's Space (personal)
--    - Pages: Welcome, Getting Started
--
-- 2. Test User (user@test.com)
--    - UUID: 22222222-2222-2222-2222-222222222222
--    - Type: GENERAL
--    - Organization: Test User's Organization
--    - Workspaces: General (team), Test User's Space (personal)
--    - Pages: Welcome, My First Page
--
-- 3. Developer User (dev@test.com)
--    - UUID: 33333333-3333-3333-3333-333333333333
--    - Type: GENERAL
--    - Organization: Developer User's Organization (startup)
--    - Workspaces: General (team), Developer User's Space (personal)
--    - Pages: Welcome, My Projects
--
-- Usage:
--   supabase db reset  # Applies all migrations + this seed
--
-- Note: These test accounts match the processUserRegistrationAction flow
-- ============================================

