# Software Design: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 시니어개발자 + Product Owner  
**작성일**: 2025-11-19  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `04-db-schema.md`, `05-api-spec.md`

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Image App Space의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Unsplash API**: ACL로 래핑 (UnsplashIntegrationService)
- **OpenAI/Google Imagen**: ImageGenerationService로 추상화
- **Block Management Domain**: Server Action 직접 호출

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Image Asset Manager | **ImageAsset Aggregate** | 이미지 자산 생명주기 관리 |
| Image Metadata Manager | **ImageAsset Aggregate** | 메타데이터 관리 (통합) |
| Image Visibility Manager | **ImageAsset Aggregate** | 공개 설정 관리 (통합) |
| Like Manager | **CommunityInteraction Aggregate** | 좋아요 관리 |
| Follow Manager | **CommunityInteraction Aggregate** | 팔로우 관계 관리 |
| Image Generation Service | **External Service** | AI 이미지 생성 (외부) |
| Unsplash Integration Service | **External Service** | Unsplash API 통합 |

---

## 📦 Aggregate 상세 정의

### 1. ImageAsset Aggregate

**핵심 개념**: "이미지 자산은 AI 생성, Unsplash, 사용자 업로드를 통합하여 관리하며, 메타데이터와 공개 설정을 포함합니다."

#### Commands (받는 명령)
- CreateImageAsset: 새 이미지 자산 생성
- UpdateImageMetadata: 제목, 태그, 카테고리 업데이트
- ChangeImageVisibility: public/private 설정 변경
- SoftDeleteImage: 이미지 소프트 삭제
- RestoreImage: 삭제된 이미지 복구

#### Events (발생 이벤트)
- ImageAssetCreated: 이미지 자산 생성됨
- ImageTitleSet: 제목 설정됨
- ImageTagsAdded: 태그 추가됨
- ImageCategorySet: 카테고리 설정됨
- ImageSetToPublic: Public으로 변경됨
- ImageSetToPrivate: Private으로 변경됨
- ImageSoftDeleted: 소프트 삭제됨
- ImageRestored: 복구됨

#### 핵심 불변식 (Invariants)
- ImageAsset은 반드시 하나의 workspace에 속한다
- Public 이미지는 제목과 카테고리가 필수다
- 삭제된 이미지(is_deleted=true)는 30일 후 영구 삭제된다
- 태그는 최대 10개까지만 허용된다
- created_by만 메타데이터와 공개 설정을 변경할 수 있다

#### 속성 (Properties)
```typescript
{
  id: UUID,
  assetType: 'ai-generated' | 'unsplash' | 'user-upload',
  imageUrl: string,
  prompt?: string,
  metadata: JSONB,
  title?: string,
  tags: string[],
  category?: ImageCategory,
  createdBy: UUID,
  workspaceId: UUID,
  isPublic: boolean,
  isDeleted: boolean,
  viewCount: number,
  likeCount: number,
  bookmarkCount: number,
  useCount: number
}
```

---

### 2. CommunityInteraction Aggregate

**핵심 개념**: "커뮤니티 상호작용은 사용자 간 소셜 관계(팔로우)와 이미지 자산에 대한 반응(좋아요, 북마크)을 관리합니다."

#### Commands
- LikeImage: 이미지 좋아요
- UnlikeImage: 좋아요 취소
- BookmarkImage: 이미지 북마크
- UnbookmarkImage: 북마크 제거
- FollowUser: 사용자 팔로우
- UnfollowUser: 팔로우 취소
- RecordView: 조회수 기록

#### Events
- ImageLiked: 좋아요됨
- ImageUnliked: 좋아요 취소됨
- ImageBookmarked: 북마크됨
- ImageUnbookmarked: 북마크 제거됨
- UserFollowed: 팔로우됨
- UserUnfollowed: 언팔로우됨
- ImageViewed: 조회됨

#### 핵심 불변식
- 사용자는 자기 자신을 팔로우할 수 없다
- 사용자당 이미지 1개에 좋아요 1회만 가능하다
- 사용자당 이미지 1개에 북마크 1회만 가능하다
- 조회수는 30분 이내 중복 기록하지 않는다

#### 속성
```typescript
// ImageLike
{
  userId: UUID,
  imageAssetId: UUID
}

// ImageBookmark
{
  userId: UUID,
  imageAssetId: UUID
}

// UserFollow
{
  followerId: UUID,
  followeeId: UUID
}

// ImageView
{
  userId?: UUID,
  imageAssetId: UUID,
  sessionId?: string,
  viewedAt: Timestamp
}
```

---

### 3. ImageAssetUsage Aggregate

**핵심 개념**: "이미지 사용 추적은 어떤 블록에서 이미지가 사용되는지 기록합니다."

#### Commands
- RecordImageUsage: 이미지 사용 기록
- RemoveImageUsage: 사용 기록 제거

#### Events
- ImageUsageRecorded: 사용 기록됨
- ImageUsageRemoved: 사용 제거됨
- UseCountIncremented: 사용 횟수 증가됨

#### 핵심 불변식
- ImageAssetUsage는 반드시 존재하는 ImageAsset을 참조한다
- ImageAssetUsage는 반드시 존재하는 Block을 참조한다
- 같은 Block에 같은 ImageAsset은 1회만 기록된다 (UPSERT)

#### 속성
```typescript
{
  id: UUID,
  imageAssetId: UUID,
  blockId: UUID,
  pageId: UUID
}
```

---

## 🔲 Bounded Context 정의

### Image App Space Context

**언어적 특징**:
- "Image Asset" = AI 생성, Unsplash, 업로드를 통합한 이미지 자산
- "Community Feed" = 공개(Public) 이미지 피드
- "Following Feed" = 팔로우한 사용자의 이미지 피드
- "Bookmark" = 이미지 찜하기 (개인 컬렉션)
- "Prompt Embedding" = 시맨틱 검색을 위한 벡터

**핵심 책임**:
- 이미지 자산의 생명주기 관리 (생성, 메타데이터, 공개 설정)
- 커뮤니티 소셜 기능 (좋아요, 북마크, 팔로우)
- 이미지 탐색 및 검색 (카테고리, 태그, 시맨틱)
- 이미지 사용 추적 및 통계

**포함된 Aggregates**:
- ImageAsset (핵심 Aggregate)
- CommunityInteraction (소셜 기능)
- ImageAssetUsage (사용 추적)

**External System Integration**:
- **Unsplash API**: REST API 호출 (검색, 다운로드 트래킹)
  - ACL: UnsplashIntegrationService
  - 북마크/좋아요 시에만 ImageAsset으로 저장
  - Rate Limit 관리 필요
- **OpenAI/Google Imagen**: AI SDK를 통한 이미지 생성
  - ACL: ImageGenerationService (이미 block-management에 존재)
  - 생성 결과를 Supabase Storage에 업로드
  - Prompt embedding 생성

---

## 🔀 다른 Context와의 경계

### Block Management Context와의 경계

**언어적 차이**:
| Image App Space Context | Block Management Context |
|---------------------|-------------------|
| "Image Asset" | "Image Block" |
| "Apply to Block" | "Update Block Properties" |
| "Usage Tracking" | "Block State" |

**통합 이벤트**:
- `ImageSelectedFromAppSpace` → `UpdateBlockProperties(imageUrl)`
- `BlockDeleted` → `RemoveImageUsage`

**통합 패턴**: Server Action 직접 호출 (동기)

### User Management Context와의 경계

**언어적 차이**:
| Image App Space Context | User Management Context |
|---------------------|-------------------|
| "Creator" | "User" |
| "Follow" | "User Relationship" |

**통합 이벤트**:
- `UserCreated` → `AvailableForFollow`
- `UserDeleted` → `RemoveAllFollowRelations`

**통합 패턴**: FK 참조 (public.profiles)

### Workspace Management Context와의 경계

**언어적 차이**:
| Image App Space Context | Workspace Management Context |
|---------------------|-------------------|
| "Workspace-scoped Image" | "Workspace" |
| "Public/Private" | "Workspace Visibility" |

**통합 이벤트**:
- `WorkspaceCreated` → `ImageAssetsAvailableForWorkspace`
- `WorkspaceDeleted` → `SoftDeleteAllWorkspaceImages`

**통합 패턴**: FK 참조 (public.workspaces)

---

## 🏗️ Context Map

```
┌────────────────────────────────────────────────────────────┐
│           Image App Space Context                          │
│                                                            │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ ImageAsset   │  │ Community       │  │ ImageAsset   │ │
│  │ Aggregate    │  │ Interaction     │  │ Usage        │ │
│  │              │  │ Aggregate       │  │ Aggregate    │ │
│  └──────┬───────┘  └────────┬────────┘  └──────┬───────┘ │
│         │                   │                   │         │
│         └───────────────────┼───────────────────┘         │
│                             │                             │
│                             ▼                             │
│                    Repository Layer                       │
│           (image_app_space schema access)                 │
└────────────────────────────────────────────────────────────┘
                              │
                              │ Server Actions / Events
                              ▼
     ┌───────────────────────────────────────────┐
     │         Integration Events                │
     ├───────────────────────────────────────────┤
     │ • ImageAppliedToBlock                     │
     │ • ImageUsageRecorded                      │
     │ • BlockDeleted → RemoveUsage              │
     └───────────────────────────────────────────┘
                    │              │
        ┌───────────┘              └───────────┐
        ▼                                      ▼
┌───────────────────┐                 ┌────────────────────┐
│ Block Management  │                 │ User Management    │
│ Context           │                 │ Context            │
│ (External Domain) │                 │ (External Domain)  │
└───────────────────┘                 └────────────────────┘
        │                                      │
        │ FK: public.blocks                    │ FK: public.profiles
        │     public.pages                     │
        ▼                                      ▼
┌───────────────────┐                 ┌────────────────────┐
│ Workspace         │                 │ Unsplash API       │
│ Management        │                 │ (External Service) │
│ Context           │                 └────────────────────┘
│ (External Domain) │
└───────────────────┘
     │ FK: public.workspaces
```

---

## 💡 핵심 설계 결정

### 1. ImageAsset을 단일 Aggregate로 통합
- **문제**: Metadata Manager, Visibility Manager를 별도 Aggregate로?
- **해결**: ImageAsset 하나로 통합
- **대안**: 각각 별도 Aggregate (과도한 분리)
- **결정 이유**: 
  - 메타데이터와 공개 설정은 ImageAsset의 일부
  - 트랜잭션 일관성 유지 필요
  - 단일 aggregate root로 충분

### 2. Unsplash 이미지 지연 저장
- **문제**: Unsplash 검색 결과를 즉시 저장할지?
- **해결**: 북마크/좋아요 시에만 저장
- **대안**: 검색 즉시 저장 (DB 부담)
- **결정 이유**:
  - DB 저장 공간 절약
  - 실제 사용자 관심도 기반 저장
  - Unsplash는 SSOT이므로 언제든 재조회 가능

### 3. 통계 비정규화 + Trigger
- **문제**: like_count 등을 실시간으로 어떻게 동기화?
- **해결**: Database Trigger로 자동 업데이트
- **대안**: 
  - 애플리케이션 레벨 업데이트 (불일치 가능)
  - 주기적 배치 (실시간성 부족)
- **결정 이유**:
  - 트랜잭션 보장
  - 애플리케이션 코드 단순화
  - 성능 최적화 (JOIN 없이 조회)

### 4. 별도 Schema (image_app_space) 사용
- **문제**: public 스키마 vs 별도 스키마?
- **해결**: image_app_space 별도 스키마
- **대안**: public 스키마에 통합
- **결정 이유**:
  - 논리적 분리 명확
  - 향후 20개 블록 앱스페이스 확장 대비
  - Supabase Data API 선택적 노출 가능
  - RLS 정책 관리 용이

---

## 🔗 Integration Layer (ACL)

### UnsplashIntegrationService (ACL)

**역할**: Unsplash API 응답을 ImageAsset 도메인 모델로 변환

**변환 로직**:
```typescript
// Unsplash API Response
{
  id: "abc123",
  urls: { regular: "...", thumb: "..." },
  user: { name: "John", username: "john", links: {...} },
  width: 1920,
  height: 1080
}

// ↓ ACL 변환 ↓

// ImageAsset Domain Model
{
  asset_type: 'unsplash',
  image_url: urls.regular,
  thumbnail_url: urls.thumb,
  width: 1920,
  height: 1080,
  metadata: {
    photoId: id,
    authorName: user.name,
    authorUsername: user.username,
    authorLink: user.links.html
  }
}
```

**책임**:
- Unsplash API 호출 및 에러 처리
- Rate Limit 관리
- 다운로드 트래킹 API 호출
- 도메인 모델로 변환

---

### ImageGenerationService (ACL)

**역할**: AI SDK 응답을 ImageAsset으로 변환 (이미 존재)

**위치**: `domains/block-management/backend/services/image-generation.service.ts`

**변환 로직**: AI SDK response → Supabase Storage → ImageAsset

**책임**:
- AI API 호출 (OpenAI, Google)
- Supabase Storage 업로드
- Prompt embedding 생성
- ImageAsset 생성을 위한 데이터 반환

---

## 📚 Repository Pattern

### ImageAssetRepository

**인터페이스**:
```typescript
interface ImageAssetRepository {
  create(data: NewImageAsset): Promise<ImageAsset>;
  findById(id: string): Promise<ImageAsset | null>;
  findPublicImages(params: {...}): Promise<ImageAssetWithStats[]>;
  findFollowingUserImages(params: {...}): Promise<ImageAssetWithStats[]>;
  updateMetadata(id: string, data: {...}): Promise<ImageAsset>;
  updateVisibility(id: string, isPublic: boolean): Promise<ImageAsset>;
  softDelete(id: string): Promise<void>;
}
```

**구현**: DrizzleImageAssetRepository
- Drizzle ORM 사용
- image_app_space.image_assets 테이블 접근
- public.profiles JOIN (Creator 정보)

---

### CommunityInteractionRepository

**인터페이스**:
```typescript
interface CommunityInteractionRepository {
  // Likes
  createLike(data: NewImageLike): Promise<ImageLike>;
  deleteLike(userId: string, imageAssetId: string): Promise<void>;
  isLiked(userId: string, imageAssetId: string): Promise<boolean>;
  
  // Bookmarks
  createBookmark(data: NewImageBookmark): Promise<ImageBookmark>;
  deleteBookmark(userId: string, imageAssetId: string): Promise<void>;
  
  // Follows
  createFollow(data: NewUserFollow): Promise<UserFollow>;
  deleteFollow(followerId: string, followeeId: string): Promise<void>;
  
  // Views
  createView(data: NewImageView): Promise<ImageView>;
  hasViewedRecently(userId: string | null, imageAssetId: string): Promise<boolean>;
}
```

**구현**: DrizzleCommunityInteractionRepository
- image_app_space 스키마 테이블 접근
- Toggle 로직 (like/unlike, follow/unfollow)

---

## 🎯 Service Layer Architecture

### ImageAssetService

**책임**: ImageAsset Aggregate의 비즈니스 로직

**주요 메서드**:
- `createImageAsset()`: Asset 생성 및 초기화
- `updateMetadata()`: 권한 검증 + 메타데이터 업데이트
- `changeVisibility()`: Public 전환 시 필수 검증
- `getImageAsset()`: 권한 기반 조회

**비즈니스 규칙**:
- Public 전환 시 제목/카테고리 필수
- created_by만 편집 가능
- 태그 최대 10개 제한

---

### CommunityInteractionService

**책임**: 커뮤니티 상호작용 비즈니스 로직

**주요 메서드**:
- `toggleLike()`: 좋아요 toggle (중복 방지)
- `toggleBookmark()`: 북마크 toggle
- `toggleFollow()`: 팔로우 toggle (자기 자신 방지)
- `recordView()`: 조회수 기록 (30분 중복 방지)

---

## 🌐 API Endpoints (Server Actions)

### Image Asset Actions

```typescript
// apps/web/src/domains/image-app-space/backend/actions/image-asset.actions.ts

createImageAssetAction(command): Promise<Result<ImageAsset>>
browseCommunityFeedAction(command): Promise<Result<ImageAssetWithStats[]>>
browseFollowingFeedAction(command, userId): Promise<Result<ImageAssetWithStats[]>>
updateImageMetadataAction(command, userId): Promise<Result<ImageAsset>>
changeImageVisibilityAction(command, userId): Promise<Result<ImageAsset>>
```

### Community Interaction Actions

```typescript
// apps/web/src/domains/image-app-space/backend/actions/community-interaction.actions.ts

toggleLikeAction(command, userId): Promise<Result<{ liked: boolean }>>
toggleBookmarkAction(command, userId): Promise<Result<{ bookmarked: boolean }>>
toggleFollowAction(command, userId): Promise<Result<{ following: boolean }>>
recordImageViewAction(imageAssetId, userId, sessionId): Promise<Result<void>>
```

---

## 🔧 기술 스택

### Backend
- **ORM**: Drizzle ORM
- **Database**: Supabase PostgreSQL
- **Schema**: image_app_space (custom schema)
- **Validation**: Zod
- **Pattern**: Repository + Service Layer

### Frontend
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI**: shadcn/ui

### External Services
- **Unsplash**: REST API
- **OpenAI**: AI SDK
- **Google Imagen**: AI SDK
- **Supabase Storage**: 이미지 업로드

---

## 📝 구현 순서

1. ✅ Database Schema (완료)
2. ✅ Types & DTOs (완료)
3. ✅ Entities (완료)
4. ✅ Repositories (완료)
5. ✅ Services (완료)
6. ✅ Server Actions (완료)
7. ⏳ Frontend Components (진행 중)
8. ⏳ Hooks & Integration (진행 중)

---

*이 Software Design 문서는 Image App Space Domain의 구현을 위한 기술 설계서입니다.*

