# Story UM-006: 조직 생성 및 관리

## 🎯 Story 개요
**User Story**: As a 조직 관리자, I want to 새로운 조직을 생성하고 기존 조직의 정보를 관리할 수 있어야 so that 팀과 프로젝트를 체계적으로 조직화할 수 있다
**Story Points**: 8pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 새 조직 생성
```gherkin
Given 사용자가 로그인된 상태이다
When 사용자가 새 조직 생성을 요청한다
And 조직 이름과 설명을 입력한다
Then 새로운 조직이 생성된다
And 사용자는 해당 조직의 Owner 권한을 가진다
And 'OrganizationCreated' 이벤트가 발행된다
And 'NewMemberAddedToOrganization' 이벤트가 발행된다
```

### 시나리오 2: 조직 정보 수정
```gherkin
Given 사용자가 조직의 Owner 또는 Admin 권한을 가지고 있다
When 사용자가 조직 정보를 수정한다
Then 조직 정보가 업데이트된다
And 'OrganizationUpdated' 이벤트가 발행된다
And 변경 사항이 즉시 반영된다
```

### 시나리오 3: 조직 정보 조회
```gherkin
Given 사용자가 조직의 멤버이다
When 사용자가 조직 정보를 조회한다
Then 조직의 기본 정보가 표시된다
And 조직의 멤버 수가 표시된다
And 사용자의 역할이 표시된다
And 조직의 생성일이 표시된다
```

### 시나리오 4: 조직 생성 권한 검증
```gherkin
Given 사용자가 로그인되지 않은 상태이다
When 사용자가 조직 생성을 시도한다
Then 요청이 거부된다
And "로그인이 필요합니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 조직 생성 명령
interface CreateOrganizationCommand {
  name: string;
  description?: string;
  slug?: string;
  createdBy: UserId;
  timestamp: Date;
}

// Command: 조직 정보 수정 명령
interface UpdateOrganizationCommand {
  organizationId: OrganizationId;
  name?: string;
  description?: string;
  slug?: string;
  updatedBy: UserId;
  timestamp: Date;
}

// Event: 조직 생성 완료
interface OrganizationCreatedEvent {
  organizationId: OrganizationId;
  name: string;
  slug: string;
  createdBy: UserId;
  timestamp: Date;
}

// Event: 조직 정보 업데이트
interface OrganizationUpdatedEvent {
  organizationId: OrganizationId;
  updatedFields: string[];
  updatedBy: UserId;
  timestamp: Date;
}

// Aggregate: OrganizationAggregate
class OrganizationAggregate {
  // Command Handler: 조직 생성
  createOrganization(command: CreateOrganizationCommand): OrganizationCreatedEvent {
    // 1. 조직 이름 및 slug 유효성 검증
    // 2. 조직 생성
    // 3. OrganizationCreatedEvent 발행
  }

  // Command Handler: 조직 정보 수정
  updateOrganization(command: UpdateOrganizationCommand): OrganizationUpdatedEvent {
    // 1. 수정 권한 검증
    // 2. 조직 정보 업데이트
    // 3. OrganizationUpdatedEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  save(organization: OrganizationAggregate): Promise<void>;
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findBySlug(slug: string): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  update(organization: OrganizationAggregate): Promise<void>;
}
```

### Server Actions
```typescript
// 조직 생성 처리
async function createOrganizationAction(input: CreateOrganizationCommand): Promise<Result<OrganizationCreatedEvent, UserManagementErrorCode>> {
  // 1. 사용자 인증 검증
  // 2. OrganizationManagementService를 통해 createOrganization 명령 실행
  // 3. 결과 반환
}

// 조직 정보 수정 처리
async function updateOrganizationAction(input: UpdateOrganizationCommand): Promise<Result<OrganizationUpdatedEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. OrganizationManagementService를 통해 updateOrganization 명령 실행
  // 3. 결과 반환
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
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 조직 slug 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_organization_slug(org_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9가-힣]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- 인덱스
CREATE INDEX idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX idx_organizations_slug ON organizations (slug);
CREATE INDEX idx_organizations_is_default ON organizations (is_default);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `OrganizationAggregate`에 `createOrganization`, `updateOrganization` Command Handler 구현
- [ ] `OrganizationCreatedEvent`, `OrganizationUpdatedEvent` 도메인 이벤트 정의
- [ ] `OrganizationManagementService`에 조직 CRUD 메서드 추가
- [ ] 조직 slug 자동 생성 로직 구현

### Database & Repository
- [ ] `organizations` 테이블 생성
- [ ] `OrganizationRepository` 구현
- [ ] 조직 slug 자동 생성 함수 구현
- [ ] 조직 slug 중복 검사 로직

### API & Server Action
- [ ] `createOrganizationAction`, `updateOrganizationAction` Server Action 구현
- [ ] 조직 생성/수정 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] 조직 생성 폼 UI 컴포넌트
- [ ] 조직 정보 수정 UI 컴포넌트
- [ ] 조직 정보 조회 UI 컴포넌트
- [ ] 조직 목록 표시 컴포넌트

### Integration Task
- [ ] Clerk 조직 생성 API 연동
- [ ] 조직 생성 시 Clerk 동기화
- [ ] 조직 정보 수정 시 Clerk 동기화

### E2E & Observability
- [ ] 조직 생성/수정 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 조직 slug 중복 처리 테스트
- [ ] 조직 관리 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 새 조직 생성 기능
- [ ] 조직 정보 수정 기능
- [ ] 조직 정보 조회 기능
- [ ] 조직 생성/수정 권한 검증

### 기술적 완료
- [ ] `OrganizationAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 조직 CRUD Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 조직 생성/수정 성능 요구사항 충족 (예: 1초 이내)
- [ ] 조직 slug 중복 처리 정상 동작
- [ ] 조직 관리 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-002: 사용자 로그인/로그아웃 처리
- Story UM-004: 기본 조직 자동 생성 및 관리
**후행 Story**:
- Story UM-007: 조직 정보 수정
- Story UM-008: 조직 소유권 이전
- Story UM-011: 이메일 기반 멤버 초대
**외부 의존성**:
- Clerk 조직 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 2: 멤버 초대 및 수락
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Organization Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - OrganizationAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - organizations 테이블 스키마
