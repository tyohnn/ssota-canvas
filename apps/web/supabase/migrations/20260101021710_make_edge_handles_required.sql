-- Migration: Make edge handles required (NOT NULL)
-- Description: 
-- - Set source_handle and target_handle to NOT NULL
-- - Fill existing NULL values with default values ('right' for source, 'left' for target)
-- - This ensures all edges have explicit handle positions for consistent rendering
--
-- Rationale:
-- - Entity level requires handles to always exist
-- - DB schema should match domain model requirements
-- - Ensures consistent edge rendering after page refresh

-- 1. Fill existing NULL values with default values
-- Source handle: default to 'right' (most common for outgoing connections)
-- Target handle: default to 'left' (most common for incoming connections)
-- IMPORTANT: Update ALL NULL values including deleted edges to prevent constraint errors
UPDATE edges
SET 
  source_handle = COALESCE(source_handle, 'right'),
  target_handle = COALESCE(target_handle, 'left')
WHERE 
  source_handle IS NULL OR target_handle IS NULL;

-- 2. Verify no NULL values remain before adding constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM edges 
    WHERE source_handle IS NULL OR target_handle IS NULL
  ) THEN
    RAISE EXCEPTION 'Still found NULL values in edges.source_handle or edges.target_handle after update';
  END IF;
END $$;

-- 3. Add NOT NULL constraints (idempotent - safe to run even if already applied)
DO $$
BEGIN
  -- Check if columns are already NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'edges' 
      AND column_name = 'source_handle' 
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE edges ALTER COLUMN source_handle SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'edges' 
      AND column_name = 'target_handle' 
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE edges ALTER COLUMN target_handle SET NOT NULL;
  END IF;
END $$;

-- 4. Add default values for future inserts
ALTER TABLE edges
  ALTER COLUMN source_handle SET DEFAULT 'right',
  ALTER COLUMN target_handle SET DEFAULT 'left';

-- 5. Add check constraint to ensure valid handle values
-- Drop existing constraints if they exist (idempotent)
ALTER TABLE edges
  DROP CONSTRAINT IF EXISTS edges_source_handle_valid;

ALTER TABLE edges
  DROP CONSTRAINT IF EXISTS edges_target_handle_valid;

-- Add new constraints
ALTER TABLE edges
  ADD CONSTRAINT edges_source_handle_valid 
    CHECK (source_handle IN ('left', 'right', 'top', 'bottom'));

ALTER TABLE edges
  ADD CONSTRAINT edges_target_handle_valid 
    CHECK (target_handle IN ('left', 'right', 'top', 'bottom'));
