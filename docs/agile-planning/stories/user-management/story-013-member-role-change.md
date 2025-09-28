# Story UM-013: 멤버 역할 변경

## 🎯 Story 개요
**User Story**: As a 조직 소유자, I want to 멤버의 역할을 Admin과 Member 간에 변경할 수 있어야 so that 조직 내 권한을 적절히 관리할 수 있다
**Story Points**: 5pts
**우선순위**: Medium
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 멤버를 Admin으로 승격
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 멤버를 Admin으로 승격한다
Then 멤버의 역할이 Admin으로 변경된다
And 'MemberPromotedToAdmin' 이벤트가 발행된다
And 멤버는 Admin 권한을 가진다
```

### 시나리오 2: Admin을 Member로 강등
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 Admin을 Member로 강등한다
Then Admin의 역할이 Member로 변경된다
And 'AdminDemotedToMember' 이벤트가 발행된다
And Admin은 Member 권한만 가진다
```

### 시나리오 3: Owner 역할 변경 시도
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 Owner 역할을 변경하려고 시도한다
Then 변경이 거부된다
And "Owner 역할은 소유권 이전을 통해서만 변경할 수 있습니다" 에러 메시지가 표시된다
```

### 시나리오 4: 권한 없는 사용자의 역할 변경 시도
```gherkin
Given 사용자가 조직의 Admin 권한을 가지고 있다
When 사용자가 멤버 역할을 변경하려고 시도한다
Then 변경이 거부된다
And "Owner 권한이 필요합니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 멤버 역할 변경 명령
interface ChangeMemberRoleCommand {
  organizationId: OrganizationId;
  targetMemberId: UserId;
  newRole: 'admin' | 'member';
  changedBy: UserId;
  timestamp: Date;
}

// Event: 멤버가 Admin으로 승격됨
interface MemberPromotedToAdminEvent {
  organizationId: OrganizationId;
  memberId: UserId;
  promotedBy: UserId;
  timestamp: Date;
}

// Event: Admin이 Member로 강등됨
interface AdminDemotedToMemberEvent {
  organizationId: OrganizationId;
  memberId: UserId;
  demotedBy: UserId;
  timestamp: Date;
}

// Aggregate: MembershipAggregate
class MembershipAggregate {
  // Command Handler: 멤버 역할 변경 처리
  changeMemberRole(command: ChangeMemberRoleCommand): MemberPromotedToAdminEvent | AdminDemotedToMemberEvent {
    // 1. 변경 권한 검증 (Owner만 가능)
    // 2. 대상 멤버 존재 확인
    // 3. Owner 역할 변경 방지
    // 4. 역할 변경 처리
    // 5. 해당 이벤트 발행
  }
}
```

### Repository 메서드
```typescript
interface MembershipRepository {
  findById(id: MembershipId): Promise<MembershipAggregate | null>;
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  update(membership: MembershipAggregate): Promise<void>;
}
```

### Server Actions
```typescript
// 멤버 역할 변경 처리
async function changeMemberRoleAction(input: ChangeMemberRoleCommand): Promise<Result<MemberPromotedToAdminEvent | AdminDemotedToMemberEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. MembershipManagementService를 통해 changeMemberRole 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- memberships 테이블 (역할 변경)
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
- [ ] `MembershipAggregate`에 `changeMemberRole` Command Handler 구현
- [ ] `MemberPromotedToAdminEvent`, `AdminDemotedToMemberEvent` 도메인 이벤트 정의
- [ ] `MembershipManagementService`에 멤버 역할 변경 메서드 추가
- [ ] 멤버 역할 변경 권한 검증 로직 구현

### Database & Repository
- [ ] `MembershipRepository`에 역할 변경 관련 메서드 구현

### API & Server Action
- [ ] `changeMemberRoleAction` Server Action 구현
- [ ] 멤버 역할 변경 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] 멤버 역할 변경 UI 컴포넌트
- [ ] 멤버 역할 표시
- [ ] 역할 변경 확인 다이얼로그
- [ ] 역할 변경 진행 상태 표시

### Integration Task
- [ ] Clerk 멤버 역할 변경 API 연동
- [ ] 역할 변경 시 Clerk 동기화
- [ ] 역할 변경 시 다른 도메인 컨텍스트 연동

### E2E & Observability
- [ ] 멤버 역할 변경 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] Owner 역할 변경 방지 테스트
- [ ] 멤버 역할 변경 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 멤버 역할 변경 기능
- [ ] Admin 승격 기능
- [ ] Admin 강등 기능
- [ ] Owner 역할 변경 방지

### 기술적 완료
- [ ] `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 멤버 역할 변경 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 멤버 역할 변경 성능 요구사항 충족 (예: 500ms 이내)
- [ ] 멤버 역할 변경 시 데이터 일관성 보장
- [ ] 멤버 역할 변경 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-011: 이메일 기반 멤버 초대
- Story UM-012: 초대 수락/거절 처리
**후행 Story**:
- Story UM-014: 멤버 제거 기능
- Story UM-015: 초대 취소 및 재초대
**외부 의존성**:
- Clerk 멤버 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 4: 멤버 역할 변경 및 관리
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - memberships, membership_role_changes 테이블 스키마
