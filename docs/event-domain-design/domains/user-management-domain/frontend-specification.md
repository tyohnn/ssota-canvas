# User Management Domain - Frontend Specification

Software Design을 기반으로 한 프론트엔드 구현 명세서입니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: User Management (사용자 인증 및 조직 관리)
- **주요 기능**: 사용자 동기화, 로그인/로그아웃, 조직 관리, 멤버십 관리
- **UI 컴포넌트**: 사용자 프로필, 조직 선택기, 멤버 관리, 초대 관리

### 개발 우선순위
1. **Phase 1**: 핵심 타입 및 Context 구현
2. **Phase 2**: Server Actions 및 Hook 구현  
3. **Phase 3**: 컴포넌트 구현 및 통합

---

## 📋 1. 도메인 타입 정의

### 1.1 기본 도메인 타입

**파일 위치**: `src/domains/user-management/shared/entities/` (실제 구현)

### 실제 구현된 Entity 클래스들

#### User Entity
- **위치**: `src/domains/user-management/shared/entities/user.entity.ts`
- **역할**: 사용자 도메인 엔티티 클래스, Value Object인 UserId와 UserEmail 사용
- **주요 속성**: id (UserId), email (UserEmail), name, avatarUrl, createdAt, updatedAt
- **주요 메서드**: updateProfile(), updateEmail()

#### Organization Entity  
- **위치**: `src/domains/user-management/shared/entities/organization.entity.ts`
- **역할**: 조직 도메인 엔티티 클래스, Value Object인 OrganizationId와 UserId 사용
- **주요 속성**: id (OrganizationId), name, ownerId (UserId), isDefault, createdAt, updatedAt
- **주요 메서드**: updateName()

#### Value Objects
- **위치**: `src/domains/user-management/shared/value-objects/`
- **UserId**: `src/domains/user-management/shared/value-objects/ids.vo.ts` - 사용자 ID를 래핑하는 Value Object
- **OrganizationId**: `src/domains/user-management/shared/value-objects/ids.vo.ts` - 조직 ID를 래핑하는 Value Object  
- **UserEmail**: `src/domains/user-management/shared/value-objects/user-email.vo.ts` - 이메일 유효성 검사를 포함하는 Value Object

#### DTO (Data Transfer Objects)
- **위치**: `src/domains/user-management/shared/dtos/index.ts`
- **UserProfileView**: 사용자 프로필 정보를 클라이언트에 전달하는 DTO
- **OrganizationSummary**: 조직 요약 정보를 전달하는 DTO
- **UserRegistrationResult**: 사용자 등록 결과를 전달하는 DTO

#### 미구현 항목
- **Membership**: Scenario 2 (멤버 초대) 이후 구현 예정
- **복잡한 Read Models**: 현재는 단순한 DTO만 구현, 향후 확장 예정

### 1.2 클라이언트 확장 타입

**파일 위치**: `src/domains/user-management/shared/dtos/index.ts` (실제 구현)

#### 실제 구현된 DTO 타입들

#### OrganizationSummary DTO
- **역할**: 조직 목록 표시를 위한 요약 정보
- **주요 속성**: id (string), name (string), isDefault (boolean), createdAt (string)
- **사용처**: 조직 목록 조회, 드롭다운 표시

#### UserProfileView DTO  
- **역할**: 사용자 프로필 정보를 클라이언트에 전달
- **주요 속성**: userId, email, name, profileImageUrl, defaultOrganization, lastLoginAt, createdAt
- **사용처**: 사용자 프로필 표시, 기본 조직 정보 제공

#### UserRegistrationResult DTO
- **역할**: 사용자 등록 프로세스 결과를 전달
- **주요 속성**: success (boolean), user (사용자 정보), defaultOrganization (기본 조직 정보)
- **사용처**: 등록 완료 후 결과 표시

#### 미구현 항목 (Scenario 2 이후)
- **MembershipSummary**: 멤버십 정보 표시용
- **OrganizationWithMembers**: 멤버 정보를 포함한 조직 정보
- **UserOrganizationView**: 복합 조회를 위한 뷰 모델
- **OrganizationMemberView**: 조직 멤버 관리용 뷰 모델
- **폼 입력 타입들**: OrganizationFormInput, InviteMemberFormInput

## 🎛️ 2. React Context 구현

### 2.1 Context 타입 정의

**파일 위치**: `src/domains/user-management/frontend/contexts/organization-context.tsx` (실제 구현)

#### 실제 구현된 OrganizationContext

#### Context 상태 타입
- **organizations**: OrganizationSummary[] - 사용자의 조직 목록
- **selectedId**: string | null - 현재 선택된 조직 ID
- **isLoading**: boolean - 데이터 로딩 상태
- **error**: string | null - 에러 메시지

#### Context 액션 타입  
- **fetchOrganizations**: () => Promise<void> - 조직 목록 조회
- **selectOrganization**: (id: string) => void - 조직 선택
- **setError**: (error: string | null) => void - 에러 상태 설정

#### Context Provider Props
- **initialOrganizations**: OrganizationSummary[] - 초기 조직 목록
- **initialSelectedId**: string | null - 초기 선택된 조직 ID

#### 미구현 항목 (향후 확장)
- **복잡한 상태 관리**: 현재는 조직 관련 상태만 관리
- **사용자 정보 관리**: 별도 Context 또는 통합 예정
- **멤버십 관리**: Scenario 2 이후 구현 예정

### 2.2 Provider 구현

**파일 위치**: `src/domains/user-management/frontend/contexts/organization-context.tsx` (실제 구현)

#### 실제 구현된 OrganizationProvider

#### 주요 기능
- **상태 관리**: useState를 사용한 organizations, selectedId, isLoading, error 상태 관리
- **쿠키 연동**: 선택된 조직 ID를 쿠키에 저장하고 복원
- **초기 데이터 로드**: Provider 마운트 시 조직 목록 자동 조회
- **에러 처리**: API 호출 실패 시 에러 상태 설정

#### 핵심 로직
- **fetchOrganizations**: Server Action을 호출하여 조직 목록 조회 및 상태 업데이트
- **selectOrganization**: 조직 선택 시 상태 업데이트 및 쿠키 저장
- **초기 선택 로직**: 쿠키에서 이전 선택 조직 확인, 없으면 기본 조직 자동 선택

#### 쿠키 관리
- **getCookieValue**: 쿠키에서 조직 ID 읽기
- **setCookieValue**: 선택된 조직 ID를 쿠키에 저장
- **removeCookieValue**: 쿠키에서 조직 ID 제거

#### 미구현 항목
- **복잡한 액션들**: 조직 생성, 수정, 삭제 등은 아직 미구현
- **멤버 관리**: Scenario 2 이후 구현 예정
- **사용자 정보 관리**: 별도 Context에서 관리 예정

## ⚡ 3. Server Actions 구현

### 3.1 Server Actions 정의

**파일 위치**: `src/domains/user-management/actions/user-management.actions.ts` (실제 구현)

#### 실제 구현된 Server Actions

#### getUserOrganizationsAction
- **역할**: 사용자의 조직 목록을 조회하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: UserManagementService를 통해 사용자 조직 목록 조회
- **반환**: OrganizationSummary[] 배열

#### createUserProfileAction  
- **역할**: 사용자 프로필을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: Supabase 사용자 정보를 기반으로 프로필 생성 및 기본 조직 자동 생성
- **반환**: UserProfileView DTO

#### createDefaultOrganizationAction
- **역할**: 사용자를 위한 기본 조직을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 사용자 이름 기반으로 기본 조직 생성
- **반환**: OrganizationSummary DTO

#### processUserRegistrationAction
- **역할**: 사용자 등록 프로세스를 처리하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 프로필 생성과 기본 조직 생성을 트랜잭션으로 처리
- **반환**: UserRegistrationResult DTO

#### 미구현 항목
- **조직 생성/수정/삭제**: Story 006에서 구현 예정
- **멤버 초대/관리**: Story 007에서 구현 예정

### 3.2 에러 타입 정의

**파일 위치**: `src/domains/user-management/errors/user-management.error.ts` (실제 구현)

#### 실제 구현된 에러 클래스

#### UserManagementError
- **역할**: 사용자 관리 도메인의 기본 에러 클래스
- **속성**: code (UserManagementErrorCode), message, details
- **사용처**: 모든 사용자 관리 관련 에러의 베이스 클래스

#### UserManagementErrorCode
- **USER_NOT_FOUND**: 사용자를 찾을 수 없음
- **USER_ALREADY_EXISTS**: 이미 존재하는 사용자
- **ORGANIZATION_NOT_FOUND**: 조직을 찾을 수 없음
- **INVALID_EMAIL_FORMAT**: 잘못된 이메일 형식
- **INVALID_USER_ID**: 잘못된 사용자 ID
- **INVALID_ORGANIZATION_ID**: 잘못된 조직 ID
- **SUPABASE_AUTH_FAILED**: Supabase 인증 실패
- **PROFILE_CREATION_FAILED**: 프로필 생성 실패
- **ORGANIZATION_CREATION_FAILED**: 조직 생성 실패
- **ORGANIZATION_RETRIEVAL_FAILED**: 조직 조회 실패

#### 에러 메시지 매핑
- **USER_MANAGEMENT_ERROR_MESSAGES**: 각 에러 코드에 대한 사용자 친화적 메시지 매핑
- **다국어 지원**: 한국어 에러 메시지 제공

#### 미구현 항목
- **복잡한 에러 분류**: 현재는 기본적인 에러만 정의
- **에러 복구 로직**: 재시도 및 복구 메커니즘 미구현

## 🎣 4. Custom Hook 구현

### 4.1 메인 Hook 정의

**파일 위치**: `src/domains/user-management/frontend/hooks/use-organization.ts` (실제 구현)

#### 실제 구현된 useOrganization Hook

#### 주요 기능
- **Context 연동**: OrganizationContext를 사용하여 조직 관련 상태와 액션에 접근
- **상태 제공**: organizations, selectedOrganization, isLoading, error 상태 제공
- **액션 제공**: fetchOrganizations, selectOrganization 액션 제공
- **유틸리티 함수**: 조직 관련 편의 함수들 제공

#### 제공하는 상태
- **organizations**: OrganizationSummary[] - 조직 목록
- **selectedOrganization**: OrganizationSummary | null - 선택된 조직
- **defaultOrganization**: OrganizationSummary | null - 기본 조직
- **isLoading**: boolean - 로딩 상태
- **error**: string | null - 에러 상태

#### 제공하는 액션
- **fetchOrganizations**: 조직 목록 조회
- **selectOrganization**: 조직 선택

#### 유틸리티 함수
- **canSelectOrganization**: 조직 선택 가능 여부 확인
- **isDefaultOrganization**: 기본 조직 여부 확인
- **findOrganizationByName**: 이름으로 조직 찾기
- **ownedOrganizations**: 소유한 조직 목록

#### 미구현 항목
- **낙관적 업데이트**: useOptimistic 미사용, 직접 상태 관리
- **복잡한 액션들**: 조직 생성, 수정, 삭제 등 미구현
- **멤버 관리**: Scenario 2 이후 구현 예정

## 🧩 5. 컴포넌트 구현

### 5.1 주요 컴포넌트 구조

**파일 위치**: `src/domains/user-management/frontend/components/` (실제 구현)

#### 실제 구현된 컴포넌트들

#### OrganizationSwitcher
- **위치**: `src/domains/user-management/frontend/components/organization-switcher.tsx`
- **역할**: 조직 선택을 위한 드롭다운 컴포넌트
- **기능**: 조직 목록 표시, 조직 선택, 로딩 상태 처리
- **사용 Hook**: useOrganization Hook 사용
- **UI**: shadcn/ui의 Select 컴포넌트 사용

#### DashboardSidebar
- **위치**: `src/domains/user-management/frontend/components/dashboard-sidebar.tsx`
- **역할**: 메인 대시보드의 사이드바 컴포넌트
- **기능**: OrganizationSwitcher 통합, 네비게이션 메뉴 제공
- **구성**: 조직 선택기, 워크스페이스 선택기, 설정 버튼 등

#### 미구현 컴포넌트들
- **OrganizationList**: 조직 목록 표시 컴포넌트 (Story 006에서 구현 예정)
- **OrganizationForm**: 조직 생성/편집 폼 컴포넌트 (Story 006에서 구현 예정)
- **SettingsModal**: 설정 모달 컴포넌트 (향후 구현 예정)
- **MemberManagement**: 멤버 관리 컴포넌트 (Story 007에서 구현 예정)

### 5.2 폼 컴포넌트

#### 미구현 항목 (Story 006에서 구현 예정)
- **OrganizationForm**: 조직 생성/편집을 위한 폼 컴포넌트
- **유효성 검사**: 조직명 필수 입력, 중복 이름 검사
- **제출 처리**: Server Action 호출 및 성공/실패 처리
- **로딩 상태**: 제출 중 로딩 상태 표시

### 5.3 선택기 컴포넌트

#### 실제 구현된 OrganizationSwitcher
- **위치**: `src/domains/user-management/frontend/components/organization-switcher.tsx`
- **역할**: 조직 선택을 위한 드롭다운 컴포넌트 (실제 구현됨)
- **기능**: 조직 목록 표시, 조직 선택, 로딩 상태 처리
- **사용 Hook**: useOrganization Hook 사용
- **UI**: shadcn/ui의 Select 컴포넌트 사용

## 🔗 6. 앱 레벨 통합

### 6.1 Provider 설정

**파일 위치**: `src/app/layout.tsx` (실제 구현)

#### 실제 구현된 Provider 구조
- **OrganizationProvider**: 조직 관련 상태 관리를 위한 Provider
- **Supabase Auth**: Supabase Auth를 통한 사용자 인증 (Clerk 미사용)
- **쿠키 관리**: 선택된 조직 ID를 쿠키에 저장하고 복원

#### Provider 사용 방식
- **직접 사용**: OrganizationProvider를 필요한 곳에서 직접 사용
- **초기 데이터**: Server Component에서 초기 조직 목록을 가져와서 전달
- **쿠키 연동**: 이전 선택 조직을 쿠키에서 복원

### 6.2 Supabase Auth 통합

#### 실제 구현된 인증 시스템
- **Supabase Auth**: Clerk 대신 Supabase Auth 사용
- **구글 OAuth**: Supabase Auth를 통한 구글 로그인
- **세션 관리**: Supabase Auth의 자동 세션 관리 활용

#### 미구현 항목
- **구글 OAuth 설정**: Supabase에서 구글 OAuth 연동 필요
- **로그인 페이지**: 프론트엔드 로그인 UI 미구현

### 6.3 사이드바 컴포넌트 구현

**파일 위치**: `src/domains/user-management/frontend/components/dashboard-sidebar.tsx` (실제 구현)

#### 실제 구현된 DashboardSidebar
- **역할**: 메인 대시보드의 사이드바 컴포넌트
- **구성**: OrganizationSwitcher 통합, 네비게이션 메뉴, 워크스페이스 관리
- **기능**: 조직 선택, 워크스페이스 선택, 설정 접근
- **하위 컴포넌트**: 
  - `sidebar-components/sidebar-header-group.tsx`: 홈, 검색, 인박스 메뉴
  - `sidebar-components/sidebar-footer-settings.tsx`: 설정 버튼
  - `sidebar-components/org-workspaces-menu.tsx`: 워크스페이스 메뉴
  - `sidebar-components/org-workspaces-skeleton.tsx`: 로딩 스켈레톤

#### 미구현 항목
- **워크스페이스 선택기**: 워크스페이스 도메인에서 구현 예정
- **설정 모달**: 설정 관리 기능 미구현
- **멤버 관리**: Story 007에서 구현 예정

### 6.4 미구현 컴포넌트들

#### 워크스페이스 선택기
- **상태**: 워크스페이스 도메인에서 구현 예정
- **기능**: 조직 내 워크스페이스 선택 및 생성

#### 설정 모달
- **상태**: 향후 구현 예정
- **기능**: 프로필, 조직, 멤버, 워크스페이스 설정 관리

#### 메인 레이아웃 통합
- **상태**: DashboardSidebar가 실제 사용됨
- **위치**: `src/domains/user-management/frontend/components/dashboard-sidebar.tsx`

## 📊 7. 구현 완료 체크리스트

### 7.1 타입 정의 완료 확인
- [x] **Entity 클래스**: User, Organization Entity 클래스 구현 완료
- [x] **Value Objects**: UserId, OrganizationId, UserEmail 구현 완료
- [x] **DTO 타입**: OrganizationSummary, UserProfileView, UserRegistrationResult 구현 완료
- [ ] **복잡한 Read Models**: Scenario 2 이후 구현 예정

### 7.2 Context 구현 완료 확인
- [x] **OrganizationContext**: 조직 관련 상태 관리 Context 구현 완료
- [x] **상태 분리**: organizations, selectedId, isLoading, error 상태 분리 완료
- [x] **액션 분리**: fetchOrganizations, selectOrganization 액션 분리 완료
- [x] **쿠키 연동**: 선택된 조직 ID 쿠키 저장/복원 구현 완료
- [ ] **사용자 Context**: 별도 사용자 정보 관리 Context 미구현

### 7.3 Server Actions 구현 완료 확인
- [x] **기본 액션**: getUserOrganizationsAction, createUserProfileAction 구현 완료
- [x] **인증 처리**: Supabase Auth를 통한 인증 확인 구현 완료
- [x] **에러 처리**: UserManagementError 클래스 및 에러 메시지 구현 완료
- [ ] **조직 관리**: 조직 생성/수정/삭제 액션 미구현 (Story 006)
- [ ] **멤버 관리**: 멤버 초대/관리 액션 미구현 (Story 007)

### 7.4 Hook 구현 완료 확인
- [x] **useOrganization**: 메인 Hook 구현 완료, Context 추상화 완료
- [x] **유틸리티 함수**: 조직 관련 편의 함수들 구현 완료
- [ ] **낙관적 업데이트**: useOptimistic 미사용, 직접 상태 관리
- [ ] **복잡한 액션**: 조직 생성, 수정, 삭제 등 미구현

### 7.5 컴포넌트 구현 완료 확인
- [x] **OrganizationSwitcher**: 조직 선택 드롭다운 구현 완료
- [x] **DashboardSidebar**: 메인 사이드바 구현 완료
- [x] **Hook 사용**: 컴포넌트에서 useOrganization Hook 사용
- [x] **로딩/에러 처리**: 로딩 상태와 에러 상태 처리 완료
- [ ] **폼 컴포넌트**: OrganizationForm, SettingsModal 미구현
- [ ] **목록 컴포넌트**: OrganizationList, MemberManagement 미구현

### 7.6 앱 통합 완료 확인
- [x] **Provider 설정**: OrganizationProvider 직접 사용 방식 구현 완료
- [x] **초기 데이터**: Server Component에서 초기 데이터 전달 구현 완료
- [x] **쿠키 연동**: 선택된 조직 상태 지속성 구현 완료
- [ ] **구글 OAuth**: Supabase Auth 구글 OAuth 연동 필요
- [ ] **로그인 UI**: 프론트엔드 로그인 페이지 미구현

## 📚 8. 관련 문서 및 참조

### 8.1 필수 선행 문서
- **Software Design 문서**: `../domains/user-management-domain/software-design.md` ✅
  - Aggregate, Command, Event 정의 확인 완료
  - 비즈니스 규칙 및 정책 참조 완료
  - Read Models 및 Context Map 확인 완료

- **Technical Specification 문서**: `../domains/user-management-domain/technical-specification.md` ✅
  - Drizzle ORM + Supabase Auth 구현 방법
  - Service Layer 패턴 참조 완료
  - 에러 처리 및 의존성 주입 패턴 완료

- **Process Model 문서**: `../domains/user-management-domain/process-model.md` ✅
  - Scenario 0-1 구현 완료
  - 사용자 등록 및 조직 선택 프로세스 정의

### 8.2 기술 스택 참조 (실제 구현)
- **Next.js 14**: App Router, Server Actions ✅
- **React 18**: Context API, useState, useEffect ✅
- **TypeScript**: Entity 클래스, Value Objects, DTO ✅
- **UI 라이브러리**: shadcn/ui 컴포넌트 (Select, Button 등) ✅
- **상태 관리**: React Context + Custom Hooks 패턴 ✅
- **인증**: Supabase Auth (Clerk 대신 사용) ✅
- **ORM**: Drizzle ORM + Supabase ✅

### 8.3 실제 폴더 구조
```
src/
├── domains/user-management/
│   ├── shared/                     # 공유 도메인 객체들
│   │   ├── entities/               # Entity 클래스들
│   │   │   ├── user.entity.ts
│   │   │   └── organization.entity.ts
│   │   ├── value-objects/          # Value Objects
│   │   │   ├── ids.vo.ts
│   │   │   └── user-email.vo.ts
│   │   ├── aggregates/             # Aggregate 클래스들
│   │   │   ├── user.aggregate.ts
│   │   │   └── organization.aggregate.ts
│   │   ├── dtos/                   # DTO 타입들
│   │   │   └── index.ts
│   │   ├── commands/               # Command 인터페이스들
│   │   │   └── index.ts
│   │   ├── events/                 # Event 클래스들
│   │   │   └── index.ts
│   │   ├── errors/                 # 에러 타입
│   │   │   └── user-management.error.ts
│   │   └── types/                  # 공통 타입들
│   │       └── index.ts
│   ├── backend/                    # 백엔드 레이어
│   │   ├── services/               # 서비스 클래스들
│   │   ├── repositories/           # 리포지토리 구현체들
│   │   ├── anti-corruption-layers/ # ACL 클래스들
│   │   └── read-models/            # Read Model 클래스들
│   ├── actions/                    # Server Actions
│   │   └── user-management.actions.ts
│   └── frontend/                   # 프론트엔드 레이어
│       ├── contexts/               # React Context
│       │   └── organization-context.tsx
│       ├── hooks/                  # Custom Hooks
│       │   └── use-organization.ts
│       ├── components/             # UI 컴포넌트
│       │   ├── organization-switcher.tsx
│       │   ├── dashboard-sidebar.tsx
│       │   ├── sidebar-header-group.tsx
│       │   ├── sidebar-footer-settings.tsx
│       │   └── sidebar-components/  # 사이드바 하위 컴포넌트들
│       │       ├── sidebar-header-group.tsx
│       │       ├── sidebar-footer-settings.tsx
│       │       ├── org-workspaces-menu.tsx
│       │       ├── org-workspaces-skeleton.tsx
│       │       └── index.ts
│       └── utils/                  # 유틸리티 함수들
│           └── cookie-helpers.ts
```

### 8.4 현재 구현 상태
1. ✅ **Entity & Value Objects**: User, Organization Entity 및 Value Objects 구현 완료
2. ✅ **Server Actions**: 기본 CRUD 액션 구현 완료
3. ✅ **Context & Hook**: OrganizationContext 및 useOrganization Hook 구현 완료
4. ✅ **기본 컴포넌트**: OrganizationSwitcher, DashboardSidebar 구현 완료
5. ⚠️ **구글 OAuth**: Supabase Auth 구글 OAuth 연동 필요
6. ⚠️ **로그인 UI**: 프론트엔드 로그인 페이지 구현 필요
7. 📋 **Story 006**: 조직 생성/수정/삭제 기능 구현 예정
8. 📋 **Story 007**: 멤버 초대/관리 기능 구현 예정

### 8.5 다음 단계 우선순위
1. **즉시**: Supabase Auth 구글 OAuth 설정
2. **즉시**: 프론트엔드 로그인 페이지 구현
3. **다음 스프린트**: Story 006 (조직 관리) 구현
4. **다음 스프린트**: Story 007 (멤버 초대) 구현

이 Frontend Specification은 **User Management Domain**의 현재 구현 상태를 정확히 반영한 문서입니다.
