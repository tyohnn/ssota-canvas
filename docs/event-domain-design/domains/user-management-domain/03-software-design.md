# User Management Domain - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, User Management Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Supabase Auth**: External System으로 유지 (사용자 인증의 SSOT)
- **Anti-Corruption Layer**: Supabase Auth API와 도메인 모델 간의 변환 계층 구현

### 🔗 Domain Integration
- **Organization Management Domain**: 기본 조직 생성, 계정 삭제 시 조직 처리
- **조직 조회/선택**: Organization Management Domain에서 처리 (Scenario 0)

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates (Scenario 1, 2 기준)

| Process Model (System) | Software Design (Aggregate) | 책임 | 구현 상태 |
|----------------------|---------------------------|------|----------|
| User Authentication System | **User Aggregate** | 사용자 인증, 세션 관리, 프로필 관리 | ✅ 완료 |
| Supabase Auth System | **Supabase Auth System** | 구글 인증, 유저 계정 생성, 세션 토큰 관리 | ✅ 완료 |
| Profile System | **User Aggregate** | 사용자 프로필 생성 및 관리 | ✅ 완료 |
| 프론트엔드 (Frontend) | **Frontend** | UI 상태 관리, 온보딩 로직 | ✅ 완료 |

---

## 📦 Aggregate 상세 정의

### 1. User Aggregate

**핵심 개념**: "플랫폼 사용자의 인증, 세션, 프로필을 관리하는 집합체"

#### Commands (받는 명령)
- Process User Registration // 구글 OAuth 코드로 사용자 등록 처리
- Create Supabase User // Supabase Auth에서 사용자 계정 생성
- Create User Profile // 사용자 프로필 생성 및 관리
- Process Onboarding // 온보딩 진행 처리
- User Login // 사용자 로그인 처리 및 세션 생성
- User Logout // 사용자 로그아웃 및 세션 정리
- Update User Profile // 사용자 프로필 수정
- Delete User Account // 사용자 계정 삭제

#### Events (발생 이벤트)
- Supabase User Created // Supabase Auth에서 사용자 계정이 생성됨
- User Profile Created // 사용자 프로필이 생성됨
- User Registration Completed // 사용자 등록이 완료됨
- User Registration Failed // 사용자 등록이 실패함
- Onboarding Completed // 온보딩이 완료됨
- User Logged In // 사용자가 성공적으로 로그인함
- User Session Created // 새로운 사용자 세션이 생성됨
- User Session Expired // 사용자 세션이 만료됨
- User Profile Updated // 사용자 프로필이 수정됨
- User Account Deleted // 사용자 계정이 삭제됨

#### 핵심 불변식 (Invariants)
- 구글 OAuth 인증이 성공한 경우에만 사용자 계정 생성 가능
- Supabase Auth ID와 Profile ID는 1:1 매핑되어야 함
- 사용자는 반드시 하나의 기본 조직을 가져야 함 (Organization Management Domain에서 생성)
- 로그인 상태에서는 반드시 하나의 조직 컨텍스트가 설정되어야 함
- 사용자 프로필은 필수 정보(이름, 이메일)를 반드시 포함해야 함
- 계정 삭제 시 소유 조직은 Organization Management Domain에서 처리

#### 속성 (Properties) - 실제 구현
```typescript
// 실제 구현된 User Entity
{
  id: UserId,                    // Supabase Auth ID
  email: UserEmail,             // 사용자 이메일 (Value Object로 래핑)
  name: string,                 // 사용자 이름
  avatarUrl: string | null,     // 프로필 이미지 URL
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}

// 실제 구현된 DB 스키마
// auth.users 테이블: Supabase Auth에서 관리 (id, email, created_at 등)
// public.profiles 테이블: id (auth.users.id와 1:1), name, avatar_url, created_at, updated_at
// 기본 조직은 Organization Management Domain에서 관리
// 현재 선택된 조직은 쿠키와 Context에서 관리
```

---

## 🔲 Bounded Context 정의

### User Management Context

**언어적 특징**:
- "User" = 플랫폼을 사용하는 개별 사용자 (Supabase Auth ID로 식별)
- "Profile" = 유저의 추가 정보 (이름, 프로필 이미지 등)
- "Onboarding" = 신규 유저를 위한 가이드 과정
- "Authentication" = 사용자 인증 및 세션 관리
- "Session" = 사용자 로그인 상태 및 세션 정보

**핵심 책임**:
- 사용자 인증 및 세션 관리 (Supabase Auth 기반) ✅
- 구글 OAuth를 통한 사용자 등록 (백엔드 완료, 프론트엔드 미구현)
- 사용자 프로필 생성 및 관리 ✅
- 온보딩 프로세스 관리 ✅
- 사용자 계정 삭제 처리 ✅

**포함된 Aggregates**:
- User Aggregate (사용자 인증, 세션, 프로필, 온보딩 관리) ✅

**External System Integration** - 구현 완료:
- **Supabase Auth**: 사용자 인증 SSOT ✅
  - 구글 OAuth를 통한 사용자 인증 (백엔드 완료)
  - 세션 관리 및 자동 토큰 갱신 ✅
  - Anti-Corruption Layer로 도메인 모델과 분리 ✅

---

## 🔀 다른 Context와의 경계

### Organization Management Context와의 경계

**언어적 차이**:
| User Management Context | Organization Management Context |
|---------------------|-------------------|
| "User" | "Organization Member" |
| "Profile" | "Member Profile" |
| "Default Organization" | "Organization" |

**통합 이벤트**:
- `User Registration Completed` → `Create Default Organization`
- `User Account Deleted` → `Handle User Deletion`

### Workspace Structure Context와의 경계

**언어적 차이**:
| User Management Context | Workspace Structure Context |
|---------------------|-------------------|
| "User Session" | "Workspace User Session" |
| "Profile" | "Workspace Creator Profile" |

**통합 이벤트**:
- `User Logged In` → `Initialize Workspace Context`
- `User Session Expired` → `Cleanup Workspace Session`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│              User Management Context                    │
│                                                         │
│  ┌─────────────┐ ┌───────────────┐                     │
│  │    User     │ │   Profile     │                     │
│  │ Aggregate   │ │  Management   │                     │
│  └─────┬───────┘ └─────┬─────────┘                     │
│        │               │                               │
│        └───────────────┼───────────────────────────────┘
│                        │                               │
│                        ▼                               │
│                 Domain Service                         │
│             (UserManagementCoordinator)                │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Integration Events
                         ▼
     ┌──────────────────────────────────────┐
     │        Integration Events             │
     ├──────────────────────────────────────┤
     │ • User Registration Completed         │
     │ • User Logged In                      │
     │ • User Account Deleted                │
     └──────────────────────────────────────┘
          │              │              │
    ┌─────┘              │              └─────┐
    ▼                    ▼                    ▼
┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Organization    │ │ Workspace      │ │ Component System │
│ Management      │ │ Structure      │ │ Context          │
│ Context         │ │ Context        │ │                  │
└─────────────────┘ └────────────────┘ └──────────────────┘

External System Integration:
┌─────────────────────────────────────────────────────────┐
│                  Supabase Auth (External)               │
│  ┌─────────────┐ ┌───────────────┐ ┌──────────────┐   │
│  │    User     │ │   Session     │ │   Google     │   │
│  │ Management  │ │ Management    │ │   OAuth      │   │
│  └─────────────┘ └───────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ API Calls + Auth Events
                         │ (Anti-Corruption Layer)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              User Management Context                    │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. Supabase Auth를 External System으로 유지
- **문제**: 사용자 인증을 자체 구현 vs 외부 서비스 활용
- **해결**: Supabase Auth를 SSOT로 유지하고 Anti-Corruption Layer로 분리
- **대안**: 자체 인증 시스템 구축, Clerk/Auth0/Firebase 등 다른 서비스
- **결정 이유**: 빠른 개발, 구글 OAuth 통합 용이성, 세션 관리 자동화

### 2. 단일 Aggregate 설계 (User Management Domain)
- **문제**: User와 Profile을 하나의 Aggregate로 할지 분리할지
- **해결**: User Aggregate 하나로 통합하여 사용자 관련 모든 정보 관리
- **대안**: User와 Profile을 별도 Aggregate로 분리
- **결정 이유**: 사용자 정보의 응집성, 단순한 구조, MVP 적합성

### 3. 기본 조직 생성 정책
- **문제**: 사용자 등록 시 조직을 자동 생성할지 사용자가 직접 생성할지
- **해결**: 사용자 등록 시 기본 조직 자동 생성 (Organization Management Domain에서 처리)
- **대안**: 사용자가 직접 조직 생성, 조직 없이 사용자만 생성
- **결정 이유**: 사용자 경험 향상, 즉시 사용 가능한 환경 제공

### 4. 사용자 프로필 단순화
- **문제**: 사용자 프로필에 어떤 정보를 포함할지
- **해결**: 필수 정보(이름, 이메일)만 포함하는 최소한의 프로필
- **대안**: 상세한 프로필 정보 수집, 소셜 미디어 연동
- **결정 이유**: 사용자 진입 장벽 최소화, 구글 계정 정보 활용

---

## 📖 Read Models (Query Side)

### UserProfileView
**목적**: 사용자 프로필 정보와 기본 정보 제공

```typescript
interface UserProfileView {
  userId: UserId;                    // 사용자 ID
  email: string;                     // 이메일
  name: string;                      // 이름
  profileImageUrl?: string;          // 프로필 이미지 URL
  lastLoginAt?: Date;                // 마지막 로그인 시간
  createdAt: Date;                   // 가입 시간
}
```

**Process Model 매핑**:
- **온보딩 완료 후 사용자 정보** → 전체 프로필 데이터
- **사용자 프로필 수정** → 프로필 정보 업데이트

**Query Handler 책임**:
- 사용자 기본 정보 조회
- 프로필 이미지 URL 관리
- 로그인 이력 추적

### UserSessionView
**목적**: 사용자 세션 상태 및 인증 정보 제공

```typescript
interface UserSessionView {
  userId: UserId;                    // 사용자 ID
  isAuthenticated: boolean;          // 인증 상태
  sessionExpiresAt?: Date;           // 세션 만료 시간
  lastActivityAt?: Date;             // 마지막 활동 시간
}
```

**Process Model 매핑**:
- **로그인 상태 확인** → `isAuthenticated`
- **세션 관리** → `sessionExpiresAt`

**Query Handler 책임**:
- 사용자 인증 상태 확인
- 세션 만료 시간 관리
- 활동 이력 추적

---

## 🤝 Service 레이어의 역할

Service 레이어는 User Aggregate와 외부 시스템을 한 자리에서 조율하는 **업무 진행 책임자**입니다.

- **업무 시나리오 연결**: 
  - 유저 등록 시 Supabase Auth에서 사용자를 생성하고, User Aggregate에서 프로필을 생성한 뒤, Organization Management Domain으로 "기본 조직 생성하기" 커맨드를 실행합니다.
  - 로그인 완료 시 User Aggregate에서 세션을 생성하고, Organization Management Domain에서 유저 관련 조직을 조회합니다.
  - 사용자 계정 삭제 시 User Aggregate에서 계정을 삭제하고, Organization Management Domain으로 "사용자 삭제 처리하기" 커맨드를 실행합니다.

- **규칙 준수 확인**: 
  - 구글 OAuth 인증 성공 시에만 사용자 계정 생성
  - 사용자 프로필 생성 시 필수 정보 검증
  - 계정 삭제 시 소유 조직 처리 확인

- **외부 파트너 연동**: 
  - Supabase Auth API 호출 실패 시 사용자에게 적절한 오류 메시지 제공
  - 구글 OAuth 인증 실패 시 재시도 옵션 안내
  - 세션 만료 시 자동 갱신 또는 재로그인 유도

- **실패 대응 전략**: 
  - 유저 가입 실패 시 부분 생성된 데이터 정리
  - 프로필 생성 실패 시 사용자에게 상태 안내 및 수동 생성 옵션 제공
  - 계정 삭제 실패 시 롤백 처리

- **즐거운 사용자 경험**: 
  - 온보딩 시 즉시 UI 업데이트로 진행 상태 표시
  - 로그인 시 마지막 세션 정보로 자동 복원
  - 프로필 수정 시 즉시 UI 반영

---

## 🛡️ Anti-Corruption Layer Design

### Supabase Auth 통합 (단순화된 접근)

#### AuthService Interface
복잡성을 줄이고 실용적인 인터페이스:

```typescript
interface AuthService {
  // Scenario 0: 사용자 등록
  signUpWithGoogle(): Promise<AuthResult>
  
  // Scenario 1: 로그인 상태 확인
  getCurrentUser(): Promise<User | null>
  
  // 기본 기능
  signOut(): Promise<void>
}
```

#### 간단한 타입 변환
복잡한 Translation Layer 대신 단순한 변환 함수:

```typescript
// Supabase User를 도메인 User로 변환
function toUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: supabaseUser.user_metadata.name,
    profileImageUrl: supabaseUser.user_metadata.avatar_url
  };
}
```

#### 실제 구현 예시
```typescript
export class SupabaseAuthService implements AuthService {
  async signUpWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      
      return {
        success: !error,
        user: data.user ? toUser(data.user) : undefined,
        error: error?.message
      };
    } catch (err) {
      return { success: false, error: 'Login failed' };
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? toUser(user) : null;
  }
  
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
```

---

## ✅ 검증 체크리스트

### 기존 구현 완료 (Scenario 0, 1, 8)
- [x] User Aggregate가 명확한 경계와 책임을 가지는가? ✅
- [x] External System 처리가 적절한가? (Supabase Auth를 External System으로 유지) ✅
- [x] Context 간 통합이 느슨하게 결합되어 있는가? (Integration Events 활용) ✅
- [x] Repository 패턴이 올바르게 구현되었는가? (Drizzle ORM 기반) ✅
- [x] Server Actions가 적절히 구현되었는가? (Next.js 기반) ✅
- [x] React Context가 적절히 구현되었는가? (User Context) ✅

### 신규 구현 필요 (사용자 계정 삭제)
- [ ] 사용자 계정 삭제 프로세스가 올바르게 설계되었는가? (소유 조직 처리) 🚧
- [ ] Organization Management Domain과의 통합이 적절히 설계되었는가? (사용자 삭제 이벤트) 🚧
- [ ] 사용자 데이터 정리 프로세스가 올바르게 설계되었는가? (프로필, 세션 정리) 🚧

---

## 📊 성과 측정 지표

### 기존 지표 (Scenario 0, 1)
1. **Supabase Auth 동기화 성공률**: 99.9% 이상 (실패 시 재시도 포함)
2. **사용자 로그인 응답 시간**: 평균 500ms 이하
3. **사용자 프로필 생성 성공률**: 99.5% 이상
4. **온보딩 완료율**: 85% 이상 (신규 사용자 기준)

### 신규 지표 (Scenario 8)
5. **사용자 계정 삭제 성공률**: 99% 이상 (소유 조직 처리 포함)
6. **계정 삭제 처리 시간**: 평균 2초 이하 (데이터 정리 포함)
7. **사용자 데이터 정리 완료율**: 100% (고아 데이터 방지)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- Database Schema 문서 (추후 작성)
- Technical Specification 문서 (추후 작성)
- API Specification 문서 (추후 작성)

---

이 Software Design 문서는 User Management Domain의 구현을 위한 완전한 설계 지침입니다. (Scenario 0, 1, 8 기준, 사용자 인증 및 프로필 관리)