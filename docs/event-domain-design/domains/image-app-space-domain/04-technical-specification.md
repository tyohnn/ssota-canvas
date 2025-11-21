# Technical Specification: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-11-19  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**DDD Conventions**: `docs/event-domain-design/discussion/architecture-conventions/server-side-ddd-conventions.md`

---

> **가이드 참조**: `docs/event-domain-design/guide/04-technical-specification-guide.md`  
> **작성 시점**: Software Design 완료 후, 실제 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요

Image App Space Domain은 `image_app_space` 별도 스키마를 사용하며, Repository Pattern + Service Layer로 구현합니다.

**핵심 전략**:
- **Trust Boundary**: Server Action에서 unknown → Zod 검증
- **Result Pattern**: 함수형 에러 처리
- **Repository Pattern**: Drizzle ORM 사용
- **Service Layer**: 비즈니스 로직 캡슐화

### Software Design 연결점

- **입력**: `03-software-design.md` - 3개 Aggregate
- **출력**: Value Objects, Entities, Aggregates, Repository, Service, Actions

### TDD 구현 순서 요약

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - 0개 (단순 JSONB 사용)
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 1개 (ImageAssetEntity)
Phase 3: Aggregates (⭐️⭐️⭐️⭐️) - 3개
Phase 4: Repository (⭐️⭐️⭐️⭐️) - 2개
Phase 5: Service (⭐️⭐️⭐️⭐️) - 2개
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 7개
Phase 7: Integration Tests (⭐️⭐️⭐️⭐️⭐️) - 주요 시나리오
```

---

## 🧩 DDD Components

> **DDD Conventions 참조**: Value Objects, Entities, Aggregates 패턴

### 설계 결정: Value Objects 생략

**이유**:
- ImageAsset의 속성들은 대부분 단순 타입 (string, number, boolean)
- 복잡한 검증 로직이 불필요
- metadata는 JSONB로 유연하게 관리
- tags는 단순 string[] 배열

**대신 사용**:
- Zod 스키마로 검증 (`shared/schemas/`)
- Entity 레벨에서 비즈니스 규칙 검증

---

## 🧩 Entities 수도코드

### 1. ImageAssetEntity

**파일 위치**: `src/domains/image-app-space/shared/entities/image-asset.entity.ts`

**역할**: ImageAsset의 비즈니스 로직과 규칙을 캡슐화

**주요 속성**:
- id: string (UUID)
- assetType: 'ai-generated' | 'unsplash' | 'user-upload'
- imageUrl: string
- metadata: Record<string, any> (JSONB)
- title?: string
- tags: string[]
- category?: ImageCategory
- createdBy: string (UUID)
- workspaceId: string (UUID)
- isPublic: boolean
- isDeleted: boolean
- 통계: viewCount, likeCount, bookmarkCount, useCount
- 타임스탬프: createdAt, updatedAt, deletedAt

**주요 메서드 (비즈니스 규칙)**:
```
canSetPublic(): { valid: boolean; reason?: string }
  검증:
    - title이 있는지
    - category가 있는지
  반환: { valid: true } 또는 { valid: false, reason: '...' }

canEdit(userId: string): boolean
  검증:
    - createdBy === userId
  반환: boolean

canView(userId: string): boolean
  검증:
    - createdBy === userId OR
    - (isPublic === true AND isDeleted === false)
  반환: boolean

getPopularityScore(): number
  계산: viewCount + likeCount * 2 + bookmarkCount * 3
  반환: number
```

**사용 시나리오**:
- Scenario 6: 메타데이터 수정 시 권한 검증 (canEdit)
- Scenario 7: Public 전환 시 필수 필드 검증 (canSetPublic)
- Scenario 3: Community Feed 조회 시 권한 검증 (canView)

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

## 📦 Aggregates 수도코드

> **DDD Conventions 참조**: Aggregate는 사용하지 않고 Entity + Service 패턴

### 설계 결정: Aggregate 생략

**이유**:
- ImageAsset, CommunityInteraction은 상태가 단순함
- 복잡한 트랜잭션 경계가 없음
- Entity + Service로 충분히 비즈니스 로직 처리 가능

**대신 사용**:
- **Entity**: 비즈니스 규칙 검증 메서드
- **Service**: Command 처리 및 비즈니스 로직
- **Repository**: 데이터 액세스

---

## 📚 Repository 수도코드

> **DDD Conventions 참조**: Repository Interface + Drizzle 구현체

### 1. ImageAssetRepository

**파일 위치**: 
- Interface: `backend/repositories/image-asset.repository.interface.ts`
- 구현체: `backend/repositories/drizzle-image-asset.repository.ts`

**역할**: image_app_space.image_assets 테이블 접근

**주요 메서드**:
```
create(data: NewImageAsset): Promise<ImageAsset>
  입력: NewImageAsset (Drizzle Insert 타입)
  로직:
    1. image_assets 테이블에 INSERT
    2. returning() 으로 생성된 레코드 반환
  반환: ImageAsset

findById(id: string): Promise<ImageAsset | null>
  입력: UUID string
  로직:
    1. WHERE id = $id
    2. findFirst() 사용
  반환: ImageAsset | null

findByIdWithCreator(id: string): Promise<ImageAssetWithCreator | null>
  입력: UUID string
  로직:
    1. image_assets LEFT JOIN public.profiles
    2. ON created_by = profiles.id
    3. creatorProfile 객체 생성
  반환: ImageAssetWithCreator | null

findByIdWithStats(id: string, currentUserId: string): Promise<ImageAssetWithStats | null>
  입력: imageAssetId, 현재 사용자 ID
  로직:
    1. image_assets LEFT JOIN profiles
    2. isLiked subquery: EXISTS(SELECT 1 FROM image_likes WHERE ...)
    3. isBookmarked subquery: EXISTS(SELECT 1 FROM image_bookmarks WHERE ...)
  반환: ImageAssetWithStats | null

findPublicImages(params): Promise<ImageAssetWithStats[]>
  입력: { sort, category?, page, perPage }
  로직:
    1. WHERE is_public = true AND is_deleted = false
    2. AND created_at > NOW() - INTERVAL '30 days'
    3. category 필터링 (있으면)
    4. ORDER BY:
       - trending: (view_count + like_count * 2 + bookmark_count * 3) DESC
       - recent: created_at DESC
       - views: view_count DESC
    5. LIMIT perPage OFFSET (page-1) * perPage
    6. LEFT JOIN profiles
  반환: ImageAssetWithStats[]

findFollowingUserImages(params): Promise<ImageAssetWithStats[]>
  입력: { userId, page, perPage }
  로직:
    1. image_assets INNER JOIN user_follows
    2. ON created_by = followee_id
    3. WHERE follower_id = $userId
    4. AND is_public = true AND is_deleted = false
    5. ORDER BY created_at DESC
    6. LEFT JOIN profiles
  반환: ImageAssetWithStats[]

updateMetadata(id: string, data): Promise<ImageAsset>
  입력: imageAssetId, { title?, description?, tags?, category? }
  로직:
    1. UPDATE image_assets
    2. SET title, description, tags, category, updated_at = NOW()
    3. WHERE id = $id
    4. RETURNING *
  반환: ImageAsset

updateVisibility(id: string, isPublic: boolean): Promise<ImageAsset>
  입력: imageAssetId, isPublic
  로직:
    1. UPDATE image_assets
    2. SET is_public = $isPublic, updated_at = NOW()
    3. WHERE id = $id
    4. RETURNING *
  반환: ImageAsset

softDelete(id: string): Promise<void>
  로직:
    1. UPDATE image_assets
    2. SET is_deleted = true, deleted_at = NOW()
    3. WHERE id = $id

restore(id: string): Promise<void>
  로직:
    1. UPDATE image_assets
    2. SET is_deleted = false, deleted_at = NULL
    3. WHERE id = $id
```

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 2. CommunityInteractionRepository

**파일 위치**:
- Interface: `backend/repositories/community-interaction.repository.interface.ts`
- 구현체: `backend/repositories/drizzle-community-interaction.repository.ts`

**역할**: image_likes, image_bookmarks, user_follows, image_views 테이블 접근

**주요 메서드**:
```
createLike(data: NewImageLike): Promise<ImageLike>
  로직: INSERT INTO image_likes
  반환: ImageLike

deleteLike(userId: string, imageAssetId: string): Promise<void>
  로직: DELETE FROM image_likes WHERE user_id AND image_asset_id

findLike(userId, imageAssetId): Promise<ImageLike | null>
  로직: SELECT FROM image_likes WHERE ...

isLiked(userId, imageAssetId): Promise<boolean>
  로직: findLike 호출 후 null 체크

createBookmark(data: NewImageBookmark): Promise<ImageBookmark>
  로직: INSERT INTO image_bookmarks

deleteBookmark(userId, imageAssetId): Promise<void>
  로직: DELETE FROM image_bookmarks

createFollow(data: NewUserFollow): Promise<UserFollow>
  로직: INSERT INTO user_follows
  제약: follower_id != followee_id (CHECK)

deleteFollow(followerId, followeeId): Promise<void>
  로직: DELETE FROM user_follows

getFollowerCount(userId: string): Promise<number>
  로직: SELECT COUNT(*) FROM user_follows WHERE followee_id = $userId

getFollowingCount(userId: string): Promise<number>
  로직: SELECT COUNT(*) FROM user_follows WHERE follower_id = $userId

createView(data: NewImageView): Promise<ImageView>
  로직: INSERT INTO image_views

hasViewedRecently(userId | null, imageAssetId, withinMinutes): Promise<boolean>
  로직:
    1. SELECT FROM image_views
    2. WHERE image_asset_id = $id
    3. AND viewed_at > NOW() - INTERVAL '$minutes minutes'
    4. AND (user_id = $userId OR session_id = $sessionId)
  반환: boolean
```

**우선순위**: ⭐️⭐️⭐️⭐️

---

## 🎯 Service Layer 수도코드

> **DDD Conventions 참조**: Service는 비즈니스 로직 조율자

### 1. ImageAssetService

**파일 위치**: `backend/services/image-asset.service.ts`

**역할**: ImageAsset 관련 비즈니스 로직 처리

**주요 메서드**:
```
createImageAsset(command: CreateImageAssetCommand): Promise<Result<ImageAsset>>
  Process Model: Scenario 1, Sequence 2
  입력: CreateImageAssetCommand
  비즈니스 로직:
    1. Command 검증 (Zod 또는 이미 검증됨)
    2. NewImageAsset 객체 생성
       - asset_type, image_url, prompt, metadata 설정
       - is_public = false (기본값)
       - 통계 초기화 (모두 0)
    3. Repository.create() 호출
    4. Result.ok(imageAsset) 반환
  에러:
    - Repository 실패 → Result.err()
  반환: Result<ImageAsset>

updateMetadata(command: UpdateImageMetadataCommand, currentUserId: string): Promise<Result<ImageAsset>>
  Process Model: Scenario 6
  입력: UpdateImageMetadataCommand, 현재 사용자 ID
  비즈니스 로직:
    1. Repository.findById() 로 기존 ImageAsset 조회
    2. 없으면 → Result.err('Image not found')
    3. ImageAssetEntity.canEdit(currentUserId) 권한 검증
       - false → Result.err('Permission denied')
    4. 태그 개수 검증 (최대 10개)
       - 초과 → Result.err('Max 10 tags')
    5. Repository.updateMetadata() 호출
    6. Result.ok(updatedAsset) 반환
  에러:
    - 권한 없음
    - 태그 초과
    - Repository 실패
  반환: Result<ImageAsset>

changeVisibility(command: ChangeImageVisibilityCommand, currentUserId: string): Promise<Result<ImageAsset>>
  Process Model: Scenario 7
  입력: ChangeImageVisibilityCommand, 현재 사용자 ID
  비즈니스 로직:
    1. Repository.findById() 조회
    2. ImageAssetEntity.canEdit() 권한 검증
    3. Public 전환 시:
       - ImageAssetEntity.canSetPublic() 검증
       - false → Result.err('Title and category required')
       - command에 title/category 있으면 먼저 updateMetadata()
    4. Repository.updateVisibility() 호출
    5. Result.ok(updatedAsset) 반환
  에러:
    - 권한 없음
    - Public 전환 시 필수 필드 누락
  반환: Result<ImageAsset>

getImageAsset(imageAssetId: string, currentUserId: string): Promise<Result<ImageAssetWithStats>>
  입력: imageAssetId, 현재 사용자 ID
  비즈니스 로직:
    1. Repository.findByIdWithStats() 조회
    2. 없으면 → Result.err('Not found')
    3. ImageAssetEntity.canView(currentUserId) 권한 검증
       - false → Result.err('No permission')
    4. Result.ok(asset) 반환
  에러:
    - Not found
    - Permission denied
  반환: Result<ImageAssetWithStats>
```

**의존성**: ImageAssetRepository

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 2. CommunityInteractionService

**파일 위치**: `backend/services/community-interaction.service.ts`

**역할**: 커뮤니티 상호작용 비즈니스 로직

**주요 메서드**:
```
toggleLike(command: LikeImageCommand, currentUserId: string): Promise<Result<{ liked: boolean }>>
  Process Model: Scenario 3, Sequence 2
  입력: LikeImageCommand, 현재 사용자 ID
  비즈니스 로직:
    1. Repository.findLike(currentUserId, imageAssetId) 조회
    2. 존재하면:
       - Repository.deleteLike() 호출 (unlike)
       - Result.ok({ liked: false }) 반환
    3. 존재하지 않으면:
       - Repository.createLike() 호출
       - Result.ok({ liked: true }) 반환
  반환: Result<{ liked: boolean }>
  
  Note: like_count는 Database Trigger로 자동 업데이트

toggleBookmark(command: BookmarkImageCommand, currentUserId: string): Promise<Result<{ bookmarked: boolean }>>
  로직: toggleLike와 동일한 패턴
  반환: Result<{ bookmarked: boolean }>

toggleFollow(command: FollowUserCommand, currentUserId: string): Promise<Result<{ following: boolean }>>
  Process Model: Scenario 3, Sequence 3
  입력: FollowUserCommand, 현재 사용자 ID
  비즈니스 로직:
    1. 자기 자신 팔로우 방지
       - followee_id === currentUserId → Result.err('Cannot follow yourself')
    2. Repository.findFollow() 조회
    3. 존재하면 → Repository.deleteFollow() (unfollow)
    4. 존재하지 않으면 → Repository.createFollow()
    5. Result.ok({ following: true/false }) 반환
  에러:
    - 자기 자신 팔로우 시도
  반환: Result<{ following: boolean }>

recordView(imageAssetId: string, userId: string | null, sessionId?: string): Promise<Result<void>>
  입력: imageAssetId, userId (nullable), sessionId
  비즈니스 로직:
    1. Repository.hasViewedRecently(userId, imageAssetId, 30) 조회
    2. true (30분 이내 조회함) → Result.ok() (중복 방지)
    3. false → Repository.createView() 호출
    4. Result.ok() 반환
  반환: Result<void>
  
  Note: view_count는 별도 배치 작업으로 집계
```

**의존성**: CommunityInteractionRepository

**우선순위**: ⭐️⭐️⭐️⭐️

---

## 🌐 Server Actions 수도코드

> **DDD Conventions 참조**: Trust Boundary, unknown → Zod 검증

### 1. createImageAssetAction (Scenario 1)

**파일 위치**: `actions/image-asset.actions.ts`

**수도코드**:
```
createImageAssetAction(request: unknown): Promise<ActionResult<ImageAsset>>
  Trust Boundary 검증:
    1. CreateImageAssetRequestSchema.safeParse(request)
    2. 실패 → return err('Invalid request', INVALID_REQUEST)
    3. 성공 → validatedRequest
  
  인증:
    1. Supabase Auth 확인 (await createClient().auth.getUser())
    2. 없으면 → return err('Unauthorized', UNAUTHORIZED)
  
  의존성 주입:
    1. await createDrizzleSupabaseClient() → db
    2. new DrizzleImageAssetRepository(db.admin)
    3. new ImageAssetService(repository)
  
  비즈니스 로직:
    1. Command 생성: CreateImageAssetCommand
    2. service.createImageAsset(command) 호출
    3. result.isError() → return err(result.error)
    4. result.isSuccess() → return ok(result.value)
  
  에러 처리:
    - Validation 실패
    - Unauthorized
    - Repository 실패
```

**Process Model 매핑**: Scenario 1, Sequence 2

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 2. browseCommunityFeedAction (Scenario 3)

**수도코드**:
```
browseCommunityFeedAction(request: unknown): Promise<ActionResult<ImageAssetWithStats[]>>
  Trust Boundary 검증:
    1. BrowseCommunityFeedRequestSchema.safeParse(request)
  
  인증: 필수 (authenticated users only)
  
  의존성 주입:
    1. DrizzleImageAssetRepository
  
  비즈니스 로직:
    1. repository.findPublicImages(params) 호출
       - sort, category, page, perPage 전달
    2. return ok(images)
  
  에러:
    - Validation 실패
    - Repository 실패
```

**Process Model 매핑**: Scenario 3, Sequence 1

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 3. toggleLikeAction (Scenario 3)

**수도코드**:
```
toggleLikeAction(request: unknown, currentUserId: string): Promise<ActionResult<{ liked: boolean }>>
  Trust Boundary 검증:
    1. LikeImageRequestSchema.safeParse(request)
  
  인증: currentUserId 필수
  
  의존성 주입:
    1. DrizzleCommunityInteractionRepository
    2. CommunityInteractionService
  
  비즈니스 로직:
    1. Command 생성: LikeImageCommand
    2. service.toggleLike(command, currentUserId) 호출
    3. return ok(result)
  
  에러:
    - Validation 실패
    - Service 에러
```

**Process Model 매핑**: Scenario 3, Sequence 2

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 4. toggleBookmarkAction (Scenario 2, 3)

**수도코드**: toggleLikeAction과 동일한 패턴

**Process Model 매핑**: Scenario 2, Sequence 2

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 5. toggleFollowAction (Scenario 3)

**수도코드**:
```
toggleFollowAction(request: unknown, currentUserId: string): Promise<ActionResult<{ following: boolean }>>
  Trust Boundary 검증:
    1. FollowUserRequestSchema.safeParse(request)
  
  의존성 주입:
    1. DrizzleCommunityInteractionRepository
    2. CommunityInteractionService
  
  비즈니스 로직:
    1. service.toggleFollow(command, currentUserId) 호출
    2. Service에서 자기 자신 팔로우 방지 검증
    3. return ok(result)
  
  에러:
    - 자기 자신 팔로우 시도
    - Repository 실패
```

**Process Model 매핑**: Scenario 3, Sequence 3

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 6. updateImageMetadataAction (Scenario 6)

**수도코드**:
```
updateImageMetadataAction(request: unknown, currentUserId: string): Promise<ActionResult<ImageAsset>>
  Trust Boundary 검증:
    1. UpdateImageMetadataRequestSchema.safeParse(request)
  
  의존성 주입:
    1. DrizzleImageAssetRepository
    2. ImageAssetService
  
  비즈니스 로직:
    1. service.updateMetadata(command, currentUserId) 호출
    2. Service에서 권한 검증 (canEdit)
    3. Service에서 태그 개수 검증 (최대 10개)
    4. return ok(updatedAsset)
  
  에러:
    - Permission denied
    - Tag limit exceeded
    - Repository 실패
```

**Process Model 매핑**: Scenario 6

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 7. changeImageVisibilityAction (Scenario 7)

**수도코드**:
```
changeImageVisibilityAction(request: unknown, currentUserId: string): Promise<ActionResult<ImageAsset>>
  Trust Boundary 검증:
    1. ChangeImageVisibilityRequestSchema.safeParse(request)
  
  의존성 주입:
    1. DrizzleImageAssetRepository
    2. ImageAssetService
  
  비즈니스 로직:
    1. service.changeVisibility(command, currentUserId) 호출
    2. Service에서 권한 검증 (canEdit)
    3. Public 전환 시:
       - canSetPublic() 검증
       - 실패 → Result.err('Title and category required')
    4. return ok(updatedAsset)
  
  Query Invalidation (Frontend):
    - ['image-asset', imageAssetId]
    - ['community-feed'] (Public일 때)
  
  에러:
    - Permission denied
    - Missing required fields (title, category)
```

**Process Model 매핑**: Scenario 7

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 8. browseFollowingFeedAction (Scenario 5)

**수도코드**:
```
browseFollowingFeedAction(request: unknown, currentUserId: string): Promise<ActionResult<ImageAssetWithStats[]>>
  Trust Boundary 검증:
    1. BrowseFollowingFeedRequestSchema.safeParse(request)
  
  의존성 주입:
    1. DrizzleImageAssetRepository
  
  비즈니스 로직:
    1. repository.findFollowingUserImages({ userId, page, perPage }) 호출
    2. return ok(images)
  
  에러:
    - Validation 실패
    - Repository 실패
```

**Process Model 매핑**: Scenario 5, Sequence 1

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 9. recordImageViewAction (조회수 기록)

**수도코드**:
```
recordImageViewAction(imageAssetId: string, userId: string | null, sessionId?: string): Promise<ActionResult<void>>
  인증: Optional (anon 허용)
  
  의존성 주입:
    1. DrizzleCommunityInteractionRepository
    2. CommunityInteractionService
  
  비즈니스 로직:
    1. service.recordView(imageAssetId, userId, sessionId) 호출
    2. Service에서 30분 중복 체크
    3. 중복이면 → 기록하지 않음
    4. 중복 아니면 → Repository.createView() 호출
    5. return ok()
  
  에러 처리: Silent fail (조회수는 중요하지 않음)
```

**우선순위**: ⭐️⭐️⭐️

---

## 🔗 Integration Services (External Systems)

> **주의**: 아래 서비스들은 현재 `block-management` 도메인에 있지만, `image-app-space`로 이동 필요

### 1. ImageGenerationService (AI 이미지 생성)

**현재 위치**: `block-management/backend/services/image-generation.service.ts`  
**이동 위치**: `image-app-space/backend/services/image-generation.service.ts`

**역할**: OpenAI/Google AI SDK를 통한 이미지 생성 + Supabase Storage 업로드

**주요 메서드**:
```
generate(request: GenerateImageRequest, userId, pageId, blockId): Promise<ImageGenerationResult>
  Process Model: Scenario 1, Sequence 1
  입력: GenerateImageRequest
  비즈니스 로직:
    1. 모델 정보 조회 (getImageGenerationModel)
    2. Helicone 헤더 생성 (buildHeliconeHeaders)
    3. Provider 선택:
       - OpenAI: openai.image('gpt-image-1')
       - Google: google.image('gemini-2.5-flash-image')
    4. generateImage() 호출 (AI SDK)
       - prompt, n (outputCount), size/aspectRatio, seed, providerOptions
    5. 생성된 이미지 순회:
       - 프롬프트 해시 생성 (MD5, 8자)
       - uploadGeneratedAssetToSupabase() 호출
       - ImageAsset 형식으로 변환
    6. ImageGenerationResult 반환
       - images: ImageAsset[]
       - metadata: { provider, modelId, latency }
  
  에러:
    - 지원하지 않는 모델
    - AI API 실패
    - Storage 업로드 실패
```

**의존성**:
- AI SDK: `experimental_generateImage`
- Helicone: `createHeliconeOpenAI`, `createHeliconeGoogle`
- Storage: `uploadGeneratedAssetToSupabase`
- Config: `getImageGenerationModel`

**연동**: Scenario 1에서 생성 후 createImageAssetAction 호출하여 ImageAsset 저장

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 2. ImageSearchService (Unsplash + SSOTA 통합 검색)

**현재 위치**: `block-management/backend/services/image-search.service.ts`  
**이동 위치**: `image-app-space/backend/services/image-search.service.ts`

**역할**: SSOTA Image Vault (시맨틱 검색) + Unsplash (키워드 검색) 통합

**주요 메서드**:
```
searchImages(params: SearchParams): Promise<SearchResult>
  Process Model: Scenario 2 (Unsplash 검색)
  입력: { query, searchType, topK, page }
  비즈니스 로직:
    1. searchType에 따라 병렬 검색:
       - semantic: searchSsotaImagesSemantic()만
       - keyword: searchUnsplashByKeyword()만
       - combined: 둘 다
    2. Promise.allSettled로 병렬 실행
    3. 에러 개별 처리 (한쪽 실패해도 다른쪽 결과 반환)
    4. mergeResults() 로 스코어 기반 병합
    5. 페이지네이션 적용
    6. SearchResult 반환
       - images, total, page, perPage
       - metadata: { ssotaCount, unsplashCount, searchTime }
  
  에러: 
    - Unsplash API 실패 → 로깅 후 빈 배열
    - SSOTA 실패 → 로깅 후 빈 배열

searchSsotaImagesSemantic(query, topK): Promise<ImageAsset[]>
  로직:
    1. 쿼리를 임베딩으로 변환 (OpenAI embedding API)
    2. Vector DB에서 유사도 검색
    3. topK 개의 이미지 반환
  
  현재 상태: TODO (Mock 데이터 반환)

searchUnsplashByKeyword(query, page, perPage): Promise<ImageAsset[]>
  로직:
    1. Unsplash Search API 호출
    2. client_id, query, page, per_page 파라미터
    3. 응답을 ImageAsset 형식으로 변환
       - id: 'unsplash:{id}'
       - url, thumbnailUrl, alt
       - source: 'unsplash'
       - metadata: { authorName, authorLink, unsplashId }
    4. ImageAsset[] 반환
  
  에러:
    - API Key 없음 → 빈 배열
    - API 실패 → throw

mergeResults(ssotaImages, unsplashImages, params): ImageAsset[]
  로직:
    1. searchType에 따라 가중치 계산
       - semantic: { ssota: 1.0, unsplash: 0.0 }
       - keyword: { ssota: 0.0, unsplash: 1.0 }
       - combined: { ssota: 0.6, unsplash: 0.4 }
    2. 각 이미지에 스코어 할당 (순위 기반)
    3. 스코어 순 정렬
    4. 병합된 배열 반환
```

**의존성**:
- Unsplash API (REST)
- Vector DB (TODO)
- OpenAI Embedding API (TODO)

**연동**: Unsplash 검색 결과를 북마크 시 createImageAssetAction으로 저장

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 3. 추가 Server Actions (기존 코드)

**generateImageAssetsAction**

**현재 위치**: `block-management/actions/generate-image-assets.action.ts`  
**이동 위치**: `image-app-space/actions/image-generation.actions.ts`

**수도코드**:
```
generateImageAssetsAction(request: unknown, pageId: string, blockId: string): Promise<ActionResult<ImageGenerationResult>>
  Trust Boundary 검증:
    1. GenerateImageRequestSchema.safeParse(request)
  
  인증 및 권한:
    1. getAuthenticatedUser()
    2. verifyAccess(orgId, workspaceId, userId)
  
  의존성 주입:
    1. new ImageGenerationService()
  
  비즈니스 로직:
    1. service.generate(request, userId, pageId, blockId) 호출
    2. ImageGenerationResult 반환
       - images: ImageAsset[] (Supabase Storage URL 포함)
       - metadata: { provider, modelId, latency }
  
  연동 포인트:
    ⚠️ 생성 완료 후 createImageAssetAction 호출 필요
    - 각 생성된 이미지를 image_assets에 저장
    - asset_type: 'ai-generated'
    - prompt, metadata 저장
```

**Process Model 매핑**: Scenario 1, Sequence 1

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

**searchImageAssetsAction**

**현재 위치**: `block-management/actions/image-search.actions.ts`  
**이동 위치**: `image-app-space/actions/image-search.actions.ts`

**수도코드**:
```
searchImageAssetsAction(request: unknown): Promise<ActionResult<SearchResult>>
  Trust Boundary 검증:
    1. SearchImageAssetsRequestSchema.safeParse(request)
  
  인증 및 권한:
    1. getAuthenticatedUser()
    2. verifyAccess(orgId, workspaceId, userId)
  
  의존성 주입:
    1. new ImageSearchService()
  
  비즈니스 로직:
    1. service.searchImages(params) 호출
    2. SSOTA (시맨틱) + Unsplash (키워드) 병합 검색
    3. SearchResult 반환
       - images: ImageAsset[]
       - metadata: { ssotaCount, unsplashCount, searchTime }
```

**Process Model 매핑**: Scenario 2 (Unsplash 검색 부분)

**우선순위**: ⭐️⭐️⭐️⭐️

---

**searchUnsplashImagesAction**

**현재 위치**: `image-search.actions.ts`  
**역할**: Unsplash 직접 검색 (인증 불필요)

**수도코드**:
```
searchUnsplashImagesAction(query?: string, category?: string): Promise<ActionResult<UnsplashImage[]>>
  인증: Optional (Public API)
  
  비즈니스 로직:
    1. UNSPLASH_ACCESS_KEY 확인
    2. 검색어 조합 (query + category)
    3. Unsplash API 호출
       - 검색어 있으면: /search/photos
       - 없으면: /photos/random
    4. 응답을 UnsplashImage[] 형식으로 변환
    5. 중복 제거 (image.id 기준)
    6. return ok(images)
  
  에러:
    - API Key 없음
    - API 실패
```

**우선순위**: ⭐️⭐️⭐️⭐️

---

**trackUnsplashDownloadAction**

**현재 위치**: `image-search.actions.ts`  
**역할**: Unsplash 다운로드 트래킹 (필수)

**수도코드**:
```
trackUnsplashDownloadAction(imageId: string): Promise<ActionResult<void>>
  인증: Optional
  
  비즈니스 로직:
    1. Unsplash 다운로드 엔드포인트 호출
       - GET /photos/{id}/download?client_id={accessKey}
    2. return ok()
  
  에러 처리: Silent fail (트래킹 실패는 critical하지 않음)
```

**Process Model**: Unsplash 이미지 사용 시 필수 호출

**우선순위**: ⭐️⭐️⭐️

---

## 📁 폴더 구조 (업데이트)

```
src/domains/image-app-space/
├── shared/
│   ├── schemas/
│   │   └── index.ts (Zod 스키마)
│   ├── entities/
│   │   └── image-asset.entity.ts
│   ├── types/
│   │   └── index.ts
│   ├── dtos/
│   │   ├── commands.ts
│   │   ├── requests.ts
│   │   └── views.ts
│   └── config/
│       └── image-generation-models.ts (from block-management)
├── backend/
│   ├── repositories/
│   │   ├── image-asset.repository.interface.ts
│   │   ├── drizzle-image-asset.repository.ts
│   │   ├── community-interaction.repository.interface.ts
│   │   └── drizzle-community-interaction.repository.ts
│   └── services/
│       ├── image-asset.service.ts
│       ├── community-interaction.service.ts
│       ├── image-generation.service.ts (from block-management) ⚠️
│       └── image-search.service.ts (from block-management) ⚠️
└── actions/
    ├── image-asset.actions.ts
    ├── community-interaction.actions.ts
    ├── image-generation.actions.ts (from block-management) ⚠️
    └── image-search.actions.ts (from block-management) ⚠️
```

**⚠️ 이동 필요한 파일들**:
- `block-management/backend/services/image-generation.service.ts`
- `block-management/backend/services/image-search.service.ts`
- `block-management/actions/generate-image-assets.action.ts`
- `block-management/actions/image-search.actions.ts`
- `block-management/shared/config/image-generation-models.ts`

---

## 🎯 TDD 구현 순서

### Phase 1: Entities (⭐️⭐️⭐️⭐️⭐️)
1. **ImageAssetEntity**
   - canSetPublic() 테스트
   - canEdit() 테스트
   - canView() 테스트
   - getPopularityScore() 테스트

### Phase 2: Repository (⭐️⭐️⭐️⭐️)
1. **ImageAssetRepository 인터페이스** 정의
2. **CommunityInteractionRepository 인터페이스** 정의
3. **Drizzle 구현체** (통합 테스트)
   - findPublicImages() 쿼리 테스트
   - findFollowingUserImages() JOIN 테스트

### Phase 3: Service (⭐️⭐️⭐️⭐️)
1. **ImageAssetService**
   - createImageAsset() 테스트
   - updateMetadata() 테스트 (권한, 태그 제한)
   - changeVisibility() 테스트 (권한, 필수 필드)
   - getImageAsset() 테스트 (권한 체크)

2. **CommunityInteractionService**
   - toggleLike() 테스트 (toggle 로직)
   - toggleBookmark() 테스트
   - toggleFollow() 테스트 (자기 자신 방지)
   - recordView() 테스트 (30분 중복 방지)

### Phase 4: Integration Services (⭐️⭐️⭐️⭐️⭐️)
1. **ImageGenerationService** (이동)
   - generate() 통합 테스트
   - OpenAI 모델 테스트
   - Google 모델 테스트
   - Storage 업로드 테스트

2. **ImageSearchService** (이동)
   - searchImages() 통합 테스트
   - Unsplash 검색 테스트
   - 결과 병합 테스트

### Phase 5: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. **Image Asset Actions**
   - createImageAssetAction
   - browseCommunityFeedAction
   - browseFollowingFeedAction
   - updateImageMetadataAction
   - changeImageVisibilityAction

2. **Community Actions**
   - toggleLikeAction
   - toggleBookmarkAction
   - toggleFollowAction
   - recordImageViewAction

3. **Integration Actions** (이동)
   - generateImageAssetsAction
   - searchImageAssetsAction
   - searchUnsplashImagesAction
   - trackUnsplashDownloadAction

### Phase 6: Integration Tests (⭐️⭐️⭐️⭐️⭐️)
- **Scenario 1**: AI 이미지 생성 → ImageAsset 저장 → Workspace Library 조회
- **Scenario 3**: Community Feed 조회 → 좋아요 → 통계 업데이트 (Trigger)
- **Scenario 7**: Private → Public 전환 (필수 필드 검증) → Community Feed 노출

---

## 🔄 도메인 간 코드 이동 계획

### Block Management → Image App Space

**이동할 파일들**:
1. `image-generation.service.ts` + `generate-image-assets.action.ts`
2. `image-search.service.ts` + `image-search.actions.ts`
3. `image-generation-models.ts` (config)
4. 관련 types 및 DTOs

**이유**:
- 이미지 생성/검색은 Image App Space의 핵심 기능
- Block Management는 블록 관리만 담당
- 도메인 경계 명확화

**영향**:
- Block Management의 import 경로 업데이트 필요
- AI 이미지 생성 후 ImageAsset 저장 로직 추가 필요

---

## 📊 구현 체크리스트

### Entities
- [ ] ImageAssetEntity
  - [ ] canSetPublic()
  - [ ] canEdit()
  - [ ] canView()
  - [ ] getPopularityScore()

### Repositories
- [ ] ImageAssetRepository 인터페이스
- [ ] DrizzleImageAssetRepository 구현
- [ ] CommunityInteractionRepository 인터페이스
- [ ] DrizzleCommunityInteractionRepository 구현

### Services
- [ ] ImageAssetService
- [ ] CommunityInteractionService
- [ ] ImageGenerationService (이동)
- [ ] ImageSearchService (이동)

### Server Actions
- [ ] createImageAssetAction
- [ ] browseCommunityFeedAction
- [ ] browseFollowingFeedAction
- [ ] toggleLikeAction
- [ ] toggleBookmarkAction
- [ ] toggleFollowAction
- [ ] updateImageMetadataAction
- [ ] changeImageVisibilityAction
- [ ] recordImageViewAction
- [ ] generateImageAssetsAction (이동)
- [ ] searchImageAssetsAction (이동)
- [ ] searchUnsplashImagesAction (이동)
- [ ] trackUnsplashDownloadAction (이동)

---

*이 Technical Specification은 Image App Space Domain의 구현 가이드입니다.*
