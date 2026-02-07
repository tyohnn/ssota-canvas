-- Fix user-avatars storage policies (align with 20251121141354 simplified version)
-- Handles: main (no policies), dev (old policies), local (current policies)
-- Enables org icon + profile avatar uploads via bucket_id-only check

-- 1. Drop old policy names only if they exist (avoids NOTICE)
DO $$
DECLARE
  pol text;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname IN (
    'Users can upload their own avatar', 'Users can update their own avatar', 'Users can delete their own avatar',
    'Authenticated users can upload avatars', 'Anyone can read avatars', 'Authenticated users can update avatars', 'Authenticated users can delete avatars'
  )
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol);
  END LOOP;
END $$;

-- 2. Create unified policies (bucket_id only - allows org icons + profile avatars)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Anyone can read avatars" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'user-avatars');
