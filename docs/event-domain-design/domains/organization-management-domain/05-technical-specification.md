# Organization Management Domain - Technical Specification

Software Design과 Testing Strategy를 기반으로 한 구체적인 구현 가이드입니다. (Scenario 0-6 기준)

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-10-14
**버전**: 11.0  
**리뷰어**: [시니어 개발자명]

### 주요 변경사항 (v11.0) - Service 분리 및 QueryService 패턴 적용
- **Service 레이어 리팩토링**: 단일 책임 원칙(SRP) 적용으로 Service 분리 ✅
  - OrganizationCrudService: 조직 생성, 조회, 업데이트 (CRUD)
    - 조직 생성 시 Default Workspace + 개인 워크스페이스 자동 생성
  - OrganizationInvitationService: 멤버 초대, 수락, 거절 처리
    - 초대 승낙 시 개인 워크스페이스 자동 생성 (새 멤버용)
  - OrganizationMemberService: 멤버 역할 변경, 제거 등 멤버십 관리
  - OrganizationQueryService: 도메인 간 조회 전용 서비스 (NEW)
- **개인 워크스페이스 시스템 도입**: 각 멤버 전용 작업 공간 제공 ✅
  - 조직 생성 시 소유자 개인 워크스페이스 자동 생성
  - 멤버 초대 승낙 시 해당 멤버 개인 워크스페이스 자동 생성
  - 다른 멤버 초대 불가, 개인 작업 공간으로 활용
- **QueryService 패턴 도입**: 도메인 경계 유지를 위한 조회 전용 API ✅
  - Repository 직접 노출 방지
  - 최소 권한 원칙: 읽기 전용 메서드만 제공
  - 사용처: Workspace Management Domain, Notification Management Domain
- **도메인 간 통합 개선**: Workspace Management Domain도 QueryService 패턴 적용 ✅
  - WorkspaceQueryService 생성으로 일관된 도메인 통합 패턴 확립
- **Notification 통합 개선**: NotificationService.markAsReadByRelatedId() 메서드 활용 ✅
  - 초대 승낙/거절 시 자동으로 관련 알림 읽음 처리

### 이전 변경사항 (v10.0) - User Management Domain 연동 강화
- **Scenario 0 추가**: 조직 조회 및 선택 (User Management Domain에서 이관) ✅
  - 유저 가입 완료 시 자동 트리거
  - 소유 조직 + 멤버 조직 통합 조회
  - 초기 조직 자동 선택 (쿠키 > 기본 조직 > 첫 번째 소유 조직)
  - 조직 컨텍스트 전환 및 쿠키 관리
- **도메인 책임 명확화**: 조직 관련 모든 기능을 Organization Management에서 통합 관리 ✅

### 이전 변경사항 (v9.0) - 멤버 역할 변경 시스템 구현 (Scenario 3)
- **계층적 역할 변경 권한 시스템**: 소유자/관리자별 역할 변경 권한 구분 ✅
  - 소유자: 모든 역할 변경 가능 (관리자 → 멤버 강등 포함)
  - 관리자: 멤버 → 관리자 승격만 가능, 다운그레이드 불가
  - 일반 멤버: 역할 변경 권한 없음
- **역할 변경 보호 규칙**: 소유자 역할 변경 방지, 자기 자신 역할 변경 방지 ✅
- **Layered Authorization**: 프론트엔드(UX) + 백엔드(보안) 이중 검증 ✅
- **새로운 Events**: RoleOptionSelectedEvent, MemberPromotedToAdminEvent, AdminDemotedToMemberEvent ✅
- **권한 캐시 무효화**: 역할 변경 후 즉시 권한 반영 ✅

### 이전 변경사항 (v8.0) - 조직 목록 조회 개선 (Scenario 0 기반)
- **멤버 조직 조회 지원**: 소유자 조직 + 멤버/관리자로 속한 조직 모두 표시 ✅
  - OrganizationMemberRepository: `findByUserId()` 메서드 추가
  - 사용자가 멤버로 속한 모든 조직의 멤버십 정보 조회 (RLS)
- **getUserOrganizations 개선**: 소유자 + 멤버 조직 통합 조회 ✅
  - 1단계: 소유자인 조직 조회 (role: 'owner')
  - 2단계: 멤버인 조직 조회 (role: 'admin' | 'member')
  - 중복 제거: Map 사용하여 소유자이면서 멤버인 경우 제거
  - 정렬: 소유자 조직 우선, 이후 참여 순서(joined_at) 정렬
- **역할 정보 정확성**: 각 조직에 대한 실제 역할 표시 ✅
  - 소유자 조직: role = 'owner'
  - 멤버 조직: role = organization_members 테이블의 실제 역할
- **초대 승낙 후 동기화**: 초대 승낙 시 조직 목록 자동 새로고침 ✅
  - SidebarHeaderGroup: accept 시 refreshOrganizations() 호출
  - 초대받은 조직이 즉시 조직 스위처에 표시됨

### 이전 변경사항 (v7.0) - Layered Security Model 적용 및 멤버 초대 시스템 완성
- **Layered Security Model 도입**: RLS 정책을 최소 권한으로 단순화, 복잡한 권한은 Application-level에서 처리 ✅
- **멤버 초대 시스템 완성**: 초대 생성, 알림 생성, 초대 승낙, 멤버 추가 전체 플로우 구현 ✅
- **Repository 개선**: 시스템 레벨 작업에 adminDb 사용으로 RLS 재귀 문제 해결 ✅
- **Frontend UI/UX 개선**: 인박스 패널 디자인 최적화, NEW 배지, 호버 액션 ✅
- **Notification 통합 개선**: markAsReadByRelatedId() 메서드로 초대 응답 시 자동 알림 읽음 처리 ✅

### 이전 변경사항 (v6.0) - User Management Domain에서 완전히 분리
- **도메인 분리 완료**: User Management에서 Organization 관련 모든 로직 이동 ✅
  - Frontend 레이어 (contexts, hooks, components, utils) 완전 이동 ✅
  - Backend 레이어 (repositories, services) 완전 독립 ✅
  - Value Objects, Entities, Aggregates 독립 관리 ✅
- **파일 구조 정리**: `apps/web/src/domains/organization-management/` 폴더 구조 완성 ✅
- **경로 참조 수정**: 모든 import 경로가 organization-management를 참조하도록 업데이트 ✅
- **UserId 참조**: User Management Domain에서 re-export하여 도메인 간 참조 ✅

### 이전 변경사항 (v5.0) - 멤버 초대 및 조직 관리 시스템 구현
- **Scenario 1-6 추가**: 조직 생성, 멤버 초대, 소유권 이전, 역할 변경, 멤버 제거, 조직 삭제 기능 구현 가이드 추가 ✅
- **OrganizationAggregate**: 조직 생성/관리, 멤버십 관리, 권한 관리 ✅
- **InvitationAggregate**: 초대 생성, 상태 관리, 승낙/거절 처리 ✅
- **Notification System**: Notification Management Domain 연동 (알림 생성 요청) ✅
- **멤버십 관리**: 조직 내 멤버 및 역할 관리 ✅
- **권한 기반 시스템**: 소유자/관리자/멤버 역할 기반 권한 관리 ✅
- **TDD 기반 설계**: Testing Strategy 기반 테스트 수도코드 포함 ✅

---

## 🎯 Implementation Overview

### 개발 우선순위 (Scenario 1-6) - 현재 진행 상황
1. **Phase 1**: 기본 조직 생성 및 관리 ✅
   - Organization Aggregate 구현 ✅
   - 기본 조직 자동 생성 ✅
   - 조직 목록 조회 및 선택 ✅

2. **Phase 2**: 새로운 조직 생성 기능 구현 ✅
   - OrganizationAggregate.createNew() 메서드 추가 ✅
   - 조직 타입 시스템 도입 (Drizzle ORM enum) ✅
   - **워크스페이스 자동 생성 시스템** ✅
     - Default Workspace 자동 생성 (조직 전체 협업 공간)
     - 개인 워크스페이스 자동 생성 (소유자 전용, 초대 불가)
   - 조직 생성 폼 UI 구현 ✅
   - 조직 생성 후 컨텍스트 전환 로직 ✅

3. **Phase 3**: 멤버 초대 및 수락 시스템 구현 ✅
   - InvitationAggregate 구현 (초대 생성, 상태 관리) ✅
   - Notification Management Domain 연동 (Service Layer에서 NotificationService 호출) ✅
   - Organization Aggregate 멤버 관리 기능 추가 ✅
   - 권한 기반 초대 시스템 (Application-level에서 Owner/Admin 체크) ✅
   - 초대 수락/거절 처리 및 멤버십 관리 (acceptInvitation에서 멤버 추가) ✅
   - **개인 워크스페이스 자동 생성** (초대 승낙 시) ✅
     - 새 멤버 전용 공간
     - 다른 멤버 초대 불가
   - Layered Security: RLS 최소화 + adminDb 사용 ✅

4. **Phase 4**: 조직 관리 시스템 구현 🚧
   - [x] **Service 레이어 분리** ✅
     - OrganizationCrudService, OrganizationInvitationService, OrganizationMemberService
     - 단일 책임 원칙 (SRP) 적용
   - [x] **QueryService 패턴 도입** ✅
     - OrganizationQueryService (도메인 간 조회 전용)
     - WorkspaceQueryService (도메인 간 조회 전용)
   - [x] **멤버 역할 변경 기능 (Scenario 3)** ✅
     - 계층적 권한 시스템 구현 (소유자/관리자 역할별 권한)
     - 두 단계 프로세스 (역할 옵션 선택 → 확인 다이얼로그)
     - 권한 캐시 무효화 로직
   - [ ] 소유권 이전 기능
   - [ ] 멤버 제거 기능
   - [ ] 조직 삭제 기능

### 선행조건 및 위험요소 - 현재 상태
- **Database 스키마**: organizations, invitations, organization_members, notifications 테이블 생성 완료 ✅
- **조직 타입 enum**: Drizzle ORM 스키마에 organization_type enum 추가 완료 ✅
- **멤버십 테이블**: organization_members 테이블 설계 및 생성 완료 ✅
- **알림 시스템**: Notification Management Domain 연동 완료 (Service Layer 통합) ✅
- **권한 시스템**: Layered Security Model 적용 (RLS + Application-level) ✅
- **프론트엔드 UI**: 조직 생성, 멤버 초대, 인박스 UI 구현 완료 ✅
- **RLS 최적화**: adminDb 사용으로 재귀 문제 해결 및 성능 최적화 완료 ✅

### 협업 포인트 - 현재 상태
- **User Management Domain**: UserId 참조 (re-export), 사용자 등록 시 기본 조직 생성 요청 수신 ✅
- **Workspace Management Domain**: Service Layer 통합 완료 ✅
  - OrganizationCrudService에 WorkspaceCrudService 주입
  - 조직 생성 시 WorkspaceCrudService.createDefaultWorkspace() 호출
  - 조직 생성 시 WorkspaceCrudService.createPersonalWorkspace() 호출 (소유자용)
  - 초대 승낙 시 WorkspaceCrudService.createPersonalWorkspace() 호출 (새 멤버용)
  - **QueryService 패턴**: WorkspaceInvitationService → OrganizationQueryService 사용
- **Notification Management Domain**: Service Layer 통합 완료 ✅
  - OrganizationInvitationService에 NotificationService 주입
  - inviteMember에서 NotificationService.createInvitationNotification() 호출
  - acceptInvitation/rejectInvitation에서 NotificationService.markAsReadByRelatedId() 호출
  - Action → Action 호출 제거, Service → Service 호출로 개선
- **도메인 간 통합**: 
  - User Management의 `processUserRegistrationAction` → Organization Management의 `createDefaultOrganizationAction` 호출 ✅
  - UserId를 user-management domain에서 re-export하여 참조 ✅
  - Organization Management Service → Workspace Management Service 통합 ✅
  - Organization Management Service → Notification Management Service 통합 ✅
  - **QueryService 패턴**: 도메인 간 Repository 직접 노출 방지 ✅
- **DB 스키마**: 모든 테이블 설계 및 마이그레이션 완료 ✅
- **UI/UX**: Frontend 레이어가 organization-management domain으로 완전 이동, UI/UX 개선 완료 ✅
- **남은 작업**: 소유권 이전, 멤버 제거, 조직 삭제 구현 (Phase 4)

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### OrganizationId Value Object
- **파일 위치**: `src/domains/organization-management/shared/value-objects/ids.vo.ts`
- **역할**: 조직 ID의 유효성을 검증하고 타입 안전성 제공
- **주요 기능**:
  - UUID 기반 ID 생성 및 검증
  - 다른 OrganizationId 객체와의 동등성 비교
- **에러 처리**: 유효하지 않은 ID 시 OrganizationManagementError 발생

#### InvitationId Value Object
- **파일 위치**: `src/domains/organization-management/shared/value-objects/ids.vo.ts`
- **역할**: 초대 ID의 유효성을 검증하고 타입 안전성 제공
- **주요 기능**:
  - UUID 기반 ID 생성 및 검증
  - 다른 InvitationId 객체와의 동등성 비교
- **에러 처리**: 유효하지 않은 ID 시 OrganizationManagementError 발생

#### UserId Value Object (User Management Domain에서 참조)
- **파일 위치**: `src/domains/user-management/shared/value-objects/ids.vo.ts` (원본)
- **Re-export**: `src/domains/organization-management/shared/value-objects/ids.vo.ts`에서 re-export
- **역할**: 사용자 ID 참조를 위한 도메인 간 연동
- **사용처**: Organization의 ownerId, Invitation의 inviterUserId/inviteeUserId 등

#### MemberRole Value Object
- **파일 위치**: `src/domains/organization-management/shared/value-objects/member-role.vo.ts`
- **역할**: 조직 내 멤버 역할의 유효성을 검증하고 권한 로직 캡슐화
- **주요 기능**:
  - 유효한 역할 검증 (owner, admin, member)
  - 역할 간 권한 비교 (canInviteMembers, canManageOrganization)
  - 다른 MemberRole 객체와의 동등성 비교
- **에러 처리**: 유효하지 않은 역할 시 OrganizationManagementError 발생

### 2. Entities 구현

#### Organization Entity
- **파일 위치**: `src/domains/organization-management/shared/entities/organization.entity.ts`
- **역할**: 조직 도메인 엔티티로 조직의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: OrganizationId Value Object로 조직 고유 식별자
  - name: 조직 이름 (문자열)
  - organizationType: OrganizationType enum으로 조직 타입
  - ownerId: UserId Value Object로 소유자 식별자
  - isDefault: 기본 조직 여부 (boolean)
  - createdAt: 생성 시각 (불변)
  - updatedAt: 수정 시각 (변경 가능)
- **주요 메서드**:
  - updateName(): 조직 이름 업데이트
  - addMember(): 새 멤버 추가
  - removeMember(): 멤버 제거
  - changeMemberRole(): 멤버 역할 변경
  - transferOwnership(): 소유권 이전
  - delete(): 조직 삭제
- **비즈니스 규칙**: 조직 이름 변경 시 updatedAt 자동 갱신, 소유자 최소 1명 유지

#### Invitation Entity
- **파일 위치**: `src/domains/organization-management/shared/entities/invitation.entity.ts`
- **역할**: 초대 도메인 엔티티로 초대의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: InvitationId Value Object로 초대 고유 식별자
  - organizationId: OrganizationId Value Object로 조직 식별자
  - inviterUserId: UserId Value Object로 초대한 사용자 식별자
  - inviteeEmail: UserEmail Value Object로 초대받은 사용자 이메일
  - inviteeUserId: UserId Value Object로 초대받은 사용자 식별자 (선택적)
  - role: MemberRole Value Object로 부여할 역할
  - status: InvitationStatus enum으로 초대 상태
  - createdAt: 생성 시각 (불변)
  - respondedAt: 응답 시각 (선택적)
- **주요 메서드**:
  - accept(): 초대 승낙 처리
  - reject(): 초대 거절 처리
  - expire(): 초대 만료 처리
- **비즈니스 규칙**: 초대 응답 시 respondedAt 자동 갱신, 상태 변경 검증

### 3. Aggregates 구현

#### OrganizationAggregate
- **파일 위치**: `src/domains/organization-management/shared/aggregates/organization.aggregate.ts`
- **역할**: 조직 관련 도메인 로직과 조직 생명주기를 담당
- **주요 기능**:
  - 기본 조직 생성 로직 (사용자 등록 시 자동 생성)
  - 새로운 조직 생성 로직 (사용자가 직접 생성)
  - 멤버 관리 (추가, 제거, 역할 변경)
  - 소유권 이전 처리
  - 조직 삭제 처리
- **주요 메서드**:
  - createDefault(): 사용자를 위한 기본 조직 생성
  - createNew(): 사용자가 새로운 조직 생성
  - addMember(): 새 멤버를 조직에 추가
  - removeMember(): 멤버를 조직에서 제거
  - changeMemberRole(): 멤버 역할 변경
  - transferOwnership(): 소유권 이전
  - delete(): 조직 삭제
- **비즈니스 로직**: 
  - 조직 생성자는 자동으로 소유자(Owner) 권한을 가짐
  - 멤버 추가 시 중복 멤버 방지 및 역할 유효성 검증
  - 조직 소유자는 최소 1명 이상 유지되어야 함
  - 소유권 이전 시 기존 소유자는 Admin으로 변경됨

#### InvitationAggregate
- **파일 위치**: `src/domains/organization-management/shared/aggregates/invitation.aggregate.ts`
- **역할**: 초대 관련 도메인 로직과 초대 상태 관리를 담당
- **주요 기능**:
  - 초대 이메일 선택 및 유효성 검증
  - 멤버 초대 요청 처리
  - 초대 승낙/거절 처리
  - 초대 상태 추적 및 관리
- **주요 메서드**:
  - selectInvitationEmail(): 초대할 이메일 선택 및 검증
  - requestMemberInvitation(): 멤버 초대 요청 처리
  - acceptInvitation(): 초대 승낙 처리
  - rejectInvitation(): 초대 거절 처리
- **비즈니스 로직**: 
  - 중복 초대 방지 (동일 이메일에 대한 pending 초대 확인)
  - 이미 조직 멤버인 사용자 초대 방지
  - 초대 권한 검증 (소유자/관리자만 초대 가능)
  - 초대 상태 변경 규칙 적용 (pending → accepted/rejected)

#### Notification System (External - Notification Management Domain)
- **참조**: Notification Management Domain에서 제공
- **연동 방법**: 도메인 간 커맨드 실행을 통한 알림 생성/조회/수정 요청
- **주요 기능**:
  - 초대 알림 생성 요청
  - 알림 읽음 처리 요청
  - 사용자 알림 목록 조회 요청

### 4. Commands & Events 구현

#### Commands
- **파일 위치**: `src/domains/organization-management/shared/commands/index.ts`
- **역할**: 도메인 서비스에 전달되는 명령 객체들을 정의
- **주요 Commands**:
  - CreateDefaultOrganizationCommand: 기본 조직 생성 명령 (사용자 등록 시 자동 실행)
  - CreateNewOrganizationCommand: 새로운 조직 생성 명령 (사용자가 직접 생성)
  - GetUserOrganizationsCommand: 사용자 소유 조직 목록 조회 명령
  - SelectInvitationEmailCommand: 초대할 이메일 선택 명령
  - RequestMemberInvitationCommand: 멤버 초대 요청 명령
  - AcceptInvitationCommand: 초대 승낙 명령
  - RejectInvitationCommand: 초대 거절 명령
  - ChangeMemberRoleCommand: 멤버 역할 변경 명령
  - RemoveMemberCommand: 멤버 제거 명령
  - TransferOwnershipCommand: 소유권 이전 명령
  - DeleteOrganizationCommand: 조직 삭제 명령
- **특징**: 모든 Command는 필요한 최소한의 데이터만 포함하여 타입 안전성 확보

#### Events
- **파일 위치**: `src/domains/organization-management/shared/events/index.ts`
- **역할**: 도메인에서 발생하는 이벤트들을 정의하여 시스템 간 통신 지원
- **주요 Events**:
  - DefaultOrganizationCreatedEvent: 기본 조직 생성 완료 이벤트
  - NewOrganizationCreatedEvent: 새로운 조직 생성 완료 이벤트
  - OrganizationUpdatedEvent: 조직 정보 업데이트 이벤트
  - InvitationEmailSelectedEvent: 초대할 이메일 선택 완료 이벤트
  - MemberInvitationRequestedEvent: 멤버 초대 요청 완료 이벤트
  - InvitationAcceptedEvent: 초대 승낙 완료 이벤트
  - InvitationRejectedEvent: 초대 거절 완료 이벤트
  - NewMemberAddedToOrganizationEvent: 새 멤버 조직 추가 완료 이벤트
  - RoleOptionSelectedEvent: 역할 옵션 선택 완료 이벤트 (프론트엔드) - Scenario 3
  - MemberPromotedToAdminEvent: 멤버가 관리자로 승격 완료 이벤트 - Scenario 3
  - AdminDemotedToMemberEvent: 관리자가 멤버로 강등 완료 이벤트 - Scenario 3
  - MemberRemovedFromOrganizationEvent: 멤버 제거 완료 이벤트
  - OrganizationOwnershipTransferredEvent: 소유권 이전 완료 이벤트
  - OrganizationDeletedEvent: 조직 삭제 완료 이벤트
- **특징**: 모든 이벤트는 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

### 5. Error Types 구현

#### OrganizationManagementError 클래스
- **파일 위치**: `src/domains/organization-management/shared/errors/organization-management.error.ts`
- **역할**: 조직 관리 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 (OrganizationManagementErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

#### OrganizationManagementErrorCode 타입
- **역할**: 조직 관리 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - ORGANIZATION_NOT_FOUND: 조직을 찾을 수 없을 때
  - ORGANIZATION_NAME_DUPLICATE: 조직 이름이 중복될 때
  - INVALID_ORGANIZATION_ID: 유효하지 않은 조직 ID일 때
  - INVALID_ORGANIZATION_TYPE: 유효하지 않은 조직 타입일 때
  - INVALID_INVITATION_ID: 유효하지 않은 초대 ID일 때
  - INVALID_MEMBER_ROLE: 유효하지 않은 멤버 역할일 때
  - INVITATION_NOT_FOUND: 초대를 찾을 수 없을 때
  - INVITATION_ALREADY_EXISTS: 이미 존재하는 초대일 때
  - INVITATION_EXPIRED: 만료된 초대일 때
  - INVITATION_ALREADY_RESPONDED: 이미 응답한 초대일 때
  - MEMBER_ALREADY_EXISTS: 이미 조직 멤버인 사용자일 때
  - INSUFFICIENT_PERMISSIONS: 권한이 부족할 때
  - ORGANIZATION_CREATION_FAILED: 조직 생성 실패 시
  - ORGANIZATION_RETRIEVAL_FAILED: 조직 조회 실패 시
  - INVITATION_CREATION_FAILED: 초대 생성 실패 시
  - MEMBER_MANAGEMENT_FAILED: 멤버 관리 실패 시
  - OWNERSHIP_TRANSFER_FAILED: 소유권 이전 실패 시
  - ORGANIZATION_DELETION_FAILED: 조직 삭제 실패 시

#### 에러 메시지 매핑
- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 한국어 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

## 🔧 Service & Repository 구현

### 1. Service 레이어 (v11.0 개선: 단일 책임 원칙 적용)

Organization Management Domain의 Service는 **단일 책임 원칙(SRP)**에 따라 4개의 Service로 분리되었습니다:

#### 1. OrganizationCrudService (CRUD 작업)
- **파일 위치**: `src/domains/organization-management/backend/services/organization-crud.service.ts`
- **역할**: 조직 생성, 조회, 업데이트 관리
- **주요 의존성**: OrganizationRepository, OrganizationMemberRepository, WorkspaceCrudService
- **주요 메서드**:
  - **createDefaultOrganization()**: 사용자 등록 시 기본 조직 자동 생성
    - Workspace Management Domain에 워크스페이스 생성 요청 (WorkspaceCrudService)
      - Default Workspace 생성 (조직 전체 협업 공간)
      - 개인 워크스페이스 생성 (소유자 전용 공간)
    - 생성된 워크스페이스 및 페이지 정보 반환
  - **createOrganization()**: 사용자가 새로운 조직 생성
    - Workspace Management Domain에 워크스페이스 생성 요청
      - Default Workspace 생성 (조직 전체 협업 공간)
      - 개인 워크스페이스 생성 (소유자 전용 공간)
    - 조직 생성 후 자동으로 컨텍스트 전환
  - **getUserOrganizations()**: 사용자 조직 목록 조회 (소유자 + 멤버) ✅ v8.0
    - 소유자인 조직 조회 (OrganizationRepository.findByOwnerId)
    - 멤버인 조직 조회 (OrganizationMemberRepository.findByUserId)
    - Map을 사용한 중복 제거 (소유자이면서 멤버인 경우)
    - 정렬: 소유자 조직 우선 → 참여일(joined_at) 오름차순
    - 각 조직의 정확한 역할 정보 포함

#### 2. OrganizationInvitationService (초대 관리)
- **파일 위치**: `src/domains/organization-management/backend/services/organization-invitation.service.ts`
- **역할**: 멤버 초대, 수락, 거절 처리
- **주요 의존성**: InvitationRepository, OrganizationRepository, OrganizationMemberRepository, NotificationService, WorkspaceCrudService
- **주요 메서드**:
  - **inviteMember()**: 멤버 초대 처리
    - Application-level 권한 검증 (소유자/관리자만 가능)
    - 사용자 검색 및 inviteeUserId 저장
    - 중복 초대 및 기존 멤버 검증
    - Notification Management Domain에 알림 생성 요청 (NotificationService)
  - **acceptInvitation()**: 초대 승낙 처리
    - 초대 유효성 검증
    - organization_members 테이블에 멤버 추가 (adminDb)
    - **Workspace Management Domain에 개인 워크스페이스 생성 요청** (새 멤버용)
      - 해당 멤버만 접근 가능
      - 다른 멤버 초대 불가
    - 초대 상태를 'accepted'로 업데이트
    - NotificationService.markAsReadByRelatedId() 호출하여 알림 읽음 처리 ✅ v11.0
  - **rejectInvitation()**: 초대 거절 처리
    - 초대 상태를 'rejected'로 업데이트
    - NotificationService.markAsReadByRelatedId() 호출하여 알림 읽음 처리 ✅ v11.0

#### 3. OrganizationMemberService (멤버 관리)
- **파일 위치**: `src/domains/organization-management/backend/services/organization-member.service.ts`
- **역할**: 멤버 역할 변경, 제거 등 멤버십 관리
- **주요 의존성**: OrganizationMemberRepository, OrganizationRepository
- **주요 메서드**:
  - **changeMemberRole()**: 멤버 역할 변경 (Scenario 3) ✅
    - **Step 1**: 현재 사용자 권한 확인 (소유자/관리자만 가능)
    - **Step 2**: 대상 멤버 역할 조회 및 검증
    - **Step 3**: 계층적 권한 시스템 검증
      - 소유자: 모든 역할 변경 가능 (관리자 → 멤버 강등 포함)
      - 관리자: 멤버 → 관리자 승격만 가능, 다운그레이드 불가
      - 일반 멤버: 역할 변경 권한 없음
    - **Step 4**: 소유자 역할 변경 방지 (소유권 이전을 통해서만 변경)
    - **Step 5**: 현재 역할과 동일한 역할로 변경 방지
    - **Step 6**: adminDb로 역할 업데이트 (organization_members 테이블)
    - **Step 7**: 권한 캐시 무효화 (즉시 권한 반영)
    - **Events**: MemberPromotedToAdminEvent 또는 AdminDemotedToMemberEvent 발행
  - **removeMember()**: 멤버 제거 (예정)
  - **transferOwnership()**: 소유권 이전 (예정)
  - **deleteOrganization()**: 조직 삭제 (예정)

#### 4. OrganizationQueryService (조회 전용 - 도메인 간 통합) ✅ v11.0 NEW
- **파일 위치**: `src/domains/organization-management/backend/services/organization-query.service.ts`
- **역할**: 다른 도메인에서 Organization 정보를 안전하게 조회
- **주요 의존성**: OrganizationRepository, OrganizationMemberRepository
- **핵심 원칙**:
  - Repository를 직접 노출하지 않고 Service를 통해 도메인 경계 유지
  - 최소 권한 원칙: 읽기 전용 API만 노출
  - 타입 안전성: Result 패턴을 통한 일관된 에러 처리
- **주요 메서드**:
  - **isMember()**: 조직 멤버 여부 확인
    - 사용처: Workspace Invitation Service에서 조직 멤버 확인
  - **getMemberRole()**: 멤버 역할 조회
    - 사용처: Workspace Invitation Service에서 권한 확인
  - **getOrganizationName()**: 조직 이름 조회
    - 사용처: Workspace Invitation Service에서 알림 메시지 생성
  - **searchUserByEmail()**: 이메일로 사용자 검색
    - 사용처: Workspace Invitation Service에서 초대 대상 검색
    - 특징: profileImageUrl을 undefined에서 null로 변환하여 타입 일치 보장
- **사용 도메인**:
  - Workspace Management Domain (WorkspaceInvitationService)
  - Notification Management Domain (알림 생성 시 조직 정보 조회)

#### Service 분리의 장점
- **단일 책임 원칙(SRP)**: 각 Service가 하나의 명확한 책임을 가짐
- **유지보수성**: 코드 변경 시 영향 범위가 명확
- **테스트 용이성**: 각 Service를 독립적으로 테스트 가능
- **도메인 경계 유지**: QueryService 패턴으로 Repository 직접 노출 방지
- **재사용성**: 다른 도메인에서 QueryService를 통해 안전하게 정보 조회
- **비즈니스 로직 (Service별로 분리)**: 
  - **OrganizationCrudService**:
    - 새로운 조직 생성 시 조직 이름 중복 검사 및 조직 타입 검증
    - 조직 생성 시 Workspace Management Domain에 워크스페이스 생성 요청 (WorkspaceCrudService)
      - **Default Workspace 자동 생성** (조직 전체 협업 공간)
      - **개인 워크스페이스 자동 생성** (소유자 전용 공간, 초대 불가)
    - **조직 목록 조회 시 소유자 + 멤버 조직 통합** ✅ v8.0
      - 소유자 조직과 멤버 조직을 모두 조회하여 통합
      - 중복 제거: 소유자이면서 멤버인 경우 소유자 역할 우선
      - 정렬 로직: 소유자 조직 우선, 이후 joined_at 오름차순
  - **OrganizationInvitationService**:
    - 멤버 초대 시 권한 검증 (Application-level: Owner/Admin 체크) 및 중복 초대 방지
    - 초대 시 이메일로 사용자 검색하여 inviteeUserId 저장 (가입된 사용자만 알림 생성)
    - 초대 승낙 시 organization_members 테이블에 멤버 추가 (adminDb 사용)
    - **초대 승낙 시 개인 워크스페이스 자동 생성** (새 멤버 전용, 초대 불가)
    - Notification 생성/읽음 처리를 Service Layer에서 처리 (NotificationService 호출) ✅ v11.0
  - **OrganizationMemberService**:
    - **멤버 역할 변경 시 계층적 권한 시스템 적용 (Scenario 3)** ✅
      - 소유자: 모든 역할 변경 가능 (관리자 강등 포함)
      - 관리자: 멤버 승격만 가능, 관리자 강등 불가
      - 소유자 역할 변경 방지, 자기 자신 역할 변경 방지
      - adminDb 사용하여 역할 업데이트, 권한 캐시 무효화
    - 소유권 이전 시 기존 소유자 권한 변경 및 새 소유자 설정 (예정)
  - **OrganizationQueryService** ✅ v11.0:
    - Repository 직접 노출 방지로 도메인 경계 유지
    - Result 패턴을 통한 일관된 에러 처리
    - profileImageUrl 타입 변환 (undefined → null)

### 2. Repository 레이어 (Drizzle ORM + RLS)

#### OrganizationRepository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/organization-management/backend/repositories/interfaces/organization.repository.interface.ts`
- **구현체 위치**: `src/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository.ts`
- **역할**: 조직 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - 조직 ID로 조직 조회 (findById)
  - 소유자 ID로 조직 목록 조회 (findByOwnerId)
  - 조직 저장 및 업데이트 (save)
  - 조직 삭제 (delete)
- **특징**: Drizzle ORM과 Supabase RLS를 활용하여 타입 안전하고 보안적인 데이터 접근 제공
- **정렬**: 생성일 기준 오름차순으로 조직 목록 정렬
- **RLS 지원**: Supabase Row Level Security를 통해 소유자별 조직 데이터 격리 보장

#### InvitationRepository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/organization-management/backend/repositories/interfaces/invitation.repository.interface.ts`
- **구현체 위치**: `src/domains/organization-management/backend/repositories/implementations/drizzle-invitation.repository.ts`
- **역할**: 초대 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - 초대 ID로 초대 조회 (findById - RLS 사용)
  - 조직별 초대 목록 조회 (findByOrganizationId - RLS 사용)
  - 이메일별 초대 조회 (findByEmail - RLS 사용)
  - 초대 저장 및 업데이트 (save - **adminDb 사용**) ✅
  - 사용자별 받은 초대 목록 조회 (findByInviteeUserId - RLS 사용)
  - 초대 삭제 (delete - **adminDb 사용**) ✅
- **특징**: Drizzle ORM과 Layered Security Model을 활용
- **Layered Security**: 
  - READ: RLS 사용 (초대자와 초대받은 사용자만 조회)
  - WRITE: **adminDb 사용** (Service에서 권한 체크 완료 후 호출)

#### OrganizationMemberRepository 인터페이스 및 구현체 ✅
- **인터페이스 위치**: `src/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface.ts`
- **구현체 위치**: `src/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository.ts`
- **역할**: 조직 멤버십 데이터의 영속성 및 조회를 담당
- **주요 기능**:
  - 멤버 추가 (addMember - **adminDb 사용**) ✅
  - 멤버 제거 (removeMember - **adminDb 사용**) ✅
  - 멤버 역할 변경 (updateMemberRole - **adminDb 사용**) ✅
  - 조직별 멤버 조회 (findByOrganizationId - RLS 사용) ✅
  - **사용자별 멤버십 조회 (findByUserId - RLS 사용)** ✅ v8.0 NEW
    - 사용자가 속한 모든 조직의 멤버십 정보 조회
    - 조직 ID, 역할, 참여일 반환
    - 조직 목록 조회에 사용 (getUserOrganizations)
  - 멤버 역할 조회 (findMemberRole - RLS 사용)
  - 멤버 여부 확인 (isMember - RLS 사용)
  - 조직 멤버 뷰 조회 (getOrganizationMemberView - **Layered Security**) ✅
    - Step 1: RLS로 자기 membership 확인
    - Step 2: Application-level 권한 체크 (Owner/Admin)
    - Step 3: **adminDb로 전체 멤버 조회** (RLS 우회)
  - 사용자 프로필 검색 (searchUserProfileByEmail - RLS 사용)
- **Layered Security**: 
  - READ (self): RLS 사용
  - READ (all members): Application-level 권한 체크 → adminDb 사용
  - WRITE: adminDb 사용 (Service에서 권한 체크 완료)

### 3. Read Models 구현

#### OrganizationMemberView
- **파일 위치**: `src/domains/organization-management/backend/read-models/organization-member.view.ts`
- **역할**: 조직 멤버 관리를 위한 통합 정보를 제공하는 Read Model
- **주요 데이터**:
  - organizationId: 조직 식별자
  - currentMembers: 현재 조직 멤버 목록 (프로필 이미지, 이름, 이메일, 역할)
  - pendingInvitations: 진행 중인 초대 목록 (이메일, 역할, 초대일)
  - userRole: 현재 사용자의 조직 내 역할
- **특징**: 멤버 초대 폼 표시와 조직 멤버 목록 조회에 최적화
- **권한 처리**: 사용자 역할에 따른 데이터 필터링 적용

#### UserNotificationView (Notification Management Domain에서 제공)
- **참조**: Notification Management Domain에서 정의한 Read Model
- **사용처**: 인박스 버튼 클릭 시 알림 표시
- **연동 방법**: Notification Management Domain의 Server Action 호출

## 🌐 Server Actions & Testing Strategy

### 1. Server Actions (실제 구현)

#### OrganizationManagement Actions
- **파일 위치**: `src/domains/organization-management/actions/organization-management.actions.ts`
- **역할**: Next.js Server Actions를 통해 클라이언트에서 호출 가능한 서버 함수들 제공
- **주요 Actions**:
  - createNewOrganizationAction(): 새로운 조직 생성 (사용자가 직접 생성)
  - **getUserOrganizationsAction(): 사용자 조직 목록 조회 (소유자 + 멤버)** ✅ v8.0 개선
    - OrganizationMemberRepository 주입 (멤버 조직 조회용)
    - 소유자 조직 + 멤버 조직 통합 조회
    - 정렬: 소유자 조직 우선 → 참여일 오름차순
    - 각 조직의 정확한 역할 정보 포함
  - inviteMemberAction(): 멤버 초대 처리 (권한 검증 포함, Notification Domain 연동)
  - getOrganizationMembersAction(): 조직 멤버 목록 조회
  - respondToInvitationAction(): 초대 응답 처리 (승낙/거절, Notification Domain 연동)
  - **changeMemberRoleAction(): 멤버 역할 변경 (Scenario 3)** ✅
    - 입력: organizationId, targetUserId, newRole
    - 인증: 현재 사용자 확인 (Supabase Auth)
    - 권한 검증: Service.changeMemberRole()에서 계층적 권한 시스템 검증
    - 응답: Result<MemberPromotedToAdminEvent | AdminDemotedToMemberEvent>
    - 에러: INSUFFICIENT_PERMISSIONS, INVALID_MEMBER_ROLE, MEMBER_MANAGEMENT_FAILED
  - removeMemberAction(): 멤버 제거
  - transferOwnershipAction(): 소유권 이전
  - deleteOrganizationAction(): 조직 삭제
- **인증 처리**: 모든 Action에서 Supabase Auth를 통한 사용자 인증 확인
- **권한 처리**: 멤버 초대, 조직 관리 등에서 역할 기반 권한 검증
- **에러 처리**: Result 패턴을 통한 일관된 에러 처리 및 사용자 친화적 메시지 제공
- **트랜잭션**: 멤버 초대 승낙, 소유권 이전 등에서 Drizzle 트랜잭션을 사용하여 원자성 보장

### 2. Testing Strategy (TDD 기반)

#### Unit Tests
- **Value Objects 테스트**: OrganizationId, InvitationId, MemberRole VO 검증
- **Entities 테스트**: Organization, Invitation Entity 비즈니스 로직 검증
- **Aggregates 테스트**: OrganizationAggregate, InvitationAggregate 핵심 로직 검증

#### Integration Tests
- **Repository 테스트**: Drizzle ORM 기반 데이터 영속성 검증
- **Service 테스트**: OrganizationManagementService 비즈니스 로직 검증
- **Server Actions 테스트**: 전체 플로우 검증

#### E2E Tests
- **조직 생성 플로우**: 새로운 조직 생성 전체 시나리오
- **멤버 초대 플로우**: 멤버 초대 및 수락/거절 전체 시나리오
- **조직 관리 플로우**: 소유권 이전, 역할 변경, 멤버 제거, 조직 삭제 시나리오

### 3. 검증 체크리스트

#### Scenario 1-6 지원 - 현재 구현 상태
- [x] **조직 생성**: 새로운 조직 생성 및 관리 ✅
  - Default Workspace 자동 생성 (조직 전체 협업 공간)
  - 개인 워크스페이스 자동 생성 (소유자 전용 공간, 초대 불가)
- [x] **조직 타입 시스템**: Drizzle ORM enum 기반 조직 타입 관리 ✅
- [x] **멤버 초대**: Application-level 권한 체크 + NotificationService 통합 ✅
  - inviteMember: 이메일 검색, inviteeUserId 저장, Notification 생성
  - Service Layer에서 NotificationService 호출 (Action → Action 제거)
- [x] **초대 수락/거절**: 초대 응답 처리 + 멤버 추가 + 개인 워크스페이스 생성 ✅
  - acceptInvitation: organization_members에 멤버 추가 (adminDb)
  - **개인 워크스페이스 자동 생성** (새 멤버 전용, 초대 불가)
  - rejectInvitation: 초대 거절 처리
- [x] **알림 시스템**: Notification Management Domain Service Layer 통합 ✅
  - NotificationService를 OrganizationInvitationService에 주입
  - inviteMember에서 자동으로 알림 생성 (가입된 사용자만)
  - acceptInvitation/rejectInvitation에서 알림 읽음 처리
- [x] **멤버십 관리**: Layered Security Model 적용 ✅
  - Application-level: Service에서 Owner/Admin 권한 체크
  - Repository: adminDb 사용 (addMember, removeMember, updateMemberRole)
  - RLS: 최소 권한 (self only)
- [x] **멤버 역할 변경 (Scenario 3)**: 계층적 권한 시스템 구현 완료 ✅
  - 소유자: 모든 역할 변경 가능 (관리자 강등 포함)
  - 관리자: 멤버 승격만 가능, 관리자 강등 불가
  - 소유자 역할 변경 방지, 자기 자신 역할 변경 방지
  - adminDb 사용하여 역할 업데이트
  - 권한 캐시 무효화 (즉시 권한 반영)
- [x] **워크스페이스 종류 시스템**: Default, 일반, 개인 워크스페이스 구분 ✅
  - Default Workspace: 모든 멤버 접근, 초대 가능
  - 일반 워크스페이스: 선택적 초대 가능
  - 개인 워크스페이스: 소유자만 접근, 초대 불가
- [ ] **소유권 이전**: 조직 소유권 이전 기능 (Phase 4 예정)
- [ ] **조직 삭제**: 조직 삭제 및 관련 데이터 정리 (Phase 4 예정)

#### 설계 일관성
- [x] 모든 Command에 입력 검증 로직이 정의되어 있는가? ✅
- [x] Repository가 반환하는 Entity의 불변식이 깨지지 않는가? ✅
- [x] Read Model이 Scenario 1-6 요구사항을 충족하는가? ✅
- [x] OrganizationAggregate, InvitationAggregate가 올바르게 설계되었는가? ✅
- [x] 멤버 초대 프로세스의 불변식이 올바르게 정의되었는가? ✅
- [x] Notification Management Domain과의 통합이 적절히 설계되었는가? ✅
- [x] Cross-Aggregate 이벤트가 적절히 설계되었는가? ✅

#### 보안 및 성능
- [x] **Layered Security Model 적용**: RLS + Application-level 이중 보안 ✅
  - RLS Layer: 최소 권한 (self only, owner only) - Defense in Depth
  - Application Layer: 복잡한 권한 로직 (Owner/Admin 체크) - Primary Authorization
  - adminDb 사용: 시스템 레벨 작업 (권한 체크 완료 후)
- [x] **사용자 권한 검증**: Service Layer에서 모든 작업 전 권한 체크 ✅
  - inviteMember: Owner/Admin 권한 확인 (Application-level)
  - getOrganizationMemberView: Owner/Admin만 전체 멤버 조회
- [x] **민감한 정보 보호**: RLS + adminDb 조합으로 보안 강화 ✅
- [x] **RLS 재귀 문제 해결**: adminDb 사용으로 무한 루프 방지 ✅
- [x] **성능 최적화**: adminDb 사용으로 복잡한 RLS 쿼리 제거 ✅

#### 테스트 커버리지
- [x] 모든 Aggregate의 핵심 비즈니스 로직이 테스트되는가? ✅
- [x] Happy path와 edge case가 모두 다뤄지는가? ✅
- [x] TDD 기반 테스트 수도코드가 모든 컴포넌트에 정의되어 있는가? ✅
- [x] Given-When-Then 패턴이 일관되게 적용되었는가? ✅
- [x] 멤버 초대 시 권한 검증이 테스트되는가? ✅
- [x] 초대 수락/거절 시 모든 경우의 수가 테스트되는가? ✅
- [x] 중복 초대 방지 로직이 테스트되는가? ✅
- [x] Notification Management Domain 연동이 테스트되는가? ✅

#### 기술 스택 구현 상태
- [x] **Drizzle ORM**: Supabase 클라이언트 대신 Drizzle ORM 사용 ✅
- [x] **Layered Security**: RLS + adminDb 조합으로 이중 보안 구현 ✅
  - db.rls(): 사용자 데이터 조회 (self only)
  - db.admin: 시스템 레벨 작업 (Service에서 권한 체크 완료)
- [x] **타입 안전성**: Drizzle 스키마 기반 타입 안전성 확보 ✅
- [x] **Repository 패턴**: Organization, Invitation, OrganizationMember Repository 구현 완료 ✅
- [x] **Server Actions**: Next.js Server Actions 기반 구현 완료 ✅
- [x] **권한 기반 시스템**: Application-level 권한 검증 (Service Layer) ✅
- [x] **도메인 통합**: Notification Management Domain Service 통합 완료 ✅
  - OrganizationManagementService → NotificationService 호출
  - Profile 테이블에서 inviterName 조회

---

## 🚀 TDD 구현 순서

### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. **OrganizationId, InvitationId VO**
2. **MemberRole VO**

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. **Organization Entity**
2. **Invitation Entity**

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. **OrganizationAggregate**
2. **InvitationAggregate**

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. **OrganizationRepository**
2. **InvitationRepository**

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. **OrganizationManagementService**

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. **조직 관리 Actions**
2. **멤버 초대 Actions**
3. **Notification Domain 연동**

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. **조직 생성 플로우**
2. **멤버 초대 플로우**
3. **조직 관리 플로우**

---

이 Technical Specification은 Organization Management Domain의 Scenario 1-6을 완전히 지원하며, TDD 기반 구현을 통해 조직 생성, 멤버 초대, 조직 관리 기능을 포함한 완전한 조직 관리 시스템을 제공합니다.
