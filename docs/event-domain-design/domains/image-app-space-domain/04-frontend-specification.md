# Frontend Specification: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 프론트엔드개발자  
**작성일**: 2025-11-19  
**버전**: v1.0

**User Flow 참조**: `04-user-flow.md` (삭제됨, 재작성 필요)  
**Software Design 참조**: `03-software-design.md`  
**Component Guidelines**: `docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md`

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: Process Model을 React 구조로 전환, DTO 설계, Context/Hooks/Components 명세

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

Image App Space는 Full-screen Dialog 기반의 이미지 탐색 및 커뮤니티 인터페이스입니다.

**핵심 구조**:
- **Dialog Container**: Full-screen modal (95vw x 90vh)
- **Tab Navigation**: Explore (4탭), Editor, Community
- **Context 기반 상태 관리**: ImageSpaceContext + Tab별 Context
- **Compound Component Pattern**: Provider + 서브 컴포넌트 조합

### Process Model 연결점

- **입력**: `02-process-model.md` - 7개 시나리오
- **입력**: `03-software-design.md` - 3개 Aggregate, 7개 Server Actions
- **출력**: React Context 5개, Hooks (UI/Business 분리), Components

### 핵심 설계 원칙

- **Compound Component Pattern**: Provider + 서브 컴포넌트
- **UI/Business 로직 분리**: 3-tier (`.ui.ts`, `.business.ts`, `.ts`)
- **Context 기반 상태 공유**: Props drilling 방지
- **TanStack Query**: Server state 관리
- **Optimistic Updates**: 좋아요, 북마크 즉시 반영

---

## 📦 DTO 및 타입 정의

> **가이드 참조**: Phase 2.2 - DTO 및 타입 설계

### 1. ImageAssetView DTO

- **파일 위치**: `src/domains/image-app-space/shared/dtos/views.ts`
- **역할**: ImageAsset Aggregate의 조회 정보 (Creator 포함)
- **주요 속성**:
  - id: string (UUID)
  - assetType: 'ai-generated' | 'unsplash' | 'user-upload'
  - imageUrl: string
  - thumbnailUrl?: string
  - prompt?: string (AI 생성 시)
  - metadata: Record<string, any> (JSONB)
  - title?: string
  - tags: string[]
  - category?: ImageCategory
  - isPublic: boolean
  - viewCount, likeCount, bookmarkCount, useCount: number
  - createdBy: string
  - createdAt: string (ISO 8601)
  - creatorProfile?: { id, name, avatar_url }
- **직렬화 규칙**: Plain Object, Date → ISO string

**사용 위치**:
- Community Feed: 이미지 카드
- Workspace Library: 내 이미지 목록
- Image Detail: 상세 보기

---

### 2. ImageAssetWithStats DTO

- **역할**: 현재 사용자의 상호작용 상태 포함 (Community/Following Feed용)
- **추가 속성**:
  - isLiked?: boolean (현재 사용자가 좋아요했는지)
  - isBookmarked?: boolean (현재 사용자가 북마크했는지)

**사용 위치**:
- Community Feed: 좋아요/북마크 상태 표시
- Following Feed: 타임라인 아이템

---

### 3. Request DTOs

**CreateImageAssetRequest** (Scenario 1):
- image_url, asset_type, prompt, metadata, workspace_id, title, tags, category

**UpdateImageMetadataRequest** (Scenario 6):
- image_asset_id, title?, description?, tags?, category?

**ChangeImageVisibilityRequest** (Scenario 7):
- image_asset_id, is_public, title? (Public 시 필수), category? (Public 시 필수)

**BrowseCommunityFeedRequest** (Scenario 3):
- sort: 'trending' | 'recent' | 'views'
- category?: ImageCategory
- page, per_page

**BrowseFollowingFeedRequest** (Scenario 5):
- page, per_page

---

## 🎯 Context 및 Hooks 설계

> **Component Guidelines 참조**: UI/Business 로직 분리 패턴

### 1. ImageSpaceContext (최상위 Context)

**파일 위치**: `src/domains/image-app-space/frontend/components/space/core/`
- `image-space.context.tsx`: Context 정의
- `provider.tsx`: Provider 구현
- `use-image-space.ui.ts`: UI 상태
- `use-image-space.business.ts`: 비즈니스 로직
- `use-image-space.ts`: 통합 Hook

**State 인터페이스**:
- `open: boolean` - Dialog 열림/닫힘 상태
- `activeTopMenu: TopMenu` - Explore/Editor/Community
- `activeExploreTab: ExploreTab` - Unsplash/Ssota/AI/Workspace
- `selectedImage: ImageAssetView | null` - 선택된 이미지
- `blockId: string` - Block context
- `blockData: BlockNodeData` - Block context

**Actions 인터페이스**:
- `handleOpenChange(open: boolean): void` - Dialog 열기/닫기
- `setActiveTopMenu(menu: TopMenu): void` - 상단 메뉴 전환
- `setActiveExploreTab(tab: ExploreTab): void` - Explore 탭 전환
- `setSelectedImage(image: ImageAssetView | null): void` - 이미지 선택
- `applyImageToBlock(imageAssetId: string): Promise<void>` - 블록에 적용

**Hook 책임**:
- **UI Hook**: Dialog 상태, Navigation 상태, 선택 상태
- **Business Hook**: Block Property 업데이트, ImageAssetUsage 기록
- **Combined Hook**: UI + Business 통합, Context에 제공

---

### 2. CommunityFeedContext (Scenario 3)

**파일 위치**: `components/tabs/community-tab/core/`
- `community-feed.context.tsx`
- `use-community-feed.ui.ts`
- `use-community-feed.business.ts`
- `use-community-feed.ts`

**State 인터페이스**:
- `sort: FeedSortType` - 정렬 방식 (trending/recent/views)
- `category?: ImageCategory` - 카테고리 필터
- `images: ImageAssetWithStats[]` - 이미지 목록
- `isLoading: boolean` - 로딩 상태
- `hasNextPage: boolean` - 다음 페이지 존재 여부

**Actions 인터페이스**:
- `setSort(sort: FeedSortType): void` - 정렬 변경
- `setCategory(category?: ImageCategory): void` - 카테고리 필터
- `fetchNextPage(): void` - 다음 페이지 로드
- `toggleLike(imageAssetId: string): Promise<void>` - 좋아요 toggle
- `toggleBookmark(imageAssetId: string): Promise<void>` - 북마크 toggle
- `recordView(imageAssetId: string): Promise<void>` - 조회수 기록

**TanStack Query 사용**:
- `useInfiniteQuery`: browseCommunityFeedAction 호출
- `useMutation`: toggleLikeAction, toggleBookmarkAction
- **Optimistic Update**: 좋아요/북마크 즉시 반영 → 실패 시 롤백

---

### 3. FollowingFeedContext (Scenario 5)

**파일 위치**: `components/tabs/following-feed-tab/core/`

**State 인터페이스**:
- `images: ImageAssetWithStats[]` - 팔로잉 사용자의 이미지
- `isLoading: boolean`
- `hasFollowing: boolean` - 팔로우 관계 존재 여부
- `hasNextPage: boolean`

**Actions 인터페이스**:
- `fetchNextPage(): void`
- `toggleLike(imageAssetId: string): Promise<void>`
- `toggleBookmark(imageAssetId: string): Promise<void>`
- `toggleFollow(userId: string): Promise<void>` - 팔로우 toggle

**특별 처리**:
- `hasFollowing === false` → Empty State 표시 (추천 크리에이터)

---

### 4. ImageMetadataEditorContext (Scenario 6)

**파일 위치**: `components/metadata-editor/core/`

**State 인터페이스**:
- `title: string` - 제목 (controlled input)
- `description: string` - 설명
- `tags: string[]` - 태그 배열 (최대 10개)
- `category?: ImageCategory` - 카테고리
- `errors: Record<string, string>` - 검증 에러

**Actions 인터페이스**:
- `setTitle(title: string): void`
- `setDescription(description: string): void`
- `setTags(tags: string[]): void`
- `setCategory(category?: ImageCategory): void`
- `validateForm(): boolean` - 폼 검증 (태그 10개 제한)
- `saveMetadata(): Promise<void>` - 저장

**Validation Rules**:
- 태그 최대 10개
- Public 전환 시 제목/카테고리 필수 (ImageVisibilityContext와 연계)

---

### 5. ImageVisibilityContext (Scenario 7)

**파일 위치**: `components/visibility-toggle/core/`

**State 인터페이스**:
- `isPublic: boolean` - 현재 공개 상태
- `isChanging: boolean` - 변경 중 상태
- `canSetPublic: boolean` - Public 전환 가능 여부
- `validationErrors: string[]` - 검증 에러 목록

**Actions 인터페이스**:
- `toggleVisibility(): Promise<void>` - 공개 설정 toggle

**Business Rules**:
- Public 전환 시 `title` 및 `category` 필수
- 검증 실패 시 toast 에러 + toggle 취소
- 성공 시 커뮤니티 피드 쿼리 무효화

---

## 🧩 컴포넌트 구조

> **Component Guidelines**: Compound Component Pattern, Context 기반

### Scenario별 컴포넌트 매핑

| Scenario | 컴포넌트 | Pattern | 위치 |
|----------|----------|---------|------|
| 1. AI 생성 | AIPromptTab | Provider + Form | `tabs/ai-prompt-tab/` |
| 2. Unsplash | UnsplashTab | Provider + Grid | `tabs/unsplash-tab/` (기존) |
| 3. Community | CommunityTab | Provider + Infinite Grid | `tabs/community-tab/` |
| 4. 블록 적용 | ImageSpaceContainer | Provider + Dialog | `space/index.tsx` |
| 5. Following | FollowingFeedTab | Provider + Timeline | `tabs/following-feed-tab/` |
| 6. 메타데이터 | ImageMetadataEditor | Provider + Form | `metadata-editor/` |
| 7. 공개 설정 | ImageVisibilityToggle | Hook + Toggle | `visibility-toggle/` |

---

### 1. ImageSpaceContainer (Entry Point)

**위치**: `components/space/index.tsx`

**Pattern**: Provider + Trigger + Dialog

**Props**:
- `blockId: string` - Block ID
- `blockData: BlockNodeData` - Block 데이터
- `children: React.ReactNode` - Trigger 버튼들

**Provider Context**: ImageSpaceContext

**렌더링 구조**:
- Provider 래핑
- children (Trigger 버튼들)
- ImageSpaceDialog (Portal로 body에 렌더링)

**Export**:
- `ImageSpaceContainer` (main)
- `ImageSpaceExploreTrigger` (Explore 버튼)
- `ImageSpaceEditorTrigger` (Editor 버튼)

---

### 2. ImageSpaceDialog (Main Dialog)

**위치**: `components/dialog-content.tsx`

**Pattern**: Full-screen Dialog + Tab Navigation

**Context 사용**: ImageSpaceContext

**레이아웃 구조**:
- Dialog Container (95vw x 90vh, 중앙 정렬)
- ImageSpaceHeader (상단 고정)
- ExploreTabMenu (Explore 모드일 때만 표시)
- ImageSpaceContentArea (메인 컨텐츠, 스크롤 가능)

**Dialog 상태**:
- `open` from Context
- ESC 키로 닫기
- X 버튼으로 닫기
- 닫힐 때 selectedImage 초기화

---

### 3. ImageSpaceHeader

**위치**: `components/header.tsx`

**Pattern**: Navigation Tabs

**Context 사용**: ImageSpaceContext (activeTopMenu, setActiveTopMenu)

**구조**:
- Title: "Image Space"
- Top Menu Tabs: Explore | Editor | Community
- Close Button

**인터랙션**:
- Tab 클릭 → `setActiveTopMenu` 호출
- activeTopMenu에 따라 활성 상태 표시

---

### 4. ExploreTabMenu

**위치**: `components/content-area.tsx` 내부

**Context 사용**: ImageSpaceContext (activeExploreTab, setActiveExploreTab)

**구조**:
- Tab Navigation: Unsplash | Ssota | AI Prompt | Workspace Library

**표시 조건**: activeTopMenu === 'explore'

---

### 5. CommunityTab (Scenario 3)

**위치**: `components/tabs/community-tab/index.tsx`

**Pattern**: Provider + Compound Components

**Context**: CommunityFeedContext

**구성 요소**:
- `CommunityTabProvider`: Context Provider
- `FilterSection`: 정렬 + 카테고리 필터
- `FeedSection`: 무한 스크롤 이미지 그리드
- `ImageGrid`: 반응형 그리드 레이아웃
- `ImageCard`: 개별 이미지 카드

**FilterSection**:
- SortSelect: Dropdown (Trending/Recent/Most Viewed)
- CategoryFilter: Dropdown (Art/Photo/Illustration/...)

**FeedSection**:
- InfiniteScrollContainer: 스크롤 하단 500px 전 다음 페이지 로드
- ImageGrid: 반응형 3-5열
- LoadingSkeleton: 로딩 시 표시

---

### 6. ImageCard (공통 컴포넌트)

**위치**: `components/common/image-card/index.tsx`

**Pattern**: Compound Component (Static Members)

**Props**:
- `image: ImageAssetWithStats` - 이미지 데이터
- `onLike?: (imageId: string) => void` - 좋아요 콜백
- `onBookmark?: (imageId: string) => void` - 북마크 콜백
- `onApply?: (imageId: string) => void` - Apply 콜백
- `showActions?: boolean` - 액션 버튼 표시 여부

**구성 요소** (Static Members):
- `ImageCard.Image`: 썸네일 이미지
- `ImageCard.Content`: 컨텐츠 래퍼
- `ImageCard.Creator`: 크리에이터 정보 (아바타 + 이름)
- `ImageCard.Stats`: 통계 (👁️ views, ❤️ likes, 🔖 bookmarks)
- `ImageCard.Actions`: 액션 버튼 (좋아요, 북마크, Apply)

**ActionButtons 구조**:
- Heart Button: filled when `isLiked`, ghost otherwise
- Bookmark Button: filled when `isBookmarked`
- Apply Button: 조건부 표시

**Hover 효과**: shadow-lg transition

---

### 7. FollowingFeedTab (Scenario 5)

**위치**: `components/tabs/following-feed-tab/index.tsx`

**Pattern**: Provider + Timeline Layout

**Context**: FollowingFeedContext

**구성 요소**:
- `FollowingFeedProvider`
- `TimelineLayout`: 타임라인 스타일 레이아웃
- `TimelineList`: 이미지 아이템 목록
- `TimelineItem`: 개별 아이템 (Creator + Image + Actions)
- `EmptyFollowingState`: 팔로우 없을 때 (추천 크리에이터)

**TimelineItem 구조**:
- CreatorAvatar (왼쪽)
- CreatorHeader (이름 + 시간 + Follow 버튼)
- ImageContent (이미지)
- ActionBar (좋아요, 북마크)

**Empty State**:
- Icon + Message: "Follow creators to see their latest images"
- CTA Button: "Explore Community"

---

### 8. ImageMetadataEditor (Scenario 6)

**위치**: `components/metadata-editor/index.tsx`

**Pattern**: Provider + Form + Compound Components

**Context**: ImageMetadataEditorContext

**Props**:
- `imageAsset: ImageAsset` - 편집할 이미지
- `onClose: () => void` - 닫기 콜백

**구성 요소**:
- `MetadataEditorProvider`
- `MetadataForm`: 폼 래퍼
- `TitleInput`: 제목 입력
- `DescriptionTextarea`: 설명 입력
- `TagsInput`: 태그 입력 (max 10)
- `CategorySelect`: 카테고리 선택
- `SaveButton`: 저장 버튼 (isSaving 시 Spinner)
- `CancelButton`: 취소 버튼

**Form Fields**:
- TitleInput: text input, 200자 제한
- DescriptionTextarea: textarea, 1000자 제한
- TagsInput: Tag input UI, 10개 제한 검증
- CategorySelect: Dropdown, enum 값만 허용

**Validation**:
- 태그 10개 초과 → 에러 메시지 표시
- 빈 값 허용 (optional fields)

**Submit**:
- saveMetadata() → updateImageMetadataAction 호출
- 성공 → Dialog 닫기, 관련 쿼리 무효화
- 실패 → 에러 메시지, Dialog 유지

---

### 9. ImageVisibilityToggle (Scenario 7)

**위치**: `components/visibility-toggle/index.tsx`

**Pattern**: Hook + Switch Component

**Props**:
- `imageAsset: ImageAsset` - 대상 이미지

**Context**: 별도 Context 없음 (간단한 컴포넌트)

**Hook**: useImageVisibility

**구조**:
- Label: "Share to Community"
- Switch: isPublic 상태 toggle
- Tooltip: canSetPublic === false일 때 검증 에러 표시

**Disabled 조건**:
- `isChanging === true` (변경 중)
- `!imageAsset.isPublic && !canSetPublic` (Public 전환 불가)

**Validation**:
- Public 전환 시도 & 제목 없음 → Toast 에러
- Public 전환 시도 & 카테고리 없음 → Toast 에러

---

## 🔌 Server Actions 연동

> **가이드 참조**: Phase 2.4 - Server Actions 연동 패턴

### 연동 패턴 요약

| Server Action | Hook 위치 | 패턴 | Optimistic |
|---------------|-----------|------|------------|
| browseCommunityFeedAction | use-community-feed.business | useInfiniteQuery | ❌ |
| browseFollowingFeedAction | use-following-feed.business | useInfiniteQuery | ❌ |
| toggleLikeAction | use-community-feed.business | useMutation | ✅ |
| toggleBookmarkAction | use-community-feed.business | useMutation | ✅ |
| toggleFollowAction | use-following-feed.business | useMutation | ❌ |
| updateImageMetadataAction | use-metadata-editor.business | useMutation | ❌ |
| changeImageVisibilityAction | use-image-visibility.business | useMutation | ❌ |
| recordImageViewAction | use-community-feed.business | Fire-and-forget | ❌ |

---

### 1. useInfiniteQuery 패턴 (Feed 조회)

**사용처**: Community Feed, Following Feed

**Query Key 구조**: `['community-feed', sort, category]`

**Query Function**:
- Server Action 호출
- result.success 체크
- result.data 반환

**Pagination**:
- `getNextPageParam`: lastPage.length === per_page ? nextPage : undefined
- `fetchNextPage`: 무한 스크롤 트리거

---

### 2. useMutation with Optimistic Update (Like/Bookmark)

**사용처**: toggleLike, toggleBookmark

**Mutation 단계**:
1. `onMutate`: 기존 데이터 백업 + 캐시 즉시 업데이트
2. `mutationFn`: Server Action 호출
3. `onSuccess`: 쿼리 무효화 (최신 데이터 refetch)
4. `onError`: 백업 데이터로 롤백 + Toast 에러

**Cache Update 로직**:
- InfiniteQuery pages 배열 순회
- 해당 imageId 찾아서 isLiked, likeCount 업데이트

---

### 3. useMutation without Optimistic (Metadata, Visibility)

**사용처**: updateMetadata, changeVisibility, toggleFollow

**Mutation 단계**:
1. `mutationFn`: Server Action 호출
2. `onSuccess`: 관련 쿼리 무효화 + Toast 성공
3. `onError`: Toast 에러

**Query Invalidation**:
- 해당 이미지: `['image-asset', imageAssetId]`
- 피드: `['community-feed']`, `['workspace-images']`
- 팔로우: `['following-feed']`, `['user-followers', userId]`

---

### 4. Fire-and-Forget 패턴 (View 기록)

**사용처**: recordImageViewAction

**패턴**:
- Silent fail (에러 무시)
- 30분 중복 방지 (로컬 체크 또는 Server 체크)
- useEffect로 자동 호출

---

## 📁 폴더 구조

```
src/domains/image-app-space/frontend/
├── components/
│   └── space/
│       ├── index.tsx
│       ├── core/
│       │   ├── provider.tsx
│       │   ├── image-space.context.tsx
│       │   ├── types.ts
│       │   ├── use-image-space.ui.ts
│       │   ├── use-image-space.business.ts
│       │   └── use-image-space.ts
│       └── components/
│           ├── dialog-content.tsx
│           ├── header.tsx
│           ├── content-area.tsx
│           ├── trigger.tsx
│           ├── common/
│           │   ├── image-card.tsx
│           │   ├── image-grid.tsx
│           │   ├── creator-info.tsx
│           │   └── action-buttons.tsx
│           └── tabs/
│               ├── unsplash-tab/
│               ├── community-tab/
│               │   ├── index.tsx
│               │   ├── core/
│               │   │   ├── community-feed.context.tsx
│               │   │   ├── use-community-feed.ui.ts
│               │   │   ├── use-community-feed.business.ts
│               │   │   └── use-community-feed.ts
│               │   └── components/
│               │       ├── filter-bar.tsx
│               │       └── feed-section.tsx
│               ├── following-feed-tab/
│               │   ├── index.tsx
│               │   └── core/
│               ├── ai-prompt-tab/
│               └── workspace-library-tab/
├── metadata-editor/
│   ├── index.tsx
│   └── core/
└── visibility-toggle/
    ├── index.tsx
    └── core/
```

---

## 🎯 구현 우선순위

### MVP (즉시 구현)
1. ✅ ImageSpaceContainer + Dialog (기존 완료)
2. ✅ UnsplashTab (기존 완료)
3. ⏳ AI 생성 → ImageAsset 저장 연동
4. ⏳ Workspace Library Tab (내 이미지 조회)

### Post-MVP Phase 1 (Community 기능)
5. ⏳ Community Tab 구현
6. ⏳ ImageCard with Stats
7. ⏳ Toggle Like/Bookmark
8. ⏳ Infinite Scroll

### Post-MVP Phase 2 (고급 기능)
9. ⏳ Following Feed Tab
10. ⏳ Follow Button
11. ⏳ Image Metadata Editor
12. ⏳ Visibility Toggle

---

## ✅ 구현 체크리스트

### Context & Hooks
- [ ] ImageSpaceContext (최상위)
- [ ] CommunityFeedContext
- [ ] FollowingFeedContext
- [ ] ImageMetadataEditorContext
- [ ] ImageVisibilityContext (Hook only)

### Components
- [x] ImageSpaceContainer (기존)
- [x] ImageSpaceDialog (기존)
- [x] UnsplashTab (기존)
- [ ] CommunityTab
- [ ] FollowingFeedTab
- [ ] ImageCard (공통)
- [ ] ImageMetadataEditor
- [ ] ImageVisibilityToggle

### Server Actions 연동
- [ ] browseCommunityFeedAction
- [ ] browseFollowingFeedAction
- [ ] toggleLikeAction (Optimistic)
- [ ] toggleBookmarkAction (Optimistic)
- [ ] toggleFollowAction
- [ ] updateImageMetadataAction
- [ ] changeImageVisibilityAction
- [ ] recordImageViewAction

---

*이 Frontend Specification은 Image App Space Domain의 프론트엔드 구현을 위한 명세서입니다.*
