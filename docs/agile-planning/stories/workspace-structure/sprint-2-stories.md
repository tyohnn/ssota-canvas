# Workspace Structure Domain - Sprint 2 Stories

## 🎯 Sprint 2 Goal
페이지 계층 구조 및 권한 관리 시스템 완성 (Story Points: 18)

---

## 📋 Story WS-2.1: Page Hierarchy Management (8pts) ⭐

### User Story
**As a** 워크스페이스 멤버 **I want to** 중첩된 페이지 구조를 생성할 수 있어야 **so that** 콘텐츠를 계층적으로 조직화할 수 있다

### Command → Event Mapping
```typescript
Command: CreatePage
Events: Page Created → Page Hierarchy Updated → Canvas Initialized

Command: MovePageToWorkspace
Events: Page Moved to Workspace → Page Hierarchy Updated → Canvas Context Updated

Command: UpdatePageStructure
Events: Page Structure Updated → Page Hierarchy Cache Invalidated
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Page Hierarchy Management
  Scenario: Create nested page structure
    Given 워크스페이스에 페이지가 있다
    When 하위 페이지를 생성한다
    Then 페이지가 계층 구조에 추가된다
    And 부모-자식 관계가 설정된다
    And 페이지 경로가 업데이트된다

  Scenario: Move page between workspaces
    Given 사용자가 두 워크스페이스에 접근 권한이 있다
    When 페이지를 다른 워크스페이스로 이동한다
    Then 페이지가 이동된다
    And 계층 구조가 업데이트된다
    And Visual Canvas Domain에 컨텍스트 업데이트 이벤트가 전송된다

  Scenario: Search pages across hierarchy
    Given 복잡한 페이지 계층 구조가 있다
    When 페이지를 검색한다
    Then 계층 구조를 고려한 검색 결과가 반환된다
    And 검색 성능이 최적화된다
```

### Technical Implementation Details

#### Commands
```typescript
interface CreatePageCommand {
  workspaceId: string
  parentId?: string
  title: string
  description?: string
  createdBy: string
}

interface MovePageToWorkspaceCommand {
  pageId: string
  sourceWorkspaceId: string
  targetWorkspaceId: string
  newParentId?: string
  movedBy: string
}

interface UpdatePageStructureCommand {
  pageId: string
  newParentId?: string
  newTitle?: string
  updatedBy: string
}
```

#### Events
```typescript
interface PageCreatedEvent {
  pageId: string
  workspaceId: string
  parentId?: string
  title: string
  createdBy: string
  timestamp: Date
}

interface PageMovedToWorkspaceEvent {
  pageId: string
  sourceWorkspaceId: string
  targetWorkspaceId: string
  newParentId?: string
  movedBy: string
  timestamp: Date
}

interface PageStructureUpdatedEvent {
  pageId: string
  oldParentId?: string
  newParentId?: string
  updatedBy: string
  timestamp: Date
}
```

#### Aggregates
- **PageHierarchy Aggregate**: 페이지 계층 구조 관리
- **PageLifecycle Aggregate**: 페이지 생명주기 관리

#### Repository Methods
```typescript
interface PageHierarchyRepository {
  save(hierarchy: PageHierarchy): Promise<void>
  findByWorkspace(workspaceId: string): Promise<PageHierarchy>
  findByPage(pageId: string): Promise<PageHierarchy>
  findDescendants(pageId: string): Promise<PageNode[]>
  findAncestors(pageId: string): Promise<PageNode[]>
}
```

#### Database Schema
```sql
-- pages table (Materialized Path pattern)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  parent_id UUID REFERENCES pages(id),
  path VARCHAR(255) NOT NULL, -- materialized path
  title VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- page_hierarchy_cache table (performance optimization)
CREATE TABLE page_hierarchy_cache (
  page_id UUID PRIMARY KEY REFERENCES pages(id),
  workspace_id UUID REFERENCES workspaces(id),
  depth INTEGER NOT NULL,
  path VARCHAR(255) NOT NULL,
  children_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES pages(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sub-tasks

#### Backend Domain
- [ ] PageHierarchy Entity 구현
- [ ] PageHierarchy Aggregate 구현
- [ ] CreatePage Command Handler
- [ ] MovePageToWorkspace Command Handler
- [ ] Page 계층 구조 검증 로직

#### Database & Repository
- [ ] pages 테이블 생성 (Materialized Path)
- [ ] page_hierarchy_cache 테이블 생성
- [ ] PageHierarchyRepository 구현
- [ ] 계층 구조 쿼리 최적화
- [ ] 인덱스 설정

#### API & Server Action
- [ ] createPageAction 구현
- [ ] movePageToWorkspaceAction 구현
- [ ] updatePageStructureAction 구현
- [ ] searchPagesAction 구현
- [ ] 에러 처리 및 검증

#### Frontend
- [ ] 페이지 생성 UI
- [ ] 페이지 계층 구조 시각화
- [ ] 드래그 앤 드롭 페이지 이동
- [ ] 페이지 검색 UI

#### Integration Task
- [ ] Visual Canvas Domain 이벤트 전송
- [ ] 권한 검증 로직
- [ ] 계층 구조 캐시 무효화

#### E2E & Observability
- [ ] 페이지 계층 구조 E2E 테스트
- [ ] 페이지 이동 E2E 테스트
- [ ] 성능 테스트 (대용량 계층)
- [ ] 계층 구조 모니터링

### Definition of Done
- [ ] 무제한 중첩 페이지 구조 생성 가능
- [ ] 페이지 이동 시 권한 검증 완료
- [ ] 계층 구조 쿼리 성능 < 100ms
- [ ] Visual Canvas Domain과 이벤트 통신 완료

---

## 📋 Story WS-2.2: Permission & Access Control (5pts) ⭐

### User Story
**As a** 워크스페이스 관리자 **I want to** 페이지 접근을 제어할 수 있어야 **so that** 민감한 콘텐츠가 보호된다

### Command → Event Mapping
```typescript
Command: SetPagePermissions
Events: Page Permissions Updated → Access Control Cache Invalidated

Command: CreateSharedLink
Events: Shared Link Created → Access Token Generated

Command: PublishPageToWeb
Events: Page Published to Web → Public Access Enabled
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Permission & Access Control
  Scenario: Set page permissions
    Given 사용자가 페이지 관리자이다
    When 페이지 권한을 설정한다
    Then 권한이 업데이트된다
    And 접근 제어 캐시가 무효화된다
    And 하위 페이지에 권한이 상속된다

  Scenario: Create shared link
    Given 사용자가 페이지 공유 권한이 있다
    When 공유 링크를 생성한다
    Then 공유 링크가 생성된다
    And 접근 토큰이 생성된다
    And 링크 만료 시간이 설정된다

  Scenario: Publish page to web
    Given 사용자가 웹 게시 권한이 있다
    When 페이지를 웹에 게시한다
    Then 페이지가 공개된다
    And 웹에서 접근 가능해진다
```

### Technical Implementation Details

#### Commands
```typescript
interface SetPagePermissionsCommand {
  pageId: string
  permissions: PagePermissions
  inheritFromParent: boolean
  updatedBy: string
}

interface CreateSharedLinkCommand {
  pageId: string
  accessLevel: 'READ' | 'WRITE'
  expiresAt?: Date
  createdBy: string
}

interface PublishPageToWebCommand {
  pageId: string
  publicAccess: boolean
  publishedBy: string
}
```

#### Events
```typescript
interface PagePermissionsUpdatedEvent {
  pageId: string
  permissions: PagePermissions
  updatedBy: string
  timestamp: Date
}

interface SharedLinkCreatedEvent {
  pageId: string
  linkId: string
  accessToken: string
  expiresAt?: Date
  createdBy: string
  timestamp: Date
}

interface PagePublishedToWebEvent {
  pageId: string
  publicUrl: string
  publishedBy: string
  timestamp: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] PagePermissions Value Object 구현
- [ ] Permission Service 구현
- [ ] 권한 상속 로직
- [ ] 접근 제어 검증 로직

#### Database & Repository
- [ ] page_permissions 테이블 생성
- [ ] shared_links 테이블 생성
- [ ] PermissionRepository 구현
- [ ] RLS (Row Level Security) 정책 설정

#### API & Server Action
- [ ] setPagePermissionsAction 구현
- [ ] createSharedLinkAction 구현
- [ ] publishPageToWebAction 구현
- [ ] 권한 검증 미들웨어

#### Frontend
- [ ] 권한 설정 UI
- [ ] 공유 링크 관리 UI
- [ ] 웹 게시 설정 UI
- [ ] 권한 기반 UI 렌더링

#### Integration Task
- [ ] Clerk 권한과 연동
- [ ] 접근 제어 캐시 구현
- [ ] 공개 URL 생성

#### E2E & Observability
- [ ] 권한 설정 E2E 테스트
- [ ] 공유 링크 E2E 테스트
- [ ] 웹 게시 E2E 테스트
- [ ] 권한 모니터링

### Definition of Done
- [ ] 페이지별 권한 설정 완료
- [ ] 공유 링크 생성 및 관리 완료
- [ ] 웹 게시 기능 완료
- [ ] RLS 정책이 올바르게 작동

---

## 📋 Story WS-2.3: Page Navigation & Movement (5pts) ⭐

### User Story
**As a** 사용자 **I want to** 페이지 간을 탐색하고 콘텐츠를 이동할 수 있어야 **so that** 워크스페이스를 효율적으로 조직화할 수 있다

### Command → Event Mapping
```typescript
Command: NavigateToPage
Events: Page Navigation Started → Page History Updated

Command: CopyPageToWorkspace
Events: Page Copied → New Page Created → Canvas Data Copied

Command: ArchivePage
Events: Page Archived → Page History Updated → Canvas Cleanup Triggered
```

### Acceptance Criteria (Gherkin)
```gherkin
Feature: Page Navigation & Movement
  Scenario: Navigate between pages
    Given 여러 페이지가 있다
    When 페이지 간을 탐색한다
    Then 탐색 히스토리가 기록된다
    And 이전/다음 버튼이 작동한다
    And 페이지 로딩이 최적화된다

  Scenario: Copy page to another workspace
    Given 사용자가 두 워크스페이스에 접근 권한이 있다
    When 페이지를 다른 워크스페이스로 복사한다
    Then 새 페이지가 생성된다
    And 페이지 콘텐츠가 복사된다
    And Visual Canvas 데이터가 복사된다

  Scenario: Archive page
    Given 사용자가 페이지 관리 권한이 있다
    When 페이지를 아카이브한다
    Then 페이지가 휴지통으로 이동된다
    And Visual Canvas 정리가 트리거된다
    And 30일 후 완전 삭제 예약된다
```

### Technical Implementation Details

#### Commands
```typescript
interface NavigateToPageCommand {
  pageId: string
  userId: string
  navigationType: 'DIRECT' | 'BACK' | 'FORWARD'
}

interface CopyPageToWorkspaceCommand {
  sourcePageId: string
  targetWorkspaceId: string
  newTitle?: string
  copiedBy: string
}

interface ArchivePageCommand {
  pageId: string
  archivedBy: string
  reason?: string
}
```

#### Events
```typescript
interface PageNavigationStartedEvent {
  pageId: string
  userId: string
  navigationType: string
  timestamp: Date
}

interface PageCopiedToWorkspaceEvent {
  sourcePageId: string
  newPageId: string
  targetWorkspaceId: string
  copiedBy: string
  timestamp: Date
}

interface PageArchivedEvent {
  pageId: string
  archivedBy: string
  reason?: string
  archivedAt: Date
}
```

### Sub-tasks

#### Backend Domain
- [ ] PageNavigation Entity 구현
- [ ] PageLifecycle Aggregate 구현
- [ ] 페이지 복사 로직
- [ ] 페이지 아카이브 로직

#### Database & Repository
- [ ] page_navigation_history 테이블 생성
- [ ] page_archives 테이블 생성
- [ ] NavigationRepository 구현
- [ ] 아카이브 정리 스케줄러

#### API & Server Action
- [ ] navigateToPageAction 구현
- [ ] copyPageToWorkspaceAction 구현
- [ ] archivePageAction 구현
- [ ] 페이지 히스토리 조회 API

#### Frontend
- [ ] 페이지 네비게이션 UI
- [ ] 브레드크럼 네비게이션
- [ ] 페이지 복사 UI
- [ ] 아카이브 관리 UI

#### Integration Task
- [ ] Visual Canvas 데이터 복사
- [ ] 페이지 히스토리 관리
- [ ] 아카이브 정리 자동화

#### E2E & Observability
- [ ] 페이지 네비게이션 E2E 테스트
- [ ] 페이지 복사 E2E 테스트
- [ ] 아카이브 E2E 테스트
- [ ] 네비게이션 성능 모니터링

### Definition of Done
- [ ] 페이지 간 탐색이 부드럽게 작동
- [ ] 페이지 복사 시 모든 데이터가 올바르게 복사됨
- [ ] 아카이브 기능이 안전하게 작동
- [ ] 네비게이션 히스토리가 정확히 기록됨

---

## 🚀 Sprint 2 완료 기준

### 기능적 완료
- [ ] 무제한 중첩 페이지 구조 완성
- [ ] 페이지 권한 및 접근 제어 완성
- [ ] 페이지 네비게이션 및 이동 기능 완성
- [ ] Visual Canvas Domain과의 이벤트 통신 완성

### 기술적 완료
- [ ] PageHierarchy Aggregate 구현 완료
- [ ] PageLifecycle Aggregate 구현 완료
- [ ] Materialized Path 패턴 적용
- [ ] RLS (Row Level Security) 정책 구현

### 품질 완료
- [ ] 계층 구조 쿼리 성능 < 100ms
- [ ] 권한 검증 성능 < 50ms
- [ ] 페이지 이동 성능 < 200ms
- [ ] 모든 E2E 테스트 통과

**다음 Sprint 준비**: Visual Canvas Domain Sprint 3 구현을 위한 Workspace Structure 연동 테스트 및 문서화





