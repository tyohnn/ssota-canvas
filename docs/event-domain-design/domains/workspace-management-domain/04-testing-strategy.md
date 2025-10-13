# Testing Strategy: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 시니어개발자 + QA  
**작성일**: 2025-10-11  
**최종 수정**: 2025-10-13  
**버전**: v1.2

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `05-technical-specification.md`

---

> **가이드 참조**: `docs/event-domain-design/guide/04-testing-strategy-guide.md`  
> **작성 시점**: Software Design 완료 후, Technical Specification 작성 전  
> **목적**: 구현하기 전에 "무엇을 어떻게 테스트할지" 명확히 정의

---

## 📊 Testing Strategy Overview

### 도메인 테스트 전략 요약

Workspace Management Domain은 **조직 내 작업 공간과 페이지 구조 관리**를 담당하는 핵심 도메인입니다. 테스트 전략은 **Workspace 접근 권한 제어**와 **Page 계층 구조 무결성**에 집중합니다.

### Process Model 연결점

- **입력**: `02-process-model.md` - 8개 시나리오 (Scenario 0~5, 7~8 완료, Scenario 6은 Post-MVP)
- **입력**: `03-software-design.md` - 2개 Aggregate (Workspace, Page)
- **출력**: Unit/Integration/E2E 테스트 케이스 (Scenario 0~5 완료)

### 커버리지 목표 요약 (Scenario 0~5)

```
전체 코드 커버리지: 85% 이상
- Unit Tests:       65%  (130개 예상)
- Integration Tests: 25%  (80개 예상)
- E2E Tests:        10%  (12개 예상)
```

---

## 🗺️ Process Model → Test 매핑

> **가이드 참조**: Phase 2.2 - Process Model → Test 매핑

### Scenario 0: Organization 생성 시 Default Workspace 자동 생성

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: Default Workspace 생성 | Unit | Workspace Aggregate.createDefault() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Workspace System | Unit | Default Workspace 생성 로직, is_default=true 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| System: Page System | Unit | 초기 "Welcome" 페이지 생성 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: Default Workspace Created | Unit | WorkspaceCreated 이벤트 발행 검증 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | Integration | Organization Service → Workspace Service 통합 | ⭐️⭐️⭐️⭐️⭐️ |
| 트랜잭션 | Integration | Organization + Workspace + Page 생성 트랜잭션 검증 | ⭐️⭐️⭐️⭐️⭐️ |

---

### Scenario 1: 사용자가 조직에 접근하여 Workspace-Page 목록 조회 및 페이지 선택

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: LoadOrganizationWorkspacePageView | Unit | OrganizationWorkspacePageView 생성 및 데이터 조합 | ⭐️⭐️⭐️⭐️⭐️ |
| System: Workspace System | Unit | Workspace 목록 조회 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| System: Page System | Unit | Page 트리 조회 로직 (Materialized Path) | ⭐️⭐️⭐️⭐️⭐️ |
| Policy: 조직 멤버십 확인 | Unit | Organization Domain API 호출 및 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| Policy: Workspace 멤버십 확인 | Unit | Default vs 일반 Workspace 권한 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| Policy: 쿠키 검증 및 Fallback | Unit | 쿠키 유효성 검증 및 Default 페이지 Fallback | ⭐️⭐️⭐️⭐️ |
| Event: OrganizationWorkspacePageViewLoaded | Unit | Read Model 반환 검증 | ⭐️⭐️⭐️⭐️ |
| Event: PageAccessDenied | Unit | 권한 없음 처리 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 1) | Integration | Server Action - getOrganizationWorkspacePageViewAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 2) | Integration | Server Action - verifyPageAccessAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Happy Path) | E2E | 조직 링크 접근 → 사이드바 → 페이지 열기 | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Error Path) | E2E | 초대되지 않은 Workspace 페이지 접근 → 권한 없음 | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Edge Case) | E2E | 쿠키 Fallback → Default 첫 페이지 | ⭐️⭐️⭐️⭐️ |

---

### Scenario 2: 조직 소유자가 새 Workspace 생성 및 수정

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: CreateWorkspace | Unit | Workspace Aggregate.create() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: UpdateWorkspaceInfo | Unit | Workspace Aggregate.updateInfo() | ⭐️⭐️⭐️⭐️ |
| System: Workspace System | Unit | Workspace 생성 및 정보 수정 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| System: Page System | Unit | 초기 "Untitled" 페이지 생성 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: WorkspaceCreated | Unit | WorkspaceCreated 이벤트 발행 검증 | ⭐️⭐️⭐️⭐️ |
| Event: WorkspaceNameChanged | Unit | WorkspaceNameChanged 이벤트 발행 검증 | ⭐️⭐️⭐️ |
| Event: WorkspaceDescriptionChanged | Unit | WorkspaceDescriptionChanged 이벤트 발행 검증 | ⭐️⭐️⭐️ |
| Event: WorkspaceIconChanged | Unit | WorkspaceIconChanged 이벤트 발행 검증 | ⭐️⭐️⭐️ |
| 전체 플로우 (Seq 1) | Integration | createWorkspaceAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 2) | Integration | updateWorkspaceInfoAction() | ⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Happy Path) | E2E | Workspace 생성 → 첫 페이지 이동 | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Error Path) | E2E | 조직 소유자 아님 → 생성 버튼 숨김 | ⭐️⭐️⭐️⭐️ |

---

### Scenario 3: Admin이 Workspace에 멤버 초대 및 수락/거절

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: InviteWorkspaceMember | Unit | Workspace Aggregate.inviteMember() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: AcceptWorkspaceInvitation | Unit | Workspace Aggregate.acceptInvitation() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: RejectWorkspaceInvitation | Unit | Workspace Aggregate.rejectInvitation() | ⭐️⭐️⭐️⭐️ |
| System: Workspace System | Unit | 멤버 초대 및 권한 검증 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| System: Organization Domain | Integration | 조직 멤버 검색 (효율적 쿼리) | ⭐️⭐️⭐️⭐️⭐️ |
| System: Notification Domain | Integration | 알림 발송 및 업데이트 통합 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: WorkspaceMemberInvitationCreated | Unit | WorkspaceMemberInvitationCreated 이벤트 발행 | ⭐️⭐️⭐️⭐️ |
| Event: InvitationNotificationSent | Integration | Notification Domain 통합 검증 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: WorkspaceInvitationAccepted | Unit | WorkspaceInvitationAccepted 이벤트 발행 | ⭐️⭐️⭐️⭐️ |
| Event: MemberAddedToWorkspace | Unit | MemberAddedToWorkspace 이벤트 발행 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 1 - 검색) | Integration | searchOrganizationMembersAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 1 - 초대) | Integration | inviteWorkspaceMemberAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 2 - 수락) | Integration | acceptWorkspaceInvitationAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 2 - 거절) | Integration | rejectWorkspaceInvitationAction() | ⭐️⭐️⭐️⭐️ |
| Repository 검증 (멤버 목록) | Integration | getWorkspaceMembersAction() | ⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Happy Path) | E2E | 멤버 검색 → 선택 → 초대 → 알림 → 수락 | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Error Path) | E2E | 이미 멤버/초대 중 → 선택 불가 표시 | ⭐️⭐️⭐️⭐️ |

---

### Scenario 4: 멤버가 Page 생성 및 계층 구조 관리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: CreatePage | Unit | Page Aggregate.create() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: MovePage | Unit | Page Aggregate.move() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: UpdatePageInfo | Unit | Page Aggregate.updateInfo() | ⭐️⭐️⭐️⭐️ |
| System: Page System | Unit | 페이지 생성/이동/수정 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Policy: 순환 참조 감지 | Unit | 순환 참조 검증 로직 | ⭐️⭐️⭐️⭐️⭐️ |
| Event: NewPageCreated | Unit | NewPageCreated 이벤트 발행 | ⭐️⭐️⭐️⭐️ |
| Event: PageMovedToChild | Unit | PageMovedToChild 이벤트 발행 | ⭐️⭐️⭐️⭐️ |
| Event: PageTitleSet | Unit | PageTitleSet 이벤트 발행 | ⭐️⭐️⭐️ |
| Event: PageIconSet | Unit | PageIconSet 이벤트 발행 | ⭐️⭐️⭐️ |
| 전체 플로우 (Seq 1) | Integration | createPageAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 2) | Integration | movePageAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 (Seq 3) | Integration | updatePageInfoAction() | ⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Happy Path) | E2E | 페이지 생성 → 드래그 이동 → 제목 편집 | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Error Path) | E2E | 순환 참조 → 이동 실패 → 원래 위치 복원 | ⭐️⭐️⭐️⭐️⭐️ |

---

### Scenario 5: 멤버가 페이지를 즐겨찾기에 추가/제거

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: ToggleFavorite | Unit | Page Aggregate.toggleFavorite() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Page System | Unit | 즐겨찾기 토글 로직 | ⭐️⭐️⭐️⭐️ |
| Event: PageAddedToFavorites | Unit | PageAddedToFavorites 이벤트 발행 | ⭐️⭐️⭐️ |
| Event: PageRemovedFromFavorites | Unit | PageRemovedFromFavorites 이벤트 발행 | ⭐️⭐️⭐️ |
| 전체 플로우 | Integration | togglePageFavoriteAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 (Happy Path) | E2E | 별 아이콘 클릭 → 즐겨찾기 추가 → 사이드바 업데이트 | ⭐️⭐️⭐️⭐️ |

---

## 🧪 Unit Tests 전략

> **가이드 참조**: Phase 3.2 - Unit Tests 전략 작성

### 1. Value Objects 테스트

#### WorkspaceId VO
```typescript
describe('WorkspaceId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다')
    it('잘못된 UUID에 대해 예외를 발생시켜야 한다')
    it('빈 문자열은 허용하지 않아야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**이유**: 기본 식별자, 검증 로직 단순

---

#### PageId VO
```typescript
describe('PageId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다')
    it('잘못된 UUID에 대해 예외를 발생시켜야 한다')
    it('빈 문자열은 허용하지 않아야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**이유**: 기본 식별자, 검증 로직 단순

---

#### (삭제됨) ~~PagePath VO~~ → depth는 Page Entity에서 계산

> **설계 변경**: Materialized Path 대신 **Parent ID + depth 캐시** 방식 채택
> - PagePath VO 삭제
> - depth 계산 로직은 Page Entity/Aggregate로 이동
> - 순환 참조 방지는 Page Aggregate에서 처리

---

### 2. Entities 테스트

#### Workspace Entity
```typescript
describe('Workspace Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('Default Workspace는 is_default=true, deletable=false여야 한다')
    it('일반 Workspace는 is_default=false, deletable=true여야 한다')
  })
  
  describe('update', () => {
    it('이름/설명/아이콘을 업데이트해야 한다')
    it('updated_at 타임스탬프가 갱신되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

#### Page Entity
```typescript
describe('Page Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('parentId가 null이면 최상위 페이지여야 한다 (depth=0)')
    it('parentId가 있으면 하위 페이지여야 한다')
    it('depth가 자동 계산되어야 한다 (부모 depth + 1)')
  })
  
  describe('calculateDepth', () => {
    it('parentId가 null이면 depth=0을 반환해야 한다')
    it('부모 페이지의 depth를 기반으로 계산해야 한다 (parent.depth + 1)')
    it('부모 페이지가 없으면 예외를 발생시켜야 한다')
  })
  
  describe('move', () => {
    it('부모 페이지를 변경해야 한다')
    it('depth가 재계산되어야 한다')
    it('순환 참조를 감지하고 예외를 발생시켜야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 3. Aggregates 테스트

#### Workspace Aggregate
```typescript
describe('Workspace Aggregate', () => {
  describe('createDefault (팩토리 메서드) - Scenario 0', () => {
    it('유효한 Organization ID로 Default Workspace를 생성해야 한다')
    it('is_default=true로 설정되어야 한다')
    it('deletable=false로 설정되어야 한다')
    it('WorkspaceCreated 이벤트가 발행되어야 한다')
    it('잘못된 Organization ID에 대해 예외를 발생시켜야 한다')
  })
  
  describe('create (팩토리 메서드) - Scenario 2', () => {
    it('유효한 데이터로 일반 Workspace를 생성해야 한다')
    it('is_default=false로 설정되어야 한다')
    it('deletable=true로 설정되어야 한다')
    it('이름은 빈 문자열일 수 없다')
    it('이름은 100자를 초과할 수 없다')
    it('설명은 500자를 초과할 수 없다')
    it('WorkspaceCreated 이벤트가 발행되어야 한다')
  })
  
  describe('updateInfo (Command 처리) - Scenario 2', () => {
    it('이름/설명/아이콘을 업데이트해야 한다')
    it('이름만 업데이트해도 WorkspaceNameChanged 이벤트가 발행되어야 한다')
    it('설명만 업데이트해도 WorkspaceDescriptionChanged 이벤트가 발행되어야 한다')
    it('아이콘만 업데이트해도 WorkspaceIconChanged 이벤트가 발행되어야 한다')
    it('여러 필드 동시 업데이트 시 각각의 이벤트가 발행되어야 한다')
    it('이름이 빈 문자열이면 예외를 발생시켜야 한다')
    it('updated_at 타임스탬프가 갱신되어야 한다')
  })
  
  describe('verifyMembership (Command 처리) - Scenario 1', () => {
    it('Default Workspace는 조직 멤버면 항상 true를 반환해야 한다')
    it('일반 Workspace는 멤버십 테이블을 조회해야 한다')
    it('멤버십 없으면 false를 반환해야 한다')
    it('WorkspaceMembershipVerified 이벤트가 발행되어야 한다')
  })
  
  describe('inviteMember (Command 처리) - Scenario 3', () => {
    it('조직 Admin + Workspace 멤버가 초대할 수 있어야 한다')
    it('조직 멤버가 아니면 초대할 수 없다')
    it('이미 Workspace 멤버인 경우 예외를 발생시켜야 한다')
    it('WorkspaceMemberInvitationCreated 이벤트가 발행되어야 한다')
  })
  
  describe('acceptInvitation (Command 처리) - Scenario 3', () => {
    it('초대받은 본인만 수락할 수 있어야 한다')
    it('수락 시 Workspace 멤버로 추가되어야 한다')
    it('이미 처리된 초대는 예외를 발생시켜야 한다')
    it('WorkspaceInvitationAccepted, MemberAddedToWorkspace 이벤트가 발행되어야 한다')
  })
  
  describe('rejectInvitation (Command 처리) - Scenario 3', () => {
    it('초대받은 본인만 거절할 수 있어야 한다')
    it('거절 시 멤버로 추가되지 않아야 한다')
    it('WorkspaceInvitationRejected 이벤트가 발행되어야 한다')
  })
  
  describe('loadList (Query 처리) - Scenario 1', () => {
    it('조직의 모든 Workspace를 조회해야 한다')
    it('Default Workspace가 첫 번째로 정렬되어야 한다')
    it('삭제된 Workspace는 제외해야 한다 (deleted_at != null)')
    it('WorkspaceListLoaded 이벤트가 발행되어야 한다')
  })
  
  describe('불변식 검증', () => {
    it('Workspace는 반드시 하나의 Organization에 속해야 한다')
    it('Default Workspace는 삭제 불가여야 한다')
    it('organizationId가 null이면 예외를 발생시켜야 한다')
    it('Workspace 이름은 빈 문자열일 수 없다')
    it('조직 소유자만 Workspace 생성 가능')
    it('Workspace 멤버만 정보 수정 가능')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 35개 (Scenario 2, 3 추가)

---

#### Page Aggregate
```typescript
describe('Page Aggregate', () => {
  describe('create (팩토리 메서드) - Scenario 4', () => {
    it('유효한 데이터로 Page를 생성해야 한다')
    it('parentId가 null이면 최상위 페이지로 생성되어야 한다 (depth=0)')
    it('parentId가 있으면 하위 페이지로 생성되어야 한다')
    it('depth가 자동 계산되어야 한다 (부모 depth + 1)')
    it('부모 페이지가 존재하지 않으면 예외를 발생시켜야 한다')
    it('기본 제목 "Untitled"로 생성되어야 한다')
    it('기본 아이콘 📄로 생성되어야 한다')
    it('같은 레벨 내 순서가 자동 배정되어야 한다')
    it('PageCreated, EmptyCanvasInitialized 이벤트가 발행되어야 한다')
  })
  
  describe('loadTree (Query 처리) - Scenario 1', () => {
    it('Workspace의 모든 페이지를 트리 구조로 반환해야 한다 (재귀 CTE)')
    it('최상위 페이지와 하위 페이지를 올바르게 계층화해야 한다')
    it('depth 순서로 정렬되어야 한다 (0 → 1 → 2 → ...)')
    it('삭제된 페이지는 제외해야 한다')
    it('빈 Workspace는 빈 배열을 반환해야 한다')
    it('PageTreeLoaded 이벤트가 발행되어야 한다')
  })
  
  describe('move (Page 이동) - Scenario 4', () => {
    it('parent_id를 변경해야 한다')
    it('depth를 재계산해야 한다 (새 부모 depth + 1)')
    it('최상위로 이동 시 parent_id=null, depth=0이어야 한다')
    it('순환 참조를 감지하고 예외를 발생시켜야 한다 (재귀 조회로 ancestor 체크)')
    it('하위 페이지들의 depth도 재귀적으로 업데이트해야 한다')
    it('같은 레벨 내 순서가 자동 재정렬되어야 한다')
    it('PageMovedToChild 또는 PageMovedToRoot 이벤트가 발행되어야 한다')
  })
  
  describe('updateInfo (Command 처리) - Scenario 4', () => {
    it('제목을 업데이트해야 한다')
    it('아이콘을 업데이트해야 한다')
    it('제목과 아이콘을 동시에 업데이트해야 한다')
    it('제목이 빈 문자열이면 예외를 발생시켜야 한다')
    it('제목이 200자를 초과하면 예외를 발생시켜야 한다')
    it('PageTitleSet 또는 PageIconSet 이벤트가 발행되어야 한다')
  })
  
  describe('toggleFavorite (Command 처리) - Scenario 5', () => {
    it('즐겨찾기가 아니면 추가해야 한다')
    it('즐겨찾기이면 제거해야 한다')
    it('PageAddedToFavorites 또는 PageRemovedFromFavorites 이벤트가 발행되어야 한다')
    it('즐겨찾기는 개인별로 관리되어야 한다 (다른 사용자와 독립적)')
  })
  
  describe('verifyAccess (Command 처리) - Scenario 1', () => {
    it('Workspace 멤버면 접근 허용해야 한다')
    it('Workspace 멤버 아니면 접근 거부해야 한다')
    it('PageAccessVerified 또는 PageAccessDenied 이벤트가 발행되어야 한다')
  })
  
  describe('불변식 검증', () => {
    it('Page는 반드시 하나의 Workspace에 속해야 한다')
    it('순환 참조가 발생하면 예외를 발생시켜야 한다')
    it('workspaceId가 null이면 예외를 발생시켜야 한다')
    it('depth가 음수면 예외를 발생시켜야 한다')
    it('제목은 빈 문자열일 수 없다')
    it('Workspace 멤버만 페이지 생성/수정/이동 가능')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 35개 (Scenario 4, 5 추가)

---

### 4. Read Model Service 테스트

#### OrganizationWorkspacePageView Service
```typescript
describe('OrganizationWorkspacePageView Service', () => {
  describe('load', () => {
    it('조직의 모든 Workspace-Page 목록을 조회해야 한다')
    it('Default Workspace가 최상단에 위치해야 한다')
    it('각 Workspace의 Page 트리가 포함되어야 한다')
    it('즐겨찾기 페이지가 별도 섹션으로 분리되어야 한다')
    it('페이지가 0개인 Workspace는 빈 배열을 반환해야 한다')
    it('OrganizationWorkspacePageViewLoaded 이벤트가 발행되어야 한다')
  })
  
  describe('validateCookie', () => {
    it('유효한 쿠키 페이지 ID를 반환해야 한다')
    it('쿠키가 없으면 Default Workspace 첫 페이지를 반환해야 한다')
    it('쿠키 페이지가 삭제되었으면 Fallback해야 한다')
    it('쿠키 페이지가 다른 조직이면 Fallback해야 한다')
    it('쿠키 페이지가 존재하지 않으면 Fallback해야 한다')
  })
  
  describe('조합 로직', () => {
    it('Workspace Aggregate + Page Aggregate 결과를 올바르게 조합해야 한다')
    it('빈 Workspace는 pageTree가 빈 배열이어야 한다')
    it('Workspace 순서가 올바르게 유지되어야 한다 (Default 최상단)')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 13개

---

## 🔗 Integration Tests 전략

> **가이드 참조**: Phase 3.3 - Integration Tests 전략 작성

### 1. Repository 통합 테스트

#### WorkspaceRepository Integration Tests
```typescript
describe('WorkspaceRepository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  })
  
  describe('findByOrganizationId', () => {
    it('조직의 모든 Workspace를 조회해야 한다')
    it('삭제된 Workspace는 제외해야 한다 (deleted_at != null)')
    it('Default Workspace가 첫 번째로 정렬되어야 한다')
    it('빈 조직은 빈 배열을 반환해야 한다')
  })
  
  describe('save', () => {
    it('Workspace를 데이터베이스에 저장해야 한다')
    it('is_default=true인 Workspace가 저장되어야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('findById', () => {
    it('ID로 Workspace를 찾아야 한다')
    it('존재하지 않는 ID는 null을 반환해야 한다')
    it('삭제된 Workspace는 null을 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 8개

---

#### PageRepository Integration Tests
```typescript
describe('PageRepository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  })
  
  describe('findTreeByWorkspaceId', () => {
    it('Workspace의 모든 페이지를 트리 구조로 조회해야 한다 (재귀 CTE)')
    it('depth 순서로 정렬되어야 한다 (0 → 1 → 2 → ...)')
    it('같은 레벨 내에서는 order로 정렬되어야 한다')
    it('삭제된 페이지는 제외해야 한다')
    it('빈 Workspace는 빈 배열을 반환해야 한다')
    it('5단계 이상 깊이도 올바르게 조회해야 한다')
  })
  
  describe('save', () => {
    it('Page를 데이터베이스에 저장해야 한다')
    it('depth가 저장되어야 한다')
    it('parentId가 null이면 depth=0이어야 한다')
    it('parentId가 있으면 depth=부모depth+1이어야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('updateDepth', () => {
    it('Page의 depth를 업데이트해야 한다')
    it('하위 페이지들의 depth도 재귀적으로 업데이트해야 한다')
  })
  
  describe('findById', () => {
    it('ID로 Page를 찾아야 한다')
    it('존재하지 않는 ID는 null을 반환해야 한다')
  })
  
  describe('findAncestors', () => {
    it('재귀 CTE로 모든 조상 페이지를 조회해야 한다 (Breadcrumb용)')
    it('순환 참조 감지가 가능해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 14개 (depth 계산 및 ancestors 조회 추가)

---

#### WorkspaceMemberRepository Integration Tests
```typescript
describe('WorkspaceMemberRepository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  })
  
  describe('isMember', () => {
    it('Workspace에 초대된 멤버면 true를 반환해야 한다')
    it('Workspace에 초대되지 않은 멤버면 false를 반환해야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('addMember', () => {
    it('Workspace에 멤버를 초대해야 한다 (role 없이)')
    it('중복 초대는 거부해야 한다')
    it('adminDb를 사용해야 한다 (RLS 우회)')
  })
  
  describe('권한 확인', () => {
    it('권한은 organization_members.role에서 조회해야 한다')
    it('Workspace member + 조직 owner = 편집/삭제 권한')
    it('Workspace member + 조직 admin = 편집 권한만')
    it('Workspace member + 조직 member = 조회 권한만')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 9개 (권한 테스트 추가)

---

### 2. Server Actions 통합 테스트

#### getOrganizationWorkspacePageViewAction (Scenario 1 - Sequence 1)
```typescript
describe('getOrganizationWorkspacePageViewAction Integration Tests', () => {
  describe('조직 멤버 접근', () => {
    it('조직 멤버가 호출하면 Workspace-Page 목록을 반환해야 한다')
    it('Default Workspace가 첫 번째로 정렬되어야 한다')
    it('각 Workspace의 Page 트리가 포함되어야 한다')
    it('즐겨찾기 페이지가 별도 섹션으로 분리되어야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
  })
  
  describe('조직 멤버 아님', () => {
    it('조직 멤버 아니면 Result.err를 반환해야 한다')
    it('Organization Domain API 호출 실패 시 Result.err를 반환해야 한다 (Fail-safe)')
    it('에러 메시지에 "조직 멤버가 아닙니다"가 포함되어야 한다')
  })
  
  describe('쿠키 기반 자동 선택', () => {
    it('쿠키에서 최근 방문 페이지를 읽고 selectedPageId를 반환해야 한다')
    it('쿠키 페이지가 유효하지 않으면 Default Workspace 첫 페이지를 selectedPageId로 반환해야 한다')
    it('Default Workspace에 페이지가 없으면 selectedPageId가 null이어야 한다')
  })
  
  describe('인증 및 권한', () => {
    it('미인증 사용자는 거부해야 한다')
    it('인증된 사용자의 세션에서 userId를 추출해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 12개

---

#### verifyPageAccessAction (Scenario 1 - Sequence 2)
```typescript
describe('verifyPageAccessAction Integration Tests', () => {
  describe('페이지 접근 권한 검증', () => {
    it('조직 멤버이고 Workspace 멤버면 Result.ok(pageData)를 반환해야 한다')
    it('조직 멤버이지만 Workspace 멤버 아니면 Result.err(ACCESS_DENIED)를 반환해야 한다')
    it('Default Workspace는 조직 멤버면 자동 접근해야 한다')
    it('일반 Workspace는 멤버십 확인 후 접근해야 한다')
    it('성공 시 페이지 상세 데이터가 포함되어야 한다')
  })
  
  describe('순차 권한 검증', () => {
    it('조직 멤버십 확인 → Workspace 멤버십 확인 순서로 진행해야 한다')
    it('조직 멤버 아니면 Workspace 멤버십 체크 없이 거부해야 한다 (Fail-fast)')
    it('각 단계별 실패 이유가 명확해야 한다 (NOT_ORG_MEMBER vs NOT_WORKSPACE_MEMBER)')
  })
  
  describe('에러 처리', () => {
    it('페이지가 존재하지 않으면 Result.err(NOT_FOUND)를 반환해야 한다')
    it('페이지가 다른 Workspace에 속하면 Result.err(BAD_REQUEST)를 반환해야 한다')
    it('Organization Domain API 장애 시 Result.err(SERVICE_UNAVAILABLE)를 반환해야 한다')
  })
  
  describe('인증 및 권한', () => {
    it('미인증 사용자는 Result.err(UNAUTHORIZED)를 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 12개

---

### 3. 권한 검증 통합 테스트

#### 순차 권한 검증 플로우
```typescript
describe('권한 검증 통합 테스트', () => {
  describe('조직 멤버십 → Workspace 멤버십 순차 검증', () => {
    it('조직 멤버이고 Workspace 멤버면 모두 통과해야 한다')
    it('조직 멤버 아니면 첫 단계에서 거부해야 한다 (Fail-fast)')
    it('조직 멤버이지만 Workspace 멤버 아니면 두 번째 단계에서 거부해야 한다')
  })
  
  describe('Organization Domain API Mock 테스트', () => {
    it('organizationMemberRepository.isMember()를 정확히 호출해야 한다')
    it('API 실패 시 접근 거부해야 한다 (Fail-safe)')
    it('API 응답이 늦어도 타임아웃 처리해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 6개

## 📈 커버리지 목표 및 TDD 사이클

> **가이드 참조**: Phase 3.5 - 커버리지 목표 및 TDD 사이클 작성

### 레이어별 커버리지 목표 (Scenario 0~5)

| 레이어 | 목표 커버리지 | 우선순위 | 예상 테스트 수 |
|--------|--------------|---------|---------------|
| **Value Objects** | 95% 이상 | ⭐️⭐️⭐️⭐️ | 6개 |
| **Entities** | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 12개 |
| **Aggregates** | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 70개 (Workspace 35 + Page 35) |
| **Services** | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 39개 (4개 Service) |
| **Repositories** | 80% 이상 | ⭐️⭐️⭐️⭐️ | 31개 (총 3개 Repository) |
| **Server Actions** | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 77개 (총 9개 Action) |
| **E2E Tests** | 주요 시나리오 | ⭐️⭐️⭐️⭐️⭐️ | 12개 |

**총 예상 테스트 수**: ~247개 (Scenario 0~5 완료)

> **아키텍처 개선 (v1.2)**: 단일 WorkspaceManagementService를 Scenario별로 4개 Service로 분리하여 SRP(단일 책임 원칙) 준수 및 테스트 독립성 확보

---

### TDD 구현 순서 (Scenario 0~5)

#### Phase 1: Value Objects (⭐️⭐️⭐️⭐️)
```
1. WorkspaceId VO → RED-GREEN-REFACTOR
2. PageId VO → RED-GREEN-REFACTOR
```

**예상 시간**: 1-2시간

---

#### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
```
1. Workspace Entity → RED-GREEN-REFACTOR
   - create, update 메서드
   - is_default, deletable 속성
2. Page Entity → RED-GREEN-REFACTOR
   - create, move, updateInfo 메서드
   - calculateDepth 메서드 (부모 depth + 1)
   - 순환 참조 체크 로직
```

**예상 시간**: 4-5시간

---

#### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
```
1. Workspace Aggregate → RED-GREEN-REFACTOR (Scenario 0, 1, 2, 3)
   - createDefault, create 팩토리 메서드
   - updateInfo Command 처리
   - inviteMember, acceptInvitation, rejectInvitation Command 처리
   - verifyMembership, loadList Query 처리
   
2. Page Aggregate → RED-GREEN-REFACTOR (Scenario 1, 4, 5)
   - create 팩토리 메서드
   - move, updateInfo Command 처리
   - toggleFavorite Command 처리
   - loadTree, verifyAccess Query 처리
```

**예상 시간**: 10-12시간

---

#### Phase 4: Services (⭐️⭐️⭐️⭐️⭐️)
```
1. WorkspaceNavigationService → RED-GREEN-REFACTOR (Scenario 1)
   - getOrganizationWorkspacePageView 메서드
   - verifyPageAccess 메서드
   
2. WorkspaceCrudService → RED-GREEN-REFACTOR (Scenario 2)
   - createWorkspace 메서드 (트랜잭션: Workspace + 초기 Page)
   - updateWorkspaceInfo 메서드
   
3. WorkspaceInvitationService → RED-GREEN-REFACTOR (Scenario 3)
   - inviteWorkspaceMembers 메서드 (Notification 통합)
   - acceptWorkspaceInvitation 메서드
   - rejectWorkspaceInvitation 메서드
   
4. PageHierarchyService → RED-GREEN-REFACTOR (Scenario 4)
   - createPage 메서드
   - movePage 메서드 (순환 참조 체크)
   - updatePageInfo 메서드
```

**예상 시간**: 8-10시간  
**아키텍처 원칙**: SRP 준수, 의존성 최소화 (평균 4개), 독립 테스트 가능

---

#### Phase 5: Repositories (⭐️⭐️⭐️⭐️) - Integration Tests
```
1. WorkspaceRepository (Integration Test)
   - findByOrganizationId, save, findById, update
2. PageRepository (Integration Test)
   - findTreeByWorkspaceId, save, findById, updateDepth, findAncestors
3. WorkspaceMemberRepository (Integration Test)
   - isMember, addMember, findInvitation
4. PageFavoriteRepository (Integration Test)
   - isFavorite, toggle
```

**예상 시간**: 6-8시간

---

#### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - Integration Tests
```
1. Scenario 1: getOrganizationWorkspacePageViewAction, verifyPageAccessAction
2. Scenario 2: createWorkspaceAction, updateWorkspaceInfoAction
3. Scenario 3: inviteWorkspaceMemberAction, acceptWorkspaceInvitationAction, rejectWorkspaceInvitationAction
4. Scenario 4: createPageAction, movePageAction, updatePageInfoAction
5. Scenario 5: togglePageFavoriteAction
```

**예상 시간**: 10-12시간

---

#### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
```
Scenario 1:
1. Happy Path: 조직 접근 → 페이지 선택
2. Error Path: 초대 안된 Workspace 접근
3. Edge Case: 쿠키 자동 선택, 쿠키 Fallback
4. Error Path: 조직 멤버 아님

Scenario 2:
5. Happy Path: Workspace 생성 → 첫 페이지 이동
6. Happy Path: Workspace 정보 수정

Scenario 3:
7. Happy Path: 멤버 초대 → 수락 → Workspace 접근
8. Error Path: 이미 멤버인 경우 초대 불가

Scenario 4:
9. Happy Path: 페이지 생성 → 제목 편집
10. Happy Path: 페이지 드래그 이동
11. Error Path: 순환 참조 이동 실패

Scenario 5:
12. Happy Path: 즐겨찾기 토글 → 사이드바 업데이트
```

**예상 시간**: 6-8시간

---

### TDD Cycle 예시 (Page Entity - calculateDepth 메서드)

```typescript
// 1️⃣ RED: 테스트 먼저 작성
describe('Page Entity', () => {
  it('부모 페이지의 depth를 기반으로 계산해야 한다', () => {
    const parent = new Page({ ...props, depth: 2 });
    const child = new Page({ ...props, parentId: parent.id });
    
    expect(child.calculateDepth(parent)).toBe(3);
  })
})
// 실행: FAIL (calculateDepth 메서드 없음)

// 2️⃣ GREEN: 최소 구현
export class Page {
  calculateDepth(parent: Page | null): number {
    if (!parent) return 0;
    return parent.depth + 1;
  }
}
// 실행: PASS

// 3️⃣ REFACTOR: 검증 로직 추가
export class Page {
  calculateDepth(parent: Page | null): number {
    if (this.parentId === null) {
      return 0; // 최상위 페이지
    }
    
    if (!parent) {
      throw new PageNotFoundError('부모 페이지가 존재하지 않습니다');
    }
    
    return parent.depth + 1;
  }
}
// 실행: PASS (여전히!)

// 4️⃣ 추가 테스트 작성 (순환 참조 방지)
it('순환 참조를 감지해야 한다', async () => {
  const pageA = new Page({ id: 'A', parentId: null });
  
  // Page A를 Page A의 하위로 이동하려고 시도
  await expect(
    pageAggregate.move(pageA.id, pageA.id)
  ).rejects.toThrow('순환 참조가 발생합니다');
})
// 실행: FAIL

// 5️⃣ Page Aggregate에 순환 참조 체크 로직 추가
async move(pageId: string, newParentId: string): Promise<void> {
  // 재귀 쿼리로 ancestors 조회
  const ancestors = await this.pageRepo.findAncestors(newParentId);
  if (ancestors.some(a => a.id === pageId)) {
    throw new CircularReferenceError('순환 참조가 발생합니다');
  }
  // ...
}
// 실행: PASS
```

---

## ⚙️ 테스트 도구 및 설정

### Unit & Integration Tests
- **프레임워크**: Vitest
- **Assertion**: expect (Vitest 내장)
- **Mock**: vi (Vitest 내장)
- **커버리지**: v8
- **설정 파일**: `vitest.config.ts`

### E2E Tests
- **프레임워크**: Playwright
- **브라우저**: Chromium, Firefox, WebKit
- **스크린샷**: 실패 시 자동 캡처
- **비디오**: 실패 시 자동 녹화
- **설정 파일**: `playwright.config.ts`

### 테스트 데이터베이스
- **로컬**: PostgreSQL (Docker)
- **CI/CD**: Supabase 테스트 인스턴스
- **정리 전략**: 각 테스트 후 데이터 완전 삭제 (`cleanDatabase()`)
- **시드 데이터**: 테스트별 필요한 데이터만 생성

### Mock 전략
- **Organization Domain API**: Mock으로 대체 (Unit/Integration Test)
  - `organizationMemberRepository.isMember()` Mock
  - `organizationMemberRepository.findMemberRole()` Mock
- **실제 API 호출**: E2E Test에서만 실제 Organization Domain 호출

---

## ✅ 검증 체크리스트 (Scenario 1)

### 일관성 검증
- [x] Process Model의 Scenario 1이 테스트 케이스로 매핑되었는가?
- [x] Software Design의 Workspace/Page Aggregate가 테스트 계획에 포함되었는가?
- [x] 핵심 불변식이 테스트로 검증 가능한가?

### 완전성 검증
- [x] Scenario 1 Happy Path가 커버되는가?
- [x] 주요 에러 시나리오가 테스트되는가? (권한 없음, 조직 멤버 아님)
- [x] 경계값 테스트가 포함되어 있는가? (쿠키 Fallback)
- [x] 커버리지 목표를 달성할 수 있는가? (85% 이상)

### 실용성 검증
- [x] 테스트는 독립적으로 실행 가능한가? (beforeEach 사용)
- [x] 테스트는 빠르게 실행되는가? (Unit < 100ms 목표)
- [x] 테스트는 반복 실행해도 동일한 결과를 내는가?
- [x] 테스트 실패 시 원인을 명확히 알 수 있는가? (설명적인 it 문구)

---

## 📊 성과 측정 지표 (Scenario 0~5)

1. **테스트 커버리지**: 전체 85% 이상 달성
2. **테스트 실행 시간**: Unit Tests < 10초, Integration Tests < 60초, E2E Tests < 5분
3. **테스트 안정성**: Flaky Test 비율 < 1%
4. **버그 발견율**: 테스트에서 발견된 버그 비율 > 80% (프로덕션 배포 전)
5. **TDD 준수율**: 코드 작성 전 테스트 작성 비율 > 90%

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- [Software Design 문서](./03-software-design.md)
- Organization Management Domain:
  - [Testing Strategy](../organization-management-domain/04-testing-strategy.md) - 참고 패턴

---

## 📋 문서 변경 이력

### v1.2 (2025-10-13)
- **Service 아키텍처 리팩토링**:
  - 단일 WorkspaceManagementService → 4개 Scenario별 Service로 분리
    - WorkspaceNavigationService (Scenario 1: 11 tests)
    - WorkspaceCrudService (Scenario 2: 10 tests)
    - WorkspaceInvitationService (Scenario 3: 8 tests)
    - PageHierarchyService (Scenario 4: 10 tests)
  - SOLID 원칙 준수 (SRP, OCP)
  - 의존성 최소화 (평균 7개 → 4개, 43% 감소)
  - 테스트 독립성 확보 (4개 파일로 분리, 병렬 실행 가능)
  - 파일 크기 감소 (837줄 → 평균 220줄, 74% 감소)
- Phase 4 업데이트: Read Model Service → Services로 변경
- 총 예상 테스트 수 업데이트: 221개 → 247개

### v1.1 (2025-10-12)
- Scenario 3 테스트 케이스 확장:
  - 조직 멤버 검색 통합 테스트 추가
  - searchOrganizationMembersAction() 테스트 추가
  - getWorkspaceMembersAction() 테스트 추가
  - E2E 테스트 상세화:
    - 멤버 검색 및 상태 플래그 확인 (이미 멤버/초대 중/선택 가능)
    - 선택된 멤버 Badge 표시 확인

### v1.0 (2025-10-11)
- 초안 작성
- Scenario 0~5 테스트 전략 정의
- Unit/Integration/E2E 테스트 케이스 매핑
- TDD 구현 순서 정의
- 커버리지 목표 설정 (85% 이상)

---

*이 Testing Strategy 문서는 Workspace Management Domain의 TDD 구현을 위한 완전한 테스트 계획입니다. (Scenario 0~5 완료, Scenario 6은 Post-MVP, Scenario 7~8은 별도 진행 예정)*

