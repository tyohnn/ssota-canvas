# Technical Specification: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-10-11  
**최종 수정**: 2025-10-13  
**버전**: v1.2

**Testing Strategy 참조**: `04-testing-strategy.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: `07-tdd-implementation.md` (실제 구현)

---

> **가이드 참조**: `docs/event-domain-design/guide/05-technical-specification-guide.md`  
> **작성 시점**: Testing Strategy 완료 후, 실제 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요

Workspace Management Domain은 **Parent ID + depth 캐시 패턴**을 사용하여 Page 계층 구조를 관리합니다. PostgreSQL 재귀 CTE를 활용한 트리 조회로 충분한 성능을 확보하면서도, Page 이동 시 단순함을 유지합니다.

### 관련 문서

- **Testing Strategy**: `04-testing-strategy.md` - 221개 테스트 케이스 정의 (Scenario 0~5)
- **Software Design**: `03-software-design.md` - 2개 Aggregate (Workspace, Page)
- **Database Schema**: `06-db-schema.md` - 4개 테이블 (workspaces, pages, workspace_members, page_favorites)
- **User Flow**: `03-user-flow.md` - 5개 Scenario의 화면 흐름

### 구현 우선순위 요약 (Scenario 0~5)

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️) - 2개 (WorkspaceId, PageId)
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 2개 (Workspace, Page)
  - Workspace: create, updateInfo
  - Page: create, move, updateInfo, calculateDepth
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 2개 (Workspace, Page)
  - Workspace: 35개 테스트 (생성, 수정, 초대, 수락, 거절)
  - Page: 35개 테스트 (생성, 이동, 수정, 즐겨찾기)
Phase 4: Services (⭐️⭐️⭐️⭐️⭐️) - 4개 (Scenario별 분리)
  - WorkspaceNavigationService (Scenario 1: 11 tests, 4 deps)
  - WorkspaceCrudService (Scenario 2: 10 tests, 4 deps)
  - WorkspaceInvitationService (Scenario 3: 8 tests, 6 deps)
  - PageHierarchyService (Scenario 4: 10 tests, 2 deps)
Phase 5: Repositories (⭐️⭐️⭐️⭐️) - 4개
  - WorkspaceRepository, PageRepository (재귀 CTE), WorkspaceMemberRepository, PageFavoriteRepository
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 9개
  - Scenario 1: 2개, Scenario 2: 2개, Scenario 3: 3개, Scenario 4: 3개, Scenario 5: 1개
Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - 12개 시나리오
```

> **v1.2 아키텍처 개선**: 단일 Service를 Scenario별 4개로 분리하여 SRP 준수, 평균 파일 크기 74% 감소, 의존성 43% 감소

---

## 🧩 DDD Components

> **가이드 참조**: Phase 2.2 - DDD 컴포넌트 수도코드 작성

### 1. Value Objects 수도코드

#### WorkspaceId VO

- **파일 위치**: `src/domains/workspace-management/shared/value-objects/workspace-id.vo.ts`
- **역할**: Workspace 고유 식별자를 나타내는 Value Object
- **주요 기능**:
  - UUID 형식 유효성 검사
  - 빈 문자열 거부
  - 다른 WorkspaceId와의 동등성 비교
- **에러 처리**: 잘못된 UUID 형식 시 `InvalidWorkspaceIdError` 발생
- **비즈니스 규칙**: UUID v4 형식만 허용

**구현 수도코드**:
```typescript
class WorkspaceId {
  private readonly value: string;
  
  constructor(id: string) {
    // 1. null/undefined 체크
    // 2. 빈 문자열 체크
    // 3. UUID v4 형식 검증 (정규식)
    // 4. this.value 할당
  }
  
  toString(): string {
    // 1. this.value 반환
  }
  
  equals(other: WorkspaceId): boolean {
    // 1. this.value === other.value 반환
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 1 - Value Objects 테스트

---

#### PageId VO

- **파일 위치**: `src/domains/workspace-management/shared/value-objects/page-id.vo.ts`
- **역할**: Page 고유 식별자를 나타내는 Value Object
- **주요 기능**: WorkspaceId와 동일
- **에러 처리**: 잘못된 UUID 형식 시 `InvalidPageIdError` 발생

**구현 수도코드**:
```typescript
class PageId {
  private readonly value: string;
  
  constructor(id: string) {
    // WorkspaceId와 동일한 로직
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: PageId): boolean {
    return this.value === other.value;
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 1 - Value Objects 테스트

---

### 2. Entities 수도코드

#### Workspace Entity

- **파일 위치**: `src/domains/workspace-management/shared/entities/workspace.entity.ts`
- **역할**: Workspace 도메인 엔티티로 Workspace의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - workspaceId: WorkspaceId (불변)
  - organizationId: OrganizationId (불변)
  - name: string (변경 가능, 1-100자)
  - description: string | null (변경 가능, 최대 500자)
  - icon: string | null (변경 가능)
  - isDefault: boolean (불변)
  - deletable: boolean (불변)
  - createdBy: UserId (불변)
  - createdAt: Date (불변)
  - updatedAt: Date (변경 가능)
  - deletedAt: Date | null (소프트 삭제)
- **주요 메서드**:
  - updateInfo(name, description, icon): Workspace 정보 업데이트 및 updatedAt 갱신
  - softDelete(): 소프트 삭제 (deletedAt 설정)
  - canBeDeleted(): Default Workspace는 삭제 불가 검증
- **비즈니스 규칙**: 
  - Default Workspace는 deletable=false
  - 이름은 1-100자
  - 설명은 최대 500자

**구현 수도코드**:
```typescript
class Workspace {
  constructor(
    public readonly workspaceId: WorkspaceId,
    public readonly organizationId: OrganizationId,
    public name: string,
    public description: string | null,
    public icon: string | null,
    public readonly isDefault: boolean,
    public readonly deletable: boolean,
    public readonly createdBy: UserId,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null
  ) {
    // 1. 이름 검증 (1-100자)
    // 2. 설명 검증 (최대 500자)
    // 3. Default이면 deletable=false 검증
  }
  
  updateInfo(name: string, description: string | null, icon: string | null): void {
    // 1. 이름 검증 (1-100자)
    // 2. 설명 검증 (최대 500자)
    // 3. 속성 업데이트
    // 4. updatedAt = new Date()
  }
  
  softDelete(): void {
    // 1. canBeDeleted() 체크
    // 2. deletedAt = new Date()
  }
  
  canBeDeleted(): boolean {
    // 1. return this.deletable
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 2 - Entities 테스트

---

#### Page Entity

- **파일 위치**: `src/domains/workspace-management/shared/entities/page.entity.ts`
- **역할**: Page 도메인 엔티티로 Page의 핵심 정보와 계층 구조 로직을 캡슐화
- **주요 속성**:
  - pageId: PageId (불변)
  - workspaceId: WorkspaceId (불변)
  - parentId: PageId | null (변경 가능)
  - title: string (변경 가능, 최대 200자)
  - icon: string | null (변경 가능)
  - order: number (변경 가능)
  - depth: number (캐시, 계산됨)
  - createdBy: UserId (불변)
  - createdAt: Date (불변)
  - updatedAt: Date (변경 가능)
  - deletedAt: Date | null (소프트 삭제)
- **주요 메서드**:
  - calculateDepth(parent: Page | null): number - depth 계산 (부모 depth + 1)
  - updateTitle(title: string): void - 제목 업데이트
  - updateIcon(icon: string): void - 아이콘 업데이트
  - moveToParent(newParentId: PageId | null, newDepth: number): void - 부모 변경 및 depth 업데이트
  - softDelete(): void - 소프트 삭제
- **비즈니스 규칙**: 
  - 제목은 최대 200자
  - depth는 0 이상 (0=최상위)
  - parentId가 null이면 depth=0

**구현 수도코드**:
```typescript
class Page {
  constructor(
    public readonly pageId: PageId,
    public readonly workspaceId: WorkspaceId,
    public parentId: PageId | null,
    public title: string,
    public icon: string | null,
    public order: number,
    public depth: number,
    public readonly createdBy: UserId,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null
  ) {
    // 1. 제목 검증 (최대 200자)
    // 2. depth 검증 (0 이상)
    // 3. parentId null이면 depth=0 검증
  }
  
  calculateDepth(parent: Page | null): number {
    // 1. parentId가 null이면 0 반환
    // 2. parent가 null이면 Error (부모 페이지 없음)
    // 3. return parent.depth + 1
  }
  
  updateTitle(title: string): void {
    // 1. 제목 검증 (빈 문자열 불가, 최대 200자)
    // 2. this.title = title
    // 3. this.updatedAt = new Date()
  }
  
  updateIcon(icon: string | null): void {
    // 1. this.icon = icon
    // 2. this.updatedAt = new Date()
  }
  
  moveToParent(newParentId: PageId | null, newDepth: number): void {
    // 1. depth 검증 (0 이상)
    // 2. this.parentId = newParentId
    // 3. this.depth = newDepth
    // 4. this.updatedAt = new Date()
  }
  
  softDelete(): void {
    // 1. this.deletedAt = new Date()
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 2 - Entities 테스트

---

### 3. Aggregates 수도코드

#### Workspace Aggregate

- **파일 위치**: `src/domains/workspace-management/backend/aggregates/workspace.aggregate.ts`
- **역할**: Workspace 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
- **주요 기능**:
  - Workspace 생성 (Default/일반) - Scenario 0, 2
  - Workspace 정보 수정 - Scenario 2
  - Workspace 멤버십 검증 - Scenario 1
  - Workspace 멤버 초대/수락/거절 - Scenario 3
  - 도메인 이벤트 발생 및 관리
- **주요 메서드**:
  - createDefault(orgId, createdBy): Default Workspace 생성
  - create(orgId, name, description, icon, createdBy): 일반 Workspace 생성
  - updateInfo(name, description, icon): Workspace 정보 수정
  - inviteMember(userId): 멤버 초대
  - acceptInvitation(invitationId, userId): 초대 수락
  - rejectInvitation(invitationId, userId): 초대 거절
  - verifyMembership(workspaceId, userId, isOrgMember): 멤버십 검증
- **불변식(Invariants)**:
  - Workspace는 반드시 하나의 Organization에 속함
  - Default Workspace는 삭제 불가
  - 조직 소유자만 Workspace 생성 가능
  - Workspace 멤버만 정보 수정 가능
  - 조직 Admin + Workspace 멤버만 초대 가능
  - 이미 멤버인 경우 초대 불가

**구현 수도코드**:
```typescript
class WorkspaceAggregate {
  private _workspace: Workspace;
  private _events: DomainEvent[] = [];
  
  // Scenario 0: Default Workspace 생성
  static createDefault(
    organizationId: OrganizationId,
    createdBy: UserId
  ): WorkspaceAggregate {
    // 1. WorkspaceId 생성 (UUID)
    // 2. 기본 이름 설정 (조직명과 동일)
    // 3. Workspace Entity 생성 (isDefault=true, deletable=false)
    // 4. WorkspaceCreated 이벤트 생성 및 추가
    // 5. WorkspaceAggregate 반환
  }
  
  // Scenario 2: 일반 Workspace 생성
  static create(
    organizationId: OrganizationId,
    name: string,
    description: string | null,
    icon: string | null,
    createdBy: UserId
  ): WorkspaceAggregate {
    // 1. WorkspaceId 생성
    // 2. 이름 검증 (1-100자, 빈 문자열 불가)
    // 3. 설명 검증 (최대 500자)
    // 4. Workspace Entity 생성 (isDefault=false, deletable=true)
    // 5. WorkspaceCreated 이벤트 생성 및 추가
    // 6. WorkspaceAggregate 반환
  }
  
  // Scenario 2: Workspace 정보 수정
  updateInfo(
    name: string | undefined,
    description: string | null | undefined,
    icon: string | null | undefined
  ): void {
    // 1. 이름이 제공되면 검증 및 업데이트
    //    - 1-100자 검증
    //    - WorkspaceNameChanged 이벤트 발행
    // 2. 설명이 제공되면 검증 및 업데이트
    //    - 최대 500자 검증
    //    - WorkspaceDescriptionChanged 이벤트 발행
    // 3. 아이콘이 제공되면 업데이트
    //    - WorkspaceIconChanged 이벤트 발행
    // 4. Workspace Entity의 updatedAt 갱신
  }
  
  // Scenario 3: Workspace 멤버 초대
  inviteMember(
    invitedUserId: UserId,
    invitedByUserId: UserId,
    isInviterAdmin: boolean,
    isInviterWorkspaceMember: boolean,
    isAlreadyMember: boolean
  ): void {
    // 1. 권한 검증:
    //    - isInviterAdmin && isInviterWorkspaceMember === true 확인
    //    - false이면 InsufficientPermissionError 발생
    // 2. 중복 초대 방지:
    //    - isAlreadyMember === true이면 AlreadyMemberError 발생
    // 3. 초대 생성 (invitation 엔티티 또는 이벤트만)
    // 4. WorkspaceMemberInvitationCreated 이벤트 발행
  }
  
  // Scenario 3: 초대 수락
  acceptInvitation(
    invitationId: string,
    userId: UserId,
    isInvitee: boolean,
    isAlreadyProcessed: boolean
  ): void {
    // 1. 권한 검증:
    //    - isInvitee === true 확인 (본인만 수락)
    // 2. 중복 처리 방지:
    //    - isAlreadyProcessed === true이면 AlreadyProcessedError 발생
    // 3. 초대 완료 처리
    // 4. WorkspaceInvitationAccepted 이벤트 발행
    // 5. MemberAddedToWorkspace 이벤트 발행
  }
  
  // Scenario 3: 초대 거절
  rejectInvitation(
    invitationId: string,
    userId: UserId,
    isInvitee: boolean,
    isAlreadyProcessed: boolean
  ): void {
    // 1. 권한 검증: isInvitee === true 확인
    // 2. 중복 처리 방지: isAlreadyProcessed === true이면 Error
    // 3. 초대 종료 처리
    // 4. WorkspaceInvitationRejected 이벤트 발행
  }
  
  // Scenario 1: Workspace 멤버십 검증
  verifyMembership(workspaceId: WorkspaceId, userId: UserId, isOrgMember: boolean): boolean {
    // 1. Workspace가 Default이면:
    //    - isOrgMember === true이면 → return true (자동 접근)
    //    - isOrgMember === false이면 → return false
    // 2. 일반 Workspace이면:
    //    - WorkspaceMemberRepository 조회 필요 (여기서는 판단만)
    //    - return false (Repository에서 확인 필요)
  }
  
  getUncommittedEvents(): DomainEvent[] {
    // 1. this._events 반환
    // 2. this._events = [] (이벤트 클리어)
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 3 - Workspace Aggregate 테스트 (35개)  
**Process Model 매핑**: Scenario 0, 1, 2, 3

---

#### Page Aggregate

- **파일 위치**: `src/domains/workspace-management/backend/aggregates/page.aggregate.ts`
- **역할**: Page 관련 도메인 로직과 계층 구조를 담당하는 Aggregate Root
- **주요 기능**:
  - Page 생성 (depth 자동 계산) - Scenario 0, 2, 4
  - Page 이동 (순환 참조 가능) - Scenario 4
  - Page 정보 수정 (제목, 아이콘) - Scenario 4
  - Page 즐겨찾기 토글 - Scenario 5
  - Page 트리 조회 (재귀 CTE) - Scenario 1
  - Page 접근 권한 검증 - Scenario 1
- **주요 메서드**:
  - create(workspaceId, parentId, title, icon, createdBy, parentPage): Page 생성
  - move(pageId, newParentId, newParentPage, ancestors): Page 이동
  - updateInfo(title, icon): Page 제목/아이콘 수정
  - toggleFavorite(userId, isFavorited): 즐겨찾기 토글
  - verifyAccess(userId, isWorkspaceMember): 접근 권한 검증
- **불변식(Invariants)**:
  - Page는 반드시 하나의 Workspace에 속함
  - 순환 참조 불가
  - depth는 0 이상
  - 제목은 빈 문자열 불가
  - Workspace 멤버만 생성/수정/이동 가능

**구현 수도코드**:
```typescript
class PageAggregate {
  private _page: Page;
  private _events: DomainEvent[] = [];
  
  // Scenario 4: Page 생성
  static create(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    title: string,
    icon: string | null,
    createdBy: UserId,
    parentPage: Page | null
  ): PageAggregate {
    // 1. PageId 생성 (UUID)
    // 2. 제목 검증 (기본값 "Untitled" 또는 입력값, 최대 200자)
    // 3. depth 계산
    //    - parentId === null → depth = 0
    //    - parentId !== null → depth = parentPage.depth + 1
    // 4. parentId가 있는데 parentPage가 null이면 → PageNotFoundError
    // 5. order 계산 (같은 레벨 내 마지막 + 1)
    // 6. Page Entity 생성
    // 7. PageCreated 이벤트 발행
    // 8. EmptyCanvasInitialized 이벤트 발행
    // 9. PageAggregate 반환
  }
  
  // Scenario 4: Page 이동
  move(
    newParentId: PageId | null,
    newParentPage: Page | null,
    ancestors: Page[]
  ): void {
    // 1. **순환 참조 체크**: ancestors 중에 this._page.pageId가 있는지 확인
    //    - 있으면 → CircularReferenceError 발생
    // 2. 새 depth 계산
    //    - newParentId === null → newDepth = 0
    //    - newParentId !== null → newDepth = newParentPage.depth + 1
    // 3. Page Entity의 moveToParent(newParentId, newDepth) 호출
    // 4. PageMovedToChild 또는 PageMovedToRoot 이벤트 발행
    // 5. PageOrderChanged 이벤트 발행 (같은 레벨 순서 재정렬)
  }
  
  // Scenario 4: Page 정보 수정
  updateInfo(
    title: string | undefined,
    icon: string | null | undefined
  ): void {
    // 1. 제목이 제공되면:
    //    - 빈 문자열 검증
    //    - 최대 200자 검증
    //    - Page Entity의 updateTitle() 호출
    //    - PageTitleSet 이벤트 발행
    // 2. 아이콘이 제공되면:
    //    - Page Entity의 updateIcon() 호출
    //    - PageIconSet 이벤트 발행
  }
  
  // Scenario 5: 즐겨찾기 토글
  toggleFavorite(userId: UserId, isFavorited: boolean): boolean {
    // 1. 현재 상태 확인 (isFavorited)
    // 2. isFavorited === false이면:
    //    - PageAddedToFavorites 이벤트 발행
    //    - return true (새 상태)
    // 3. isFavorited === true이면:
    //    - PageRemovedFromFavorites 이벤트 발행
    //    - return false (새 상태)
  }
  
  // Scenario 1: Page 접근 권한 검증
  verifyAccess(userId: UserId, isWorkspaceMember: boolean): boolean {
    // 1. isWorkspaceMember === true이면 → return true
    // 2. isWorkspaceMember === false이면 → return false
    // 3. PageAccessVerified 또는 PageAccessDenied 이벤트 발행
  }
  
  getUncommittedEvents(): DomainEvent[] {
    // 1. this._events 반환
    // 2. this._events = [] (이벤트 클리어)
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 3 - Page Aggregate 테스트 (35개)  
**Process Model 매핑**: Scenario 1, 4, 5

---

### 4. Commands & Events 수도코드

#### Commands

- **파일 위치**: `src/domains/workspace-management/shared/commands/index.ts`

```typescript
// ===== Workspace Commands =====

// Scenario 0
interface CreateDefaultWorkspaceCommand {
  organizationId: string;
  createdBy: string;
}

// Scenario 2
interface CreateWorkspaceCommand {
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string;
}

interface UpdateWorkspaceInfoCommand {
  workspaceId: string;
  name?: string;
  description?: string | null;
  icon?: string | null;
}

// Scenario 3
interface InviteWorkspaceMemberCommand {
  workspaceId: string;
  memberEmails: string[];
  invitedBy: string;
}

interface AcceptWorkspaceInvitationCommand {
  invitationId: string;
  userId: string;
}

interface RejectWorkspaceInvitationCommand {
  invitationId: string;
  userId: string;
}

// ===== Page Commands =====

// Scenario 4
interface CreatePageCommand {
  workspaceId: string;
  parentId?: string;
  title?: string; // 기본값 "Untitled"
  icon?: string;  // 기본값 📄
  createdBy: string;
}

interface MovePageCommand {
  pageId: string;
  newParentId?: string;
}

interface UpdatePageInfoCommand {
  pageId: string;
  title?: string;
  icon?: string | null;
}

// Scenario 5
interface TogglePageFavoriteCommand {
  pageId: string;
  userId: string;
}
```

---

#### Events

- **파일 위치**: `src/domains/workspace-management/shared/events/index.ts`

```typescript
// ===== Workspace Events =====

// Scenario 0, 2
interface WorkspaceCreatedEvent {
  type: 'WorkspaceCreated';
  workspaceId: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  occurredAt: Date;
}

// Scenario 2
interface WorkspaceNameChangedEvent {
  type: 'WorkspaceNameChanged';
  workspaceId: string;
  oldName: string;
  newName: string;
  occurredAt: Date;
}

interface WorkspaceDescriptionChangedEvent {
  type: 'WorkspaceDescriptionChanged';
  workspaceId: string;
  newDescription: string | null;
  occurredAt: Date;
}

interface WorkspaceIconChangedEvent {
  type: 'WorkspaceIconChanged';
  workspaceId: string;
  newIcon: string | null;
  occurredAt: Date;
}

// Scenario 3
interface WorkspaceMemberInvitationCreatedEvent {
  type: 'WorkspaceMemberInvitationCreated';
  invitationId: string;
  workspaceId: string;
  invitedUserId: string;
  invitedBy: string;
  occurredAt: Date;
}

interface InvitationNotificationSentEvent {
  type: 'InvitationNotificationSent';
  invitationId: string;
  notificationId: string;
  occurredAt: Date;
}

interface WorkspaceInvitationAcceptedEvent {
  type: 'WorkspaceInvitationAccepted';
  invitationId: string;
  workspaceId: string;
  userId: string;
  occurredAt: Date;
}

interface MemberAddedToWorkspaceEvent {
  type: 'MemberAddedToWorkspace';
  workspaceId: string;
  userId: string;
  occurredAt: Date;
}

interface WorkspaceInvitationRejectedEvent {
  type: 'WorkspaceInvitationRejected';
  invitationId: string;
  userId: string;
  occurredAt: Date;
}

// Scenario 1
interface WorkspaceListLoadedEvent {
  type: 'WorkspaceListLoaded';
  organizationId: string;
  workspaceCount: number;
  occurredAt: Date;
}

// ===== Page Events =====

// Scenario 0, 2, 4
interface PageCreatedEvent {
  type: 'PageCreated';
  pageId: string;
  workspaceId: string;
  parentId?: string;
  depth: number;
  title: string;
  occurredAt: Date;
}

interface EmptyCanvasInitializedEvent {
  type: 'EmptyCanvasInitialized';
  pageId: string;
  occurredAt: Date;
}

// Scenario 4
interface PageMovedToChildEvent {
  type: 'PageMovedToChild';
  pageId: string;
  oldParentId?: string;
  newParentId: string;
  newDepth: number;
  occurredAt: Date;
}

interface PageMovedToRootEvent {
  type: 'PageMovedToRoot';
  pageId: string;
  oldParentId?: string;
  newDepth: number;
  occurredAt: Date;
}

interface PageOrderChangedEvent {
  type: 'PageOrderChanged';
  pageId: string;
  oldOrder: number;
  newOrder: number;
  occurredAt: Date;
}

interface PageTitleSetEvent {
  type: 'PageTitleSet';
  pageId: string;
  oldTitle: string;
  newTitle: string;
  occurredAt: Date;
}

interface PageIconSetEvent {
  type: 'PageIconSet';
  pageId: string;
  newIcon: string | null;
  occurredAt: Date;
}

// Scenario 5
interface PageAddedToFavoritesEvent {
  type: 'PageAddedToFavorites';
  pageId: string;
  userId: string;
  occurredAt: Date;
}

interface PageRemovedFromFavoritesEvent {
  type: 'PageRemovedFromFavorites';
  pageId: string;
  userId: string;
  occurredAt: Date;
}

// Scenario 1
interface PageTreeLoadedEvent {
  type: 'PageTreeLoaded';
  workspaceId: string;
  pageCount: number;
  occurredAt: Date;
}

interface PageAccessDeniedEvent {
  type: 'PageAccessDenied';
  pageId: string;
  userId: string;
  reason: 'NOT_ORG_MEMBER' | 'NOT_WORKSPACE_MEMBER';
  occurredAt: Date;
}
```

---

### 5. Error Types 수도코드

#### WorkspaceManagementError 클래스

- **파일 위치**: `src/domains/workspace-management/shared/errors/workspace-management.error.ts`

```typescript
class WorkspaceManagementError extends Error {
  constructor(
    public readonly code: WorkspaceManagementErrorCode,
    public readonly message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WorkspaceManagementError';
  }
}

type WorkspaceManagementErrorCode = 
  // Workspace Errors
  | 'WORKSPACE_NOT_FOUND'
  | 'INVALID_WORKSPACE_NAME'
  | 'WORKSPACE_NAME_TOO_LONG'
  | 'WORKSPACE_DESCRIPTION_TOO_LONG'
  | 'DEFAULT_WORKSPACE_NOT_DELETABLE'
  
  // Page Errors
  | 'PAGE_NOT_FOUND'
  | 'INVALID_PAGE_TITLE'
  | 'PAGE_TITLE_TOO_LONG'
  | 'CIRCULAR_REFERENCE_DETECTED'
  
  // Permission Errors
  | 'NOT_ORG_MEMBER'
  | 'NOT_WORKSPACE_MEMBER'
  | 'NOT_ORG_ADMIN'
  | 'NOT_ORG_OWNER'
  | 'INSUFFICIENT_PERMISSION'
  | 'UNAUTHORIZED_ACCESS'
  
  // Invitation Errors
  | 'INVITATION_NOT_FOUND'
  | 'ALREADY_WORKSPACE_MEMBER'
  | 'INVITATION_ALREADY_PROCESSED'
  | 'NOT_INVITATION_TARGET'
  | 'NOT_ORG_MEMBER_FOR_INVITATION'
  
  // System Errors
  | 'DATABASE_CONNECTION_FAILED'
  | 'NOTIFICATION_SERVICE_UNAVAILABLE';

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<WorkspaceManagementErrorCode, string> = {
  // Workspace Errors
  WORKSPACE_NOT_FOUND: 'Workspace를 찾을 수 없습니다',
  INVALID_WORKSPACE_NAME: 'Workspace 이름이 유효하지 않습니다',
  WORKSPACE_NAME_TOO_LONG: 'Workspace 이름은 100자 이내로 입력해주세요',
  WORKSPACE_DESCRIPTION_TOO_LONG: 'Workspace 설명은 500자 이내로 입력해주세요',
  DEFAULT_WORKSPACE_NOT_DELETABLE: '기본 워크스페이스는 삭제할 수 없습니다',
  
  // Page Errors
  PAGE_NOT_FOUND: '페이지를 찾을 수 없습니다',
  INVALID_PAGE_TITLE: '페이지 제목이 유효하지 않습니다',
  PAGE_TITLE_TOO_LONG: '페이지 제목은 200자 이내로 입력해주세요',
  CIRCULAR_REFERENCE_DETECTED: '순환 참조가 발생합니다',
  
  // Permission Errors
  NOT_ORG_MEMBER: '조직 멤버가 아닙니다',
  NOT_WORKSPACE_MEMBER: 'Workspace에 초대되지 않았습니다',
  NOT_ORG_ADMIN: '조직 관리자 권한이 필요합니다',
  NOT_ORG_OWNER: '조직 소유자 권한이 필요합니다',
  INSUFFICIENT_PERMISSION: '권한이 부족합니다',
  UNAUTHORIZED_ACCESS: '접근 권한이 없습니다',
  
  // Invitation Errors
  INVITATION_NOT_FOUND: '초대를 찾을 수 없습니다',
  ALREADY_WORKSPACE_MEMBER: '이미 Workspace 멤버입니다',
  INVITATION_ALREADY_PROCESSED: '이미 처리된 초대입니다',
  NOT_INVITATION_TARGET: '본인의 초대만 처리할 수 있습니다',
  NOT_ORG_MEMBER_FOR_INVITATION: '조직 멤버만 초대할 수 있습니다',
  
  // System Errors
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다',
  NOTIFICATION_SERVICE_UNAVAILABLE: '알림 서비스를 사용할 수 없습니다'
};
```

---

## 🔧 Infrastructure Layer

> **가이드 참조**: Phase 2.3 - Service/Repository/ACL 수도코드 작성

### 1. Repository 수도코드

#### WorkspaceRepository

- **파일 위치**: `src/domains/workspace-management/backend/repositories/workspace.repository.ts`
- **역할**: Workspace Aggregate의 영속성을 담당하는 Repository
- **주요 메서드**:
  - save(workspace: WorkspaceAggregate): Promise<void> - Workspace 저장
  - findById(workspaceId: WorkspaceId): Promise<Workspace | null> - ID로 조회
  - findByOrganizationId(orgId: OrganizationId): Promise<Workspace[]> - 조직의 모든 Workspace 조회
  - delete(workspaceId: WorkspaceId): Promise<void> - 소프트 삭제
- **DB 연동**: Drizzle ORM + PostgreSQL
- **RLS 정책**: 조직 멤버만 조회 가능
- **특징**: Aggregate ↔ DB 모델 간 변환

**구현 수도코드**:
```typescript
interface IWorkspaceRepository {
  save(workspace: WorkspaceAggregate): Promise<void>;
  findById(workspaceId: WorkspaceId): Promise<Workspace | null>;
  findByOrganizationId(orgId: OrganizationId): Promise<Workspace[]>;
}

class DrizzleWorkspaceRepository implements IWorkspaceRepository {
  async save(workspace: WorkspaceAggregate): Promise<void> {
    // 1. Workspace Entity → DB 모델 변환
    // 2. db.insert(workspaces).values(...)
    //    or db.update(workspaces).set(...).where(...)
    // 3. RLS 정책 자동 적용
  }
  
  async findByOrganizationId(orgId: OrganizationId): Promise<Workspace[]> {
    // 1. db.select().from(workspaces)
    //    .where(eq(workspaces.organizationId, orgId.toString()))
    //    .where(isNull(workspaces.deletedAt))
    //    .orderBy(desc(workspaces.isDefault))  // Default 최상단
    // 2. DB 모델 → Workspace Entity 변환
    // 3. return Workspace[]
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 4.1 - Repository 통합 테스트

---

#### PageRepository

- **파일 위치**: `src/domains/workspace-management/backend/repositories/page.repository.ts`
- **역할**: Page Aggregate의 영속성을 담당하는 Repository
- **주요 메서드**:
  - save(page: PageAggregate): Promise<void> - Page 저장
  - findById(pageId: PageId): Promise<Page | null> - ID로 조회
  - findTreeByWorkspaceId(workspaceId: WorkspaceId): Promise<Page[]> - 재귀 CTE로 트리 조회 ⭐️
  - findAncestors(pageId: PageId): Promise<Page[]> - 재귀 CTE로 ancestors 조회 (순환 참조 체크용)
  - updateDepth(pageId: PageId, newDepth: number): Promise<void> - depth 업데이트
  - updateChildrenDepth(parentId: PageId, depthDelta: number): Promise<void> - 하위 페이지 depth 재귀 업데이트
- **DB 연동**: Drizzle ORM + PostgreSQL 재귀 CTE
- **RLS 정책**: Workspace 멤버만 조회 가능

**구현 수도코드**:
```typescript
interface IPageRepository {
  save(page: PageAggregate): Promise<void>;
  findById(pageId: PageId): Promise<Page | null>;
  findTreeByWorkspaceId(workspaceId: WorkspaceId): Promise<Page[]>;
  findAncestors(pageId: PageId): Promise<Page[]>;
  updateChildrenDepth(parentId: PageId, depthDelta: number): Promise<void>;
}

class DrizzlePageRepository implements IPageRepository {
  async findTreeByWorkspaceId(workspaceId: WorkspaceId): Promise<Page[]> {
    // PostgreSQL 재귀 CTE 사용
    const sql = `
      WITH RECURSIVE page_tree AS (
        -- 최상위 페이지 (parent_id IS NULL)
        SELECT * FROM pages 
        WHERE workspace_id = $1 AND parent_id IS NULL AND deleted_at IS NULL
        
        UNION ALL
        
        -- 하위 페이지 (재귀)
        SELECT p.* FROM pages p
        INNER JOIN page_tree pt ON p.parent_id = pt.id
        WHERE p.deleted_at IS NULL
      )
      SELECT * FROM page_tree ORDER BY depth, order;
    `;
    
    // 1. db.execute(sql, [workspaceId])
    // 2. DB 모델 → Page Entity 변환
    // 3. return Page[]
  }
  
  async findAncestors(pageId: PageId): Promise<Page[]> {
    // PostgreSQL 재귀 CTE로 모든 조상 조회
    const sql = `
      WITH RECURSIVE ancestors AS (
        -- 현재 페이지
        SELECT * FROM pages WHERE id = $1
        
        UNION ALL
        
        -- 부모 페이지 (재귀)
        SELECT p.* FROM pages p
        INNER JOIN ancestors a ON p.id = a.parent_id
      )
      SELECT * FROM ancestors ORDER BY depth DESC;
    `;
    
    // 1. db.execute(sql, [pageId])
    // 2. DB 모델 → Page Entity 변환
    // 3. return Page[] (순환 참조 체크용)
  }
  
  async updateChildrenDepth(parentId: PageId, depthDelta: number): Promise<void> {
    // Page 이동 시 하위 페이지들의 depth 재귀적으로 업데이트
    const sql = `
      WITH RECURSIVE children AS (
        -- 직접 자식
        SELECT * FROM pages WHERE parent_id = $1
        
        UNION ALL
        
        -- 하위 자식 (재귀)
        SELECT p.* FROM pages p
        INNER JOIN children c ON p.parent_id = c.id
      )
      UPDATE pages
      SET depth = depth + $2, updated_at = NOW()
      WHERE id IN (SELECT id FROM children);
    `;
    
    // 1. db.execute(sql, [parentId, depthDelta])
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️ (재귀 CTE 핵심!)  
**Testing Strategy 참조**: 섹션 4.1 - PageRepository 통합 테스트

---

#### WorkspaceMemberRepository

- **파일 위치**: `src/domains/workspace-management/backend/repositories/workspace-member.repository.ts`
- **역할**: Workspace 멤버십 데이터 영속성 (초대 여부만 저장)
- **주요 메서드**:
  - isMember(workspaceId: WorkspaceId, userId: string): Promise<boolean>
  - addMember(workspaceId: WorkspaceId, userId: string): Promise<void>
  - removeMember(workspaceId: WorkspaceId, userId: string): Promise<void>
- **DB 연동**: Drizzle ORM
- **RLS 정책**: Self only (Application-level에서 adminDb 사용)
- **권한 관리**: role은 organization_members에서 조회

**구현 수도코드**:
```typescript
class DrizzleWorkspaceMemberRepository {
  async isMember(workspaceId: WorkspaceId, userId: string): Promise<boolean> {
    // 1. db.select().from(workspaceMembers)
    //    .where(and(
    //      eq(workspaceMembers.workspaceId, workspaceId.toString()),
    //      eq(workspaceMembers.userId, userId)
    //    ))
    // 2. return result.length > 0
  }
  
  async addMember(workspaceId: WorkspaceId, userId: string): Promise<void> {
    // 1. adminDb.insert(workspaceMembers).values({
    //      workspaceId: workspaceId.toString(),
    //      userId,
    //      // role 필드 제거 (organization_members에서 관리)
    //    })
    //    (Service에서 조직 권한 체크 후 호출)
  }
}
```

---

### 3. Read Models 수도코드

#### OrganizationWorkspacePageView

- **파일 위치**: `src/domains/workspace-management/backend/read-models/organization-workspace-page.view.ts`
- **역할**: 조직 페이지 사이드바에 표시할 Workspace-Page 통합 정보 제공
- **주요 데이터**:
  - organizationId: 조직 ID
  - workspaces: Workspace 목록 + 각 Workspace의 Page 트리
  - selectedPageId: 자동 선택할 페이지 ID (쿠키 또는 Fallback)
- **캐싱 전략**:
  - Redis 캐싱 (TTL: 5분)
  - 키 형식: `workspace:org:${orgId}:view`
  - 캐시 무효화: Workspace/Page 생성/수정/삭제 시

**구현 수도코드**:
```typescript
interface OrganizationWorkspacePageView {
  organizationId: string;
  workspaces: WorkspaceWithPages[];
  selectedPageId?: string;
}

class OrganizationWorkspacePageViewService {
  async load(
    orgId: OrganizationId,
    cookiePageId?: string
  ): Promise<OrganizationWorkspacePageView> {
    // 1. WorkspaceRepository.findByOrganizationId(orgId)
    // 2. 각 Workspace에 대해:
    //    - PageRepository.findTreeByWorkspaceId(workspaceId)
    // 3. Workspace + Page 트리 조합
    // 4. 쿠키 페이지 검증:
    //    - 존재하는지 확인
    //    - 조직이 일치하는지 확인
    //    - 유효하지 않으면 → Default Workspace 첫 페이지로 Fallback
    // 5. OrganizationWorkspacePageView 반환
  }
  
  private findDefaultWorkspaceFirstPage(workspaces: WorkspaceWithPages[]): string | null {
    // 1. Default Workspace 찾기 (isDefault=true)
    // 2. pageTree[0]?.id 반환
    // 3. 없으면 null 반환
  }
}
```

**최적화 전략**:
- Redis 캐싱 (TTL: 5분)
- 재귀 CTE 최적화 (depth 인덱스 사용)

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 3.4 - Read Model Service 테스트

---

#### WorkspaceMemberRepository (확장)

**Scenario 3 관련 추가 메서드**:

##### findByWorkspaceId
```typescript
/**
 * Workspace의 모든 멤버 조회 (프로필 포함)
 * 
 * 목적: Workspace 설정 모달 → 멤버 탭에서 멤버 목록 표시
 * 구현: INNER JOIN (workspace_members ⟕ profiles)
 * 성능: 단일 쿼리로 처리, N+1 문제 방지
 */
async findByWorkspaceId(workspaceId: WorkspaceId): Promise<WorkspaceMemberInfo[]>

interface WorkspaceMemberInfo {
  userId: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  joinedAt: Date;
}
```

**구현 수도코드**:
```typescript
async findByWorkspaceId(workspaceId: WorkspaceId): Promise<WorkspaceMemberInfo[]> {
  // 1. adminDb.select({
  //      userId: workspaceMembers.user_id,
  //      joinedAt: workspaceMembers.joined_at,
  //      name: profiles.name,
  //      email: profiles.email,
  //      avatarUrl: profiles.avatar_url
  //    })
  //    .from(workspaceMembers)
  //    .innerJoin(profiles, eq(workspaceMembers.user_id, profiles.user_id))
  //    .where(eq(workspaceMembers.workspace_id, workspaceId.value))
  //    .orderBy(workspaceMembers.joined_at)
  // 2. DB 모델 → WorkspaceMemberInfo 변환
  // 3. return WorkspaceMemberInfo[]
}
```

---

#### WorkspaceInvitationRepository

- **파일 위치**: `src/domains/workspace-management/backend/repositories/workspace-invitation.repository.ts`
- **역할**: Workspace 초대 데이터 영속성 관리

**Scenario 3 관련 메서드**:

##### findPendingByWorkspaceWithProfiles
```typescript
/**
 * Workspace의 pending 초대 목록 조회 (프로필 포함)
 * 
 * 목적: Workspace 설정 모달 → 멤버 탭에서 대기 중인 초대 표시
 * 구현: INNER JOIN (workspace_invitations ⟕ profiles)
 * 성능: 단일 쿼리로 처리, N+1 문제 방지
 */
async findPendingByWorkspaceWithProfiles(
  workspaceId: WorkspaceId
): Promise<WorkspaceInvitationWithProfiles[]>

interface WorkspaceInvitationWithProfiles {
  id: WorkspaceInvitationId;
  workspaceId: WorkspaceId;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  invitedBy: string;
  inviterName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  processedAt: Date | null;
}
```

**구현 수도코드**:
```typescript
async findPendingByWorkspaceWithProfiles(
  workspaceId: WorkspaceId
): Promise<WorkspaceInvitationWithProfiles[]> {
  // 1. adminDb.select({...})
  //    .from(workspaceInvitations)
  //    .innerJoin(profiles, eq(workspaceInvitations.invited_user_id, profiles.user_id))
  //    .where(and(
  //      eq(workspaceInvitations.workspace_id, workspaceId.value),
  //      eq(workspaceInvitations.status, 'pending')
  //    ))
  //    .orderBy(workspaceInvitations.created_at)
  // 2. 각 결과에 대해 inviter 프로필 조회
  // 3. DB 모델 → WorkspaceInvitationWithProfiles 변환
  // 4. return WorkspaceInvitationWithProfiles[]
}
```

##### findInvitation
```typescript
/**
 * 특정 사용자의 특정 상태 초대 조회
 * 
 * 목적: hasPendingInvitation 플래그 설정
 * 사용처: searchOrganizationMembersAction
 */
async findInvitation(
  workspaceId: WorkspaceId,
  userId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<WorkspaceInvitation | null>
```

**구현 수도코드**:
```typescript
async findInvitation(
  workspaceId: WorkspaceId,
  userId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<WorkspaceInvitation | null> {
  // 1. adminDb.select()
  //    .from(workspaceInvitations)
  //    .where(and(
  //      eq(workspaceInvitations.workspace_id, workspaceId.value),
  //      eq(workspaceInvitations.invited_user_id, userId),
  //      eq(workspaceInvitations.status, status)
  //    ))
  //    .limit(1)
  // 2. DB 모델 → WorkspaceInvitation Entity 변환
  // 3. return WorkspaceInvitation | null
}
```

---

#### OrganizationMemberRepository (외부 도메인)

**Scenario 3 관련 메서드**:

##### searchOrganizationMembersByEmail
```typescript
/**
 * 조직 멤버를 이메일로 효율적으로 검색
 * 
 * 목적: 멤버 초대 시 실시간 이메일 검색
 * 구현: INNER JOIN (organization_members ⟕ profiles)
 * 성능 최적화: 
 *   - JOIN 쿼리로 N+1 문제 방지
 *   - ilike로 대소문자 구분 없는 부분 매칭
 *   - 최대 10개 결과 반환
 */
async searchOrganizationMembersByEmail(
  organizationId: string,
  emailQuery: string
): Promise<UserProfile[]>

interface UserProfile {
  userId: string;
  email: string;
  name: string | null;
  profileImageUrl: string | null;
}
```

**구현 수도코드**:
```typescript
async searchOrganizationMembersByEmail(
  organizationId: string,
  emailQuery: string
): Promise<UserProfile[]> {
  // 1. adminDb.select({
  //      userId: organizationMembers.user_id,
  //      email: profiles.email,
  //      name: profiles.name,
  //      avatarUrl: profiles.avatar_url
  //    })
  //    .from(organizationMembers)
  //    .innerJoin(profiles, eq(organizationMembers.user_id, profiles.user_id))
  //    .where(and(
  //      eq(organizationMembers.organization_id, organizationId),
  //      ilike(profiles.email, `%${emailQuery}%`)  // 대소문자 무시 부분 매칭
  //    ))
  //    .limit(10)
  // 2. DB 모델 → UserProfile 변환
  // 3. return UserProfile[]
}
```

**성능 특징**:
- 단일 JOIN 쿼리로 처리 (N+1 문제 없음)
- `ilike` 연산자로 대소문자 구분 없는 검색
- 최대 10개 결과로 제한 (UI 성능)

---

#### OrganizationRepository (외부 도메인)

**Scenario 3 관련 메서드**:

##### getOrganizationName
```typescript
/**
 * 조직 이름 조회 (간단한 정보용)
 * 
 * 목적: 알림 메시지에 조직 이름 포함
 * 구현: 이름만 SELECT (전체 Aggregate 불필요)
 * 사용처: WorkspaceManagementService.inviteWorkspaceMembers
 */
async getOrganizationName(id: OrganizationId): Promise<string | null>
```

**구현 수도코드**:
```typescript
async getOrganizationName(id: OrganizationId): Promise<string | null> {
  // 1. adminDb.select({ name: organizations.name })
  //    .from(organizations)
  //    .where(eq(organizations.id, id.value))
  //    .limit(1)
  // 2. return data?.name ?? null
}
```

**특징**:
- 가벼운 조회 (이름만)
- Repository Pattern 준수
- Service Layer에서 권한 확인 후 호출

---

#### PageFavoriteRepository

- **파일 위치**: `src/domains/workspace-management/backend/repositories/page-favorite.repository.ts`
- **역할**: 사용자별 페이지 즐겨찾기 데이터 관리
- **주요 메서드**:
  - isFavorite(pageId: PageId, userId: string): Promise<boolean>
  - toggle(pageId: PageId, userId: string): Promise<boolean> - 추가/제거 토글
  - findByUserId(userId: string): Promise<Page[]> - 사용자의 모든 즐겨찾기 조회
- **DB 연동**: Drizzle ORM
- **RLS 정책**: Self only (개인 데이터)

**구현 수도코드**:
```typescript
interface IPageFavoriteRepository {
  isFavorite(pageId: PageId, userId: string): Promise<boolean>;
  toggle(pageId: PageId, userId: string): Promise<boolean>;
  findByUserId(userId: string): Promise<Page[]>;
}

class DrizzlePageFavoriteRepository implements IPageFavoriteRepository {
  async isFavorite(pageId: PageId, userId: string): Promise<boolean> {
    // 1. db.select().from(pageFavorites)
    //    .where(and(
    //      eq(pageFavorites.pageId, pageId.toString()),
    //      eq(pageFavorites.userId, userId)
    //    ))
    // 2. return result.length > 0
  }
  
  async toggle(pageId: PageId, userId: string): Promise<boolean> {
    // 1. 현재 상태 확인 (isFavorite)
    // 2. isFavorite === false이면:
    //    - db.insert(pageFavorites).values({ pageId, userId })
    //    - return true
    // 3. isFavorite === true이면:
    //    - db.delete(pageFavorites).where(and(...))
    //    - return false
  }
  
  async findByUserId(userId: string): Promise<Page[]> {
    // 1. db.select().from(pageFavorites)
    //    .innerJoin(pages, eq(pages.id, pageFavorites.pageId))
    //    .where(eq(pageFavorites.userId, userId))
    //    .orderBy(desc(pageFavorites.favoritedAt))
    // 2. DB 모델 → Page Entity 변환
    // 3. return Page[]
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 4.1 - Repository 통합 테스트

---

## 📦 DTOs (Data Transfer Objects)

> **가이드 참조**: DTOs는 클라이언트와 서버 간 데이터 전송 형식을 정의합니다.

### Scenario 3: 멤버 초대 관련 DTOs

#### OrganizationMemberSearchResultDTO
```typescript
/**
 * 조직 멤버 검색 결과 DTO
 * 
 * 용도: 멤버 초대 시 이메일 검색 결과 표시
 * Server Action: searchOrganizationMembersAction
 */
interface OrganizationMemberSearchResultDTO {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAlreadyMember: boolean;        // Workspace 멤버 여부
  hasPendingInvitation: boolean;   // 대기 중인 초대 여부
}
```

**사용처**:
- `searchOrganizationMembersAction` 반환값
- InviteMemberDialog 컴포넌트에서 프로필 프리뷰 카드 렌더링
- UI에서 선택 가능 여부 판단 (isAlreadyMember, hasPendingInvitation)

**플래그 설정 로직**:
- `isAlreadyMember`: `WorkspaceMemberRepository.isMember()` 결과
- `hasPendingInvitation`: `WorkspaceInvitationRepository.findInvitation(status='pending')` 결과

---

#### WorkspaceMemberView
```typescript
/**
 * Workspace 멤버 목록 통합 뷰 DTO
 * 
 * 용도: Workspace 설정 모달 → 멤버 탭에서 표시
 * Server Action: getWorkspaceMembersAction
 */
interface WorkspaceMemberView {
  workspaceId: string;
  workspaceName: string;
  currentMembers: WorkspaceMemberDTO[];
  pendingInvitations: WorkspaceInvitationPendingDTO[];
}

interface WorkspaceMemberDTO {
  userId: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  joinedAt: string; // ISO 8601
}

interface WorkspaceInvitationPendingDTO {
  id: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  inviterName: string;
  createdAt: string; // ISO 8601
}
```

**사용처**:
- `getWorkspaceMembersAction` 반환값
- WorkspaceMemberListTable 컴포넌트에서 테이블 렌더링
- 현재 멤버 섹션 + 대기 중인 초대 섹션 분리 표시

---

## 🚀 Application Layer

> **가이드 참조**: Phase 2.3, 2.4 - Service 및 Server Actions 수도코드

### 1. Service 수도코드

> **v1.2 아키텍처 개선**: 단일 Service를 Scenario별 4개로 분리하여 SRP(단일 책임 원칙) 준수
> - **Before**: 1개 Service (837줄, 7 deps, 10 메서드)
> - **After**: 4개 Service (평균 220줄, 평균 4 deps)

#### WorkspaceNavigationService (Scenario 1)

- **파일 위치**: `src/domains/workspace-management/backend/services/workspace-navigation.service.ts`
- **역할**: 조직 내 Workspace-Page 조회 및 접근 권한 검증
- **주요 의존성** (4개):
  - WorkspaceRepository
  - PageRepository
  - WorkspaceMemberRepository
  - OrganizationMemberRepository
- **주요 메서드**:
  - getOrganizationWorkspacePageView(orgId, userId, cookiePageId): Workspace-Page 목록 조회
  - verifyPageAccess(orgId, workspaceId, pageId, userId): Page 접근 권한 검증
- **테스트**: 11개 (100% 통과)

#### WorkspaceCrudService (Scenario 2)

- **파일 위치**: `src/domains/workspace-management/backend/services/workspace-crud.service.ts`
- **역할**: Workspace 생성 및 정보 수정
- **주요 의존성** (4개):
  - WorkspaceRepository
  - PageRepository
  - WorkspaceMemberRepository
  - OrganizationMemberRepository
- **주요 메서드**:
  - createWorkspace(orgId, name, description, icon, userId): Workspace 생성 (트랜잭션)
  - updateWorkspaceInfo(workspaceId, name, description, icon, userId): Workspace 정보 수정
- **트랜잭션**: Workspace + 멤버십 + 초기 Page 생성
- **테스트**: 10개 (100% 통과)

#### WorkspaceInvitationService (Scenario 3)

- **파일 위치**: `src/domains/workspace-management/backend/services/workspace-invitation.service.ts`
- **역할**: Workspace 멤버 초대, 수락, 거절
- **주요 의존성** (6개):
  - WorkspaceRepository
  - WorkspaceMemberRepository
  - OrganizationMemberRepository
  - OrganizationRepository
  - WorkspaceInvitationRepository (optional)
  - NotificationRepository (optional)
- **주요 메서드**:
  - inviteWorkspaceMembers(workspaceId, memberEmails, userId): 멤버 초대 (Notification 통합)
  - acceptWorkspaceInvitation(invitationId, userId): 초대 수락
  - rejectWorkspaceInvitation(invitationId, userId): 초대 거절
- **Graceful Degradation**: Notification 실패해도 초대는 생성
- **테스트**: 8개 (100% 통과)

#### PageHierarchyService (Scenario 4)

- **파일 위치**: `src/domains/workspace-management/backend/services/page-hierarchy.service.ts`
- **역할**: Page 생성, 이동, 정보 수정
- **주요 의존성** (2개 - 최소!):
  - PageRepository
  - WorkspaceMemberRepository
- **주요 메서드**:
  - createPage(workspaceId, parentId, title, icon, userId): Page 생성
  - movePage(pageId, newParentId, userId): Page 이동 (순환 참조 체크)
  - updatePageInfo(pageId, title, icon, userId): Page 정보 수정
- **특징**: 의존성 최소화 (2개만), 순환 참조 자동 감지
- **테스트**: 10개 (100% 통과)

**구현 수도코드**:

```typescript
// ===== Scenario 1: WorkspaceNavigationService =====
class WorkspaceNavigationService {
  constructor(
    private workspaceRepo: IWorkspaceRepository,
    private pageRepo: IPageRepository,
    private workspaceMemberRepo: IWorkspaceMemberRepository,
    private orgMemberRepo: IOrganizationMemberRepository
  ) {}
  
  // ===== Scenario 1: Workspace-Page 목록 조회 =====
  async getOrganizationWorkspacePageView(
    orgId: OrganizationId,
    userId: UserId,
    cookiePageId?: string
  ): Promise<Result<OrganizationWorkspacePageView>> {
    // (기존 로직 유지)
  }
  
  async verifyPageAccess(
    orgId: OrganizationId,
    workspaceId: WorkspaceId,
    pageId: PageId,
    userId: string
  ): Promise<Result<{ page: Page; userRole: string }>> {
    // (기존 로직 유지)
  }
  
}

// ===== Scenario 2: WorkspaceCrudService =====
class WorkspaceCrudService {
  constructor(
    private workspaceRepo: IWorkspaceRepository,
    private pageRepo: IPageRepository,
    private workspaceMemberRepo: IWorkspaceMemberRepository,
    private orgMemberRepo: IOrganizationMemberRepository
  ) {}
  
  async createWorkspace(
    orgId: OrganizationId,
    name: string,
    description: string | null,
    icon: string | null,
    userId: UserId
  ): Promise<Result<{ workspaceId: string; firstPageId: string }>> {
    // 1. 조직 소유자 권한 확인
    const orgMember = await this.orgMemberRepo.findMemberRole(orgId, userId);
    if (!orgMember || orgMember.role !== 'owner') {
      return Result.err('NOT_ORG_OWNER');
    }
    
    // 2. Workspace Aggregate 생성
    const workspaceAgg = WorkspaceAggregate.create(orgId, name, description, icon, userId);
    
    // 3. 트랜잭션 시작
    await db.transaction(async (tx) => {
      // 4. Workspace 저장
      await this.workspaceRepo.save(workspaceAgg);
      
      // 5. 조직 소유자를 Workspace 멤버로 추가
      await this.workspaceMemberRepo.addMember(workspaceAgg.workspaceId, userId);
      
      // 6. 초기 "Untitled" 페이지 생성
      const pageAgg = PageAggregate.create(
        workspaceAgg.workspaceId,
        null, // 최상위
        'Untitled',
        '📄',
        userId,
        null
      );
      await this.pageRepo.save(pageAgg);
      
      // 7. 트랜잭션 커밋
    });
    
    // 8. Result.ok 반환 (workspaceId, firstPageId)
    return Result.ok({
      workspaceId: workspaceAgg.workspaceId.toString(),
      firstPageId: pageAgg.pageId.toString()
    });
  }
  
  async updateWorkspaceInfo(
    workspaceId: WorkspaceId,
    name: string | undefined,
    description: string | null | undefined,
    icon: string | null | undefined,
    userId: UserId
  ): Promise<Result<void>> {
    // 1. Workspace 멤버십 확인
    const isMember = await this.workspaceMemberRepo.isMember(workspaceId, userId);
    if (!isMember) {
      return Result.err('NOT_WORKSPACE_MEMBER');
    }
    
    // 2. Workspace 조회
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return Result.err('WORKSPACE_NOT_FOUND');
    }
    
    // 3. Workspace Aggregate의 updateInfo() 호출
    workspaceAgg.updateInfo(name, description, icon);
    
    // 4. Workspace 저장
    await this.workspaceRepo.save(workspaceAgg);
    
    // 5. Result.ok 반환
    return Result.ok();
  }
  
}

// ===== Scenario 3: WorkspaceInvitationService =====
class WorkspaceInvitationService {
  constructor(
    private workspaceRepo: IWorkspaceRepository,
    private workspaceMemberRepo: IWorkspaceMemberRepository,
    private orgMemberRepo: IOrganizationMemberRepository,
    private orgRepo: IOrganizationRepository,
    private invitationRepo?: IWorkspaceInvitationRepository,
    private notificationRepo?: INotificationRepository
  ) {}
  
  async inviteWorkspaceMembers(
    workspaceId: WorkspaceId,
    memberEmails: string[],
    userId: UserId
  ): Promise<Result<number>> {
    // 1. Workspace 조회
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return Result.err('WORKSPACE_NOT_FOUND');
    }
    
    // 2. 조직 Admin 권한 확인
    const orgMember = await this.orgMemberRepo.findMemberRole(workspace.organizationId, userId);
    if (!orgMember || (orgMember.role !== 'admin' && orgMember.role !== 'owner')) {
      return Result.err('NOT_ORG_ADMIN');
    }
    
    // 3. Workspace 멤버십 확인
    const isWorkspaceMember = await this.workspaceMemberRepo.isMember(workspaceId, userId);
    if (!isWorkspaceMember) {
      return Result.err('NOT_WORKSPACE_MEMBER');
    }
    
    // 4. 알림 메시지용 정보 조회
    // 4-1. 초대한 사람 프로필 조회
    const inviterProfile = await this.orgMemberRepo.searchUserProfileByEmail(userId);
    const inviterName = inviterProfile[0]?.name || '관리자';
    
    // 4-2. 조직 이름 조회 (Repository Pattern 준수)
    const organizationName = await this.orgRepo.getOrganizationName(workspace.organizationId) 
      || 'Unknown Organization';
    
    // 5. 각 이메일에 대해 초대 처리
    let invitedCount = 0;
    for (const email of memberEmails) {
      try {
        // 6. 이메일로 조직 멤버 검색
        const targetUser = await this.orgMemberRepo.searchUserProfileByEmail(email);
        if (!targetUser || targetUser.length === 0) continue;
        
        // 7. 이미 Workspace 멤버인지 확인
        const isAlreadyMember = await this.workspaceMemberRepo.isMember(workspaceId, targetUser[0].userId);
        if (isAlreadyMember) continue;
        
        // 8. 이미 pending 초대가 있는지 확인
        const hasPendingInvitation = await this.invitationRepo.findInvitation(
          workspaceId, targetUser[0].userId, 'pending'
        );
        if (hasPendingInvitation) continue;
        
        // 9. 초대 생성 (Aggregate를 통한 도메인 로직)
        const invitation = workspaceAgg.inviteMember(
          targetUser[0].userId, 
          userId, 
          true, // isInviterAdmin
          true, // isInviterWorkspaceMember
          false // isAlreadyMember
        );
        
        // 10. 초대 저장
        await this.invitationRepo.save(invitation);
        
        // 11. Notification Domain 통합: 알림 생성 (Graceful Degradation)
        try {
          await this.notificationService.createWorkspaceInvitationNotification({
            userId: targetUser[0].userId,
            workspaceInvitationId: invitation.id.value,
            workspaceName: workspace.name,
            workspaceDescription: workspace.description,
            inviterName,
            organizationName
          });
        } catch (notificationError) {
          // 알림 실패는 로그만 (초대는 유지)
          console.error('Failed to send notification:', notificationError);
        }
        
        invitedCount++;
      } catch (error) {
        // 개별 초대 실패는 건너뜀
        console.error(`Failed to invite ${email}:`, error);
      }
    }
    
    // 12. Result.ok 반환 (초대한 멤버 수)
    return Result.ok(invitedCount);
  }
  
  async acceptWorkspaceInvitation(
    invitationId: string,
    userId: UserId
  ): Promise<Result<void>> {
    // 1. 초대 조회
    const invitation = await this.findInvitation(invitationId);
    if (!invitation) {
      return Result.err('INVITATION_NOT_FOUND');
    }
    
    // 2. 본인의 초대인지 확인
    if (invitation.invitedUserId !== userId.toString()) {
      return Result.err('NOT_INVITATION_TARGET');
    }
    
    // 3. 이미 처리되었는지 확인
    if (invitation.status !== 'PENDING') {
      return Result.err('INVITATION_ALREADY_PROCESSED');
    }
    
    // 4. 트랜잭션 시작
    await db.transaction(async (tx) => {
      // 5. Workspace Aggregate의 acceptInvitation() 호출
      workspaceAgg.acceptInvitation(invitationId, userId, true, false);
      
      // 6. Workspace 멤버로 추가 (adminDb 사용)
      await this.workspaceMemberRepo.addMember(invitation.workspaceId, userId);
      
      // 7. Notification Domain 통합: 알림 업데이트 (동기)
      await this.notificationService.updateNotificationStatus(invitation.notificationId, 'ACCEPTED');
    });
    
    // 8. Result.ok 반환
    return Result.ok();
  }
  
  async rejectWorkspaceInvitation(
    invitationId: string,
    userId: UserId
  ): Promise<Result<void>> {
    // (acceptInvitation과 유사, 거절 처리)
    // 1-3: 동일
    // 4. Workspace Aggregate의 rejectInvitation() 호출
    // 5. Notification Domain: 알림 업데이트 (REJECTED)
    // 6. Result.ok 반환
  }
  
}

// ===== Scenario 4: PageHierarchyService =====
class PageHierarchyService {
  constructor(
    private pageRepo: IPageRepository,
    private workspaceMemberRepo: IWorkspaceMemberRepository
  ) {}
  
  async createPage(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    title: string,
    icon: string | null,
    userId: UserId
  ): Promise<Result<string>> {
    // 1. Workspace 멤버십 확인
    const isMember = await this.workspaceMemberRepo.isMember(workspaceId, userId);
    if (!isMember) {
      return Result.err('NOT_WORKSPACE_MEMBER');
    }
    
    // 2. 부모 페이지 조회 (parentId가 있는 경우)
    let parentPage: Page | null = null;
    if (parentId) {
      parentPage = await this.pageRepo.findById(parentId);
      if (!parentPage) {
        return Result.err('PAGE_NOT_FOUND');
      }
      
      // 3. 부모 페이지가 같은 Workspace에 속하는지 확인
      if (parentPage.workspaceId.toString() !== workspaceId.toString()) {
        return Result.err('BAD_REQUEST');
      }
    }
    
    // 4. Page Aggregate 생성
    const pageAgg = PageAggregate.create(
      workspaceId,
      parentId,
      'Untitled', // 기본 제목
      '📄',       // 기본 아이콘
      userId,
      parentPage
    );
    
    // 5. Page 저장
    await this.pageRepo.save(pageAgg);
    
    // 6. Result.ok 반환 (pageId)
    return Result.ok(pageAgg.pageId.toString());
  }
  
  async movePage(
    pageId: PageId,
    newParentId: PageId | null,
    userId: UserId
  ): Promise<Result<void>> {
    // 1. Page 조회
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return Result.err('PAGE_NOT_FOUND');
    }
    
    // 2. Workspace 멤버십 확인
    const isMember = await this.workspaceMemberRepo.isMember(page.workspaceId, userId);
    if (!isMember) {
      return Result.err('NOT_WORKSPACE_MEMBER');
    }
    
    // 3. 새 부모 페이지 조회 (newParentId가 있는 경우)
    let newParentPage: Page | null = null;
    if (newParentId) {
      newParentPage = await this.pageRepo.findById(newParentId);
      if (!newParentPage) {
        return Result.err('PAGE_NOT_FOUND');
      }
      
      // 4. 새 부모가 같은 Workspace에 속하는지 확인
      if (newParentPage.workspaceId.toString() !== page.workspaceId.toString()) {
        return Result.err('BAD_REQUEST');
      }
      
      // 5. 순환 참조 체크: 재귀 CTE로 ancestors 조회
      const ancestors = await this.pageRepo.findAncestors(newParentId);
      const isCircular = ancestors.some(a => a.pageId.toString() === pageId.toString());
      if (isCircular) {
        return Result.err('CIRCULAR_REFERENCE_DETECTED');
      }
    }
    
    // 6. Page Aggregate의 move() 호출
    pageAgg.move(newParentId, newParentPage, ancestors);
    
    // 7. Page 저장 (parent_id, depth 업데이트)
    await this.pageRepo.save(pageAgg);
    
    // 8. 하위 페이지들 depth 재귀 업데이트
    const depthDelta = page.depth - pageAgg.page.depth;
    if (depthDelta !== 0) {
      await this.pageRepo.updateChildrenDepth(pageId, depthDelta);
    }
    
    // 9. Result.ok 반환
    return Result.ok();
  }
  
  async updatePageInfo(
    pageId: PageId,
    title: string | undefined,
    icon: string | null | undefined,
    userId: UserId
  ): Promise<Result<void>> {
    // 1. Page 조회
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return Result.err('PAGE_NOT_FOUND');
    }
    
    // 2. Workspace 멤버십 확인
    const isMember = await this.workspaceMemberRepo.isMember(page.workspaceId, userId);
    if (!isMember) {
      return Result.err('NOT_WORKSPACE_MEMBER');
    }
    
    // 3. Page Aggregate의 updateInfo() 호출
    pageAgg.updateInfo(title, icon);
    
    // 4. Page 저장
    await this.pageRepo.save(pageAgg);
    
    // 5. Result.ok 반환
    return Result.ok();
  }
  
  // ===== Scenario 5: 즐겨찾기 토글 =====
  async togglePageFavorite(
    pageId: PageId,
    userId: UserId
  ): Promise<Result<boolean>> {
    // 1. Page 조회
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return Result.err('PAGE_NOT_FOUND');
    }
    
    // 2. Workspace 멤버십 확인
    const isMember = await this.workspaceMemberRepo.isMember(page.workspaceId, userId);
    if (!isMember) {
      return Result.err('NOT_WORKSPACE_MEMBER');
    }
    
    // 3. 현재 즐겨찾기 상태 확인
    const isFavorited = await this.pageFavoriteRepo.isFavorite(pageId, userId);
    
    // 4. Page Aggregate의 toggleFavorite() 호출
    const newState = pageAgg.toggleFavorite(userId, isFavorited);
    
    // 5. Repository에서 토글 처리
    await this.pageFavoriteRepo.toggle(pageId, userId);
    
    // 6. Result.ok 반환 (새 상태)
    return Result.ok(newState);
  }
}
```

}

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 4 - Service 통합 테스트  
**아키텍처 특징**: 
- SRP 준수 (각 Service가 1개 Scenario 책임)
- 의존성 최소화 (PageHierarchyService는 2개만)
- 독립 테스트 가능 (병렬 실행)
- 확장성 (새 Scenario 추가 시 기존 코드 변경 없음)

---

### 2. Server Actions 수도코드

- **파일 위치**: `src/domains/workspace-management/actions/workspace-management.actions.ts`
- **공통 패턴**:
  - Supabase Auth 기반 사용자 인증
  - Service Layer 의존성 주입
  - Result pattern 사용 (Result.ok / Result.err)
  - 도메인 모델 → DTO 직렬화

#### getOrganizationWorkspacePageViewAction (Scenario 1)

- **역할**: 조직 Workspace-Page 목록 조회
- **입력**: { orgId: string, cookiePageId?: string }
- **출력**: Result<OrganizationWorkspacePageViewDTO>

**구현 수도코드**:
```typescript
'use server';

async function getOrganizationWorkspacePageViewAction(
  orgId: string,
  cookiePageId?: string
): Promise<Result<OrganizationWorkspacePageViewDTO>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출
  const result = await service.getOrganizationWorkspacePageView(
    new OrganizationId(orgId),
    new UserId(user.id),
    cookiePageId
  );
  
  // 3. DTO 직렬화
  if (result.isOk) {
    return Result.ok(toDTO(result.value));
  }
  return Result.err(result.error);
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: getOrganizationWorkspacePageViewAction (12개 테스트)

---

#### verifyPageAccessAction (Scenario 1)

- **역할**: 페이지 접근 권한 검증
- **입력**: { orgId: string, workspaceId: string, pageId: string }
- **출력**: Result<PageDTO>

**구현 수도코드**:
```typescript
'use server';

async function verifyPageAccessAction(
  orgId: string,
  workspaceId: string,
  pageId: string
): Promise<Result<PageDTO>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출 (순차 권한 검증)
  const result = await service.verifyPageAccess(
    new OrganizationId(orgId),
    new WorkspaceId(workspaceId),
    new PageId(pageId),
    user.id
  );
  
  // 3. DTO 직렬화
  if (result.isOk) {
    return Result.ok(toPageDTO(result.value.page));
  }
  return Result.err(result.error);
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: verifyPageAccessAction (12개 테스트)

---

#### createWorkspaceAction (Scenario 2)

- **역할**: 새 Workspace 생성
- **입력**: { orgId: string, name: string, description?: string, icon?: string }
- **출력**: Result<{ workspaceId: string; firstPageId: string }>

**구현 수도코드**:
```typescript
'use server';

async function createWorkspaceAction(
  orgId: string,
  name: string,
  description?: string,
  icon?: string
): Promise<Result<{ workspaceId: string; firstPageId: string }>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. 입력 검증
  if (!name || name.trim().length === 0) {
    return Result.err('INVALID_WORKSPACE_NAME');
  }
  
  // 3. Service 호출 (트랜잭션: Workspace + 초기 Page 생성)
  const result = await service.createWorkspace(
    new OrganizationId(orgId),
    name,
    description || null,
    icon || null,
    new UserId(user.id)
  );
  
  // 4. Result 반환
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: createWorkspaceAction (11개 테스트)

---

#### updateWorkspaceInfoAction (Scenario 2)

- **역할**: Workspace 정보 수정
- **입력**: { workspaceId: string, name?: string, description?: string, icon?: string }
- **출력**: Result<void>

**구현 수도코드**:
```typescript
'use server';

async function updateWorkspaceInfoAction(
  workspaceId: string,
  name?: string,
  description?: string | null,
  icon?: string | null
): Promise<Result<void>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출
  const result = await service.updateWorkspaceInfo(
    new WorkspaceId(workspaceId),
    name,
    description,
    icon,
    new UserId(user.id)
  );
  
  // 3. 캐시 무효화 (Next.js)
  if (result.isOk) {
    revalidatePath(`/r/${orgId}`);
  }
  
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: updateWorkspaceInfoAction (11개 테스트)

---

#### inviteWorkspaceMemberAction (Scenario 3)

- **역할**: Workspace 멤버 초대
- **입력**: { workspaceId: string, memberEmails: string[] }
- **출력**: Result<number>

**구현 수도코드**:
```typescript
'use server';

async function inviteWorkspaceMemberAction(
  workspaceId: string,
  memberEmails: string[]
): Promise<Result<number>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. 입력 검증
  if (!memberEmails || memberEmails.length === 0) {
    return Result.err('INVALID_INPUT');
  }
  
  // 3. Service 호출 (트랜잭션: 초대 + 알림 발송)
  const result = await service.inviteWorkspaceMember(
    new WorkspaceId(workspaceId),
    memberEmails,
    new UserId(user.id)
  );
  
  // 4. Result 반환 (초대한 멤버 수)
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: inviteWorkspaceMemberAction (13개 테스트)

---

#### searchOrganizationMembersAction (Scenario 3)

- **역할**: 조직 멤버 이메일 검색 (실시간)
- **입력**: { workspaceId: string, query: string }
- **출력**: Result<OrganizationMemberSearchResultDTO[]>

**구현 수도코드**:
```typescript
'use server';

async function searchOrganizationMembersAction(
  workspaceId: string,
  query: string
): Promise<Result<OrganizationMemberSearchResultDTO[]>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Workspace 조회 (Organization ID 확인용)
  const workspace = await workspaceRepo.findById(new WorkspaceId(workspaceId));
  if (!workspace) return Result.err('WORKSPACE_NOT_FOUND');
  
  // 3. Organization 멤버 검색 (효율적 JOIN 쿼리)
  const organizationMembers = await orgMemberRepo.searchOrganizationMembersByEmail(
    workspace.organizationId.value,
    query
  );
  
  // 4. 각 멤버에 대해 상태 플래그 설정
  const results: OrganizationMemberSearchResultDTO[] = [];
  for (const member of organizationMembers) {
    // 4-1. Workspace 멤버 여부 확인
    const isAlreadyMember = await workspaceMemberRepo.isMember(
      new WorkspaceId(workspaceId),
      member.userId
    );
    
    // 4-2. Pending 초대 여부 확인
    const hasPendingInvitation = await invitationRepo.findInvitation(
      new WorkspaceId(workspaceId),
      member.userId,
      'pending'
    ) !== null;
    
    results.push({
      ...member,
      isAlreadyMember,
      hasPendingInvitation
    });
  }
  
  // 5. Result 반환
  return Result.ok(results);
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: searchOrganizationMembersAction (8개 테스트)

---

#### getWorkspaceMembersAction (Scenario 3)

- **역할**: Workspace 멤버 및 초대 목록 조회
- **입력**: { workspaceId: string }
- **출력**: Result<WorkspaceMemberView>

**구현 수도코드**:
```typescript
'use server';

async function getWorkspaceMembersAction(
  workspaceId: string
): Promise<Result<WorkspaceMemberView>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Workspace 조회
  const workspace = await workspaceRepo.findById(new WorkspaceId(workspaceId));
  if (!workspace) return Result.err('WORKSPACE_NOT_FOUND');
  
  // 3. 멤버 목록 조회 (프로필 JOIN)
  const members = await workspaceMemberRepo.findByWorkspaceId(
    new WorkspaceId(workspaceId)
  );
  
  // 4. 대기 중인 초대 목록 조회 (프로필 JOIN)
  const pendingInvitations = await invitationRepo.findPendingByWorkspaceWithProfiles(
    new WorkspaceId(workspaceId)
  );
  
  // 5. DTO 변환
  const memberView: WorkspaceMemberView = {
    workspaceId,
    workspaceName: workspace.name,
    currentMembers: members.map(m => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      profileImageUrl: m.profileImageUrl,
      joinedAt: m.joinedAt.toISOString()
    })),
    pendingInvitations: pendingInvitations.map(inv => ({
      id: inv.id.value,
      invitedUserId: inv.invitedUserId,
      invitedUserName: inv.invitedUserName,
      invitedUserEmail: inv.invitedUserEmail,
      inviterName: inv.inviterName,
      createdAt: inv.createdAt.toISOString()
    }))
  };
  
  // 6. Result 반환
  return Result.ok(memberView);
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: getWorkspaceMembersAction (6개 테스트)

---

#### acceptWorkspaceInvitationAction (Scenario 3)

- **역할**: Workspace 초대 수락
- **입력**: { invitationId: string }
- **출력**: Result<void>

**구현 수도코드**:
```typescript
'use server';

async function acceptWorkspaceInvitationAction(
  invitationId: string
): Promise<Result<void>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출 (트랜잭션: 멤버 추가 + 알림 업데이트)
  const result = await service.acceptWorkspaceInvitation(
    invitationId,
    new UserId(user.id)
  );
  
  // 3. 캐시 무효화 (사이드바 Workspace 목록 갱신)
  if (result.isOk) {
    revalidatePath(`/r`); // 모든 조직 페이지 갱신
  }
  
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: acceptWorkspaceInvitationAction (8개 테스트)

---

#### rejectWorkspaceInvitationAction (Scenario 3)

- **역할**: Workspace 초대 거절
- **입력**: { invitationId: string }
- **출력**: Result<void>

**구현 수도코드**:
```typescript
'use server';

async function rejectWorkspaceInvitationAction(
  invitationId: string
): Promise<Result<void>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출 (알림 업데이트만)
  const result = await service.rejectWorkspaceInvitation(
    invitationId,
    new UserId(user.id)
  );
  
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: rejectWorkspaceInvitationAction (6개 테스트)

---

#### createPageAction (Scenario 4)

- **역할**: 새 Page 생성
- **입력**: { workspaceId: string, parentId?: string }
- **출력**: Result<string> (pageId)

**구현 수도코드**:
```typescript
'use server';

async function createPageAction(
  workspaceId: string,
  parentId?: string
): Promise<Result<string>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출
  const result = await service.createPage(
    new WorkspaceId(workspaceId),
    parentId ? new PageId(parentId) : null,
    new UserId(user.id)
  );
  
  // 3. 캐시 무효화 (사이드바 페이지 목록 갱신)
  if (result.isOk) {
    revalidatePath(`/r/[orgId]/workspace/${workspaceId}`);
  }
  
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: createPageAction (9개 테스트)

---

#### movePageAction (Scenario 4)

- **역할**: Page 이동
- **입력**: { pageId: string, newParentId?: string }
- **출력**: Result<void>

**구현 수도코드**:
```typescript
'use server';

async function movePageAction(
  pageId: string,
  newParentId?: string
): Promise<Result<void>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출 (순환 참조 체크 포함)
  const result = await service.movePage(
    new PageId(pageId),
    newParentId ? new PageId(newParentId) : null,
    new UserId(user.id)
  );
  
  // 3. 캐시 무효화 (사이드바 페이지 목록 갱신)
  if (result.isOk) {
    revalidatePath(`/r/[orgId]`);
  }
  
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: movePageAction (9개 테스트)

---

#### updatePageInfoAction (Scenario 4)

- **역할**: Page 제목/아이콘 수정
- **입력**: { pageId: string, title?: string, icon?: string }
- **출력**: Result<void>

**구현 수도코드**:
```typescript
'use server';

async function updatePageInfoAction(
  pageId: string,
  title?: string,
  icon?: string | null
): Promise<Result<void>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출
  const result = await service.updatePageInfo(
    new PageId(pageId),
    title,
    icon,
    new UserId(user.id)
  );
  
  // 3. 캐시 무효화 (사이드바 페이지 목록 갱신)
  if (result.isOk) {
    revalidatePath(`/r/[orgId]`);
  }
  
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: updatePageInfoAction (7개 테스트)

---

#### togglePageFavoriteAction (Scenario 5)

- **역할**: Page 즐겨찾기 토글
- **입력**: { pageId: string }
- **출력**: Result<boolean> (새 상태)

**구현 수도코드**:
```typescript
'use server';

async function togglePageFavoriteAction(
  pageId: string
): Promise<Result<boolean>> {
  // 1. 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. Service 호출
  const result = await service.togglePageFavorite(
    new PageId(pageId),
    new UserId(user.id)
  );
  
  // 3. 캐시 무효화 (사이드바 즐겨찾기 섹션 갱신)
  if (result.isOk) {
    revalidatePath(`/r/[orgId]`);
  }
  
  // 4. Result 반환 (true: 추가됨, false: 제거됨)
  return result;
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: togglePageFavoriteAction (7개 테스트)

---

## 🎨 UI & Hook 전략

### React Hooks 사용 (Scenario 1~5)

**사용할 Hook**:
- **Scenario 1**: `useTransition` (페이지 로딩 상태)
- **Scenario 2**: `useTransition` (Workspace 생성/수정 로딩)
- **Scenario 3**: `useTransition` (초대 발송/수락 로딩)
- **Scenario 4**: `useOptimistic` (페이지 생성/이동/수정 낙관적 업데이트), `useTransition`
- **Scenario 5**: `useOptimistic` (즐겨찾기 토글 낙관적 업데이트)

**낙관적 업데이트 패턴** (Scenario 4, 5):
```typescript
// Client Component
function PageTree({ initialPages }: { initialPages: PageDTO[] }) {
  const [optimisticPages, addOptimisticPage] = useOptimistic(
    initialPages,
    (state, newPage: PageDTO) => [...state, newPage]
  );
  
  async function handleCreatePage(parentId?: string) {
    // 1. 낙관적 업데이트 (즉시 UI 반영)
    const tempPage = { id: 'temp-' + Date.now(), title: 'Untitled', ... };
    addOptimisticPage(tempPage);
    
    // 2. Server Action 호출
    const result = await createPageAction(workspaceId, parentId);
    
    // 3. 실패 시 롤백 (revalidatePath로 자동 처리)
    if (result.isErr) {
      toast.error('페이지 생성에 실패했습니다');
      // Next.js가 자동으로 서버 데이터로 롤백
    }
  }
  
  return <PageTreeList pages={optimisticPages} onCreate={handleCreatePage} />;
}
```

**Server Component 패턴** (Scenario 1):
```typescript
// Server Component
export default async function OrganizationWorkspacePage({ 
  params 
}: { 
  params: { orgId: string } 
}) {
  // 1. 쿠키 읽기
  const cookiePageId = cookies().get(`recent-page-${params.orgId}`)?.value;
  
  // 2. Server Action 호출
  const result = await getOrganizationWorkspacePageViewAction(
    params.orgId, 
    cookiePageId
  );
  
  // 3. 에러 처리
  if (result.isErr) {
    if (result.error === 'NOT_ORG_MEMBER') {
      return <Forbidden message="조직 멤버가 아닙니다" />;
    }
    return <ErrorPage message="오류가 발생했습니다" />;
  }
  
  // 4. 렌더링
  return (
    <WorkspaceLayout>
      <WorkspaceSidebar data={result.value} />
      <PageViewer selectedPageId={result.value.selectedPageId} />
    </WorkspaceLayout>
  );
}
```

---

## ✅ 검증 체크리스트 (Scenario 0~5)

### 구현 수도코드 검증
- [x] Software Design의 Workspace/Page Aggregate가 Scenario 0~5로 확장되었는가?
- [x] 모든 DDD 컴포넌트에 구현 수도코드가 있는가?
- [x] Infrastructure Layer (4개 Repository, Read Model)가 정의되었는가?
- [x] Application Layer (Service, 9개 Server Actions)가 정의되었는가?
- [x] Commands & Events가 Scenario 0~5 전체를 포함하는가?
- [x] Error Types가 모든 에러 케이스를 포함하는가?

### 설계 일관성 검증
- [x] Testing Strategy (221개 테스트)와 매핑되는가?
- [x] Process Model의 Scenario 0~5와 연결되었는가?
- [x] Database Schema (4개 테이블)와 일치하는가?
- [x] 각 컴포넌트의 우선순위가 표시되었는가?
- [x] Notification Domain 통합이 정의되었는가? (Scenario 3)

---

## 🚀 다음 단계

이 Technical Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 (구현 + 테스트)
- **접근법**: Phase별 구현 (Value Objects → Entities → Aggregates → Repositories → Services → Server Actions → E2E)

---

**구현 전 체크리스트**:
- [ ] Testing Strategy (`04-testing-strategy.md`) 숙지 (221개 테스트)
- [ ] Software Design (`03-software-design.md`) 검토
- [ ] Database Schema (`06-db-schema.md`) 확인 (4개 테이블)
- [ ] User Flow (`03-user-flow.md`) 검토 (UI 패턴 이해)
- [ ] TDD 구현 순서 확인 (Phase 1~7)

---

## 📊 구현 범위 요약 (Scenario 0~5)

### 완료 예정 구현:
- ✅ **2개 Value Objects**: WorkspaceId, PageId
- ✅ **2개 Entities**: Workspace, Page
- ✅ **2개 Aggregates**: Workspace (35개 테스트), Page (35개 테스트)
- ✅ **1개 Read Model**: OrganizationWorkspacePageView
- ✅ **4개 Repositories**: Workspace, Page, WorkspaceMember, PageFavorite
- ✅ **1개 Service**: WorkspaceManagementService (9개 메서드)
- ✅ **9개 Server Actions**: Scenario별 2/2/3/3/1개
- ✅ **12개 E2E Tests**: 핵심 사용자 플로우

### 예상 구현 시간:
- Phase 1-2 (VO, Entity): 4-5시간
- Phase 3 (Aggregate): 10-12시간
- Phase 4 (Read Model): 3-4시간
- Phase 5 (Repository): 6-8시간
- Phase 6 (Server Actions): 10-12시간
- Phase 7 (E2E): 6-8시간
- **총**: 약 45-55시간

---

## 📋 문서 변경 이력

### v1.2 (2025-10-13)
- **Service 아키텍처 리팩토링**:
  - 단일 WorkspaceManagementService → 4개 Scenario별 Service로 분리
  - **WorkspaceNavigationService** (195줄, 4 deps, 2 메서드)
    - getOrganizationWorkspacePageView, verifyPageAccess
  - **WorkspaceCrudService** (170줄, 4 deps, 2 메서드)
    - createWorkspace (트랜잭션), updateWorkspaceInfo
  - **WorkspaceInvitationService** (281줄, 6 deps, 3 메서드)
    - inviteWorkspaceMembers (Notification 통합), acceptWorkspaceInvitation, rejectWorkspaceInvitation
  - **PageHierarchyService** (227줄, 2 deps, 3 메서드)
    - createPage, movePage (순환 참조 체크), updatePageInfo
- **개선 효과**:
  - SOLID 원칙 준수 (SRP, OCP)
  - 파일 크기 74% 감소 (837줄 → 평균 220줄)
  - 의존성 43% 감소 (7개 → 평균 4개)
  - 테스트 독립성 확보 (4개 파일, 병렬 실행)
  - Git Conflict 최소화 (Scenario별 독립 파일)
- Service 수도코드 업데이트 (4개 클래스로 분리)

### v1.1 (2025-10-12)
- Scenario 3 관련 상세 구현 추가:
  - **DTOs**: OrganizationMemberSearchResultDTO, WorkspaceMemberView 정의
  - **Repository 메서드**:
    - WorkspaceMemberRepository.findByWorkspaceId() (프로필 JOIN)
    - WorkspaceInvitationRepository.findPendingByWorkspaceWithProfiles() (프로필 JOIN)
    - WorkspaceInvitationRepository.findInvitation() (상태 필터링)
    - OrganizationMemberRepository.searchOrganizationMembersByEmail() (효율적 검색)
    - OrganizationRepository.getOrganizationName() (간단한 조회)
  - **Server Actions**: 
    - searchOrganizationMembersAction() (이메일 검색 + 상태 플래그)
    - getWorkspaceMembersAction() (멤버 목록 + 초대 목록)
  - **Service Layer**: inviteWorkspaceMember 메서드 상세 로직 (조직 이름 조회 포함)
  - **성능 최적화**: JOIN 쿼리로 N+1 문제 방지, ilike로 대소문자 무시 검색

### v1.0 (2025-10-11)
- 초안 작성
- Scenario 0~5 DDD 컴포넌트 수도코드 작성
- Value Objects, Entities, Aggregates 정의
- Repository, Service, Server Actions 수도코드
- UI & Hook 전략 정의

---

*이 Technical Specification을 따라 **Workspace Management Domain (Scenario 0~5)**을 구현할 수 있습니다!* 🚀

