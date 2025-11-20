# Testing Strategy: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 시니어개발자 + QA  
**작성일**: 2025-11-19  
**버전**: v1.0

**Technical Specification 참조**: `06-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: TDD Implementation

---

> **가이드 참조**: `docs/event-domain-design/guide/05-testing-strategy-guide.md`  
> **작성 시점**: Technical Specification 완료 후, TDD 구현 시작 전  
> **목적**: 구현하기 전에 "무엇을 어떻게 테스트할지" 명확히 정의

---

## 📊 Testing Strategy Overview

### 도메인 테스트 전략 요약

Image App Space Domain은 **별도 스키마(image_app_space)**를 사용하며, 이미지 자산 관리와 커뮤니티 상호작용을 테스트합니다.

**핵심 테스트 전략**:
- Entity 비즈니스 규칙 테스트 (canSetPublic, canEdit, canView)
- Repository 쿼리 테스트 (Community Feed, Following Feed, JOIN 쿼리)
- Service 권한 및 검증 테스트
- Server Actions Trust Boundary 테스트
- Optimistic Update 통합 테스트

### Process Model 연결점

- **입력**: `02-process-model.md` - 7개 주요 시나리오
- **입력**: `06-technical-specification.md` - 1개 Entity, 2개 Repository, 2개 Service
- **출력**: Unit/Integration/E2E 테스트 케이스 40+ 개

### 커버리지 목표 요약

```
전체 코드 커버리지: 85% 이상
- Unit Tests:       70%  (15개 - Entity, Service)
- Integration Tests: 20%  (10개 - Repository, Server Actions)
- E2E Tests:        10%  (7개 - Process Model 시나리오별)
```

---

## 🗺️ Process Model → Test 매핑

> **가이드 참조**: Phase 2.2 - Process Model → Test 매핑

### Scenario 1: AI 이미지 생성 및 저장

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: GenerateImageCommand | Unit | ImageGenerationService.generate() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Image Generation Service | Integration | AI SDK 호출 + Storage 업로드 | ⭐️⭐️⭐️⭐️⭐️ |
| Command: CreateImageAssetCommand | Unit | ImageAssetService.createImageAsset() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Image Asset Manager | Unit | ImageAsset 생성 로직 | ⭐️⭐️⭐️⭐️ |
| Event: ImageAssetCreated | Integration | DB 저장 검증 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | generateImageAssetsAction + createImageAssetAction | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 | E2E | 프롬프트 입력 → 생성 → 저장 → Workspace Library 조회 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 2: Unsplash 이미지 북마크

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| System: Unsplash Integration Service | Integration | Unsplash API 호출 | ⭐️⭐️⭐️⭐️ |
| Command: BookmarkUnsplashImageCommand | Unit | CommunityInteractionService.toggleBookmark() | ⭐️⭐️⭐️⭐️ |
| Event: UnsplashImageAssetCreated | Integration | Unsplash → ImageAsset 변환 | ⭐️⭐️⭐️⭐️ |
| Event: ImageBookmarked | Integration | image_bookmarks INSERT + bookmark_count 증가 | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | searchUnsplashImagesAction + bookmarkImageAction | ⭐️⭐️⭐️⭐️ |

### Scenario 3: 커뮤니티 피드 탐색 및 상호작용

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: BrowseCommunityFeedCommand | Integration | Repository.findPublicImages() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Community Feed Service | Integration | 인기순 정렬, 카테고리 필터 | ⭐️⭐️⭐️⭐️⭐️ |
| Command: LikeImageCommand | Unit | CommunityInteractionService.toggleLike() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Like Manager | Unit | Toggle 로직 (중복 방지) | ⭐️⭐️⭐️⭐️ |
| Event: ImageLiked | Integration | Database Trigger로 like_count 자동 증가 | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | browseCommunityFeedAction + toggleLikeAction | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 | E2E | Community 탭 → 좋아요 → count 증가 확인 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 4: 이미지 블록 적용

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: ApplyImageToBlockCommand | Integration | Block Management 연동 | ⭐️⭐️⭐️⭐️⭐️ |
| System: Image Application Service | Integration | updateBlockProperties() 호출 | ⭐️⭐️⭐️⭐️ |
| Event: ImageUsageRecorded | Integration | image_asset_usage INSERT + use_count 증가 | ⭐️⭐️⭐️⭐️ |

### Scenario 5: 팔로잉 피드

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: BrowseFollowingFeedCommand | Integration | Repository.findFollowingUserImages() | ⭐️⭐️⭐️⭐️ |
| System: Following Feed Service | Integration | user_follows JOIN 쿼리 | ⭐️⭐️⭐️⭐️ |
| Command: FollowUserCommand | Unit | CommunityInteractionService.toggleFollow() | ⭐️⭐️⭐️⭐️ |
| 비즈니스 규칙: 자기 자신 팔로우 방지 | Unit | Service 검증 로직 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 6: 메타데이터 편집

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: UpdateImageMetadataCommand | Unit | ImageAssetService.updateMetadata() | ⭐️⭐️⭐️⭐️ |
| 비즈니스 규칙: 권한 검증 | Unit | ImageAssetEntity.canEdit() | ⭐️⭐️⭐️⭐️⭐️ |
| 비즈니스 규칙: 태그 10개 제한 | Unit | Service 검증 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | updateImageMetadataAction() | ⭐️⭐️⭐️⭐️ |

### Scenario 7: 공개 설정 변경

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: ChangeImageVisibilityCommand | Unit | ImageAssetService.changeVisibility() | ⭐️⭐️⭐️⭐️ |
| 비즈니스 규칙: Public 필수 필드 | Unit | ImageAssetEntity.canSetPublic() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Image Visibility Manager | Unit | Public 전환 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: ImageSetToPublic | Integration | Community Feed에 노출 확인 | ⭐️⭐️⭐️⭐️ |

---

## 🧪 Unit Tests 전략

> **가이드 참조**: Phase 3.2 - Unit Tests 전략 작성

### 1. Entity 테스트

#### ImageAssetEntity

```typescript
describe('ImageAssetEntity', () => {
  describe('canSetPublic()', () => {
    it('제목과 카테고리가 있으면 Public 전환 가능해야 한다')
    it('제목이 없으면 Public 전환 불가해야 한다')
    it('카테고리가 없으면 Public 전환 불가해야 한다')
    it('검증 실패 시 이유를 반환해야 한다')
  })
  
  describe('canEdit()', () => {
    it('created_by와 userId가 같으면 편집 가능해야 한다')
    it('created_by와 userId가 다르면 편집 불가해야 한다')
  })
  
  describe('canView()', () => {
    it('본인이 생성한 이미지는 항상 볼 수 있어야 한다')
    it('Public이고 삭제되지 않은 이미지는 볼 수 있어야 한다')
    it('Private이고 타인 이미지는 볼 수 없어야 한다')
    it('삭제된 이미지는 볼 수 없어야 한다')
  })
  
  describe('getPopularityScore()', () => {
    it('view_count + like_count * 2 + bookmark_count * 3으로 계산되어야 한다')
    it('통계가 0일 때 0을 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 핵심 비즈니스 규칙, 권한 검증의 기초

---

### 2. Service 테스트

#### ImageAssetService

```typescript
describe('ImageAssetService', () => {
  describe('createImageAsset()', () => {
    it('유효한 Command로 ImageAsset을 생성해야 한다')
    it('생성 시 is_public이 false여야 한다')
    it('통계가 모두 0으로 초기화되어야 한다')
    it('Repository 실패 시 Result.err를 반환해야 한다')
  })
  
  describe('updateMetadata()', () => {
    it('권한이 있는 사용자는 메타데이터를 수정할 수 있어야 한다')
    it('권한이 없는 사용자는 Permission denied 에러를 반환해야 한다')
    it('태그가 10개를 초과하면 에러를 반환해야 한다')
    it('ImageAsset이 없으면 Not found 에러를 반환해야 한다')
  })
  
  describe('changeVisibility()', () => {
    it('권한이 있는 사용자는 공개 설정을 변경할 수 있어야 한다')
    it('Public 전환 시 제목이 없으면 에러를 반환해야 한다')
    it('Public 전환 시 카테고리가 없으면 에러를 반환해야 한다')
    it('Command에 title/category가 있으면 함께 업데이트해야 한다')
    it('Private로 변경은 항상 가능해야 한다')
  })
  
  describe('getImageAsset()', () => {
    it('본인 이미지는 조회할 수 있어야 한다')
    it('Public 이미지는 조회할 수 있어야 한다')
    it('Private이고 타인 이미지는 Permission denied 에러를 반환해야 한다')
    it('삭제된 이미지는 에러를 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 핵심 비즈니스 로직, 권한 검증

---

#### CommunityInteractionService

```typescript
describe('CommunityInteractionService', () => {
  describe('toggleLike()', () => {
    it('좋아요가 없으면 추가해야 한다')
    it('좋아요가 있으면 제거해야 한다')
    it('liked: true/false를 반환해야 한다')
    it('Repository 실패 시 에러를 반환해야 한다')
  })
  
  describe('toggleBookmark()', () => {
    it('북마크가 없으면 추가해야 한다')
    it('북마크가 있으면 제거해야 한다')
  })
  
  describe('toggleFollow()', () => {
    it('팔로우가 없으면 추가해야 한다')
    it('팔로우가 있으면 제거해야 한다')
    it('자기 자신을 팔로우하려 하면 에러를 반환해야 한다')
  })
  
  describe('recordView()', () => {
    it('30분 이내 중복 조회는 기록하지 않아야 한다')
    it('30분 이후 조회는 기록해야 한다')
    it('익명 사용자 조회도 기록해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Toggle 로직, 중복 방지 규칙

---

### 3. Integration Services 테스트

#### ImageGenerationService

```typescript
describe('ImageGenerationService', () => {
  describe('generate()', () => {
    it('OpenAI 모델로 이미지를 생성할 수 있어야 한다')
    it('Google 모델로 이미지를 생성할 수 있어야 한다')
    it('생성된 이미지를 Supabase Storage에 업로드해야 한다')
    it('프롬프트 해시를 파일명에 포함해야 한다')
    it('ImageAsset 형식으로 반환해야 한다')
    it('지원하지 않는 모델은 에러를 반환해야 한다')
    it('AI API 실패 시 에러를 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 핵심 기능, 외부 API 통합

---

#### ImageSearchService

```typescript
describe('ImageSearchService', () => {
  describe('searchImages()', () => {
    it('semantic 타입은 SSOTA만 검색해야 한다')
    it('keyword 타입은 Unsplash만 검색해야 한다')
    it('combined 타입은 둘 다 검색해야 한다')
    it('결과를 스코어 순으로 병합해야 한다')
    it('한쪽 실패해도 다른쪽 결과는 반환해야 한다')
  })
  
  describe('searchUnsplashByKeyword()', () => {
    it('Unsplash API를 호출해야 한다')
    it('ImageAsset 형식으로 변환해야 한다')
    it('저작권 정보를 metadata에 포함해야 한다')
    it('API Key가 없으면 빈 배열을 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

## 🔗 Integration Tests 전략

> **가이드 참조**: Phase 3.3 - Integration Tests 전략 작성

### 1. Repository 통합 테스트

#### ImageAssetRepository

```typescript
describe('ImageAssetRepository Integration', () => {
  describe('findPublicImages()', () => {
    it('is_public=true인 이미지만 반환해야 한다')
    it('is_deleted=false만 반환해야 한다')
    it('최근 30일 이미지만 반환해야 한다')
    it('trending 정렬이 정확해야 한다')
    it('카테고리 필터가 작동해야 한다')
    it('페이지네이션이 작동해야 한다')
    it('creatorProfile이 JOIN되어야 한다')
    it('isLiked, isBookmarked가 정확해야 한다')
  })
  
  describe('findFollowingUserImages()', () => {
    it('팔로우한 사용자의 이미지만 반환해야 한다')
    it('user_follows INNER JOIN이 정확해야 한다')
    it('최신순 정렬이 작동해야 한다')
  })
  
  describe('updateMetadata()', () => {
    it('메타데이터가 업데이트되어야 한다')
    it('updated_at이 갱신되어야 한다')
    it('RETURNING으로 업데이트된 레코드를 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 복잡한 쿼리 (JOIN, 정렬, 필터)

---

### 2. Server Actions 통합 테스트

#### browseCommunityFeedAction

```typescript
describe('browseCommunityFeedAction Integration', () => {
  it('유효한 요청으로 Community Feed를 조회해야 한다')
  it('인증되지 않은 요청은 거부해야 한다')
  it('잘못된 요청은 INVALID_REQUEST 에러를 반환해야 한다')
  it('trending 정렬이 작동해야 한다')
  it('카테고리 필터가 작동해야 한다')
  it('페이지네이션이 작동해야 한다')
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

#### toggleLikeAction

```typescript
describe('toggleLikeAction Integration', () => {
  it('좋아요가 없으면 추가하고 liked: true를 반환해야 한다')
  it('좋아요가 있으면 제거하고 liked: false를 반환해야 한다')
  it('Database Trigger로 like_count가 자동 업데이트되어야 한다')
  it('인증되지 않은 요청은 거부해야 한다')
  it('잘못된 image_asset_id는 에러를 반환해야 한다')
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Database Trigger 동작 검증 필요

---

### 3. Database Trigger 테스트

```typescript
describe('Database Triggers', () => {
  describe('sync_like_count', () => {
    it('image_likes INSERT 시 like_count가 증가해야 한다')
    it('image_likes DELETE 시 like_count가 감소해야 한다')
    it('count가 음수가 되지 않아야 한다')
  })
  
  describe('sync_bookmark_count', () => {
    it('image_bookmarks INSERT 시 bookmark_count가 증가해야 한다')
    it('image_bookmarks DELETE 시 bookmark_count가 감소해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 통계 정확성 보장

---

## 🌐 E2E Tests 전략

> **가이드 참조**: Phase 3.4 - E2E Tests 전략 작성

### 1. Scenario 1: AI 이미지 생성 및 저장

```typescript
describe('E2E: AI 이미지 생성', () => {
  it('사용자가 프롬프트로 이미지를 생성하고 Workspace Library에서 조회할 수 있어야 한다', async () => {
    // Given: 인증된 사용자가 Image Space를 열었다
    await loginAsUser()
    await openImageSpace()
    
    // When: AI Prompt 탭에서 프롬프트 입력 후 생성
    await navigateToAIPromptTab()
    await enterPrompt('a beautiful sunset')
    await selectModel('openai/gpt-image-1')
    await clickGenerate()
    
    // Then: 이미지가 생성되고 Workspace Library에 표시되어야 한다
    await waitFor(() => expect(generatedImages).toHaveLength(1))
    await navigateToWorkspaceLibraryTab()
    await waitFor(() => expect(myImages).toContain(generatedImages[0]))
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 핵심 사용자 여정

---

### 2. Scenario 3: 커뮤니티 피드 좋아요

```typescript
describe('E2E: 커뮤니티 피드 상호작용', () => {
  it('사용자가 Community 피드에서 이미지를 좋아요하면 count가 증가해야 한다', async () => {
    // Given: 다른 사용자가 Public 이미지를 생성했다
    const imageAsset = await createPublicImage()
    
    // When: Community 탭에서 좋아요 버튼 클릭
    await openImageSpace()
    await navigateToCommunityTab()
    await waitFor(() => expect(screen.getByText(imageAsset.title)).toBeVisible())
    
    const likeCountBefore = await getLikeCount(imageAsset.id)
    await clickLikeButton(imageAsset.id)
    
    // Then: like_count가 1 증가해야 한다 (Database Trigger)
    await waitFor(() => {
      const likeCountAfter = getLikeCount(imageAsset.id)
      expect(likeCountAfter).toBe(likeCountBefore + 1)
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Database Trigger 검증, Optimistic Update 검증

---

### 3. Scenario 7: Public 전환 검증

```typescript
describe('E2E: 이미지 공개 설정', () => {
  it('제목과 카테고리가 있어야 Public으로 전환할 수 있어야 한다', async () => {
    // Given: 제목이 없는 Private 이미지
    const imageAsset = await createImageAsset({ title: null, category: null })
    
    // When: Public toggle 시도
    await openMetadataEditor(imageAsset.id)
    await clickPublicToggle()
    
    // Then: 에러 메시지가 표시되어야 한다
    await waitFor(() => {
      expect(screen.getByText(/title.*required/i)).toBeVisible()
    })
    expect(imageAsset.isPublic).toBe(false)
    
    // When: 제목과 카테고리 추가 후 다시 시도
    await enterTitle('My Image')
    await selectCategory('art')
    await clickPublicToggle()
    
    // Then: Public으로 전환되어야 한다
    await waitFor(() => {
      expect(getImageAsset(imageAsset.id).isPublic).toBe(true)
    })
    
    // Then: Community Feed에 표시되어야 한다
    await navigateToCommunityTab()
    await waitFor(() => {
      expect(screen.getByText('My Image')).toBeVisible()
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 핵심 비즈니스 규칙 검증

---

### 4. Scenario 5: 팔로잉 피드

```typescript
describe('E2E: 팔로잉 피드', () => {
  it('팔로우한 사용자의 이미지가 Following 피드에 표시되어야 한다', async () => {
    // Given: User A가 User B를 팔로우하고, User B가 Public 이미지 생성
    const userB = await createUser()
    await loginAsUserA()
    await followUser(userB.id)
    
    await loginAs(userB)
    const imageAsset = await createPublicImage({ title: 'User B Image' })
    
    // When: User A가 Following 피드 조회
    await loginAsUserA()
    await openImageSpace()
    await navigateToFollowingTab()
    
    // Then: User B의 이미지가 표시되어야 한다
    await waitFor(() => {
      expect(screen.getByText('User B Image')).toBeVisible()
    })
  })
  
  it('팔로우가 없으면 Empty State가 표시되어야 한다', async () => {
    // Given: 팔로우가 없는 사용자
    await loginAsUser()
    
    // When: Following 피드 조회
    await navigateToFollowingTab()
    
    // Then: Empty State 표시
    await waitFor(() => {
      expect(screen.getByText(/follow creators/i)).toBeVisible()
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

## 🛠️ 테스트 도구 및 설정

### 테스트 프레임워크

**Unit/Integration Tests**:
- **Vitest**: 빠른 단위 테스트
- **@testing-library/react**: React 컴포넌트 테스트
- **MSW**: API Mocking

**E2E Tests**:
- **Playwright**: 브라우저 자동화
- **Supabase Test Database**: 격리된 테스트 DB

### Mock 전략

**외부 API Mock**:
- OpenAI/Google AI SDK: MSW로 Mock
- Unsplash API: MSW로 Mock
- Supabase Storage: Mock 또는 Test Bucket

**Database Mock**:
- Unit Tests: Repository Interface Mock
- Integration Tests: 실제 Test Database 사용

---

## 📊 테스트 커버리지

### 목표

| 레이어 | 커버리지 | 테스트 수 |
|--------|----------|----------|
| Entity | 100% | ~10개 |
| Service | 90% | ~20개 |
| Repository | 80% | ~15개 |
| Server Actions | 95% | ~15개 |
| **전체** | **85%** | **~60개** |

### 측정 방법

```bash
# Unit/Integration Tests
pnpm test --coverage

# E2E Tests
pnpm test:e2e --reporter=html
```

---

## 🎯 TDD 구현 사이클

### Red-Green-Refactor

```
1. Red: 실패하는 테스트 작성
   ↓
2. Green: 최소한의 코드로 테스트 통과
   ↓
3. Refactor: 코드 개선 (테스트는 그대로)
   ↓
반복
```

### 구현 순서 (Technical Spec 기반)

1. **Entity 테스트** → ImageAssetEntity 구현
2. **Repository 인터페이스** → Mock으로 Service 테스트
3. **Service 테스트** → Service 구현
4. **Repository 구현** → 통합 테스트
5. **Server Actions 테스트** → Actions 구현
6. **E2E 테스트** → 전체 플로우 검증

---

## ✅ 테스트 체크리스트

### Unit Tests
- [ ] ImageAssetEntity (4개 메서드)
- [ ] ImageAssetService (4개 메서드, ~8개 테스트)
- [ ] CommunityInteractionService (4개 메서드, ~8개 테스트)

### Integration Tests
- [ ] ImageAssetRepository (~8개 메서드)
- [ ] CommunityInteractionRepository (~10개 메서드)
- [ ] ImageGenerationService (~5개 테스트)
- [ ] ImageSearchService (~5개 테스트)
- [ ] Server Actions (~9개)
- [ ] Database Triggers (~4개)

### E2E Tests
- [ ] Scenario 1: AI 생성 → 저장 → 조회
- [ ] Scenario 3: Community Feed → 좋아요
- [ ] Scenario 5: 팔로우 → Following Feed
- [ ] Scenario 7: Public 전환 검증

---

*이 Testing Strategy는 Image App Space Domain의 TDD 구현을 위한 가이드입니다.*

