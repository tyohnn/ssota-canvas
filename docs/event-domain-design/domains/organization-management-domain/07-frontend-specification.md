# Organization Management Domain - Frontend Specification

이 문서는 **Organization Management Domain**의 현재 구현 상태를 반영한 프론트엔드 명세서입니다.
**08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션을 준수하여 작성되었습니다.

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-10-09
**버전**: 8.0  
**리뷰어**: [시니어 개발자명]

### 주요 변경사항 (v8.0) - 조직 스위처 개선 (멤버 조직 표시)
- **조직 스위처 확장**: 소유자 + 멤버/관리자 조직 모두 표시 ✅
  - getUserOrganizationsAction: 소유자 조직 + 멤버 조직 통합 조회
  - 정렬: 소유자 조직 우선 → 참여일(joined_at) 오름차순
- **역할 정보 표시**: 각 조직의 정확한 역할 표시 ✅
  - 소유자 조직: "기본" 배지 (isDefault인 경우)
  - 멤버 조직: 역할 배지 표시 가능 (선택사항)
- **초대 승낙 후 자동 동기화**: 초대 승낙 시 조직 목록 자동 새로고침 ✅
  - handleInvitationRespond에서 accept 시 refreshOrganizations() 호출
  - 초대받은 조직이 즉시 스위처에 표시됨

### 이전 변경사항 (v7.0) - Layered Security Model 적용 및 멤버 초대 시스템 완성
- **Layered Security Model 도입**: RLS 정책을 최소 권한으로 단순화, 복잡한 권한은 Application-level에서 처리 ✅
- **멤버 초대 시스템 완성**: 초대 생성, 알림 생성, 초대 승낙, 멤버 추가 전체 플로우 구현 ✅
- **Repository 개선**: 시스템 레벨 작업에 adminDb 사용으로 RLS 재귀 문제 해결 ✅
- **Frontend UI/UX 개선**: 인박스 패널 디자인 최적화, NEW 배지, 호버 액션 ✅

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: Organization Management (조직 생성, 멤버 초대, 조직 관리)
- **주요 기능**: 조직 생성, 멤버 초대 및 수락, 조직 관리, 소유권 이전, 조직 삭제
- **UI 컴포넌트**: 조직 생성 폼, 멤버 초대 폼, 조직 관리 패널, 인박스 알림 시스템

### 현재 구현 상태
- ✅ **Phase 1**: DTO 타입 및 Context 구현 완료
- ✅ **Phase 2**: Server Actions 및 Hook 구현 완료  
- ✅ **Phase 3**: 기본 컴포넌트 구현 완료
- ✅ **Phase 4**: 조직 생성 Dialog 및 폼 구현 완료
- ✅ **Phase 5**: 멤버 초대 및 수락 시스템 구현 완료 (Scenario 2)
  - 멤버 초대: Application-level 권한 체크, NotificationService 통합
  - 초대 승낙: organization_members에 멤버 자동 추가
  - 인박스 UI/UX 개선: 닫기 아이콘, 패딩, 호버 액션, NEW 배지
- 📋 **Phase 6**: 조직 수정/삭제 (Story 006 예정)

---

## 📋 1. DTO 타입 정의 (08-code-conventions.md 준수)

### 1.1 DTO 직렬화 컨벤션

**파일 위치**: `src/domains/organization-management/shared/dtos/index.ts`

#### Next.js Server Actions 직렬화 제약 준수
- **Plain Object만 사용**: 클래스, 함수, Date 객체 등 직렬화 불가능한 타입 금지
- **ISO 문자열 사용**: Date → string 변환 (예: `createdAt: string`)
- **Value Object 직렬화**: Domain Value Object → string 변환 (예: `OrganizationId` → `string`)

#### 실제 구현된 DTO 타입들

##### OrganizationSummary DTO
```typescript
export interface OrganizationSummary {
  id: string; // Serialized from OrganizationId
  name: string;
  organizationType: 'personal' | 'education' | 'startup' | 'agency' | 'company' | 'n/a';
  isDefault: boolean;
  role?: 'owner' | 'admin' | 'member';
  createdAt: string; // ISO 8601 string (serialized from Date)
}
```

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

#### 새로 추가된 DTO 타입들 (Phase 5 - Scenario 2)

##### OrganizationMemberView DTO
```typescript
export interface OrganizationMemberView {
  organizationId: string; // Serialized from OrganizationId
  currentMembers: MemberSummary[];
  pendingInvitations: InvitationSummary[];
  userRole: 'owner' | 'admin' | 'member';
}

export interface MemberSummary {
  userId: string; // Serialized from UserId
  name: string;
  email: string;
  profileImageUrl?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string; // ISO 8601 string (serialized from Date)
}

export interface InvitationSummary {
  id: string; // Serialized from InvitationId
  inviteeEmail: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  inviterName: string;
  createdAt: string; // ISO 8601 string (serialized from Date)
}
```

##### UserNotificationView DTO (Notification Management Domain에서 제공)
- **파일 위치**: `src/domains/notification-management/shared/dtos/index.ts`
- **설명**: Notification Management Domain에서 정의한 알림 관련 DTO
- **참조**: [Notification Management Domain Frontend Specification](../../notification-management-domain/07-frontend-specification.md)

##### InviteMemberRequest DTO
```typescript
export interface InviteMemberRequest {
  organizationId: string; // Serialized from OrganizationId
  inviteeEmail: string;
  role: 'admin' | 'member';
}
```

##### RespondToInvitationRequest DTO
```typescript
export interface RespondToInvitationRequest {
  invitationId: string; // Serialized from InvitationId
  accept: boolean;
}
```

#### 미구현 항목 (Story 006 이후)
- **복잡한 Read Models**: Story 006 이후 구현 예정

### 1.2 CQRS Read/Write 분리

#### Write Side (Domain Objects)
- **Value Objects**: `OrganizationId`, `InvitationId`, `NotificationId`, `MemberRole` (클래스)
- **Entities**: `Organization`, `Invitation`, `Notification` (클래스)
- **Aggregates**: `OrganizationAggregate`, `InvitationAggregate`, `NotificationAggregate` (클래스)
- **비즈니스 로직 & 불변식 검증**

#### Read Side (DTOs)
- **Read Models**: `OrganizationSummary`, `OrganizationMemberView`, `UserNotificationView` (interface, plain object)
- **데이터 투영 & 최적화된 조회**

#### Next.js Server Actions Boundary
- **DTO 직렬화**: 클래스 → plain object 변환
- **Date → ISO string 변환**
- **클라이언트 전달용 타입 보장**

## 🎛️ 2. React Context 구현 (08-code-conventions.md 준수)

### 2.1 Context 타입 정의

**파일 위치**: `src/domains/organization-management/frontend/contexts/organization-context.tsx`

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

#### 새로 추가된 Context (Phase 5 - Scenario 2)

##### NotificationContextType (Notification Management Domain에서 제공)
- **파일 위치**: `src/domains/notification-management/frontend/contexts/notification-context.tsx`
- **설명**: Notification Management Domain에서 정의한 알림 Context
- **사용처**: Organization Management Domain의 InboxPanel에서 사용
- **참조**: [Notification Management Domain Frontend Specification](../../notification-management-domain/07-frontend-specification.md)

##### MemberManagementContextType
```typescript
interface MemberManagementContextType {
  // 상태
  organizationMembers: OrganizationMemberView | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  refreshOrganizationMembers: (organizationId: string) => Promise<void>;
  inviteMember: (data: InviteMemberRequest) => Promise<void>;
  searchUserByEmail: (email: string) => Promise<UserProfile[]>;
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

**파일 위치**: `src/domains/organization-management/frontend/contexts/organization-context.tsx`

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
- **CreateOrganizationDialog**: shadcn/ui Dialog를 사용한 조직 생성 폼
- **Zod 스키마 검증**: 클라이언트 사이드 폼 검증
- **Toast 알림**: 성공/실패 시 사용자 피드백

#### 미구현 항목 (Story 006-007 이후)
- **조직 수정/삭제**: 조직 관리 액션들
- **멤버 관리**: 멤버 초대 및 관리 기능
- **사용자 정보 관리**: 별도 Context에서 관리 예정

## ⚡ 3. Server Actions 구현 (08-code-conventions.md 준수)

### 3.1 Server Actions 구조

**파일 위치**: `src/domains/organization-management/actions/organization-management.actions.ts`

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
    const organizationRepository = new DrizzleOrganizationRepository();
    const invitationRepository = new DrizzleInvitationRepository();
    const organizationMemberRepository = new DrizzleOrganizationMemberRepository();
    
    // Notification Service 추가 (Notification Management Domain 통합)
    const notificationRepository = new DrizzleNotificationRepository();
    const notificationService = new NotificationService(notificationRepository);
    
    const service = new OrganizationManagementService(
      organizationRepository, 
      invitationRepository, 
      organizationMemberRepository,
      notificationService
    );

    // Profile에서 inviterName 조회 (user_metadata 대신 profiles 테이블 사용)
    const userProfiles = await organizationMemberRepository.searchUserProfileByEmail(user.email);
    const inviterName = userProfiles[0]?.name || user.email || 'Someone';

    // 3. Command 생성
    const command: [CommandType] = { 
      /* ... */
      inviterName, // Notification 생성에 필요
    };

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

##### createNewOrganizationAction
- **역할**: 사용자가 새로운 조직을 생성하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 조직 이름 중복 검사, 조직 타입 검증, 새로운 조직 생성
- **반환**: CreateOrganizationResult DTO
- **입력**: CreateOrganizationRequest (name, organizationType)

##### getUserOrganizationsAction (v8.0 개선)
- **역할**: 사용자의 조직 목록을 조회하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 
  - **OrganizationMemberRepository 주입** (멤버 조직 조회용) ✅ NEW
  - OrganizationManagementService.getUserOrganizations() 호출
  - **소유자 조직 + 멤버 조직 통합 조회** ✅ NEW
    1. 소유자인 조직 조회 (role: 'owner')
    2. 멤버인 조직 조회 (role: 'admin' | 'member')
    3. Map으로 중복 제거 (소유자이면서 멤버인 경우 소유자 우선)
    4. 정렬: 소유자 조직 먼저 → 참여일(joined_at) 오름차순
- **반환**: OrganizationSummary[] 배열 (DTO 직렬화됨)
  - 각 조직의 정확한 역할 정보 포함
  - 소유자 조직: `role: 'owner'`
  - 멤버 조직: `role: 'admin' | 'member'` (organization_members 테이블 기준)

#### 새로 추가된 Server Actions (Phase 5 - Scenario 2)

##### inviteMemberAction ✅
- **역할**: 조직 멤버를 초대하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 
  - NotificationService 주입 (Notification Management Domain 통합)
  - Profile에서 inviterName 조회 (user_metadata 대신 profiles 테이블)
  - Service.inviteMember() 호출
    - Application-level 권한 체크 (Owner/Admin)
    - 이메일로 사용자 검색 (searchUserProfileByEmail)
    - inviteeUserId 저장 (가입된 사용자)
    - NotificationService.createInvitationNotification() 호출 (가입된 사용자만)
- **반환**: void (성공/실패만 반환)
- **입력**: InviteMemberRequest (organizationId, inviteeEmail, role)

##### getOrganizationMembersAction ✅
- **역할**: 조직 멤버 목록을 조회하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 
  - OrganizationMemberRepository.getOrganizationMemberView() 호출
  - Layered Security 적용:
    - Step 1: RLS로 자기 membership 확인
    - Step 2: Application-level 권한 체크 (Owner/Admin)
    - Step 3: adminDb로 전체 멤버 조회 (RLS 우회)
- **반환**: OrganizationMemberView DTO
- **입력**: organizationId (string)

##### respondToInvitationAction ✅
- **역할**: 초대에 응답하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 
  - OrganizationMemberRepository 주입 (멤버 추가를 위해)
  - Service.acceptInvitation() 또는 Service.rejectInvitation() 호출
    - acceptInvitation: 초대 상태 업데이트 + **organization_members에 멤버 추가** (adminDb)
    - rejectInvitation: 초대 상태만 업데이트
- **반환**: void (성공/실패만 반환)
- **입력**: RespondToInvitationRequest (invitationId, accept)

#### Notification Management Domain Server Actions (참조)
- **getUserNotificationsAction**: Notification Management Domain에서 제공
- **markNotificationAsReadAction**: Notification Management Domain에서 제공
- **archiveNotificationAction**: Notification Management Domain에서 제공
- **참조**: [Notification Management Domain Frontend Specification](../../notification-management-domain/07-frontend-specification.md)

#### 핵심 원칙 (08-code-conventions.md)
- **DTO 반환**: Domain Objects를 직렬화하여 반환 ✅
- **Command 객체**: Software Design의 Command를 그대로 활용 ✅
- **Service Layer**: 비즈니스 로직은 Service에서 처리 ✅
- **Domain 통합**: Service → Service 호출 (Action → Action 호출 금지) ✅
  - OrganizationManagementService → NotificationService
- **Data Source**: profiles 테이블 사용 (user_metadata 대신) ✅
- **동적 import 금지**: 일반 import 사용 ✅
- **에러 전파**: try-catch로 에러를 catch하고 throw로 전파 ✅
- **revalidatePath**: 데이터 변경 시 관련 페이지 재검증 ✅

#### 새로 추가된 Server Action (Phase 4)
- **createNewOrganizationAction**: 새로운 조직 생성 액션 구현 완료

#### 미구현 항목 (Story 006-007 이후)
- **조직 수정/삭제**: 조직 관리 액션들
- **멤버 초대/관리**: 멤버 관리 액션들

### 3.2 에러 처리 (08-code-conventions.md 준수)

**파일 위치**: `src/domains/organization-management/shared/errors/organization-management.error.ts`

#### 에러 처리 원칙
- **도메인 에러**: 비즈니스 규칙 위반 + 사용자 친화적 메시지
- **시스템 에러**: 인프라/외부 서비스 문제
- **검증 에러**: 입력 데이터 유효성 검사 실패
- **에러 분류**: 타입별로 적절한 처리 방식 적용

#### 실제 구현된 에러 클래스
- **OrganizationManagementError**: 조직 관리 도메인의 기본 에러 클래스
- **OrganizationManagementErrorCode**: 에러 코드 열거형
- **ERROR_MESSAGES**: 에러 메시지 매핑 (한국어 지원)

#### 미구현 항목 (향후 확장)
- **복잡한 에러 분류**: 현재는 기본적인 에러만 정의
- **에러 복구 로직**: 재시도 및 복구 메커니즘 미구현

## 🎣 4. Custom Hook 구현 (08-code-conventions.md 준수)

### 4.1 Hook 구조

**파일 위치**: `src/domains/organization-management/frontend/hooks/use-organization.ts`

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

#### Notification Management Domain Hook (참조)

##### useNotification Hook (Notification Management Domain에서 제공)
- **파일 위치**: `src/domains/notification-management/frontend/hooks/use-notification.ts`
- **설명**: Notification Management Domain에서 정의한 알림 Hook
- **사용처**: Organization Management Domain의 InboxPanel, NotificationItem에서 사용
- **참조**: [Notification Management Domain Frontend Specification](../../notification-management-domain/07-frontend-specification.md)

##### useMemberManagement Hook
**파일 위치**: `src/domains/organization-management/frontend/hooks/use-member-management.ts`

**주요 기능**:
- **Context 연동**: MemberManagementContext를 사용하여 멤버 관리 상태와 액션에 접근
- **상태 제공**: organizationMembers, isLoading, error 상태 제공
- **액션 제공**: refreshOrganizationMembers, inviteMember, searchUserByEmail 액션 제공
- **유틸리티 함수**: 멤버 관리 관련 편의 함수들 제공

**제공하는 상태**:
- **organizationMembers**: OrganizationMemberView | null - 조직 멤버 정보
- **isLoading**: boolean - 로딩 상태
- **error**: string | null - 에러 상태

**제공하는 액션**:
- **refreshOrganizationMembers**: 조직 멤버 목록 조회
- **inviteMember**: 멤버 초대
- **searchUserByEmail**: 이메일로 사용자 검색

**유틸리티 함수**:
- **canInviteMembers**: 멤버 초대 권한 확인
- **getCurrentMembers**: 현재 멤버 목록
- **getPendingInvitations**: 진행 중인 초대 목록
- **isMember**: 특정 사용자가 멤버인지 확인
- **hasPendingInvitation**: 특정 이메일에 대한 진행 중인 초대 존재 여부

#### 미구현 항목 (Story 006 이후)
- **낙관적 업데이트**: useOptimistic 미사용, 직접 상태 관리
- **복잡한 액션들**: 조직 수정, 삭제 등 미구현

## 🧩 5. React Components 구현 (08-code-conventions.md 준수)

### 5.1 컴포넌트 구조

**파일 위치**: `src/domains/organization-management/frontend/components/`

#### 컴포넌트 설계 원칙 (08-code-conventions.md)
- **단일 책임**: 하나의 UI 기능만 담당
- **Props 인터페이스**: 명확한 타입 정의
- **상태 관리**: Custom Hook 활용
- **에러 처리**: 사용자 친화적 에러 표시
- **로딩 상태**: 적절한 로딩 인디케이터
- **접근성**: ARIA 속성 및 키보드 네비게이션
- **반응형**: 모바일 및 데스크톱 대응

#### 실제 구현된 컴포넌트들

##### OrganizationSwitcher (v8.0 개선)
- **위치**: `src/domains/organization-management/frontend/components/organization-switcher.tsx`
- **역할**: 조직 선택을 위한 드롭다운 컴포넌트
- **기능**: 
  - **소유자 + 멤버 조직 모두 표시** ✅ v8.0 NEW
  - 조직 선택 시 URL 이동 (`/r/[orgId]/workspace`)
  - "새 조직 만들기" 버튼
  - 로딩 상태 처리
- **정렬 규칙**: ✅ v8.0 NEW
  - 소유자 조직 우선 표시
  - 이후 참여일(joined_at) 오름차순 정렬
- **역할 표시**:
  - 기본 조직: "기본" 배지 표시
  - 향후 확장: 역할별 배지 표시 가능 (owner/admin/member)
- **사용 Hook**: useOrganization Hook 사용
- **UI**: shadcn/ui의 DropdownMenu 컴포넌트 사용

##### DashboardSidebar
- **위치**: `src/domains/organization-management/frontend/components/dashboard-sidebar.tsx`
- **역할**: 메인 대시보드의 사이드바 컴포넌트
- **기능**: OrganizationSwitcher 통합, 네비게이션 메뉴 제공
- **구성**: 조직 선택기, 워크스페이스 선택기, 설정 버튼 등

#### 새로 추가된 컴포넌트 (Phase 4)

##### CreateOrganizationDialog
- **위치**: `src/domains/organization-management/frontend/components/create-organization-dialog.tsx`
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

#### Notification Management Domain Components (참조)

##### InboxPanel, NotificationItem, InboxButton (Notification Management Domain에서 제공)
- **파일 위치**: `src/domains/notification-management/frontend/components/`
- **설명**: Notification Management Domain에서 정의한 알림 UI 컴포넌트들
- **사용처**: Organization Management Domain의 사이드바에서 InboxPanel 사용
- **통합 방법**: 
  - InboxPanel의 `onInvitationRespond` prop으로 Organization의 `respondToInvitationAction` 전달
  - Notification Domain 컴포넌트를 import하여 사용
- **참조**: [Notification Management Domain Frontend Specification](../../notification-management-domain/07-frontend-specification.md)

##### MemberInvitationForm
- **위치**: `src/domains/organization-management/frontend/components/member-invitation-form.tsx`
- **역할**: 멤버 초대 폼 (설정 다이얼로그 내부)
- **기능**: 
  - 이메일 입력 시 자동 사용자 검색
  - 검색 결과 selector (이메일 아이템: 프로필 이미지, 이름, 이메일 표시)
  - 선택된 사용자를 배지 형태로 표시
  - 역할 선택 (관리자/멤버)
  - 초대 진행 중인 사용자는 회색으로 표시 (선택 불가)
- **사용 Hook**: useMemberManagement Hook 사용
- **UI**: shadcn/ui의 Form, Input, Select, Badge, Avatar, Item 컴포넌트 사용

##### SettingsDialog
- **위치**: `src/domains/organization-management/frontend/components/settings-dialog.tsx`
- **역할**: 설정을 위한 전체 화면 다이얼로그
- **기능**: 
  - 좌측 사이드바와 우측 콘텐츠 영역으로 구성
  - 좌측 사이드바: 설정 카테고리 네비게이션 (기본, 멤버, 프로필)
  - 우측 콘텐츠: 선택된 카테고리의 설정 내용
  - 멤버 초대는 "멤버" 카테고리에서 접근
  - 반응형 디자인 (모바일에서는 사이드바 숨김)
- **UI**: shadcn/ui의 Dialog, Sidebar 컴포넌트 사용

##### MemberList
- **위치**: `src/domains/organization-management/frontend/components/member-list.tsx`
- **역할**: 조직 멤버 목록 표시 컴포넌트
- **기능**: 
  - 현재 멤버 목록 표시 (프로필 이미지, 이름, 이메일, 역할)
  - 진행 중인 초대 목록 표시 (회색으로 표시)
  - 멤버 역할 표시 (소유자, 관리자, 멤버)
  - 가입 시간 표시
- **사용 Hook**: useMemberManagement Hook 사용
- **UI**: shadcn/ui의 Card, Avatar, Badge, Item 컴포넌트 사용

#### 미구현 컴포넌트들 (Story 006-007 이후)
- **OrganizationList**: 조직 목록 표시 컴포넌트
- **OrganizationEditForm**: 조직 편집 폼 컴포넌트
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
- **MemberManagementProvider**: 멤버 관리 관련 상태 관리를 위한 Provider (Phase 5 추가)
- **NotificationProvider**: 알림 관련 상태 관리 (Notification Management Domain에서 제공)
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
- [x] **CreateOrganizationRequest/Result**: 조직 생성용 DTO 추가 완료
- [x] **OrganizationMemberView**: 멤버 관리용 DTO 추가 완료 (Phase 5)
- [x] **UserNotificationView**: 알림 시스템용 DTO (Notification Management Domain에서 제공)
- [x] **InviteMemberRequest/RespondToInvitationRequest**: 초대 관련 DTO 추가 완료 (Phase 5)
- [ ] **복잡한 Read Models**: Story 006 이후 구현 예정

### 7.2 Context 구현 완료 확인
- [x] **도메인별 독립적인 Context**: OrganizationContext 구현 완료
- [x] **DTO 배열과 선택된 엔티티 상태 관리**: 완료
- [x] **쿠키 기반 영속성**: 선택된 조직 ID 쿠키 저장/복원 구현 완료
- [x] **초기 데이터 로드 로직**: Provider 마운트 시 자동 조회 구현 완료
- [x] **조직 생성 액션**: createOrganization 메서드 추가 완료
- [x] **NotificationContext**: 알림 시스템 Context (Notification Management Domain에서 제공)
- [x] **MemberManagementContext**: 멤버 관리 Context 추가 완료 (Phase 5)
- [ ] **사용자 Context**: 별도 사용자 정보 관리 Context 미구현

### 7.3 Server Actions 구현 완료 확인
- [x] **Supabase Auth 인증 확인**: 모든 액션에서 구현 완료 ✅
- [x] **의존성 주입 패턴**: Service Layer 사용 완료 ✅
  - OrganizationRepository, InvitationRepository, OrganizationMemberRepository
  - **NotificationService 주입** (Notification Management Domain 통합)
- [x] **Command 객체 활용**: 입력 구조화 완료 ✅
  - RequestMemberInvitationCommand에 **inviterName 추가**
- [x] **DTO 직렬화**: Service Layer에서 DTO 반환 완료 ✅
- [x] **revalidatePath**: 관련 페이지 재검증 완료 ✅
- [x] **조직 생성**: createNewOrganizationAction 구현 완료 ✅
- [x] **멤버 초대**: inviteMemberAction 구현 완료 ✅
  - NotificationService 주입, Profile에서 inviterName 조회
  - Service에서 이메일 검색 + Notification 생성
- [x] **멤버 목록 조회**: getOrganizationMembersAction 구현 완료 ✅
  - Layered Security: RLS → Application 권한 체크 → adminDb
- [x] **초대 응답**: respondToInvitationAction 구현 완료 ✅
  - OrganizationMemberRepository 주입
  - acceptInvitation: 멤버 자동 추가 (adminDb)
- [x] **알림 관련 액션**: Notification Management Domain Service 통합 ✅
- [ ] **조직 수정/삭제**: 조직 관리 액션 미구현 (Story 006)

### 7.4 Hook 구현 완료 확인
- [x] **Context 추상화**: useOrganization Hook 구현 완료
- [x] **비즈니스 로직 메서드**: 조직 관련 편의 함수들 구현 완료
- [x] **선택된 엔티티, 기본 엔티티 등 유틸리티**: 완료
- [x] **에러 상태 처리**: 적절히 처리 완료
- [x] **조직 생성 액션**: createOrganization 메서드 추가 완료
- [x] **useNotification Hook**: 알림 시스템 Hook (Notification Management Domain에서 제공)
- [x] **useMemberManagement Hook**: 멤버 관리 Hook 추가 완료 (Phase 5)
- [ ] **낙관적 업데이트**: useOptimistic 미사용, 직접 상태 관리
- [ ] **복잡한 액션**: 조직 수정, 삭제 등 미구현

### 7.5 컴포넌트 연동 완료 확인
- [x] **Hook 사용**: 컴포넌트에서 useOrganization Hook 사용 ✅
- [x] **Switcher 컴포넌트**: OrganizationSwitcher 드롭다운 구현 완료 ✅
- [x] **로딩 상태와 에러 상태 처리**: 적절히 처리 완료 ✅
- [x] **빈 상태 처리**: 포함 완료 ✅
- [x] **조직 생성 Dialog**: CreateOrganizationDialog 구현 완료 ✅
- [x] **폼 검증**: Zod 스키마 기반 검증 구현 완료 ✅
- [x] **알림 컴포넌트**: InboxPanel, NotificationItem 구현 완료 ✅
  - UI/UX 개선: 닫기 아이콘 중복 제거, 레이아웃 최적화
  - NotificationItem: Card → div, border-b 구분, 호버 액션 absolute
  - NEW 배지: 파란색 점 + 파란색 배지, 텍스트/버튼 크기 축소
- [x] **MemberInvitationForm**: 멤버 초대 폼 구현 완료 (Phase 5) ✅
  - Choice Card UI로 역할 선택
- [x] **SettingsDialog**: 설정 다이얼로그 구현 완료 (Phase 5) ✅
  - 너비 확장, 스크롤 개선, 멤버 목록 순서 조정
- [x] **MemberList**: 멤버 목록 컴포넌트 구현 완료 (Phase 5) ✅
  - 스크롤 영역, 소유자 표시
- [ ] **폼 컴포넌트**: OrganizationEditForm 미구현
- [ ] **목록 컴포넌트**: OrganizationList 미구현

### 7.6 앱 통합 완료 확인
- [x] **Provider 중첩 순서**: 적절한 순서로 배치 완료
- [x] **초기 데이터**: Server Components에서 전달 완료
- [x] **쿠키 기반 영속성**: 올바르게 작동 완료
- [x] **페이지별 Hook 사용**: 필요한 Hook만 선택적으로 사용 완료
- [x] **NotificationProvider**: 알림 시스템 Provider (Notification Management Domain에서 제공)
- [x] **MemberManagementProvider**: 멤버 관리 Provider 통합 완료 (Phase 5)
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

- **Software Design 문서**: `../domains/organization-management-domain/software-design.md` ✅
  - Aggregate, Command, Event 정의 확인 완료
  - 비즈니스 규칙 및 정책 참조 완료
  - Read Models 및 Context Map 확인 완료

- **Technical Specification 문서**: `../domains/organization-management-domain/technical-specification.md` ✅
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
├── domains/organization-management/
│   ├── shared/                     # 공유 도메인 객체들
│   │   ├── entities/               # Entity 클래스들
│   │   │   ├── organization.entity.ts
│   │   │   └── __tests__/
│   │   │       └── organization.test.ts (미구현)
│   │   ├── value-objects/          # Value Objects
│   │   │   ├── ids.vo.ts           (OrganizationId, InvitationId, NotificationId)
│   │   │   │                       (UserId는 user-management에서 re-export)
│   │   │   ├── member-role.vo.ts
│   │   │   └── __tests__/
│   │   │       └── (미구현)
│   │   ├── aggregates/             # Aggregate 클래스들
│   │   │   ├── organization.aggregate.ts
│   │   │   └── __tests__/
│   │   │       └── organization.aggregate.test.ts
│   │   ├── dtos/                   # DTO 타입들 (직렬화 가능)
│   │   │   └── index.ts
│   │   ├── commands/               # Command 인터페이스들
│   │   │   └── index.ts
│   │   ├── events/                 # Event 클래스들
│   │   │   └── index.ts
│   │   ├── errors/                 # 에러 타입
│   │   │   └── organization-management.error.ts
│   │   └── types/                  # 공통 타입들
│   │       └── index.ts
│   ├── backend/                    # 백엔드 레이어
│   │   ├── services/               # 서비스 클래스들
│   │   │   └── organization-management.service.ts
│   │   └── repositories/           # 리포지토리 구현체들
│   │       ├── interfaces/
│   │       │   └── organization.repository.interface.ts
│   │       ├── implementations/
│   │       │   └── drizzle-organization.repository.ts
│   │       └── __tests__/
│   │           ├── drizzle-organization.repository.test.ts
│   │           └── organization.repository.integration.test.ts
│   ├── actions/                    # Server Actions
│   │   └── organization-management.actions.ts
│   └── frontend/                   # 프론트엔드 레이어 ✨ (User Management에서 이동)
│       ├── contexts/               # React Context
│       │   └── organization-context.tsx
│       ├── hooks/                  # Custom Hooks
│       │   └── use-organization.ts
│       ├── components/             # UI 컴포넌트
│       │   ├── organization-switcher.tsx
│       │   ├── create-organization-dialog.tsx
│       │   ├── dashboard-sidebar.tsx
│       │   └── sidebar-components/
│       │       ├── org-workspaces-menu.tsx
│       │       ├── org-workspaces-skeleton.tsx
│       │       ├── sidebar-footer-settings.tsx
│       │       └── sidebar-header-group.tsx
│       └── utils/                  # 유틸리티 함수들
│           └── cookie-helpers.ts

│   # 주요 변경사항: User Management에서 Organization 관련 Frontend 레이어 완전히 이동
│   # UserId는 user-management domain에서 re-export하여 사용
```

### 8.4 현재 구현 상태 (08-code-conventions.md 기준)

#### 도메인 분리 현황 (v6.0)
- ✅ **User Management에서 완전히 분리**: Organization 관련 모든 로직 독립 관리
  - Frontend 레이어 (contexts, hooks, components, utils) 완전 이동 ✅
  - Backend 레이어 (repositories, services) 완전 독립 ✅
  - Value Objects (OrganizationId, InvitationId, NotificationId, MemberRole) ✅
  - UserId는 user-management에서 re-export하여 도메인 간 참조 ✅

#### Organization Management Domain 현재 상태
1. ✅ **DTO 직렬화**: Plain Object, ISO 문자열, Value Object 직렬화 완료
2. ✅ **React Context**: OrganizationContext, MemberManagementContext 구현 완료
3. ✅ **Server Actions**: 표준 패턴 준수, DTO 반환 완료
   - NotificationService 통합 (Service → Service 호출)
   - Profile 테이블에서 inviterName 조회
   - OrganizationMemberRepository 주입 (초대 승낙 시 멤버 추가)
4. ✅ **Custom Hook**: useOrganization, useMemberManagement Hook 구현 완료
5. ✅ **React Components**: OrganizationSwitcher, DashboardSidebar, SettingsDialog 구현 완료
6. ✅ **앱 통합**: Provider 설정, 쿠키 기반 영속성 완료
7. ✅ **조직 생성 Dialog**: CreateOrganizationDialog 구현 완료 (Phase 4)
8. ✅ **사이드바 컴포넌트들**: SidebarHeaderGroup, SidebarFooterSettings, OrgWorkspacesMenu 구현 완료
9. ✅ **멤버 초대 시스템**: Scenario 2 구현 완료 (Phase 5)
   - MemberInvitationForm: Choice Card UI, 이메일 검색, 역할 선택
   - MemberList: 멤버 목록, 소유자 표시, 스크롤 영역
   - Layered Security: Application-level 권한 체크 + adminDb
10. ✅ **알림 시스템**: InboxPanel, NotificationItem UI/UX 개선 완료
    - 닫기 아이콘 중복 제거, 레이아웃 최적화
    - Card → div + border-b, 배경색 최소화
    - NEW 배지: 파란색 점 + 파란색 배지
    - 호버 액션: absolute 배치, 텍스트/버튼 크기 축소
11. 📋 **Story 006**: 조직 수정/삭제 기능 구현 예정

#### User Management Domain 통합
- ✅ **기본 조직 생성**: User 등록 시 Organization Management의 `createDefaultOrganizationAction` 호출
- ✅ **UserId 참조**: `@/domains/user-management/shared/value-objects/ids.vo` 에서 re-export
- ✅ **도메인 간 경계**: 명확한 책임 분리 및 통합 포인트 정의

### 8.5 다음 단계 우선순위
1. **완료**: Phase 4 (조직 생성 Dialog) 구현 완료 ✅
2. **완료**: 사이드바 컴포넌트들 구현 완료 ✅
3. **완료**: 구글 OAuth 연동 및 로그인 UI 구현 완료 ✅
4. **완료**: Phase 5 (멤버 초대 및 수락 시스템) 구현 완료 ✅
   - Layered Security Model 적용
   - NotificationService 통합 (Service → Service)
   - 초대 승낙 시 멤버 자동 추가
   - InboxPanel UI/UX 개선
5. **완료**: Layered Security Model 적용 및 문서화 ✅
   - RLS 정책 최소화
   - Application-level 권한 체크
   - adminDb 사용 (시스템 레벨 작업)
6. **다음 스프린트**: Story 006 (조직 수정/삭제) 구현
7. **다음 스프린트**: 추가 도메인 연동 (Workspace Structure, Visual Canvas)

---

## 🎯 Scenario 2: 멤버 초대 및 수락 시스템 구현 상세

### 9.1 UI/UX 요구사항 구현

#### 인박스 시스템 ✅
- **위치**: 사이드바에 인박스 버튼, 클릭 시 우측 Sheet로 패널 표시
- **레이아웃**: 
  - Header: px-6 py-4 border-b (제목 + 읽지 않은 개수)
  - Content: flex-1 overflow-hidden (스크롤 영역)
  - 닫기 아이콘: Sheet 기본 버튼 사용 (중복 제거)
- **알림 아이템 UI/UX 개선**:
  - Card 제거 → Full-width div + border-b (깔끔한 구분)
  - 배경색 최소화: 읽지 않은 알림 bg-blue-50/30, 호버 bg-accent/50
  - NEW 배지: 파란색 점 + 파란색 배지 (bg-blue-500, text-white, text-[10px], h-4)
  - 호버 액션: absolute top-3 right-4 (읽기 처리 버튼, h-7 w-7)
  - 텍스트 크기: 제목 text-sm, 메시지 text-xs, 날짜 text-xs
  - 버튼 크기: 승낙/거절 h-7 text-xs px-3, 아이콘 h-3 w-3
- **기능**: 
  - 읽지 않은 알림 개수 배지 표시
  - 알림 타입별 다른 표시 (현재는 조직 초대 알림만)
  - 마우스 호버 시 우측 상단에 읽기 처리 버튼 표시
  - 초대 알림의 경우 승낙/거절 버튼 제공

#### 멤버 초대 시스템
- **접근 경로**: 사이드바 설정 → 설정 다이얼로그 → 멤버 초대 사이드바 메뉴
- **이메일 검색**: 이메일 입력 시 자동 사용자 검색 및 결과 selector 표시
- **사용자 선택**: 검색 결과에서 프로필 이미지, 이름, 이메일 표시 후 선택
- **배지 표시**: 선택된 사용자를 배지 형태로 인풋에 표시
- **역할 설정**: 카드 형식의 인풋으로 멤버 역할 선택 (관리자/멤버)
- **상태 표시**: 초대 진행 중인 사용자는 회색으로 표시 (선택 불가)

#### 설정 다이얼로그 구조
- **전체 화면**: 좌측 사이드바 + 우측 콘텐츠 영역
- **사이드바**: 설정 카테고리 네비게이션 (기본, 멤버, 프로필)
- **콘텐츠**: 선택된 카테고리에 따른 설정 폼
- **반응형**: 모바일에서는 사이드바 숨김

### 9.2 컴포넌트 상호작용 플로우

#### 멤버 초대 플로우 (Sequence 1)
1. **사이드바 설정 버튼 클릭** → SettingsDialog 열기
2. **"멤버" 카테고리 선택** → MemberInvitationForm 표시
3. **이메일 입력** → 자동 사용자 검색 → 검색 결과 selector 표시
4. **사용자 선택** → 배지 형태로 표시 → 역할 선택
5. **초대 요청** → Server Action 호출 → 성공 시 멤버 목록 갱신

#### 초대 수락/거절 플로우 (Sequence 2)
1. **인박스 버튼 클릭** → InboxPanel 표시
2. **초대 알림 확인** → 초대 정보 표시 (누구누구 님이 다음 조직에 초대함)
3. **승낙/거절 선택** → Server Action 호출 → 성공 시 알림 목록 갱신

### 9.3 상태 관리 패턴

#### Context 분리
- **OrganizationContext**: 조직 선택 및 기본 정보 관리 (Organization Management Domain)
- **MemberManagementContext**: 멤버 목록 및 초대 상태 관리 (Organization Management Domain)
- **NotificationContext**: 알림 목록 및 읽음 상태 관리 (Notification Management Domain)

#### Hook 사용 패턴
```typescript
// 멤버 초대 폼에서 (Organization Management Domain)
const { organizationMembers, inviteMember, searchUserByEmail } = useMemberManagement();

// 인박스 패널에서 (Notification Management Domain)
const { notifications, unreadCount } = useNotification();

// 설정 다이얼로그에서 (Organization Management Domain)
const { selectedOrganization } = useOrganization();

// 초대 응답 (Organization Management Domain의 액션을 Notification 컴포넌트에 전달)
const handleInvitationRespond = async (invitationId: string, accept: boolean) => {
  await respondToInvitationAction({ invitationId, accept });
};
```

### 9.4 에러 처리 및 사용자 피드백

#### 초대 실패 시나리오
- **권한 부족**: "멤버 초대 권한이 없습니다" 메시지
- **중복 초대**: "이미 초대된 사용자입니다" 메시지
- **이미 멤버**: "이미 조직 멤버입니다" 메시지

#### 알림 처리
- **실시간 업데이트**: 초대 생성 시 즉시 알림 목록 갱신
- **읽음 상태**: 알림 클릭 시 자동 읽음 처리
- **보관 처리**: 사용자가 명시적으로 보관 처리

### 9.5 성능 최적화

#### 검색 최적화
- **디바운싱**: 이메일 입력 시 300ms 디바운싱 적용
- **캐싱**: 검색 결과 임시 캐싱
- **제한**: 검색 결과 최대 10개로 제한

#### 상태 업데이트
- **낙관적 업데이트**: 초대 요청 시 즉시 UI 업데이트
- **에러 롤백**: 실패 시 이전 상태로 복원
- **백그라운드 동기화**: 성공 후 서버 상태와 동기화

---

이 Frontend Specification은 **Organization Management Domain**의 현재 구현 상태를 **08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션에 맞춰 정확히 반영한 문서입니다.
