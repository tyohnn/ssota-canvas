-- Image Assets Storage RLS Policies
-- 
-- 워크스페이스 중심 이미지 저장소
-- RLS는 최소한의 방어선만 (인증된 사용자)
-- 비즈니스 로직은 Server에서 Signed URL로 처리

-- Enable RLS on storage.objects for image-assets bucket
-- (RLS is already enabled on storage.objects table by default)

-- Policy 1: Authenticated users can SELECT files
CREATE POLICY "image_assets_authenticated_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'image-assets' AND 
  auth.role() = 'authenticated'
);

-- Policy 2: Authenticated users can INSERT files
CREATE POLICY "image_assets_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'image-assets' AND 
  auth.role() = 'authenticated'
);

-- Policy 3: Authenticated users can UPDATE files
CREATE POLICY "image_assets_authenticated_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'image-assets' AND 
  auth.role() = 'authenticated'
);

-- Policy 4: Authenticated users can DELETE files
CREATE POLICY "image_assets_authenticated_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'image-assets' AND 
  auth.role() = 'authenticated'
);

