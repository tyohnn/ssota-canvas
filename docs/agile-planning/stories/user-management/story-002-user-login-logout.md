# Story UM-002: 사용자 로그인/로그아웃 처리

## 🎯 Story 개요
**User Story**: As a 플랫폼 사용자, I want to Clerk를 통해 안전하게 로그인하고 로그아웃할 수 있어야 so that 내 계정으로 플랫폼에 접근하고 세션을 종료할 수 있다
**Story Points**: 5pts
**우선순위**: High
**Epic**: Epic-001: User Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 성공적인 로그인
```gherkin
Given 사용자가 Clerk 인증을 통해 로그인했다
When 로그인 요청이 처리된다
Then 사용자 세션이 생성된다
And 사용자의 기본 조직 정보가 로드된다
And 사용자는 플랫폼에 접근할 수 있다
And 'UserLoggedIn' 이벤트가 발행된다
```

### 시나리오 2: 성공적인 로그아웃
```gherkin
Given 사용자가 로그인된 상태이다
When 로그아웃 요청이 처리된다
Then 사용자 세션이 무효화된다
And 사용자는 플랫폼에 접근할 수 없다
And 'UserLoggedOut' 이벤트가 발행된다
```

### 시나리오 3: 잘못된 인증 정보로 로그인 시도
```gherkin
Given 사용자가 잘못된 인증 정보를 입력했다
When 로그인 요청이 처리된다
Then 로그인이 실패한다
And 에러 메시지가 표시된다
And 세션은 생성되지 않는다
```

### 시나리오 4: 세션 만료 시 자동 로그아웃
```gherkin
Given 사용자가 로그인된 상태이다
When 세션이 만료된다
Then 자동으로 로그아웃된다
And 사용자에게 세션 만료 알림이 표시된다
And 재로그인이 필요하다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command: 사용자 로그인 명령
interface LoginUserCommand {
  clerkUserId: string; // Clerk 사용자 ID
  email: string;
  sessionId: string; // Clerk 세션 ID
  loginMethod: 'email' | 'oauth' | 'sso'; // 로그인 방법
  timestamp: Date;
}

// Command: 사용자 로그아웃 명령
interface LogoutUserCommand {
  userId: UserId;
  sessionId: string;
  timestamp: Date;
}

// Event: 사용자 로그인 성공
interface UserLoggedInEvent {
  userId: UserId;
  clerkUserId: string;
  sessionId: string;
  loginMethod: string;
  timestamp: Date;
}

// Event: 사용자 로그아웃
interface UserLoggedOutEvent {
  userId: UserId;
  sessionId: string;
  timestamp: Date;
}

// Aggregate: UserAggregate
class UserAggregate {
  // Command Handler: 사용자 로그인 처리
  loginUser(command: LoginUserCommand): UserLoggedInEvent {
    // 1. Clerk 인증 상태 검증
    // 2. 사용자 세션 생성
    // 3. 기본 조직 정보 로드
    // 4. UserLoggedInEvent 발행
  }

  // Command Handler: 사용자 로그아웃 처리
  logoutUser(command: LogoutUserCommand): UserLoggedOutEvent {
    // 1. 세션 무효화
    // 2. UserLoggedOutEvent 발행
  }
}
```

### Repository 메서드
```typescript
interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  findByClerkId(clerkId: string): Promise<UserAggregate | null>;
  updateSession(userId: UserId, sessionData: SessionData): Promise<void>;
  invalidateSession(userId: UserId, sessionId: string): Promise<void>;
}
```

### Server Actions
```typescript
// 사용자 로그인 처리
async function loginUserAction(input: LoginUserCommand): Promise<Result<UserLoggedInEvent, UserManagementErrorCode>> {
  // 1. Clerk 인증 상태 검증
  // 2. UserManagementService를 통해 loginUser 명령 실행
  // 3. 결과 반환
}

// 사용자 로그아웃 처리
async function logoutUserAction(input: LogoutUserCommand): Promise<Result<UserLoggedOutEvent, UserManagementErrorCode>> {
  // 1. 세션 무효화
  // 2. UserManagementService를 통해 logoutUser 명령 실행
  // 3. 결과 반환
}
```

### Database Schema
```sql
-- users 테이블 (기본 사용자 정보)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세션 관리는 Clerk에서 처리
-- Clerk API를 통해 세션 상태 확인 및 관리
```

## 📋 Sub-tasks

### Backend Domain
- [ ] `UserAggregate`에 `loginUser`, `logoutUser` Command Handler 구현
- [ ] `UserLoggedInEvent`, `UserLoggedOutEvent` 도메인 이벤트 정의
- [ ] `UserManagementService`에 `loginUser`, `logoutUser` 메서드 추가
- [ ] 세션 검증 로직 구현

### Database & Repository
- [ ] `UserRepository`에 로그인/로그아웃 관련 메서드 구현
- [ ] Clerk API를 통한 세션 상태 확인 로직 구현

### API & Server Action
- [ ] `loginUserAction`, `logoutUserAction` Server Action 구현
- [ ] Clerk 인증 상태 검증 로직
- [ ] 세션 보안 처리 (CSRF, XSS 방지)

### Frontend
- [ ] 로그인/로그아웃 UI 컴포넌트
- [ ] 세션 상태 관리 (React Context)
- [ ] 자동 로그아웃 처리 (세션 만료)

### Integration Task
- [ ] Clerk 인증 플로우 연동
- [ ] 세션 토큰 관리
- [ ] 보안 헤더 설정

### E2E & Observability
- [ ] 로그인/로그아웃 E2E 테스트
- [ ] 세션 만료 테스트
- [ ] 보안 테스트 (인증 우회 시도)

## 🎯 Definition of Done

### 기능적 완료
- [ ] Clerk를 통한 안전한 로그인/로그아웃
- [ ] 세션 관리 및 자동 만료 처리
- [ ] 잘못된 인증 정보 처리

### 기술적 완료
- [ ] `UserAggregate` 및 관련 도메인 로직 단위 테스트 커버리지 80% 이상
- [ ] `loginUserAction`, `logoutUserAction` Server Action 통합 테스트 통과
- [ ] 코드 리뷰 완료 및 컨벤션 준수
- [ ] 데이터베이스 스키마 변경 사항 반영 및 검증

### 품질 완료
- [ ] 보안 취약점 없음 (인증 우회 불가)
- [ ] 세션 보안 요구사항 충족
- [ ] 로그인/로그아웃 성능 요구사항 충족 (예: 500ms 이내)

## 🔗 의존성
**선행 Story**: Story UM-001: Clerk 사용자 동기화 시스템
**후행 Story**:
- Story UM-003: 사용자 세션 관리
- Story UM-004: 기본 조직 자동 생성 및 관리
**외부 의존성**:
- Clerk 인증 서비스
- Supabase 데이터베이스

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/user-management-domain/process-model.md) - Process 1: 사용자 로그인 및 조직 선택
- [Software Design](../event-domain-design/domains/user-management-domain/software-design.md) - User Aggregate 정의
- [Technical Specification](../event-domain-design/domains/user-management-domain/technical-specification.md) - UserAggregate 구현
- [Database Schema](../event-domain-design/domains/user-management-domain/db-schema.md) - users, user_sessions 테이블 스키마
