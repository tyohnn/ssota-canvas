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
- [x] `OrganizationAggregate`에 `createOrganization`, `updateOrganization` Command Handler 구현
- [x] `OrganizationCreatedEvent`, `OrganizationUpdatedEvent` 도메인 이벤트 정의
- [x] `OrganizationManagementService`에 조직 CRUD 메서드 추가
- [x] 조직 slug 자동 생성 로직 구현

### Database & Repository
- [x] `organizations` 테이블 생성
- [x] `OrganizationRepository` 구현
- [x] 조직 slug 자동 생성 함수 구현
- [x] 조직 slug 중복 검사 로직

### API & Server Action
- [x] `createOrganizationAction`, `updateOrganizationAction` Server Action 구현
- [x] 조직 생성/수정 권한 검증 로직
- [x] 에러 처리 및 사용자 피드백

### Frontend
- [x] **조직 생성 폼 UI 컴포넌트**: `OrganizationForm` 컴포넌트 구현
  - `Input`, `Label`, `Button` UI 컴포넌트 활용
  - 조직명 입력 필드 (필수, 유효성 검증 포함)
  - 조직 설명 입력 필드 (선택사항)
  - 슬러그 입력 필드 (자동 생성 가능, 중복 검증)
  - 폼 제출 시 로딩 상태 표시
  - 생성 성공/실패 토스트 알림 (`toast.success`, `toast.error`)
- [x] **조직 정보 수정 UI 컴포넌트**: `OrganizationEditForm` 컴포넌트 구현
  - 기존 조직 정보로 폼 초기화
  - 수정 가능한 필드만 편집 가능
  - 변경 사항 저장 버튼
  - 수정 권한 검증 (Owner/Admin만 수정 가능)
- [x] **조직 정보 조회 UI 컴포넌트**: `OrganizationInfo` 컴포넌트 구현
  - 조직명, 설명, 슬러그 표시
  - 조직 멤버 수 표시
  - 조직 생성일 표시
  - 소유자 정보 표시
  - 읽기 전용 모드로 정보 표시
- [x] **조직 목록 표시 컴포넌트**: `OrganizationList` 컴포넌트 구현
  - 조직 목록을 카드/테이블 형태로 표시
  - 각 조직의 기본 정보 표시 (이름, 멤버 수, 생성일)
  - 기본 조직 표시 (Badge 컴포넌트 활용)
  - 조직별 액션 버튼 (편집, 삭제, 설정)
  - 권한에 따른 버튼 표시/숨김

### Integration Task
- [ ] **React Context 연동**: `useUserManagement()` Hook을 통한 조직 관리
  - `createOrganization`, `updateOrganization` 액션 구현
  - 조직 생성/수정 후 조직 목록 새로고침
  - Context 상태와 UI 동기화
- [ ] **설정 모달 통합**: 조직 관리 탭에서 CRUD 기능 제공
  - `SettingsModal`의 "조직" 탭에 조직 관리 기능 통합
  - 조직 생성 버튼 및 폼
  - 조직 목록 표시 및 편집 기능
  - 권한에 따른 기능 표시/숨김
- [ ] **낙관적 업데이트**: 즉시 UI 반영 후 서버 검증
  - `useOptimistic` Hook으로 즉시 UI 업데이트
  - 조직 생성 시 목록에 즉시 추가
  - 서버 응답 후 실제 데이터로 동기화
  - 실패 시 이전 상태로 롤백
- [ ] **Clerk 조직 생성 API 연동**
  - 조직 생성 시 Clerk 동기화
  - 조직 정보 수정 시 Clerk 동기화
  - Clerk 조직 ID와 Supabase 조직 연결

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
