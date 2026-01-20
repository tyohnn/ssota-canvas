-- Enable Realtime for notifications table
-- This migration adds the notifications table to the supabase_realtime publication
-- so that clients can subscribe to real-time changes without manual UI configuration
--
-- Created: 2026-01-20
-- Purpose: Automate Realtime publication setup for notifications table

-- Ensure the supabase_realtime publication exists
-- (It should already exist in Supabase, but we check to be safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add notifications table to the supabase_realtime publication
-- This enables real-time subscriptions for INSERT, UPDATE, and DELETE events
-- Use DO block to safely add table only if not already in publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Comments
COMMENT ON PUBLICATION supabase_realtime IS 
  'Supabase Realtime publication - enables real-time subscriptions for published tables';
