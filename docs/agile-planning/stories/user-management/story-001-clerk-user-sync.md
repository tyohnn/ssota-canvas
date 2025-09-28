# Story UM-001: Clerk 사용자 동기화 시스템

## 🎯 Story 개요
**User Story**: As a 플랫폼 사용자, I want to Clerk에 등록된 사용자 정보가 Supabase DB에 자동으로 동기화되어야 so that 플랫폼 내에서 내 프로필과 조직 정보를 일관되게 관리할 수 있다
**Story Points**: 8pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 새로운 사용자가 Clerk에 등록될 때
```gherkin
Given 새로운 사용자가 Clerk에 성공적으로 등록되었다
When Clerk Webhook을 통해 'user.created' 이벤트가 발생한다
Then Supabase DB의 'users' 테이블에 해당 사용자 정보가 동기화되어 저장된다
And 'clerk_id' 필드가 Clerk의 사용자 ID와 일치한다
And 'email' 필드가 Clerk의 이메일과 일치한다
And 'name' 필드가 Clerk의 이름과 일치한다
And 'created_at' 필드가 현재 시간으로 설정된다
```

### 시나리오 2: 기존 사용자 정보가 Clerk에서 업데이트될 때
```gherkin
Given 기존 사용자의 정보가 Clerk에서 업데이트되었다 (예: 이름, 이메일, 아바타)
When Clerk Webhook을 통해 'user.updated' 이벤트가 발생한다
Then Supabase DB의 'users' 테이블에 해당 사용자 정보가 업데이트된다
And 'updated_at' 필드가 갱신된다
And 기존 데이터는 보존된다
```

### 시나리오 3: 사용자가 Clerk에서 소프트 삭제될 때
```gherkin
Given 사용자가 Clerk에서 소프트 삭제되었다
When Clerk Webhook을 통해 'user.deleted' 이벤트가 발생한다
Then Supabase DB의 'users' 테이블에서 해당 사용자 레코드가 'deleted_at' 상태로 업데이트된다
And 실제 데이터는 30일간 보존된다
And 'status' 필드가 'soft_deleted'로 변경된다
```

### 시나리오 4: Clerk 데이터 동기화 실패 시
```gherkin
Given Clerk Webhook 이벤트가 발생했지만 Supabase DB 동기화에 실패했다
When 동기화 재시도 로직이 실행된다
Then 일정 시간 후 자동으로 동기화를 재시도한다
And 재시도 횟수를 초과하면 관리자에게 알림이 전송된다
And 사용자에게는 "잠시 후 다시 시도해주세요" 메시지가 표시된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: Clerk에서 발생한 사용자 이벤트를 동기화
interface SyncClerkUserCommand {
  clerkId: string; // Clerk 사용자 ID
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  status: 'active' | 'soft_deleted' | 'permanently_deleted'; // Clerk 사용자 상태
  metadata: Record<string, any>; // Clerk 사용자 메타데이터
  webhookType: 'user.created' | 'user.updated' | 'user.deleted';
}

// Event: Clerk 사용자 정보가 Supabase에 성공적으로 동기화됨
interface ClerkUserSyncedEvent {
  userId: string; // Supabase DB의 사용자 ID
  clerkId: string;
  email: string;
  status: 'active' | 'soft_deleted' | 'permanently_deleted';
  timestamp: Date;
}

// Aggregate: UserAggregate (사용자 정보 관리)
class UserAggregate {
  // Command Handler: Clerk 사용자 동기화 명령 처리
  syncClerkUser(command: SyncClerkUserCommand): ClerkUserSyncedEvent {
    // 1. Clerk ID로 기존 사용자 조회
    // 2. 사용자 상태(생성, 업데이트, 소프트 삭제)에 따라 비즈니스 로직 처리
    // 3. 필요한 경우 기본 조직 생성 로직 트리거 (user.created 시)
    // 4. ClerkUserSyncedEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface UserRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: UserId): Promise<UserAggregate | null>;
  findByClerkId(clerkId: string): Promise<UserAggregate | null>;
  update(user: UserAggregate): Promise<void>;
  softDelete(userId: UserId): Promise<void>;
}
```

### Server Actions
```typescript
// Clerk Webhook으로부터 데이터를 받아 사용자 동기화 로직을 트리거
async function syncClerkUserAction(input: SyncClerkUserCommand): Promise<Result<ClerkUserSyncedEvent, UserManagementErrorCode>> {
  // 1. 입력 유효성 검사
  // 2. UserManagementService를 통해 syncClerkUser 명령 실행
  // 3. 결과 반환 (성공 또는 에러)
}
```

### Database Schema
```sql
-- users 테이블 (기존 테이블에 동기화 관련 필드 추가/업데이트)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL, -- Clerk 사용자 ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'soft_deleted', 'permanently_deleted'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_users_clerk_id ON users (clerk_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);
```

## 📋 Sub-tasks

### Backend Domain
- [x] `UserAggregate`에 `syncClerkUser` Command Handler 구현
- [x] `ClerkUserSyncedEvent` 도메인 이벤트 정의
- [x] `UserManagementService`에 `syncClerkUser` 메서드 추가
- [x] `ClerkACL` (Anti-Corruption Layer)에 Clerk Webhook 데이터 매핑 로직 구현

### Database & Repository
- [x] `users` 테이블에 `clerk_id`, `status`, `deleted_at` 필드 추가/업데이트
- [x] `UserRepository`에 `findByClerkId`, `softDelete` 메서드 구현
- [x] `users` 테이블에 `clerk_id` 및 `email` 인덱스 설정

### API & Server Action
- [x] `syncClerkUserAction` Server Action 구현
- [x] Clerk Webhook으로부터의 요청 검증 및 보안 처리
- [x] 에러 처리 및 로깅 로직 구현

### Frontend
- [ ] (해당 없음 - 백엔드 동기화 로직)

### Integration Task
- [x] Clerk Webhook 설정 및 엔드포인트 연결
- [x] Clerk API를 통한 사용자 정보 조회/검증 로직 (필요 시)

### E2E & Observability
- [x] Clerk 사용자 생성/업데이트/삭제 시 Supabase DB 동기화 E2E 테스트
- [x] 동기화 실패 시 재시도 및 알림 로직 테스트
- [x] 동기화 관련 에러 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [x] Clerk 사용자 생성/업데이트/삭제 시 Supabase DB에 정확히 동기화
- [x] 동기화 실패 시 재시도 로직 정상 동작 및 알림 전송
- [ ] 기본 조직 자동 생성 로직 정상 동작

### 기술적 완료
- [x] `UserAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [x] `syncClerkUserAction` Server Action 통합 테스트 통과
- [x] 코드 리뷰 완료 및 컨벤션 준수
- [x] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [x] 동기화 과정에서 데이터 불일치 발생하지 않음
- [x] Clerk Webhook 보안 요구사항 충족
- [x] 동기화 성능 요구사항 충족 (예: 1초 이내)

## 🔗 의존성
**선행 Story**: 없음 (기반 동기화 시스템)
**후행 Story**:
- Story UM-002: 사용자 로그인/로그아웃 처리
- Story UM-004: 기본 조직 자동 생성 및 관리
**외부 의존성**:
- Clerk Webhook 서비스
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 0: Clerk 데이터 동기화
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - User Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - UserAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - users 테이블 스키마
