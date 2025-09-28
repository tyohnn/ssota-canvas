# Story UM-008: 조직 소유권 이전

## 🎯 Story 개요
**User Story**: As a 조직 소유자, I want to 조직의 소유권을 다른 멤버에게 이전할 수 있어야 so that 조직 관리 책임을 위임하고 조직의 지속성을 보장할 수 있다
**Story Points**: 8pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 소유권 이전 요청
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 소유권 이전을 요청한다
And 대상 멤버를 선택한다
And 확인 코드를 입력한다
Then 소유권 이전이 처리된다
And 'OwnershipTransferRequested' 이벤트가 발행된다
And 'NewOwnerPromoted' 이벤트가 발행된다
And 'PreviousOwnerDemotedToAdmin' 이벤트가 발행된다
```

### 시나리오 2: 소유권 이전 완료
```gherkin
Given 소유권 이전이 요청되었다
When 소유권 이전이 완료된다
Then 새 소유자가 Owner 권한을 가진다
And 기존 소유자가 Admin 권한으로 변경된다
And 'OwnershipTransferCompleted' 이벤트가 발행된다
And 모든 워크스페이스 소유권이 이전된다
```

### 시나리오 3: 소유권 이전 권한 검증
```gherkin
Given 사용자가 조직의 Admin 또는 Member 권한만 가지고 있다
When 사용자가 소유권 이전을 시도한다
Then 요청이 거부된다
And "Owner 권한이 필요합니다" 에러 메시지가 표시된다
```

### 시나리오 4: 대상 멤버 검증
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 존재하지 않는 멤버에게 소유권 이전을 시도한다
Then 요청이 거부된다
And "대상 멤버를 찾을 수 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 조직 소유권 이전 명령
interface TransferOrganizationOwnershipCommand {
  organizationId: OrganizationId;
  currentOwnerId: UserId;
  newOwnerId: UserId;
  confirmationCode: string;
  timestamp: Date;
}

// Event: 소유권 이전 요청됨
interface OwnershipTransferRequestedEvent {
  organizationId: OrganizationId;
  currentOwnerId: UserId;
  newOwnerId: UserId;
  timestamp: Date;
}

// Event: 새 소유자가 승격됨
interface NewOwnerPromotedEvent {
  organizationId: OrganizationId;
  newOwnerId: UserId;
  timestamp: Date;
}

// Event: 기존 소유자가 Admin으로 강등됨
interface PreviousOwnerDemotedToAdminEvent {
  organizationId: OrganizationId;
  previousOwnerId: UserId;
  timestamp: Date;
}

// Aggregate: OrganizationAggregate
class OrganizationAggregate {
  // Command Handler: 소유권 이전 처리
  transferOwnership(command: TransferOrganizationOwnershipCommand): OwnershipTransferRequestedEvent {
    // 1. 현재 소유자 권한 검증
    // 2. 대상 멤버 존재 및 멤버십 검증
    // 3. 확인 코드 검증
    // 4. 소유권 이전 처리
    // 5. OwnershipTransferRequestedEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  update(organization: OrganizationAggregate): Promise<void>;
}

interface MembershipRepository {
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  update(membership: MembershipAggregate): Promise<void>;
}
```

### Server Actions
```typescript
// 소유권 이전 처리
async function transferOwnershipAction(input: TransferOrganizationOwnershipCommand): Promise<Result<OwnershipTransferRequestedEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. OrganizationManagementService를 통해 transferOwnership 명령 실행
  // 3. MembershipManagementService를 통해 역할 변경 처리
  // 4. 결과 반환
}
```

### Database Schema
```sql
-- organizations 테이블 (소유권 이전 시 owner_id 업데이트)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- memberships 테이블 (역할 변경 시 role 업데이트)
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
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `OrganizationAggregate`에 `transferOwnership` Command Handler 구현
- [ ] `OwnershipTransferRequestedEvent`, `NewOwnerPromotedEvent`, `PreviousOwnerDemotedToAdminEvent` 도메인 이벤트 정의
- [ ] `OrganizationManagementService`에 소유권 이전 메서드 추가
- [ ] `MembershipManagementService`에 역할 변경 메서드 추가

### Database & Repository
- [ ] `OrganizationRepository`에 소유권 이전 메서드 구현
- [ ] `MembershipRepository`에 역할 변경 메서드 구현
- [ ] 소유권 이전 시 트랜잭션 처리

### API & Server Action
- [ ] `transferOwnershipAction` Server Action 구현
- [ ] 소유권 이전 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] 소유권 이전 UI 컴포넌트
- [ ] 대상 멤버 선택 드롭다운
- [ ] 확인 코드 입력 폼
- [ ] 소유권 이전 진행 상태 표시

### Integration Task
- [ ] Clerk 조직 소유권 이전 API 연동
- [ ] 소유권 이전 시 Clerk 동기화
- [ ] 소유권 이전 시 워크스페이스 소유권 이전 연동

### E2E & Observability
- [ ] 소유권 이전 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 소유권 이전 시 데이터 일관성 테스트
- [ ] 소유권 이전 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 소유권 이전 요청 및 처리
- [ ] 새 소유자 권한 승격
- [ ] 기존 소유자 권한 강등
- [ ] 소유권 이전 권한 검증

### 기술적 완료
- [ ] `OrganizationAggregate`, `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 소유권 이전 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 소유권 이전 성능 요구사항 충족 (예: 2초 이내)
- [ ] 소유권 이전 시 데이터 일관성 보장
- [ ] 소유권 이전 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-006: 조직 생성 및 관리
- Story UM-007: 조직 정보 수정
**후행 Story**:
- Story UM-009: 조직 소프트 삭제
- Story UM-013: 멤버 역할 변경
**외부 의존성**:
- Clerk 조직 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 3: 조직 소유권 이전
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Organization, Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - OrganizationAggregate, MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - organizations, memberships 테이블 스키마
