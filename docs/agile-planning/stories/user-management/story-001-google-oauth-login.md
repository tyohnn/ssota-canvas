# Story 001: 구글 OAuth 로그인

## 🎯 Story 개요
**User Story**: As a 방문자 I want to 구글 계정으로 로그인할 수 있어야 so that 서비스에 가입하고 사용할 수 있다
**Story Points**: 5
**우선순위**: High
**Epic**: Epic-001 User Management

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 구글 로그인 성공
```gherkin
Given 방문자가 로그인 페이지에 있다
When 구글 로그인 버튼을 클릭한다
Then 구글 OAuth 창이 열린다
And 구글 계정 정보를 입력한다
And 구글 인증이 성공한다
Then Supabase Auth에 사용자가 생성된다
And 사용자 프로필이 자동으로 생성된다
And 기본 조직이 자동으로 생성된다
And 대시보드로 리다이렉트된다
```

### 시나리오 2: 구글 로그인 실패
```gherkin
Given 방문자가 로그인 페이지에 있다
When 구글 로그인 버튼을 클릭한다
And 구글 인증이 실패한다
Then 오류 메시지가 표시된다
And 로그인 페이지에 머무른다
```

### 시나리오 3: 기존 사용자 재로그인
```gherkin
Given 이미 가입된 사용자가 있다
When 구글 로그인을 시도한다
And 구글 인증이 성공한다
Then 기존 프로필 정보를 업데이트한다
And 사용자의 조직 목록을 조회한다
And 대시보드로 리다이렉트된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command
interface GoogleOAuthLoginCommand {
  googleAuthCode: string;
  redirectUri: string;
}

// Event
interface UserLoggedInEvent {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  timestamp: Date;
}

// Aggregate
class UserAuthenticationAggregate {
  processGoogleOAuth(command: GoogleOAuthLoginCommand): UserLoggedInEvent {
    // 구글 OAuth 처리 로직
  }
}
```

### Supabase Auth 연동
```typescript
// Supabase Auth Service
export class SupabaseAuthService {
  async signInWithGoogle(): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    
    return {
      success: !error,
      user: data.user ? this.toUser(data.user) : undefined,
      error: error?.message
    };
  }
}
```

### Database Schema
```sql
-- profiles 테이블 (Supabase Auth 연동)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] UserAuthenticationAggregate 구현
- [ ] GoogleOAuthLoginCommand 정의
- [ ] UserLoggedInEvent 정의
- [ ] SupabaseAuthService 구현

### Database & Repository
- [ ] profiles 테이블 생성
- [ ] RLS 정책 설정
- [ ] Supabase Auth 연동 설정

### API & Server Action
- [ ] googleOAuthLoginAction 구현
- [ ] 에러 처리 및 검증 로직
- [ ] 세션 관리 로직

### Frontend
- [ ] 구글 로그인 버튼 컴포넌트
- [ ] 로그인 상태 관리
- [ ] 에러 처리 및 사용자 피드백

### Integration Task
- [ ] Supabase Auth 설정
- [ ] 구글 OAuth 설정
- [ ] 환경 변수 설정

### E2E & Observability
- [ ] 구글 로그인 E2E 테스트
- [ ] 에러 모니터링 설정
- [ ] 성능 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 구글 OAuth 로그인이 정상 동작
- [ ] 기존 사용자 재로그인이 정상 동작
- [ ] 로그인 실패 시 적절한 에러 메시지 표시
- [ ] Supabase Auth와 프로필 동기화

### 기술적 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족 (로그인 응답 시간 < 3초)

### 품질 완료
- [ ] 보안 취약점 0개
- [ ] 접근성 기준 충족
- [ ] 사용자 테스트 통과

## 🔗 의존성
**선행 Story**: 없음 (최우선 Story)
**후행 Story**: Story-002 (사용자 프로필 생성), Story-003 (기본 조직 생성)
**외부 의존성**: Supabase Auth, Google OAuth API

## 📁 관련 문서
- [Epic 문서](../../epics/epic-001-user-management.md)
- [Process Model](../../../event-domain-design/domains/user-management-domain/process-model.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/technical-specification.md)
