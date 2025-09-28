# Story UM-011: 이메일 기반 멤버 초대

## 🎯 Story 개요
**User Story**: As a 조직 관리자, I want to 이메일을 통해 새 멤버를 조직에 초대할 수 있어야 so that 팀을 확장하고 협업을 시작할 수 있다
**Story Points**: 8pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 멤버 초대 전송
```gherkin
Given 사용자가 조직의 Owner 또는 Admin 권한을 가지고 있다
When 사용자가 새 멤버를 초대한다
And 이메일 주소와 역할을 입력한다
Then 초대 이메일이 전송된다
And 'MemberInvitationSentViaEmail' 이벤트가 발행된다
And 'ClerkInvitationLinkGenerated' 이벤트가 발행된다
And 초대 정보가 Supabase에 저장된다
```

### 시나리오 2: 초대 링크 생성
```gherkin
Given 사용자가 멤버 초대를 요청했다
When 초대 처리가 완료된다
Then Clerk에서 초대 링크가 생성된다
And 초대 링크가 이메일로 전송된다
And 초대 링크는 30일간 유효하다
```

### 시나리오 3: 중복 초대 방지
```gherkin
Given 사용자가 이미 초대된 이메일 주소를 입력한다
When 사용자가 중복 초대를 시도한다
Then 초대가 거부된다
And "이미 초대된 이메일입니다" 에러 메시지가 표시된다
And 기존 초대 상태가 유지된다
```

### 시나리오 4: 권한 없는 사용자의 초대 시도
```gherkin
Given 사용자가 조직의 Member 권한만 가지고 있다
When 사용자가 멤버 초대를 시도한다
Then 초대가 거부된다
And "초대 권한이 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 멤버 초대 명령
interface InviteMemberCommand {
  organizationId: OrganizationId;
  inviteeEmail: string;
  role: 'admin' | 'member';
  invitedBy: UserId;
  timestamp: Date;
}

// Event: 이메일로 멤버 초대가 전송됨
interface MemberInvitationSentViaEmailEvent {
  organizationId: OrganizationId;
  inviteeEmail: string;
  role: 'admin' | 'member';
  invitedBy: UserId;
  timestamp: Date;
}

// Event: 초대 링크가 생성됨 (Clerk API를 통해)
interface InvitationLinkGeneratedEvent {
  organizationId: OrganizationId;
  inviteeEmail: string;
  invitationLink: string;
  expiresAt: Date;
  timestamp: Date;
}

// Aggregate: MembershipAggregate
class MembershipAggregate {
  // Command Handler: 멤버 초대 처리
  inviteMember(command: InviteMemberCommand): MemberInvitationSentViaEmailEvent {
    // 1. 초대 권한 검증 (Owner 또는 Admin)
    // 2. 중복 초대 방지
    // 3. 초대 정보 저장
    // 4. MemberInvitationSentViaEmailEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface MembershipRepository {
  save(membership: MembershipAggregate): Promise<void>;
  findByEmailAndOrganizationId(email: string, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
}
```

### Server Actions
```typescript
// 멤버 초대 처리
async function inviteMemberAction(input: InviteMemberCommand): Promise<Result<MemberInvitationSentViaEmailEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. MembershipManagementService를 통해 inviteMember 명령 실행
  // 3. Clerk API를 통한 초대 링크 생성
  // 4. 이메일 전송
  // 5. 결과 반환
}
```

### Database Schema
```sql
-- memberships 테이블 (초대 정보 저장)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id), -- 초대 시에는 NULL
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 초대 중복 방지 인덱스
CREATE UNIQUE INDEX idx_memberships_email_org_pending ON memberships (invitee_email, organization_id) WHERE status = 'pending';

-- 인덱스
CREATE INDEX idx_memberships_organization_id ON memberships (organization_id);
CREATE INDEX idx_memberships_invitee_email ON memberships (invitee_email);
CREATE INDEX idx_memberships_expires_at ON memberships (expires_at);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `MembershipAggregate`에 `inviteMember` Command Handler 구현
- [ ] `MemberInvitationSentViaEmailEvent`, `ClerkInvitationLinkGeneratedEvent` 도메인 이벤트 정의
- [ ] `MembershipManagementService`에 멤버 초대 메서드 추가
- [ ] 멤버 초대 권한 검증 로직 구현

### Database & Repository
- [ ] `memberships` 테이블에 초대 관련 필드 추가
- [ ] `MembershipRepository`에 초대 관련 메서드 구현
- [ ] 초대 중복 방지 로직 구현

### API & Server Action
- [ ] `inviteMemberAction` Server Action 구현
- [ ] 멤버 초대 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] **멤버 초대 폼**: `MemberInvitationForm` 컴포넌트 구현
  - `Input`, `Label`, `Button` UI 컴포넌트 활용
  - 이메일 입력 필드 (유효성 검증 포함)
  - 역할 선택 드롭다운 (Admin/Member)
  - 폼 제출 시 로딩 상태 표시
  - 초대 성공/실패 토스트 알림 (`toast.success`, `toast.error`)
- [ ] **초대된 멤버 목록**: `MemberManagement` 컴포넌트에서 초대 목록 표시
  - 초대 목록 테이블/카드 형태로 표시
  - 초대된 이메일, 역할, 초대일시 표시
  - 초대 상태별 색상 구분 (Badge 컴포넌트 활용)
  - 초대 취소/재전송 액션 버튼
- [ ] **초대 상태 표시**: 초대 목록에서 상태별 표시 (대기 중, 수락됨, 거절됨)
  - `Badge` 컴포넌트로 상태별 색상 구분
  - 대기 중: 노란색 (pending)
  - 수락됨: 초록색 (accepted)
  - 거절됨: 빨간색 (rejected)
  - 만료됨: 회색 (expired)
- [ ] **초대 진행 상태**: 초대 전송 시 로딩 상태 및 피드백
  - `Loader2` 아이콘으로 로딩 상태 표시
  - `useTransition` Hook으로 pending 상태 관리
  - 초대 전송 중 폼 비활성화
  - 초대 성공 시 폼 초기화
- [ ] **설정 모달 통합**: 멤버 탭에서 초대 기능 제공
  - `SettingsModal` 컴포넌트의 "멤버" 탭에 통합
  - `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` UI 컴포넌트 활용
  - 초대 폼과 멤버 목록을 탭으로 구분
  - 모달 내에서 초대 관리 기능 제공
- [ ] **React Context 연동**: `useUserManagement()` Hook을 통한 초대 관리
  - `inviteMember` 액션으로 초대 전송
  - `isInvitingMember` 상태로 로딩 관리
  - `organizationMemberView`로 초대 목록 조회
  - Context 상태와 UI 동기화

### Integration Task
- [ ] Clerk 초대 API 연동
- [ ] 이메일 전송 서비스 연동
- [ ] 초대 링크 생성 및 전송

### E2E & Observability
- [ ] 멤버 초대 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 중복 초대 방지 테스트
- [ ] 멤버 초대 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 멤버 초대 전송 기능
- [ ] 초대 링크 생성 및 전송
- [ ] 중복 초대 방지
- [ ] 멤버 초대 권한 검증

### 기술적 완료
- [ ] `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 멤버 초대 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 멤버 초대 성능 요구사항 충족 (예: 2초 이내)
- [ ] 멤버 초대 시 데이터 일관성 보장
- [ ] 멤버 초대 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-006: 조직 생성 및 관리
- Story UM-008: 조직 소유권 이전
**후행 Story**:
- Story UM-012: 초대 수락/거절 처리
- Story UM-013: 멤버 역할 변경
**외부 의존성**:
- Clerk 초대 API
- 이메일 전송 서비스
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 2: 멤버 초대 및 수락
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - memberships 테이블 스키마
