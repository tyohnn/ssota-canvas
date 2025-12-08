# Story E001-010: 멤버 초대

## 🎯 Story 개요
**User Story**: As a 조직 소유자 또는 관리자 I want to 인박스 알림으로 새 멤버를 초대할 수 있어야 so that 팀원들과 함께 작업할 수 있다

**Story Points**: 8  
**우선순위**: High  
**Epic**: Epic-001 User Management  
**Domain**: Organization Management Domain, Notification Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 멤버 초대 성공 (Scenario 3 - Sequence 1)
```gherkin
Given 조직 소유자 또는 관리자가 있다
When 설정 다이얼로그에서 멤버 초대 메뉴를 클릭한다
And 이메일 주소를 입력하여 프로필을 검색한다
And 검색된 프로필을 선택한다
And 부여할 역할을 선택한다 (admin/member)
And 초대 요청 버튼을 클릭한다
Then 초대 정보가 데이터베이스에 저장된다
And 초대받은 사용자의 인박스에 알림이 생성된다
And 초대 요청 완료 이벤트가 발생한다
And 멤버 초대 폼이 초기화된다
```

### 시나리오 2: 중복 초대 방지
```gherkin
Given 조직에 이미 멤버가 있다 또는 진행 중인 초대가 있다
When 동일한 이메일로 멤버를 초대하려고 한다
Then 이메일 입력 시 프로필이 회색으로 표시된다
And "이미 멤버입니다" 또는 "초대 진행 중" 메시지가 표시된다
And 선택이 불가능하다
```

### 시나리오 3: 초대 수락 (Scenario 3 - Sequence 2)
```gherkin
Given 초대받은 사용자가 있다
When 인박스 버튼을 클릭한다
Then 인박스 패널이 표시된다
And 초대 알림이 표시된다 (초대자 이름, 조직 이름, 부여될 역할)
When 승낙 버튼을 클릭한다
Then 사용자가 조직에 멤버로 추가된다
And 멤버십이 생성된다
And 초대 상태가 "accepted"로 변경된다
And 초대 수락 완료 이벤트가 발생한다
And 알림이 자동으로 읽음 처리된다
```

### 시나리오 4: 초대 거절
```gherkin
Given 초대받은 사용자가 인박스를 확인한다
When 초대 알림의 거절 버튼을 클릭한다
Then 초대 상태가 "rejected"로 변경된다
And 초대 거절 이벤트가 발생한다
And 알림이 자동으로 읽음 처리된다
And 멤버십이 생성되지 않는다
```

## 📋 개발 Task (도메인별)

### Organization Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/organization-management-domain/05-technical-specification.md), [Database Schema](../../../event-domain-design/domains/organization-management-domain/06-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/organization-management-domain/07-frontend-specification.md)

#### Backend Implementation
- [x] InvitationAggregate 구현 (초대 생성, 승낙, 거절 로직) ✅ 12 tests
- [x] Invitation Entity 구현 ✅ 14 tests
- [x] InvitationId, MemberRole Value Objects 구현 ✅
- [x] RequestMemberInvitationCommand, RespondToInvitationCommand 정의 ✅
- [x] 관련 Events 정의 (MemberInvitationRequestedEvent, InvitationAcceptedEvent, InvitationRejectedEvent, NewMemberAddedToOrganizationEvent) ✅
- [x] InvitationRepository 구현 (Drizzle ORM + RLS) ✅
- [x] OrganizationMemberRepository 구현 ✅
- [x] OrganizationManagementService 구현 (inviteMember, acceptInvitation, rejectInvitation) ✅ 7 tests

#### Database
- [x] invitations 테이블 생성 (Drizzle migration) ✅
- [x] organization_members 테이블 생성 (Drizzle migration) ✅
- [x] member_role, invitation_status enum 생성 ✅
- [x] RLS 정책 적용 (초대자/초대받은 사용자만 접근) ✅

#### Server Actions
- [x] inviteMemberAction (권한 검증, 프로필 검색, 초대 생성, 알림 요청) ✅
- [x] respondToInvitationAction (승낙/거절 처리, 멤버십 생성/무효화) ✅
- [x] getOrganizationMembersAction (멤버 목록 + 진행 중인 초대 목록 조회) ✅
- [x] searchUserByEmailAction (프로필 검색) ✅

#### Frontend
- [x] MemberInvitationForm 컴포넌트 (이메일 검색, 역할 선택, 중복 검증) ✅
- [x] MemberList 컴포넌트 (현재 멤버, 진행 중인 초대 표시) ✅
- [x] SettingsDialog 컴포넌트 (멤버 관리 탭) ✅
- [x] MemberManagementContext 및 useMemberManagement Hook ✅
- [x] 폴더 구조 리팩토링 (기능별 그룹화: organization/, member-management/, sidebar/) ✅

---

### Notification Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/notification-management-domain/05-technical-specification.md), [Database Schema](../../../event-domain-design/domains/notification-management-domain/06-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/notification-management-domain/07-frontend-specification.md)

#### Backend Implementation
- [x] NotificationAggregate 구현 (알림 생성, 읽음 처리, 보관처리) ✅ 10 tests
- [x] Notification Entity 구현 ✅ 7 tests
- [x] NotificationId Value Object 구현 ✅
- [x] CreateInvitationNotificationCommand 정의 ✅
- [x] InvitationNotificationCreatedEvent 정의 ✅
- [x] NotificationRepository 구현 (Drizzle ORM + RLS) ✅
- [x] NotificationManagementService 구현 ✅ 9 tests

#### Database
- [x] notifications 테이블 생성 (Drizzle migration) ✅
- [x] notification_type enum 생성 ✅
- [x] RLS 정책 적용 (사용자는 자신의 알림만 접근) ✅

#### Server Actions
- [x] getUserNotificationsAction (알림 목록 조회) ✅
- [x] markNotificationAsReadAction (읽음 처리) ✅
- [ ] archiveNotificationAction (보관처리)

#### Frontend
- [x] InboxPanel 컴포넌트 (알림 목록 표시) ✅
- [x] NotificationItem 컴포넌트 (초대 알림 아이템) ✅
- [x] InboxButton 컴포넌트 (읽지 않은 개수 배지) ✅
- [x] NotificationContext 및 useNotification Hook ✅

---

### 도메인 간 통합
- [x] Organization Service → Notification Service 연동 (알림 생성 요청) ✅
- [x] InboxPanel에서 respondToInvitationAction 호출 (초대 응답) ✅
- [x] 권한 검증 로직 구현 (소유자/관리자만 초대 가능) ✅
- [x] 중복 초대 방지 로직 구현 ✅
- [x] 프로필 검색 기능 구현 (User Management Domain 연동) ✅
- [x] Sidebar에 InboxButton 통합 ✅
- [x] Sidebar에 SettingsDialog 통합 ✅
- [x] App Provider에 NotificationProvider, MemberManagementProvider 추가 ✅

---

### Testing & Quality
- [x] InvitationAggregate Unit Tests (초대 생성, 승낙, 거절 로직) ✅ 12 tests
- [x] NotificationAggregate Unit Tests (알림 생성, 읽음 처리) ✅ 10 tests
- [x] Invitation Entity Unit Tests ✅ 14 tests
- [x] Notification Entity Unit Tests ✅ 7 tests
- [x] OrganizationManagementService Unit Tests ✅ 7 tests
- [x] NotificationService Unit Tests ✅ 9 tests
- [ ] Repository Integration Tests (Drizzle ORM + RLS 검증) - DB 필요
- [ ] Server Actions Tests (전체 플로우 검증) - E2E 수준
- [ ] E2E Tests (멤버 초대 → 알림 생성 → 초대 수락/거절 전체 플로우)
- [ ] 성능 테스트 (초대 생성 < 500ms, 알림 조회 < 300ms)

## 🎯 Definition of Done

### 기능 완료
- [x] 모든 시나리오 1-4가 코드로 구현됨 ✅ (E2E 테스트 필요)
- [x] 멤버 초대 → 알림 생성 → 초대 수락/거절 전체 플로우 완료 ✅
- [x] 중복 초대 방지 및 권한 검증 정상 동작 ✅
- [x] UI/UX가 Frontend Specification을 준수함 ✅

### 기술 완료
- [x] 단위 테스트 커버리지 80% 이상 (Aggregates, Entities, Value Objects) ✅ 87 tests
- [x] Unit Tests 통과 (Service Layer) ✅ 16 tests
- [ ] Integration Tests 통과 (Repository, Database) - DB 환경 필요
- [ ] E2E Tests 통과 (전체 플로우) - 다음 단계
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족 (초대 생성 < 500ms, 알림 조회 < 300ms)

### 품질 완료
- [x] RLS 정책 적용 완료 (invitations, notifications, organization_members) ✅
- [x] 권한 검증 로직 구현 완료 ✅
- [ ] 접근성 기준 충족 (키보드 네비게이션, 스크린 리더) - E2E 테스트 시 검증
- [ ] 보안 취약점 0개 - 코드 리뷰 필요

## 📊 진행 상황
**현재**: 90% 완료 (백엔드 & 프론트엔드 구현 완료, E2E 테스트 남음)

**완료된 작업**:
- ✅ **Backend Implementation** (87 Unit Tests 통과)
  - Organization Management Domain (61 tests)
  - Notification Management Domain (26 tests)
  - Database Schema & Migration (invitations, organization_members, notifications)
  - Server Actions 6개 구현 완료

- ✅ **Frontend Implementation**
  - Notification Domain: Context, Hook, Components (InboxPanel, NotificationItem, InboxButton)
  - Organization Domain: Context, Hook, Components (MemberInvitationForm, MemberList, SettingsDialog)
  - 폴더 구조 리팩토링 (기능별 그룹화)
  - Provider 통합 (app/provider.tsx)
  - Sidebar 통합 완료

**남은 작업**:
- ⏳ E2E Tests (전체 플로우 검증)
- ⏳ 성능 테스트
- ⏳ 접근성 검증

## 🔗 의존성
- **선행 Story**: Story-006 (조직 생성)
- **후행 Story**: Story-008 (멤버 관리)
- **도메인 의존성**: Organization ↔ Notification, Organization → User (프로필 조회)

## 📁 관련 문서

### Domain Documentation
**Organization Management Domain**:
- [Process Model](../../../event-domain-design/domains/organization-management-domain/02-process-model.md) - Scenario 3 (멤버 초대)
- [Software Design](../../../event-domain-design/domains/organization-management-domain/03-software-design.md) - Invitation Aggregate
- [Testing Strategy](../../../event-domain-design/domains/organization-management-domain/04-testing-strategy.md) - Scenario 3 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/organization-management-domain/05-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/organization-management-domain/06-db-schema.md) - invitations, organization_members 테이블
- [Frontend Specification](../../../event-domain-design/domains/organization-management-domain/07-frontend-specification.md) - 멤버 초대 UI

**Notification Management Domain**:
- [Software Design](../../../event-domain-design/domains/notification-management-domain/03-software-design.md) - Notification Aggregate
- [Technical Specification](../../../event-domain-design/domains/notification-management-domain/05-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/notification-management-domain/06-db-schema.md) - notifications 테이블
- [Frontend Specification](../../../event-domain-design/domains/notification-management-domain/07-frontend-specification.md) - 인박스 UI

### Agile Planning
- [Epic 001: User Management](../../epics/epic-001-core-platform-foundation.md)
