-- Migration: Add Beta Access Fields to profiles table
-- Date: 2025-11-26
-- Description: Add beta status management fields for closed beta implementation

-- 1. Create beta_status enum type (simplified: pending or approved only)
CREATE TYPE beta_status AS ENUM ('pending', 'approved');

-- 2. Add beta access fields to profiles table
ALTER TABLE profiles 
ADD COLUMN beta_status beta_status NOT NULL DEFAULT 'pending',
ADD COLUMN beta_application jsonb,
ADD COLUMN beta_applied_at timestamptz,
ADD COLUMN beta_approved_at timestamptz,
ADD COLUMN beta_approved_by uuid;

-- 2.5. Add foreign key constraint for beta_approved_by (self-referencing)
ALTER TABLE profiles
ADD CONSTRAINT profiles_beta_approved_by_fkey 
FOREIGN KEY (beta_approved_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- 3. Create performance indexes
CREATE INDEX idx_profiles_beta_status 
ON profiles(beta_status) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_profiles_beta_pending 
ON profiles(beta_status, beta_applied_at) 
WHERE beta_status = 'pending' AND deleted_at IS NULL;

-- 4. Add comments for documentation
COMMENT ON COLUMN profiles.beta_status IS 'Beta access status: pending (default), approved';
COMMENT ON COLUMN profiles.beta_application IS 'Beta application form data (JSON): name, organization, purpose, use_case';
COMMENT ON COLUMN profiles.beta_applied_at IS 'Timestamp when beta application was submitted';
COMMENT ON COLUMN profiles.beta_approved_at IS 'Timestamp when beta access was approved';
COMMENT ON COLUMN profiles.beta_approved_by IS 'Profile ID of admin who approved the application';

