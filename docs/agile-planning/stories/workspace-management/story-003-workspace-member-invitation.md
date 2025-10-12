# Story 003: Workspace 멤버 초대 및 수락/거절

## 🎯 Story 개요

**User Story**: As a 조직 Admin, I want to 조직 멤버를 Workspace에 초대하고, 초대받은 사람이 수락/거절할 수 있어야 so that 팀별로 작업 공간에 필요한 멤버만 참여시킬 수 있다

**Story Points**: 8  
**우선순위**: High (MVP 핵심 기능)  
**Epic**: Workspace Management - 멤버 관리  
**Domain**: Workspace Management Domain (주 도메인), Notification Management Domain (통합)

**작성일**: 2025-10-11  
**예상 기간**: 3일

---

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: Admin이 조직 멤버를 Workspace에 초대

```gherkin
Feature: Workspace 멤버 초대
  Scenario: Admin이 이메일로 멤버 검색 및 초대
    Given 사용자가 조직 Admin이다
    And Workspace의 멤버이다
    When Workspace 컨텍스트 메뉴에서 "멤버 추가"를 클릭한다
    And 초대 다이얼로그가 열린다
    And 이메일 검색 필드에 "john@example.com"을 입력한다
    Then 조직 내 해당 이메일의 멤버가 검색 결과에 표시된다
    And 멤버의 이름, 이메일, 아바타가 표시된다
    When 검색 결과에서 멤버를 선택한다 (Checkbox)
    And "초대 보내기" 버튼을 클릭한다
    Then 선택된 멤버에게 Workspace 초대가 생성된다
    And 초대받은 멤버에게 알림이 발송된다
    And 성공 토스트 메시지 "1명에게 초대를 보냈습니다"가 표시된다
```

### 시나리오 2: 여러 멤버를 동시에 초대

```gherkin
Feature: 다중 멤버 초대
  Scenario: Admin이 여러 멤버를 한 번에 초대
    Given 사용자가 조직 Admin이다
    And Workspace의 멤버이다
    When "멤버 추가" 다이얼로그를 연다
    And 이메일 검색으로 3명의 멤버를 찾는다
    And 3명 모두를 선택한다
    And "초대 보내기" 버튼을 클릭한다
    Then 3명의 멤버에게 초대가 생성된다
    And 각 멤버에게 개별 알림이 발송된다
    And 성공 토스트 "3명에게 초대를 보냈습니다"가 표시된다
```

### 시나리오 3: 이미 멤버인 사람은 초대 불가

```gherkin
Feature: 중복 초대 방지
  Scenario: 이미 Workspace 멤버인 사람 초대 시도
    Given 사용자가 조직 Admin이다
    When "멤버 추가" 다이얼로그를 연다
    And 이미 Workspace 멤버인 사람을 검색한다
    Then 검색 결과에 "이미 멤버입니다" 표시가 나타난다
    And 해당 멤버의 Checkbox가 비활성화된다
    And 선택할 수 없다
```

### 시나리오 4: 초대받은 멤버가 초대를 수락

```gherkin
Feature: Workspace 초대 수락
  Scenario: 초대받은 멤버가 알림을 통해 초대 수락
    Given 사용자에게 Workspace 초대 알림이 도착했다
    When 알림 센터에서 초대 알림을 클릭한다
    Then 초대 상세 다이얼로그가 열린다
    And Workspace 이름, 설명, 아이콘이 표시된다
    And 초대한 사람 이름이 표시된다
    When "수락" 버튼을 클릭한다
    Then Workspace 멤버십이 생성된다
    And 해당 Workspace의 첫 번째 페이지로 이동한다
    And 사이드바에 Workspace가 추가된다
    And 성공 토스트 "Workspace에 참여했습니다"가 표시된다
```

### 시나리오 5: 초대받은 멤버가 초대를 거절

```gherkin
Feature: Workspace 초대 거절
  Scenario: 초대받은 멤버가 초대를 거절하고 확인
    Given 사용자에게 Workspace 초대 알림이 도착했다
    When 알림 센터에서 초대 알림을 클릭한다
    And 초대 상세 다이얼로그가 열린다
    When "거절" 버튼을 클릭한다
    Then 거절 확인 AlertDialog가 열린다
    And "거절한 초대는 다시 되돌릴 수 없습니다" 경고가 표시된다
    When "거절" 버튼을 다시 클릭하여 확인한다
    Then 초대 상태가 'rejected'로 변경된다
    And 다이얼로그가 닫힌다
    And 성공 토스트 "초대를 거절했습니다"가 표시된다
```

### 시나리오 6: 권한 없는 사용자의 초대 시도 차단

```gherkin
Feature: 권한 없는 사용자 차단
  Scenario: 일반 멤버가 초대 시도
    Given 사용자가 일반 멤버이다 (Admin이 아님)
    And Workspace의 멤버이다
    Then Workspace 컨텍스트 메뉴에 "멤버 추가" 메뉴가 표시되지 않는다
  
  Scenario: Workspace 멤버가 아닌 Admin의 초대 시도
    Given 사용자가 조직 Admin이다
    And Workspace의 멤버가 아니다
    When inviteWorkspaceMemberAction을 호출한다
    Then "접근 권한이 없습니다" 에러가 반환된다
    And 초대가 생성되지 않는다
```

---

## 📋 개발 Task (도메인별)

### Workspace Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 3

#### Backend Implementation
- [ ] WorkspaceAggregate 확장
  - [ ] `inviteMember` 메서드 (이메일 배열, 초대한 사람 ID)
  - [ ] `acceptInvitation` 메서드 (초대 ID, 사용자 ID)
  - [ ] `rejectInvitation` 메서드 (초대 ID, 사용자 ID)
  - [ ] 불변식: 이미 멤버인 사람 초대 불가, pending 초대만 처리 가능
- [ ] WorkspaceInvitation Entity 구현
  - [ ] status: InvitationStatus ('pending' | 'accepted' | 'rejected')
  - [ ] workspaceId, invitedEmail, invitedBy, notificationId
- [ ] WorkspaceInvitationRepository 구현
  - [ ] `save(invitation)` - 초대 생성
  - [ ] `findById(id)` - 조회
  - [ ] `findByEmail(email)` - 사용자별 초대 목록
  - [ ] `findPendingByWorkspace(workspaceId)` - pending 초대 목록
  - [ ] `findInvitation(workspaceId, email, status)` - 중복 확인
  - [ ] `updateStatus(id, status)` - 상태 변경
- [ ] WorkspaceMemberRepository 확장
  - [ ] `isMember(workspaceId, userId)` - 멤버 여부 확인

#### Database
- [ ] `workspace_invitations` 테이블 (신규)
  - [ ] id, workspace_id, invited_email, invited_by, notification_id
  - [ ] status (enum: pending, accepted, rejected)
  - [ ] created_at, updated_at
  - [ ] UNIQUE 제약: (workspace_id, invited_email, status='pending')
- [ ] RLS 정책
  - [ ] SELECT: 초대받은 사람 또는 초대한 사람
  - [ ] UPDATE: 초대받은 사람만
  - [ ] INSERT/DELETE: 초대한 사람만

#### Server Actions
- [ ] `inviteWorkspaceMemberAction`
  - 입력: InviteWorkspaceMemberRequest (workspaceId, emails[])
  - 출력: Result<{ count: number }>
  - 권한: 조직 Admin + Workspace 멤버
  - 로직: 초대 생성 → 알림 발송 (Notification Domain)
- [ ] `acceptWorkspaceInvitationAction`
  - 입력: ProcessInvitationRequest (invitationId)
  - 출력: Result<{ workspaceId, firstPageId }>
  - 권한: 초대받은 사람만
  - 로직: 초대 수락 → 멤버십 생성 → 첫 페이지 ID 반환
- [ ] `rejectWorkspaceInvitationAction`
  - 입력: ProcessInvitationRequest (invitationId)
  - 출력: Result<void>
  - 권한: 초대받은 사람만
  - 로직: 초대 상태를 'rejected'로 변경
- [ ] `searchOrganizationMembersAction`
  - 입력: { workspaceId, query }
  - 출력: Result<OrganizationMemberSearchResultDTO[]>
  - 권한: Workspace 멤버
  - 로직: Organization 멤버 검색 + isAlreadyMember 플래그

#### Service Layer
- [ ] WorkspaceManagementService 확장
  - [ ] `inviteWorkspaceMembers` 메서드
  - [ ] `acceptWorkspaceInvitation` 메서드
  - [ ] `rejectWorkspaceInvitation` 메서드
  - [ ] Notification Service 통합 (동기 호출)

#### Frontend
- [ ] InviteMemberDialog 컴포넌트
  - Dialog + Form 분리 패턴 (Organization 참고)
  - workspaceId props 전달
  - 성공 시 Dialog 닫기
- [ ] InviteMemberForm 컴포넌트
  - 이메일 검색 필드 (Search 아이콘)
  - useDebounce(300ms)로 실시간 검색
  - 검색 결과 ScrollArea (h-200px)
  - Checkbox 다중 선택
  - 선택된 멤버 카운트 표시
  - "초대 보내기" 버튼 (disabled={length===0})
- [ ] MemberItem 컴포넌트
  - Avatar + 이름 + 이메일
  - Checkbox 선택
  - isAlreadyMember: 비활성화 + Tooltip
- [ ] InvitationDetailDialog 컴포넌트
  - Workspace 정보 표시 (아이콘, 이름, 설명)
  - 초대한 사람 이름
  - "수락" / "거절" 버튼
  - 거절 시 AlertDialog 확인
- [ ] WorkspaceContext 확장
  - `inviteMembers` 액션
  - `acceptInvitation` 액션
  - `rejectInvitation` 액션
  - `searchOrganizationMembers` 액션
- [ ] useWorkspace Hook 확장
  - `canInviteMembers` 유틸리티 (조직 Admin + Workspace 멤버)
- [ ] useDebounce Hook (앱 공통)

---

### Notification Management Domain (통합)
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/notification-management-domain/05-technical-specification.md)

#### Backend Integration
- [ ] Notification Service 호출
  - [ ] `createNotification` 메서드
  - [ ] type: 'workspace-invitation'
  - [ ] recipientEmail, senderId, workspaceId, invitationId 전달

#### Frontend Integration
- [ ] NotificationCenter에서 초대 알림 클릭 시 InvitationDetailDialog 열기
- [ ] 초대 수락/거절 후 알림 상태 업데이트

---

### Organization Management Domain (통합)
**참조 문서**: 
- [Database Schema](../../../event-domain-design/domains/organization-management-domain/06-db-schema.md)

#### Backend Integration
- [ ] OrganizationMemberRepository 사용
  - [ ] 조직 멤버 검색 (이메일)
  - [ ] 조직 Admin 권한 확인

---

### 도메인 간 통합
- [ ] Workspace → Notification 통합
  - [ ] 초대 생성 시 알림 발송 (동기 호출)
  - [ ] 실패 시 재시도 또는 사용자 안내
- [ ] Workspace → Organization 통합
  - [ ] 조직 멤버 검색
  - [ ] Admin 권한 확인

---

### Testing & Quality

#### Unit Tests
- [ ] WorkspaceAggregate 테스트
  - [ ] `inviteMember` 성공
  - [ ] 이미 멤버인 사람 초대 시도 (실패)
  - [ ] `acceptInvitation` 성공
  - [ ] pending이 아닌 초대 수락 시도 (실패)
  - [ ] `rejectInvitation` 성공
- [ ] WorkspaceInvitation Entity 테스트
- [ ] Command/Event 테스트
  - [ ] InviteWorkspaceMemberCommand
  - [ ] WorkspaceMemberInvited 이벤트
  - [ ] AcceptWorkspaceInvitationCommand
  - [ ] WorkspaceInvitationAccepted 이벤트

#### Integration Tests
- [ ] Server Actions 테스트
  - [ ] `inviteWorkspaceMemberAction` 성공 (Admin + 멤버)
  - [ ] `inviteWorkspaceMemberAction` 실패 (권한 없음)
  - [ ] `inviteWorkspaceMemberAction` 중복 초대 방지
  - [ ] `acceptWorkspaceInvitationAction` 성공
  - [ ] `acceptWorkspaceInvitationAction` 실패 (이미 수락/거절)
  - [ ] `rejectWorkspaceInvitationAction` 성공
  - [ ] `searchOrganizationMembersAction` 성공
  - [ ] isAlreadyMember 플래그 검증
- [ ] Repository 테스트
  - [ ] WorkspaceInvitation 생성, 조회, 상태 업데이트
  - [ ] 중복 초대 UNIQUE 제약 확인
- [ ] Notification 통합 테스트
  - [ ] 초대 생성 시 알림 발송 확인
  - [ ] 알림 ID 저장 확인

#### E2E Tests
- [ ] 멤버 초대 플로우
  - [ ] Admin이 "멤버 추가" 클릭
  - [ ] 이메일 검색 및 선택
  - [ ] 초대 발송 및 성공 토스트 확인
- [ ] 초대 수락 플로우
  - [ ] 알림 센터에서 초대 클릭
  - [ ] 상세 다이얼로그 확인
  - [ ] 수락 후 Workspace 페이지로 이동 확인
- [ ] 초대 거절 플로우
  - [ ] 거절 버튼 클릭
  - [ ] AlertDialog 확인
  - [ ] 거절 완료 및 토스트 확인
- [ ] 권한 검증
  - [ ] 일반 멤버에게 "멤버 추가" 미표시
  - [ ] 이미 멤버인 사람 선택 불가

---

## 🎯 Definition of Done

### 기능 완료
- [ ] Admin이 조직 멤버를 Workspace에 초대할 수 있다
- [ ] 이메일 검색으로 멤버를 찾을 수 있다
- [ ] 여러 멤버를 동시에 초대할 수 있다
- [ ] 이미 멤버인 사람은 선택할 수 없다
- [ ] 초대받은 사람이 알림을 받는다
- [ ] 초대를 수락하여 Workspace에 참여할 수 있다
- [ ] 초대를 거절할 수 있다 (재확인 포함)
- [ ] 권한이 없는 사용자는 초대할 수 없다

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] Integration Tests 통과 (15개 이상)
- [ ] E2E Tests 통과 (4개 시나리오)
- [ ] 코드 리뷰 완료
- [ ] Notification Domain 통합 완료

### 품질 완료
- [ ] RLS 정책 적용 (초대받은 사람 / 초대한 사람)
- [ ] Application-level 권한 검증 (Admin + Workspace 멤버)
- [ ] 중복 초대 방지 (UNIQUE 제약)
- [ ] useDebounce로 검색 최적화
- [ ] toast 피드백 메시지 적용
- [ ] AlertDialog로 거절 재확인
- [ ] 접근성 기준 충족

---

## 📊 진행 상황

**현재**: 0% 완료 (설계 완료, 구현 대기 중)

**진행 단계**:
- [x] Event Storming 완료
- [x] Process Model 완료 (Scenario 3)
- [x] Software Design 완료
- [x] User Flow 완료 (7개 Screen)
- [x] Testing Strategy 완료
- [x] Technical Specification 완료
- [x] Frontend Specification 완료
- [x] Database Schema 완료 (workspace_invitations 테이블)
- [ ] Backend 구현 대기
- [ ] Frontend 구현 대기
- [ ] Notification Domain 통합 대기
- [ ] 테스트 작성 대기

---

## 🔗 의존성

### 선행 Story
- **Story-001**: Workspace-Page 목록 조회 (WorkspaceContext)
- **Story-002**: Workspace 생성 (WorkspaceContextMenu 기반)
- **Organization Story-001**: 조직 목록 조회 (조직 멤버 검색)

### 후행 Story
- **Story-004**: Page 생성 및 관리 (초대받은 멤버가 Page 생성)

### 도메인 의존성
- **Organization Management Domain**: 조직 멤버 검색, Admin 권한 확인
- **Notification Management Domain**: 초대 알림 발송
- **User Management Domain**: 프로필 조회 (Avatar, 이름)

---

## 📁 관련 문서

### Domain Documentation
- [Process Model](../../../event-domain-design/domains/workspace-management-domain/02-process-model.md) - Scenario 3
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md) - WorkspaceAggregate
- [User Flow](../../../event-domain-design/domains/workspace-management-domain/03-user-flow.md) - Screen 8~14
- [Testing Strategy](../../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md) - Scenario 3 테스트
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md) - 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md) - 컴포넌트 설계
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/06-db-schema.md) - workspace_invitations 테이블

### Agile Planning
- [Epic 문서](../../epics/epic-002-workspace-page-management.md)
- [Story-002](./story-002-workspace-creation-management.md) - 선행 Story

---

## 💡 구현 팁

### Backend
- WorkspaceInvitation의 UNIQUE 제약으로 중복 pending 초대 방지
- Notification Service 호출 실패 시 재시도 로직 고려 (최대 3회)
- 초대 수락 시 WorkspaceMember 생성과 Invitation 상태 변경을 트랜잭션으로 처리

### Frontend
- InviteMemberDialog는 Organization의 InviteMemberDialog 패턴 참고 (Dialog + Form 분리)
- useDebounce로 검색 필드 최적화 (300ms)
- 이미 멤버인 사람은 Checkbox 비활성화 + Tooltip으로 안내
- AlertDialog로 거절 재확인 (되돌릴 수 없음 경고)

### Testing
- E2E 테스트에서 알림 발송 및 수락/거절 플로우를 함께 검증
- 중복 초대 방지는 Integration Test에서 UNIQUE 제약 확인

---

**Story-003: Workspace 멤버 초대 및 수락/거절 설계 완료!** 🎉

