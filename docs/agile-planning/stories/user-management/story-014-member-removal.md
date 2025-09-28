# Story UM-014: 멤버 제거 기능

## 🎯 Story 개요
**User Story**: As a 조직 관리자, I want to 더 이상 필요없는 멤버를 조직에서 제거할 수 있어야 so that 조직을 효율적으로 관리하고 보안을 유지할 수 있다
**Story Points**: 5pts
**우선순위**: Medium
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 멤버 제거
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 멤버를 제거한다
Then 멤버가 조직에서 제거된다
And 'MemberRemovalRequested' 이벤트가 발행된다
And 'MemberRemovedFromOrganization' 이벤트가 발행된다
And 멤버는 조직에 접근할 수 없다
```

### 시나리오 2: 멤버 본인의 조직 떠나기
```gherkin
Given 사용자가 조직의 멤버이다
When 사용자가 조직을 떠나기를 요청한다
Then 사용자가 조직에서 제거된다
And 'MemberRemovedFromOrganization' 이벤트가 발행된다
And 사용자는 조직에 접근할 수 없다
```

### 시나리오 3: Owner 제거 시도
```gherkin
Given 사용자가 조직의 Owner이다
When 사용자가 Owner를 제거하려고 시도한다
Then 제거가 거부된다
And "Owner는 제거할 수 없습니다" 에러 메시지가 표시된다
And 소유권 이전 후에만 제거 가능하다는 안내가 표시된다
```

### 시나리오 4: 권한 없는 사용자의 제거 시도
```gherkin
Given 사용자가 조직의 Member 권한을 가지고 있다
When 사용자가 다른 멤버를 제거하려고 시도한다
Then 제거가 거부된다
And "권한이 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 멤버 제거 명령
interface RemoveMemberCommand {
  organizationId: OrganizationId;
  targetMemberId: UserId;
  removedBy: UserId;
  removalReason: 'admin_removal' | 'self_leave';
  timestamp: Date;
}

// Event: 멤버 제거 요청됨
interface MemberRemovalRequestedEvent {
  organizationId: OrganizationId;
  targetMemberId: UserId;
  removedBy: UserId;
  removalReason: 'admin_removal' | 'self_leave';
  timestamp: Date;
}

// Event: 멤버가 조직에서 제거됨
interface MemberRemovedFromOrganizationEvent {
  organizationId: OrganizationId;
  memberId: UserId;
  removedBy: UserId;
  removalReason: 'admin_removal' | 'self_leave';
  timestamp: Date;
}

// Aggregate: MembershipAggregate
class MembershipAggregate {
  // Command Handler: 멤버 제거 처리
  removeMember(command: RemoveMemberCommand): MemberRemovedFromOrganizationEvent {
    // 1. 제거 권한 검증 (Owner 또는 본인)
    // 2. Owner 제거 방지
    // 3. 멤버 제거 처리
    // 4. MemberRemovedFromOrganizationEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface MembershipRepository {
  findById(id: MembershipId): Promise<MembershipAggregate | null>;
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  remove(membershipId: MembershipId): Promise<void>;
}
```

### Server Actions
```typescript
// 멤버 제거 처리
async function removeMemberAction(input: RemoveMemberCommand): Promise<Result<MemberRemovedFromOrganizationEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. MembershipManagementService를 통해 removeMember 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- memberships 테이블 (멤버 제거)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, user_id)
);

-- 인덱스
CREATE INDEX idx_memberships_organization_id ON memberships (organization_id);
CREATE INDEX idx_memberships_user_id ON memberships (user_id);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `MembershipAggregate`에 `removeMember` Command Handler 구현
- [ ] `MemberRemovalRequestedEvent`, `MemberRemovedFromOrganizationEvent` 도메인 이벤트 정의
- [ ] `MembershipManagementService`에 멤버 제거 메서드 추가
- [ ] 멤버 제거 권한 검증 로직 구현

### Database & Repository
- [ ] `MembershipRepository`에 멤버 제거 관련 메서드 구현

### API & Server Action
- [ ] `removeMemberAction` Server Action 구현
- [ ] 멤버 제거 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] **멤버 제거 UI 컴포넌트**: `MemberRemovalDialog` 컴포넌트 구현
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` UI 컴포넌트 활용
  - 제거할 멤버 정보 표시 (이름, 이메일, 역할)
  - 제거 사유 입력 필드 (선택사항)
  - 제거 확인 체크박스 ("정말로 제거하겠습니다")
- [ ] **멤버 제거 확인 다이얼로그**: 제거 전 확인 UI
  - `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader` 활용
  - 제거 대상 멤버 정보 요약 표시
  - "정말로 이 멤버를 제거하시겠습니까?" 확인 메시지
  - 제거 시 주의사항 안내 (워크스페이스 접근 권한 상실 등)
  - 취소/제거 버튼 (`Button` 컴포넌트, 제거 버튼은 빨간색)
- [ ] **멤버 제거 진행 상태 표시**: 제거 처리 중 상태 관리
  - `Loader2` 아이콘으로 로딩 상태 표시
  - `useTransition` Hook으로 pending 상태 관리
  - 제거 중 다이얼로그 버튼 비활성화
  - 성공/실패 토스트 알림 (`toast.success`, `toast.error`)
- [ ] **멤버 제거 후 상태 업데이트**: 제거 완료 후 UI 업데이트
  - 멤버 목록에서 제거된 멤버 즉시 제거
  - `useOptimistic` Hook으로 낙관적 업데이트
  - 제거 실패 시 이전 상태로 롤백
  - 멤버 수 카운터 업데이트

### Integration Task
- [ ] **React Context 연동**: `useUserManagement()` Hook을 통한 멤버 제거
  - `removeMember` 액션으로 멤버 제거 처리
  - 제거 후 멤버 목록 새로고침
  - Context 상태와 UI 동기화
- [ ] **설정 모달 통합**: 멤버 관리 탭에서 제거 기능 제공
  - `SettingsModal`의 "멤버" 탭에 제거 버튼 추가
  - 멤버 목록에서 각 멤버별 제거 액션 버튼
  - 권한에 따른 버튼 표시/숨김 (Owner/Admin만 제거 가능)
  - Owner 제거 버튼 비활성화
- [ ] **Clerk 멤버 제거 API 연동**
  - 멤버 제거 시 Clerk 동기화
  - 멤버 제거 시 워크스페이스 접근 권한 해제
  - 제거된 멤버의 세션 무효화

### E2E & Observability
- [ ] 멤버 제거 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] Owner 제거 방지 테스트
- [ ] 멤버 제거 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 멤버 제거 기능
- [ ] 멤버 본인의 조직 떠나기
- [ ] Owner 제거 방지
- [ ] 멤버 제거 권한 검증

### 기술적 완료
- [ ] `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 멤버 제거 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 멤버 제거 성능 요구사항 충족 (예: 1초 이내)
- [ ] 멤버 제거 시 데이터 일관성 보장
- [ ] 멤버 제거 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-011: 이메일 기반 멤버 초대
- Story UM-012: 초대 수락/거절 처리
- Story UM-013: 멤버 역할 변경
**후행 Story**:
- Story UM-015: 초대 취소 및 재초대
**외부 의존성**:
- Clerk 멤버 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 5: 멤버 제거
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - memberships, membership_removals 테이블 스키마
