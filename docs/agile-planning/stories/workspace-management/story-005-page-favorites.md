# Story 005: 페이지 즐겨찾기 토글

## 🎯 Story 개요

**User Story**: As a Workspace 멤버, I want to 자주 사용하는 페이지를 즐겨찾기에 추가/제거할 수 있어야 so that 자주 사용하는 페이지에 빠르게 접근할 수 있다

**Story Points**: 3  
**우선순위**: Medium (UX 향상 기능)  
**Epic**: Workspace Management - UX 향상  
**Domain**: Workspace Management Domain (주 도메인)

**작성일**: 2025-10-11  
**예상 기간**: 1일

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: Page Header에서 즐겨찾기 추가

```gherkin
Feature: 즐겨찾기 추가
  Scenario: 사용자가 페이지를 즐겨찾기에 추가
    Given 사용자가 Workspace 멤버이다
    And 페이지를 보고 있다
    And 해당 페이지가 즐겨찾기에 추가되지 않은 상태이다
    When Page Header의 별 아이콘을 클릭한다
    Then 별 아이콘이 채워진 상태로 변경된다
    And 즐겨찾기 레코드가 생성된다
    And 사이드바의 "즐겨찾기" 섹션에 페이지가 추가된다
    And Optimistic update로 즉시 반영된다
```

### 시나리오 2: Page Header에서 즐겨찾기 제거

```gherkin
Feature: 즐겨찾기 제거
  Scenario: 사용자가 즐겨찾기에서 페이지를 제거
    Given 사용자가 Workspace 멤버이다
    And 페이지를 보고 있다
    And 해당 페이지가 이미 즐겨찾기에 추가된 상태이다
    When Page Header의 채워진 별 아이콘을 클릭한다
    Then 별 아이콘이 빈 상태로 변경된다
    And 즐겨찾기 레코드가 삭제된다
    And 사이드바의 "즐겨찾기" 섹션에서 페이지가 제거된다
    And Optimistic update로 즉시 반영된다
```

### 시나리오 3: 사이드바 즐겨찾기 섹션 업데이트

```gherkin
Feature: 사이드바 즐겨찾기 섹션
  Scenario: 즐겨찾기 추가 시 사이드바 업데이트
    Given 사용자가 "마케팅 계획" 페이지를 즐겨찾기에 추가했다
    Then 사이드바의 "즐겨찾기" 섹션에 "마케팅 계획"이 표시된다
    And 페이지 아이콘과 제목이 표시된다
    And 클릭 시 해당 페이지로 이동한다
  
  Scenario: 즐겨찾기 제거 시 사이드바 업데이트
    Given 사이드바의 "즐겨찾기" 섹션에 "마케팅 계획"이 있다
    When 사용자가 "마케팅 계획" 페이지에서 즐겨찾기를 제거한다
    Then 사이드바의 "즐겨찾기" 섹션에서 "마케팅 계획"이 제거된다
```

### 시나리오 4: 즐겨찾기 빈 상태

```gherkin
Feature: 즐겨찾기 빈 상태
  Scenario: 즐겨찾기가 하나도 없는 경우
    Given 사용자가 Workspace 멤버이다
    And 사용자가 즐겨찾기에 추가한 페이지가 없다
    Then 사이드바의 "즐겨찾기" 섹션이 비어있다
    And "즐겨찾기한 페이지가 없습니다" 메시지가 표시된다
```

### 시나리오 5: 권한 검증

```gherkin
Feature: 권한 없는 사용자 차단
  Scenario: Workspace 멤버가 아닌 사용자의 즐겨찾기 시도
    Given 사용자가 Workspace 멤버가 아니다
    When togglePageFavoriteAction을 호출한다
    Then "접근 권한이 없습니다" 에러가 반환된다
    And 즐겨찾기가 추가/제거되지 않는다
```

---

## 📋 개발 Task (도메인별)

### Workspace Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 5

#### Backend Implementation
- [ ] PageAggregate 확장
  - [ ] `toggleFavorite` 메서드 (userId)
  - [ ] 불변식: Workspace 멤버만 즐겨찾기 추가/제거 가능
- [ ] PageFavorite Entity 구현 (VO 포함)
  - [ ] id, pageId, userId, workspaceId
- [ ] PageFavoriteRepository 구현
  - [ ] `save(favorite)` - 즐겨찾기 추가
  - [ ] `delete(pageId, userId)` - 즐겨찾기 제거
  - [ ] `findByUser(userId, workspaceId)` - 사용자별 즐겨찾기 목록
  - [ ] `existsByPageAndUser(pageId, userId)` - 즐겨찾기 여부 확인

#### Database
- [ ] `page_favorites` 테이블 (이미 존재, Story-001에서 생성)
  - [ ] 컬럼: page_id, user_id, workspace_id, created_at
  - [ ] UNIQUE 제약: (page_id, user_id)
- [ ] RLS 정책 적용
  - [ ] SELECT: 본인의 즐겨찾기만 조회
  - [ ] INSERT/DELETE: 본인의 즐겨찾기만 추가/제거

#### Server Actions
- [ ] `togglePageFavoriteAction`
  - 입력: { pageId }
  - 출력: Result<{ isFavorite: boolean }>
  - 권한: Workspace 멤버
  - 로직: 
    1. 즐겨찾기 여부 확인
    2. 존재하면 제거, 없으면 추가
    3. Optimistic update

#### Service Layer
- [ ] WorkspaceManagementService 확장
  - [ ] `togglePageFavorite` 메서드

#### Frontend
- [ ] PageHeader 컴포넌트 확장
  - Star 아이콘 추가 (제목 좌측)
  - 즐겨찾기 여부에 따라 채워진/빈 아이콘 표시
  - 클릭 시 togglePageFavorite 호출
  - Optimistic update 적용
- [ ] FavoritePageList 컴포넌트 확장
  - 사용자별 즐겨찾기 페이지 목록 표시
  - 페이지 아이콘 + 제목
  - 클릭 시 페이지 이동
  - 빈 상태 처리 ("즐겨찾기한 페이지가 없습니다")
- [ ] WorkspaceContext 확장
  - `togglePageFavorite` 액션 (Optimistic update)
  - favorites 상태 관리 (Set<pageId>)
  - Optimistic update 패턴:
    1. favorites Set 즉시 업데이트 (add/delete)
    2. Server Action 호출
    3. 성공: 상태 유지
    4. 실패: 이전 상태 롤백 + 에러 토스트
- [ ] useWorkspace Hook 확장
  - `isFavorite(pageId)` 유틸리티

---

### 도메인 간 통합
- [ ] Workspace → Page 통합 (내부)
  - [ ] Workspace 멤버십 확인

---

### Testing & Quality

#### Unit Tests
- [ ] PageAggregate 테스트
  - [ ] `toggleFavorite` 메서드 성공 (추가)
  - [ ] `toggleFavorite` 메서드 성공 (제거)
- [ ] Command/Event 테스트
  - [ ] TogglePageFavoriteCommand
  - [ ] PageFavoriteToggled 이벤트

#### Integration Tests
- [ ] Server Actions 테스트
  - [ ] `togglePageFavoriteAction` 성공 (추가)
  - [ ] `togglePageFavoriteAction` 성공 (제거)
  - [ ] `togglePageFavoriteAction` 실패 (권한 없음)
  - [ ] UNIQUE 제약 확인 (중복 추가 방지)
- [ ] Repository 테스트
  - [ ] PageFavorite 생성, 조회, 삭제
  - [ ] existsByPageAndUser 확인
  - [ ] findByUser (사용자별 즐겨찾기 목록)

#### E2E Tests
- [ ] 즐겨찾기 추가 플로우
  - [ ] Page Header에서 별 아이콘 클릭
  - [ ] 아이콘 상태 변경 확인
  - [ ] 사이드바에 즐겨찾기 추가 확인
  - [ ] Optimistic update 확인
- [ ] 즐겨찾기 제거 플로우
  - [ ] Page Header에서 별 아이콘 클릭
  - [ ] 아이콘 상태 변경 확인
  - [ ] 사이드바에서 즐겨찾기 제거 확인
  - [ ] Optimistic update 확인
- [ ] 사이드바 즐겨찾기 섹션
  - [ ] 즐겨찾기 목록 표시 확인
  - [ ] 클릭 시 페이지 이동 확인
  - [ ] 빈 상태 표시 확인

---

## 🎯 Definition of Done

### 기능 완료
- [ ] Workspace 멤버가 페이지를 즐겨찾기에 추가/제거할 수 있다
- [ ] Page Header에 별 아이콘이 표시된다
- [ ] 별 아이콘 클릭 시 즐겨찾기 상태가 토글된다
- [ ] 사이드바의 "즐겨찾기" 섹션에 즐겨찾기 목록이 표시된다
- [ ] Optimistic update로 즉각 반응하는 UI가 제공된다
- [ ] 빈 상태 처리가 되어 있다
- [ ] 권한이 없는 사용자는 즐겨찾기할 수 없다

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] Integration Tests 통과 (8개 이상)
- [ ] E2E Tests 통과 (3개 시나리오)
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] RLS 정책 적용 (본인의 즐겨찾기만)
- [ ] Application-level 권한 검증 (Workspace 멤버)
- [ ] UNIQUE 제약으로 중복 방지
- [ ] Optimistic update 패턴 적용 (성공/실패 처리)
- [ ] 접근성 기준 충족 (별 아이콘 aria-label)
- [ ] 성능 최적화 (Context에서 Set으로 관리)

---

## 📊 진행 상황

**현재**: 0% 완료 (설계 완료, 구현 대기 중)

**진행 단계**:
- [x] Event Storming 완료
- [x] Process Model 완료 (Scenario 5)
- [x] Software Design 완료
- [x] User Flow 완료 (3개 Screen)
- [x] Testing Strategy 완료
- [x] Technical Specification 완료
- [x] Frontend Specification 완료
- [x] Database Schema 완료 (page_favorites 테이블)
- [ ] Backend 구현 대기
- [ ] Frontend 구현 대기
- [ ] 테스트 작성 대기

---

## 🔗 의존성

### 선행 Story
- **Story-001**: Workspace-Page 목록 조회 (FavoritePageList, WorkspaceContext)
- **Story-004**: Page 관리 (PageHeader 기반)

### 후행 Story
- 없음 (독립적 기능)

### 도메인 의존성
- **Workspace Management Domain**: Workspace 멤버십 확인

---

## 📁 관련 문서

### Domain Documentation
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 5
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - PageAggregate
- [User Flow](../../../event-domain-design/domains/workspace-management-domain/03-user-flow.md) - Screen 24~26
- [Testing Strategy](../../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md) - Scenario 5 테스트
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md) - 컴포넌트 설계
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - page_favorites 테이블

### Agile Planning
- [Epic 문서](../../epics/epic-002-workspace-page-management.md)
- [Story-001](./story-001-workspace-page-navigation.md) - 선행 Story
- [Story-004](./story-004-page-hierarchy-management.md) - 선행 Story

---

## 💡 구현 팁

### Backend
- PageFavoriteRepository의 `save`와 `delete`는 UNIQUE 제약을 활용
- `togglePageFavorite`는 `existsByPageAndUser`로 먼저 확인 후 추가/제거
- RLS 정책으로 다른 사용자의 즐겨찾기 접근 차단

### Frontend
- Optimistic update 패턴:
  1. Context의 favorites Set 즉시 업데이트
  2. Star 아이콘 즉시 변경
  3. Server Action 호출
  4. 실패 시 이전 상태로 롤백 + 에러 토스트
- favorites는 Set<pageId>로 관리하여 O(1) 조회
- FavoritePageList는 빈 상태 처리 ("즐겨찾기한 페이지가 없습니다")

### Testing
- E2E 테스트에서 Optimistic update를 검증 (즉시 반영 + 롤백)
- 사이드바 즐겨찾기 섹션 업데이트를 함께 검증

---

**Story-005: 페이지 즐겨찾기 토글 설계 완료!** 🎉

