# Story UM-015: 초대 취소 및 재초대

## 🎯 Story 개요
**User Story**: As a 조직 관리자, I want to 대기 중인 초대를 취소하고 필요 시 재초대할 수 있어야 so that 초대 상태를 관리하고 사용자에게 새로운 초대를 보낼 수 있다
**Story Points**: 5pts
**우선순위**: Low
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 초대 취소
```gherkin
Given 사용자가 조직의 Owner 또는 Admin 권한을 가지고 있다
When 사용자가 대기 중인 초대를 취소한다
Then 초대가 취소된다
And 'InvitationCancelled' 이벤트가 발행된다
And 초대 상태가 'cancelled'로 변경된다
And 초대 링크가 무효화된다
```

### 시나리오 2: 초대 재전송
```gherkin
Given 사용자가 조직의 Owner 또는 Admin 권한을 가지고 있다
When 사용자가 취소된 초대를 재전송한다
Then 새로운 초대가 전송된다
And 'MemberInvitationSentViaEmail' 이벤트가 발행된다
And 'ClerkInvitationLinkGenerated' 이벤트가 발행된다
And 새로운 초대 링크가 생성된다
```

### 시나리오 3: 만료된 초대 정리
```gherkin
Given 시스템에 만료된 초대들이 있다
When 만료된 초대 정리 작업이 실행된다
Then 만료된 초대들이 자동으로 취소된다
And 'InvitationExpired' 이벤트가 발행된다
And 초대 상태가 'expired'로 변경된다
```

### 시나리오 4: 권한 없는 사용자의 초대 취소 시도
```gherkin
Given 사용자가 조직의 Member 권한을 가지고 있다
When 사용자가 초대를 취소하려고 시도한다
Then 취소가 거부된다
And "초대 취소 권한이 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 초대 취소 명령
interface CancelInvitationCommand {
  invitationId: string;
  cancelledBy: UserId;
  timestamp: Date;
}

// Command: 초대 재전송 명령
interface RetryInvitationCommand {
  organizationId: OrganizationId;
  inviteeEmail: string;
  role: 'admin' | 'member';
  retriedBy: UserId;
  timestamp: Date;
}

// Event: 초대가 취소됨
interface InvitationCancelledEvent {
  organizationId: OrganizationId;
  inviteeEmail: string;
  cancelledBy: UserId;
  timestamp: Date;
}

// Event: 초대가 만료됨
interface InvitationExpiredEvent {
  organizationId: OrganizationId;
  inviteeEmail: string;
  expiredAt: Date;
  timestamp: Date;
}

// Aggregate: MembershipAggregate
class MembershipAggregate {
  // Command Handler: 초대 취소 처리
  cancelInvitation(command: CancelInvitationCommand): InvitationCancelledEvent {
    // 1. 취소 권한 검증 (Owner 또는 Admin)
    // 2. 초대 상태 확인 (pending 상태만 취소 가능)
    // 3. 초대 취소 처리
    // 4. InvitationCancelledEvent 발행
  }

  // Command Handler: 초대 재전송 처리
  retryInvitation(command: RetryInvitationCommand): MemberInvitationSentViaEmailEvent {
    // 1. 재전송 권한 검증
    // 2. 기존 초대 취소
    // 3. 새로운 초대 생성
    // 4. MemberInvitationSentViaEmailEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface MembershipRepository {
  findById(id: MembershipId): Promise<MembershipAggregate | null>;
  findByInvitationId(invitationId: string): Promise<MembershipAggregate | null>;
  findByEmailAndOrganizationId(email: string, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  update(membership: MembershipAggregate): Promise<void>;
  findExpiredInvitations(): Promise<MembershipAggregate[]>;
}
```

### Server Actions
```typescript
// 초대 취소 처리
async function cancelInvitationAction(input: CancelInvitationCommand): Promise<Result<InvitationCancelledEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. MembershipManagementService를 통해 cancelInvitation 명령 실행
  // 3. 결과 반환
}

// 초대 재전송 처리
async function retryInvitationAction(input: RetryInvitationCommand): Promise<Result<MemberInvitationSentViaEmailEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. MembershipManagementService를 통해 retryInvitation 명령 실행
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed', 'cancelled', 'expired')),
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_memberships_organization_id ON memberships (organization_id);
CREATE INDEX idx_memberships_user_id ON memberships (user_id);
CREATE INDEX idx_memberships_invitee_email ON memberships (invitee_email);
CREATE INDEX idx_memberships_invited_at ON memberships (invited_at);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `MembershipAggregate`에 `cancelInvitation`, `retryInvitation` Command Handler 구현
- [ ] `InvitationCancelledEvent`, `InvitationExpiredEvent` 도메인 이벤트 정의
- [ ] `MembershipManagementService`에 초대 취소/재전송 메서드 추가
- [ ] 초대 취소/재전송 권한 검증 로직 구현

### Database & Repository
- [ ] `MembershipRepository`에 초대 취소/재전송 관련 메서드 구현

### API & Server Action
- [ ] `cancelInvitationAction`, `retryInvitationAction` Server Action 구현
- [ ] 초대 취소/재전송 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] **초대 취소 UI 컴포넌트**: `InvitationCancelDialog` 컴포넌트 구현
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` UI 컴포넌트 활용
  - 취소할 초대 정보 표시 (이메일, 역할, 초대일시)
  - 취소 사유 입력 필드 (선택사항)
  - 취소 확인 체크박스 ("정말로 취소하겠습니다")
- [ ] **초대 재전송 UI 컴포넌트**: `InvitationRetryDialog` 컴포넌트 구현
  - 재전송할 초대 정보 표시 (이메일, 역할)
  - 새로운 초대 메시지 입력 필드 (선택사항)
  - 재전송 확인 버튼 (`Button` 컴포넌트)
  - 이전 초대 취소 후 새 초대 생성 안내
- [ ] **초대 상태 표시**: 초대 목록에서 상태별 표시 (대기 중, 취소됨, 만료됨)
  - `Badge` 컴포넌트로 상태별 색상 구분
  - 대기 중: 노란색 (pending)
  - 취소됨: 빨간색 (cancelled)
  - 만료됨: 회색 (expired)
  - 수락됨: 초록색 (accepted)
  - 거절됨: 빨간색 (rejected)
- [ ] **초대 취소/재전송 진행 상태 표시**: 처리 중 상태 관리
  - `Loader2` 아이콘으로 로딩 상태 표시
  - `useTransition` Hook으로 pending 상태 관리
  - 처리 중 다이얼로그 버튼 비활성화
  - 성공/실패 토스트 알림 (`toast.success`, `toast.error`)

### Integration Task
- [ ] **React Context 연동**: `useUserManagement()` Hook을 통한 초대 관리
  - `cancelInvitation`, `retryInvitation` 액션 구현
  - 초대 취소/재전송 후 초대 목록 새로고침
  - Context 상태와 UI 동기화
- [ ] **설정 모달 통합**: 멤버 관리 탭에서 초대 관리 기능 제공
  - `SettingsModal`의 "멤버" 탭에 취소/재전송 버튼 추가
  - 초대 목록에서 각 초대별 취소/재전송 액션 버튼
  - 권한에 따른 버튼 표시/숨김 (Owner/Admin만 관리 가능)
  - 상태별 버튼 활성화/비활성화 (대기 중만 취소/재전송 가능)
- [ ] **Clerk 초대 취소 API 연동**
  - 초대 취소 시 Clerk 동기화
  - 초대 재전송 시 Clerk 동기화
  - 초대 링크 무효화 및 새 링크 생성

### E2E & Observability
- [ ] 초대 취소/재전송 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 만료된 초대 정리 테스트
- [ ] 초대 취소/재전송 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 초대 취소 기능
- [ ] 초대 재전송 기능
- [ ] 만료된 초대 정리
- [ ] 초대 취소/재전송 권한 검증

### 기술적 완료
- [ ] `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 초대 취소/재전송 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 초대 취소/재전송 성능 요구사항 충족 (예: 1초 이내)
- [ ] 초대 취소/재전송 시 데이터 일관성 보장
- [ ] 초대 취소/재전송 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-011: 이메일 기반 멤버 초대
- Story UM-012: 초대 수락/거절 처리
- Story UM-013: 멤버 역할 변경
- Story UM-014: 멤버 제거 기능
**후행 Story**: 없음
**외부 의존성**:
- Clerk 초대 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 2: 멤버 초대 및 수락
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - memberships 테이블 스키마
