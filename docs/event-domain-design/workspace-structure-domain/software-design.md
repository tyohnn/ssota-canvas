# Workspace Structure Domain - Software Design

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Workspace Structure Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Clerk**: External System으로 유지 (Aggregate로 전환하지 않음)
- **Anti-Corruption Layer**: 도메인과 Clerk 간의 변환 계층 구현

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Clerk Webhook Handler | **Organization Aggregate** | Clerk 동기화, Organization 상태 관리 |
| Workspace Manager | **Workspace Aggregate** | Workspace 생명주기, 메타데이터 관리 |
| Page Migration Manager | **PageHierarchy Aggregate** | Page 구조, 이동, 계층 관리 |
| Page Deletion Manager | **PageLifecycle Aggregate** | Page 생성, 삭제, 복구 관리 |

---

## 📦 Aggregate 상세 정의

### 1. Organization Aggregate

**핵심 개념**: "Clerk과 동기화되는 조직 컨테이너"

#### Commands (받는 명령)
- Sync Organization from Clerk
- Handle Organization Deletion
- Update Organization Members
- Set Organization Settings

#### Events (발생 이벤트)
- Organization Synced from Clerk
- Organization Members Updated
- Organization Deletion Warning Shown
- Sync Failed

#### 핵심 불변식 (Invariants)
- Organization은 반드시 Clerk Organization ID를 가져야 함
- 동기화 실패 시 3회까지 재시도해야 함
- Organization 삭제 시 데이터는 90일간 보존해야 함

#### 속성 (Properties)
```typescript
{
  id: OrganizationId,
  clerkOrgId: ClerkOrganizationId,
  name: string,
  members: Map<UserId, OrganizationRole>,
  settings: OrganizationSettings,
  syncStatus: SyncStatus,
  lastSyncAt: Date,
  deletedAt?: Date
}
```

---

### 2. Workspace Aggregate

**핵심 개념**: "독립적인 작업 공간 컨테이너"

#### Commands
- Create Workspace
- Update Workspace Metadata
- Add User to Workspace
- Remove User from Workspace
- Delete Workspace
- Restore Workspace

#### Events
- Workspace Created
- Workspace Metadata Updated
- User Added to Workspace
- User Removed from Workspace
- Workspace Deleted
- Workspace Restored

#### 핵심 불변식
- Workspace는 반드시 하나의 Organization에 속해야 함
- 삭제된 Workspace는 30일간 복구 가능해야 함
- Free 플랜에서는 Organization당 5개 Workspace 제한

#### 속성
```typescript
{
  id: WorkspaceId,
  organizationId: OrganizationId,
  name: string,
  description?: string,
  icon?: string,
  settings: WorkspaceSettings,
  members: Map<UserId, WorkspaceRole>,
  createdAt: Date,
  deletedAt?: Date
}
```

---

### 3. PageHierarchy Aggregate (핵심)

**핵심 개념**: "Page 구조와 계층 관계 관리"

#### Commands
- Create Page
- Move Page to Workspace
- Change Page Parent
- Reorder Pages

#### Events
- Page Created
- Page Moved to Different Workspace
- Page Parent Changed
- Page Order Changed

#### 핵심 불변식 (중요)
- 순환 참조 방지: Page는 자기 자신이나 하위 Page를 부모로 설정할 수 없음
- 계층 제한: 성능을 위해 50레벨 이상 중첩 방지
- 부모-자식 관계: 자식 Page는 부모와 같은 Workspace에 있어야 함
- 권한 상속: Page 이동 시 Workspace 권한 확인 필수

#### 속성
```typescript
{
  workspaceId: WorkspaceId,
  pages: Map<PageId, PageNode>,
  hierarchyDepth: Map<PageId, number>,
  maxDepth: number
}

interface PageNode {
  id: PageId,
  parentId?: PageId,
  children: Set<PageId>,
  order: number,
  title: string,
  icon?: string
}
```

---

### 4. PageLifecycle Aggregate

**핵심 개념**: "Page의 생성, 삭제, 복구 생명주기"

#### Commands
- Create Page
- Delete Page
- Restore Page
- Permanently Delete Page
- Empty Trash

#### Events
- Page Created
- Page Moved to Trash
- Page Restored from Trash
- Page Permanently Deleted
- Trash Emptied

#### 핵심 불변식
- 하위 Page가 있는 Page 삭제 시 모든 하위 Page도 함께 삭제
- 삭제된 Page는 30일간 복구 가능
- Page 복구 시 하위 Page들도 함께 복구
- 완전 삭제 시 모든 관련 데이터 제거

#### 속성
```typescript
{
  id: PageId,
  workspaceId: WorkspaceId,
  parentId?: PageId,
  title: string,
  icon?: string,
  order: number,
  createdAt: Date,
  deletedAt?: Date,
  scheduledDeletionAt?: Date,
  childPages: Set<PageId>
}
```

---

## 🔲 Bounded Context 정의

### Workspace Structure Context

**언어적 특징**:
- "Workspace" = 작업 공간, 프로젝트 컨테이너
- "Page" = 문서, 폴더 (폴더도 Page)
- "계층구조" = 중첩된 Page 관계
- "이동" = Workspace 간 Page 전환
- "참조" = Page 간 링크 관계

**핵심 책임**:
- 조직 구조 관리 (Organization ↔ Workspace)
- Page 계층 구조 관리
- Page 이동 및 참조 추적
- 생명주기 관리 (생성, 삭제, 복구)

**포함된 Aggregates**:
- Organization Aggregate (Clerk 동기화)
- Workspace Aggregate (작업 공간 관리)
- PageHierarchy Aggregate (구조 관리)
- PageLifecycle Aggregate (생명주기 관리)

**External System Integration**:
- **Clerk**: Anti-Corruption Layer를 통한 통합
  - OrganizationSyncAdapter 인터페이스로 추상화
  - WebhookTranslator로 이벤트 변환
  - 도메인 이벤트 ↔ Clerk Webhook 매핑

---

## 🔀 다른 Context와의 경계

### Visual Canvas Context와의 경계

**언어적 차이**:
| Workspace Structure Context | Visual Canvas Context |
|---------------------------|----------------------|
| "Page를 생성한다" | "Canvas를 열어서 블럭을 추가한다" |
| "Page를 이동한다" | "블럭을 배치한다" |
| "계층구조를 관리한다" | "시각적 레이아웃을 구성한다" |
| "Page 계층 탐색" | "Page Block으로 다른 페이지 임베드" |

**통합 이벤트**:
- `Page Created` → `Canvas Initialized`
- `Page Deleted` → `Canvas Cleanup Required`

### Collaboration Context와의 경계

**언어적 차이**:
| Workspace Structure Context | Collaboration Context |
|---------------------------|----------------------|
| "Workspace를 생성한다" | "사용자를 초대한다" |
| "Page를 공유한다" | "권한을 설정한다" |

**통합 이벤트**:
- `Workspace Created` → `Default Permissions Set`
- `Page Moved` → `Permissions Inherited`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│             Workspace Structure Context                 │
│                                                         │
│  ┌─────────────┐ ┌───────────┐ ┌──────────────┐       │
│  │Organization │ │ Workspace │ │ PageHierarchy│       │
│  │             │ │           │ │              │       │
│  └─────┬───────┘ └─────┬─────┘ └──────┬───────┘       │
│        │               │              │                │
│        └───────────────┼──────────────┘                │
│                        │                               │
│                        ▼                               │
│                 Domain Service                         │
│             (WorkspaceCoordinator)                     │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Events  
                         ▼
     ┌──────────────────────────────────────┐
     │        Integration Events             │
     ├──────────────────────────────────────┤
     │ • Page Created                        │
     │ • Page Moved                          │
     │ • Workspace Created                   │
     │ • Organization Synced                 │
     └──────────────────────────────────────┘
                    │         │
        ┌───────────┘         └───────────┐
        ▼                                 ▼
┌─────────────────┐             ┌──────────────────┐
│ Visual Canvas   │             │ Collaboration    │
│ Context         │             │ Context          │
└─────────────────┘             └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ Template         │  
            │ Context          │
            └──────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. Page 이동 시 권한 검증 (가장 중요)
- **문제**: Page 이동 시 양쪽 Workspace 권한 확인 복잡
- **해결**: PageHierarchy Aggregate에서 권한 검증 로직
- **구현**: 이동 전 권한 확인 → 사용자 확인 → 계층 구조 업데이트

### 2. 계층구조의 성능
- **문제**: 깊은 중첩 시 조회 성능 저하
- **해결**: hierarchyDepth 캐싱, 50레벨 제한
- **구현**: Materialized Path 패턴 고려

### 3. Clerk 동기화 신뢰성
- **문제**: Webhook 실패 시 데이터 불일치
- **해결**: 재시도 메커니즘 + 주기적 동기화
- **구현**: Organization Aggregate에서 SyncStatus 관리

### 4. 삭제 정책의 일관성
- **문제**: Page vs Workspace 삭제 정책 차이
- **해결**: 각각 다른 Aggregate에서 관리
- **구현**: PageLifecycle은 30일, Workspace는 Danger Zone

---

## 📖 Read Models (Query Side)

### WorkspaceStructureView
**목적**: Workspace의 전체 Page 계층구조를 효율적으로 조회

```typescript
interface WorkspaceStructureView {
  workspaceId: WorkspaceId
  name: string
  organization: {
    id: OrganizationId
    name: string
  }
  pageTree: PageTreeNode[]
  totalPages: number
  maxDepth: number
}

interface PageTreeNode {
  id: PageId
  title: string
  icon?: string
  order: number
  children: PageTreeNode[]
  depth: number
  hasBlocks: boolean
  lastModified: Date
}
```

**Query Handler 책임**:
- Workspace ID로 전체 계층구조 조회
- 트리 구조로 변환 (재귀적 구조)
- 각 Page의 메타데이터 포함
- 블럭 존재 여부 표시 (Visual Canvas 연동)

### PageNavigationView
**목적**: 페이지 네비게이션 및 브레드크럼 정보 제공

```typescript
interface PageNavigationView {
  pageId: PageId
  breadcrumb: Array<{
    pageId: PageId
    title: string
    icon?: string
  }>
  siblings: Array<{
    pageId: PageId
    title: string
    order: number
  }>
  workspace: {
    id: WorkspaceId
    name: string
  }
}
```

**최적화 포인트**:
- 계층 정보를 미리 계산하여 빠른 네비게이션 제공
- 자주 접근하는 브레드크럼 정보 캐싱
- 인덱싱: (workspace_id, parent_id) 복합 인덱스

---

## 🚀 구현 가이드라인

### Repository 패턴
```typescript
interface WorkspaceRepository {
  save(workspace: Workspace): Promise<void>
  findById(id: WorkspaceId): Promise<Workspace>
  findByOrganization(orgId: OrganizationId): Promise<Workspace[]>
  findDeleted(): Promise<Workspace[]>
}

interface PageHierarchyRepository {
  save(hierarchy: PageHierarchy): Promise<void>
  findByWorkspace(workspaceId: WorkspaceId): Promise<PageHierarchy>
  findByPage(pageId: PageId): Promise<PageHierarchy>
}
```

### Domain Service 예시
```typescript
class WorkspaceCoordinator {
  constructor(
    private workspaceRepo: WorkspaceRepository,
    private hierarchyRepo: PageHierarchyRepository,
    private clerkAdapter: ClerkSyncAdapter
  ) {}

  async createWorkspace(command: CreateWorkspaceCommand): Promise<DomainEvent[]> {
    // 1. Organization 권한 확인
    const org = await this.clerkAdapter.getOrganization(command.organizationId)
    if (!org.canCreateWorkspace(command.userId)) {
      throw new InsufficientPermissionError()
    }

    // 2. Workspace 생성
    const workspace = Workspace.create(command)
    
    // 3. 기본 Page 계층구조 초기화
    const hierarchy = PageHierarchy.initialize(workspace.id)
    const welcomePage = hierarchy.createRootPage("Welcome", command.userId)
    
    // 4. 저장
    await this.workspaceRepo.save(workspace)
    await this.hierarchyRepo.save(hierarchy)
    
    // 5. Domain Events 반환 (Server Action에서 처리)
    return [
      new WorkspaceCreated(workspace.id, command.organizationId),
      new PageCreated(welcomePage.id, workspace.id)
    ]
  }

  async movePageToWorkspace(command: MovePageCommand): Promise<DomainEvent[]> {
    // 1. 권한 확인
    const hasSourcePermission = await this.checkWorkspacePermission(
      command.sourceWorkspaceId, command.userId, 'EDITOR'
    )
    const hasTargetPermission = await this.checkWorkspacePermission(
      command.targetWorkspaceId, command.userId, 'EDITOR'
    )
    
    if (!hasSourcePermission || !hasTargetPermission) {
      throw new InsufficientPermissionError()
    }
    
    // 2. Page 이동 실행
    const sourceHierarchy = await this.hierarchyRepo.findByPage(command.pageId)
    const targetHierarchy = await this.hierarchyRepo.findByWorkspace(command.targetWorkspaceId)
    
    const movedPage = sourceHierarchy.movePage(command.pageId, targetHierarchy)
    
    // 3. 계층 구조 저장
    await this.hierarchyRepo.save(sourceHierarchy)
    await this.hierarchyRepo.save(targetHierarchy)
    
    // 4. Domain Events 반환 (Server Action에서 처리)
    return [
      new PageMovedToWorkspace(command.pageId, command.targetWorkspaceId)
    ]
  }
}
```

### Clerk Anti-Corruption Layer 예시
```typescript
interface ClerkSyncAdapter {
  getOrganization(clerkOrgId: string): Promise<ClerkOrganization>
  handleWebhook(webhook: ClerkWebhook): Promise<DomainEvent[]>
}

class ClerkWebhookTranslator {
  translate(webhook: ClerkWebhook): DomainEvent[] {
    switch (webhook.type) {
      case 'organization.created':
        return [new OrganizationSyncRequested(
          webhook.data.id,
          webhook.data.name,
          webhook.data.members
        )]
      
      case 'organization.updated':
        return [new OrganizationUpdateRequested(
          webhook.data.id,
          webhook.data.name,
          webhook.data.members
        )]
      
      case 'organization.deleted':
        return [new OrganizationDeletionDetected(webhook.data.id)]
      
      default:
        return []
    }
  }
}
```

---

## 🛡️ Anti-Corruption Layer Design

### ClerkSyncAdapter Interface
Clerk과의 통합을 추상화하는 인터페이스:

```typescript
interface ClerkSyncAdapter {
  // Organization 동기화
  syncOrganization(clerkOrgId: string): Promise<OrganizationData>
  getOrganizationMembers(clerkOrgId: string): Promise<Member[]>
  
  // Webhook 처리
  processWebhook(webhook: ClerkWebhookPayload): Promise<SyncResult>
  
  // 재시도 메커니즘
  scheduleRetry(failedSync: FailedSync): Promise<void>
}
```

### Translation Layer
Clerk 데이터와 도메인 모델 간 변환:

```typescript
interface ClerkToDomainTranslator {
  translateOrganization(clerkOrg: ClerkOrganization): OrganizationData
  translateMember(clerkMember: ClerkMember): Member
}

interface DomainToClerkTranslator {
  translateWorkspaceInvite(invite: WorkspaceInvite): ClerkInviteRequest
}
```

### Benefits
1. **도메인 순수성**: Clerk API가 도메인에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: Clerk → 다른 Auth 시스템 전환 용이
4. **장애 격리**: Clerk 장애 시 도메인 로직 보호

---

## ✅ 검증 체크리스트

- [ ] 각 Aggregate가 명확한 경계와 책임을 가지는가?
- [ ] Page 이동 시 권한 검증이 적절히 수행되는가?
- [ ] Clerk 동기화 실패 시 복구 메커니즘이 있는가?
- [ ] 계층구조 성능 이슈가 해결되었는가?
- [ ] Context 간 통합이 느슨하게 결합되어 있는가?
- [ ] 삭제 정책이 비즈니스 요구사항을 만족하는가?

---

## 📊 성과 측정 지표

1. **권한 검증 정확성**: Page 이동 시 권한 오류 0개 목표
2. **동기화 성공률**: Clerk Webhook 처리 99.9% 성공률
3. **계층구조 성능**: 1000개 Page 트리 로딩 < 500ms
4. **복구 성공률**: 삭제된 Page/Workspace 복구 100% 성공
