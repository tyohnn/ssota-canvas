# Story UM-007: 조직 정보 수정

## 🎯 Story 개요
**User Story**: As a 조직 관리자, I want to 조직의 이름, 설명, 설정을 수정할 수 있어야 so that 조직 정보를 최신 상태로 유지하고 팀의 요구사항에 맞게 조정할 수 있다
**Story Points**: 5pts
**우선순위**: Medium
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 이름 수정
```gherkin
Given 사용자가 조직의 Owner 또는 Admin 권한을 가지고 있다
When 사용자가 조직 이름을 수정한다
Then 조직 이름이 업데이트된다
And 'OrganizationUpdated' 이벤트가 발행된다
And 변경 사항이 즉시 반영된다
```

### 시나리오 2: 조직 설명 수정
```gherkin
Given 사용자가 조직의 Owner 또는 Admin 권한을 가지고 있다
When 사용자가 조직 설명을 수정한다
Then 조직 설명이 업데이트된다
And 'OrganizationUpdated' 이벤트가 발행된다
And 변경 사항이 즉시 반영된다
```

### 시나리오 3: 조직 slug 수정
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 조직 slug를 수정한다
Then 조직 slug가 업데이트된다
And slug 중복 검사가 수행된다
And 'OrganizationUpdated' 이벤트가 발행된다
```

### 시나리오 4: 권한 없는 사용자의 수정 시도
```gherkin
Given 사용자가 조직의 Member 권한만 가지고 있다
When 사용자가 조직 정보를 수정하려고 시도한다
Then 수정이 거부된다
And "권한이 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 조직 정보 수정 명령
interface UpdateOrganizationCommand {
  organizationId: OrganizationId;
  name?: string;
  description?: string;
  slug?: string;
  updatedBy: UserId;
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
  // Command Handler: 조직 정보 수정
  updateOrganization(command: UpdateOrganizationCommand): OrganizationUpdatedEvent {
    // 1. 수정 권한 검증 (Owner 또는 Admin)
    // 2. 조직 정보 업데이트
    // 3. OrganizationUpdatedEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findBySlug(slug: string): Promise<OrganizationAggregate | null>;
  update(organization: OrganizationAggregate): Promise<void>;
  checkSlugAvailability(slug: string, excludeId?: OrganizationId): Promise<boolean>;
}
```

### Server Actions
```typescript
// 조직 정보 수정 처리
async function updateOrganizationAction(input: UpdateOrganizationCommand): Promise<Result<OrganizationUpdatedEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. OrganizationManagementService를 통해 updateOrganization 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- organizations 테이블 (기존 테이블 활용)
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

-- slug 중복 검사 함수
CREATE OR REPLACE FUNCTION check_slug_availability(slug TEXT, exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE organizations.slug = check_slug_availability.slug 
    AND (exclude_id IS NULL OR id != exclude_id)
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;
```

## 📋 Sub-tasks

### Backend Domain
- [x] `OrganizationAggregate`에 `updateOrganization` Command Handler 구현
- [x] `OrganizationUpdatedEvent` 도메인 이벤트 정의
- [x] `OrganizationManagementService`에 조직 수정 메서드 추가
- [x] 조직 수정 권한 검증 로직 구현

### Database & Repository
- [x] `OrganizationRepository`에 slug 중복 검사 메서드 구현
- [x] 조직 수정 시 updated_at 자동 갱신 로직
- [x] slug 중복 검사 함수 구현

### API & Server Action
- [x] `updateOrganizationAction` Server Action 구현
- [x] 조직 수정 권한 검증 로직
- [x] 에러 처리 및 사용자 피드백

### Frontend
- [x] 조직 정보 수정 폼 UI 컴포넌트
- [x] 조직 정보 수정 권한 표시
- [x] 조직 정보 수정 시 로딩 상태 처리

### Integration Task
- [ ] Clerk 조직 정보 수정 API 연동
- [ ] 조직 정보 수정 시 Clerk 동기화
- [ ] 조직 정보 수정 시 다른 도메인 컨텍스트 연동

### E2E & Observability
- [ ] 조직 정보 수정 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] slug 중복 처리 테스트
- [ ] 조직 정보 수정 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 조직 이름, 설명, slug 수정 기능
- [ ] 조직 수정 권한 검증
- [ ] slug 중복 검사 및 처리
- [ ] 조직 정보 수정 시 이벤트 발행

### 기술적 완료
- [ ] `OrganizationAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 조직 수정 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 조직 정보 수정 성능 요구사항 충족 (예: 500ms 이내)
- [ ] slug 중복 처리 정상 동작
- [ ] 조직 정보 수정 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: Story UM-006: 조직 생성 및 관리
**후행 Story**:
- Story UM-008: 조직 소유권 이전
- Story UM-009: 조직 소프트 삭제
**외부 의존성**:
- Clerk 조직 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 4: 멤버 역할 변경 및 관리
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Organization Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - OrganizationAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - organizations 테이블 스키마
