# Database Schemas

이 디렉토리는 Supabase 커스텀 스키마들을 관리합니다.

## 스키마 구조

### `public` 스키마 (`schemas/public/`)
핵심 도메인 테이블들은 `schemas/public/` 아래 도메인별 파일로 분리되어 있으며, `schema.ts`에서 re-export 합니다.
- **enums.ts**: 공용/도메인 pgEnum
- **profiles-schema.ts**: profiles
- **organization-schema.ts**: organizations, organization_members, invitations, notifications
- **workspace-schema.ts**: workspaces, pages, workspace_members, page_favorites, workspace_invitations
- **canvas-schema.ts**: blocks, block_mounts, edges, viewports
- **ai-management-schema.ts**: event_logs
- **share-schema.ts**: published_pages
- **source-management-schema.ts**: sources, source_summaries, source_action_transactions
- **index.ts**: barrel + cross-domain relations (profilesRelations, organizationsRelations, pagesRelations)

### `image_app_space` 스키마 (image-app-space-schema.ts)
이미지 블록 앱스페이스 테이블들:
- `image_assets`: 통합 이미지 에셋 (AI 생성, Unsplash, 업로드)
- `image_asset_usage`: 이미지 사용 추적
- `user_follows`: 팔로우 관계
- `image_bookmarks`: 북마크/찜하기
- `image_likes`: 좋아요
- `image_views`: 조회수 추적

## 마이그레이션

### 새 스키마 추가 시

1. 스키마 파일 생성:
```typescript
// schemas/new-schema.ts
export const newSchema = pgSchema('new_schema');
```

2. `drizzle.config.ts`에 추가:
```typescript
schema: [
  './src/db/schema.ts',
  './src/db/schemas/image-app-space-schema.ts',
  './src/db/schemas/new-schema.ts', // 추가
]
```

3. `db/index.ts`에 import:
```typescript
import * as newSchema from './schemas/new-schema';

export const adminDb = drizzle(adminClient, {
  schema: isDevelopment
    ? { ...devSchema, ...imageAppSpaceSchema, ...newSchema }
    : { ...schema, ...imageAppSpaceSchema, ...newSchema },
});
```

4. 마이그레이션 생성:
```bash
npm run db:generate
```

5. Supabase에서 스키마 생성 및 권한 설정 (SQL 실행):
```sql
CREATE SCHEMA IF NOT EXISTS new_schema;

GRANT USAGE ON SCHEMA new_schema TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA new_schema TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA new_schema TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA new_schema TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA new_schema 
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA new_schema 
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA new_schema 
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```

6. Supabase Dashboard에서 스키마 노출:
   - Settings → API → Exposed schemas
   - `new_schema` 추가

## FK 참조 규칙

스키마 간 FK 참조 시:
```typescript
// ✅ 올바른 방법: import해서 참조
import { profiles } from '../schemas/public';

created_by: uuid('created_by')
  .notNull()
  .references(() => profiles.id, { onDelete: 'cascade' }),

// ❌ 잘못된 방법: sql 템플릿 사용
created_by: uuid('created_by')
  .notNull()
  .references(() => sql`public.profiles(id)`, { onDelete: 'cascade' }),
```

## RLS 정책

모든 테이블은 RLS가 활성화되어 있습니다:
```typescript
.enableRLS()
```

정책은 테이블 정의 내에서 `pgPolicy`로 추가합니다.

## Vector 검색 (예정)

`image_assets.prompt_embedding`은 pgvector 확장이 필요합니다:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE image_app_space.image_assets 
  ADD COLUMN prompt_embedding vector(1536);

CREATE INDEX idx_image_assets_prompt_embedding 
  ON image_app_space.image_assets 
  USING ivfflat (prompt_embedding vector_cosine_ops) 
  WHERE asset_type = 'ai-generated' AND prompt_embedding IS NOT NULL;
```

