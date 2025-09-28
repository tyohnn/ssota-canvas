# Story UM-005: 조직 컨텍스트 전환

## 🎯 Story 개요
**User Story**: As a 플랫폼 사용자, I want to 소속된 조직들 간에 쉽게 전환할 수 있어야 so that 다양한 프로젝트와 팀에서 작업할 수 있다
**Story Points**: 3pts
**우선순위**: Medium
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 목록 조회 및 전환
```gherkin
Given 사용자가 로그인된 상태이다
When 사용자가 조직 전환 메뉴를 열었다
Then 사용자가 소유한 조직 목록이 표시된다
And 사용자가 멤버인 조직 목록이 표시된다
And 각 조직의 역할(Owner/Admin/Member)이 표시된다
And 현재 선택된 조직이 하이라이트된다
```

### 시나리오 2: 조직 선택 및 컨텍스트 전환
```gherkin
Given 사용자가 조직 목록을 보고 있다
When 사용자가 다른 조직을 선택한다
Then 선택된 조직으로 컨텍스트가 전환된다
And 'OrganizationSelectedByUser' 이벤트가 발행된다
And 'OrganizationContextSet' 이벤트가 발행된다
And UI가 새로운 조직 컨텍스트로 업데이트된다
```

### 시나리오 3: 기본 조직으로 자동 전환
```gherkin
Given 사용자가 로그인했다
When 사용자의 기본 조직이 설정되어 있다
Then 자동으로 기본 조직으로 컨텍스트가 설정된다
And 'OrganizationContextSet' 이벤트가 발행된다
And 사용자는 기본 조직에서 작업을 시작할 수 있다
```

### 시나리오 4: 조직 전환 권한 검증
```gherkin
Given 사용자가 특정 조직의 멤버가 아니다
When 사용자가 해당 조직으로 전환을 시도한다
Then 전환이 거부된다
And "접근 권한이 없습니다" 에러 메시지가 표시된다
And 현재 조직 컨텍스트가 유지된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 조직 선택 명령
interface SelectOrganizationCommand {
  userId: UserId;
  organizationId: OrganizationId;
  timestamp: Date;
}

// Command: 조직 컨텍스트 설정 명령
interface SetOrganizationContextCommand {
  userId: UserId;
  organizationId: OrganizationId;
  timestamp: Date;
}

// Event: 사용자가 조직을 선택함
interface OrganizationSelectedByUserEvent {
  userId: UserId;
  organizationId: OrganizationId;
  organizationName: string;
  userRole: 'owner' | 'admin' | 'member';
  timestamp: Date;
}

// Event: 조직 컨텍스트가 설정됨
interface OrganizationContextSetEvent {
  userId: UserId;
  organizationId: OrganizationId;
  organizationName: string;
  userRole: 'owner' | 'admin' | 'member';
  timestamp: Date;
}

// Aggregate: UserAggregate
class UserAggregate {
  // Command Handler: 조직 선택 처리
  selectOrganization(command: SelectOrganizationCommand): OrganizationSelectedByUserEvent {
    // 1. 사용자의 조직 멤버십 검증
    // 2. 조직 선택 이벤트 발행
  }

  // Command Handler: 조직 컨텍스트 설정
  setOrganizationContext(command: SetOrganizationContextCommand): OrganizationContextSetEvent {
    // 1. 조직 컨텍스트 설정
    // 2. OrganizationContextSetEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  updateCurrentOrganization(userId: UserId, organizationId: OrganizationId): Promise<void>;
}

interface MembershipRepository {
  findByUserId(userId: UserId): Promise<MembershipAggregate[]>;
  findByUserIdAndOrganizationId(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
}
```

### Server Actions
```typescript
// 조직 선택 처리
async function selectOrganizationAction(input: SelectOrganizationCommand): Promise<Result<OrganizationSelectedByUserEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. UserManagementService를 통해 selectOrganization 명령 실행
  // 3. 결과 반환
}

// 조직 컨텍스트 설정
async function setOrganizationContextAction(input: SetOrganizationContextCommand): Promise<Result<OrganizationContextSetEvent, UserManagementErrorCode>> {
  // 1. 조직 컨텍스트 설정
  // 2. UserManagementService를 통해 setOrganizationContext 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- users 테이블 (현재 조직 컨텍스트는 세션에만 저장)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_sessions 테이블 (현재 조직 컨텍스트 저장)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL,
  current_organization_id UUID REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Read Model: 사용자 조직 목록 조회용 뷰
CREATE VIEW user_organizations_view AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  o.id as organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  m.role,
  m.is_default,
  o.is_default as org_is_default
FROM users u
JOIN memberships m ON u.id = m.user_id
JOIN organizations o ON m.organization_id = o.id
WHERE m.status = 'active' AND o.deleted_at IS NULL;
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `UserAggregate`에 `selectOrganization`, `setOrganizationContext` Command Handler 구현
- [ ] `OrganizationSelectedByUserEvent`, `OrganizationContextSetEvent` 도메인 이벤트 정의
- [ ] `UserManagementService`에 조직 전환 메서드 추가
- [ ] 조직 멤버십 권한 검증 로직 구현

### Database & Repository
- [ ] `user_sessions` 테이블에 `current_organization_id` 필드 추가
- [ ] `user_organizations_view` Read Model 뷰 생성
- [ ] `UserRepository`, `MembershipRepository`에 조직 전환 관련 메서드 구현

### API & Server Action
- [ ] `selectOrganizationAction`, `setOrganizationContextAction` Server Action 구현
- [ ] 조직 전환 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] **사이드바 조직 선택기**: `OrganizationSelector` 컴포넌트 구현
- [ ] **조직 목록 표시**: 사용자 소유/소속 조직 목록 UI
- [ ] **현재 조직 컨텍스트**: 헤더/사이드바에 현재 조직 표시
- [ ] **조직 전환 로딩**: 전환 시 스피너 및 상태 관리
- [ ] **React Context 연동**: `UserManagementContext`를 통한 상태 관리
- [ ] **낙관적 업데이트**: 즉시 UI 반영 후 서버 검증

### Integration Task
- [ ] **UserManagementProvider**: 조직 컨텍스트 상태 관리
- [ ] **Custom Hook**: `useUserManagement()` Hook을 통한 조직 전환
- [ ] **Server Actions 연동**: `selectOrganizationAction` 호출
- [ ] **다른 도메인 연동**: 워크스페이스, 프로젝트 컨텍스트 업데이트

### E2E & Observability
- [ ] 조직 전환 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 조직 컨텍스트 전환 성능 테스트
- [ ] 조직 전환 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 사용자 조직 목록 조회
- [ ] 조직 선택 및 컨텍스트 전환
- [ ] 기본 조직 자동 설정
- [ ] 조직 전환 권한 검증

### 기술적 완료
- [ ] `UserAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 조직 전환 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 조직 전환 성능 요구사항 충족 (예: 200ms 이내)
- [ ] 조직 전환 시 데이터 일관성 보장
- [ ] 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-002: 사용자 로그인/로그아웃 처리
- Story UM-004: 기본 조직 자동 생성 및 관리
**후행 Story**:
- Story UM-006: 조직 생성 및 관리
- Story UM-011: 이메일 기반 멤버 초대
**외부 의존성**:
- Supabase 데이터베이스
- React Context (프론트엔드)

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 1: 사용자 로그인 및 조직 선택
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - User Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - UserAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - user_sessions, user_organizations_view 스키마
