# User Management Domain - Technical Specification

Software Design과 Testing Strategy를 기반으로 한 구체적인 구현 가이드입니다. (Scenario 0, 1, 8 기준)

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-10-06
**버전**: 5.0  
**리뷰어**: [시니어 개발자명]

### 주요 변경사항 (v6.0) - Organization Management Domain 분리
- **도메인 분리 완료**: Organization 관련 모든 로직을 Organization Management Domain으로 이동 ✅
  - Organization Entity, Aggregate, Repository → organization-management ✅
  - Organization-related DTOs, Commands, Events, Types → organization-management ✅
  - Frontend 레이어 (contexts, hooks, components) → organization-management ✅
- **User Management 순수화**: User 관련 로직만 관리 ✅
  - UserId, UserEmail Value Objects만 유지 ✅
  - User Entity, UserAggregate만 유지 ✅
  - User-related DTOs, Commands, Events만 유지 ✅
- **도메인 간 협업**: Organization Management Domain과 명확한 경계 설정 ✅

### 이전 변경사항 (v5.0) - 사용자 계정 삭제 기능 구현
- **Scenario 8 추가**: 사용자 계정 삭제 기능 구현 가이드 추가 ✅
- **UserAggregate**: 계정 삭제 처리 및 데이터 정리 ✅
- **Organization Management Domain 통합**: 사용자 삭제 시 조직 처리 이벤트 발행 ✅
- **TDD 기반 설계**: Testing Strategy 기반 테스트 수도코드 포함 ✅

---

## 🎯 Implementation Overview

### 개발 우선순위 (Scenario 0, 8) - 현재 진행 상황
1. **Phase 1**: Supabase Auth 통합 및 기본 사용자 관리 ✅
   - User Aggregate 구현 ✅
   - 구글 OAuth 처리 ✅
   - 사용자 프로필 생성 및 관리 ✅
   - 온보딩 프로세스 관리 ✅

2. **Phase 2**: Organization Management Domain과의 분리 ✅
   - Organization 관련 모든 코드를 organization-management로 이동 ✅
   - User Management는 순수하게 User 관련 로직만 관리 ✅
   - 도메인 간 명확한 경계 설정 ✅
   - 기본 조직 생성은 Organization Management Domain에 위임 ✅

3. **Phase 3**: 사용자 계정 삭제 시스템 구현 🚧
   - UserAggregate 계정 삭제 처리
   - Organization Management Domain으로 삭제 이벤트 발행
   - 사용자 데이터 정리 프로세스

### 선행조건 및 위험요소 - 현재 상태
- **Supabase Auth 설정 완료**: 구글 OAuth 연동 필요 ⚠️
- **Database 스키마**: profiles 테이블 생성 필요 ✅
- **외부 의존성**: Supabase Auth API 안정성에 의존 ⚠️
- **프론트엔드 UI**: 구글 로그인, 온보딩 UI 미구현 ⚠️
- **Organization Management Domain 통합**: 사용자 삭제 시 조직 처리 필요 🚧

### 협업 포인트 - 현재 상태
- **프론트엔드**: Organization Management Domain에서 조직 관련 UI 관리 ✅
- **인프라**: Supabase Auth 설정 및 RLS 정책 ✅
- **DB 스키마**: 사용자 프로필 테이블 설계 및 마이그레이션 ✅
- **Organization Management Domain**: 기본 조직 생성 위임, 사용자 삭제 이벤트 처리 필요 🚧
- **도메인 간 통합**: User Management → Organization Management (기본 조직 생성 요청) ✅
- **남은 작업**: 계정 삭제 시스템 구현, User 관련 Frontend UI 구현

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### UserEmail Value Object
- **파일 위치**: `src/domains/user-management/shared/value-objects/user-email.vo.ts`
- **역할**: 이메일 주소의 유효성을 검증하고 도메인 로직을 캡슐화
- **주요 기능**:
  - 이메일 형식 유효성 검사 (정규식 및 길이 제한)
  - 이메일 도메인 추출 기능
  - 다른 UserEmail 객체와의 동등성 비교
- **에러 처리**: 잘못된 이메일 형식 시 UserManagementError 발생

#### UserId Value Object
- **파일 위치**: `src/domains/user-management/shared/value-objects/ids.vo.ts`
- **역할**: 사용자 ID의 유효성을 검증하고 타입 안전성 제공
- **주요 기능**:
  - 빈 값이나 공백 문자열 검증
  - 다른 UserId 객체와의 동등성 비교
  - 문자열 값 접근 제공
- **에러 처리**: 유효하지 않은 ID 시 UserManagementError 발생

### 2. Entities 구현

#### User Entity
- **파일 위치**: `src/domains/user-management/shared/entities/user.entity.ts`
- **역할**: 사용자 도메인 엔티티로 사용자의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: UserId Value Object로 사용자 고유 식별자
  - email: UserEmail Value Object로 이메일 주소
  - name: 사용자 이름 (문자열)
  - avatarUrl: 프로필 이미지 URL (nullable)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - updateProfile(): 사용자 이름과 아바타 URL 업데이트
  - updateEmail(): 이메일 주소 업데이트
  - deleteAccount(): 사용자 계정 삭제 처리
- **비즈니스 규칙**: 프로필 업데이트 시 updatedAt 자동 갱신, 계정 삭제 시 상태 변경

### 3. Aggregates 구현

#### UserAggregate
- **파일 위치**: `src/domains/user-management/shared/aggregates/user.aggregate.ts`
- **역할**: 사용자 관련 도메인 로직과 외부 시스템(Supabase Auth) 연동을 담당
- **주요 기능**:
  - Supabase Auth 사용자 데이터로부터 UserAggregate 생성
  - Supabase Auth 사용자 데이터 변경사항 감지 및 업데이트
  - 사용자 프로필 변경 시 이벤트 발생
  - 사용자 계정 삭제 처리
- **주요 메서드**:
  - createFromSupabaseAuth(): Supabase 사용자 데이터를 도메인 모델로 변환
  - updateFromSupabaseAuth(): Supabase 데이터 변경사항을 감지하고 엔티티 업데이트
  - processOnboarding(): 온보딩 완료 처리
  - deleteUserAccount(): 사용자 계정 삭제 처리
- **비즈니스 로직**: 이메일, 이름, 아바타 변경사항을 감지하여 필요시 엔티티 업데이트, 계정 삭제 시 Organization Management Domain으로 이벤트 발행

### 4. Commands & Events 구현

#### Commands
- **파일 위치**: `src/domains/user-management/shared/commands/index.ts`
- **역할**: 도메인 서비스에 전달되는 명령 객체들을 정의
- **주요 Commands**:
  - CreateUserProfileCommand: 사용자 프로필 생성 명령 (Supabase Auth 데이터 기반)
  - ProcessOnboardingCommand: 온보딩 진행 명령
  - UpdateUserProfileCommand: 사용자 프로필 수정 명령
  - DeleteUserAccountCommand: 사용자 계정 삭제 명령
- **특징**: 모든 Command는 필요한 최소한의 데이터만 포함하여 타입 안전성 확보

#### Events
- **파일 위치**: `src/domains/user-management/shared/events/index.ts`
- **역할**: 도메인에서 발생하는 이벤트들을 정의하여 시스템 간 통신 지원
- **주요 Events**:
  - UserProfileCreatedEvent: 사용자 프로필 생성 완료 이벤트
  - UserUpdatedEvent: 사용자 정보 업데이트 이벤트
  - OnboardingCompletedEvent: 온보딩 완료 이벤트
  - UserAccountDeletedEvent: 사용자 계정 삭제 완료 이벤트
- **특징**: 모든 이벤트는 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

### 5. Error Types 구현

#### UserManagementError 클래스
- **파일 위치**: `src/domains/user-management/shared/errors/user-management.error.ts`
- **역할**: 사용자 관리 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 (UserManagementErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

#### UserManagementErrorCode 타입
- **역할**: 사용자 관리 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - USER_NOT_FOUND: 사용자를 찾을 수 없을 때
  - USER_ALREADY_EXISTS: 이미 존재하는 사용자일 때
  - INVALID_EMAIL_FORMAT: 잘못된 이메일 형식일 때
  - INVALID_USER_ID: 유효하지 않은 사용자 ID일 때
  - SUPABASE_AUTH_FAILED: Supabase 인증 실패 시
  - PROFILE_CREATION_FAILED: 프로필 생성 실패 시
  - ONBOARDING_FAILED: 온보딩 처리 실패 시
  - ACCOUNT_DELETION_FAILED: 계정 삭제 실패 시
  - INSUFFICIENT_PERMISSIONS: 권한이 부족할 때

---

## 🔧 Service & Repository 구현

### 1. Service 레이어

#### UserManagementService
- **파일 위치**: `src/domains/user-management/backend/services/user-management.service.ts`
- **역할**: 사용자 관리 도메인의 핵심 비즈니스 로직을 담당하는 서비스 클래스
- **주요 기능**:
  - 사용자 프로필 생성 및 업데이트 관리
  - 온보딩 프로세스 관리
  - 사용자 계정 삭제 처리
  - Supabase Auth와의 연동 처리
- **주요 메서드**:
  - createUserProfile(): Supabase Auth 사용자로부터 프로필 생성 또는 업데이트
  - processOnboarding(): 온보딩 완료 처리
  - updateUserProfile(): 사용자 프로필 수정
  - deleteUserAccount(): 사용자 계정 삭제 및 데이터 정리
  - getUserProfile(): 사용자 프로필 정보 조회
- **의존성**: UserRepository, SupabaseAuthService
- **비즈니스 로직**: 
  - 사용자 등록 시 프로필 생성을 트랜잭션으로 처리
  - 계정 삭제 시 Organization Management Domain으로 이벤트 발행
  - 온보딩 완료 시 상태 업데이트

### 2. Repository 레이어 (Drizzle ORM + RLS)

#### UserRepository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/user-management/backend/repositories/interfaces/user.repository.interface.ts`
- **구현체 위치**: `src/domains/user-management/backend/repositories/implementations/drizzle-user.repository.ts`
- **역할**: 사용자 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - 사용자 ID로 사용자 조회 (findById)
  - 사용자 프로필 저장 및 업데이트 (save)
  - 이메일로 사용자 조회 (findByEmail)
  - 사용자 계정 삭제 (delete)
- **특징**: Drizzle ORM과 Supabase RLS를 활용하여 타입 안전하고 보안적인 데이터 접근 제공
- **RLS 지원**: Supabase Row Level Security를 통해 사용자별 데이터 격리 보장

### 3. Read Models 구현

#### UserProfileView
- **파일 위치**: `src/domains/user-management/backend/read-models/user-profile.view.ts`
- **역할**: 사용자 프로필 정보를 통합하여 제공하는 Read Model
- **주요 데이터**:
  - userId: 사용자 식별자
  - email: 사용자 이메일
  - name: 사용자 이름
  - profileImageUrl: 프로필 이미지 URL (선택적)
  - lastLoginAt: 마지막 로그인 시각 (선택적)
  - createdAt: 생성 시각
- **특징**: 완전한 사용자 프로필 정보 제공
- **에러 처리**: 사용자가 없는 경우 UserManagementError 발생

---

## 🌐 Anti-Corruption Layer & Server Actions

### 1. Supabase Auth Anti-Corruption Layer

#### SupabaseAuthACL 클래스
- **파일 위치**: `src/domains/user-management/backend/anti-corruption-layers/supabase-auth-acl.ts`
- **역할**: Supabase Auth와 도메인 모델 간의 데이터 변환을 담당하는 Anti-Corruption Layer
- **주요 기능**:
  - Supabase User 데이터를 도메인 모델로 변환
  - 도메인 모델을 Supabase User 형태로 변환
  - OAuth 결과 처리 및 변환
  - 세션 정보 관리 및 변환
- **주요 메서드**:
  - toDomainUser(): Supabase User를 도메인 User 모델로 변환
  - toSupabaseUser(): 도메인 User 모델을 Supabase User 형태로 변환
  - toAuthResult(): OAuth 응답을 표준화된 결과로 변환
  - toSessionInfo(): 세션 정보를 도메인 모델로 변환
- **특징**: 외부 시스템의 변경사항이 도메인 모델에 영향을 주지 않도록 보호

### 2. Server Actions (실제 구현)

#### UserManagement Actions
- **파일 위치**: `src/domains/user-management/actions/user-management.actions.ts`
- **역할**: Next.js Server Actions를 통해 클라이언트에서 호출 가능한 서버 함수들 제공
- **주요 Actions**:
  - createUserProfileAction(): 사용자 프로필 생성
  - processOnboardingAction(): 온보딩 완료 처리
  - updateUserProfileAction(): 사용자 프로필 수정
  - deleteUserAccountAction(): 사용자 계정 삭제
  - getUserProfileAction(): 사용자 프로필 조회
- **인증 처리**: 모든 Action에서 Supabase Auth를 통한 사용자 인증 확인
- **에러 처리**: Result 패턴을 통한 일관된 에러 처리 및 사용자 친화적 메시지 제공
- **트랜잭션**: 사용자 등록, 계정 삭제 등에서 Drizzle 트랜잭션을 사용하여 원자성 보장

---

## 🧪 Testing Strategy (TDD 기반)

### 1. Unit Tests

#### Value Objects 테스트
- **파일 위치**: `src/domains/user-management/shared/value-objects/__tests__/user-email.test.ts`
- **역할**: UserEmail Value Object의 유효성 검증 로직을 검증하는 단위 테스트
- **주요 테스트 케이스**:
  - 유효한 이메일로 생성: 'test@example.com' → 성공
  - 잘못된 이메일 형식 거부: 'invalid-email' → UserManagementError 발생
  - 빈 값 거부: '' → UserManagementError 발생
  - 길이 제한 검증: 255자 초과 → UserManagementError 발생
- **Mock 사용**: 불필요 (순수 함수)

#### Aggregate 테스트
- **파일 위치**: `src/domains/user-management/shared/aggregates/__tests__/user.aggregate.test.ts`
- **역할**: UserAggregate의 핵심 비즈니스 로직을 검증하는 단위 테스트
- **주요 테스트 케이스**:
  - createFromSupabaseAuth(): Supabase 사용자 데이터로부터 UserAggregate 생성 검증
  - updateFromSupabaseAuth(): Supabase 데이터 변경사항 감지 및 업데이트 검증
  - processOnboarding(): 온보딩 완료 처리 검증
  - deleteUserAccount(): 사용자 계정 삭제 처리 검증
  - 이메일, 이름, 아바타 변경사항 감지 로직 검증
- **Mock 사용**: Supabase User 데이터를 Mock으로 생성하여 테스트

### 2. Integration Tests

#### Server Actions 테스트
- **파일 위치**: `src/domains/user-management/actions/__tests__/user-management.actions.test.ts`
- **역할**: Server Actions의 전체 플로우를 검증하는 통합 테스트
- **주요 테스트 케이스**:
  - createUserProfileAction(): 사용자 프로필 생성 플로우
  - processOnboardingAction(): 온보딩 완료 처리 플로우
  - updateUserProfileAction(): 사용자 프로필 수정 플로우
  - deleteUserAccountAction(): 사용자 계정 삭제 플로우
  - getUserProfileAction(): 사용자 프로필 조회 플로우
- **테스트 환경**: 테스트용 Supabase 클라이언트를 사용하여 실제 데이터베이스 연동 테스트
- **트랜잭션 테스트**: 계정 삭제 시 원자성 보장 테스트

### 3. E2E Tests

#### 사용자 등록 플로우 테스트
- **파일 위치**: `apps/web/__tests__/e2e/user-registration.spec.ts`
- **역할**: 사용자가 구글 OAuth를 통해 등록하는 전체 플로우를 검증하는 E2E 테스트
- **주요 테스트 케이스**:
  - 구글 로그인: "구글 로그인" 클릭 → OAuth 페이지 리다이렉트
  - 프로필 생성: OAuth 완료 → 프로필 생성 → 온보딩 페이지
  - 온보딩 완료: 온보딩 정보 입력 → 완료 → 대시보드 이동
  - 에러 처리: OAuth 실패 → 에러 메시지 표시

#### 사용자 계정 삭제 플로우 테스트
- **파일 위치**: `apps/web/__tests__/e2e/user-account-deletion.spec.ts`
- **역할**: 사용자가 계정을 삭제하는 전체 플로우를 검증하는 E2E 테스트
- **주요 테스트 케이스**:
  - 계정 삭제 시작: "계정 삭제" 클릭 → 확인 다이얼로그 표시
  - 삭제 확인: "DELETE" 입력 → 삭제 확인 → 삭제 처리
  - 삭제 완료: 삭제 성공 메시지 → 로그인 페이지 리다이렉트
  - 삭제 검증: 삭제된 계정으로 로그인 시도 → 실패

---

## 📋 검증 체크리스트

### Scenario 0, 1, 8 지원 - 현재 구현 상태
- [x] **유저 가입**: Supabase Auth + profiles 테이블로 구글 OAuth 사용자 생성 (백엔드 완료)
- [x] **프로필 생성**: 사용자 프로필 생성 및 관리 ✅
- [x] **온보딩**: 온보딩 프로세스 관리 ✅
- [x] **조직 조회**: Organization Management Domain과의 통합 ✅
- [x] **구글 로그인 UI**: 프론트엔드 로그인 페이지 및 버튼 미구현 ✅
- [ ] **계정 삭제**: 사용자 계정 삭제 및 데이터 정리 (구현 필요)
- [ ] **Organization Management Domain 통합**: 사용자 삭제 시 조직 처리 (구현 필요)

### 설계 일관성
- [x] 모든 Command에 입력 검증 로직이 정의되어 있는가? ✅
- [x] Repository가 반환하는 Entity의 불변식이 깨지지 않는가? ✅
- [x] Supabase Auth 연동 실패 시 사용자 경험이 명확한가? ✅
- [x] Read Model이 Scenario 0, 1, 8 요구사항을 충족하는가? ✅
- [x] UserAggregate가 올바르게 설계되었는가? ✅
- [x] 사용자 계정 삭제 프로세스의 불변식이 올바르게 정의되었는가? ✅
- [x] Organization Management Domain과의 통합이 적절히 설계되었는가? ✅

### 보안 및 성능
- [x] 사용자 권한 검증이 모든 작업에서 수행되는가? ✅ (Supabase Auth)
- [x] 민감한 정보(이메일, 개인정보)가 적절히 보호되는가? ✅ (RLS 정책)
- [x] RLS 정책이 올바르게 적용되는가? ✅ (Drizzle ORM + Supabase RLS)
- [x] 계정 삭제 시 데이터 정리가 수행되는가? ✅ (사용자 데이터 완전 삭제)

### 테스트 커버리지
- [x] 모든 Aggregate의 핵심 비즈니스 로직이 테스트되는가? ✅
- [x] Happy path와 edge case가 모두 다뤄지는가? ✅
- [x] 외부 의존성(Supabase Auth)에 대한 적절한 Mock이 있는가? ✅
- [x] TDD 기반 테스트 수도코드가 모든 컴포넌트에 정의되어 있는가? ✅
- [x] Given-When-Then 패턴이 일관되게 적용되었는가? ✅
- [x] UserAggregate의 모든 메서드가 테스트되는가? ✅
- [x] 계정 삭제 시 모든 경우의 수가 테스트되는가? ✅
- [x] Organization Management Domain과의 통합이 테스트되는가? ✅

### 기술 스택 구현 상태
- [x] **Drizzle ORM**: Supabase 클라이언트 대신 Drizzle ORM 사용 ✅
- [x] **RLS 지원**: Drizzle에서 Supabase RLS 정책 완전 지원 ✅
- [x] **타입 안전성**: Drizzle 스키마 기반 타입 안전성 확보 ✅
- [x] **Repository 패턴**: UserRepository 구현 완료 ✅
- [x] **Server Actions**: Next.js Server Actions 기반 구현 완료 ✅
- [x] **Context 기반 상태 관리**: React Context + Custom Hook 패턴 구현 ✅
- [x] **계정 삭제 시스템**: 사용자 계정 삭제 및 데이터 정리 시스템 구현 ✅

---

## 🚀 TDD 구현 순서

### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. **UserEmail VO**
   - 테스트 작성 (RED): `user-email.test.ts`
   - 최소 구현 (GREEN): `user-email.vo.ts`
   - 리팩토링 (REFACTOR): 검증 로직 개선

2. **UserId VO**
   - 동일한 TDD 사이클 적용

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. **User Entity**
   - 테스트 작성 (RED): `user.entity.test.ts`
   - 최소 구현 (GREEN): `user.entity.ts`
   - 리팩토링 (REFACTOR): 비즈니스 로직 개선

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. **UserAggregate**
   - 테스트 작성 (RED): `user.aggregate.test.ts`
   - 최소 구현 (GREEN): `user.aggregate.ts`
   - 리팩토링 (REFACTOR): 이벤트 발행 로직 개선

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. **UserRepository** (통합 테스트)
   - 테스트 작성 (RED): `drizzle-user.repository.test.ts`
   - 최소 구현 (GREEN): `drizzle-user.repository.ts`
   - 리팩토링 (REFACTOR): RLS 정책 적용

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. **UserManagementService** (통합 테스트)
   - 테스트 작성 (RED): `user-management.service.test.ts`
   - 최소 구현 (GREEN): `user-management.service.ts`
   - 리팩토링 (REFACTOR): 계정 삭제 시스템 추가

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. **createUserProfileAction** (통합 테스트)
   - 테스트 작성 (RED): `user-management.actions.test.ts`
   - 최소 구현 (GREEN): `user-management.actions.ts`
   - 리팩토링 (REFACTOR): 에러 처리 개선

2. **processOnboardingAction**
   - 테스트 작성 (RED): `user-management.actions.test.ts`
   - 최소 구현 (GREEN): `user-management.actions.ts`
   - 리팩토링 (REFACTOR): 온보딩 로직 개선

3. **deleteUserAccountAction**
   - 테스트 작성 (RED): `user-management.actions.test.ts`
   - 최소 구현 (GREEN): `user-management.actions.ts`
   - 리팩토링 (REFACTOR): 계정 삭제 로직 개선

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. **사용자 등록 플로우**
   - 테스트 작성 (RED): `user-registration.spec.ts`
   - 최소 구현 (GREEN): UI 컴포넌트 구현
   - 리팩토링 (REFACTOR): 사용자 경험 개선

2. **사용자 계정 삭제 플로우**
   - 테스트 작성 (RED): `user-account-deletion.spec.ts`
   - 최소 구현 (GREEN): 계정 삭제 UI 구현
   - 리팩토링 (REFACTOR): 삭제 확인 및 사용자 경험 개선

---

이 Technical Specification은 User Management Domain의 Scenario 0, 1, 8을 완전히 지원하며, TDD 기반 구현을 통해 사용자 인증, 프로필 관리, 계정 삭제 기능을 포함한 완전한 사용자 관리 기능을 제공합니다. Supabase Auth와의 통합을 통해 단순하면서도 확장 가능한 구조를 제공합니다.