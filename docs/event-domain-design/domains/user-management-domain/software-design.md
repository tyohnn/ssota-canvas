# User Management Domain - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, User Management Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Supabase Auth**: External System으로 유지 (사용자 인증의 SSOT)
- **Anti-Corruption Layer**: Supabase Auth API와 도메인 모델 간의 변환 계층 구현

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates (Scenario 0-1 기준)

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| User Authentication System | **User Aggregate** | 사용자 인증, 세션 관리, 기본 조직 생성 |
| Supabase Auth System | **Supabase Auth System** | 구글 인증, 유저 계정 생성, 세션 토큰 관리 |
| Profile System | **User Aggregate** | 사용자 프로필 생성 및 관리 |
| Organization System | **Organization Aggregate** | 조직 생성/관리, 조직 조회, 권한 관리 |
| 프론트엔드 (Frontend) | **Frontend** | UI 상태 관리, 초기 조직 선택 로직 |

---

## 📦 Aggregate 상세 정의

### 1. User Aggregate

**핵심 개념**: "플랫폼 사용자의 인증, 세션, 조직 컨텍스트를 관리하는 집합체"

#### Commands (받는 명령)
- Process User Registration // 구글 OAuth 코드로 사용자 등록 처리
- Create Supabase User // Supabase Auth에서 사용자 계정 생성
- Create User Profile // 사용자 프로필 생성 및 관리
- Process Onboarding // 온보딩 진행 처리
- User Login // 사용자 로그인 처리 및 세션 생성
- User Logout // 사용자 로그아웃 및 세션 정리
- Select Organization // 사용자가 작업할 조직 선택
- Set Organization Context // 선택된 조직으로 컨텍스트 설정

#### Events (발생 이벤트)
- Supabase User Created // Supabase Auth에서 사용자 계정이 생성됨
- User Profile Created // 사용자 프로필이 생성됨
- User Registration Completed // 사용자 등록이 완료됨
- User Registration Failed // 사용자 등록이 실패함
- Onboarding Completed // 온보딩이 완료됨
- User Logged In // 사용자가 성공적으로 로그인함
- User Session Created // 새로운 사용자 세션이 생성됨
- Organization Selected by User // 사용자가 특정 조직을 선택함
- Organization Context Set // 조직 컨텍스트가 설정됨
- User Session Expired // 사용자 세션이 만료됨

#### 핵심 불변식 (Invariants)
- 구글 OAuth 인증이 성공한 경우에만 사용자 계정 생성 가능
- Supabase Auth ID와 Profile ID는 1:1 매핑되어야 함
- 사용자는 반드시 하나의 기본 조직을 가져야 함
- 로그인 상태에서는 반드시 하나의 조직 컨텍스트가 설정되어야 함

#### 속성 (Properties)
```typescript
// Aggregate 모델 (비즈니스 로직)
{
  id: UserId,                    // Supabase Auth ID
  email: string,                // 사용자 이메일 (처음에는 구글 계정에서 가져옴)
  name: string,                 // 사용자 이름 (처음에는 구글 계정에서 가져옴)
  profileImageUrl?: string,     // 프로필 이미지 URL (처음에는 구글 계정에서 가져옴)
  defaultOrganizationId: OrganizationId,  // 기본 조직 ID (Organization 테이블에서 조회)
  lastLoginAt?: Date,           // 마지막 로그인 시간
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}

// DB 스키마 (영속화)
// auth.users 테이블: Supabase Auth에서 관리 (id, email, created_at 등)
// public.profiles 테이블: id (auth.users.id와 1:1), name, profile_image_url, last_login_at, created_at, updated_at
// organization 테이블에서 owner_id=profile.id 인 조직을 기본 조직으로 조회
// 현재 조직은 세션/메모리에만 저장
```

---

### 2. Organization Aggregate

**핵심 개념**: "유저들 협업하는 조직 단위와 기본 조직 생명주기를 관리하는 집합체"

#### Commands
- Create Default Organization // 사용자 등록 시 기본 조직 생성
- Retrieve User Organizations // 유저 관련 조직 (소유, 소속) 조회
- Update Organization // 조직 정보 수정

#### Events
- Default Organization Created // 기본 조직이 생성됨
- Related Organizations Retrieved // 유저 관련 조직이 조회됨
- Initial Organization Selected // 초기 조직이 선택됨
- Organization Selected // 조직이 선택됨

#### 핵심 불변식
- 조직은 반드시 하나의 Owner를 가져야 함
- 기본 조직은 삭제할 수 없음
- 조직 ID는 org_ 접두사를 가져야 함
- 동일한 조직 ID가 중복될 수 없음

#### 속성
```typescript
{
  id: OrganizationId,           // Supabase 내부 ID (org_ 접두사)
  name: string,                 // 조직 이름
  ownerId: UserId,              // 조직 소유자 ID
  isDefault: boolean,           // 기본 조직 여부
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}
```

---

## 🔲 Bounded Context 정의

### User Management Context

**언어적 특징**:
- "User" = 플랫폼을 사용하는 개별 사용자 (Supabase Auth ID로 식별)
- "Organization" = 유저들이 협업하는 조직 단위
- "Default Organization" = 유저 가입 시 자동 생성되는 개인 조직
- "Profile" = 유저의 추가 정보 (이름, 프로필 이미지 등)
- "Onboarding" = 신규 유저를 위한 가이드 과정

**핵심 책임**:
- 사용자 인증 및 세션 관리 (Supabase Auth 기반)
- 구글 OAuth를 통한 사용자 등록
- 사용자 프로필 생성 및 관리
- 기본 조직 생성 및 관리
- 조직 조회 및 선택 기능
- 온보딩 프로세스 관리

**포함된 Aggregates**:
- User Aggregate (사용자 인증, 세션, 프로필, 온보딩 관리)
- Organization Aggregate (기본 조직 생성, 조직 조회, 조직 선택)

**External System Integration**:
- **Supabase Auth**: 사용자 인증 SSOT
  - 구글 OAuth를 통한 사용자 인증
  - 세션 관리 및 자동 토큰 갱신
  - Anti-Corruption Layer로 도메인 모델과 분리

---

## 🔀 다른 Context와의 경계

### Workspace Structure Context와의 경계

**언어적 차이**:
| User Management Context | Workspace Structure Context |
|---------------------|-------------------|
| "Organization" | "Workspace Owner Organization" |
| "User" | "Workspace Creator/Member" |
| "Default Organization" | "Default Workspace" |

**통합 이벤트**:
- `Default Organization Created` → `Create Default Workspace`
- `Organization Selected` → `Set Workspace Context`

### Visual Canvas Context와의 경계

**언어적 차이**:
| User Management Context | Visual Canvas Context |
|---------------------|-------------------|
| "Organization Context" | "Canvas Collaboration Context" |
| "User Session" | "Canvas User Session" |

**통합 이벤트**:
- `Organization Context Set` → `Initialize Canvas Context`
- `User Logged In` → `Restore Canvas Session`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│              User Management Context                    │
│                                                         │
│  ┌─────────────┐ ┌───────────────┐                     │
│  │    User     │ │ Organization  │                     │
│  │ Aggregate   │ │  Aggregate    │                     │
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
     │ • Default Organization Created        │
     │ • Organization Context Set            │
     │ • User Logged In                      │
     │ • User Registration Completed         │
     └──────────────────────────────────────┘
          │              │              │
    ┌─────┘              │              └─────┐
    ▼                    ▼                    ▼
┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Workspace       │ │ Visual Canvas  │ │ Component System │
│ Structure       │ │ Context        │ │ Context          │
│ Context         │ │                │ │                  │
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

### 2. 2개 Aggregate 분리 설계 (Scenario 0-1 기준)
- **문제**: User와 Organization을 하나의 Aggregate로 할지 분리할지
- **해결**: 각각 독립된 Aggregate로 분리하여 책임 명확화
- **대안**: User Aggregate 하나로 통합, Organization을 User의 하위 엔티티로 설계
- **결정 이유**: 단일 책임 원칙, 조직의 독립적 생명주기 관리, 향후 확장성

### 3. 기본 조직 자동 생성 정책
- **문제**: 사용자 등록 시 조직을 자동 생성할지 사용자가 직접 생성할지
- **해결**: 사용자 등록 시 기본 조직 자동 생성
- **대안**: 사용자가 직접 조직 생성, 조직 없이 사용자만 생성
- **결정 이유**: 사용자 경험 향상, 즉시 사용 가능한 환경 제공

---

## 📖 Read Models (Query Side)

### UserOrganizationView
**목적**: Scenario 1에서 "유저 관련 조직을 조회하기" 명령의 결과 데이터 제공

```typescript
interface UserOrganizationView {
  userId: UserId;                    // 사용자 ID
  ownedOrganizations: OrganizationSummary[]; // 소유한 조직 목록
  memberOrganizations: OrganizationSummary[]; // 소속된 조직 목록 (현재는 빈 배열)
}

interface OrganizationSummary {
  id: OrganizationId;               // 조직 ID
  name: string;                     // 조직 이름
  role: "owner" | "member";         // 사용자 역할
  isDefault: boolean;               // 기본 조직 여부
  createdAt: Date;                  // 생성 시간
}
```

**Process Model 매핑**:
- **"유저가 소유한 조직 조회"** → `ownedOrganizations`
- **"유저가 소속된 조직 조회"** → `memberOrganizations`
- **"유저의 조직 권한도 함께 로드"** → `OrganizationSummary.role`

**Query Handler 책임**:
- 사용자별 소유 조직 목록 조회
- 사용자별 소속 조직 목록 조회 (현재는 빈 배열)
- 조직별 권한 정보 로드
- 초기 조직 선택을 위한 데이터 제공

### UserProfileView
**목적**: 사용자 프로필 정보와 기본 조직 컨텍스트 제공

```typescript
interface UserProfileView {
  userId: UserId;                    // 사용자 ID
  email: string;                     // 이메일
  name: string;                      // 이름
  profileImageUrl?: string;          // 프로필 이미지 URL
  defaultOrganization: {             // 기본 조직 정보
    id: OrganizationId;
    name: string;
  };
  lastLoginAt?: Date;                // 마지막 로그인 시간
  createdAt: Date;                   // 가입 시간
}
```

**Process Model 매핑**:
- **온보딩 완료 후 사용자 정보** → 전체 프로필 데이터
- **기본 조직 생성 완료** → `defaultOrganization`

**Query Handler 책임**:
- 사용자 기본 정보 조회
- 기본 조직 정보 연결
- 프로필 이미지 URL 관리

**서버-클라이언트 사용 방식**:
```typescript
// 서버 컴포넌트에서 조회
const userOrgData = await getUserOrganizations(userId);
const userProfile = await getUserProfile(userId);

// Context Provider에서 상태 관리
<OrganizationProvider initialData={userOrgData}>
  <UserProvider initialProfile={userProfile}>
    <Dashboard />
  </UserProvider>
</OrganizationProvider>
```

**최적화 포인트**:
- 조직 목록과 프로필 정보 병렬 조회
- 기본 조직 정보 중복 제거 (UserOrganizationView에서 참조)
- 초기 렌더링 최적화 (SSR 데이터 활용)

---

## 🤝 Service 레이어의 역할

Service 레이어는 여러 Aggregate와 외부 시스템을 한 자리에서 조율하는 **업무 진행 책임자**입니다.

- **업무 시나리오 연결**: 
  - 유저 등록 시 Supabase Auth에서 사용자를 생성하고, User Aggregate에서 프로필을 생성한 뒤, Organization Aggregate에서 기본 조직을 만들고 소유자 권한을 부여합니다.
  - 로그인 완료 시 Organization Aggregate에서 유저 관련 조직을 조회하고, 프론트엔드에서 초기 조직을 선택하여 컨텍스트를 설정합니다.

- **규칙 준수 확인**: 
  - 구글 OAuth 인증 성공 시에만 사용자 계정 생성
  - 기본 조직 생성 시 org_ 접두사와 중복 검사
  - 조직 선택 시 유저의 소유/소속 조직인지 권한 확인

- **외부 파트너 연동**: 
  - Supabase Auth API 호출 실패 시 사용자에게 적절한 오류 메시지 제공
  - 구글 OAuth 인증 실패 시 재시도 옵션 안내
  - 세션 만료 시 자동 갱신 또는 재로그인 유도

- **실패 대응 전략**: 
  - 유저 가입 실패 시 부분 생성된 데이터 정리
  - 기본 조직 생성 실패 시 유저에게 상태 안내 및 수동 생성 옵션 제공
  - 조직 조회 실패 시 기본 조직으로 폴백

- **즐거운 사용자 경험**: 
  - 온보딩 시 즉시 UI 업데이트로 진행 상태 표시
  - 조직 전환 시 즉시 컨텍스트 업데이트 후 백그라운드에서 데이터 동기화
  - 로그인 시 마지막 선택 조직으로 자동 컨텍스트 설정

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

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
  };
  error?: string;
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

#### Process Model 매핑
```typescript
// Scenario 0: 유저 가입
const authResult = await authService.signUpWithGoogle();
if (authResult.success) {
  // Event: 구글 OAuth 코드 전달받음
  await createUserProfile(authResult.user);
} else {
  // Event: 유저 가입 실패함
  showError(authResult.error);
}

// Scenario 1: 조직 조회
const currentUser = await authService.getCurrentUser();
if (currentUser) {
  // Command: 유저 관련 조직을 조회하기
  const organizations = await getUserOrganizations(currentUser.id);
}
```

#### Benefits
1. **단순성**: 복잡한 추상화 없이 필요한 기능만 제공
2. **실용성**: Supabase Auth의 성공/실패 결과만 간단하게 처리
3. **유지보수성**: 단순할수록 버그 적고 이해하기 쉬움
4. **MVP 적합**: 현재 요구사항에 충분한 기능 제공

---

## ✅ 검증 체크리스트

- [x] 각 Aggregate가 명확한 경계와 책임을 가지는가? (User, Organization 분리)
- [x] Process Model의 모든 System이 Aggregate로 적절히 매핑되었는가? (5개 System → 2개 Aggregate)
- [x] External System 처리가 적절한가? (Supabase Auth를 External System으로 유지)
- [x] Context 간 통합이 느슨하게 결합되어 있는가? (Integration Events 활용)
- [x] 핵심 불변식이 올바르게 정의되었는가? (각 Aggregate별 4개 불변식)
- [x] Cross-Domain 이벤트가 적절히 설계되었는가? (4개 Integration Events)

---

## 📊 성과 측정 지표

1. **Supabase Auth 동기화 성공률**: 99.9% 이상 (실패 시 재시도 포함)
2. **사용자 로그인 응답 시간**: 평균 500ms 이하 (조직 목록 포함)
3. **기본 조직 생성 성공률**: 99.5% 이상
4. **조직 컨텍스트 전환 시간**: 평균 200ms 이하 (캐싱 활용)
5. **온보딩 완료율**: 85% 이상 (신규 사용자 기준)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./event-storm.md)
- [Process Model 문서](./process-model.md)
- Database Schema 문서 (추후 작성)
- Technical Specification 문서 (추후 작성)
- API Specification 문서 (추후 작성)

---

이 Software Design 문서는 User Management Domain의 구현을 위한 완전한 설계 지침입니다. (Scenario 0-1 기준)