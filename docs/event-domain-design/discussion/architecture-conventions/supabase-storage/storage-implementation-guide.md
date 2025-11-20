# Supabase Storage 구현 가이드

## 📋 개요

본 문서는 [Supabase Storage 전략](./supabase-storage-strategy.md)을 실제로 구현하기 위한 단계별 가이드입니다.

---

## 🚀 Phase 1: 기본 이미지 업로드 구현

### 1. Supabase Storage Bucket 생성

#### A. Supabase Dashboard에서 설정

1. **Supabase Dashboard** → **Storage** → **New bucket**

2. **Buckets 생성**:

```
Bucket 1: user-avatars
- Public: ✅ Yes
- File size limit: 2MB
- Allowed MIME types: image/*

Bucket 2: canvas-assets
- Public: ❌ No (Private)
- File size limit: 500MB
- Allowed MIME types: image/*, video/*, application/*, text/*

Bucket 3: thumbnails
- Public: ❌ No (Private)
- File size limit: 5MB
- Allowed MIME types: image/*
```

#### B. RLS (Row Level Security) Policies 설정

```sql
-- canvas-assets bucket: SELECT policy
CREATE POLICY "Users can view their org's files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- canvas-assets bucket: INSERT policy
CREATE POLICY "Users can upload to their org's folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- canvas-assets bucket: DELETE policy
CREATE POLICY "Users can delete their org's files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- thumbnails bucket: Similar policies
CREATE POLICY "Users can view their org's thumbnails"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);
```

### 2. 폴더 구조 생성

```
apps/web/src/domains/storage/
├── hooks/
│   ├── use-supabase-storage.ts      # 메인 훅
│   └── use-image-upload.ts           # 이미지 전용 훅
├── lib/
│   ├── path-generator.ts             # Path 생성 로직
│   ├── validation.ts                 # 파일 검증
│   └── compression.ts                # 이미지 압축
├── types/
│   └── storage.types.ts              # 타입 정의
└── actions/
    └── storage.actions.ts            # Server Actions
```

### 3. 타입 정의 (`storage.types.ts`)

```typescript
// apps/web/src/domains/storage/types/storage.types.ts

export enum StorageBucket {
  USER_AVATARS = 'user-avatars',
  CANVAS_ASSETS = 'canvas-assets',
  THUMBNAILS = 'thumbnails',
  EXPORTS = 'exports',
}

export enum AssetCategory {
  IMAGES = 'images',
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
  CODE = 'code',
}

export interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  path?: string; // Optional: auto-generated if not provided
  onProgress?: (progress: number) => void;
  compress?: boolean; // For images
}

export interface UploadResult {
  url: string;          // Signed URL (private) or Public URL
  path: string;         // Full path in storage
  publicUrl?: string;   // Only for public buckets
  size: number;
  mimeType: string;
  width?: number;       // For images
  height?: number;      // For images
}

export interface PathOptions {
  orgId: string;
  workspaceId: string;
  pageId: string;
  blockId: string;
  file: File;
}

export interface StorageError {
  code: string;
  message: string;
  details?: any;
}
```

### 4. Path Generator (`path-generator.ts`)

```typescript
// apps/web/src/domains/storage/lib/path-generator.ts

import { AssetCategory, PathOptions } from '../types/storage.types';

export function generateAssetPath(options: PathOptions): string {
  const { orgId, workspaceId, pageId, blockId, file } = options;

  // Extract extension
  const ext = getFileExtension(file.name);

  // Generate UUID
  const uuid = crypto.randomUUID();

  // Timestamp
  const timestamp = Date.now();

  // Determine category
  const category = getCategoryFromMimeType(file.type);

  // Build path: {category}/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}
  return `${category}/${orgId}/${workspaceId}/${pageId}/${blockId}/${timestamp}-${uuid}.${ext}`;
}

function getCategoryFromMimeType(mimeType: string): AssetCategory {
  if (mimeType.startsWith('image/')) return AssetCategory.IMAGES;
  if (mimeType.startsWith('video/')) return AssetCategory.VIDEOS;
  if (mimeType.startsWith('application/pdf')) return AssetCategory.DOCUMENTS;
  if (
    mimeType.includes('code') ||
    mimeType.includes('text') ||
    mimeType.startsWith('application/json')
  ) {
    return AssetCategory.CODE;
  }
  return AssetCategory.DOCUMENTS;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 100);
}
```

### 5. Validation (`validation.ts`)

```typescript
// apps/web/src/domains/storage/lib/validation.ts

import { StorageError } from '../types/storage.types';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다.`);
  }

  // Check image size
  if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`이미지 크기가 ${MAX_IMAGE_SIZE / 1024 / 1024}MB를 초과합니다.`);
  }

  // Check MIME type
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`);
  }
}

export function isImage(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

export function isVideo(file: File): boolean {
  return ALLOWED_VIDEO_TYPES.includes(file.type);
}
```

### 6. Image Compression (`compression.ts`)

```typescript
// apps/web/src/domains/storage/lib/compression.ts

import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp', // Convert to WebP
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, mergedOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original if compression fails
    return file;
  }
}

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
```

### 7. Main Hook (`use-supabase-storage.ts`)

```typescript
// apps/web/src/domains/storage/hooks/use-supabase-storage.ts

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  UploadOptions,
  UploadResult,
  StorageBucket,
  StorageError,
} from '../types/storage.types';
import { generateAssetPath } from '../lib/path-generator';
import { validateFile, isImage } from '../lib/validation';
import { compressImage, getImageDimensions } from '../lib/compression';

export function useSupabaseStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<StorageError | null>(null);

  const supabase = createClient();

  const upload = useCallback(
    async (options: UploadOptions): Promise<UploadResult> => {
      const { bucket, file, path: providedPath, onProgress, compress = true } = options;

      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // 1. Validate file
        validateFile(file);

        // 2. Compress image if needed
        let fileToUpload = file;
        if (isImage(file) && compress) {
          fileToUpload = await compressImage(file);
          setProgress(20);
        }

        // 3. Generate path (if not provided)
        // TODO: Get current context (orgId, workspaceId, pageId, blockId)
        const path = providedPath || 'temp/test.jpg'; // Placeholder

        setProgress(40);

        // 4. Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        setProgress(70);

        // 5. Get URLs
        let url: string;
        let publicUrl: string | undefined;

        if (bucket === StorageBucket.USER_AVATARS) {
          // Public bucket
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
          url = publicUrlData.publicUrl;
          publicUrl = publicUrlData.publicUrl;
        } else {
          // Private bucket - generate signed URL
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage.from(bucket).createSignedUrl(path, 3600); // 1 hour

          if (signedUrlError) {
            throw signedUrlError;
          }

          url = signedUrlData.signedUrl;
        }

        setProgress(90);

        // 6. Get image dimensions (if image)
        let width: number | undefined;
        let height: number | undefined;

        if (isImage(file)) {
          try {
            const dimensions = await getImageDimensions(fileToUpload);
            width = dimensions.width;
            height = dimensions.height;
          } catch (err) {
            console.warn('Failed to get image dimensions:', err);
          }
        }

        setProgress(100);

        return {
          url,
          path,
          publicUrl,
          size: fileToUpload.size,
          mimeType: fileToUpload.type,
          width,
          height,
        };
      } catch (err: any) {
        const storageError: StorageError = {
          code: err.code || 'UNKNOWN_ERROR',
          message: err.message || '파일 업로드에 실패했습니다.',
          details: err,
        };
        setError(storageError);
        throw storageError;
      } finally {
        setIsUploading(false);
      }
    },
    [supabase]
  );

  const deleteFile = useCallback(
    async (bucket: StorageBucket, path: string): Promise<void> => {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        throw error;
      }
    },
    [supabase]
  );

  const getSignedUrl = useCallback(
    async (
      bucket: StorageBucket,
      path: string,
      expiresIn: number = 3600
    ): Promise<string> => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return data.signedUrl;
    },
    [supabase]
  );

  const getPublicUrl = useCallback(
    (bucket: StorageBucket, path: string): string => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase]
  );

  return {
    upload,
    deleteFile,
    getSignedUrl,
    getPublicUrl,
    isUploading,
    progress,
    error,
  };
}
```

### 8. ImageBlock에서 사용

```typescript
// apps/web/src/domains/block-management/frontend/components/block/image/image-block.tsx

import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

export const ImageBlock = memo(function ImageBlock({ ... }: NodeProps) {
  // ... existing code ...
  
  const { upload, isUploading, progress, error } = useSupabaseStorage();
  const { updateProperty } = useBlockPropertyUpdate();

  // Replace useFileUpload with Supabase Storage
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      // Upload to Supabase Storage
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        compress: true,
        onProgress: (p) => console.log(`Upload progress: ${p}%`),
      });

      // Update block property with the URL
      await updateProperty(
        nodeData.blockId,
        'properties.imageUrl',
        result.url, // Use signed URL
        nodeData
      );
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }, [upload, updateProperty, nodeData]);

  // ... rest of component ...
});
```

### 9. ImageUploadProperty에서 사용

```typescript
// apps/web/src/domains/block-management/frontend/components/editor/property-input/inputs/image-upload-property.tsx

import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

export function ImageUploadProperty({ ... }: ImageUploadPropertyProps) {
  const { upload, isUploading, progress, error: uploadError } = useSupabaseStorage();

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        compress: true,
      });

      // Call onChange with the URL
      await onChange(result.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }, [upload, onChange]);

  // ... rest of component ...
}
```

---

## 📋 체크리스트

### Phase 1 구현 체크리스트

- [ ] **Supabase Dashboard 설정**
  - [ ] `canvas-assets` bucket 생성 (Private)
  - [ ] `user-avatars` bucket 생성 (Public)
  - [ ] `thumbnails` bucket 생성 (Private)
  - [ ] RLS policies 설정

- [ ] **타입 및 유틸리티**
  - [ ] `storage.types.ts` 작성
  - [ ] `path-generator.ts` 작성
  - [ ] `validation.ts` 작성
  - [ ] `compression.ts` 작성

- [ ] **Hooks**
  - [ ] `use-supabase-storage.ts` 작성
  - [ ] 테스트 작성

- [ ] **Integration**
  - [ ] `ImageBlock`에서 Supabase Storage 사용
  - [ ] `ImageUploadProperty`에서 Supabase Storage 사용
  - [ ] Blob URL → Signed URL 전환
  - [ ] 에러 처리 및 로딩 상태 UI

- [ ] **테스트**
  - [ ] 이미지 업로드 테스트
  - [ ] 권한 테스트 (다른 org 접근 불가)
  - [ ] 압축 테스트
  - [ ] 에러 케이스 테스트

---

## 🔧 개발 환경 설정

### 1. 환경 변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. 패키지 설치

```bash
pnpm add browser-image-compression
```

### 3. Supabase Client 설정 확인

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

---

## 📖 다음 단계

Phase 1이 완료되면:
1. [Phase 2: 최적화 및 썸네일](./supabase-storage-strategy.md#phase-2-최적화-및-썸네일)
2. [Phase 3: 비디오 및 다양한 파일](./supabase-storage-strategy.md#phase-3-비디오-및-다양한-파일-타입)
3. [Phase 4: 공유 기능](./supabase-storage-strategy.md#phase-4-공유-기능)

---

## 📝 참고 자료

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)

