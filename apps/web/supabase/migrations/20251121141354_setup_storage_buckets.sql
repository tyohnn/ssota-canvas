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

-- Image Assets Bucket (Private - for workspace image blocks)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'image-assets',
  'image-assets',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. RLS Policies for canvas-assets bucket (Simplified for local development)
-- ============================================================================

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload to canvas-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'canvas-assets');

-- Policy: Authenticated users can read files
CREATE POLICY "Authenticated users can read from canvas-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'canvas-assets');

-- Policy: Authenticated users can update files
CREATE POLICY "Authenticated users can update in canvas-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'canvas-assets');

-- Policy: Authenticated users can delete files
CREATE POLICY "Authenticated users can delete from canvas-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'canvas-assets');

-- ============================================================================
-- 3. RLS Policies for user-avatars bucket (Public bucket - Simplified)
-- ============================================================================

-- Policy: Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');

-- Policy: Anyone can read avatars (public bucket)
CREATE POLICY "Anyone can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Policy: Authenticated users can update avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars');

-- Policy: Authenticated users can delete avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars');

