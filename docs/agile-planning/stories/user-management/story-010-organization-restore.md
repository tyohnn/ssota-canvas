# Story UM-010: 조직 복구 기능

## 🎯 Story 개요
**User Story**: As a 조직 소유자, I want to 실수로 삭제한 조직을 복구할 수 있어야 so that 중요한 데이터를 보호하고 실수를 되돌릴 수 있다
**Story Points**: 3pts
**우선순위**: Low
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 복구
```gherkin
Given 사용자가 소프트 삭제된 조직의 소유자이다
When 사용자가 조직 복구를 요청한다
Then 조직이 복구된다
And 'OrganizationRestored' 이벤트가 발행된다
And 조직의 모든 멤버십이 복구된다
And 조직의 모든 워크스페이스가 복구된다
```

### 시나리오 2: 복구 가능한 조직 목록 조회
```gherkin
Given 사용자가 소프트 삭제된 조직들을 가지고 있다
When 사용자가 복구 가능한 조직 목록을 조회한다
Then 소프트 삭제된 조직 목록이 표시된다
And 각 조직의 삭제일이 표시된다
And 복구 가능한 기간이 표시된다
```

### 시나리오 3: 복구 불가능한 조직
```gherkin
Given 사용자가 30일 이상 전에 삭제된 조직을 복구하려고 시도한다
When 사용자가 조직 복구를 요청한다
Then 복구가 거부된다
And "복구 가능한 기간이 지났습니다" 에러 메시지가 표시된다
```

### 시나리오 4: 권한 없는 사용자의 복구 시도
```gherkin
Given 사용자가 조직의 소유자가 아니다
When 사용자가 조직 복구를 시도한다
Then 복구가 거부된다
And "권한이 없습니다" 에러 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 조직 복구 명령
interface RestoreOrganizationCommand {
  organizationId: OrganizationId;
  restoredBy: UserId;
  timestamp: Date;
}

// Event: 조직 복구됨
interface OrganizationRestoredEvent {
  organizationId: OrganizationId;
  restoredBy: UserId;
  restoredAt: Date;
  timestamp: Date;
}

// Aggregate: OrganizationAggregate
class OrganizationAggregate {
  // Command Handler: 조직 복구 처리
  restoreOrganization(command: RestoreOrganizationCommand): OrganizationRestoredEvent {
    // 1. 소유자 권한 검증
    // 2. 복구 가능한 기간 확인 (30일 이내)
    // 3. 조직 복구 처리
    // 4. OrganizationRestoredEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findSoftDeletedByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  restore(organizationId: OrganizationId): Promise<void>;
}
```

### Server Actions
```typescript
// 조직 복구 처리
async function restoreOrganizationAction(input: RestoreOrganizationCommand): Promise<Result<OrganizationRestoredEvent, UserManagementErrorCode>> {
  // 1. 사용자 권한 검증
  // 2. OrganizationManagementService를 통해 restoreOrganization 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- organizations 테이블 (복구 시 deleted_at NULL로 설정)
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
CREATE INDEX idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX idx_organizations_deleted_at ON organizations (deleted_at);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `OrganizationAggregate`에 `restoreOrganization` Command Handler 구현
- [ ] `OrganizationRestoredEvent` 도메인 이벤트 정의
- [ ] `OrganizationManagementService`에 조직 복구 메서드 추가
- [ ] 조직 복구 권한 검증 로직 구현

### Database & Repository
- [ ] `OrganizationRepository`에 복구 관련 메서드 구현
- [ ] `get_restorable_organizations` 함수 구현
- [ ] 조직 복구 시 트랜잭션 처리

### API & Server Action
- [ ] `restoreOrganizationAction` Server Action 구현
- [ ] 조직 복구 권한 검증 로직
- [ ] 에러 처리 및 사용자 피드백

### Frontend
- [ ] 조직 복구 UI 컴포넌트
- [ ] 복구 가능한 조직 목록 표시
- [ ] 조직 복구 확인 다이얼로그
- [ ] 복구 진행 상태 표시

### Integration Task
- [ ] Clerk 조직 복구 API 연동
- [ ] 조직 복구 시 Clerk 동기화
- [ ] 조직 복구 시 워크스페이스 복구 연동

### E2E & Observability
- [ ] 조직 복구 E2E 테스트
- [ ] 권한 검증 테스트
- [ ] 복구 기간 제한 테스트
- [ ] 조직 복구 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 조직 복구 기능
- [ ] 복구 가능한 조직 목록 조회
- [ ] 복구 기간 제한 (30일)
- [ ] 조직 복구 권한 검증

### 기술적 완료
- [ ] `OrganizationAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] 조직 복구 Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 조직 복구 성능 요구사항 충족 (예: 1초 이내)
- [ ] 조직 복구 시 데이터 일관성 보장
- [ ] 조직 복구 사용자 경험 테스트 통과

## 🔗 의존성
**선행 Story**: Story UM-009: 조직 소프트 삭제
**후행 Story**: 없음
**외부 의존성**:
- Clerk 조직 관리 API
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 6: 조직 삭제
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - Organization Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - OrganizationAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - organizations 테이블 스키마
