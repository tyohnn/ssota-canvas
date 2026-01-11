---
name: Editor Panel Tab System with YouTube App Space
overview: 에디터 패널에 블록 타입별로 동적 탭 시스템을 구축하고, YouTube App Space 스키마를 통해 스크립트 데이터를 효율적으로 관리합니다. 여러 사용자가 같은 YouTube 영상을 사용할 때 스크립트를 재사용하여 성능을 최적화합니다.
todos:
  - id: define-types
    content: BlockEditorTab 인터페이스 및 타입 정의 작성
    status: pending
  - id: build-dynamic-registry
    content: Dynamic Import 기반 BlockEditorTabsRegistry 구현 (action-prefetch 패턴)
    status: pending
  - id: youtube-config
    content: 유튜브 블록 탭 설정 파일 작성 (youtube-editor-tabs.ts)
    status: pending
  - id: youtube-script-section
    content: 유튜브 Script Section 컴포넌트 구현
    status: pending
  - id: youtube-app-space-schema
    content: youtube-app-space 스키마 및 테이블 생성 (youtubes, channels)
    status: pending
  - id: youtube-properties-update
    content: YoutubeBlockProperties에 youtubeId 참조 추가 (script 제거)
    status: pending
  - id: youtube-domain-structure
    content: youtube-app-space 도메인 폴더 구조 생성 (image-app-space 패턴)
    status: pending
  - id: youtube-entities-vo
    content: YouTube Entity, Value Objects, Commands, Events 정의
    status: pending
  - id: youtube-repositories
    content: YouTube Repository 인터페이스 및 Drizzle 구현
    status: pending
  - id: youtube-services
    content: YouTube Service Functions 구현 (백엔드 패턴 준수)
    status: pending
  - id: youtube-actions
    content: YouTube Server Actions 구현 (블록 매니지먼트 패턴 준수)
    status: pending
  - id: youtube-secure-action
    content: YouTube 전용 secure action wrapper 구현 (withYoutubeSecureAction)
    status: pending
  - id: note-section
    content: 기존 BlockContentSection을 NoteSection으로 리팩토링
    status: pending
  - id: tabs-section-async
    content: BlockContentTabsSection 구현 (비동기 config 로딩 포함)
    status: pending
  - id: content-area-integration
    content: ContentArea에서 BlockContentTabsSection 통합
    status: pending
  - id: bundle-verification
    content: 번들 크기 검증 (초기 번들에 config가 포함되지 않는지 확인)
    status: pending
  - id: prefetch-optimization
    content: (선택) Details hover 시 config prefetch 구현
    status: pending
  - id: testing
    content: 탭 전환, config 캐싱, lazy loading 테스트
    status: pending
---

# 에디터 패널 동적 탭 시스템 + YouTube App Space 구현 계획

## 목표

1. **동적 탭 시스템**: 블록 타입별로 에디터 패널에 커스텀 탭을 추가할 수 있는 확장 가능한 시스템 구축
2. **YouTube App Space**: 별도 스키마로 YouTube 데이터를 관리하여 블록 테이블 비대화 방지 및 데이터 재사용
3. **성능 최적화**: 여러 사용자가 같은 YouTube 영상을 사용할 때 스크립트를 한 번만 추출하여 재사용

## 아키텍처 개요

### Part 1: 동적 탭 시스템

현재 코드베이스는 이미 여러 곳에서 **Registry + Dynamic Import** 패턴을 사용하고 있습니다:

- [`BLOCK_ACTION_MODULES`](apps/web/src/domains/block-management/frontend/components/block/block-action-bar/action-prefetch.ts): 블록 타입별 Action Items를 hover 시 동적으로 로드하여 Registry에 캐싱
- [`toolbar-prefetch.ts`](apps/web/src/domains/block-management/frontend/components/block/block-original-toolbar/toolbar-prefetch.ts): 블록 타입별 Toolbar Items를 동적으로 로드
- [`blockEditorSchemaRegistry`](apps/web/src/domains/block-management/frontend/components/editor-panel/components/block-editor-schema-registry.ts): 블록 타입별 에디터 스키마 등록 (Static Import - 개선 여지 있음)

**에디터 패널 탭 시스템**은 Action/Toolbar와 동일한 **Dynamic Import 패턴**을 사용하여 초기 번들 크기를 최소화합니다.

### Part 2: YouTube App Space 아키텍처

[`image-app-space`](apps/web/src/db/schemas/image-app-space-schema.ts) 패턴을 따라 YouTube 데이터를 별도 스키마로 관리합니다.

**핵심 설계 원칙**:

1. **데이터 중복 제거**: 같은 YouTube 영상은 한 번만 저장
2. **스크립트 재사용**: 한 번 추출한 스크립트를 모든 사용자가 공유
3. **SSOT 유지**: `block.properties`에는 참조만, 실제 데이터는 `youtube-app-space`에 저장
4. **용량 최적화**: 블록에 스크립트를 캐싱하지 않고 필요할 때마다 조회
5. **권한 관리**: 특정 블록을 가진 사용자만 스크립트 접근 가능

## 구현 상세

### 백엔드 패턴 준수 사항

모든 YouTube App Space 구현은 [docs/patterns/backend/server-side-ddd-conventions.md](docs/patterns/backend/server-side-ddd-conventions.md) 패턴을 따라야 합니다:

**핵심 원칙**:

1. **Server Action**: `unknown` → SafeDTO (Zod 검증)
2. **Service Function**: SafeDTO → Command 변환 (Value Objects 생성)
3. **Aggregate**: Command → Domain Event 발생 (1:1 대응)
4. **Repository**: Aggregate/Entity 영속화
5. **Service Function 패턴**: Service Class가 아닌 Function 사용
6. **Repository 주입**: Repository는 파라미터로 주입 (테스트 용이)

**데이터 흐름**:

```
unknown (Server Action)
  ↓ Zod 검증
SafeDTO (Internal Function)
  ↓ 인증/권한 확인
SafeDTO + userId (Service Function)
  ↓ SafeDTO → Command 변환
Command (Aggregate)
  ↓ Command 처리 + Event 발생
Domain Event (Repository)
  ↓ 영속화
Database
```

### Phase 0: YouTube App Space 스키마 구축

**파일**: `apps/web/src/db/schemas/youtube-app-space-schema.ts` (NEW)

```typescript
/**
 * YouTube App Space Schema
 *
 * image-app-space 패턴을 따라 YouTube 데이터를 별도 스키마로 관리
 */
import {
  pgSchema,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { profiles, workspaces } from "../schema";

export const youtubeAppSpaceSchema = pgSchema("youtube_app_space");

// Channels 테이블
export const channels = youtubeAppSpaceSchema.table("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel_id: text("channel_id").notNull().unique(), // YouTube Channel ID

  // 채널 정보
  channel_name: text("channel_name").notNull(),
  channel_description: text("channel_description"),
  channel_thumbnail_url: text("channel_thumbnail_url"), // YouTube CDN

  // 통계 (Cron으로 주기적 업데이트 예정)
  subscriber_count: integer("subscriber_count"),
  video_count: integer("video_count"),

  // 메타데이터
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// YouTubes 테이블 (핵심)
export const youtubes = youtubeAppSpaceSchema.table("youtubes", {
  id: uuid("id").primaryKey().defaultRandom(),
  video_id: text("video_id").notNull().unique(), // YouTube Video ID (e.g., "dQw4w9WgXcQ")

  // 메타데이터
  title: text("title").notNull(),
  description: text("description"),
  channel_id: uuid("channel_id").references(() => channels.id),
  published_at: timestamp("published_at", { withTimezone: true }),
  duration_seconds: integer("duration_seconds"),

  // 썸네일 (YouTube CDN URL - Storage 절약)
  thumbnail_url: text("thumbnail_url"),
  thumbnail_high_url: text("thumbnail_high_url"),

  // 스크립트 (JSONB - 최대 ~300KB, 대부분 100KB 이하)
  script: jsonb("script"), // { transcript: [...], metadata: {...} }
  script_language: text("script_language"), // 'en', 'ko', etc.
  script_extracted_at: timestamp("script_extracted_at", { withTimezone: true }),

  // YouTube 통계 (Cron 업데이트 예정)
  view_count: integer("view_count").default(0),
  like_count: integer("like_count").default(0),
  comment_count: integer("comment_count").default(0),

  // 플랫폼 통계
  use_count: integer("use_count").default(0), // 몇 개의 블록이 사용 중인지

  // 메타데이터
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

### Phase 1: YouTube App Space 도메인 구조 구축

**도메인 폴더 구조** (image-app-space 패턴 참고):

```
domains/youtube-app-space/
├── actions/                          # Server Actions
│   ├── youtube.actions.ts           # createYoutube, getYoutubeScript, extractScript
│   └── channel.actions.ts            # createChannel, updateChannel
├── backend/
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   ├── youtube.repository.interface.ts
│   │   │   └── channel.repository.interface.ts
│   │   └── implementations/
│   │       ├── drizzle-youtube.repository.ts
│   │       └── drizzle-channel.repository.ts
│   └── services/
│       ├── youtube.service.ts        # Service Functions
│       ├── channel.service.ts
│       └── youtube-api.service.ts  # YouTube API 연동
├── shared/
│   ├── commands/
│   │   ├── youtube.commands.ts     # CreateYoutubeCommand, ExtractScriptCommand
│   │   └── channel.commands.ts     # CreateChannelCommand
│   ├── entities/
│   │   ├── youtube.entity.ts
│   │   └── channel.entity.ts
│   ├── events/
│   │   ├── youtube.events.ts       # YoutubeCreatedEvent, ScriptExtractedEvent
│   │   └── channel.events.ts
│   ├── schemas/
│   │   ├── youtube.schemas.ts       # Zod 스키마 (Request DTO)
│   │   └── channel.schemas.ts
│   └── dtos/
│       ├── requests/
│       │   ├── youtube.requests.ts
│       │   └── channel.requests.ts
│       └── responses/
│           ├── youtube.responses.ts
│           └── channel.responses.ts
└── frontend/
    └── hooks/
        └── use-youtube-script.ts
```

### Phase 2: YouTube 전용 Secure Action Wrapper 구현

**파일**: `apps/web/src/domains/youtube-app-space/actions/secure-action.ts` (NEW)

블록 매니지먼트의 `withBlockSecureAction` 패턴을 참고하여 YouTube 전용 wrapper 생성:

````typescript
/**
 * YouTube App Space - Common Action Utilities
 *
 * YouTube 도메인 전용 Server Action wrapper와 유틸리티들
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { DrizzleYoutubeRepository } from '../backend/repositories/implementations/drizzle-youtube.repository';

/**
 * YouTube-based authorization with workspace validation (Zero Trust)
 *
 * youtubeId만으로 workspace 권한 자동 검증
 * 1. YouTube 조회 (DB = SSOT)
 * 2. Block 조회하여 youtubeId를 가진 블록 찾기
 * 3. Block에서 workspaceId 추출
 * 4. Workspace 권한 검증
 *
 * Returns WorkspaceActionContext
 */
async function authorizeYoutubeById(
  youtubeId: string,
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. YouTube 조회
  const youtubeRepository = new DrizzleYoutubeRepository();
  const youtube = await youtubeRepository.findById(youtubeId);

  if (!youtube) {
    return { success: false, error: 'YouTube not found' };
  }

  // 2. Block 조회하여 workspaceId 추출
  const blockRepository = new DrizzleBlockRepository();
  // properties에 youtubeId를 가진 블록 찾기
  const blocks = await blockRepository.findByYoutubeId(youtubeId);

  if (blocks.length === 0) {
    return { success: false, error: 'No block found with this YouTube ID' };
  }

  // 첫 번째 블록의 workspaceId 사용
  const workspaceId = blocks[0].workspaceId.value;

  // 3. Workspace 권한 검증
  return await authorizeByWorkspaceId(workspaceId, userId);
}

/**
 * YouTube 전용 Secure Action Builder
 */
const youtubeSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * YouTube 전용 secure action wrapper
 *
 * YouTube 데이터 접근 작업에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Workspace 접근 권한
 * 3. YouTube 소유권 (사용자가 해당 YouTube를 가진 블록을 소유하는지 확인)
 *
 * @example
 * ```ts
 * export const getYoutubeScriptAction = withYoutubeSecureAction(
 *   GetYoutubeScriptRequestSchema,
 *   'getYoutubeScriptAction',
 *   async (req, ctx) => {
 *     // ctx는 WorkspaceActionContext
 *     // req.youtubeId가 ctx.workspace에 속함이 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withYoutubeSecureAction = youtubeSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth((req: { youtubeId: string }, user: AuthenticatedUser) =>
    authorizeYoutubeById(req.youtubeId, user.id)
  )
  .build();
````

### Phase 3: YouTube Server Actions 구현

**파일**: `apps/web/src/domains/youtube-app-space/actions/youtube.actions.ts` (NEW)

**블록 매니지먼트 패턴 준수**: `withYoutubeSecureAction` HOF 사용 또는 직접 구현 패턴

#### Option A: withYoutubeSecureAction HOF 사용 (권장)

```typescript
'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleYoutubeRepository } from '../backend/repositories/implementations/drizzle-youtube.repository';
import { YoutubeApiService } from '../backend/services/youtube-api.service';
import {
  getOrCreateYoutube,
  extractScript,
} from '../backend/services/youtube.service';
import {
  CreateYoutubeRequestSchema,
  ExtractScriptRequestSchema,
  GetYoutubeScriptRequestSchema,
} from '../shared/schemas/youtube.schemas';
import { withYoutubeSecureAction } from './secure-action';

/**
 * YouTube 생성 또는 조회 Action
 *
 * 패턴: withYoutubeSecureAction HOF 사용
 */
export const createYoutubeAction = withYoutubeSecureAction(
  CreateYoutubeRequestSchema,
  'createYoutubeAction',
  createYoutubeInternal,
  {
    getLogMetadata: req => ({
      videoId: req.videoId,
    }),
  }
);

/**
 * 스크립트 추출 Action
 *
 * 패턴: withYoutubeSecureAction HOF 사용
 */
export const extractScriptAction = withYoutubeSecureAction(
  ExtractScriptRequestSchema,
  'extractScriptAction',
  extractScriptInternal,
  {
    getLogMetadata: req => ({
      youtubeId: req.youtubeId,
    }),
  }
);

/**
 * 스크립트 조회 Action
 *
 * 패턴: withYoutubeSecureAction HOF 사용
 */
export const getYoutubeScriptAction = withYoutubeSecureAction(
  GetYoutubeScriptRequestSchema,
  'getYoutubeScriptAction',
  getYoutubeScriptInternal,
  {
    getLogMetadata: req => ({
      youtubeId: req.youtubeId,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * Event Storming + DDD 패턴:
 * - Service에 SafeDTO 전달 (Command 변환은 Service 내부에서 수행)
 */
async function createYoutubeInternal(
  safeDto: CreateYoutubeRequest, // SafeDTO
  context: WorkspaceActionContext // 검증된 context
): Promise<ActionResult<YoutubeEntity>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);

    // 1. Repository 생성
    const youtubeRepository = new DrizzleYoutubeRepository();
    const youtubeApiService = new YoutubeApiService();

    // 2. Service Function 호출 (SafeDTO 전달)
    const result = await getOrCreateYoutube(
      safeDto,
      userId,
      youtubeRepository,
      youtubeApiService
    );

    if (result.isError()) {
      return err(String(result.error), {
        code: 'YOUTUBE_CREATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[createYoutubeInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}

async function extractScriptInternal(
  safeDto: ExtractScriptRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<{ script: any }>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);

    const youtubeRepository = new DrizzleYoutubeRepository();
    const youtubeApiService = new YoutubeApiService();

    const result = await extractScript(
      safeDto,
      userId,
      youtubeRepository,
      youtubeApiService
    );

    if (result.isError()) {
      return err(String(result.error), {
        code: 'SCRIPT_EXTRACTION_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok({ script: result.value.script });
  } catch (error) {
    console.error('[extractScriptInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}

async function getYoutubeScriptInternal(
  safeDto: GetYoutubeScriptRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<{ script: any }>> {
  try {
    const youtubeRepository = new DrizzleYoutubeRepository();
    const youtube = await youtubeRepository.findById(safeDto.youtubeId);

    if (!youtube) {
      return err('YouTube not found', { code: 'NOT_FOUND' });
    }

    return ok({ script: youtube.script });
  } catch (error) {
    console.error('[getYoutubeScriptInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
```

#### Option B: 직접 구현 패턴 (image-app-space 스타일)

```typescript
'use server';

import { getAuthErrorMessage } from '@/domains/common/auth/error';
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  verifyAccess,
} from '@/domains/common/auth/helpers';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleYoutubeRepository } from '../backend/repositories/implementations/drizzle-youtube.repository';
import { YoutubeApiService } from '../backend/services/youtube-api.service';
import {
  getOrCreateYoutube,
  extractScript,
} from '../backend/services/youtube.service';
import {
  CreateYoutubeRequestSchema,
  ExtractScriptRequestSchema,
} from '../shared/schemas/youtube.schemas';

/**
 * YouTube 생성 또는 조회 Action
 *
 * 패턴: 직접 구현 (image-app-space 스타일)
 */
export async function createYoutubeAction(
  request: unknown
): Promise<ActionResult<YoutubeEntity>> {
  // 1. Zod 검증
  const parseResult = CreateYoutubeRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to createYoutubeAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  const validatedRequest = parseResult.data;

  // 2. 인증 및 권한 확인
  try {
    const user = await getAuthenticatedUser();

    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    return await createYoutubeInternal(validatedRequest, user);
  } catch (error) {
    console.error('[createYoutubeAction] Failed to create youtube', {
      error,
    });

    return err(
      error instanceof Error ? error.message : 'Failed to create youtube'
    );
  }
}

async function createYoutubeInternal(
  request: CreateYoutubeRequest,
  user: AuthenticatedUser
): Promise<ActionResult<YoutubeEntity>> {
  try {
    const youtubeRepository = new DrizzleYoutubeRepository();
    const youtubeApiService = new YoutubeApiService();

    const result = await getOrCreateYoutube(
      request,
      new UserId(user.id),
      youtubeRepository,
      youtubeApiService
    );

    if (result.isError()) {
      return err(String(result.error), {
        code: 'YOUTUBE_CREATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[createYoutubeInternal] Internal error:', {
      userId: user.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to create youtube'
    );
  }
}
```

**권장**: Option A (withYoutubeSecureAction HOF) - 블록 매니지먼트 최신 패턴과 일관성 유지

### Phase 4: YouTube Service Functions 구현

**파일**: `apps/web/src/domains/youtube-app-space/backend/services/youtube.service.ts` (NEW)

**백엔드 패턴 준수**: Service Function 패턴 사용

```typescript
/**
 * YouTube 생성 또는 조회 Service Function
 *
 * 패턴: SafeDTO → Command → Aggregate
 */
export async function getOrCreateYoutube(
  safeDto: GetOrCreateYoutubeRequest, // SafeDTO
  userId: UserId, // Value Object
  youtubeRepository: IYoutubeRepository, // Repository 주입
  youtubeApiService: YoutubeApiService
): Promise<Result<YoutubeEntity, Error>> {
  try {
    // 1. 기존 확인
    const existing = await youtubeRepository.findByVideoId(safeDto.videoId);
    if (existing) {
      return Result.success(existing);
    }

    // 2. YouTube API로 메타데이터 가져오기
    const metadata = await youtubeApiService.getVideoMetadata(safeDto.videoId);

    // 3. SafeDTO → Command 변환
    const command: CreateYoutubeCommand = {
      videoId: safeDto.videoId,
      title: metadata.title,
      description: metadata.description,
      channelId: metadata.channelId,
      thumbnailUrl: metadata.thumbnailUrl,
      userId: userId.value,
    };

    // 4. Aggregate 생성 (Command → Event)
    // TODO: YoutubeAggregate.create(command) 구현 필요

    // 5. Repository에 저장
    const youtube = await youtubeRepository.create({
      video_id: command.videoId,
      title: command.title,
      // ...
    });

    return Result.success(youtube);
  } catch (error) {
    return Result.error(error);
  }
}

/**
 * 스크립트 추출 Service Function
 *
 * 패턴: Aggregate 인스턴스 메서드 사용
 */
export async function extractScript(
  safeDto: ExtractScriptRequest, // SafeDTO
  userId: UserId,
  youtubeRepository: IYoutubeRepository,
  youtubeApiService: YoutubeApiService
): Promise<Result<YoutubeEntity, Error>> {
  try {
    // 1. YouTube 조회
    const youtube = await youtubeRepository.findById(safeDto.youtubeId);
    if (!youtube) {
      return Result.error(new Error('YouTube not found'));
    }

    // 2. 이미 스크립트가 있으면 반환
    if (youtube.script) {
      return Result.success(youtube);
    }

    // 3. YouTube API로 스크립트 추출
    const transcript = await youtubeApiService.getTranscript(youtube.videoId);

    // 4. SafeDTO → Command 변환
    const command: ExtractScriptCommand = {
      script: {
        transcript: transcript.map((t) => ({
          text: t.text,
          start: t.start,
          duration: t.duration,
        })),
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: transcript[transcript.length - 1]?.start || 0,
          totalSegments: transcript.length,
          language: transcript.language,
        },
      },
      scriptLanguage: transcript.language,
    };

    // 5. Aggregate 재구성 및 Command 처리
    // TODO: YoutubeAggregate.reconstitute(youtube) 후 extractScript(command)

    // 6. Repository 업데이트
    const updated = await youtubeRepository.updateScript(
      safeDto.youtubeId,
      command.script,
      command.scriptLanguage
    );

    return Result.success(updated);
  } catch (error) {
    return Result.error(error);
  }
}
```

## 파일 변경 요약

### YouTube App Space 도메인 (25개+)

**Schema & Migration**

1. `db/schemas/youtube-app-space-schema.ts`
2. `supabase/migrations/YYYYMMDD_create_youtube_app_space.sql`

**Shared Layer**

3. `domains/youtube-app-space/shared/entities/youtube.entity.ts`
4. `domains/youtube-app-space/shared/entities/channel.entity.ts`
5. `domains/youtube-app-space/shared/commands/youtube.commands.ts`
6. `domains/youtube-app-space/shared/commands/channel.commands.ts`
7. `domains/youtube-app-space/shared/events/youtube.events.ts`
8. `domains/youtube-app-space/shared/events/channel.events.ts`
9. `domains/youtube-app-space/shared/schemas/youtube.schemas.ts` (Zod)
10. `domains/youtube-app-space/shared/schemas/channel.schemas.ts` (Zod)
11. `domains/youtube-app-space/shared/dtos/requests/youtube.requests.ts`
12. `domains/youtube-app-space/shared/dtos/requests/channel.requests.ts`
13. `domains/youtube-app-space/shared/dtos/responses/youtube.responses.ts`
14. `domains/youtube-app-space/shared/dtos/responses/channel.responses.ts`

**Backend Layer**

15. `domains/youtube-app-space/backend/repositories/interfaces/youtube.repository.interface.ts`
16. `domains/youtube-app-space/backend/repositories/interfaces/channel.repository.interface.ts`
17. `domains/youtube-app-space/backend/repositories/implementations/drizzle-youtube.repository.ts`
18. `domains/youtube-app-space/backend/repositories/implementations/drizzle-channel.repository.ts`
19. `domains/youtube-app-space/backend/services/youtube.service.ts` (Service Functions)
20. `domains/youtube-app-space/backend/services/channel.service.ts` (Service Functions)
21. `domains/youtube-app-space/backend/services/youtube-api.service.ts` (YouTube API 연동)

**Actions Layer**

22. `domains/youtube-app-space/actions/secure-action.ts` (withYoutubeSecureAction HOF)
23. `domains/youtube-app-space/actions/youtube.actions.ts` (createYoutube, getYoutubeScript, extractScript)
24. `domains/youtube-app-space/actions/channel.actions.ts` (createChannel, updateChannel)

**Frontend Layer**

25. `domains/youtube-app-space/frontend/hooks/use-youtube-script.ts`

## 구현 순서

### Stage 1: YouTube App Space 도메인 구축

1. youtube-app-space 스키마 정의 및 마이그레이션
2. 도메인 폴더 구조 생성 (image-app-space 패턴)
3. YouTube Entity, Value Objects, Commands, Events 정의
4. Zod 스키마 정의 (Request DTO)
5. YouTube Repository 인터페이스 및 Drizzle 구현
6. Channel Repository 인터페이스 및 Drizzle 구현
7. YouTube Service Functions 구현 (백엔드 패턴 준수)

                                                - getOrCreateYoutube (SafeDTO → Command → Aggregate)
                                                - extractScript (Aggregate 인스턴스 메서드 패턴)

8. Channel Service Functions 구현
9. YouTube API Service 구현 (외부 API 연동)
10. **YouTube 전용 secure action wrapper 구현** (withYoutubeSecureAction)
11. **YouTube Server Actions 구현** (블록 매니지먼트 패턴 준수)

                                                                - createYoutubeAction
                                                                - getYoutubeScriptAction (권한 체크 포함)
                                                                - extractScriptAction (권한 체크 포함)

12. Channel Server Actions 구현

                                                                - createChannelAction

### Stage 2: 동적 탭 시스템

13. 타입 및 인터페이스 정의
14. Dynamic Import Registry 시스템 구축 (action-prefetch.ts 패턴)
15. YouTube 블록용 탭 config 정의
16. YouTube Properties 업데이트 (script 제거, youtubeId 추가)

### Stage 3: Script Section 구현

17. ScriptSection 컴포넌트 구현 (youtube-app-space Actions 연동)
18. BlockContentTabsSection 구현 (비동기 config 로딩)
19. NoteSection 리팩토링
20. ContentArea 통합

### Stage 4: 검증 및 최적화

21. 번들 크기 검증
22. 데이터 중복 제거 테스트 (같은 영상 여러 블록)
23. 권한 체크 테스트 (블록 소유자만 접근)
24. 백엔드 패턴 준수 검증 (SafeDTO → Command → Aggregate)
25. (선택) Prefetch 최적화
26. 문서 작성
27. (선택) 다른 블록 타입 확장