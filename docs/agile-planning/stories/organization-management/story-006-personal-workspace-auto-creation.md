# Story 006: 개인 워크스페이스 자동 생성

## 🎯 Story 개요
**User Story**: As a 조직 멤버 I want to 자동으로 생성된 개인 워크스페이스를 가져야 so that 개인 작업 공간을 확보할 수 있다

**Story Points**: 5  
**우선순위**: High  
**Epic**: [Epic-001: User Management](../../epics/epic-001-user-management.md)  
**Domain**: Organization Management Domain (주), Workspace Management Domain (통합)

**작성일**: 2025-10-15  
**상태**: 📋 구현 대기 중

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 생성 시 개인 워크스페이스 자동 생성
```gherkin
Given 로그인된 사용자가 있다
When 새로운 조직을 생성한다
Then 조직이 생성된다
And Default Workspace가 자동으로 생성된다
And 소유자의 개인 워크스페이스가 자동으로 생성된다
And 개인 워크스페이스는 is_personal=true로 설정된다
And 개인 워크스페이스의 owner_id는 소유자 ID로 설정된다
And 개인 워크스페이스는 초대 버튼이 비활성화된다
And 워크스페이스 목록에 두 개의 워크스페이스가 표시된다
```

### 시나리오 2: 초대 승낙 시 개인 워크스페이스 자동 생성
```gherkin
Given 조직에 초대받은 사용자가 있다
When 초대를 승낙한다
Then 조직 멤버로 추가된다
And 해당 멤버의 개인 워크스페이스가 자동으로 생성된다
And 개인 워크스페이스는 is_personal=true로 설정된다
And 개인 워크스페이스의 owner_id는 해당 멤버 ID로 설정된다
And 개인 워크스페이스는 해당 멤버만 접근 가능하다
And 개인 워크스페이스는 초대 버튼이 비활성화된다
And 알림이 읽음 처리된다
```

### 시나리오 3: 개인 워크스페이스 접근 제한 확인
```gherkin
Given 사용자의 개인 워크스페이스가 있다
When 사용자가 개인 워크스페이스에 접근한다
Then 워크스페이스 내용이 표시된다
And 초대 버튼이 비활성화되어 있다
And 프라이버시 배지가 "개인 전용"으로 표시된다

When 다른 멤버가 해당 개인 워크스페이스에 접근을 시도한다
Then 접근이 거부된다
And "권한이 없습니다" 오류 메시지가 표시된다
```

### 시나리오 4: 워크스페이스 종류 구분 UI
```gherkin
Given 사용자가 조직에 속해 있다
When 워크스페이스 목록을 확인한다
Then Default Workspace에는 특별한 배지가 없다
And 일반 워크스페이스에는 특별한 배지가 없다
And 개인 워크스페이스에는 "개인 전용" 배지가 표시된다
And 개인 워크스페이스의 초대 버튼은 비활성화되어 있다
And 개인 워크스페이스는 자신만 볼 수 있다
```

---

## 📋 개발 Task (도메인별)

### Organization Management Domain
**참조 문서**: 
- [Process Model](../../../event-domain-design/domains/organization-management-domain/02-process-model.md) - Scenario 1, 2
- [Software Design](../../../event-domain-design/domains/organization-management-domain/03-software-design.md) - Organization Aggregate
- [Technical Specification](../../../event-domain-design/domains/organization-management-domain/05-technical-specification.md) - OrganizationCrudService, OrganizationInvitationService
- [Database Schema](../../../event-domain-design/domains/organization-management-domain/06-db-schema.md) - 통합 섹션
- [Frontend Specification](../../../event-domain-design/domains/organization-management-domain/07-frontend-specification.md) - 조직 생성 UI

#### Backend Implementation
- [ ] OrganizationCrudService.createOrganization 업데이트
  - [ ] WorkspaceCrudService.createPersonalWorkspace 호출 추가 (소유자용)
  - [ ] 개인 워크스페이스 생성 실패 시 롤백 로직
  - [ ] 반환 타입에 개인 워크스페이스 정보 포함
- [ ] OrganizationCrudService.createDefaultOrganization 업데이트
  - [ ] WorkspaceCrudService.createPersonalWorkspace 호출 추가 (소유자용)
  - [ ] 개인 워크스페이스 생성 실패 시 롤백 로직
  - [ ] 반환 타입에 개인 워크스페이스 정보 포함
- [ ] OrganizationInvitationService.acceptInvitation 업데이트
  - [ ] WorkspaceCrudService.createPersonalWorkspace 호출 추가 (새 멤버용)
  - [ ] 개인 워크스페이스 생성 실패 시 롤백 로직
  - [ ] owner_id를 새 멤버 ID로 설정

#### Server Actions
- [ ] createOrganizationAction 반환 타입 업데이트
  - [ ] personalWorkspace 정보 포함
- [ ] createDefaultOrganizationAction 반환 타입 업데이트
  - [ ] personalWorkspace 정보 포함
- [ ] acceptInvitationAction 업데이트
  - [ ] 개인 워크스페이스 생성 확인

#### Frontend
- [ ] **DTO 업데이트**
  - [ ] `WorkspaceWithPagesDTO`에 `isPersonal: boolean`, `ownerId: string | null` 추가
  - [ ] `WorkspaceDTO`에 동일 필드 추가
  - [ ] Backend 응답과 매핑 확인
- [ ] **사이드바 구조 변경** (3개 섹션으로 분리)
  - [ ] `WorkspaceSidebarContent` 수정
    - [ ] Favorites 섹션 (기존 유지)
    - [ ] Workspaces 섹션 (Default + 일반 워크스페이스만)
    - [ ] Personal Workspaces 섹션 (개인 워크스페이스만)
  - [ ] 워크스페이스 필터링 로직 추가 (`isPersonal` 기반)
- [ ] **WorkspaceContextMenu 업데이트**
  - [ ] `disableInvite` prop 추가
  - [ ] 개인 워크스페이스는 초대 메뉴 완전히 제거
  - [ ] 개인 워크스페이스는 보관 메뉴 완전히 제거
  - [ ] 설정 메뉴만 표시
- [ ] **WorkspaceSettingsDialog 업데이트**
  - [ ] `disableInvite` prop 추가
  - [ ] 개인 워크스페이스는 Members 탭 숨김
  - [ ] 개인 워크스페이스는 Settings 탭만 표시
- [ ] **CreateOrganizationDialog 업데이트**
  - [ ] 개인 워크스페이스 생성 안내 텍스트 추가
  - [ ] "조직 생성 시 Default 워크스페이스와 개인 워크스페이스가 자동으로 생성됩니다" 안내
- [ ] **InvitationAcceptanceFlow 업데이트**
  - [ ] 초대 승낙 후 개인 워크스페이스 생성 안내

---

### Workspace Management Domain (통합)
**참조 문서**:
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md)
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - Workspace Aggregate
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - WorkspaceCrudService
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - workspaces 테이블
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md) - 워크스페이스 UI

#### Backend Implementation
- [ ] WorkspaceCrudService.createPersonalWorkspace 신규 메서드
  - [ ] owner_id 파라미터 추가
  - [ ] is_personal=true 설정
  - [ ] workspace_name: "{owner_name}의 개인 워크스페이스"
  - [ ] deletable=true 설정
  - [ ] 첫 번째 페이지 자동 생성 (빈 페이지)
- [ ] WorkspaceCrudService.createDefaultWorkspace 업데이트
  - [ ] is_personal=false 명시적 설정
- [ ] WorkspaceAggregate 업데이트
  - [ ] createPersonal() 메서드 추가
  - [ ] owner_id 필드 처리

#### Database
- [ ] workspaces 테이블 마이그레이션 (v1.2)
  - [ ] is_personal BOOLEAN 필드 추가 (DEFAULT false)
  - [ ] owner_id UUID 필드 추가 (NULLABLE)
  - [ ] workspaces_personal_owner_required 제약조건 추가
  - [ ] workspaces_default_personal_mutually_exclusive 제약조건 추가
  - [ ] workspaces_unique_personal_per_member 제약조건 추가
  - [ ] idx_workspaces_personal 인덱스 추가
  - [ ] idx_workspaces_personal_owner 인덱스 추가
- [ ] Drizzle 스키마 업데이트
  - [ ] workspaces 테이블 정의에 is_personal, owner_id 추가
  - [ ] TypeScript 타입 업데이트

#### Server Actions
- [ ] createWorkspaceAction 업데이트
  - [ ] is_personal=false 기본값 설정
  - [ ] 일반 워크스페이스 생성 시 owner_id=null

#### Frontend
- [ ] WorkspacePermissions 컴포넌트 신규
  - [ ] 개인 워크스페이스 프라이버시 배지
  - [ ] "개인 전용" 텍스트 표시
- [ ] WorkspaceInviteButton 컴포넌트 업데이트
  - [ ] is_personal=true일 때 비활성화
  - [ ] 비활성화 이유 툴팁 추가 ("개인 워크스페이스는 초대할 수 없습니다")

---

### 도메인 간 통합
- [ ] OrganizationCrudService → WorkspaceCrudService 연동
  - [ ] createOrganization: createDefaultWorkspace + createPersonalWorkspace 호출
  - [ ] createDefaultOrganization: createDefaultWorkspace + createPersonalWorkspace 호출
- [ ] OrganizationInvitationService → WorkspaceCrudService 연동
  - [ ] acceptInvitation: createPersonalWorkspace 호출 (새 멤버용)
- [ ] 트랜잭션 관리
  - [ ] 개인 워크스페이스 생성 실패 시 조직 생성 롤백
  - [ ] 개인 워크스페이스 생성 실패 시 초대 수락 롤백
- [ ] 권한 검증 로직
  - [ ] 개인 워크스페이스는 owner_id 멤버만 접근 가능
  - [ ] workspace_members 테이블 체크 추가

---

### Testing & Quality
- [ ] Unit Tests
  - [ ] WorkspaceCrudService.createPersonalWorkspace 테스트
  - [ ] OrganizationCrudService.createOrganization (개인 워크스페이스 포함)
  - [ ] OrganizationInvitationService.acceptInvitation (개인 워크스페이스 포함)
  - [ ] WorkspaceAggregate.createPersonal 테스트
- [ ] Integration Tests
  - [ ] 조직 생성 → Default + 개인 워크스페이스 자동 생성 플로우
  - [ ] 초대 승낙 → 개인 워크스페이스 자동 생성 플로우
  - [ ] 개인 워크스페이스 접근 권한 검증
  - [ ] 롤백 시나리오 (개인 워크스페이스 생성 실패)
- [ ] E2E Tests
  - [ ] 조직 생성 → 워크스페이스 목록 확인 (Default + 개인)
  - [ ] 초대 승낙 → 개인 워크스페이스 생성 확인
  - [ ] 개인 워크스페이스 접근 시도 → 본인만 접근 가능
  - [ ] 개인 워크스페이스 초대 버튼 비활성화 확인
- [ ] 성능 테스트
  - [ ] 조직 생성 시간 (2개 워크스페이스 생성 포함) < 2초
  - [ ] 초대 승낙 시간 (개인 워크스페이스 생성 포함) < 1.5초

---

## 🎯 Definition of Done

### 기능 완료
- [ ] 조직 생성 시 Default + 개인 워크스페이스 자동 생성
- [ ] 초대 승낙 시 개인 워크스페이스 자동 생성
- [ ] 개인 워크스페이스는 owner_id 멤버만 접근 가능
- [ ] 개인 워크스페이스 초대 버튼 비활성화
- [ ] 워크스페이스 목록에서 개인 워크스페이스 배지 표시
- [ ] 에러 처리 및 롤백 로직 동작

### 기술 완료
- [ ] 단위 테스트 커버리지 90% 이상
- [ ] Integration Tests 통과 (4개 이상 시나리오)
- [ ] E2E Tests 통과 (4개 시나리오)
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족 (조직 생성 < 2초, 초대 승낙 < 1.5초)

### 품질 완료
- [ ] Database 마이그레이션 적용 (is_personal, owner_id)
- [ ] 제약조건 적용 (3개 제약조건)
- [ ] 권한 검증 로직 구현 완료
- [ ] UI/UX가 Frontend Specification을 준수함
- [ ] 접근성 기준 충족 (프라이버시 배지, 비활성화 툴팁)
- [ ] 보안 취약점 0개

---

## 📊 진행 상황
**현재**: 90% 완료 (Backend + Frontend 구현 완료, E2E 테스트 대기 중)

**완료된 작업**:
- ✅ **Backend 구현 (TDD 완료)**
  - Database 마이그레이션 (is_personal, owner_id, 제약조건, 인덱스)
  - Workspace Entity + Aggregate (createPersonal 메서드)
  - WorkspaceCrudService.createPersonalWorkspace 구현
  - OrganizationCrudService 업데이트 (개인 워크스페이스 자동 생성)
  - OrganizationInvitationService 업데이트 (초대 승낙 시 개인 워크스페이스 생성)
  - 롤백 로직 구현 (트랜잭션 실패 시)
  - Unit Tests (49/49 passed)
  - Integration Tests (49/49 passed)

- ✅ **Frontend 구현 (완료)**
  - DTO 업데이트 (isPersonal, ownerId)
  - Backend Service 매핑 로직 업데이트
  - PersonalWorkspacePageTree 컴포넌트 생성
  - WorkspaceSidebarContent 수정 (3개 섹션: Favorites, Workspaces, Personal Workspaces)
  - WorkspaceContextMenu 수정 (개인 워크스페이스는 설정만 표시)
  - WorkspaceSettingsDialog 수정 (개인 워크스페이스는 Settings 탭만)
  - 워크스페이스 필터링 로직 추가

- ✅ **문서 업데이트**
  - Frontend Specification 문서 업데이트 (v2.3)
  - Story-006 진행 상황 업데이트

**남은 작업**:
- ⏸️ E2E Tests (Playwright)
- ⏸️ 성능 테스트

**예상 일정**:
- ✅ Day 1: Backend 구현 (완료)
- ✅ Day 2: Database 마이그레이션 + Testing (완료)
- ✅ Day 3: Frontend 구현 (완료)
- ⏸️ Day 4: E2E 테스트 + 통합 확인 (대기 중)

---

## 🔗 의존성

### 선행 Story
- **Story-003**: 조직 생성 (확장 대상)
- **Story-004**: 멤버 초대 (확장 대상)

### 후행 Story
- **Story-007**: 멤버 제거 (개인 워크스페이스 처리 필요)
- **Story-008**: 조직 삭제 (개인 워크스페이스 정리 필요)

### 도메인 의존성
- **Organization Domain → Workspace Domain**: WorkspaceCrudService 의존
- **Workspace Domain**: Database 스키마 변경 (is_personal, owner_id)

---

## 📁 관련 문서

### Domain Documentation

**Organization Management Domain**:
- [Process Model](../../../event-domain-design/domains/organization-management-domain/02-process-model.md) - Scenario 1, 2 (개인 워크스페이스 추가)
- [Software Design](../../../event-domain-design/domains/organization-management-domain/03-software-design.md) - Organization Aggregate (Commands, Events 업데이트)
- [Testing Strategy](../../../event-domain-design/domains/organization-management-domain/04-testing-strategy.md) - Scenario 1, 2 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/organization-management-domain/05-technical-specification.md) - v11.0 (개인 워크스페이스 시스템)
- [Database Schema](../../../event-domain-design/domains/organization-management-domain/06-db-schema.md) - v9.0 (통합 섹션)
- [Frontend Specification](../../../event-domain-design/domains/organization-management-domain/07-frontend-specification.md)

**Workspace Management Domain**:
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md)
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - Workspace Aggregate
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - WorkspaceCrudService
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - v1.2 (is_personal, owner_id)
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)

### Agile Planning
- [Epic-001: User Management](../../epics/epic-001-user-management.md)
- [Sprint Planning Guide](../../guide/05-sprint-planning-guide.md)

---

## 💡 핵심 설계 결정사항

### 1. is_personal 플래그 방식 선택
**결정**: workspace_type enum 대신 is_personal BOOLEAN 사용  
**이유**:
- 기존 is_default 로직 유지 가능 (마이그레이션 최소화)
- 3가지 상태를 2개의 boolean 플래그로 표현 (is_default, is_personal)
- 코드 수정 최소화 (is_default 사용 코드 변경 불필요)

**워크스페이스 종류 구분**:
- `is_default=true, is_personal=false`: 기본 워크스페이스
- `is_default=false, is_personal=false`: 일반 워크스페이스
- `is_default=false, is_personal=true`: 개인 워크스페이스

### 2. 자동 생성 타이밍
**결정**: 조직 생성 시 + 초대 승낙 시 자동 생성  
**이유**:
- 사용자 경험 개선: 즉시 사용 가능한 개인 공간 제공
- 온보딩 단순화: 추가 설정 없이 바로 작업 시작
- 협업과 개인 작업 분리: 명확한 공간 구분

### 3. 개인 워크스페이스 명명 규칙
**결정**: "{owner_name}의 개인 워크스페이스"  
**이유**:
- 직관적: 소유자를 명확히 표시
- 다국어 지원 가능: 템플릿 문자열로 구현
- 구분 용이: 워크스페이스 목록에서 쉽게 식별

### 4. 트랜잭션 및 롤백 전략
**결정**: 개인 워크스페이스 생성 실패 시 전체 롤백  
**이유**:
- 데이터 일관성: 조직/멤버 추가와 개인 워크스페이스는 함께 성공 또는 실패
- 사용자 경험: 부분 성공으로 인한 혼란 방지
- 에러 처리 단순화: 명확한 성공/실패 상태

---

## 🔍 기술적 고려사항

### Database 제약조건
1. **workspaces_personal_owner_required**: 개인 워크스페이스는 owner_id 필수
2. **workspaces_default_personal_mutually_exclusive**: is_default와 is_personal은 배타적
3. **workspaces_unique_personal_per_member**: 조직당 멤버당 1개 개인 워크스페이스만 허용

### 성능 최적화
- 개인 워크스페이스 생성은 별도 트랜잭션으로 분리 가능 (추후 비동기 처리)
- 워크스페이스 목록 조회 시 is_personal 인덱스 활용
- owner_id 인덱스로 개인 워크스페이스 빠른 조회

### 보안 고려사항
- 개인 워크스페이스는 owner_id 멤버만 접근 가능 (Application-level 검증)
- 초대 버튼 비활성화 (Frontend + Backend 이중 검증)
- workspace_members 테이블에서 권한 체크

---

## 📈 성공 지표

### 기능 지표
- 조직 생성 시 개인 워크스페이스 생성 성공률: 99% 이상
- 초대 승낙 시 개인 워크스페이스 생성 성공률: 99% 이상
- 개인 워크스페이스 접근 권한 정확도: 100%

### 성능 지표
- 조직 생성 시간 (Default + 개인 워크스페이스 포함): 평균 1.5초 이하
- 초대 승낙 시간 (개인 워크스페이스 포함): 평균 1초 이하
- 워크스페이스 목록 조회 시간: 평균 300ms 이하

### 사용자 경험 지표
- 개인 워크스페이스 사용률: 80% 이상 (생성 후 7일 이내)
- 개인 워크스페이스 만족도: 4.5/5.0 이상
- 워크스페이스 종류 구분 이해도: 90% 이상

---

*이 Story는 Organization Management Domain과 Workspace Management Domain의 통합을 강화하여, 사용자에게 개인 작업 공간을 자동으로 제공하는 기능을 구현합니다.*

