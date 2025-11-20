# Supabase Storage 전략 및 설계

## 📋 개요

본 문서는 SSOTA 프로젝트의 파일 저장소 관리 전략을 정의합니다. 캔버스 애플리케이션 특성상 대량의 이미지, 비디오, 코드 파일을 안전하게 저장하고, 권한 관리와 공유 기능을 지원하는 아키텍처를 제시합니다.

## 🎯 핵심 요구사항

1. **대용량 파일 지원**: 이미지, 비디오, 코드 파일 등 다양한 미디어 타입
2. **권한 기반 접근 제어**: Organization/Workspace 단위 권한 관리
3. **공유 페이지 지원**: Private 파일을 Share Token으로 공개 가능
4. **확장성**: 파일 수 증가에 대응 가능한 구조
5. **비용 효율**: CDN 캐싱, 적절한 TTL 설정

---

## 🪣 Bucket 전략

### 1. Bucket 구조 (실리콘밸리 Best Practices)

```
📦 Supabase Storage Buckets:

1. user-avatars (Public)
   └── {userId}/avatar.jpg
   
2. canvas-assets (Private) ⭐ 핵심
   ├── images/
   │   └── {orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}
   ├── videos/
   │   └── {orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}
   ├── documents/
   │   └── {orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}
   └── code/
       └── {orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}

3. exports (Private, TTL 24h)
   └── {userId}/{exportId}/export.pdf

4. thumbnails (Private, Auto-generated)
   └── {orgId}/{workspaceId}/{pageId}/{blockId}/thumb_{size}.jpg
```

### 2. Bucket 설정 정책

| Bucket | Public/Private | 용도 | TTL | CDN |
|--------|----------------|------|-----|-----|
| `user-avatars` | Public | 사용자 프로필 이미지 | 없음 | ✅ |
| `canvas-assets` | **Private** | 캔버스 블록의 모든 미디어 파일 | 없음 | ❌ |
| `exports` | Private | PDF/이미지 내보내기 (임시) | 24시간 | ❌ |
| `thumbnails` | Private | 자동 생성 썸네일 | 없음 | ✅ |

### 3. 왜 Private Bucket인가?

**캔버스 애플리케이션의 특성**:
- Organization/Workspace 단위 권한 관리 필요
- 민감한 비즈니스 데이터 포함 가능
- 공유는 Share Token을 통해 제어

**Public Bucket의 문제점**:
- URL만 알면 누구나 접근 가능
- 권한 관리 불가능
- 보안 위험

**Private + Signed URL의 장점**:
- RLS(Row Level Security)로 세밀한 권한 제어
- Share Token으로 선택적 공개 가능
- 접근 로그 추적 가능
- URL 만료 설정 가능 (1시간 TTL)

---

## 🔐 접근 제어 전략

### 1. Row Level Security (RLS) 설정

```sql
-- Canvas Assets Bucket RLS Policy
CREATE POLICY "Users can access their org's files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Users can upload to their org's folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Users can delete their org's files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);
```

### 2. Signed URL 생성 전략

```typescript
// 기본 접근 (Org Member)
const signedUrl = await supabase.storage
  .from('canvas-assets')
  .createSignedUrl(filePath, 3600); // 1시간 TTL

// 공유 페이지 접근 (Share Token 보유자)
const signedUrlForShared = await supabase.storage
  .from('canvas-assets')
  .createSignedUrl(filePath, 3600); // 1시간 TTL
```

---

## 🌐 공유 페이지 전략

### 1. Share Token 시스템

```typescript
// Database Schema: share_links
interface ShareLink {
  id: string;
  pageId: string;
  token: string;           // UUID v4
  createdBy: string;       // User ID
  expiresAt: Date | null;  // null = 무제한
  permissions: 'view' | 'comment' | 'edit';
  createdAt: Date;
  lastAccessedAt: Date | null;
}
```

### 2. 공유 페이지 접근 Flow

```
┌─────────────────┐
│ Anonymous User  │
│ visits /share/  │
│ {token}         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Server Component (Next.js)              │
│ 1. Verify share token                   │
│ 2. Check expiry                         │
│ 3. Check permissions                    │
└────────┬────────────────────────────────┘
         │ ✅ Valid
         ▼
┌─────────────────────────────────────────┐
│ Edge Function / API Route              │
│ 1. Get all assets for shared page      │
│ 2. Generate Signed URLs (1h TTL)       │
│ 3. Cache in CDN (optional)             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Return Page with Signed URLs           │
│ - Images, videos, documents            │
│ - Valid for 1 hour                     │
└─────────────────────────────────────────┘
```

### 3. 구현 예시

```typescript
// app/share/[token]/page.tsx (Server Component)
export default async function SharedPage({ params }: { params: { token: string } }) {
  // 1. Verify share token
  const shareLink = await verifyShareToken(params.token);
  if (!shareLink) {
    return <NotFoundPage />;
  }

  // 2. Get page data
  const page = await getPageData(shareLink.pageId);

  // 3. Generate signed URLs for all assets
  const assetsWithSignedUrls = await generateSignedUrlsForPage(page);

  // 4. Render page
  return <SharedCanvas page={page} assets={assetsWithSignedUrls} />;
}

// lib/storage/shared-access.ts
async function generateSignedUrlsForPage(page: Page) {
  const assets = extractAssetsFromPage(page);
  
  return Promise.all(
    assets.map(async (asset) => {
      const { data } = await supabase.storage
        .from('canvas-assets')
        .createSignedUrl(asset.path, 3600); // 1 hour
      
      return {
        ...asset,
        signedUrl: data?.signedUrl,
      };
    })
  );
}
```

### 4. CDN 캐싱 전략 (Optional)

```typescript
// Cloudflare Workers 또는 Vercel Edge Config
// Signed URL을 짧은 시간 캐싱하여 성능 향상

interface CachedSignedUrl {
  url: string;
  expiresAt: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30분

async function getCachedSignedUrl(assetPath: string): Promise<string> {
  const cacheKey = `signed-url:${assetPath}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const { url, expiresAt } = JSON.parse(cached);
    if (Date.now() < expiresAt) {
      return url;
    }
  }
  
  // Generate new signed URL
  const { data } = await supabase.storage
    .from('canvas-assets')
    .createSignedUrl(assetPath, 3600);
  
  // Cache it
  await redis.set(
    cacheKey,
    JSON.stringify({
      url: data.signedUrl,
      expiresAt: Date.now() + CACHE_TTL,
    }),
    'EX',
    CACHE_TTL / 1000
  );
  
  return data.signedUrl;
}
```

---

## 🏗️ Hook 설계: `useSupabaseStorage`

### 1. Hook Interface

```typescript
// apps/web/src/domains/storage/hooks/use-supabase-storage.ts

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  url: string;          // Signed URL
  path: string;         // Storage path
  publicUrl?: string;   // Public URL (for public buckets)
  size: number;         // File size in bytes
  mimeType: string;     // MIME type
}

interface UseSupabaseStorageReturn {
  upload: (options: UploadOptions) => Promise<UploadResult>;
  deleteFile: (bucket: string, path: string) => Promise<void>;
  getSignedUrl: (bucket: string, path: string, expiresIn: number) => Promise<string>;
  getPublicUrl: (bucket: string, path: string) => string;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export function useSupabaseStorage(): UseSupabaseStorageReturn {
  // Implementation
}
```

### 2. Path 생성 전략

```typescript
// lib/storage/path-generator.ts

interface PathOptions {
  orgId: string;
  workspaceId: string;
  pageId: string;
  blockId: string;
  file: File;
}

export function generateAssetPath(options: PathOptions): string {
  const { orgId, workspaceId, pageId, blockId, file } = options;
  
  // Extract file extension
  const ext = file.name.split('.').pop() || '';
  
  // Generate UUID for uniqueness
  const uuid = crypto.randomUUID();
  
  // Timestamp for ordering
  const timestamp = Date.now();
  
  // Sanitize filename (remove special characters)
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 50);
  
  // Determine file category
  const category = getCategoryFromMimeType(file.type);
  
  // Construct path
  return `${category}/${orgId}/${workspaceId}/${pageId}/${blockId}/${timestamp}-${uuid}.${ext}`;
}

function getCategoryFromMimeType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('application/pdf')) return 'documents';
  if (mimeType.includes('code') || mimeType.includes('text')) return 'code';
  return 'documents';
}
```

### 3. 구현 예시

```typescript
// apps/web/src/domains/storage/hooks/use-supabase-storage.ts

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateAssetPath } from '@/lib/storage/path-generator';

export function useSupabaseStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClient();

  const upload = useCallback(async (options: UploadOptions): Promise<UploadResult> => {
    const { bucket, file, onProgress } = options;
    
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Validate file
      validateFile(file);

      // 2. Generate path (if not provided)
      const path = options.path || generateAssetPath({
        orgId: 'current-org-id', // Get from context
        workspaceId: 'current-workspace-id',
        pageId: 'current-page-id',
        blockId: 'current-block-id',
        file,
      });

      // 3. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 4. Generate signed URL (for private buckets)
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour

      // 5. Get public URL (for public buckets)
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      setProgress(100);

      return {
        url: signedUrlData?.signedUrl || publicUrlData.publicUrl,
        path,
        publicUrl: bucket === 'user-avatars' ? publicUrlData.publicUrl : undefined,
        size: file.size,
        mimeType: file.type,
      };
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [supabase]);

  const deleteFile = useCallback(async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }, [supabase]);

  const getSignedUrl = useCallback(async (
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }, [supabase]);

  const getPublicUrl = useCallback((bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }, [supabase]);

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

// Validation helper
function validateFile(file: File) {
  const maxSize = 500 * 1024 * 1024; // 500MB
  
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  // Add more validations (file type, virus scan, etc.)
}
```

---

## 💾 파일 타입별 전략

### 1. 이미지

**저장소**:
- Bucket: `canvas-assets`
- Path: `images/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}`

**최적화**:
```typescript
// Client-side compression (before upload)
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,              // Max 1MB
    maxWidthOrHeight: 1920,    // Max dimension
    useWebWorker: true,
    fileType: 'image/webp',    // Convert to WebP
  };
  
  return await imageCompression(file, options);
}
```

**썸네일 생성** (Edge Function):
```typescript
// Supabase Edge Function: generate-thumbnail
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { path } = await req.json();
  
  // Download original image
  const { data } = await supabase.storage
    .from('canvas-assets')
    .download(path);
  
  // Generate thumbnails (100x100, 400x400, 800x800)
  const thumbnails = await generateThumbnails(data);
  
  // Upload thumbnails
  for (const thumb of thumbnails) {
    await supabase.storage
      .from('thumbnails')
      .upload(thumb.path, thumb.data);
  }
  
  return new Response('OK');
});
```

**설정**:
- 최대 크기: 10MB
- 포맷: WebP (압축), PNG/JPEG (fallback)
- 썸네일: 자동 생성 (100x100, 400x400, 800x800)

### 2. 비디오

**저장소**:
- Bucket: `canvas-assets`
- Path: `videos/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}`

**트랜스코딩 전략**:
```typescript
// Option 1: Cloudflare Stream (권장)
// - 업로드 → Cloudflare Stream API
// - 자동 트랜스코딩 (여러 해상도)
// - HLS/DASH 스트리밍
// - Storage에는 원본 백업만 저장

// Option 2: Mux
// - 업로드 → Mux API
// - 자동 트랜스코딩
// - 적응형 비트레이트 스트리밍

// Option 3: Self-hosted FFmpeg (복잡함)
// - Supabase Storage에 업로드
// - Edge Function에서 FFmpeg 실행
// - 트랜스코딩 결과 저장
```

**설정**:
- 최대 크기: 500MB
- 포맷: MP4 (H.264), WebM
- 트랜스코딩: Cloudflare Stream 또는 Mux

### 3. 코드 파일

**저장소**:
- Bucket: `canvas-assets`
- Path: `code/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}`

**처리**:
```typescript
// Syntax highlighting (client-side)
import { codeToHtml } from 'shiki';

async function highlightCode(code: string, language: string) {
  return await codeToHtml(code, {
    lang: language,
    theme: 'github-dark',
  });
}
```

**설정**:
- 최대 크기: 5MB
- 포맷: .js, .ts, .py, .json, .md 등
- 신택스 하이라이팅: Shiki (클라이언트)

### 4. 문서 (PDF, DOCX)

**저장소**:
- Bucket: `canvas-assets`
- Path: `documents/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}`

**설정**:
- 최대 크기: 50MB
- 포맷: PDF, DOCX, PPTX
- 미리보기: PDF.js (클라이언트)

---

## 🚀 구현 순서 (Phase별)

### Phase 1: 기본 이미지 업로드 ✅ 현재

**목표**: 이미지 블록에서 Supabase Storage 연동

**작업**:
- [x] `canvas-assets` bucket 생성 (Private)
- [ ] RLS policy 설정
- [ ] `useSupabaseStorage` 훅 구현
- [ ] `ImageUploadProperty` 컴포넌트에서 hook 사용
- [ ] `ImageBlock` 컴포넌트에서 Signed URL로 이미지 표시

**구현 위치**:
```
apps/web/src/domains/storage/
├── hooks/
│   └── use-supabase-storage.ts
├── lib/
│   ├── path-generator.ts
│   └── validation.ts
└── types/
    └── storage.types.ts
```

### Phase 2: 최적화 및 썸네일

**목표**: 이미지 압축 및 썸네일 자동 생성

**작업**:
- [ ] Client-side 이미지 압축 (browser-image-compression)
- [ ] Edge Function: 썸네일 자동 생성
- [ ] Progress indicator UI
- [ ] Error handling 강화

### Phase 3: 비디오 및 다양한 파일 타입

**목표**: 비디오, 코드, 문서 파일 지원

**작업**:
- [ ] 비디오 블록 구현
- [ ] Cloudflare Stream 연동
- [ ] 코드 블록 파일 업로드
- [ ] PDF 뷰어 블록

### Phase 4: 공유 기능

**목표**: Share Token 시스템 및 공유 페이지

**작업**:
- [ ] `share_links` 테이블 생성
- [ ] Share Token 생성/검증 API
- [ ] 공유 페이지 `/share/[token]` 구현
- [ ] CDN 캐싱 전략 적용

### Phase 5: 고급 기능

**목표**: 성능 최적화 및 고급 기능

**작업**:
- [ ] Redis 캐싱 (Signed URLs)
- [ ] 파일 버전 관리
- [ ] 자동 백업 및 복원
- [ ] 사용량 모니터링 대시보드

---

## 📊 참고 사례: 실리콘밸리 SaaS

### Notion
- **Bucket 전략**: Private, organization별 분리
- **공유 전략**: Share token + Presigned URL
- **특징**: 
  - 이미지는 자동 압축 (WebP)
  - 페이지 공유 시 1시간 TTL의 Signed URL
  - CloudFront CDN 캐싱

### Figma
- **Bucket 전략**: Private, team별 분리
- **공유 전략**: Share link → CDN cache (1h)
- **특징**:
  - 썸네일 자동 생성 (여러 해상도)
  - 버전 관리 (파일 히스토리)
  - S3 + CloudFront 조합

### Miro
- **Bucket 전략**: Private, workspace별 분리
- **공유 전략**: Share token + CloudFront
- **특징**:
  - 실시간 이미지 최적화
  - WebSocket으로 업로드 진행률
  - 자동 백업

### Linear
- **Bucket 전략**: Private, org별 분리
- **공유 전략**: Share token + Signed URL
- **특징**:
  - 간단한 구조 (복잡도 최소화)
  - 이미지만 지원 (비디오 없음)
  - 빠른 로딩 최적화

---

## 🎯 최종 권장 사항

### 1. Bucket 구조
```
✅ user-avatars (Public)
✅ canvas-assets (Private) ← 핵심
   └── images/, videos/, documents/, code/
✅ exports (Private, TTL 24h)
✅ thumbnails (Private, Auto-generated)
```

### 2. 접근 제어
- ✅ **Private by default** (RLS)
- ✅ **Signed URLs** (1시간 TTL)
- ✅ **Share token** (공유 페이지용)
- ✅ **CDN caching** (공유 페이지의 Signed URL, 30분)

### 3. Path 구조
```
canvas-assets/{category}/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}

예시:
canvas-assets/images/org_123/ws_456/page_789/block_abc/1699999999999-550e8400-e29b-41d4-a716-446655440000.webp
```

### 4. 보안 원칙
1. **Never Public**: 캔버스 에셋은 항상 Private
2. **RLS First**: Supabase RLS로 권한 제어
3. **Short-lived URLs**: Signed URL은 1시간 TTL
4. **Token-based Sharing**: 공유는 Share Token으로만
5. **Audit Logging**: 접근 로그 추적

### 5. 비용 최적화
1. **이미지 압축**: WebP 포맷 (75% 용량 감소)
2. **썸네일**: 원본 대신 적절한 크기 사용
3. **CDN 캐싱**: Signed URL을 30분 캐싱
4. **Lifecycle Policy**: Exports bucket은 24시간 후 자동 삭제
5. **Usage Monitoring**: 월별 저장소 사용량 추적

---

## 📖 관련 문서

- [Image Block Definition](../block-definitions/04-image-block.md)
- [Video Block Definition](../block-definitions/05-video-block.md)
- [Architecture Conventions](./README.md)
- [Data Flow Conventions](./data-flow-conventions.md)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2024-11-03 | 1.0.0 | 초안 작성 | - |


