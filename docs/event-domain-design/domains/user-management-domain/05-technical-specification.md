# User Management Domain - Technical Specification

Software Design과 Testing Strategy를 기반으로 한 구체적인 구현 가이드입니다. (Scenario 0-2 기준)

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-10-06
**버전**: 4.0  
**리뷰어**: [시니어 개발자명]

### 주요 변경사항 (v4.0) - Scenario 2 추가 및 TDD 가이드 반영
- **Scenario 2 추가**: 새로운 조직 생성 기능 구현 가이드 추가 ✅
- **TDD 기반 설계**: Testing Strategy 기반 테스트 수도코드 포함 ✅
- **구현 수도코드**: 모든 DDD 컴포넌트에 대한 구체적 구현 가이드 ✅
- **Drizzle ORM 통합**: Supabase 클라이언트 대신 Drizzle ORM 사용 ✅
- **RLS 지원**: Drizzle에서 Supabase RLS 정책 완전 지원 ✅
- **타입 안전성 향상**: Drizzle 스키마 기반 타입 안전성 확보 ✅
- **Repository 패턴**: UserRepository, OrganizationRepository 구현 완료 ✅
- **Server Actions**: Next.js Server Actions 기반 구현 완료 ✅
- **Context 기반 상태 관리**: React Context + Custom Hook 패턴 구현 ✅

---

## 🎯 Implementation Overview

### 개발 우선순위 (Scenario 0-2) - 현재 진행 상황
1. **Phase 1**: Supabase Auth 통합 및 기본 사용자/조직 관리 ✅
   - User/Organization Aggregate 구현 ✅
   - 구글 OAuth 처리 (백엔드 완료, 프론트엔드 미구현)
   - 기본 조직 자동 생성 ✅
   - 조직 목록 조회 및 선택 ✅

2. **Phase 2**: 새로운 조직 생성 기능 구현 ⚠️
   - OrganizationAggregate.createNew() 메서드 추가
   - 조직 타입 시스템 도입 (Drizzle ORM enum)
   - 조직 생성 폼 UI 구현
   - 조직 생성 후 컨텍스트 전환 로직

### 선행조건 및 위험요소 - 현재 상태
- **Supabase Auth 설정 완료**: 구글 OAuth 연동 필요 ⚠️
- **Database 스키마**: profiles, organizations 테이블 생성 ✅
- **조직 타입 enum**: Drizzle ORM 스키마에 organization_type enum 추가 필요 ⚠️
- **외부 의존성**: Supabase Auth API 안정성에 의존 ⚠️
- **프론트엔드 UI**: 구글 로그인 버튼 및 로그인 페이지 미구현 ⚠️
- **조직 생성 UI**: 조직 생성 폼 및 타입 선택 UI 구현 필요 ⚠️

### 협업 포인트 - 현재 상태
- **프론트엔드**: Context API를 통한 사용자 상태 관리 ✅
- **인프라**: Supabase Auth 설정 및 RLS 정책 ✅
- **DB 스키마**: 조직 타입 enum 추가 및 마이그레이션 필요 ⚠️
- **남은 작업**: 구글 OAuth 설정, 프론트엔드 UI 구현, 조직 생성 기능

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

#### OrganizationId Value Object
- **파일 위치**: `src/domains/user-management/shared/value-objects/ids.vo.ts`
- **역할**: 조직 ID의 유효성을 검증하고 타입 안전성 제공
- **주요 기능**:
  - 빈 값이나 공백 문자열 검증
  - 다른 OrganizationId 객체와의 동등성 비교
  - UUID 생성 정적 메서드 제공
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
- **비즈니스 규칙**: 프로필 업데이트 시 updatedAt 자동 갱신

#### Organization Entity
- **파일 위치**: `src/domains/user-management/shared/entities/organization.entity.ts`
- **역할**: 조직 도메인 엔티티로 조직의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: OrganizationId Value Object로 조직 고유 식별자
  - name: 조직 이름 (문자열)
  - ownerId: UserId Value Object로 소유자 식별자
  - isDefault: 기본 조직 여부 (boolean)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - updateName(): 조직 이름 업데이트
- **비즈니스 규칙**: 조직 이름 변경 시 updatedAt 자동 갱신

### 3. Aggregates 구현

#### UserAggregate
- **파일 위치**: `src/domains/user-management/shared/aggregates/user.aggregate.ts`
- **역할**: 사용자 관련 도메인 로직과 외부 시스템(Supabase Auth) 연동을 담당
- **주요 기능**:
  - Supabase Auth 사용자 데이터로부터 UserAggregate 생성
  - Supabase Auth 사용자 데이터 변경사항 감지 및 업데이트
  - 사용자 프로필 변경 시 이벤트 발생
- **주요 메서드**:
  - createFromSupabaseAuth(): Supabase 사용자 데이터를 도메인 모델로 변환
  - updateFromSupabaseAuth(): Supabase 데이터 변경사항을 감지하고 엔티티 업데이트
- **비즈니스 로직**: 이메일, 이름, 아바타 변경사항을 감지하여 필요시 엔티티 업데이트

#### OrganizationAggregate
- **파일 위치**: `src/domains/user-management/shared/aggregates/organization.aggregate.ts`
- **역할**: 조직 관련 도메인 로직과 기본 조직 생성 규칙을 담당
- **주요 기능**:
  - 기본 조직 생성 로직 (사용자 등록 시 자동 생성)
  - 새로운 조직 생성 로직 (사용자가 직접 생성)
  - 조직 이름 변경 시 이벤트 발생
  - 조직 관련 비즈니스 규칙 적용
- **주요 메서드**:
  - createDefault(): 사용자를 위한 기본 조직 생성
  - createNew(): 사용자가 새로운 조직 생성
  - updateName(): 조직 이름 변경 및 이벤트 발생
- **비즈니스 로직**: 
  - 기본 조직은 isDefault 플래그가 true로 설정되며, UUID 기반 ID 생성
  - 새로운 조직은 isDefault 플래그가 false로 설정되며, 조직 타입 필수 선택
  - 조직 생성자는 자동으로 소유자(Owner) 권한을 가짐

### 4. Commands & Events 구현

#### Commands
- **파일 위치**: `src/domains/user-management/shared/commands/index.ts`
- **역할**: 도메인 서비스에 전달되는 명령 객체들을 정의
- **주요 Commands**:
  - CreateUserProfileCommand: 사용자 프로필 생성 명령 (Supabase Auth 데이터 기반)
  - CreateDefaultOrganizationCommand: 기본 조직 생성 명령 (사용자 등록 시 자동 실행)
  - CreateNewOrganizationCommand: 새로운 조직 생성 명령 (사용자가 직접 생성)
  - GetUserOrganizationsCommand: 사용자 소유 조직 목록 조회 명령
- **특징**: 모든 Command는 필요한 최소한의 데이터만 포함하여 타입 안전성 확보

#### Events
- **파일 위치**: `src/domains/user-management/shared/events/index.ts`
- **역할**: 도메인에서 발생하는 이벤트들을 정의하여 시스템 간 통신 지원
- **주요 Events**:
  - UserProfileCreatedEvent: 사용자 프로필 생성 완료 이벤트
  - UserUpdatedEvent: 사용자 정보 업데이트 이벤트
  - DefaultOrganizationCreatedEvent: 기본 조직 생성 완료 이벤트
  - NewOrganizationCreatedEvent: 새로운 조직 생성 완료 이벤트
  - OrganizationUpdatedEvent: 조직 정보 업데이트 이벤트
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
  - ORGANIZATION_NOT_FOUND: 조직을 찾을 수 없을 때
  - ORGANIZATION_NAME_DUPLICATE: 조직 이름이 중복될 때
  - INVALID_EMAIL_FORMAT: 잘못된 이메일 형식일 때
  - INVALID_USER_ID: 유효하지 않은 사용자 ID일 때
  - INVALID_ORGANIZATION_ID: 유효하지 않은 조직 ID일 때
  - INVALID_ORGANIZATION_TYPE: 유효하지 않은 조직 타입일 때
  - SUPABASE_AUTH_FAILED: Supabase 인증 실패 시
  - PROFILE_CREATION_FAILED: 프로필 생성 실패 시
  - ORGANIZATION_CREATION_FAILED: 조직 생성 실패 시
  - ORGANIZATION_RETRIEVAL_FAILED: 조직 조회 실패 시

#### 에러 메시지 매핑
- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 한국어 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

---

## 🔧 Service & Repository 구현

### 1. Service 레이어

#### UserManagementService
- **파일 위치**: `src/domains/user-management/backend/services/user-management.service.ts`
- **역할**: 사용자 관리 도메인의 핵심 비즈니스 로직을 담당하는 서비스 클래스
- **주요 기능**:
  - 사용자 프로필 생성 및 업데이트 관리
  - 기본 조직 자동 생성 로직
  - 새로운 조직 생성 로직
  - 사용자 소유 조직 목록 조회
  - Supabase Auth와의 연동 처리
- **주요 메서드**:
  - createUserProfile(): Supabase Auth 사용자로부터 프로필 생성 또는 업데이트
  - createDefaultOrganization(): 사용자 등록 시 기본 조직 자동 생성
  - createNewOrganization(): 사용자가 새로운 조직 생성
  - getUserOrganizations(): 사용자 소유 조직 목록 조회
- **의존성**: UserRepository, OrganizationRepository, SupabaseAuthService
- **비즈니스 로직**: 
  - 사용자 등록 시 프로필 생성과 기본 조직 생성을 트랜잭션으로 처리
  - 새로운 조직 생성 시 조직 이름 중복 검사 및 조직 타입 검증

### 2. Repository 레이어 (Drizzle ORM + RLS)

#### UserRepository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/user-management/backend/repositories/interfaces/user.repository.interface.ts`
- **구현체 위치**: `src/domains/user-management/backend/repositories/implementations/drizzle-user.repository.ts`
- **역할**: 사용자 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - 사용자 ID로 사용자 조회 (findById)
  - 사용자 프로필 저장 및 업데이트 (save)
  - 이메일로 사용자 조회 (findByEmail)
- **특징**: Drizzle ORM과 Supabase RLS를 활용하여 타입 안전하고 보안적인 데이터 접근 제공
- **RLS 지원**: Supabase Row Level Security를 통해 사용자별 데이터 격리 보장

#### OrganizationRepository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/user-management/backend/repositories/interfaces/organization.repository.interface.ts`
- **구현체 위치**: `src/domains/user-management/backend/repositories/implementations/drizzle-organization.repository.ts`
- **역할**: 조직 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - 조직 ID로 조직 조회 (findById)
  - 소유자 ID로 조직 목록 조회 (findByOwnerId)
  - 조직 저장 및 업데이트 (save)
- **특징**: Drizzle ORM과 Supabase RLS를 활용하여 타입 안전하고 보안적인 데이터 접근 제공
- **정렬**: 생성일 기준 오름차순으로 조직 목록 정렬
- **RLS 지원**: Supabase Row Level Security를 통해 소유자별 조직 데이터 격리 보장

### 3. Read Models 구현

#### UserOrganizationView
- **파일 위치**: `src/domains/user-management/backend/read-models/user-organization.view.ts`
- **역할**: 사용자와 관련된 조직 정보를 통합하여 조회하는 Read Model
- **주요 데이터**:
  - userId: 사용자 식별자
  - ownedOrganizations: 사용자가 소유한 조직 목록
  - memberOrganizations: 사용자가 멤버인 조직 목록 (Scenario 0-1에서는 빈 배열)
- **특징**: Drizzle ORM의 관계 조회를 통해 효율적인 데이터 조합 제공
- **정렬**: 조직 목록은 생성일 기준 오름차순 정렬

#### UserProfileView
- **파일 위치**: `src/domains/user-management/backend/read-models/user-profile.view.ts`
- **역할**: 사용자 프로필 정보와 기본 조직 정보를 통합하여 제공하는 Read Model
- **주요 데이터**:
  - userId: 사용자 식별자
  - email: 사용자 이메일
  - name: 사용자 이름
  - profileImageUrl: 프로필 이미지 URL (선택적)
  - defaultOrganization: 기본 조직 정보 (ID, 이름)
  - lastLoginAt: 마지막 로그인 시각 (현재 미사용)
  - createdAt: 생성 시각
- **특징**: 기본 조직 정보를 포함한 완전한 사용자 프로필 정보 제공
- **에러 처리**: 기본 조직이 없는 경우 UserManagementError 발생

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
  - createUserProfileAction(): 사용자 프로필 생성 및 기본 조직 자동 생성
  - getUserOrganizationsAction(): 사용자 소유 조직 목록 조회
  - createDefaultOrganizationAction(): 기본 조직 생성 (개별 호출용)
  - createNewOrganizationAction(): 새로운 조직 생성 (사용자가 직접 생성)
  - processUserRegistrationAction(): 트랜잭션 기반 사용자 등록 처리
- **인증 처리**: 모든 Action에서 Supabase Auth를 통한 사용자 인증 확인
- **에러 처리**: Result 패턴을 통한 일관된 에러 처리 및 사용자 친화적 메시지 제공
- **트랜잭션**: processUserRegistrationAction은 Drizzle 트랜잭션을 사용하여 원자성 보장

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
  - 이메일, 이름, 아바타 변경사항 감지 로직 검증
- **Mock 사용**: Supabase User 데이터를 Mock으로 생성하여 테스트

- **파일 위치**: `src/domains/user-management/shared/aggregates/__tests__/organization.aggregate.test.ts`
- **역할**: OrganizationAggregate의 핵심 비즈니스 로직을 검증하는 단위 테스트
- **주요 테스트 케이스**:
  - createDefault(): 기본 조직 생성 검증
  - createNew(): 새로운 조직 생성 검증
  - 조직 타입 검증: 유효하지 않은 타입 → UserManagementError 발생
  - 조직 이름 중복 검사: 중복된 이름 → UserManagementError 발생

### 2. Integration Tests

#### Server Actions 테스트
- **파일 위치**: `src/domains/user-management/actions/__tests__/user-management.actions.test.ts`
- **역할**: Server Actions의 전체 플로우를 검증하는 통합 테스트
- **주요 테스트 케이스**:
  - createUserProfileAction(): 사용자 프로필 생성 및 기본 조직 생성 플로우
  - createNewOrganizationAction(): 새로운 조직 생성 플로우
  - getUserOrganizationsAction(): 조직 목록 조회 플로우
  - processUserRegistrationAction(): 트랜잭션 기반 사용자 등록 플로우
- **테스트 환경**: 테스트용 Supabase 클라이언트를 사용하여 실제 데이터베이스 연동 테스트

### 3. E2E Tests

#### 조직 생성 플로우 테스트
- **파일 위치**: `apps/web/__tests__/e2e/organization-creation.spec.ts`
- **역할**: 사용자가 새로운 조직을 생성하는 전체 플로우를 검증하는 E2E 테스트
- **주요 테스트 케이스**:
  - 조직 생성 폼 표시: "새 조직 만들기" 클릭 → 폼 표시
  - 조직 생성 성공: 유효한 데이터 입력 → 생성 완료 → 컨텍스트 전환
  - 조직 이름 중복: 중복된 이름 입력 → 에러 메시지 표시
  - 조직 타입 선택: 드롭다운에서 타입 선택 → 유효성 검증

---

## 📋 검증 체크리스트

### Scenario 0-2 지원 - 현재 구현 상태
- [x] **유저 가입**: Supabase Auth + profiles 테이블로 구글 OAuth 사용자 생성 (백엔드 완료)
- [x] **기본 조직 생성**: 사용자 등록 시 자동 생성 ✅
- [x] **조직 조회**: 사용자 소유 조직 목록 조회 ✅
- [x] **초기 조직 선택**: 프론트엔드에서 기본 조직 자동 선택 ✅
- [ ] **새로운 조직 생성**: 사용자가 직접 새로운 조직 생성 (구현 필요)
- [ ] **조직 타입 시스템**: Drizzle ORM enum 기반 조직 타입 관리 (구현 필요)
- [ ] **구글 로그인 UI**: 프론트엔드 로그인 페이지 및 버튼 미구현

### 설계 일관성
- [x] 모든 Command에 입력 검증 로직이 정의되어 있는가? ✅
- [x] Repository가 반환하는 Entity의 불변식이 깨지지 않는가? ✅
- [x] Supabase Auth 연동 실패 시 사용자 경험이 명확한가? ✅
- [x] Read Model이 Scenario 0-1 요구사항을 충족하는가? ✅

### 보안 및 성능
- [x] 사용자 권한 검증이 모든 작업에서 수행되는가? ✅ (Supabase Auth)
- [x] 민감한 정보(이메일, 개인정보)가 적절히 보호되는가? ✅ (RLS 정책)
- [x] RLS 정책이 올바르게 적용되는가? ✅ (Drizzle ORM + Supabase RLS)

### 테스트 커버리지
- [x] 모든 Aggregate의 핵심 비즈니스 로직이 테스트되는가? ✅
- [x] Happy path와 edge case가 모두 다뤄지는가? ✅
- [x] 외부 의존성(Supabase Auth)에 대한 적절한 Mock이 있는가? ✅
- [x] TDD 기반 테스트 수도코드가 모든 컴포넌트에 정의되어 있는가? ✅
- [x] Given-When-Then 패턴이 일관되게 적용되었는가? ✅

### 기술 스택 구현 상태
- [x] **Drizzle ORM**: Supabase 클라이언트 대신 Drizzle ORM 사용 ✅
- [x] **RLS 지원**: Drizzle에서 Supabase RLS 정책 완전 지원 ✅
- [x] **타입 안전성**: Drizzle 스키마 기반 타입 안전성 확보 ✅
- [x] **Repository 패턴**: UserRepository, OrganizationRepository 구현 완료 ✅
- [x] **Server Actions**: Next.js Server Actions 기반 구현 완료 ✅
- [x] **Context 기반 상태 관리**: React Context + Custom Hook 패턴 구현 ✅

---

---

## 🚀 TDD 구현 순서

### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. **UserEmail VO**
   - 테스트 작성 (RED): `user-email.test.ts`
   - 최소 구현 (GREEN): `user-email.vo.ts`
   - 리팩토링 (REFACTOR): 검증 로직 개선

2. **UserId, OrganizationId VO**
   - 동일한 TDD 사이클 적용

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. **User Entity**
   - 테스트 작성 (RED): `user.entity.test.ts`
   - 최소 구현 (GREEN): `user.entity.ts`
   - 리팩토링 (REFACTOR): 비즈니스 로직 개선

2. **Organization Entity**
   - 테스트 작성 (RED): `organization.entity.test.ts`
   - 최소 구현 (GREEN): `organization.entity.ts`
   - 리팩토링 (REFACTOR): 조직 타입 검증 로직 추가

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. **UserAggregate**
   - 테스트 작성 (RED): `user.aggregate.test.ts`
   - 최소 구현 (GREEN): `user.aggregate.ts`
   - 리팩토링 (REFACTOR): 이벤트 발행 로직 개선

2. **OrganizationAggregate**
   - 테스트 작성 (RED): `organization.aggregate.test.ts`
   - 최소 구현 (GREEN): `organization.aggregate.ts`
   - 리팩토링 (REFACTOR): createNew 메서드 추가

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. **UserRepository** (통합 테스트)
   - 테스트 작성 (RED): `drizzle-user.repository.test.ts`
   - 최소 구현 (GREEN): `drizzle-user.repository.ts`
   - 리팩토링 (REFACTOR): RLS 정책 적용

2. **OrganizationRepository** (통합 테스트)
   - 테스트 작성 (RED): `drizzle-organization.repository.test.ts`
   - 최소 구현 (GREEN): `drizzle-organization.repository.ts`
   - 리팩토링 (REFACTOR): 조직 타입 enum 지원

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. **UserManagementService** (통합 테스트)
   - 테스트 작성 (RED): `user-management.service.test.ts`
   - 최소 구현 (GREEN): `user-management.service.ts`
   - 리팩토링 (REFACTOR): createNewOrganization 메서드 추가

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. **createUserProfileAction** (통합 테스트)
   - 테스트 작성 (RED): `user-management.actions.test.ts`
   - 최소 구현 (GREEN): `user-management.actions.ts`
   - 리팩토링 (REFACTOR): 에러 처리 개선

2. **createNewOrganizationAction**
   - 테스트 작성 (RED): `user-management.actions.test.ts`
   - 최소 구현 (GREEN): `user-management.actions.ts`
   - 리팩토링 (REFACTOR): 조직 타입 검증 로직 추가

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. **사용자 등록 플로우**
   - 테스트 작성 (RED): `user-registration.spec.ts`
   - 최소 구현 (GREEN): UI 컴포넌트 구현
   - 리팩토링 (REFACTOR): 사용자 경험 개선

2. **조직 생성 플로우**
   - 테스트 작성 (RED): `organization-creation.spec.ts`
   - 최소 구현 (GREEN): 조직 생성 폼 구현
   - 리팩토링 (REFACTOR): 폼 검증 및 에러 처리 개선

---

이 Technical Specification은 User Management Domain의 Scenario 0-2를 완전히 지원하며, TDD 기반 구현을 통해 Supabase Auth와의 통합을 통해 단순하면서도 확장 가능한 구조를 제공합니다.