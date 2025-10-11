# Testing Strategy: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 시니어개발자 + QA  
**작성일**: 2025-10-11  
**버전**: v1.0

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

- **입력**: `02-process-model.md` - 7개 시나리오 (Scenario 1까지 진행 중)
- **입력**: `03-software-design.md` - 2개 Aggregate (Workspace, Page)
- **출력**: Unit/Integration/E2E 테스트 케이스

### 커버리지 목표 요약 (Scenario 1 기준)

```
전체 코드 커버리지: 85% 이상
- Unit Tests:       65%  (60개 예상)
- Integration Tests: 25%  (50개 예상)
- E2E Tests:        10%  (5개 예상)
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
  describe('createDefault (팩토리 메서드)', () => {
    it('유효한 Organization ID로 Default Workspace를 생성해야 한다')
    it('is_default=true로 설정되어야 한다')
    it('deletable=false로 설정되어야 한다')
    it('WorkspaceCreated 이벤트가 발행되어야 한다')
    it('잘못된 Organization ID에 대해 예외를 발생시켜야 한다')
  })
  
  describe('create (팩토리 메서드)', () => {
    it('유효한 데이터로 일반 Workspace를 생성해야 한다')
    it('is_default=false로 설정되어야 한다')
    it('deletable=true로 설정되어야 한다')
    it('WorkspaceCreated 이벤트가 발행되어야 한다')
  })
  
  describe('verifyMembership (Command 처리)', () => {
    it('Default Workspace는 조직 멤버면 항상 true를 반환해야 한다')
    it('일반 Workspace는 멤버십 테이블을 조회해야 한다')
    it('멤버십 없으면 false를 반환해야 한다')
    it('WorkspaceMembershipVerified 이벤트가 발행되어야 한다')
  })
  
  describe('loadList (Query 처리)', () => {
    it('조직의 모든 Workspace를 조회해야 한다')
    it('Default Workspace가 첫 번째로 정렬되어야 한다')
    it('삭제된 Workspace는 제외해야 한다 (deleted_at != null)')
    it('WorkspaceListLoaded 이벤트가 발행되어야 한다')
  })
  
  describe('불변식 검증', () => {
    it('Workspace는 반드시 하나의 Organization에 속해야 한다')
    it('Default Workspace는 삭제 불가여야 한다')
    it('organizationId가 null이면 예외를 발생시켜야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 15개

---

#### Page Aggregate
```typescript
describe('Page Aggregate', () => {
  describe('create (팩토리 메서드)', () => {
    it('유효한 데이터로 Page를 생성해야 한다')
    it('parentId가 null이면 최상위 페이지로 생성되어야 한다 (depth=0)')
    it('parentId가 있으면 하위 페이지로 생성되어야 한다')
    it('depth가 자동 계산되어야 한다 (부모 depth + 1)')
    it('부모 페이지가 존재하지 않으면 예외를 발생시켜야 한다')
    it('PageCreated 이벤트가 발행되어야 한다')
  })
  
  describe('loadTree (Query 처리)', () => {
    it('Workspace의 모든 페이지를 트리 구조로 반환해야 한다 (재귀 CTE)')
    it('최상위 페이지와 하위 페이지를 올바르게 계층화해야 한다')
    it('depth 순서로 정렬되어야 한다 (0 → 1 → 2 → ...)')
    it('삭제된 페이지는 제외해야 한다')
    it('빈 Workspace는 빈 배열을 반환해야 한다')
    it('PageTreeLoaded 이벤트가 발행되어야 한다')
  })
  
  describe('move (Page 이동)', () => {
    it('parent_id를 변경해야 한다')
    it('depth를 재계산해야 한다 (새 부모 depth + 1)')
    it('순환 참조를 감지하고 예외를 발생시켜야 한다 (재귀 조회로 ancestor 체크)')
    it('하위 페이지들의 depth도 재귀적으로 업데이트해야 한다')
  })
  
  describe('verifyAccess (Command 처리)', () => {
    it('Workspace 멤버면 접근 허용해야 한다')
    it('Workspace 멤버 아니면 접근 거부해야 한다')
    it('PageAccessVerified 또는 PageAccessDenied 이벤트가 발행되어야 한다')
  })
  
  describe('불변식 검증', () => {
    it('Page는 반드시 하나의 Workspace에 속해야 한다')
    it('순환 참조가 발생하면 예외를 발생시켜야 한다')
    it('workspaceId가 null이면 예외를 발생시켜야 한다')
    it('depth가 음수면 예외를 발생시켜야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 14개

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
    it('Workspace 멤버면 true를 반환해야 한다')
    it('Workspace 멤버 아니면 false를 반환해야 한다')
    it('삭제된 멤버십은 false를 반환해야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('addMember', () => {
    it('Workspace에 멤버를 추가해야 한다')
    it('중복 멤버십은 거부해야 한다')
    it('adminDb를 사용해야 한다 (RLS 우회)')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**예상 테스트 수**: 7개

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

---

## 🎭 E2E Tests 전략

> **가이드 참조**: Phase 3.4 - E2E Tests 전략 작성

### Scenario 1 E2E 테스트 시나리오

#### E2E Test 1: Happy Path - 조직 링크 접근 → 페이지 열기
```typescript
test('[Scenario 1-1] 조직 멤버가 조직 링크로 접근하여 Workspace-Page 목록 확인 및 페이지 선택', async ({ page }) => {
  // Given: 조직 멤버로 로그인됨
  await loginAsUser('member@test.com', 'password123');
  
  // When: 조직 페이지로 접근
  await page.goto('/r/org123/workspace');
  
  // Then: 사이드바에 Workspace-Page 목록이 표시되어야 함
  await expect(page.locator('[data-testid="workspace-sidebar"]')).toBeVisible();
  await expect(page.locator('[data-testid="workspace-default"]')).toContainText('Default Workspace');
  await expect(page.locator('[data-testid="workspace-list"]')).toBeVisible();
  
  // And: Default Workspace가 최상단에 있어야 함
  const firstWorkspace = page.locator('[data-testid^="workspace-"]').first();
  await expect(firstWorkspace).toContainText('Default Workspace');
  
  // When: Page를 클릭
  await page.click('[data-testid="page-welcome"]');
  
  // Then: 페이지가 로드되어야 함
  await expect(page).toHaveURL(/\/workspace\/ws456\/page\/page789$/);
  await expect(page.locator('[data-testid="page-title"]')).toContainText('Welcome');
  await expect(page.locator('[data-testid="canvas"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

#### E2E Test 2: Error Path - 권한 없음
```typescript
test('[Scenario 1-2] 조직 멤버가 초대되지 않은 Workspace의 페이지 접근 시 권한 없음 페이지 표시', async ({ page }) => {
  // Given: 조직 멤버이지만 특정 Workspace에 초대되지 않음
  await loginAsUser('member@test.com', 'password123');
  
  // When: 초대되지 않은 Workspace의 페이지 직접 URL 접근
  await page.goto('/r/org123/workspace/ws-private/page/page999');
  
  // Then: 권한 없음 페이지가 표시되어야 함
  await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  await expect(page.locator('text=이 페이지에 접근할 수 없습니다')).toBeVisible();
  await expect(page.locator('text=Workspace에 초대되지 않았습니다')).toBeVisible();
  
  // And: 초대 요청 버튼이 있어야 함
  await expect(page.locator('[data-testid="request-access-btn"]')).toBeVisible();
  
  // And: 사이드바에서는 해당 Workspace가 보여야 함 (조직 멤버이므로)
  await expect(page.locator('[data-testid="workspace-private"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

#### E2E Test 3: Edge Case - 쿠키 Fallback
```typescript
test('[Scenario 1-3] 쿠키에 저장된 최근 방문 페이지로 자동 이동', async ({ page, context }) => {
  // Given: 로그인하고 쿠키에 최근 방문 페이지 저장됨
  await loginAsUser('member@test.com', 'password123');
  await context.addCookies([{
    name: 'recent_page_id',
    value: 'page123',
    domain: 'localhost',
    path: '/'
  }]);
  
  // When: 조직 페이지 접근
  await page.goto('/r/org123/workspace');
  
  // Then: 쿠키에 저장된 페이지로 자동 리다이렉트되어야 함
  await expect(page).toHaveURL(/\/page\/page123$/);
})

test('[Scenario 1-4] 쿠키 페이지가 유효하지 않으면 Default Workspace 첫 페이지로 Fallback', async ({ page, context }) => {
  // Given: 로그인하고 쿠키에 삭제된 페이지 ID 저장됨
  await loginAsUser('member@test.com', 'password123');
  await context.addCookies([{
    name: 'recent_page_id',
    value: 'deleted-page-999',
    domain: 'localhost',
    path: '/'
  }]);
  
  // When: 조직 페이지 접근
  await page.goto('/r/org123/workspace');
  
  // Then: Default Workspace의 첫 번째 페이지로 리다이렉트되어야 함
  await expect(page).toHaveURL(/\/workspace\/ws-default\/page\//);
  await expect(page.locator('[data-testid="workspace-sidebar"]')).toContainText('Default Workspace');
  
  // And: 에러 메시지 없이 자연스럽게 Fallback되어야 함
  await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

#### E2E Test 4: Error Path - 조직 멤버 아님
```typescript
test('[Scenario 1-5] 조직 멤버가 아닌 사용자는 접근 거부', async ({ page }) => {
  // Given: 다른 조직의 멤버로 로그인
  await loginAsUser('other@test.com', 'password123');
  
  // When: 권한 없는 조직 페이지 접근
  await page.goto('/r/org123/workspace');
  
  // Then: 403 Forbidden 또는 권한 없음 페이지 표시
  await expect(page.locator('[data-testid="forbidden"]')).toBeVisible();
  await expect(page.locator('text=조직 멤버가 아닙니다')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

## 📈 커버리지 목표 및 TDD 사이클

> **가이드 참조**: Phase 3.5 - 커버리지 목표 및 TDD 사이클 작성

### 레이어별 커버리지 목표 (Scenario 1)

| 레이어 | 목표 커버리지 | 우선순위 | 예상 테스트 수 |
|--------|--------------|---------|---------------|
| **Value Objects** | 95% 이상 | ⭐️⭐️⭐️⭐️ | 6개 (PagePath 삭제) |
| **Entities** | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 12개 (depth 계산 로직 추가) |
| **Aggregates** | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 29개 (Workspace 15 + Page 14) |
| **Read Model Service** | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 13개 |
| **Repositories** | 80% 이상 | ⭐️⭐️⭐️⭐️ | 26개 (총 3개 Repository) |
| **Server Actions** | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ | 24개 (총 2개 Action) |
| **E2E Tests** | 5개 시나리오 | ⭐️⭐️⭐️⭐️⭐️ | 5개 |

**총 예상 테스트 수**: ~117개 (Scenario 1만, PagePath 삭제 + Page Entity/Aggregate depth 로직 추가)

---

### TDD 구현 순서 (Scenario 1)

#### Phase 1: Value Objects (⭐️⭐️⭐️⭐️)
```
1. WorkspaceId VO → RED-GREEN-REFACTOR
2. PageId VO → RED-GREEN-REFACTOR
```

**예상 시간**: 1-2시간 (PagePath 삭제로 단순화)

---

#### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
```
1. Workspace Entity → RED-GREEN-REFACTOR
   - create, update 메서드
   - is_default, deletable 속성
2. Page Entity → RED-GREEN-REFACTOR
   - create, move 메서드
   - calculateDepth 메서드 (부모 depth + 1)
   - 순환 참조 체크 로직
```

**예상 시간**: 3-4시간

---

#### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
```
1. Workspace Aggregate → RED-GREEN-REFACTOR
   - createDefault, create 팩토리 메서드
   - verifyMembership Command 처리
   - loadList Query 처리
2. Page Aggregate → RED-GREEN-REFACTOR
   - create 팩토리 메서드
   - loadTree Query 처리
   - verifyAccess Command 처리
```

**예상 시간**: 5-6시간

---

#### Phase 4: Read Model Service (⭐️⭐️⭐️⭐️⭐️)
```
1. OrganizationWorkspacePageView Service → RED-GREEN-REFACTOR
   - load 메서드 (Workspace + Page 조합)
   - validateCookie 메서드 (쿠키 검증 및 Fallback)
```

**예상 시간**: 3-4시간

---

#### Phase 5: Repositories (⭐️⭐️⭐️⭐️) - Integration Tests
```
1. WorkspaceRepository (Integration Test)
   - findByOrganizationId, save, findById
2. PageRepository (Integration Test)
   - findTreeByWorkspaceId, save, findById
3. WorkspaceMemberRepository (Integration Test)
   - isMember, addMember
```

**예상 시간**: 4-5시간

---

#### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - Integration Tests
```
1. getOrganizationWorkspacePageViewAction (Integration Test)
   - 조직 멤버 접근, 권한 없음, 쿠키 자동 선택, 인증 검증
2. verifyPageAccessAction (Integration Test)
   - 페이지 접근 권한 검증, 순차 검증, 에러 처리, 인증 검증
```

**예상 시간**: 4-5시간

---

#### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
```
1. Happy Path: 조직 접근 → 페이지 선택
2. Error Path 1: 초대 안된 Workspace 접근
3. Edge Case 1: 쿠키 자동 선택
4. Edge Case 2: 쿠키 Fallback
5. Error Path 2: 조직 멤버 아님
```

**예상 시간**: 3-4시간

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

## 📊 성과 측정 지표 (Scenario 1)

1. **테스트 커버리지**: 전체 85% 이상 달성
2. **테스트 실행 시간**: Unit Tests < 5초, Integration Tests < 30초, E2E Tests < 2분
3. **테스트 안정성**: Flaky Test 비율 < 1%
4. **버그 발견율**: 테스트에서 발견된 버그 비율 > 80% (프로덕션 배포 전)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- [Software Design 문서](./03-software-design.md)
- Organization Management Domain:
  - [Testing Strategy](../organization-management-domain/04-testing-strategy.md) - 참고 패턴

---

*이 Testing Strategy 문서는 Workspace Management Domain의 TDD 구현을 위한 완전한 테스트 계획입니다. (Scenario 1까지 완료, 나머지 Scenario 진행 중)*

