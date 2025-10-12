# Story 002: Workspace 생성 및 정보 수정

## 🎯 Story 개요

**User Story**: As a 조직 소유자, I want to 새로운 Workspace를 생성하고 기존 Workspace의 정보를 수정할 수 있어야 so that 팀별로 작업 공간을 구성하고 관리할 수 있다

**Story Points**: 5  
**우선순위**: High (MVP 핵심 기능)  
**Epic**: Workspace Management - 기본 기능  
**Domain**: Workspace Management Domain (주 도메인)

**작성일**: 2025-10-11  
**예상 기간**: 2일

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 소유자가 Workspace를 생성

```gherkin
Feature: Workspace 생성
  Scenario: 소유자가 비어있지 않은 Workspace 생성
    Given 사용자가 조직 소유자이다
    When "새 워크스페이스 만들기" 다이얼로그를 연다
    And 워크스페이스 이름 "마케팅 팀"을 입력한다
    And 설명 "마케팅 캠페인 및 콘텐츠 관리"를 입력한다
    And 아이콘 "🎨"를 선택한다
    And 생성 버튼을 클릭한다
    Then 새 워크스페이스가 생성된다
    And "Welcome" 페이지가 자동으로 생성된다
    And 소유자에게 워크스페이스 멤버십이 부여된다
    And 사용자가 생성된 "Welcome" 페이지로 이동한다
    And 성공 토스트 메시지가 표시된다
```

### 시나리오 2: 폼 유효성 검증

```gherkin
Feature: Workspace 생성 폼 검증
  Scenario: 워크스페이스 이름이 비어있는 경우
    Given 사용자가 "새 워크스페이스 만들기" 다이얼로그를 연 상태이다
    When 워크스페이스 이름을 입력하지 않는다
    And 생성 버튼을 클릭한다
    Then "워크스페이스 이름을 입력해주세요" 에러 메시지가 표시된다
    And 워크스페이스가 생성되지 않는다
  
  Scenario: 워크스페이스 이름이 너무 긴 경우
    Given 사용자가 "새 워크스페이스 만들기" 다이얼로그를 연 상태이다
    When 워크스페이스 이름을 101자 이상 입력한다
    Then "100자 이내로 입력해주세요" 에러 메시지가 표시된다
    And 생성 버튼이 비활성화된다
```

### 시나리오 3: 워크스페이스 정보 수정

```gherkin
Feature: Workspace 정보 수정
  Scenario: 소유자 또는 Admin이 Workspace 정보 수정
    Given 사용자가 조직 소유자 또는 Admin이다
    And Workspace의 멤버이다
    When 워크스페이스 컨텍스트 메뉴를 연다
    And "워크스페이스 설정"을 클릭한다
    And 워크스페이스 이름을 "개발 팀"으로 변경한다
    And 설명을 "제품 개발 및 기술 문서"로 변경한다
    And 아이콘을 "💻"로 변경한다
    And 저장 버튼을 클릭한다
    Then 워크스페이스 정보가 업데이트된다
    And 사이드바의 워크스페이스 이름이 즉시 반영된다
    And 성공 토스트 메시지가 표시된다
```

### 시나리오 4: 권한 없는 사용자의 접근 차단

```gherkin
Feature: 권한 없는 사용자 차단
  Scenario: 일반 멤버가 Workspace 생성 시도
    Given 사용자가 조직의 일반 멤버이다
    Then "새 워크스페이스 만들기" 버튼이 표시되지 않는다
  
  Scenario: 멤버가 아닌 사용자의 Workspace 수정 시도
    Given 사용자가 Workspace의 멤버가 아니다
    When updateWorkspaceInfoAction을 호출한다
    Then "접근 권한이 없습니다" 에러가 반환된다
    And 워크스페이스 정보가 변경되지 않는다
```

---

## 📋 개발 Task (도메인별)

### Workspace Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 2

#### Backend Implementation
- [ ] WorkspaceAggregate 구현
  - [ ] `create` 메서드 (이름, 설명, 아이콘 검증)
  - [ ] `updateInfo` 메서드 (정보 수정)
  - [ ] 불변식: 이름 1-100자, 설명 최대 500자
- [ ] Workspace Entity 구현 (VO 포함)
- [ ] WorkspaceRepository 구현
  - [ ] `save(workspace)` - 생성 및 업데이트
  - [ ] `findById(id)` - 조회
  - [ ] `findByOrganizationId(orgId)` - 조직별 조회
- [ ] WorkspaceMemberRepository 구현
  - [ ] `save(member)` - 멤버십 추가
  - [ ] `findByWorkspaceAndUser` - 권한 확인
- [ ] PageRepository 확장
  - [ ] `save(page)` - Welcome 페이지 생성

#### Database
- [ ] `workspaces` 테이블 (이미 존재, Story-001에서 생성)
- [ ] `workspace_members` 테이블 (이미 존재)
- [ ] `pages` 테이블 (이미 존재)
- [ ] RLS 정책 적용 (creator-only)

#### Server Actions
- [ ] `createWorkspaceAction`
  - 입력: CreateWorkspaceRequest (name, description?, icon?)
  - 출력: CreateWorkspaceResponse (workspaceId, initialPageId)
  - 권한: 조직 소유자만
  - 로직: Workspace 생성 → Welcome Page 생성 → 멤버십 추가 → 초기 페이지로 이동
- [ ] `updateWorkspaceInfoAction`
  - 입력: UpdateWorkspaceInfoRequest (workspaceId, name?, description?, icon?)
  - 출력: Result<void>
  - 권한: 조직 소유자/Admin + 워크스페이스 멤버
  - 로직: Workspace 정보 수정 → 캐시 무효화

#### Service Layer
- [ ] WorkspaceManagementService 구현
  - [ ] `createWorkspace` 메서드 (Workspace + 초기 Page 생성)
  - [ ] `updateWorkspaceInfo` 메서드

#### Frontend
- [ ] CreateWorkspaceDialog 컴포넌트
  - react-hook-form + zod 유효성 검증
  - 이름 (필수, 1-100자)
  - 설명 (선택, 최대 500자, 글자 수 표시)
  - IconPicker (기본 아이콘 6개 + 더보기)
  - 성공 시 자동 페이지 이동
- [ ] WorkspaceSettingsDialog 컴포넌트
  - 기존 정보 미리 채움
  - react-hook-form isDirty로 변경 감지
  - 변경사항 없으면 저장 버튼 비활성화
- [ ] WorkspaceContextMenu 컴포넌트
  - "멤버 추가", "워크스페이스 설정", "보관" 메뉴
  - 권한별 메뉴 표시 제어
- [ ] IconPicker 컴포넌트 (공통)
  - 기본 아이콘 버튼 배열
  - Popover로 전체 이모지 선택
- [ ] WorkspaceIcon 컴포넌트 (공통)
  - 이모지/이미지 자동 감지
  - 기본 아이콘 폴백
- [ ] WorkspaceContext 확장
  - `createWorkspace` 액션 추가
  - `updateWorkspaceInfo` 액션 추가
- [ ] useWorkspace Hook 확장
  - `canCreateWorkspace` 유틸리티 (조직 소유자 검증)

---

### 도메인 간 통합
- [ ] Organization Domain 통합
  - [ ] 조직 소유자 권한 확인 (OrganizationMemberRepository)
  - [ ] 조직 멤버십 검증
- [ ] Page Domain 통합 (내부)
  - [ ] Welcome Page 자동 생성 (createWorkspace 시)

---

### Testing & Quality

#### Unit Tests
- [ ] WorkspaceAggregate 테스트
  - [ ] `create` 메서드 성공 케이스
  - [ ] 이름 길이 검증 (0자, 101자)
  - [ ] `updateInfo` 메서드 성공 케이스
  - [ ] 정보 수정 불변식 검증
- [ ] Command/Event 테스트
  - [ ] CreateWorkspaceCommand 생성 및 검증
  - [ ] WorkspaceCreated 이벤트 발행
  - [ ] UpdateWorkspaceInfoCommand 검증

#### Integration Tests
- [ ] Server Actions 테스트
  - [ ] `createWorkspaceAction` 성공 (소유자)
  - [ ] `createWorkspaceAction` 실패 (일반 멤버)
  - [ ] `createWorkspaceAction` 유효성 검증 실패
  - [ ] `updateWorkspaceInfoAction` 성공 (소유자/Admin)
  - [ ] `updateWorkspaceInfoAction` 실패 (권한 없음)
  - [ ] Welcome Page 자동 생성 확인
- [ ] Repository 테스트
  - [ ] Workspace 생성 및 조회
  - [ ] Workspace 정보 업데이트
  - [ ] 멤버십 추가

#### E2E Tests
- [ ] Workspace 생성 플로우
  - [ ] 사이드바에서 + 버튼 클릭
  - [ ] 폼 입력 및 제출
  - [ ] 생성된 Welcome 페이지로 이동 확인
  - [ ] 사이드바에 새 Workspace 표시 확인
- [ ] Workspace 정보 수정 플로우
  - [ ] 컨텍스트 메뉴 열기
  - [ ] 정보 수정 및 저장
  - [ ] 사이드바 즉시 반영 확인
- [ ] 권한 검증
  - [ ] 일반 멤버에게 + 버튼 미표시 확인
  - [ ] 멤버가 아닌 사용자의 수정 시도 차단

---

## 🎯 Definition of Done

### 기능 완료
- [ ] 조직 소유자가 Workspace를 생성할 수 있다
- [ ] 생성 시 Welcome Page가 자동으로 생성된다
- [ ] 소유자/Admin이 Workspace 정보를 수정할 수 있다
- [ ] 사이드바에 Workspace가 실시간 반영된다
- [ ] 권한이 없는 사용자는 생성/수정할 수 없다

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] Integration Tests 통과 (12개 이상)
- [ ] E2E Tests 통과 (3개 시나리오)
- [ ] 코드 리뷰 완료
- [ ] react-hook-form + zod 유효성 검증 적용

### 품질 완료
- [ ] RLS 정책 적용 (creator-only)
- [ ] Application-level 권한 검증 완료
- [ ] toast 피드백 메시지 적용
- [ ] 접근성 기준 충족 (Form 라벨, 에러 메시지)
- [ ] Optimistic update 미적용 (서버 응답 후 업데이트)

---

## 📊 진행 상황

**현재**: 0% 완료 (설계 완료, 구현 대기 중)

**진행 단계**:
- [x] Event Storming 완료
- [x] Process Model 완료 (Scenario 2)
- [x] Software Design 완료
- [x] User Flow 완료 (6개 Screen)
- [x] Testing Strategy 완료
- [x] Technical Specification 완료
- [x] Frontend Specification 완료
- [x] Database Schema 완료
- [ ] Backend 구현 대기
- [ ] Frontend 구현 대기
- [ ] 테스트 작성 대기

---

## 🔗 의존성

### 선행 Story
- **Story-001**: Workspace-Page 목록 조회 (WorkspaceContext, 기본 UI)

### 후행 Story
- **Story-003**: Workspace 멤버 초대 (WorkspaceContextMenu 확장)
- **Story-004**: Page 생성 및 관리 (Page 엔티티 활용)

### 도메인 의존성
- **Organization Management Domain**: 조직 소유자 권한 확인, 멤버십 검증
- **Workspace Management Domain**: Page 자동 생성 (내부 통합)

---

## 📁 관련 문서

### Domain Documentation
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 2
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - WorkspaceAggregate
- [User Flow](../../../event-domain-design/domains/workspace-management-domain/03-user-flow.md) - Screen 2~7
- [Testing Strategy](../../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md) - Scenario 2 테스트
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md) - 컴포넌트 설계
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - workspaces 테이블

### Agile Planning
- [Epic 문서](../../epics/epic-002-workspace-page-management.md)
- [Story-001](./story-001-workspace-page-navigation.md) - 선행 Story

---

## 💡 구현 팁

### Backend
- WorkspaceAggregate의 `create` 메서드에서 Welcome Page를 자동 생성하는 로직은 WorkspaceManagementService에서 처리
- Workspace 생성 시 트랜잭션으로 Workspace + Page + Membership을 한 번에 처리
- 실패 시 롤백하여 일관성 보장

### Frontend
- CreateWorkspaceDialog는 Organization의 CreateOrganizationDialog 패턴 참고
- react-hook-form의 `form.reset()`으로 성공 시 폼 초기화
- IconPicker는 공통 컴포넌트로 작성하여 재사용

### Testing
- E2E 테스트에서 Welcome Page 생성 및 이동을 함께 검증
- 권한 테스트는 다양한 역할(소유자, Admin, 멤버, 비멤버)에 대해 수행

---

**Story-002: Workspace 생성 및 정보 수정 설계 완료!** 🎉

