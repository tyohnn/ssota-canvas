# Story UM-009: 조직 소프트 삭제

## 🎯 Story 개요
**User Story**: As a 조직 소유자, I want to 더 이상 필요없는 조직을 삭제할 수 있어야 so that 불필요한 조직을 정리하고 데이터를 체계적으로 관리할 수 있다
**Story Points**: 8pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 소프트 삭제
```gherkin
Given 사용자가 조직의 Owner 권한을 가지고 있다
When 사용자가 조직 삭제를 요청한다
And 조직 이름을 정확히 입력한다
Then 조직이 소프트 삭제된다
And 'OrganizationDeletionRequested' 이벤트가 발행된다
And 'OrganizationSoftDeleted' 이벤트가 발행된다
And 'PermanentDeletionScheduled' 이벤트가 발행된다
```

### 시나리오 2: 조직 삭제 확인
```gherkin
Given 사용자가 조직 삭제를 요청했다
When 사용자가 조직 이름을 입력한다
And 입력한 이름이 조직 이름과 일치한다
Then 조직 삭제가 진행된다
And 삭제 확인이 완료된다
```

### 시나리오 3: 잘못된 조직 이름 입력
```gherkin
Given 사용자가 조직 삭제를 요청했다
When 사용자가 잘못된 조직 이름을 입력한다
Then 삭제가 거부된다
And "조직 이름이 일치하지 않습니다" 에러 메시지가 표시된다
And 조직은 삭제되지 않는다
```

### 시나리오 4: 기본 조직 삭제 시도
```gherkin
Given 사용자가 기본 조직의 Owner 권한을 가지고 있다
When 사용자가 기본 조직 삭제를 시도한다
Then 삭제가 거부된다
And "기본 조직은 삭제할 수 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 조직 삭제 명령
interface DeleteOrganizationCommand {
  organizationId: OrganizationId;
  organizationName: string;
  deletedBy: UserId;
  timestamp: Date;
}

// Event: 조직 삭제 요청됨
interface OrganizationDeletionRequestedEvent {
  organizationId: OrganizationId;
  deletedBy: UserId;
  timestamp: Date;
}

// Event: 조직 소프트 삭제됨
interface OrganizationSoftDeletedEvent {
  organizationId: OrganizationId;
  deletedBy: UserId;
  deletedAt: Date;
  timestamp: Date;
}

// Event: 완전 삭제 예약됨
interface PermanentDeletionScheduledEvent {
  organizationId: OrganizationId;
  scheduledAt: Date;
  timestamp: Date;
}

// Aggregate: OrganizationAggregate
class OrganizationAggregate {
  // Command Handler: 조직 삭제 처리
  deleteOrganization(command: DeleteOrganizationCommand): OrganizationSoftDeletedEvent {
    // 1. 소유자 권한 검증
    // 2. 조직 이름 확인
    // 3. 기본 조직 삭제 방지
    // 4. 소프트 삭제 처리
    // 5. OrganizationSoftDeletedEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  update(organization: OrganizationAggregate): Promise<void>;
  softDelete(organizationId: OrganizationId): Promise<void>;
}
```

### Server Actions
```typescript
// 조직 삭제 처리
async function deleteOrganizationAction(input: DeleteOrganizationCommand): Promise<Result<OrganizationSoftDeletedEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. OrganizationManagementService를 통해 deleteOrganization 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- organizations 테이블 (소프트 삭제)
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

-- 인덱스
CREATE INDEX idx_organizations_deleted_at ON organizations (deleted_at);
```

## 📋 Sub-tasks

### Backend Domain
- [x] `OrganizationAggregate`에 `deleteOrganization` Command Handler 구현
- [x] `OrganizationDeletionRequestedEvent`, `OrganizationSoftDeletedEvent`, `PermanentDeletionScheduledEvent` 도메인 이벤트 정의
- [x] `OrganizationManagementService`에 조직 삭제 메서드 추가
- [x] 조직 삭제 권한 검증 로직 구현

### Database & Repository
- [x] `OrganizationRepository`에 소프트 삭제 메서드 구현
- [x] 조직 삭제 시 트랜잭션 처리

### API & Server Action
- [x] `deleteOrganizationAction` Server Action 구현
- [x] 조직 삭제 권한 검증 로직
- [x] 에러 처리 및 사용자 피드백

### Frontend
- [x] 조직 삭제 확인 UI 컴포넌트
- [x] 조직 이름 입력 폼
- [x] 조직 삭제 진행 상태 표시
- [x] 조직 삭제 경고 메시지

### Integration Task
- [ ] Clerk 조직 삭제 API 연동
- [ ] 조직 삭제 시 Clerk 동기화
- [ ] 조직 삭제 시 워크스페이스 삭제 연동

### E2E & Observability
- [ ] 조직 삭제 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 기본 조직 삭제 방지 테스트
- [ ] 조직 삭제 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 조직 소프트 삭제 기능
- [ ] 조직 삭제 확인 로직
- [ ] 기본 조직 삭제 방지
- [ ] 조직 삭제 권한 검증

### 기술적 완료
- [ ] `OrganizationAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 조직 삭제 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 조직 삭제 성능 요구사항 충족 (예: 2초 이내)
- [ ] 조직 삭제 시 데이터 일관성 보장
- [ ] 조직 삭제 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: 
- Story UM-006: 조직 생성 및 관리
- Story UM-008: 조직 소유권 이전
**후행 Story**:
- Story UM-010: 조직 복구 기능
**외부 의존성**:
- Clerk 조직 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 6: 조직 삭제
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Organization Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - OrganizationAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - organizations, organization_deletion_schedule 테이블 스키마
