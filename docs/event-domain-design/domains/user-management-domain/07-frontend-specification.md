# User Management Domain - Frontend Specification

이 문서는 **User Management Domain**의 현재 구현 상태를 반영한 프론트엔드 명세서입니다.
**08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션을 준수하여 작성되었습니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: User Management (사용자 인증 및 조직 관리)
- **주요 기능**: 사용자 프로필 생성, 조직 관리, 조직 선택 및 상태 관리
- **UI 컴포넌트**: 조직 선택기, 대시보드 사이드바, 쿠키 기반 상태 영속성

### 현재 구현 상태
- ✅ **Phase 1**: DTO 타입 및 Context 구현 완료
- ✅ **Phase 2**: Server Actions 및 Hook 구현 완료  
- ✅ **Phase 3**: 기본 컴포넌트 구현 완료
- 🔄 **Phase 4**: 조직 생성 Dialog 및 폼 구현 (진행 중)
- 📋 **Phase 5**: 조직 수정/삭제 (Story 006 예정)
- 📋 **Phase 6**: 멤버 초대/관리 (Story 007 예정)

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

##### OrganizationSummary DTO
```typescript
export interface OrganizationSummary {
  id: string; // Serialized from OrganizationId
  name: string;
  isDefault: boolean;
  role?: 'owner' | 'admin' | 'member';
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

#### 새로 추가된 DTO 타입들 (Phase 4)

##### CreateOrganizationRequest DTO
```typescript
export interface CreateOrganizationRequest {
  name: string;
  organizationType: 'personal' | 'education' | 'startup' | 'agency' | 'company' | 'n/a';
}
```

##### CreateOrganizationResult DTO
```typescript
export interface CreateOrganizationResult {
  success: boolean;
  organization: {
    id: string;
    name: string;
    organizationType: string;
    isDefault: boolean;
    createdAt: string;
  };
  error?: string;
}
```

#### 미구현 항목 (Story 006-007 이후)
- **MembershipSummary**: 멤버십 정보 표시용
- **OrganizationWithMembers**: 멤버 정보를 포함한 조직 정보
- **UserOrganizationView**: 복합 조회를 위한 뷰 모델
- **폼 입력 타입들**: InviteMemberFormInput

### 1.2 CQRS Read/Write 분리

#### Write Side (Domain Objects)
- **Value Objects**: `UserId`, `OrganizationId`, `UserEmail` (클래스)
- **Entities**: `User`, `Organization` (클래스)
- **Aggregates**: `UserAggregate`, `OrganizationAggregate` (클래스)
- **비즈니스 로직 & 불변식 검증**

#### Read Side (DTOs)
- **Read Models**: `UserProfileView`, `OrganizationSummary` (interface, plain object)
- **데이터 투영 & 최적화된 조회**

#### Next.js Server Actions Boundary
- **DTO 직렬화**: 클래스 → plain object 변환
- **Date → ISO string 변환**
- **클라이언트 전달용 타입 보장**

## 🎛️ 2. React Context 구현 (08-code-conventions.md 준수)

### 2.1 Context 타입 정의

**파일 위치**: `src/domains/user-management/frontend/contexts/organization-context.tsx`

#### Context State 인터페이스
```typescript
interface OrganizationContextType {
  // 상태
  organizations: OrganizationSummary[];
  selectedOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  selectOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (data: CreateOrganizationRequest) => Promise<CreateOrganizationResult>;
}
```

#### Context Provider Props
```typescript
interface OrganizationProviderProps {
  children: ReactNode;
  initialOrganizations?: OrganizationSummary[];
  initialSelectedId?: string | null;
}
```

#### Context 설계 원칙 (08-code-conventions.md)
- **단일 책임**: 하나의 도메인에 대한 상태 관리
- **상태 분리**: 로컬 상태와 전역 상태 구분
- **액션 제공**: CRUD 작업을 위한 메소드
- **에러 처리**: 사용자 친화적 에러 메시지
- **성능 최적화**: useCallback, useMemo 활용
- **쿠키 연동**: 상태 지속성을 위한 쿠키 저장

### 2.2 Provider 구현

**파일 위치**: `src/domains/user-management/frontend/contexts/organization-context.tsx`

#### 주요 기능
- **상태 관리**: useState를 사용한 organizations, selectedOrganizationId, isLoading, error 상태 관리
- **쿠키 연동**: 선택된 조직 ID를 쿠키에 저장하고 복원
- **초기 데이터 로드**: Provider 마운트 시 조직 목록 자동 조회
- **에러 처리**: API 호출 실패 시 에러 상태 설정

#### 핵심 로직
- **refreshOrganizations**: Server Action을 호출하여 조직 목록 조회 및 상태 업데이트
- **selectOrganization**: 조직 선택 시 상태 업데이트 및 쿠키 저장
- **createOrganization**: 새로운 조직 생성 및 목록 갱신, 생성된 조직 자동 선택
- **초기 선택 로직**: URL 파라미터 > 쿠키 > 기본 조직 순서로 자동 선택

#### 쿠키 관리 (cookie-helpers.ts)
- **getCookieValue**: 쿠키에서 조직 ID 읽기
- **setCookieValue**: 선택된 조직 ID를 쿠키에 저장
- **ORGANIZATION_COOKIE_KEYS**: 쿠키 키 상수 관리

#### 새로 추가된 기능 (Phase 4)
- **조직 생성**: createOrganization 메서드로 새로운 조직 생성
- **자동 선택**: 생성된 조직을 자동으로 선택하여 컨텍스트 전환
- **에러 처리**: 조직 생성 실패 시 에러 상태 관리

#### 미구현 항목 (Story 006-007 이후)
- **조직 수정/삭제**: 조직 관리 액션들
- **멤버 관리**: 멤버 초대 및 관리 기능
- **사용자 정보 관리**: 별도 Context에서 관리 예정

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
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const service = new UserManagementService(userRepository, organizationRepository, supabaseAuthService);

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

##### getUserOrganizationsAction
- **역할**: 사용자의 조직 목록을 조회하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: UserManagementService를 통해 사용자 조직 목록 조회
- **반환**: OrganizationSummary[] 배열 (DTO 직렬화됨)

##### createUserProfileAction  
- **역할**: 사용자 프로필을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: Supabase 사용자 정보를 기반으로 프로필 생성
- **반환**: UserProfileView DTO

##### createDefaultOrganizationAction
- **역할**: 사용자를 위한 기본 조직을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 사용자 이름 기반으로 기본 조직 생성
- **반환**: OrganizationSummary DTO (직렬화됨)

##### processUserRegistrationAction
- **역할**: 사용자 등록 프로세스를 처리하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 프로필 생성과 기본 조직 생성을 트랜잭션으로 처리
- **반환**: UserRegistrationResult DTO

##### createNewOrganizationAction (새로 추가)
- **역할**: 사용자가 새로운 조직을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 조직 이름 중복 검사, 조직 타입 검증, 새로운 조직 생성
- **반환**: CreateOrganizationResult DTO
- **입력**: CreateOrganizationRequest (name, organizationType)

#### 핵심 원칙 (08-code-conventions.md)
- **DTO 반환**: Domain Objects를 직렬화하여 반환
- **Command 객체**: Software Design의 Command를 그대로 활용
- **Service Layer**: 비즈니스 로직은 Service에서 처리
- **에러 전파**: try-catch로 에러를 catch하고 throw로 전파
- **revalidatePath**: 데이터 변경 시 관련 페이지 재검증

#### 새로 추가된 Server Action (Phase 4)
- **createNewOrganizationAction**: 새로운 조직 생성 액션 구현 완료

#### 미구현 항목 (Story 006-007 이후)
- **조직 수정/삭제**: 조직 관리 액션들
- **멤버 초대/관리**: 멤버 관리 액션들

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

**파일 위치**: `src/domains/user-management/frontend/hooks/use-organization.ts`

#### Hook 설계 원칙 (08-code-conventions.md)
- **Context 확장**: 기존 Context 기능을 활용
- **비즈니스 로직**: 권한 체크, 상태 계산 등
- **액션 래퍼**: Context 액션 + 로컬 상태 업데이트
- **에러 처리**: 로컬 에러와 전역 에러 구분
- **성능 최적화**: useMemo, useCallback 활용

#### 실제 구현된 useOrganization Hook

##### 주요 기능
- **Context 연동**: OrganizationContext를 사용하여 조직 관련 상태와 액션에 접근
- **상태 제공**: organizations, selectedOrganization, isLoading, error 상태 제공
- **액션 제공**: refreshOrganizations, selectOrganization 액션 제공
- **유틸리티 함수**: 조직 관련 편의 함수들 제공

##### 제공하는 상태
- **organizations**: OrganizationSummary[] - 조직 목록
- **selectedOrganization**: OrganizationSummary | null - 선택된 조직
- **defaultOrganization**: OrganizationSummary | null - 기본 조직
- **isLoading**: boolean - 로딩 상태
- **error**: string | null - 에러 상태

##### 제공하는 액션
- **refreshOrganizations**: 조직 목록 조회
- **selectOrganization**: 조직 선택
- **createOrganization**: 새로운 조직 생성 (Phase 4 추가)

##### 유틸리티 함수
- **canSelectOrganization**: 조직 선택 가능 여부 확인
- **isDefaultOrganization**: 기본 조직 여부 확인
- **findOrganizationByName**: 이름으로 조직 찾기
- **ownedOrganizations**: 소유한 조직 목록

#### 새로 추가된 기능 (Phase 4)
- **조직 생성**: createOrganization 메서드로 새로운 조직 생성
- **자동 선택**: 생성된 조직을 자동으로 선택하여 컨텍스트 전환
- **에러 처리**: 조직 생성 실패 시 에러 상태 관리

#### 미구현 항목 (Story 006-007 이후)
- **낙관적 업데이트**: useOptimistic 미사용, 직접 상태 관리
- **복잡한 액션들**: 조직 수정, 삭제 등 미구현
- **멤버 관리**: 멤버 초대 및 관리 기능

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

##### OrganizationSwitcher
- **위치**: `src/domains/user-management/frontend/components/organization-switcher.tsx`
- **역할**: 조직 선택을 위한 드롭다운 컴포넌트
- **기능**: 조직 목록 표시, 조직 선택, "새 조직 만들기" 버튼, 로딩 상태 처리
- **사용 Hook**: useOrganization Hook 사용
- **UI**: shadcn/ui의 DropdownMenu 컴포넌트 사용
- **새 기능**: "Add Organization" 버튼으로 CreateOrganizationDialog 열기

##### DashboardSidebar
- **위치**: `src/domains/user-management/frontend/components/dashboard-sidebar.tsx`
- **역할**: 메인 대시보드의 사이드바 컴포넌트
- **기능**: OrganizationSwitcher 통합, 네비게이션 메뉴 제공
- **구성**: 조직 선택기, 워크스페이스 선택기, 설정 버튼 등

#### 새로 추가된 컴포넌트 (Phase 4)

##### CreateOrganizationDialog
- **위치**: `src/domains/user-management/frontend/components/create-organization-dialog.tsx`
- **역할**: 새로운 조직 생성을 위한 Dialog 컴포넌트
- **기능**: 
  - shadcn/ui Dialog 컴포넌트 사용
  - 조직명 입력 필드 (필수)
  - 조직 타입 선택 드롭다운 (personal, education, startup, agency, company, n/a)
  - 폼 검증 (Zod 스키마 사용)
  - 제출 시 createOrganization Hook 호출
  - 성공 시 Dialog 닫기 및 조직 목록 갱신
  - 에러 상태 표시
- **사용 Hook**: useOrganization Hook 사용
- **UI**: shadcn/ui의 Dialog, Form, Input, Select 컴포넌트 사용

#### 미구현 컴포넌트들 (Story 006-007 이후)
- **OrganizationList**: 조직 목록 표시 컴포넌트
- **OrganizationEditForm**: 조직 편집 폼 컴포넌트
- **SettingsModal**: 설정 모달 컴포넌트
- **MemberManagement**: 멤버 관리 컴포넌트

### 5.2 Hook 사용 패턴

#### Hook 사용 원칙 (08-code-conventions.md)
- **컴포넌트에서 직접 Context 접근 금지**: 반드시 Custom Hook을 통해 접근
- **DTO 데이터 기반 UI 렌더링**: 직렬화된 데이터를 기반으로 UI 구성
- **에러 상태 활용**: Hook에서 제공하는 에러 상태를 사용자 친화적으로 표시
- **로딩 상태 처리**: Hook에서 제공하는 로딩 상태를 적절히 처리

#### 실제 구현 예시
```typescript
// OrganizationSwitcher에서 useOrganization Hook 사용
export function OrganizationSwitcher() {
  const { organizations, selectedOrganization, selectOrganization } = useOrganization();
  
  // Hook에서 제공하는 상태와 액션을 직접 사용
  // Context에 직접 접근하지 않음
}

// CreateOrganizationDialog에서 useOrganization Hook 사용
export function CreateOrganizationDialog({ open, onOpenChange }: DialogProps) {
  const { createOrganization, isLoading, error } = useOrganization();
  
  const handleSubmit = async (data: CreateOrganizationRequest) => {
    const result = await createOrganization(data);
    if (result.success) {
      onOpenChange(false); // Dialog 닫기
    }
  };
  
  // Hook에서 제공하는 액션과 상태를 직접 사용
}
```

### 5.3 폼 검증 및 에러 처리 (Phase 4)

#### CreateOrganizationDialog 폼 검증
- **Zod 스키마**: 조직명 필수 입력, 조직 타입 선택 필수
- **실시간 검증**: 입력 중 즉시 피드백 제공
- **에러 메시지**: 사용자 친화적인 한국어 에러 메시지
- **로딩 상태**: 제출 중 버튼 비활성화 및 스피너 표시

#### 에러 처리 패턴
- **서버 에러**: 조직명 중복, 권한 부족 등
- **네트워크 에러**: 연결 실패, 타임아웃 등
- **검증 에러**: 입력 형식 오류, 필수 필드 누락 등
- **사용자 피드백**: Toast 알림 또는 인라인 에러 메시지

### 5.4 미구현 컴포넌트들 (Story 006-007 이후)

#### OrganizationEditForm
- **역할**: 조직 편집을 위한 폼 컴포넌트
- **유효성 검사**: 조직명 필수 입력, 중복 이름 검사
- **제출 처리**: Server Action 호출 및 성공/실패 처리
- **로딩 상태**: 제출 중 로딩 상태 표시

#### OrganizationList
- **역할**: 조직 목록 표시 컴포넌트
- **기능**: 조직 목록 표시, 검색, 필터링
- **상태 관리**: useOrganization Hook 활용

#### MemberManagement
- **역할**: 멤버 관리 컴포넌트
- **기능**: 멤버 초대, 권한 관리, 멤버 제거
- **상태 관리**: 별도 Hook 필요 (useMemberManagement)

## 🔗 6. 앱 레벨 통합 (08-code-conventions.md 준수)

### 6.1 Provider 통합 설계

**파일 위치**: `src/app/layout.tsx`

#### Provider 중첩 순서 (08-code-conventions.md)
- **의존성이 적은 도메인부터 상위에 배치**
- **인증 관련 Provider는 가장 상위에 배치**
- **각 도메인 Provider는 독립적으로 동작**

#### 실제 구현된 Provider 구조
- **OrganizationProvider**: 조직 관련 상태 관리를 위한 Provider
- **Supabase Auth**: Supabase Auth를 통한 사용자 인증
- **쿠키 관리**: 선택된 조직 ID를 쿠키에 저장하고 복원

#### 초기 데이터 전달 (08-code-conventions.md)
- **Server Components에서 Server Actions 호출**
- **초기 데이터를 Provider에 props로 전달**
- **클라이언트에서 추가 로딩 최소화**

### 6.2 쿠키 기반 영속성

#### 쿠키 관리 (cookie-helpers.ts)
- **getCookieValue**: 쿠키에서 조직 ID 읽기
- **setCookieValue**: 선택된 조직 ID를 쿠키에 저장
- **ORGANIZATION_COOKIE_KEYS**: 쿠키 키 상수 관리

#### 상태 지속성 원칙
- **선택된 엔티티 상태를 쿠키로 저장**
- **새로고침 시에도 선택 상태 유지**
- **URL 파라미터와 쿠키 우선순위 관리**

### 6.3 미구현 항목 (Story 006-007 이후)

#### 워크스페이스 선택기
- **상태**: 워크스페이스 도메인에서 구현 예정
- **기능**: 조직 내 워크스페이스 선택 및 생성

#### 설정 모달
- **상태**: 향후 구현 예정
- **기능**: 프로필, 조직, 멤버, 워크스페이스 설정 관리

#### 구글 OAuth 설정
- **상태**: Supabase에서 구글 OAuth 연동 필요
- **기능**: Supabase Auth를 통한 구글 로그인

#### 로그인 페이지
- **상태**: 프론트엔드 로그인 UI 미구현
- **기능**: 사용자 인증 및 리다이렉트 처리

## 📊 7. 구현 완료 체크리스트 (08-code-conventions.md 기준)

### 7.1 DTO 타입 정의 완료 확인
- [x] **DTO 인터페이스**: Plain Object로 정의 완료
- [x] **Date 직렬화**: ISO 문자열로 변환 완료
- [x] **Value Object 직렬화**: string으로 변환 완료
- [x] **Next.js Server Actions 직렬화 제약 준수**: 완료
- [ ] **CreateOrganizationRequest/Result**: 조직 생성용 DTO 추가 예정
- [ ] **복잡한 Read Models**: Story 006-007 이후 구현 예정

### 7.2 Context 구현 완료 확인
- [x] **도메인별 독립적인 Context**: OrganizationContext 구현 완료
- [x] **DTO 배열과 선택된 엔티티 상태 관리**: 완료
- [x] **쿠키 기반 영속성**: 선택된 조직 ID 쿠키 저장/복원 구현 완료
- [x] **초기 데이터 로드 로직**: Provider 마운트 시 자동 조회 구현 완료
- [ ] **조직 생성 액션**: createOrganization 메서드 추가 예정
- [ ] **사용자 Context**: 별도 사용자 정보 관리 Context 미구현

### 7.3 Server Actions 구현 완료 확인
- [x] **Supabase Auth 인증 확인**: 모든 액션에서 구현 완료
- [x] **의존성 주입 패턴**: Service Layer 사용 완료
- [x] **Command 객체 활용**: 입력 구조화 완료
- [x] **DTO 직렬화**: Service Layer에서 DTO 반환 완료
- [x] **revalidatePath**: 관련 페이지 재검증 완료
- [ ] **조직 생성**: createNewOrganizationAction 구현 예정
- [ ] **조직 수정/삭제**: 조직 관리 액션 미구현 (Story 006)
- [ ] **멤버 관리**: 멤버 초대/관리 액션 미구현 (Story 007)

### 7.4 Hook 구현 완료 확인
- [x] **Context 추상화**: useOrganization Hook 구현 완료
- [x] **비즈니스 로직 메서드**: 조직 관련 편의 함수들 구현 완료
- [x] **선택된 엔티티, 기본 엔티티 등 유틸리티**: 완료
- [x] **에러 상태 처리**: 적절히 처리 완료
- [ ] **조직 생성 액션**: createOrganization 메서드 추가 예정
- [ ] **낙관적 업데이트**: useOptimistic 미사용, 직접 상태 관리
- [ ] **복잡한 액션**: 조직 수정, 삭제 등 미구현

### 7.5 컴포넌트 연동 완료 확인
- [x] **Hook 사용**: 컴포넌트에서 useOrganization Hook 사용
- [x] **Switcher 컴포넌트**: OrganizationSwitcher 드롭다운 구현 완료
- [x] **로딩 상태와 에러 상태 처리**: 적절히 처리 완료
- [x] **빈 상태 처리**: 포함 완료
- [ ] **조직 생성 Dialog**: CreateOrganizationDialog 구현 예정
- [ ] **폼 검증**: Zod 스키마 기반 검증 구현 예정
- [ ] **폼 컴포넌트**: OrganizationEditForm, SettingsModal 미구현
- [ ] **목록 컴포넌트**: OrganizationList, MemberManagement 미구현

### 7.6 앱 통합 완료 확인
- [x] **Provider 중첩 순서**: 적절한 순서로 배치 완료
- [x] **초기 데이터**: Server Components에서 전달 완료
- [x] **쿠키 기반 영속성**: 올바르게 작동 완료
- [x] **페이지별 Hook 사용**: 필요한 Hook만 선택적으로 사용 완료
- [ ] **구글 OAuth**: Supabase Auth 구글 OAuth 연동 필요
- [ ] **로그인 UI**: 프론트엔드 로그인 페이지 미구현

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
- **UI 라이브러리**: shadcn/ui 컴포넌트 (DropdownMenu, Sidebar 등) ✅
- **상태 관리**: React Context + Custom Hooks 패턴 ✅
- **인증**: Supabase Auth ✅
- **ORM**: Drizzle ORM + Supabase ✅
- **쿠키 관리**: cookie-helpers.ts 유틸리티 ✅

### 8.3 실제 폴더 구조 (08-code-conventions.md 준수)
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
│   │   ├── dtos/                   # DTO 타입들 (직렬화 가능)
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
│       │   ├── create-organization-dialog.tsx
│       │   ├── dashboard-sidebar.tsx
│       │   └── sidebar-components/  # 사이드바 하위 컴포넌트들
│       │       ├── sidebar-header-group.tsx
│       │       ├── sidebar-footer-settings.tsx
│       │       ├── org-workspaces-menu.tsx
│       │       ├── org-workspaces-skeleton.tsx
│       │       └── index.ts
│       └── utils/                  # 유틸리티 함수들
│           └── cookie-helpers.ts
```

### 8.4 현재 구현 상태 (08-code-conventions.md 기준)
1. ✅ **DTO 직렬화**: Plain Object, ISO 문자열, Value Object 직렬화 완료
2. ✅ **React Context**: OrganizationContext 구현 완료
3. ✅ **Server Actions**: 표준 패턴 준수, DTO 반환 완료
4. ✅ **Custom Hook**: useOrganization Hook 구현 완료
5. ✅ **React Components**: OrganizationSwitcher, DashboardSidebar 구현 완료
6. ✅ **앱 통합**: Provider 설정, 쿠키 기반 영속성 완료
7. 📋 **조직 생성 Dialog**: CreateOrganizationDialog 구현 예정 (Phase 4)
8. ⚠️ **구글 OAuth**: Supabase Auth 구글 OAuth 연동 필요
9. ⚠️ **로그인 UI**: 프론트엔드 로그인 페이지 구현 필요
10. 📋 **Story 006**: 조직 수정/삭제 기능 구현 예정
11. 📋 **Story 007**: 멤버 초대/관리 기능 구현 예정

### 8.5 다음 단계 우선순위
1. **즉시**: Supabase Auth 구글 OAuth 설정
2. **즉시**: 프론트엔드 로그인 페이지 구현
3. **다음**: Phase 4 (조직 생성 Dialog) 구현
4. **다음 스프린트**: Story 006 (조직 수정/삭제) 구현
5. **다음 스프린트**: Story 007 (멤버 초대) 구현

---

이 Frontend Specification은 **User Management Domain**의 현재 구현 상태를 **08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션에 맞춰 정확히 반영한 문서입니다.
