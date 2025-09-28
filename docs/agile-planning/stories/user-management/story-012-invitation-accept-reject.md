# Story UM-012: 초대 수락/거절 처리

## 🎯 Story 개요
**User Story**: As a 초대받은 사용자, I want to 초대 링크를 통해 조직 가입을 수락하거나 거절할 수 있어야 so that 조직 참여 여부를 결정할 수 있다
**Story Points**: 5pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 초대 수락
```gherkin
Given 사용자가 초대 링크를 받았다
When 사용자가 초대를 수락한다
Then 사용자가 조직에 가입된다
And 'InvitationAccepted' 이벤트가 발행된다
And 'NewMemberAddedToOrganization' 이벤트가 발행된다
And 'MemberRoleAssigned' 이벤트가 발행된다
And 사용자는 조직에 접근할 수 있다
```

### 시나리오 2: 초대 거절
```gherkin
Given 사용자가 초대 링크를 받았다
When 사용자가 초대를 거절한다
Then 초대가 거절된다
And 'InvitationRejected' 이벤트가 발행된다
And 초대 상태가 'rejected'로 변경된다
And 사용자는 조직에 접근할 수 없다
```

### 시나리오 3: 만료된 초대 처리
```gherkin
Given 사용자가 만료된 초대 링크를 클릭한다
When 사용자가 초대를 수락하려고 시도한다
Then 초대가 거부된다
And "초대가 만료되었습니다" 에러 메시지가 표시된다
And 새로운 초대를 요청할 수 있다
```

### 시나리오 4: 이미 가입된 사용자의 초대 수락
```gherkin
Given 사용자가 이미 조직의 멤버이다
When 사용자가 초대를 수락하려고 시도한다
Then 초대가 거부된다
And "이미 조직의 멤버입니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 초대 수락 명령
interface AcceptInvitationCommand {
  invitationId: string;
  userId: UserId;
  timestamp: Date;
}

// Command: 초대 거절 명령
interface RejectInvitationCommand {
  invitationId: string;
  userId: UserId;
  timestamp: Date;
}

// Event: 초대가 수락됨
interface InvitationAcceptedEvent {
  organizationId: OrganizationId;
  userId: UserId;
  role: 'admin' | 'member';
  timestamp: Date;
}

// Event: 초대가 거절됨
interface InvitationRejectedEvent {
  organizationId: OrganizationId;
  userId: UserId;
  timestamp: Date;
}

// Event: 새 멤버가 조직에 추가됨
interface NewMemberAddedToOrganizationEvent {
  organizationId: OrganizationId;
  userId: UserId;
  role: 'admin' | 'member';
  timestamp: Date;
}

// Aggregate: MembershipAggregate
class MembershipAggregate {
  // Command Handler: 초대 수락 처리
  acceptInvitation(command: AcceptInvitationCommand): InvitationAcceptedEvent {
    // 1. 초대 유효성 검증
    // 2. 초대 만료 확인
    // 3. 중복 가입 방지
    // 4. 초대 수락 처리
    // 5. InvitationAcceptedEvent 발행
  }

  // Command Handler: 초대 거절 처리
  rejectInvitation(command: RejectInvitationCommand): InvitationRejectedEvent {
    // 1. 초대 유효성 검증
    // 2. 초대 거절 처리
    // 3. InvitationRejectedEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface MembershipRepository {
  findById(id: MembershipId): Promise<MembershipAggregate | null>;
  findByInvitationId(invitationId: string): Promise<MembershipAggregate | null>;
  update(membership: MembershipAggregate): Promise<void>;
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
}
```

### Server Actions
```typescript
// 초대 수락 처리
async function acceptInvitationAction(input: AcceptInvitationCommand): Promise<Result<InvitationAcceptedEvent, UserManagementErrorCode>> {
  // 1. 초대 유효성 검증
  // 2. MembershipManagementService를 통해 acceptInvitation 명령 실행
  // 3. 결과 반환
}

// 초대 거절 처리
async function rejectInvitationAction(input: RejectInvitationCommand): Promise<Result<InvitationRejectedEvent, UserManagementErrorCode>> {
  // 1. 초대 유효성 검증
  // 2. MembershipManagementService를 통해 rejectInvitation 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- memberships 테이블 (초대 상태 관리)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed', 'rejected')),
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 초대 만료 확인 함수
CREATE OR REPLACE FUNCTION is_invitation_expired(invitation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships 
    WHERE id = invitation_id 
    AND expires_at < NOW()
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql;
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `MembershipAggregate`에 `acceptInvitation`, `rejectInvitation` Command Handler 구현
- [ ] `InvitationAcceptedEvent`, `InvitationRejectedEvent`, `NewMemberAddedToOrganizationEvent` 도메인 이벤트 정의
- [ ] `MembershipManagementService`에 초대 수락/거절 메서드 추가
- [ ] 초대 유효성 검증 로직 구현

### Database & Repository
- [ ] `memberships` 테이블에 초대 상태 관련 필드 추가
- [ ] `MembershipRepository`에 초대 관련 메서드 구현
- [ ] 초대 만료 확인 함수 구현

### API & Server Action
- [ ] `acceptInvitationAction`, `rejectInvitationAction` Server Action 구현
- [ ] 초대 유효성 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] 초대 수락/거절 UI 컴포넌트
- [ ] 초대 상태 표시
- [ ] 초대 만료 알림
- [ ] 초대 처리 진행 상태 표시

### Integration Task
- [ ] Clerk 초대 처리 API 연동
- [ ] 초대 수락 시 Clerk 동기화
- [ ] 초대 거절 시 상태 업데이트

### E2E & Observability
- [ ] 초대 수락/거절 E2E 테스트
- [ ] 초대 만료 처리 테스트
- [ ] 중복 가입 방지 테스트
- [ ] 초대 처리 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 초대 수락 기능
- [ ] 초대 거절 기능
- [ ] 초대 만료 처리
- [ ] 중복 가입 방지

### 기술적 완료
- [ ] `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 초대 수락/거절 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 초대 수락/거절 성능 요구사항 충족 (예: 1초 이내)
- [ ] 초대 처리 시 데이터 일관성 보장
- [ ] 초대 처리 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: Story UM-011: 이메일 기반 멤버 초대
**후행 Story**:
- Story UM-013: 멤버 역할 변경
- Story UM-014: 멤버 제거 기능
**외부 의존성**:
- Clerk 초대 처리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 2: 멤버 초대 및 수락
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - memberships 테이블 스키마
