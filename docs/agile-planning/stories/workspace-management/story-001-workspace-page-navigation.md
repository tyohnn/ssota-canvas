# Story 001: Workspace-Page 목록 조회 및 네비게이션

## 🎯 Story 개요

**User Story**: As a 조직 멤버, I want to 조직 페이지에 접근하여 모든 Workspace의 Page 목록을 확인하고 작업할 페이지를 선택할 수 있어야 so that 내가 작업하려는 페이지에 빠르게 접근할 수 있다

**Story Points**: 8  
**우선순위**: High (MVP 핵심 기능)  
**Epic**: Workspace Management - 기본 기능  
**Domain**: Workspace Management Domain (주 도메인)

**작성일**: 2025-10-11  
**예상 기간**: 3일

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 멤버가 조직 페이지에 처음 접근
```gherkin
Feature: 조직 페이지 초기 접근
  Scenario: 최근 방문 페이지가 있는 경우
    Given 사용자가 조직 멤버이다
    And 최근 방문한 페이지 쿠키가 존재한다
    When 조직 페이지 (/r/[orgId])에 접근한다
    Then 모든 Workspace-Page 목록이 사이드바에 표시된다
    And 최근 방문한 페이지가 자동으로 선택되어 메인 영역에 표시된다
    And 사이드바에 즐겨찾기 섹션이 최상단에 표시된다
```

### 시나리오 2: 최근 방문 페이지가 없는 경우 (Fallback)
```gherkin
Feature: 조직 페이지 초기 접근 (Fallback)
  Scenario: 최근 방문 페이지 쿠키가 없는 경우
    Given 사용자가 조직 멤버이다
    And 최근 방문한 페이지 쿠키가 없다
    When 조직 페이지 (/r/[orgId])에 접근한다
    Then Default Workspace의 첫 번째 페이지가 자동으로 선택된다
    And 선택된 페이지가 메인 영역에 표시된다
```

### 시나리오 3: 사용자가 다른 페이지를 선택
```gherkin
Feature: 페이지 선택 및 전환
  Scenario: 접근 권한이 있는 페이지 선택
    Given 사용자가 조직 페이지를 보고 있다
    And 사이드바에 Workspace-Page 목록이 표시되어 있다
    When 사용자가 접근 권한이 있는 페이지를 클릭한다
    Then 선택한 페이지가 메인 영역에 표시된다
    And 페이지 ID가 쿠키에 저장된다 (recent-page-${orgId})
    And 해당 페이지가 속한 Workspace가 자동으로 펼쳐진다
```

### 시나리오 4: 접근 권한이 없는 페이지 선택
```gherkin
Feature: 권한 없는 페이지 접근 시도
  Scenario: 일반 Workspace의 페이지에 접근 권한이 없는 경우
    Given 사용자가 조직 멤버이다
    And 특정 Workspace에 초대받지 않았다
    When 해당 Workspace의 페이지를 클릭한다
    Then "이 페이지에 접근할 수 없습니다" 메시지가 표시된다
    And Workspace 이름이 함께 표시된다
    And 페이지는 선택되지 않고 이전 페이지가 유지된다
```

### 시나리오 5: Workspace 및 페이지 접기/펼치기
```gherkin
Feature: 사이드바 트리 접기/펼치기
  Scenario: Workspace 접기/펼치기 상태 영속성
    Given 사용자가 Workspace를 펼치거나 접었다
    When 페이지를 새로고침한다
    Then 이전에 펼친/접은 상태가 유지된다 (로컬스토리지 기반)
    And 하위 페이지 트리의 펼침/접힘 상태도 유지된다
```

### 시나리오 6: 즐겨찾기 페이지 선택
```gherkin
Feature: 즐겨찾기 섹션에서 페이지 선택
  Scenario: 즐겨찾기한 페이지 클릭
    Given 사용자가 즐겨찾기한 페이지가 있다
    And 즐겨찾기 섹션이 사이드바 최상단에 표시되어 있다
    When 즐겨찾기 섹션에서 페이지를 클릭한다
    Then 해당 페이지가 메인 영역에 표시된다
    And 페이지가 속한 Workspace가 자동으로 펼쳐진다
    And Workspace 섹션에서도 해당 페이지가 하이라이트된다
```

---

## 📋 개발 Task (도메인별)

### Workspace Management Domain (주 도메인)

**참조 문서**: 
- [Process Model](../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 1
- [Software Design](../../event-domain-design/domains/workspace-management-domain/03-software-design.md)
- [User Flow](../../event-domain-design/domains/workspace-management-domain/03-user-flow.md)
- [Testing Strategy](../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md)
- [Technical Specification](../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)
- [Database Schema](../../event-domain-design/domains/workspace-management-domain/06-db-schema.md)
- [Frontend Specification](../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] **Workspace Aggregate** 구현
  - [ ] Workspace Entity 구현 (id, name, icon, description, isDefault)
  - [ ] WorkspaceId Value Object 구현
  - [ ] WorkspaceRepository 인터페이스 정의
  
- [ ] **Page Aggregate** 구현
  - [ ] Page Entity 구현 (id, title, icon, parentId, order)
  - [ ] PageId Value Object 구현
  - [ ] Materialized Path 로직 구현
  - [ ] PageRepository 인터페이스 정의

- [ ] **Read Model Service** 구현
  - [ ] OrganizationWorkspacePageView Read Model 구현
  - [ ] WorkspaceManagementService 구현 (권한 검증 + 데이터 조율)
  - [ ] 쿠키 기반 최근 방문 페이지 검증 로직

- [ ] **Repository 구현**
  - [ ] DrizzleWorkspaceRepository 구현 (Workspace 조회)
  - [ ] DrizzlePageRepository 구현 (Page 트리 조회)

#### Database
- [ ] **Drizzle Schema 정의**
  - [ ] workspaces 테이블 스키마 (드리즐 스키마 파일)
  - [ ] pages 테이블 스키마 (materialized_path, parent_id, order)
  - [ ] workspace_membership_status enum
  
- [ ] **Drizzle Migration 생성**
  - [ ] workspaces 테이블 migration
  - [ ] pages 테이블 migration
  - [ ] 인덱스 생성 (workspace_id, materialized_path, parent_id, order)

- [ ] **RLS 정책 적용**
  - [ ] workspaces 테이블 RLS (조직 멤버만 조회 가능)
  - [ ] pages 테이블 RLS (Workspace 멤버십 기반)

#### Server Actions
- [ ] **getWorkspacePagesAction**
  - 조직의 모든 Workspace-Page 데이터 조회
  - 권한 검증 (조직 멤버십)
  - 쿠키 기반 최근 방문 페이지 선택
  
- [ ] **getPageDetailsAction**
  - 페이지 상세 정보 조회
  - 권한 검증 (Workspace 멤버십)
  - AccessDeniedDTO 반환 (권한 없을 시)

#### Frontend
- [ ] **WorkspaceContext 구현**
  - useState로 workspaces, selectedPageId, expandedWorkspaces, expandedPages 관리
  - useEffect로 로컬스토리지 초기화
  - selectPage, toggleWorkspace, togglePage 액션
  
- [ ] **useWorkspace Hook 구현**
  - Context 소비 및 유틸리티 메서드 제공
  - favoritePages, selectedPage, selectedWorkspace computed 값
  
- [ ] **사이드바 컴포넌트 구현**
  - [ ] WorkspaceSidebarContent (SidebarGroup 래퍼)
  - [ ] FavoritePageList (즐겨찾기 섹션)
  - [ ] WorkspacePageTree (Workspace 섹션)
  - [ ] WorkspaceItem (개별 Workspace)
  
- [ ] **PageTree 컴포넌트 구현** (전용 설계)
  - [ ] page-tree.tsx (메인, @headless-tree/core 통합)
  - [ ] page-tree-context.tsx (Context)
  - [ ] page-tree-item.tsx (개별 페이지 렌더러)
  - [ ] page-tree-controls.tsx (Chevron 컨트롤)
  - [ ] use-page-tree-data.tsx (트리 데이터 변환)
  - [ ] utils.ts (flattenPageTree 유틸리티)
  
- [ ] **페이지 뷰어 컴포넌트**
  - [ ] PageViewer (메인 영역)
  - [ ] PageHeader (페이지 제목 및 메타)
  - [ ] AccessDeniedPage (권한 없음 화면)
  
- [ ] **유틸리티 함수**
  - [ ] Cookie Helpers (setCookie, getCookie, deleteCookie)
  - [ ] Storage Helpers (로컬스토리지 접기/펼치기 상태)

---

### Organization Management Domain (통합 도메인)

**참조 문서**: 
- [Technical Specification](../../event-domain-design/domains/organization-management-domain/05-technical-specification.md)

#### 통합 포인트
- [ ] **조직 멤버십 API** 연동
  - OrganizationRepository.isMember(organizationId, userId) 호출
  - Workspace Management Service에서 권한 검증 시 사용

---

### 도메인 간 통합

- [ ] **권한 검증 레이어** 구현
  - Organization 멤버십 확인 → Workspace 멤버십 확인 (순차적)
  - Default Workspace는 조직 멤버 자동 허용
  
- [ ] **쿠키 및 로컬스토리지 통합**
  - 쿠키: recent-page-${orgId} (최근 방문 페이지)
  - 로컬스토리지: workspace-collapsed-${workspaceId}, page-collapsed-${pageId}

---

### Testing & Quality

- [ ] **Unit Tests**
  - [ ] Workspace Aggregate 테스트 (생성, 불변식)
  - [ ] Page Aggregate 테스트 (Materialized Path 로직)
  - [ ] WorkspaceManagementService 테스트 (권한 검증 로직)
  - [ ] Repository 테스트 (Workspace, Page 조회)
  
- [ ] **Integration Tests**
  - [ ] getWorkspacePagesAction 테스트 (권한별 시나리오)
  - [ ] getPageDetailsAction 테스트 (권한 검증)
  - [ ] 쿠키 기반 최근 방문 페이지 Fallback 테스트
  
- [ ] **Frontend Tests**
  - [ ] WorkspaceContext 테스트 (상태 관리)
  - [ ] useWorkspace Hook 테스트 (유틸리티 메서드)
  - [ ] PageTree 컴포넌트 테스트 (트리 렌더링, 접기/펼치기)
  - [ ] 로컬스토리지 영속성 테스트
  
- [ ] **E2E Tests**
  - [ ] 조직 페이지 접근 → 최근 방문 페이지 자동 선택
  - [ ] 페이지 선택 → 쿠키 저장 → 새로고침 → 페이지 복원
  - [ ] Workspace 접기/펼치기 → 새로고침 → 상태 복원
  - [ ] 권한 없는 페이지 접근 → Access Denied 화면
  
- [ ] **성능 테스트**
  - [ ] 100개 Workspace + 1000개 Page 렌더링 성능
  - [ ] PageTree 스크롤 성능 (가상 스크롤 필요 여부 검증)

---

## 🎯 Definition of Done

### 기능 완료
- [ ] 조직 멤버가 조직 페이지에 접근하면 모든 Workspace-Page 목록이 사이드바에 표시됨
- [ ] 최근 방문한 페이지가 자동으로 선택되어 메인 영역에 표시됨
- [ ] 페이지 선택 시 쿠키에 저장되고 새로고침 시 복원됨
- [ ] 권한 없는 페이지 접근 시 Access Denied 화면 표시
- [ ] Workspace 및 페이지 접기/펼치기 상태가 로컬스토리지에 저장되고 새로고침 시 복원됨
- [ ] 즐겨찾기 섹션에서 페이지 선택 시 해당 Workspace가 자동으로 펼쳐짐
- [ ] UI/UX가 Frontend Specification 및 User Flow를 준수함

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상 (Aggregate, Service, Repository)
- [ ] Integration Tests 통과 (Server Actions, 권한 검증)
- [ ] Frontend Tests 통과 (Context, Hook, Components)
- [ ] E2E Tests 통과 (전체 사용자 플로우)
- [ ] 코드 리뷰 완료 (시니어 개발자 승인)
- [ ] 성능 요구사항 충족 (1000개 페이지 렌더링 < 1초)

### 품질 완료
- [ ] RLS 정책 적용 완료 (workspaces, pages 테이블)
- [ ] 권한 검증 로직 구현 완료 (조직 멤버십 → Workspace 멤버십)
- [ ] 접근성 기준 충족 (키보드 내비게이션, ARIA 속성)
- [ ] 보안 취약점 0개 (권한 우회 불가, XSS 방지)
- [ ] 로컬스토리지 및 쿠키 데이터 검증 (악의적 데이터 방어)

---

## 📊 진행 상황

**현재**: 0% 완료 (설계 완료, 구현 대기 중)

**예상 일정**:
- Day 1: Backend 구현 (Aggregate, Repository, Service, Server Actions)
- Day 2: Database 구현 (Schema, Migration, RLS) + Frontend 구현 시작 (Context, Hook, PageTree)
- Day 3: Frontend 구현 완료 (컴포넌트) + 테스트 (Unit, Integration, E2E)

---

## 🔗 의존성

**선행 Story**: 
- 없음 (Workspace Management Domain의 첫 번째 Story, MVP 핵심 기능)

**후행 Story**: 
- Story-002: Workspace 생성 및 관리
- Story-003: Page 생성 및 관리
- Story-004: Page 이동 및 정렬 (드래그앤드롭)

**도메인 의존성**: 
- Workspace Management ← Organization Management (조직 멤버십 확인)

---

## 📁 관련 문서

### Domain Documentation

**Workspace Management Domain**:
- [Process Model](../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 1: 조직 접근 및 Workspace-Page 목록 조회
- [Software Design](../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - Workspace Aggregate, Page Aggregate, OrganizationWorkspacePageView Read Model
- [User Flow](../../event-domain-design/domains/workspace-management-domain/03-user-flow.md) - Screen 1-4 (로딩, 메인, 페이지 로딩, 권한 없음)
- [Testing Strategy](../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md) - Scenario 1 테스트 전략
- [Technical Specification](../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - 구현 가이드 (Aggregate, Repository, Service)
- [Database Schema](../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - workspaces, pages 테이블 DDL
- [Frontend Specification](../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md) - WorkspaceContext, PageTree, 컴포넌트 구조

**Organization Management Domain**:
- [Technical Specification](../../event-domain-design/domains/organization-management-domain/05-technical-specification.md) - 조직 멤버십 API

---

## 💡 구현 시 주의사항

### 성능 최적화
- **PageTree 렌더링**: @headless-tree/core를 활용하여 대량의 페이지도 효율적으로 렌더링
- **로컬스토리지 읽기**: 초기화 시 한 번만 읽고 Context에 캐시
- **쿠키 검증**: Server Component에서 한 번만 검증, 클라이언트에서 재검증 X

### 보안
- **권한 검증 순서**: Organization 멤버십 → Workspace 멤버십 (순차적)
- **쿠키 검증**: 최근 방문 페이지 ID가 실제로 존재하고 접근 가능한지 검증
- **로컬스토리지 검증**: expandedWorkspaces/Pages가 실제 Workspace/Page ID인지 검증

### 사용자 경험
- **로딩 상태**: Skeleton UI를 사용하여 로딩 상태 표시
- **에러 처리**: 권한 없음, 네트워크 오류 등 명확한 에러 메시지
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 대응

### 테스트 전략
- **권한 시나리오**: 조직 멤버 / 비멤버, Workspace 멤버 / 비멤버 조합 테스트
- **Fallback 시나리오**: 쿠키 없음, 쿠키 무효, Default Workspace 없음 등
- **영속성 테스트**: 쿠키 / 로컬스토리지 저장 → 새로고침 → 복원 확인

---

## 🚀 구현 가이드

### Backend 구현 순서
1. **Aggregate & Entity**: Workspace, Page Aggregate 구현 (도메인 로직)
2. **Repository**: DrizzleWorkspaceRepository, DrizzlePageRepository 구현
3. **Service**: WorkspaceManagementService 구현 (권한 검증 + Read Model 조합)
4. **Server Actions**: getWorkspacePagesAction, getPageDetailsAction 구현

### Database 구현 순서
1. **Drizzle Schema**: workspaces, pages 테이블 스키마 정의
2. **Migration**: Drizzle migration 생성 및 실행
3. **RLS 정책**: Supabase RLS 정책 적용

### Frontend 구현 순서
1. **Context & Hook**: WorkspaceContext, useWorkspace Hook 구현
2. **PageTree**: PageTree 전용 컴포넌트 구현 (7개 파일)
3. **사이드바 컴포넌트**: WorkspaceSidebarContent, FavoritePageList, WorkspacePageTree, WorkspaceItem
4. **페이지 뷰어**: PageViewer, PageHeader, AccessDeniedPage
5. **유틸리티**: Cookie Helpers, Storage Helpers

### 테스트 구현 순서
1. **Unit Tests**: Aggregate, Service, Repository (독립적 로직)
2. **Integration Tests**: Server Actions, 권한 검증 (도메인 통합)
3. **Frontend Tests**: Context, Hook, Components (React 컴포넌트)
4. **E2E Tests**: 전체 사용자 플로우 (Playwright)

---

이 Story를 따라 Workspace Management Domain의 첫 번째 핵심 기능을 구현할 수 있습니다! 🎨

