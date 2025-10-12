# Story 004: Page 생성 및 계층 구조 관리

## 🎯 Story 개요

**User Story**: As a Workspace 멤버, I want to Page를 생성하고 드래그앤드롭으로 계층 구조를 변경하며 제목과 아이콘을 편집할 수 있어야 so that 문서를 체계적으로 구성하고 관리할 수 있다

**Story Points**: 8  
**우선순위**: High (MVP 핵심 기능)  
**Epic**: Workspace Management - Page 관리  
**Domain**: Workspace Management Domain (주 도메인)

**작성일**: 2025-10-11  
**예상 기간**: 3일

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: Workspace 멤버가 새 Page를 생성

```gherkin
Feature: Page 생성
  Scenario: Page 트리에서 인라인으로 페이지 생성
    Given 사용자가 Workspace 멤버이다
    And Page 트리가 표시되어 있다
    When 페이지 항목에 마우스를 올린다 (hover)
    Then "+" 버튼이 나타난다
    When "+" 버튼을 클릭한다
    Then 해당 페이지의 하위 페이지로 빈 페이지가 생성된다
    And 페이지 제목 입력 필드에 포커스가 이동한다
    And "Untitled" 기본 제목이 입력되어 있다
    When 제목 "프로젝트 계획"을 입력한다
    And Enter 키를 누른다
    Then 페이지 제목이 "프로젝트 계획"으로 저장된다
    And Page 트리에 새 페이지가 추가되어 표시된다
    And Optimistic update로 즉시 반영된다
```

### 시나리오 2: Page를 드래그앤드롭으로 이동

```gherkin
Feature: Page 드래그앤드롭 이동
  Scenario: Page를 다른 페이지의 하위로 이동
    Given 사용자가 Workspace 멤버이다
    And Page 트리에 "페이지 A"와 "페이지 B"가 있다
    When "페이지 A"를 드래그한다
    And "페이지 B" 위에 드롭한다
    Then "페이지 A"가 "페이지 B"의 하위 페이지로 이동한다
    And Page 트리가 업데이트되어 표시된다
    And depth가 재계산된다
    And Optimistic update로 즉시 반영된다
    And 성공 토스트 "페이지가 이동되었습니다"가 표시된다
```

### 시나리오 3: 순환 참조 방지

```gherkin
Feature: 순환 참조 방지
  Scenario: 부모 페이지를 자식 페이지의 하위로 이동 시도
    Given "페이지 A" > "페이지 B" > "페이지 C" 계층이 있다
    When "페이지 A"를 드래그한다
    And "페이지 C" 위에 드롭한다
    Then "순환 참조가 발생할 수 없습니다" 에러 토스트가 표시된다
    And 페이지가 이동하지 않는다
    And Page 트리가 원래 상태로 유지된다
```

### 시나리오 4: Page 제목 인라인 편집

```gherkin
Feature: Page 제목 인라인 편집
  Scenario: Page Header에서 제목을 클릭하여 편집
    Given 사용자가 페이지를 보고 있다
    And Page Header에 제목이 표시되어 있다
    When Page Header의 제목을 클릭한다
    Then 제목 입력 필드로 전환된다
    And 기존 제목이 선택된 상태로 표시된다
    When 제목을 "마케팅 전략"으로 변경한다
    And Enter 키를 누른다
    Then 페이지 제목이 "마케팅 전략"으로 업데이트된다
    And Page Header와 사이드바에 즉시 반영된다
    And Optimistic update로 즉시 반영된다
```

### 시나리오 5: Page 아이콘 변경

```gherkin
Feature: Page 아이콘 변경
  Scenario: Page Header에서 아이콘을 클릭하여 변경
    Given 사용자가 페이지를 보고 있다
    And Page Header에 아이콘이 표시되어 있다
    When Page Header의 아이콘을 클릭한다
    Then IconPicker Popover가 열린다
    And 기본 아이콘 버튼들이 표시된다
    When 아이콘 "📊"를 선택한다
    Then 페이지 아이콘이 "📊"로 업데이트된다
    And Page Header와 사이드바에 즉시 반영된다
    And Popover가 자동으로 닫힌다
```

### 시나리오 6: 폼 유효성 검증

```gherkin
Feature: Page 제목 유효성 검증
  Scenario: 제목이 비어있는 경우
    Given 사용자가 새 페이지를 생성했다
    When 제목을 입력하지 않고 Enter를 누른다
    Then "페이지 제목을 입력해주세요" 에러 메시지가 표시된다
    And 페이지 제목이 "Untitled"로 저장된다
  
  Scenario: 제목이 너무 긴 경우
    Given 사용자가 페이지 제목을 편집 중이다
    When 제목을 201자 이상 입력한다
    Then "200자 이내로 입력해주세요" 에러 메시지가 표시된다
    And 저장 버튼이 비활성화된다
```

### 시나리오 7: 권한 검증

```gherkin
Feature: 권한 없는 사용자 차단
  Scenario: Workspace 멤버가 아닌 사용자의 Page 생성 시도
    Given 사용자가 Workspace 멤버가 아니다
    When createPageAction을 호출한다
    Then "접근 권한이 없습니다" 에러가 반환된다
    And 페이지가 생성되지 않는다
```

---

## 📋 개발 Task (도메인별)

### Workspace Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 4

#### Backend Implementation
- [ ] PageAggregate 구현
  - [ ] `create` 메서드 (workspaceId, parentId?, title, icon?)
  - [ ] `move` 메서드 (newParentId?, order)
  - [ ] `updateInfo` 메서드 (title?, icon?)
  - [ ] 불변식: 제목 1-200자, 순환 참조 방지, depth 계산
- [ ] Page Entity 구현 (VO 포함)
  - [ ] id, workspaceId, parentId, title, icon, order, depth
- [ ] PageRepository 확장
  - [ ] `save(page)` - 생성 및 업데이트
  - [ ] `findById(id)` - 조회
  - [ ] `findByWorkspace(workspaceId)` - Workspace별 조회
  - [ ] `findDescendants(pageId)` - 하위 페이지 조회 (순환 참조 확인)
  - [ ] `getMaxOrder(parentId)` - 최대 order 값
  - [ ] `updateOrder(pageId, order)` - order 업데이트

#### Database
- [ ] `pages` 테이블 (이미 존재, Story-001에서 생성)
  - [ ] 컬럼: parent_id, order, depth 활용
- [ ] PostgreSQL 재귀 CTE
  - [ ] 하위 페이지 조회 쿼리
  - [ ] depth 계산 로직
- [ ] RLS 정책 적용 (creator-only)

#### Server Actions
- [ ] `createPageAction`
  - 입력: CreatePageRequest (workspaceId, parentId?, title?, icon?)
  - 출력: Result<{ pageId }>
  - 권한: Workspace 멤버
  - 로직: Page 생성 → order/depth 계산 → Optimistic update
- [ ] `movePageAction`
  - 입력: MovePageRequest (pageId, newParentId?, order)
  - 출력: Result<void>
  - 권한: Workspace 멤버
  - 로직: 순환 참조 확인 → 이동 → depth 재계산 → Optimistic update
- [ ] `updatePageInfoAction`
  - 입력: UpdatePageInfoRequest (pageId, title?, icon?)
  - 출력: Result<void>
  - 권한: Workspace 멤버
  - 로직: 제목/아이콘 업데이트 → 캐시 무효화

#### Service Layer
- [ ] WorkspaceManagementService 확장
  - [ ] `createPage` 메서드
  - [ ] `movePage` 메서드 (순환 참조 검증 포함)
  - [ ] `updatePageInfo` 메서드

#### Frontend
- [ ] PageTreeWithActions 컴포넌트
  - PageTree 확장 (Scenario 1 → 4)
  - 호버 시 "+" 버튼 표시 (opacity-0 → opacity-100)
  - 드래그앤드롭 활성화 (enableDragDrop prop)
  - onDrop 핸들러로 movePage 호출
  - renderItemActions로 + 버튼 렌더링
- [ ] PageTree 컴포넌트 확장
  - dnd-kit 또는 react-dnd 통합
  - 드래그 프리뷰
  - 드롭 영역 하이라이트
  - 순환 참조 방지 (드롭 불가 영역)
- [ ] PageTreeItem 컴포넌트 확장
  - 드래그 핸들
  - 호버 시 액션 버튼 표시
- [ ] PageHeader 컴포넌트 확장
  - 제목 클릭 → Input 전환
  - 아이콘 클릭 → IconPicker Popover
  - 인라인 편집 모드
  - Enter/Escape/blur 처리
- [ ] WorkspaceContext 확장
  - `createPage` 액션 (Optimistic update)
  - `movePage` 액션 (Optimistic update)
  - `updatePageInfo` 액션 (Optimistic update)
  - Optimistic update 패턴:
    1. 낙관적 상태 즉시 업데이트
    2. Server Action 호출
    3. 성공: 상태 유지
    4. 실패: 이전 상태 롤백 + 에러 토스트
- [ ] useWorkspace Hook 확장
  - `canEditPage` 유틸리티 (Workspace 멤버 확인)

---

### 도메인 간 통합
- [ ] Workspace → Page 통합 (내부)
  - [ ] Workspace 멤버십 확인
  - [ ] Page 권한 검증

---

### Testing & Quality

#### Unit Tests
- [ ] PageAggregate 테스트
  - [ ] `create` 메서드 성공
  - [ ] 제목 길이 검증 (0자, 201자)
  - [ ] `move` 메서드 성공
  - [ ] 순환 참조 방지 검증
  - [ ] depth 계산 검증
  - [ ] `updateInfo` 메서드 성공
- [ ] Command/Event 테스트
  - [ ] CreatePageCommand
  - [ ] PageCreated 이벤트
  - [ ] MovePageCommand
  - [ ] PageMoved 이벤트
  - [ ] UpdatePageInfoCommand
  - [ ] PageInfoUpdated 이벤트

#### Integration Tests
- [ ] Server Actions 테스트
  - [ ] `createPageAction` 성공 (Workspace 멤버)
  - [ ] `createPageAction` 실패 (권한 없음)
  - [ ] `createPageAction` 유효성 검증 실패
  - [ ] `movePageAction` 성공
  - [ ] `movePageAction` 순환 참조 방지
  - [ ] `movePageAction` depth 재계산 확인
  - [ ] `updatePageInfoAction` 성공
  - [ ] `updatePageInfoAction` 유효성 검증 실패
- [ ] Repository 테스트
  - [ ] Page 생성, 조회, 업데이트
  - [ ] findDescendants (재귀 CTE)
  - [ ] order 업데이트

#### E2E Tests
- [ ] Page 생성 플로우
  - [ ] + 버튼 호버 및 클릭
  - [ ] 제목 입력 및 Enter
  - [ ] Page 트리에 새 페이지 추가 확인
  - [ ] Optimistic update 확인
- [ ] Page 드래그앤드롭 플로우
  - [ ] 페이지 드래그
  - [ ] 다른 페이지에 드롭
  - [ ] 계층 구조 변경 확인
  - [ ] Optimistic update 확인
- [ ] 순환 참조 방지
  - [ ] 부모 페이지를 자식에 드롭 시도
  - [ ] 에러 토스트 확인
  - [ ] 페이지 이동하지 않음 확인
- [ ] 제목/아이콘 인라인 편집
  - [ ] Page Header에서 제목/아이콘 클릭
  - [ ] 편집 및 저장
  - [ ] 사이드바 즉시 반영 확인

---

## 🎯 Definition of Done

### 기능 완료
- [ ] Workspace 멤버가 새 Page를 생성할 수 있다
- [ ] + 버튼으로 인라인 생성이 가능하다
- [ ] Page를 드래그앤드롭으로 이동할 수 있다
- [ ] 순환 참조가 방지된다
- [ ] Page Header에서 제목과 아이콘을 인라인 편집할 수 있다
- [ ] Optimistic update로 즉각 반응하는 UI가 제공된다
- [ ] 권한이 없는 사용자는 편집할 수 없다

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] Integration Tests 통과 (15개 이상)
- [ ] E2E Tests 통과 (4개 시나리오)
- [ ] 코드 리뷰 완료
- [ ] 드래그앤드롭 라이브러리 통합 (dnd-kit 또는 react-dnd)

### 품질 완료
- [ ] RLS 정책 적용 (creator-only)
- [ ] Application-level 권한 검증 (Workspace 멤버)
- [ ] 순환 참조 방지 로직 (재귀 CTE)
- [ ] Optimistic update 패턴 적용 (성공/실패 처리)
- [ ] toast 피드백 메시지 적용
- [ ] 접근성 기준 충족 (드래그앤드롭 키보드 지원)
- [ ] 성능 최적화 (대규모 Page 트리 렌더링)

---

## 📊 진행 상황

**현재**: 0% 완료 (설계 완료, 구현 대기 중)

**진행 단계**:
- [x] Event Storming 완료
- [x] Process Model 완료 (Scenario 4)
- [x] Software Design 완료
- [x] User Flow 완료 (9개 Screen)
- [x] Testing Strategy 완료
- [x] Technical Specification 완료
- [x] Frontend Specification 완료
- [x] Database Schema 완료
- [ ] Backend 구현 대기
- [ ] Frontend 구현 대기
- [ ] 드래그앤드롭 통합 대기
- [ ] 테스트 작성 대기

---

## 🔗 의존성

### 선행 Story
- **Story-001**: Workspace-Page 목록 조회 (PageTree, WorkspaceContext)
- **Story-002**: Workspace 생성 (Welcome Page 생성 패턴)

### 후행 Story
- **Story-005**: 페이지 즐겨찾기 (Page 편집 기능 활용)

### 도메인 의존성
- **Workspace Management Domain**: Workspace 멤버십 확인

---

## 📁 관련 문서

### Domain Documentation
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 4
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - PageAggregate
- [User Flow](../../../event-domain-design/domains/workspace-management-domain/03-user-flow.md) - Screen 15~23
- [Testing Strategy](../../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md) - Scenario 4 테스트
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md) - 컴포넌트 설계
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - pages 테이블

### Agile Planning
- [Epic 문서](../../epics/epic-002-workspace-page-management.md)
- [Story-001](./story-001-workspace-page-navigation.md) - 선행 Story

---

## 💡 구현 팁

### Backend
- PageRepository의 `findDescendants`는 PostgreSQL 재귀 CTE로 구현
- 순환 참조 확인은 이동 전에 하위 페이지를 조회하여 검증
- depth 재계산은 이동된 페이지와 모든 하위 페이지에 대해 수행
- order는 같은 부모 내에서 자동 증가 (maxOrder + 1)

### Frontend
- Optimistic update 패턴:
  1. `useTransition`으로 로딩 상태 관리
  2. Context에서 낙관적 상태 즉시 업데이트
  3. Server Action 호출
  4. 실패 시 이전 상태로 롤백 + 에러 토스트
- dnd-kit 사용 권장 (react-dnd보다 최신, 접근성 지원)
- PageTree의 드래그 프리뷰에 페이지 제목과 아이콘 표시

### Testing
- E2E 테스트에서 Optimistic update를 검증 (즉시 반영 + 롤백)
- 순환 참조 방지는 다양한 계층 깊이에서 테스트
- 드래그앤드롭은 Playwright의 `dragAndDrop` API 사용

---

**Story-004: Page 생성 및 계층 구조 관리 설계 완료!** 🎉

