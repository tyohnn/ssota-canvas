# Technical Specification: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2025-10-11  
**버전**: v1.0

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

- **Testing Strategy**: `04-testing-strategy.md` - 117개 테스트 케이스 정의
- **Software Design**: `03-software-design.md` - 2개 Aggregate (Workspace, Page)
- **Database Schema**: `06-db-schema.md` - 테이블 스키마 및 RLS 정책

### 구현 우선순위 요약

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️) - 2개 (WorkspaceId, PageId)
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 2개 (Workspace, Page - depth 계산 로직 포함)
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 2개 (Workspace, Page)
Phase 4: Read Model Service (⭐️⭐️⭐️⭐️⭐️) - 1개 (OrganizationWorkspacePageView)
Phase 5: Repositories (⭐️⭐️⭐️⭐️) - 3개 (Workspace, Page - 재귀 CTE 핵심, WorkspaceMember)
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 2개 (getOrganizationWorkspacePageView, verifyPageAccess)
Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️) - 5개 시나리오
```

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
  - Workspace 생성 (Default/일반)
  - Workspace 멤버십 검증
  - Workspace 목록 조회
  - 도메인 이벤트 발생 및 관리
- **주요 메서드**:
  - createDefault(orgId, createdBy): Default Workspace 생성 및 WorkspaceCreated 발행
  - create(orgId, name, description, icon, createdBy): 일반 Workspace 생성
  - verifyMembership(workspaceId, userId, isOrgMember): Workspace 멤버십 검증
  - getUncommittedEvents(): 발행된 이벤트 목록 반환
- **불변식(Invariants)**:
  - Workspace는 반드시 하나의 Organization에 속함
  - Default Workspace는 삭제 불가 (deletable=false)
  - 조직 멤버는 Default Workspace 자동 접근

**구현 수도코드**:
```typescript
class WorkspaceAggregate {
  private _workspace: Workspace;
  private _events: DomainEvent[] = [];
  
  static createDefault(
    organizationId: OrganizationId,
    createdBy: UserId
  ): WorkspaceAggregate {
    // 1. WorkspaceId 생성 (UUID)
    // 2. Workspace Entity 생성 (isDefault=true, deletable=false)
    // 3. WorkspaceCreated 이벤트 생성 및 추가
    // 4. WorkspaceAggregate 반환
  }
  
  static create(
    organizationId: OrganizationId,
    name: string,
    description: string | null,
    icon: string | null,
    createdBy: UserId
  ): WorkspaceAggregate {
    // 1. WorkspaceId 생성
    // 2. 이름 검증 (1-100자)
    // 3. Workspace Entity 생성 (isDefault=false, deletable=true)
    // 4. WorkspaceCreated 이벤트 생성 및 추가
    // 5. WorkspaceAggregate 반환
  }
  
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
**Testing Strategy 참조**: 섹션 3 - Aggregates 테스트  
**Process Model 매핑**: Scenario 0, Scenario 1 - Sequence 2

---

#### Page Aggregate

- **파일 위치**: `src/domains/workspace-management/backend/aggregates/page.aggregate.ts`
- **역할**: Page 관련 도메인 로직과 계층 구조를 담당하는 Aggregate Root
- **주요 기능**:
  - Page 생성 (depth 자동 계산)
  - Page 트리 조회 (재귀 CTE)
  - Page 이동 (순환 참조 방지)
  - 도메인 이벤트 발생 및 관리
- **주요 메서드**:
  - create(workspaceId, parentId, title, icon, createdBy, parentPage): Page 생성 및 depth 계산
  - move(pageId, newParentId, newParentPage, ancestors): Page 이동 및 순환 참조 체크
  - verifyAccess(pageId, userId, isWorkspaceMember): Page 접근 권한 검증
- **불변식(Invariants)**:
  - Page는 반드시 하나의 Workspace에 속함
  - 순환 참조 불가
  - depth는 0 이상

**구현 수도코드**:
```typescript
class PageAggregate {
  private _page: Page;
  private _events: DomainEvent[] = [];
  
  static async create(
    workspaceId: WorkspaceId,
    parentId: PageId | null,
    title: string,
    icon: string | null,
    createdBy: UserId,
    parentPage: Page | null  // parent를 미리 조회해서 전달
  ): Promise<PageAggregate> {
    // 1. PageId 생성 (UUID)
    // 2. depth 계산
    //    - parentId === null → depth = 0
    //    - parentId !== null → depth = parentPage.depth + 1
    // 3. parentId가 있는데 parentPage가 null이면 → Error
    // 4. order 계산 (같은 레벨 내 마지막 + 1)
    // 5. Page Entity 생성
    // 6. PageCreated 이벤트 생성 및 추가
    // 7. PageAggregate 반환
  }
  
  async move(
    pageId: PageId,
    newParentId: PageId | null,
    newParentPage: Page | null,
    ancestors: Page[]  // newParentId의 모든 조상 (재귀 CTE로 조회)
  ): Promise<void> {
    // 1. **순환 참조 체크**: ancestors 중에 pageId가 있는지 확인
    //    - 있으면 → CircularReferenceError 발생
    // 2. 새 depth 계산
    //    - newParentId === null → newDepth = 0
    //    - newParentId !== null → newDepth = newParentPage.depth + 1
    // 3. Page Entity의 moveToParent() 호출
    // 4. PageMoved 이벤트 생성 및 추가
    // 5. **하위 페이지 depth 업데이트 이벤트** 발행 (Repository에서 처리)
  }
  
  verifyAccess(pageId: PageId, userId: UserId, isWorkspaceMember: boolean): boolean {
    // 1. isWorkspaceMember === true이면 → return true
    // 2. isWorkspaceMember === false이면 → return false
    // 3. PageAccessVerified 또는 PageAccessDenied 이벤트 발행
  }
  
  getUncommittedEvents(): DomainEvent[] {
    return this._events;
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 3 - Aggregates 테스트  
**Process Model 매핑**: Scenario 1 - Sequence 1, Scenario 4 (Page 이동)

---

### 4. Commands & Events 수도코드

#### Commands

- **파일 위치**: `src/domains/workspace-management/shared/commands/index.ts`

```typescript
// Workspace Commands
interface CreateDefaultWorkspaceCommand {
  organizationId: string;
  createdBy: string;
}

interface CreateWorkspaceCommand {
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string;
}

// Page Commands
interface CreatePageCommand {
  workspaceId: string;
  parentId?: string;
  title: string;
  icon?: string;
  createdBy: string;
}

interface MovePageCommand {
  pageId: string;
  newParentId?: string;
}
```

---

#### Events

- **파일 위치**: `src/domains/workspace-management/shared/events/index.ts`

```typescript
// Workspace Events
interface WorkspaceCreatedEvent {
  type: 'WorkspaceCreated';
  workspaceId: string;
  organizationId: string;
  isDefault: boolean;
  occurredAt: Date;
}

interface WorkspaceListLoadedEvent {
  type: 'WorkspaceListLoaded';
  organizationId: string;
  workspaceCount: number;
  occurredAt: Date;
}

// Page Events
interface PageCreatedEvent {
  type: 'PageCreated';
  pageId: string;
  workspaceId: string;
  parentId?: string;
  depth: number;
  occurredAt: Date;
}

interface PageMovedEvent {
  type: 'PageMoved';
  pageId: string;
  oldParentId?: string;
  newParentId?: string;
  newDepth: number;
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
  | 'WORKSPACE_NOT_FOUND'
  | 'PAGE_NOT_FOUND'
  | 'INVALID_WORKSPACE_NAME'
  | 'DEFAULT_WORKSPACE_NOT_DELETABLE'
  | 'CIRCULAR_REFERENCE_DETECTED'
  | 'NOT_ORG_MEMBER'
  | 'NOT_WORKSPACE_MEMBER'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATABASE_CONNECTION_FAILED';

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<WorkspaceManagementErrorCode, string> = {
  WORKSPACE_NOT_FOUND: 'Workspace를 찾을 수 없습니다',
  PAGE_NOT_FOUND: '페이지를 찾을 수 없습니다',
  INVALID_WORKSPACE_NAME: 'Workspace 이름이 유효하지 않습니다',
  DEFAULT_WORKSPACE_NOT_DELETABLE: '기본 워크스페이스는 삭제할 수 없습니다',
  CIRCULAR_REFERENCE_DETECTED: '순환 참조가 발생합니다',
  NOT_ORG_MEMBER: '조직 멤버가 아닙니다',
  NOT_WORKSPACE_MEMBER: 'Workspace에 초대되지 않았습니다',
  UNAUTHORIZED_ACCESS: '접근 권한이 없습니다',
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다'
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
- **역할**: Workspace 멤버십 데이터 영속성
- **주요 메서드**:
  - isMember(workspaceId: WorkspaceId, userId: UserId): Promise<boolean>
  - addMember(workspaceId: WorkspaceId, userId: UserId, role: string): Promise<void>
  - removeMember(workspaceId: WorkspaceId, userId: UserId): Promise<void>
- **DB 연동**: Drizzle ORM
- **RLS 정책**: Self only (Application-level에서 adminDb 사용)

**구현 수도코드**:
```typescript
class DrizzleWorkspaceMemberRepository {
  async isMember(workspaceId: WorkspaceId, userId: UserId): Promise<boolean> {
    // 1. db.select().from(workspaceMembers)
    //    .where(and(
    //      eq(workspaceMembers.workspaceId, workspaceId.toString()),
    //      eq(workspaceMembers.userId, userId.toString())
    //    ))
    // 2. return result.length > 0
  }
  
  async addMember(workspaceId: WorkspaceId, userId: UserId, role: string): Promise<void> {
    // 1. adminDb.insert(workspaceMembers).values({...})
    //    (Service에서 권한 체크 후 호출)
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

## 🚀 Application Layer

> **가이드 참조**: Phase 2.3, 2.4 - Service 및 Server Actions 수도코드

### 1. Service 수도코드

#### WorkspaceManagementService

- **파일 위치**: `src/domains/workspace-management/backend/services/workspace-management.service.ts`
- **역할**: Workspace 및 Page Aggregate를 조율하고, Organization Domain과 통합
- **주요 의존성**:
  - WorkspaceRepository
  - PageRepository
  - WorkspaceMemberRepository
  - OrganizationMemberRepository (Organization Domain)
- **주요 메서드**:
  - getOrganizationWorkspacePageView(orgId, userId, cookiePageId): OrganizationWorkspacePageView 조회
  - verifyPageAccess(orgId, workspaceId, pageId, userId): Page 접근 권한 검증
- **트랜잭션**: 필요 시 사용

**구현 수도코드**:
```typescript
class WorkspaceManagementService {
  constructor(
    private workspaceRepo: IWorkspaceRepository,
    private pageRepo: IPageRepository,
    private workspaceMemberRepo: IWorkspaceMemberRepository,
    private orgMemberRepo: IOrganizationMemberRepository  // Organization Domain
  ) {}
  
  async getOrganizationWorkspacePageView(
    orgId: OrganizationId,
    userId: UserId,
    cookiePageId?: string
  ): Promise<Result<OrganizationWorkspacePageView>> {
    // 1. 조직 멤버십 확인
    const isOrgMember = await this.orgMemberRepo.isMember(orgId, userId);
    if (!isOrgMember) {
      return Result.err('NOT_ORG_MEMBER');
    }
    
    // 2. Workspace 목록 조회
    const workspaces = await this.workspaceRepo.findByOrganizationId(orgId);
    
    // 3. 각 Workspace의 Page 트리 조회
    const workspacesWithPages = await Promise.all(
      workspaces.map(async (ws) => ({
        ...ws,
        pageTree: await this.pageRepo.findTreeByWorkspaceId(ws.workspaceId)
      }))
    );
    
    // 4. 쿠키 검증 및 Fallback
    let selectedPageId = cookiePageId;
    if (cookiePageId) {
      const cookiePage = await this.pageRepo.findById(new PageId(cookiePageId));
      if (!cookiePage || cookiePage.workspaceId.toString() !== orgId.toString()) {
        selectedPageId = this.findDefaultFirstPage(workspacesWithPages);
      }
    } else {
      selectedPageId = this.findDefaultFirstPage(workspacesWithPages);
    }
    
    // 5. OrganizationWorkspacePageView 반환
    return Result.ok({
      organizationId: orgId.toString(),
      workspaces: workspacesWithPages,
      selectedPageId
    });
  }
  
  async verifyPageAccess(
    orgId: OrganizationId,
    workspaceId: WorkspaceId,
    pageId: PageId,
    userId: UserId
  ): Promise<Result<Page>> {
    // 1. 조직 멤버십 확인 (Fail-fast)
    const isOrgMember = await this.orgMemberRepo.isMember(orgId, userId);
    if (!isOrgMember) {
      return Result.err('NOT_ORG_MEMBER');
    }
    
    // 2. Workspace 조회
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return Result.err('WORKSPACE_NOT_FOUND');
    }
    
    // 3. Workspace 멤버십 확인
    if (workspace.isDefault) {
      // Default Workspace는 조직 멤버 자동 접근
    } else {
      const isWorkspaceMember = await this.workspaceMemberRepo.isMember(workspaceId, userId);
      if (!isWorkspaceMember) {
        return Result.err('NOT_WORKSPACE_MEMBER');
      }
    }
    
    // 4. Page 조회
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return Result.err('PAGE_NOT_FOUND');
    }
    
    // 5. Page가 해당 Workspace에 속하는지 확인
    if (page.workspaceId.toString() !== workspaceId.toString()) {
      return Result.err('BAD_REQUEST');
    }
    
    // 6. Result.ok(page) 반환
    return Result.ok(page);
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 4 - Service 통합 테스트

---

### 2. Server Actions 수도코드

#### getOrganizationWorkspacePageViewAction

- **파일 위치**: `src/domains/workspace-management/actions/workspace-management.actions.ts`
- **역할**: 조직 Workspace-Page 목록을 조회하는 Server Action
- **입력**: { orgId: string, cookiePageId?: string }
- **출력**: Result<OrganizationWorkspacePageViewDTO>
- **인증**: Supabase Auth 기반 사용자 인증 필수

**구현 수도코드**:
```typescript
'use server';

async function getOrganizationWorkspacePageViewAction(
  orgId: string,
  cookiePageId?: string
): Promise<Result<OrganizationWorkspacePageViewDTO>> {
  // 1. Supabase Auth 인증 확인
  const user = await getAuthUser();
  if (!user) {
    return Result.err('UNAUTHORIZED');
  }
  
  // 2. 의존성 주입
  const service = new WorkspaceManagementService(
    workspaceRepo,
    pageRepo,
    workspaceMemberRepo,
    orgMemberRepo
  );
  
  // 3. Command 생성
  const command = {
    organizationId: new OrganizationId(orgId),
    userId: new UserId(user.id),
    cookiePageId
  };
  
  // 4. Service 호출
  const result = await service.getOrganizationWorkspacePageView(
    command.organizationId,
    command.userId,
    command.cookiePageId
  );
  
  // 5. 도메인 모델 → DTO 직렬화
  if (result.isOk) {
    return Result.ok(toDTO(result.value));
  } else {
    return Result.err(result.error);
  }
}

// DTO 변환
function toDTO(view: OrganizationWorkspacePageView): OrganizationWorkspacePageViewDTO {
  // Value Object → string 변환
  // Date → ISO string 변환
  return {
    organizationId: view.organizationId,
    workspaces: view.workspaces.map(ws => ({
      workspaceId: ws.workspaceId.toString(),
      name: ws.name,
      icon: ws.icon,
      isDefault: ws.isDefault,
      pageTree: ws.pageTree.map(p => ({
        id: p.pageId.toString(),
        title: p.title,
        icon: p.icon,
        depth: p.depth,
        children: [] // 재귀 변환
      }))
    })),
    selectedPageId: view.selectedPageId
  };
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 4.2 - Server Actions 통합 테스트

---

#### verifyPageAccessAction

- **파일 위치**: `src/domains/workspace-management/actions/workspace-management.actions.ts`
- **역할**: 페이지 접근 권한을 검증하는 Server Action
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
  if (!user) {
    return Result.err('UNAUTHORIZED');
  }
  
  // 2. Service 호출
  const result = await service.verifyPageAccess(
    new OrganizationId(orgId),
    new WorkspaceId(workspaceId),
    new PageId(pageId),
    new UserId(user.id)
  );
  
  // 3. DTO 직렬화
  if (result.isOk) {
    return Result.ok({
      id: result.value.pageId.toString(),
      workspaceId: result.value.workspaceId.toString(),
      title: result.value.title,
      icon: result.value.icon,
      depth: result.value.depth,
      parentId: result.value.parentId?.toString(),
      createdAt: result.value.createdAt.toISOString(),
      updatedAt: result.value.updatedAt.toISOString()
    });
  } else {
    return Result.err(result.error);
  }
}
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Testing Strategy 참조**: 섹션 4.2 - verifyPageAccessAction

---

## 🎨 UI & Hook 전략

### React Hooks 사용

**사용할 Hook** (Scenario 1):
- `useOptimistic`: 페이지 생성 시 낙관적 업데이트
- `useTransition`: Server Action 호출 시 로딩 상태
- (쿠키는 직접 관리, Hook 불필요)

**Server Action 연결**:
```typescript
// Server Component에서 호출
export default async function OrganizationWorkspacePage({ params }: { params: { orgId: string } }) {
  // 1. 쿠키에서 페이지 ID 읽기
  const cookiePageId = cookies().get('recent_page_id')?.value;
  
  // 2. Server Action 호출
  const result = await getOrganizationWorkspacePageViewAction(params.orgId, cookiePageId);
  
  // 3. 결과 처리
  if (result.isErr) {
    return <AccessDenied message={result.error} />;
  }
  
  // 4. 렌더링
  return <WorkspaceSidebar data={result.value} />;
}
```

---

## ✅ 검증 체크리스트 (Scenario 1)

### 구현 수도코드 검증
- [x] Software Design의 Workspace/Page Aggregate가 수도코드로 작성되었는가?
- [x] 모든 DDD 컴포넌트에 구현 수도코드가 있는가?
- [x] Infrastructure Layer (Repository, Read Model)가 정의되었는가?
- [x] Application Layer (Service, Server Actions)가 정의되었는가?

### 설계 일관성 검증
- [x] Testing Strategy와 매핑되는 컴포넌트들이 명시되었는가?
- [x] Process Model의 시나리오와 연결되었는가?
- [x] Database Schema와 일치하는가?
- [x] 각 컴포넌트의 우선순위가 표시되었는가?

---

## 🚀 다음 단계

이 Technical Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 (구현 + 테스트)
- **접근법**: Phase별 구현 (Value Objects → Entities → Aggregates → Repositories → Services → Server Actions → E2E)

---

**구현 전 체크리스트**:
- [ ] Testing Strategy (`04-testing-strategy.md`) 숙지
- [ ] Software Design (`03-software-design.md`) 검토
- [ ] Database Schema (`06-db-schema.md`) 확인
- [ ] 구현 우선순위 및 우선순위 확인

---

*이 Technical Specification을 따라 **Workspace Management Domain (Scenario 1)**을 구현할 수 있습니다!* 🚀

