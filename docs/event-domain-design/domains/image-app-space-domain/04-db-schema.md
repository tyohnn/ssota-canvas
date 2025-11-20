# Database Schema: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 백엔드개발자  
**작성일**: 2025-11-19  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**구현 위치**: `apps/web/src/db/schemas/image-app-space-schema.ts`

---

## 🎯 Schema Overview

### 설계 원칙
1. **별도 스키마**: `image_app_space` 커스텀 스키마 사용
2. **Aggregate 반영**: ImageAsset, CommunityInteraction, ImageAssetUsage
3. **통계 비정규화**: Trigger로 실시간 동기화
4. **성능 최적화**: GIN 인덱스 (tags), 복합 인덱스 (정렬)
5. **RLS 보안**: 모든 테이블에 적용

### 테이블 구조

```
image_app_space
├── image_assets (핵심 자산)
├── image_asset_usage (사용 추적)
├── user_follows (팔로우 N:N)
├── image_bookmarks (북마크 N:N)
├── image_likes (좋아요 N:N)
└── image_views (조회 로그)
```

---

## 📋 Enums

### 1. image_asset_type
- `ai-generated`: AI 생성
- `unsplash`: Unsplash (북마크/좋아요 시 저장)
- `user-upload`: 사용자 업로드

### 2. image_category
- `art`, `photo`, `illustration`, `design`, `abstract`, `nature`, `architecture`, `portrait`, `landscape`, `other`

---

## 📋 Tables

### 1. image_assets (이미지 자산)

**Software Design 참조**: ImageAsset Aggregate (Root Entity)

**목적**: AI 생성, Unsplash, 사용자 업로드 이미지를 통합 관리하는 핵심 테이블

**주요 필드**:
```sql
CREATE TABLE image_app_space.image_assets (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Asset Type & Source
    asset_type image_asset_type NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type TEXT,
    
    -- AI Generation Fields
    prompt TEXT,
    negative_prompt TEXT,
    -- metadata: JSONB (AI: modelId, seed | Unsplash: photoId, authorName)
    metadata JSONB DEFAULT '{}',
    
    -- Classification
    title TEXT,
    description TEXT,
    tags TEXT[],  -- PostgreSQL array
    category image_category,
    
    -- Ownership & Visibility
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    
    -- Statistics (비정규화)
    view_count INTEGER NOT NULL DEFAULT 0,
    bookmark_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    use_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

**인덱스**:
```sql
-- Creator 기반 조회 (내 이미지 목록)
CREATE INDEX idx_image_assets_creator 
ON image_assets(created_by) 
WHERE is_deleted = false;

-- Workspace 범위 조회
CREATE INDEX idx_image_assets_workspace 
ON image_assets(workspace_id) 
WHERE is_deleted = false;

-- Public 이미지 피드 (커뮤니티)
CREATE INDEX idx_image_assets_public 
ON image_assets(is_public, created_at) 
WHERE is_deleted = false;

-- Asset Type별 조회
CREATE INDEX idx_image_assets_type 
ON image_assets(asset_type, created_at);

-- 카테고리별 조회
CREATE INDEX idx_image_assets_category 
ON image_assets(category, created_at) 
WHERE is_deleted = false;

-- 태그 검색 (GIN 인덱스)
CREATE INDEX idx_image_assets_tags 
ON image_assets USING GIN(tags);
```

**RLS 정책**:
```sql
-- SELECT: 본인 이미지 or Public 이미지
CREATE POLICY "image_assets_select_policy" ON image_assets
FOR SELECT TO authenticated
USING (
  (created_by = auth.uid()) OR 
  (is_public = true AND is_deleted = false)
);

-- INSERT: 본인만 생성
CREATE POLICY "image_assets_insert_policy" ON image_assets
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- UPDATE: 본인만 수정
CREATE POLICY "image_assets_update_policy" ON image_assets
FOR UPDATE TO authenticated
USING (created_by = auth.uid());

-- DELETE: 본인만 삭제
CREATE POLICY "image_assets_delete_policy" ON image_assets
FOR DELETE TO authenticated
USING (created_by = auth.uid());
```

> **💡 설계 노트**  
> - metadata JSONB로 AI/Unsplash 메타데이터 통합 저장
> - 통계는 비정규화하여 조회 성능 최적화
> - tags는 PostgreSQL 배열로 GIN 인덱스 활용
> - is_public=false면 workspace 범위 내에서만 접근

---

### 2. image_asset_usage (이미지 사용 추적)

**Software Design 참조**: ImageAssetUsage Aggregate

**목적**: 이미지가 어떤 블록에서 사용되는지 추적

**주요 필드**:
```sql
CREATE TABLE image_app_space.image_asset_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_asset_id UUID NOT NULL REFERENCES image_assets(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**인덱스**:
```sql
CREATE INDEX idx_image_asset_usage_image ON image_asset_usage(image_asset_id);
CREATE INDEX idx_image_asset_usage_block ON image_asset_usage(block_id);
CREATE INDEX idx_image_asset_usage_unique ON image_asset_usage(image_asset_id, block_id);
```

**RLS**: page creator 권한 체인

---

### 3. user_follows (팔로우 관계)

**Software Design 참조**: CommunityInteraction Aggregate

**목적**: 사용자 간 팔로우 관계 (N:N)

**주요 필드**:
```sql
CREATE TABLE image_app_space.user_follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (follower_id, followee_id),
    CONSTRAINT user_follows_no_self_follow CHECK (follower_id != followee_id)
);
```

**인덱스**:
```sql
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_followee ON user_follows(followee_id);
```

**RLS**:
- SELECT: 모두 조회 가능
- INSERT/DELETE: follower_id = auth.uid()

---

### 4. image_bookmarks (북마크)

**목적**: 사용자가 찜한 이미지 저장

```sql
CREATE TABLE image_app_space.image_bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_asset_id UUID NOT NULL REFERENCES image_assets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, image_asset_id)
);
```

**RLS**: user_id = auth.uid()

---

### 5. image_likes (좋아요)

**목적**: 이미지 좋아요 저장

```sql
CREATE TABLE image_app_space.image_likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_asset_id UUID NOT NULL REFERENCES image_assets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, image_asset_id)
);
```

**RLS**:
- SELECT: 모두 조회 가능
- INSERT/DELETE: user_id = auth.uid()

---

### 6. image_views (조회수)

**목적**: 이미지 조회 이벤트 로깅 (익명 사용자 포함)

```sql
CREATE TABLE image_app_space.image_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- nullable
    image_asset_id UUID NOT NULL REFERENCES image_assets(id) ON DELETE CASCADE,
    session_id TEXT,  -- 익명 사용자 추적
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**인덱스**:
```sql
CREATE INDEX idx_image_views_image_viewed ON image_views(image_asset_id, viewed_at);
CREATE INDEX idx_image_views_user_viewed ON image_views(user_id, viewed_at);
```

**RLS**: INSERT only (anon, authenticated 모두 허용)

---

## 🔧 Database Triggers

### 통계 자동 업데이트

**좋아요 수 동기화**:
```sql
CREATE OR REPLACE FUNCTION sync_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE image_app_space.image_assets 
    SET like_count = like_count + 1 
    WHERE id = NEW.image_asset_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE image_app_space.image_assets 
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.image_asset_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count
AFTER INSERT OR DELETE ON image_app_space.image_likes
FOR EACH ROW EXECUTE FUNCTION sync_like_count();
```

**북마크 수 동기화**:
```sql
CREATE OR REPLACE FUNCTION sync_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE image_app_space.image_assets 
    SET bookmark_count = bookmark_count + 1 
    WHERE id = NEW.image_asset_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE image_app_space.image_assets 
    SET bookmark_count = GREATEST(bookmark_count - 1, 0)
    WHERE id = OLD.image_asset_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookmark_count
AFTER INSERT OR DELETE ON image_app_space.image_bookmarks
FOR EACH ROW EXECUTE FUNCTION sync_bookmark_count();
```

---

## 🚀 Performance Optimization

### 핵심 쿼리 패턴

**1. 커뮤니티 피드 (인기순)**:
```sql
SELECT * FROM image_app_space.image_assets
WHERE is_public = true 
  AND is_deleted = false
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY (view_count + like_count * 2 + bookmark_count * 3) DESC
LIMIT 20;
```
→ 인덱스: `idx_image_assets_public`

**2. 팔로잉 피드**:
```sql
SELECT ia.* 
FROM image_app_space.image_assets ia
JOIN image_app_space.user_follows uf ON ia.created_by = uf.followee_id
WHERE uf.follower_id = $userId 
  AND ia.is_public = true 
  AND ia.is_deleted = false
ORDER BY ia.created_at DESC;
```
→ 인덱스: `idx_user_follows_follower`, `idx_image_assets_public`

**3. 태그 검색**:
```sql
SELECT * FROM image_app_space.image_assets
WHERE tags && ARRAY['nature', 'landscape']
  AND is_public = true
  AND is_deleted = false;
```
→ 인덱스: `idx_image_assets_tags` (GIN)

---

## 📝 구현 상태

### ✅ 완료
- Drizzle Schema 정의
- Enum 2개
- Table 6개
- RLS 정책 전체
- 인덱스 설정

### ⏳ 필요
- Database Triggers 작성 (SQL 실행)
- Migration 적용 (`pnpm run db:dev:push`)
- Supabase Dashboard 설정 (Exposed schemas)

---

## 🔗 도메인 간 통합

### Block Management Domain
- **FK**: `image_asset_usage.block_id` → `public.blocks`
- **FK**: `image_asset_usage.page_id` → `public.pages`
- **통합**: 이미지 적용 시 usage 자동 기록

### User Management Domain
- **FK**: `image_assets.created_by` → `public.profiles`
- **FK**: `user_follows` → `public.profiles`
- **통합**: 팔로우, 좋아요, 북마크 기능

### Workspace Management Domain
- **FK**: `image_assets.workspace_id` → `public.workspaces`
- **통합**: Workspace 범위 이미지 관리

---

*상세 구현: `apps/web/src/db/schemas/image-app-space-schema.ts`*

