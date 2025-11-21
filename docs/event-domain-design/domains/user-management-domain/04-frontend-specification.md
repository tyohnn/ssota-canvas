# User Management Domain - Frontend Specification

이 문서는 **User Management Domain**의 현재 구현 상태를 반영한 프론트엔드 명세서입니다.
**08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션을 준수하여 작성되었습니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: User Management (사용자 인증 및 프로필 관리)
- **주요 기능**: 사용자 프로필 생성, 온보딩, 사용자 계정 삭제
- **UI 컴포넌트**: 로그인 UI (OAuth 버튼), 온보딩 화면, 사용자 프로필 카드
- **제외 범위**: 조직 조회/선택 (Organization Management Domain에서 처리)

### 현재 구현 상태
- ✅ **Phase 1**: 사용자 인증 및 프로필 생성 구현 완료 (Scenario 1)
- ✅ **Phase 2**: 온보딩 프로세스 구현 완료 (Scenario 1)  
- 📋 **Phase 3**: 사용자 계정 삭제 구현 예정 (Scenario 2)
- ℹ️ **조직 관련**: Organization Management Domain 참조

---

## 📋 1. DTO 타입 정의 (08-code-conventions.md 준수)

### 1.1 DTO 직렬화 컨벤션

**파일 위치**: `src/domains/user-management/shared/dtos/index.ts`

#### Next.js Server Actions 직렬화 제약 준수
- **Plain Object만 사용**: 클래스, 함수, Date 객체 등 직렬화 불가능한 타입 금지
- **ISO 문자열 사용**: Date → string 변환 (예: `createdAt: string`)
- **Value Object 직렬화**: Domain Value Object → string 변환 (예: `UserId` → `string`)

#### 실제 구현된 DTO 타입들

##### UserProfileView DTO
```typescript
export interface UserProfileView {
  userId: string; // Serialized from UserId
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: string; // Serialized from OrganizationId
    name: string;
  };
  lastLoginAt?: string; // ISO 8601 string (serialized from Date)
  createdAt: string; // ISO 8601 string (serialized from Date)
}
```

##### UserRegistrationResult DTO
```typescript
export interface UserRegistrationResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  defaultOrganization: {
    id: string;
    name: string;
    isDefault: boolean;
  };
}
```

#### 미구현 항목 (Scenario 8)
- **계정 삭제 관련 DTO**: Scenario 8 구현 시 추가 예정

### 1.2 CQRS Read/Write 분리

#### Write Side (Domain Objects)
- **Value Objects**: `UserId`, `UserEmail` (클래스)
- **Entities**: `User` (클래스)
- **Aggregates**: `UserAggregate` (클래스)
- **비즈니스 로직 & 불변식 검증**

#### Read Side (DTOs)
- **Read Models**: `UserProfileView`, `UserRegistrationResult` (interface, plain object)
- **데이터 투영 & 최적화된 조회**

#### Next.js Server Actions Boundary
- **DTO 직렬화**: 클래스 → plain object 변환
- **Date → ISO string 변환**
- **클라이언트 전달용 타입 보장**

## 🎛️ 2. React Context 구현 (08-code-conventions.md 준수)

### 2.1 Context 타입 정의

**파일 위치**: `src/domains/user-management/frontend/contexts/user-context.tsx`

#### Context State 인터페이스
```typescript
interface UserContextType {
  // 상태
  user: UserProfileView | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  refreshUser: () => Promise<void>;
  updateUserProfile: (data: UpdateUserProfileRequest) => Promise<void>;
}
```

#### Context Provider Props
```typescript
interface UserProviderProps {
  children: ReactNode;
  initialUser?: UserProfileView | null;
}
```

#### Context 설계 원칙 (08-code-conventions.md)
- **단일 책임**: 사용자 프로필 및 인증 상태 관리
- **상태 분리**: 로컬 상태와 전역 상태 구분
- **액션 제공**: 사용자 프로필 CRUD 작업을 위한 메소드
- **에러 처리**: 사용자 친화적 에러 메시지
- **성능 최적화**: useCallback, useMemo 활용

### 2.2 Provider 구현

**파일 위치**: `src/domains/user-management/frontend/contexts/user-context.tsx`

#### 주요 기능
- **상태 관리**: useState를 사용한 user, isLoading, error 상태 관리
- **초기 데이터 로드**: Provider 마운트 시 사용자 프로필 자동 조회
- **에러 처리**: API 호출 실패 시 에러 상태 설정

#### 핵심 로직
- **refreshUser**: Server Action을 호출하여 사용자 프로필 조회 및 상태 업데이트
- **updateUserProfile**: 사용자 프로필 수정 및 상태 갱신

#### 미구현 항목 (Scenario 8)
- **계정 삭제**: deleteUserAccount 메서드 추가 예정

## ⚡ 3. Server Actions 구현 (08-code-conventions.md 준수)

### 3.1 Server Actions 구조

**파일 위치**: `src/domains/user-management/actions/user-management.actions.ts`

#### 표준 패턴 (08-code-conventions.md)
```typescript
export async function [액션명]Action(
  // 입력 파라미터들
): Promise<[DTOType]> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Authentication required');

    // 2. 의존성 주입 (Repository, Service)
    const userRepository = new DrizzleUserRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const service = new UserManagementService(userRepository, supabaseAuthService);

    // 3. Command 생성
    const command: [CommandType] = { /* ... */ };

    // 4. 도메인 로직 실행
    const result = await service.[methodName](command);
    if (result.isError()) throw new Error(result.error.message);

    // 5. DTO 직렬화 및 반환
    return result.value; // 이미 Service에서 DTO로 직렬화됨
  } catch (error) {
    throw error; // 에러 전파
  }
}
```

#### 실제 구현된 Server Actions

##### createUserProfileAction  
- **역할**: 사용자 프로필을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: Supabase 사용자 정보를 기반으로 프로필 생성
- **반환**: UserProfileView DTO

##### processUserRegistrationAction
- **역할**: 사용자 등록 프로세스를 처리하는 Server Action (Scenario 0)
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 
  - 프로필 생성
  - Organization Management Domain에 기본 조직 생성 요청
  - 트랜잭션으로 처리
- **반환**: UserRegistrationResult DTO

##### getUserProfileAction
- **역할**: 사용자 프로필을 조회하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 사용자 ID로 프로필 조회
- **반환**: UserProfileView DTO

##### updateUserProfileAction
- **역할**: 사용자 프로필을 수정하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 사용자 이름, 프로필 이미지 등 수정
- **반환**: UserProfileView DTO

#### 핵심 원칙 (08-code-conventions.md)
- **DTO 반환**: Domain Objects를 직렬화하여 반환
- **Command 객체**: Software Design의 Command를 그대로 활용
- **Service Layer**: 비즈니스 로직은 Service에서 처리
- **에러 전파**: try-catch로 에러를 catch하고 throw로 전파
- **revalidatePath**: 데이터 변경 시 관련 페이지 재검증

#### 미구현 항목 (Scenario 8)
- **deleteUserAccountAction**: 사용자 계정 삭제 액션

### 3.2 에러 처리 (08-code-conventions.md 준수)

**파일 위치**: `src/domains/user-management/shared/errors/user-management.error.ts`

#### 에러 처리 원칙
- **도메인 에러**: 비즈니스 규칙 위반 + 사용자 친화적 메시지
- **시스템 에러**: 인프라/외부 서비스 문제
- **검증 에러**: 입력 데이터 유효성 검사 실패
- **에러 분류**: 타입별로 적절한 처리 방식 적용

#### 실제 구현된 에러 클래스
- **UserManagementError**: 사용자 관리 도메인의 기본 에러 클래스
- **UserManagementErrorCode**: 에러 코드 열거형
- **ERROR_MESSAGES**: 에러 메시지 매핑 (한국어 지원)

#### 미구현 항목 (향후 확장)
- **복잡한 에러 분류**: 현재는 기본적인 에러만 정의
- **에러 복구 로직**: 재시도 및 복구 메커니즘 미구현

## 🎣 4. Custom Hook 구현 (08-code-conventions.md 준수)

### 4.1 Hook 구조

**파일 위치**: `src/domains/user-management/frontend/hooks/use-user.ts`

#### Hook 설계 원칙 (08-code-conventions.md)
- **Context 확장**: 기존 Context 기능을 활용
- **비즈니스 로직**: 권한 체크, 상태 계산 등
- **액션 래퍼**: Context 액션 + 로컬 상태 업데이트
- **에러 처리**: 로컬 에러와 전역 에러 구분
- **성능 최적화**: useMemo, useCallback 활용

#### 실제 구현된 useUser Hook

##### 주요 기능
- **Context 연동**: UserContext를 사용하여 사용자 관련 상태와 액션에 접근
- **상태 제공**: user, isLoading, error 상태 제공
- **액션 제공**: refreshUser, updateUserProfile 액션 제공
- **유틸리티 함수**: 사용자 관련 편의 함수들 제공

##### 제공하는 상태
- **user**: UserProfileView | null - 사용자 프로필
- **isLoading**: boolean - 로딩 상태
- **error**: string | null - 에러 상태
- **isAuthenticated**: boolean - 인증 여부

##### 제공하는 액션
- **refreshUser**: 사용자 프로필 조회
- **updateUserProfile**: 사용자 프로필 수정

##### 유틸리티 함수
- **isOnboardingCompleted**: 온보딩 완료 여부 확인
- **hasDefaultOrganization**: 기본 조직 존재 여부 확인

#### 미구현 항목 (Scenario 8)
- **deleteUserAccount**: 사용자 계정 삭제 메서드
- **계정 삭제 확인**: 계정 삭제 전 확인 로직

## 🧩 5. React Components 구현 (08-code-conventions.md 준수)

### 5.1 컴포넌트 구조

**파일 위치**: `src/domains/user-management/frontend/components/`

#### 컴포넌트 설계 원칙 (08-code-conventions.md)
- **단일 책임**: 하나의 UI 기능만 담당
- **Props 인터페이스**: 명확한 타입 정의
- **상태 관리**: Custom Hook 활용
- **에러 처리**: 사용자 친화적 에러 표시
- **로딩 상태**: 적절한 로딩 인디케이터
- **접근성**: ARIA 속성 및 키보드 네비게이션
- **반응형**: 모바일 및 데스크톱 대응

#### 실제 구현된 컴포넌트들

##### UserProfileCard
- **위치**: `src/domains/user-management/frontend/components/user-profile-card.tsx`
- **역할**: 사용자 프로필 정보를 표시하는 카드 컴포넌트
- **기능**: 
  - 프로필 이미지, 이름, 이메일 표시
  - 프로필 수정 버튼
  - 로딩 상태 처리
- **사용 Hook**: useUser Hook 사용
- **UI**: shadcn/ui의 Card, Avatar 컴포넌트 사용

##### UserProfileEditForm
- **위치**: `src/domains/user-management/frontend/components/user-profile-edit-form.tsx`
- **역할**: 사용자 프로필 편집 폼 컴포넌트
- **기능**: 
  - 이름 수정 입력 필드
  - 프로필 이미지 업로드
  - 폼 검증 (Zod 스키마 사용)
  - 제출 시 updateUserProfile Hook 호출
  - 성공 시 프로필 갱신
  - 에러 상태 표시
- **사용 Hook**: useUser Hook 사용
- **UI**: shadcn/ui의 Form, Input, Button 컴포넌트 사용

##### OAuthButtons
- **위치**: `src/domains/user-management/frontend/components/oauth-buttons.tsx`
- **역할**: OAuth 로그인 버튼 컴포넌트
- **기능**: 
  - 구글 로그인 버튼
  - OAuth 연동 처리
  - 로딩 상태 표시
- **UI**: shadcn/ui의 Button 컴포넌트 사용

#### 미구현 컴포넌트들 (Scenario 8)
- **AccountDeletionDialog**: 계정 삭제 확인 다이얼로그
- **AccountSettings**: 계정 설정 폼

### 5.2 Hook 사용 패턴

#### Hook 사용 원칙 (08-code-conventions.md)
- **컴포넌트에서 직접 Context 접근 금지**: 반드시 Custom Hook을 통해 접근
- **DTO 데이터 기반 UI 렌더링**: 직렬화된 데이터를 기반으로 UI 구성
- **에러 상태 활용**: Hook에서 제공하는 에러 상태를 사용자 친화적으로 표시
- **로딩 상태 처리**: Hook에서 제공하는 로딩 상태를 적절히 처리

#### 실제 구현 예시
```typescript
// UserProfileCard에서 useUser Hook 사용
export function UserProfileCard() {
  const { user, isLoading, error } = useUser();
  
  // Hook에서 제공하는 상태를 직접 사용
  // Context에 직접 접근하지 않음
}

// UserProfileEditForm에서 useUser Hook 사용
export function UserProfileEditForm() {
  const { user, updateUserProfile, isLoading, error } = useUser();
  
  const handleSubmit = async (data: UpdateUserProfileRequest) => {
    await updateUserProfile(data);
  };
  
  // Hook에서 제공하는 액션과 상태를 직접 사용
}
```

### 5.3 폼 검증 및 에러 처리

#### UserProfileEditForm 폼 검증
- **Zod 스키마**: 이름 필수 입력, 이미지 URL 형식 검증
- **실시간 검증**: 입력 중 즉시 피드백 제공
- **에러 메시지**: 사용자 친화적인 한국어 에러 메시지
- **로딩 상태**: 제출 중 버튼 비활성화 및 스피너 표시

#### 에러 처리 패턴
- **서버 에러**: 프로필 수정 실패, 권한 부족 등
- **네트워크 에러**: 연결 실패, 타임아웃 등
- **검증 에러**: 입력 형식 오류, 필수 필드 누락 등
- **사용자 피드백**: Toast 알림 또는 인라인 에러 메시지

### 5.4 미구현 컴포넌트들 (Scenario 8)

#### AccountDeletionDialog
- **역할**: 계정 삭제 확인 다이얼로그
- **유효성 검사**: "DELETE" 문자열 입력 확인
- **제출 처리**: Server Action 호출 및 성공/실패 처리
- **로딩 상태**: 제출 중 로딩 상태 표시

#### AccountSettings
- **역할**: 계정 설정 폼 컴포넌트
- **기능**: 계정 정보 표시, 계정 삭제 버튼
- **상태 관리**: useUser Hook 활용

## 🔗 6. 앱 레벨 통합 (08-code-conventions.md 준수)

### 6.1 Provider 통합 설계

**파일 위치**: `src/app/layout.tsx`

#### Provider 중첩 순서 (08-code-conventions.md)
- **의존성이 적은 도메인부터 상위에 배치**
- **인증 관련 Provider는 가장 상위에 배치**
- **각 도메인 Provider는 독립적으로 동작**

#### 실제 구현된 Provider 구조
- **UserProvider**: 사용자 프로필 및 인증 상태 관리를 위한 Provider
- **Supabase Auth**: Supabase Auth를 통한 사용자 인증

#### 초기 데이터 전달 (08-code-conventions.md)
- **Server Components에서 Server Actions 호출**
- **초기 데이터를 Provider에 props로 전달**
- **클라이언트에서 추가 로딩 최소화**

### 6.2 미구현 항목 (Scenario 8)

#### 계정 삭제 UI
- **상태**: 계정 설정 페이지 미구현
- **기능**: 계정 삭제 버튼, 확인 다이얼로그

#### 온보딩 UI
- **상태**: 온보딩 페이지 미구현
- **기능**: 사용자 온보딩 프로세스 안내

## 📊 7. 구현 완료 체크리스트 (08-code-conventions.md 기준)

### 7.1 DTO 타입 정의 완료 확인
- [x] **DTO 인터페이스**: Plain Object로 정의 완료
- [x] **Date 직렬화**: ISO 문자열로 변환 완료
- [x] **Value Object 직렬화**: string으로 변환 완료
- [x] **Next.js Server Actions 직렬화 제약 준수**: 완료
- [x] **UserProfileView**: 사용자 프로필용 DTO 추가 완료
- [x] **UserRegistrationResult**: 사용자 등록용 DTO 추가 완료
- [ ] **계정 삭제 관련 DTO**: Scenario 8 구현 시 추가 예정

### 7.2 Context 구현 완료 확인
- [x] **도메인별 독립적인 Context**: UserContext 구현 완료
- [x] **사용자 프로필 상태 관리**: 완료
- [x] **초기 데이터 로드 로직**: Provider 마운트 시 자동 조회 구현 완료
- [ ] **계정 삭제 액션**: deleteUserAccount 메서드 추가 예정

### 7.3 Server Actions 구현 완료 확인
- [x] **Supabase Auth 인증 확인**: 모든 액션에서 구현 완료
- [x] **의존성 주입 패턴**: Service Layer 사용 완료
- [x] **Command 객체 활용**: 입력 구조화 완료
- [x] **DTO 직렬화**: Service Layer에서 DTO 반환 완료
- [x] **revalidatePath**: 관련 페이지 재검증 완료
- [x] **프로필 생성**: createUserProfileAction 구현 완료
- [x] **프로필 조회**: getUserProfileAction 구현 완료
- [x] **프로필 수정**: updateUserProfileAction 구현 완료
- [x] **사용자 등록**: processUserRegistrationAction 구현 완료
- [ ] **계정 삭제**: deleteUserAccountAction 미구현 (Scenario 8)

### 7.4 Hook 구현 완료 확인
- [x] **Context 추상화**: useUser Hook 구현 완료
- [x] **비즈니스 로직 메서드**: 사용자 관련 편의 함수들 구현 완료
- [x] **유틸리티 함수**: 온보딩 확인, 인증 여부 등 구현 완료
- [x] **에러 상태 처리**: 적절히 처리 완료
- [ ] **계정 삭제 메서드**: deleteUserAccount 미구현

### 7.5 컴포넌트 연동 완료 확인
- [x] **Hook 사용**: 컴포넌트에서 useUser Hook 사용
- [x] **프로필 카드**: UserProfileCard 구현 완료
- [x] **프로필 수정 폼**: UserProfileEditForm 구현 완료
- [x] **로딩 상태와 에러 상태 처리**: 적절히 처리 완료
- [x] **OAuth 버튼**: OAuthButtons 구현 완료
- [x] **폼 검증**: Zod 스키마 기반 검증 구현 완료
- [ ] **계정 삭제 Dialog**: AccountDeletionDialog 미구현
- [ ] **계정 설정**: AccountSettings 미구현

### 7.6 앱 통합 완료 확인
- [x] **Provider 중첩 순서**: 적절한 순서로 배치 완료
- [x] **초기 데이터**: Server Components에서 전달 완료
- [x] **페이지별 Hook 사용**: 필요한 Hook만 선택적으로 사용 완료
- [x] **UserProvider**: 사용자 상태 Provider 통합 완료
- [x] **구글 OAuth**: Supabase Auth 구글 OAuth 연동 완료
- [x] **로그인 UI**: 프론트엔드 로그인 페이지 구현 완료
- [ ] **계정 삭제 UI**: 계정 설정 페이지 미구현

## 📚 8. 관련 문서 및 참조

### 8.1 필수 선행 문서
- **08-code-conventions.md**: 코드 컨벤션 및 DTO 직렬화 가이드 ✅
  - DTO 직렬화 컨벤션 준수
  - React Context 작성법 적용
  - Server Actions 작성법 적용
  - Custom Hook 작성법 적용

- **06-frontend-specification-guide.md**: 프론트엔드 명세서 가이드 ✅
  - 도메인 타입 연동 설계
  - React Context 설계
  - Server Actions 연동 설계
  - Custom Hook 설계

- **Software Design 문서**: `../domains/user-management-domain/software-design.md` ✅
  - Aggregate, Command, Event 정의 확인 완료
  - 비즈니스 규칙 및 정책 참조 완료
  - Read Models 및 Context Map 확인 완료

- **Technical Specification 문서**: `../domains/user-management-domain/technical-specification.md` ✅
  - Drizzle ORM + Supabase Auth 구현 방법
  - Service Layer 패턴 참조 완료
  - 에러 처리 및 의존성 주입 패턴 완료

### 8.2 기술 스택 참조 (실제 구현)
- **Next.js 14**: App Router, Server Actions ✅
- **React 18**: Context API, useState, useEffect ✅
- **TypeScript**: DTO 인터페이스, Value Objects, Entity 클래스 ✅
- **UI 라이브러리**: shadcn/ui 컴포넌트 (Card, Form, Button 등) ✅
- **상태 관리**: React Context + Custom Hooks 패턴 ✅
- **인증**: Supabase Auth ✅
- **ORM**: Drizzle ORM + Supabase ✅

### 8.3 실제 폴더 구조 (08-code-conventions.md 준수)
```
src/
├── domains/user-management/
│   ├── shared/                     # 공유 도메인 객체들
│   │   ├── entities/               # Entity 클래스들
│   │   │   ├── user.entity.ts
│   │   │   └── __tests__/
│   │   │       └── user.test.ts
│   │   ├── value-objects/          # Value Objects
│   │   │   ├── ids.vo.ts           (UserId만)
│   │   │   ├── user-email.vo.ts
│   │   │   └── __tests__/
│   │   │       ├── ids.test.ts
│   │   │       └── user-email.test.ts
│   │   ├── aggregates/             # Aggregate 클래스들
│   │   │   ├── user.aggregate.ts
│   │   │   └── __tests__/
│   │   │       └── user.aggregate.test.ts
│   │   ├── dtos/                   # DTO 타입들 (직렬화 가능)
│   │   │   └── index.ts            (UserProfileView만)
│   │   ├── commands/               # Command 인터페이스들
│   │   │   └── index.ts            (CreateUserProfileCommand만)
│   │   ├── events/                 # Event 클래스들
│   │   │   └── index.ts            (UserProfileCreated, UserUpdated만)
│   │   ├── errors/                 # 에러 타입
│   │   │   └── user-management.error.ts
│   │   └── types/                  # 공통 타입들
│   │       └── index.ts            (현재 비어있음)
│   ├── backend/                    # 백엔드 레이어
│   │   ├── services/               # 서비스 클래스들
│   │   │   └── user-management.service.ts
│   │   ├── repositories/           # 리포지토리 구현체들
│   │   │   ├── interfaces/
│   │   │   │   └── user.repository.interface.ts
│   │   │   └── implementations/
│   │   │       ├── drizzle-user.repository.ts
│   │   │       └── __tests__/
│   │   │           └── drizzle-user.repository.test.ts
│   │   ├── anti-corruption-layers/ # ACL 클래스들
│   │   │   ├── supabase-auth-acl.ts
│   │   │   └── __tests__/
│   │   │       └── supabase-auth-acl.test.ts
│   │   └── read-models/            # Read Model 클래스들
│   │       └── user-profile.view.ts
│   └── actions/                    # Server Actions
│       └── user-management.actions.ts
│
│   # 주요 변경사항: frontend 폴더가 organization-management로 이동됨
│   # Organization 관련 UI는 organization-management domain에서 관리
```

### 8.4 현재 구현 상태 (08-code-conventions.md 기준)

#### 도메인 분리 현황
- ✅ **Organization 관련 기능 분리**: Organization Management Domain으로 완전히 이동
  - Frontend 레이어 (contexts, hooks, components, utils) → organization-management
  - Organization Entity, Aggregate, Repository → organization-management
  - Organization-related DTOs, Commands, Events → organization-management
  
#### User Management Domain 현재 상태
1. ✅ **DTO 직렬화**: Plain Object, ISO 문자열, Value Object 직렬화 완료 (UserProfileView만)
2. ✅ **Server Actions**: 표준 패턴 준수, DTO 반환 완료 (User 관련만)
3. ✅ **구글 OAuth**: Supabase Auth 구글 OAuth 연동 완료
4. ✅ **로그인 UI**: 프론트엔드 로그인 페이지 구현 완료 (Organization Management에서 제공)
5. 📋 **Scenario 0**: 사용자 등록 및 온보딩 완료
6. 📋 **Scenario 8**: 사용자 계정 삭제 구현 예정

#### Frontend 레이어 참고사항
- **조직 관련 UI**: Organization Management Domain의 frontend 레이어 참조
  - `@/domains/organization-management/frontend/components/*`
  - `@/domains/organization-management/frontend/contexts/*`
  - `@/domains/organization-management/frontend/hooks/*`
- **User 관련 UI**: 향후 구현 시 user-management domain에 frontend 폴더 추가 예정

### 8.5 다음 단계 우선순위
1. **완료**: Scenario 0 (사용자 등록 및 온보딩) 구현 완료
2. **완료**: 구글 OAuth 연동 및 로그인 UI 구현 완료
3. **다음 스프린트**: Scenario 8 (사용자 계정 삭제) 구현
4. **다음 스프린트**: 온보딩 UI 개선

---

이 Frontend Specification은 **User Management Domain**의 현재 구현 상태를 **08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션에 맞춰 정확히 반영한 문서입니다.
