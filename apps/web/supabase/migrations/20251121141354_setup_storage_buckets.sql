-- Storage Buckets Setup
-- This migration creates storage buckets and sets up RLS policies for file access

-- ============================================================================
-- 1. Create Storage Buckets
-- ============================================================================

-- Canvas Assets Bucket (Private - for images, PDFs, audio files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'canvas-assets',
  'canvas-assets',
  false,
  52428800, -- 50MB in bytes
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp3'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- User Avatars Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. RLS Policies for canvas-assets bucket
-- ============================================================================

-- Policy: Users can upload files to their organization's workspace
CREATE POLICY "Users can upload to their org workspace"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'canvas-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can read files from their organization's workspace
CREATE POLICY "Users can read from their org workspace"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'canvas-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can update files in their organization's workspace
CREATE POLICY "Users can update in their org workspace"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'canvas-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete files from their organization's workspace
CREATE POLICY "Users can delete from their org workspace"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'canvas-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 3. RLS Policies for user-avatars bucket (Public bucket)
-- ============================================================================

-- Policy: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can read avatars (public bucket)
CREATE POLICY "Anyone can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

