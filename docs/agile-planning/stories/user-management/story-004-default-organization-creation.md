# Story UM-004: 기본 조직 자동 생성

## 🎯 Story 개요
**User Story**: As a 플랫폼 사용자, I want to 회원가입 시 자동으로 기본 조직이 생성되어야 so that 개인 작업을 위한 전용 공간을 즉시 사용할 수 있다
**Story Points**: 8pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 사용자 등록 시 기본 조직 자동 생성
```gherkin
Given 새로운 사용자가 Clerk에 등록되었다
When 사용자 정보가 Supabase에 동기화된다
Then 자동으로 기본 조직이 생성된다
And 사용자는 해당 조직의 Owner 권한을 가진다
And 'DefaultOrganizationCreated' 이벤트가 발행된다
And 'NewMemberAddedToOrganization' 이벤트가 발행된다
```

### 시나리오 2: 기본 조직 정보 설정
```gherkin
Given 사용자의 기본 조직이 생성되었다
When 기본 조직 정보를 확인한다
Then 조직 이름이 "{사용자명}의 개인 조직"으로 설정된다
Then 조직 slug가 자동으로 생성된다
Then is_default 플래그가 true로 설정된다
Then 사용자가 Owner 역할을 가진다
```

### 시나리오 3: 기본 조직 생성 실패 시 재시도
```gherkin
Given 사용자 등록이 완료되었다
When 기본 조직 생성에 실패한다
Then 재시도 로직이 실행된다
And 최대 3회까지 재시도한다
And 재시도 실패 시 관리자에게 알림이 전송된다
```

### 시나리오 4: 기본 조직 중복 생성 방지
```gherkin
Given 사용자가 이미 기본 조직을 가지고 있다
When 기본 조직 생성 요청이 들어온다
Then 중복 생성을 방지한다
And 기존 기본 조직을 반환한다
And 에러 이벤트는 발생하지 않는다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 기본 조직 생성 명령
interface CreateDefaultOrganizationCommand {
  userId: UserId;
  userEmail: string;
  userName: string;
  clerkUserId: string;
  timestamp: Date;
}

// Event: 기본 조직 생성 완료
interface DefaultOrganizationCreatedEvent {
  organizationId: OrganizationId;
  userId: UserId;
  organizationName: string;
  organizationSlug: string;
  timestamp: Date;
}

// Event: 새 멤버가 조직에 추가됨
interface NewMemberAddedToOrganizationEvent {
  organizationId: OrganizationId;
  userId: UserId;
  role: 'owner';
  timestamp: Date;
}

// Aggregate: OrganizationAggregate
class OrganizationAggregate {
  // Command Handler: 기본 조직 생성
  createDefaultOrganization(command: CreateDefaultOrganizationCommand): DefaultOrganizationCreatedEvent {
    // 1. 사용자 정보로 기본 조직 이름 생성
    // 2. 조직 slug 자동 생성
    // 3. is_default=true로 설정
    // 4. DefaultOrganizationCreatedEvent 발행
  }
}

// Aggregate: MembershipAggregate
class MembershipAggregate {
  // Command Handler: Owner 멤버십 생성
  createOwnerMembership(command: CreateOwnerMembershipCommand): NewMemberAddedToOrganizationEvent {
    // 1. Owner 역할로 멤버십 생성
    // 2. NewMemberAddedToOrganizationEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  save(organization: OrganizationAggregate): Promise<void>;
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  findDefaultByUserId(userId: UserId): Promise<OrganizationAggregate | null>;
}

interface MembershipRepository {
  save(membership: MembershipAggregate): Promise<void>;
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  findByUserId(userId: UserId): Promise<MembershipAggregate[]>;
}
```

### Server Actions
```typescript
// 기본 조직 생성 처리
async function createDefaultOrganizationAction(input: CreateDefaultOrganizationCommand): Promise<Result<DefaultOrganizationCreatedEvent, UserManagementErrorCode>> {
  // 1. 사용자 정보 검증
  // 2. OrganizationManagementService를 통해 createDefaultOrganization 명령 실행
  // 3. MembershipManagementService를 통해 Owner 멤버십 생성
  // 4. 결과 반환
}
```

### Database Schema
```sql
-- organizations 테이블
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- memberships 테이블
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'removed')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, user_id)
);

-- 인덱스
CREATE INDEX idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX idx_organizations_is_default ON organizations (is_default);
CREATE INDEX idx_memberships_user_id ON memberships (user_id);
CREATE INDEX idx_memberships_organization_id ON memberships (organization_id);
CREATE INDEX idx_memberships_is_default ON memberships (is_default);
```

## 📋 Sub-tasks

### Backend Domain
- [x] `OrganizationAggregate`에 `createDefaultOrganization` Command Handler 구현
- [x] `MembershipAggregate`에 `createOwnerMembership` Command Handler 구현
- [x] `DefaultOrganizationCreatedEvent`, `NewMemberAddedToOrganizationEvent` 도메인 이벤트 정의
- [x] `OrganizationManagementService`에 기본 조직 생성 메서드 추가
- [x] `MembershipManagementService`에 Owner 멤버십 생성 메서드 추가

### Database & Repository
- [x] `organizations`, `memberships` 테이블 생성
- [x] `OrganizationRepository`, `MembershipRepository` 구현
- [x] 기본 조직 중복 생성 방지 로직 구현

### API & Server Action
- [x] `createDefaultOrganizationAction` Server Action 구현
- [x] 기본 조직 생성 실패 시 재시도 로직
- [x] 에러 처리 및 로깅

### Frontend
- [x] (해당 없음 - 백엔드 자동 생성 로직)

### Integration Task
- [x] Clerk 사용자 등록 이벤트와 연동
- [x] 기본 조직 생성 트리거 설정
- [x] 실패 시 알림 시스템 연동

### E2E & Observability
- [x] 사용자 등록 → 기본 조직 생성 E2E 테스트
- [x] 기본 조직 중복 생성 방지 테스트
- [x] 기본 조직 생성 실패 시 재시도 테스트
- [x] 기본 조직 생성 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 사용자 등록 시 기본 조직 자동 생성
- [ ] 사용자가 기본 조직의 Owner 권한을 가짐
- [ ] 기본 조직 중복 생성 방지
- [ ] 기본 조직 생성 실패 시 재시도

### 기술적 완료
- [ ] `OrganizationAggregate`, `MembershipAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] `createDefaultOrganizationAction` Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 기본 조직 생성 과정에서 데이터 불일치 발생하지 않음
- [ ] 기본 조직 생성 성능 요구사항 충족 (예: 2초 이내)
- [ ] 기본 조직 생성 실패율 1% 이하

## 🔗 의존성
**선행 Story**: Story UM-001: Clerk 사용자 동기화 시스템
**후행 Story**:
- Story UM-005: 조직 컨텍스트 전환
- Story UM-006: 조직 생성 및 관리
**외부 의존성**:
- Clerk 사용자 등록 이벤트
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 0: Clerk 데이터 동기화
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Organization, Membership Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - OrganizationAggregate, MembershipAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - organizations, memberships 테이블 스키마
