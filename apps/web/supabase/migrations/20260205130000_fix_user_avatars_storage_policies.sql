-- Fix user-avatars storage policies (align with 20251121141354 simplified version)
-- Handles: main (no policies), dev (old policies), local (current policies)
-- Enables org icon + profile avatar uploads via bucket_id-only check

-- 1. Drop old policy names (from ae48abf - strict path-based)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 2. Drop current policy names (from 96b8ced, in case of re-run)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

-- 3. Create unified policies (bucket_id only - allows org icons + profile avatars)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Anyone can read avatars" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'user-avatars');
