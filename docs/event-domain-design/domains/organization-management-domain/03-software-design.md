# Organization Management Domain - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Organization Management Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **User Management Domain**: 사용자 정보 참조, 기본 조직 생성 요청 수신
- **Notification Management Domain**: 알림 생성 요청 발행

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates (Scenario 0-6 기준)

| Process Model (System) | Software Design (Aggregate/External System) | 책임 | 구현 상태 |
|----------------------|---------------------------|------|----------|
| Organization System | **Organization Aggregate** | 조직 생성/관리, 조직 조회/선택, 권한 관리 | ✅ 완료 |
| Invitation System | **Invitation Aggregate** | 멤버 초대 처리, 초대 상태 관리, 멤버십 관리 | 🚧 신규 |
| Notification System | **Notification System (External)** | Notification Management Domain에서 제공 | 🚧 신규 |
| 프론트엔드 (Frontend) | **Frontend** | UI 상태 관리, 조직 선택 로직, 쿠키 관리 | ✅ 완료 |

---

## 📦 Aggregate 상세 정의

### 1. Organization Aggregate

**핵심 개념**: "유저들 협업하는 조직 단위와 조직 생명주기를 관리하는 집합체"

#### Commands
- Create Default Organization // 사용자 등록 시 기본 조직 생성 (User Management Domain 연동)
- Retrieve User Organizations // 유저 관련 조직 (소유, 소속) 조회 (Scenario 0)
- Select Initial Organization // 초기 조직 자동 선택 (Scenario 0)
- Create New Organization // 사용자가 새로운 조직 생성 (Scenario 1)
  - Default Workspace 자동 생성 포함
  - 개인 워크스페이스 자동 생성 포함 (소유자용)
- Update Organization // 조직 정보 수정
- Invite Member // 멤버 초대 (Scenario 2)
- Respond to Invitation // 초대 응답 (Scenario 2)
  - 개인 워크스페이스 자동 생성 포함 (승낙 시)
- Change Member Role // 멤버 역할 변경 (Scenario 3)
- Remove Member // 멤버 제거 (Scenario 4 - Sequence 1)
- Leave Organization // 조직 나가기 (Scenario 4 - Sequence 2)
- Transfer Organization Ownership // 조직 소유권 이전 (Scenario 5)
- Delete Organization // 조직 삭제 (Scenario 6)

#### Events
- Default Organization Created // 기본 조직이 생성됨
- New Organization Created // 새로운 조직이 생성됨
- Default Workspace Created // 기본 워크스페이스가 생성됨 (조직 생성 시)
- Personal Workspace Created // 개인 워크스페이스가 생성됨 (조직 생성/초대 승낙 시)
- Related Organizations Retrieved // 유저 관련 조직이 조회됨
- Initial Organization Selected // 초기 조직이 선택됨
- Organization Selected // 조직이 선택됨
- New Member Added to Organization // 새 멤버가 조직에 추가됨
- Member Role Assigned // 멤버 역할이 설정됨
- Role Option Selected (Frontend) // 역할 옵션이 선택됨 (프론트엔드)
- Member Promoted to Admin // 멤버가 Admin으로 승격되었다
- Admin Demoted to Member // Admin이 Member로 강등되었다
- Member Removed from Organization // 멤버가 조직에서 제거됨
- Organization Ownership Transferred // 조직 소유권이 이전됨
- Organization Deleted // 조직이 삭제됨

#### 핵심 불변식
- 조직은 반드시 하나의 Owner를 가져야 함
- 기본 조직은 삭제할 수 없음
- 동일한 조직 ID가 중복될 수 없음
- 조직 생성 시 반드시 조직 타입을 선택해야 함 (마케팅용)
- 조직 생성자는 자동으로 소유자(Owner) 권한을 가짐
- **조직 생성 시 자동으로 2개의 워크스페이스가 생성됨**
  - Default Workspace (조직 전체 협업 공간, 모든 멤버 접근 가능)
  - 개인 워크스페이스 (소유자 전용 공간, 초대 불가)
- **멤버 초대 승낙 시 자동으로 개인 워크스페이스가 생성됨**
  - 해당 멤버만 접근 가능
  - 다른 멤버 초대 불가
- 멤버 추가 시 중복 멤버는 추가할 수 없음
- 조직 소유자는 최소 1명 이상 유지되어야 함
- 멤버 역할은 Owner, Admin, Member 중 하나여야 함
- 소유권 이전 시 기존 소유자는 Admin으로 변경됨
- 역할 변경 권한: 소유자와 관리자만 멤버 역할 변경 가능
- 소유자 역할은 역할 변경으로 변경 불가 (소유권 이전을 통해서만 변경)
- 소유자는 자신의 역할을 변경할 수 없음
- 관리자는 멤버를 관리자로 승격만 가능 (다운그레이드 불가)
- 소유자만 관리자를 멤버로 강등 가능
- 현재 역할과 동일한 역할로 변경 불가

#### 속성 - 실제 구현
```typescript
{
  id: OrganizationId,           // UUID 기반 ID
  name: string,                 // 조직 이름
  organizationType: OrganizationType, // 조직 타입 (개인, 교육, 스타트업, 에이전시, 컴퍼니, N/A)
  ownerId: UserId,              // 조직 소유자 ID (profiles.id와 연결)
  isDefault: boolean,           // 기본 조직 여부
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}

// 조직 타입 정의
type OrganizationType = 'personal' | 'education' | 'startup' | 'agency' | 'company' | 'n/a';
```

---

### 2. Invitation Aggregate

**핵심 개념**: "조직 멤버 초대와 멤버십 관리를 담당하는 집합체"

#### Commands (받는 명령)
- Select Invitation Email // 초대할 이메일 주소 선택
- Request Member Invitation // 멤버 초대 요청 처리
- Accept Invitation // 초대 승낙 처리
- Reject Invitation // 초대 거절 처리

#### Events (발생 이벤트)
- Invitation Email Selected // 초대할 이메일이 선택됨
- Member Invitation Requested // 멤버 초대 요청됨
- Invitation Accepted // 초대가 승낙됨
- Invitation Rejected // 초대가 거절됨

#### 핵심 불변식 (Invariants)
- 초대는 조직 소유자 또는 관리자만 생성할 수 있음
- 동일한 이메일에 대한 중복 초대는 불가능함 (기존 초대 취소 후 새 초대)
- 이미 조직 멤버인 사용자는 초대할 수 없음
- 초대 승낙/거절은 초대받은 사용자만 가능함
- 초대 상태는 pending → accepted/rejected로만 변경 가능함

#### 속성 (Properties)
```typescript
{
  id: InvitationId,             // 초대 ID (UUID)
  organizationId: OrganizationId, // 조직 ID
  inviterUserId: UserId,        // 초대한 사용자 ID
  inviteeEmail: string,         // 초대받은 사용자 이메일
  inviteeUserId?: UserId,       // 초대받은 사용자 ID (가입된 경우)
  role: MemberRole,             // 부여할 역할
  status: InvitationStatus,     // 초대 상태
  createdAt: Date,              // 생성 시간
  respondedAt?: Date            // 응답 시간
}

// 멤버 역할 정의
type MemberRole = 'owner' | 'admin' | 'member';

// 초대 상태 정의
type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
```

---

### 3. Notification System (External)

**핵심 개념**: "Notification Management Domain에서 제공하는 알림 서비스"

#### Commands (요청하는 명령)
- Create Invitation Notification // 초대 알림 생성 요청
- Mark Notification as Read // 알림 읽음 처리 요청
- Get User Notifications // 사용자 알림 목록 조회 요청

#### Events (수신하는 이벤트)
- Invitation Notification Created // 초대 알림이 생성됨
- Notification Read // 알림이 읽혀짐

#### 기본 속성 (Notification Management Domain에서 정의)
```typescript
{
  id: NotificationId,           // 알림 ID (UUID)
  userId: UserId,               // 수신자 사용자 ID
  type: NotificationType,       // 알림 타입
  title: string,                // 알림 제목
  message: string,              // 알림 내용
  relatedId?: string,           // 관련 엔티티 ID (초대 ID 등)
  isRead: boolean,              // 읽음 여부
  createdAt: Date,              // 생성 시간
  readAt?: Date                 // 읽은 시간
}

// 알림 타입 정의
type NotificationType = 'invitation' | 'system' | 'announcement';
```

---

## 🔲 Bounded Context 정의

### Organization Management Context

**언어적 특징**:
- "Organization" = 유저들이 소속되는 조직 단위
- "Default Organization" = 유저 가입 시 자동 생성되는 개인 조직
- "Owner" = 조직의 최고 권한자 (소유권 이전, 조직 삭제 가능)
- "Admin" = 조직 관리자 (멤버 초대/관리, 조직 정보 수정 가능)
- "Member" = 일반 멤버 (기본 사용 권한)
- "Invitation" = 조직 멤버 초대 및 초대 상태 관리
- "Notification" = 유저 알림 및 인박스 시스템
- "Membership" = 유저와 조직 간의 소속 관계
- "Role" = 조직 내 유저 권한 수준

**핵심 책임**:
- 조직 생성/관리, 조직 선택, 소유권 이전, 삭제 ✅
- 멤버 초대 및 수락/거절 처리 🚧 신규
- Notification Management Domain과의 통합 (알림 생성 요청) 🚧 신규
- 조직 멤버십 및 역할 관리 🚧 신규

**포함된 Aggregates**:
- Organization Aggregate (조직 생성, 조직 조회, 조직 선택) ✅
- Invitation Aggregate (멤버 초대, 초대 상태 관리, 멤버십 관리) 🚧 신규
- Notification System (Notification Management Domain에서 제공하는 알림 서비스) 🚧 신규

**External System Integration**:
- **User Management Domain**: 사용자 정보 참조, 기본 조직 생성 요청 수신
- **Workspace Management Domain**: 워크스페이스 생성 요청 발행 (Service 통합)
- **Notification Management Domain**: 알림 생성 요청 발행 (Service 통합)

**QueryService 패턴 적용** (2025-10-14):
- **OrganizationQueryService**: 다른 도메인에서 Organization 정보를 안전하게 조회
  - Repository 직접 노출 방지로 도메인 경계 유지
  - 최소 권한 원칙: 읽기 전용 API만 노출
  - 사용처: Workspace Management Domain에서 조직 멤버 확인, Notification Domain에서 조직 정보 조회

---

## 🔀 다른 Context와의 경계

### User Management Context와의 경계

**언어적 차이**:
| Organization Management Context | User Management Context |
|-------------------|---------------------|
| "Organization Member" | "User" |
| "Member Profile" | "Profile" |
| "Organization" | "Default Organization" |

**통합 이벤트**:
- `User Registration Completed` → `Create Default Organization`
- `User Account Deleted` → `Handle User Deletion`

### Workspace Structure Context와의 경계

**언어적 차이**:
| Organization Management Context | Workspace Structure Context |
|-------------------|---------------------|
| "Organization" | "Workspace Owner Organization" |
| "Organization Member" | "Workspace Creator/Member" |

**통합 이벤트**:
- `Organization Created` → `Create Default Workspace + Create Personal Workspace`
  - Default Workspace: 조직 전체 협업 공간
  - Personal Workspace: 생성자의 개인 작업 공간
- `Invitation Accepted` → `Create Personal Workspace`
  - 새 멤버의 개인 작업 공간 자동 생성
- `Organization Selected` → `Set Workspace Context`

**워크스페이스 종류 및 권한 규칙**:
- **Default Workspace**: 조직 생성 시 자동 생성, 모든 멤버 접근 가능, 멤버 초대 가능
- **일반 워크스페이스**: 조직 멤버가 생성, 선택적으로 멤버 초대 가능
- **개인 워크스페이스**: 각 멤버 전용, 소유자만 접근, 다른 멤버 초대 불가

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│            Organization Management Context              │
│                                                         │
│  ┌─────────────┐ ┌───────────────┐ ┌──────────────┐   │
│  │Organization │ │  Invitation  │ │ Notification │   │
│  │ Aggregate   │ │  Aggregate   │ │  System       │   │
│  └─────┬───────┘ └─────┬─────────┘ └─────┬────────┘   │
│        │               │                 │             │
│        └───────────────┼─────────────────┼─────────────┘
│                        │                 │             │
│                        ▼                 ▼             │
│                 Domain Service                         │
│             (OrganizationCoordinator)                  │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Integration Events
                         ▼
     ┌──────────────────────────────────────┐
     │        Integration Events             │
     ├──────────────────────────────────────┤
     │ • Default Organization Created        │
     │ • Organization Context Set            │
     │ • Member Invited                      │
     │ • Member Joined                       │
     └──────────────────────────────────────┘
          │              │              │
    ┌─────┘              │              └─────┐
    ▼                    ▼                    ▼
┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ User Management │ │ Workspace      │ │ Notification     │
│ Context         │ │ Structure      │ │ Management       │
│                 │ │ Context        │ │ Context          │
└─────────────────┘ └────────────────┘ └──────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. Aggregate 분리 및 외부 시스템 활용 (Scenario 1-6 기준)
- **문제**: Organization, Invitation, Notification을 어떻게 설계할지
- **해결**: Organization과 Invitation은 독립된 Aggregate로 분리, Notification은 외부 시스템 활용
- **대안**: Organization Aggregate 하나로 통합, 모든 기능을 Organization Management Domain에 구현
- **결정 이유**: 
  - 단일 책임 원칙: Organization은 조직 관리, Invitation은 초대 관리에 집중
  - 도메인 경계 명확화: Notification은 Notification Management Domain의 책임
  - 재사용성: Notification System을 다른 도메인에서도 활용 가능
  - 향후 확장성: 각 도메인이 독립적으로 진화 가능

### 2. 워크스페이스 자동 생성 시스템
- **문제**: 조직 생성 시 워크스페이스를 어떻게 구성할지, 개인 작업 공간을 어떻게 제공할지
- **해결**: 조직 생성 시 Default Workspace + 개인 워크스페이스 자동 생성, 멤버 추가 시에도 개인 워크스페이스 자동 생성
- **대안**: Default Workspace만 생성, 사용자가 직접 워크스페이스 생성, 템플릿 선택 방식
- **결정 이유**: 
  - 사용자 경험 개선: 즉시 사용 가능한 작업 공간 제공
  - 개인 프라이버시: 각 멤버가 자신만의 공간을 가짐
  - 협업과 개인 작업 분리: Default Workspace(협업) + Personal Workspace(개인)
  - 온보딩 단순화: 추가 설정 없이 바로 작업 시작 가능

### 3. 3가지 워크스페이스 종류 도입
- **문제**: 워크스페이스의 용도와 접근 권한을 어떻게 구분할지
- **해결**: Default, 일반, 개인 워크스페이스 3가지 종류로 구분
- **대안**: 권한 기반 워크스페이스만 사용, 공개/비공개 워크스페이스만 구분
- **결정 이유**:
  - **Default Workspace**: 조직 전체 협업을 위한 공통 공간
  - **일반 워크스페이스**: 팀/프로젝트별 선택적 협업 공간
  - **개인 워크스페이스**: 개인 작업 및 메모를 위한 전용 공간 (초대 불가)
  - 명확한 용도 구분으로 사용자 혼란 최소화

### 4. 조직 타입 시스템 도입
- **문제**: 조직 생성 시 어떤 정보를 수집할지, 조직을 어떻게 분류할지
- **해결**: 6가지 조직 타입 선택 시스템 (개인, 교육, 스타트업, 에이전시, 컴퍼니, N/A)
- **대안**: 자유형 텍스트 입력, 태그 시스템, 조직 타입 없이 운영
- **결정 이유**: 향후 맞춤형 기능 제공, 사용 패턴 분석, 온보딩 개인화

### 5. 단순화된 조직 생성 프로세스
- **문제**: 조직 생성 시 필요한 필수/선택 정보의 범위
- **해결**: 조직 이름과 타입만 필수로 하는 최소한의 정보 수집
- **대안**: 상세 정보 모두 수집, 단계적 정보 입력, 설명 필드 포함
- **결정 이유**: 사용자 진입 장벽 최소화, 빠른 조직 생성, 나중에 수정 가능

### 6. 3단계 역할 시스템
- **문제**: 조직 내 권한을 어떻게 관리할지
- **해결**: 소유자 > 관리자 > 멤버 3단계 역할 시스템
- **대안**: 복잡한 권한 매트릭스, 역할 기반 접근 제어(RBAC)
- **결정 이유**: 단순하고 명확한 권한 관리, 사용자 이해 용이성

### 7. 초대 기반 멤버십 관리
- **문제**: 조직에 멤버를 어떻게 추가할지
- **해결**: 초대 데이터 기반 내부 시스템
- **대안**: 직접 초대, 링크 공유, 자동 가입
- **결정 이유**: 보안성, 추적 가능성, 사용자 경험

### 8. 계층적 역할 변경 권한 시스템 (Scenario 3)
- **문제**: 멤버 역할 변경 시 누가 누구의 역할을 변경할 수 있는지
- **해결**: 계층적 권한 시스템 - 소유자는 모든 역할 변경 가능, 관리자는 승격만 가능
- **대안**: 모든 관리자가 동등한 권한, RBAC 기반 세밀한 권한 제어
- **결정 이유**: 
  - 조직 안정성: 관리자가 다른 관리자를 강등시키는 충돌 방지
  - 명확한 권한 계층: 소유자 > 관리자 > 멤버 구조 유지
  - 사용자 이해 용이성: 직관적인 권한 규칙

### 9. 두 단계 역할 변경 프로세스 (Scenario 3)
- **문제**: 역할 변경 시 실수로 인한 권한 변경 방지
- **해결**: 역할 옵션 선택 → 확인 다이얼로그 → 역할 업데이트 2단계 프로세스
- **대안**: 즉시 역할 변경, 역할 변경 후 undo 기능
- **결정 이유**:
  - 실수 방지: 확인 다이얼로그로 권한 변경 내용 명확히 안내
  - 사용자 경험: 역할 변경의 영향을 이해하고 확인할 수 있는 시간 제공
  - 보안성: 중요한 권한 변경에 대한 이중 확인

---

## 📖 Read Models (Query Side)

### OrganizationMemberView
**목적**: Scenario 2에서 "멤버 초대 폼 표시" 및 "조직 멤버 목록 조회"를 위한 데이터 제공

```typescript
interface OrganizationMemberView {
  organizationId: OrganizationId;       // 조직 ID
  currentMembers: MemberSummary[];      // 현재 멤버 목록
  pendingInvitations: InvitationSummary[]; // 진행 중인 초대 목록
  userRole: MemberRole;                 // 현재 사용자의 역할
}

interface MemberSummary {
  userId: UserId;                       // 멤버 사용자 ID
  name: string;                         // 멤버 이름
  email: string;                        // 멤버 이메일
  profileImageUrl?: string;             // 프로필 이미지 URL
  role: MemberRole;                     // 멤버 역할
  joinedAt: Date;                       // 가입 시간
}

interface InvitationSummary {
  id: InvitationId;                     // 초대 ID
  inviteeEmail: string;                 // 초대받은 사용자 이메일
  role: MemberRole;                     // 부여할 역할
  status: InvitationStatus;             // 초대 상태
  inviterName: string;                  // 초대한 사용자 이름
  createdAt: Date;                      // 초대 생성 시간
}
```

**Process Model 매핑**:
- **Scenario 2**: "조직 멤버 목록 (프로필 이미지, 이름, 이메일, 역할)" → `currentMembers`
- **Scenario 2**: "초대 진행 중인 경우 조직 목록에서 회색으로 표시" → `pendingInvitations`
- **Scenario 2**: "현재 멤버인지, 초대가 있는지 함께 표시" → 두 목록 조합으로 검증
- **Scenario 3**: "선택된 멤버의 현재 역할 정보" → `MemberSummary.role`
- **Scenario 3**: "역할 선택 옵션 (관리자/멤버)" → `userRole`로 권한 확인 후 UI 구성

**Query Handler 책임**:
- 조직별 현재 멤버 목록 조회 (프로필 정보 포함)
- 조직별 진행 중인 초대 목록 조회
- 사용자 권한에 따른 데이터 필터링
- 초대 가능 여부 판단을 위한 데이터 제공
- 역할 변경 가능 여부 판단 (소유자/관리자 권한 확인)
- 역할 변경 대상 멤버의 현재 역할 정보 제공

### UserNotificationView
**목적**: Scenario 2에서 "인박스 버튼 클릭" 시 알림 목록 제공

```typescript
interface UserNotificationView {
  userId: UserId;                       // 사용자 ID
  notifications: NotificationSummary[]; // 알림 목록
  unreadCount: number;                  // 읽지 않은 알림 개수
}

interface NotificationSummary {
  id: NotificationId;                   // 알림 ID
  type: NotificationType;               // 알림 타입
  title: string;                        // 알림 제목
  message: string;                      // 알림 내용
  isRead: boolean;                      // 읽음 여부
  createdAt: Date;                      // 생성 시간
  relatedData?: InvitationNotificationData; // 초대 관련 데이터
}

interface InvitationNotificationData {
  invitationId: InvitationId;           // 초대 ID
  organizationName: string;             // 조직 이름
  inviterName: string;                  // 초대한 사용자 이름
  role: MemberRole;                     // 부여할 역할
}
```

**Process Model 매핑**:
- **"초대 정보 (누구누구 님이 다음 조직에 초대함. ㅇㅇㅇ 조직)"** → `InvitationNotificationData`
- **"초대 승낙/거절 버튼"** → 클라이언트에서 `invitationId`로 액션 처리

**Query Handler 책임**:
- 사용자별 알림 목록 조회 (최신순 정렬)
- 읽지 않은 알림 개수 계산
- 초대 알림의 경우 관련 조직/초대자 정보 조인
- 알림 타입별 적절한 메시지 포맷팅

---

## 🤝 Service 레이어의 역할

Service 레이어는 여러 Aggregate와 외부 시스템을 한 자리에서 조율하는 **업무 진행 책임자**입니다.

### Service 분리 및 구조 (2025-10-14 개선)

Organization Management Domain의 Service는 **단일 책임 원칙(SRP)**에 따라 다음과 같이 분리되었습니다:

#### 1. OrganizationCrudService (CRUD 작업)
- **책임**: 조직 생성, 조회, 업데이트 관리
- **주요 기능**:
  - 기본 조직 생성 (사용자 가입 시)
    - Default Workspace 자동 생성
    - 개인 워크스페이스 자동 생성 (소유자용)
  - 새로운 조직 생성
    - Default Workspace 자동 생성
    - 개인 워크스페이스 자동 생성 (소유자용)
  - 사용자 조직 목록 조회 (소유자 + 멤버)
- **의존성**: OrganizationRepository, OrganizationMemberRepository, WorkspaceCrudService

#### 2. OrganizationInvitationService (초대 관리)
- **책임**: 멤버 초대, 수락, 거절 처리
- **주요 기능**:
  - 멤버 초대 생성 (권한 검증 포함)
  - 초대 승낙 처리 (멤버십 추가)
    - 개인 워크스페이스 자동 생성 (새 멤버용)
  - 초대 거절 처리
- **의존성**: InvitationRepository, OrganizationRepository, OrganizationMemberRepository, NotificationService, WorkspaceCrudService

#### 3. OrganizationMemberService (멤버 관리)
- **책임**: 멤버 역할 변경, 제거 등 멤버십 관리
- **주요 기능**:
  - 멤버 역할 변경 (계층적 권한 시스템)
  - 멤버 제거
  - 멤버 목록 조회
- **의존성**: OrganizationMemberRepository, OrganizationRepository

#### 4. OrganizationQueryService (조회 전용 - 도메인 간 통합)
- **책임**: 다른 도메인에서 Organization 정보를 안전하게 조회
- **주요 기능**:
  - 조직 멤버 여부 확인 (isMember)
  - 멤버 역할 조회 (getMemberRole)
  - 조직 이름 조회 (getOrganizationName)
  - 이메일로 사용자 검색 (searchUserByEmail)
- **특징**: Repository를 직접 노출하지 않고 Service를 통해 도메인 경계 유지
- **사용처**: Workspace Management Domain, Notification Management Domain 등

### Service 레이어 핵심 책임

- **업무 시나리오 연결**: 
  - 새로운 조직 생성 시 Organization Aggregate에서 조직을 생성하고, Workspace Management Domain에 **Default Workspace와 개인 워크스페이스 생성**을 요청하며, 조직 목록을 갱신하고 새 조직으로 컨텍스트를 전환합니다.
  - 멤버 초대 시 Invitation Aggregate에서 초대를 생성하고, Notification Management Domain에 알림 생성 요청을 보낸 뒤, 초대 상태를 추적합니다.
  - 초대 승낙/거절 시 Invitation Aggregate에서 초대 상태를 업데이트하고, 승낙인 경우 Organization Aggregate에서 멤버십을 추가하며, **새 멤버의 개인 워크스페이스를 생성**하고, Notification Service를 통해 알림을 읽음 처리합니다.
  - 멤버 역할 변경 시 Organization Aggregate에서 현재 사용자 권한을 확인하고, 대상 멤버의 역할을 검증한 뒤, 역할을 업데이트하고 권한 캐시를 무효화합니다.
  - 조직 소유권 이전 시 Organization Aggregate에서 소유권을 이전하고, 관련 멤버십을 업데이트합니다.
  - 조직 삭제 시 Organization Aggregate에서 조직을 삭제하고, 관련 멤버십과 초대를 정리합니다.

- **규칙 준수 확인**: 
  - 새로운 조직 생성 시 필수 필드(이름, 타입) 검증 및 생성자 권한 확인
  - 멤버 초대 시 소유자/관리자 권한 확인 및 중복 초대 방지
  - 초대 승낙 시 초대 유효성 검증 및 조직 멤버십 중복 확인
  - 멤버 추가 시 중복 멤버 방지 및 역할 유효성 검증
  - 멤버 역할 변경 시 현재 사용자 권한 확인 (소유자/관리자만 가능)
  - 멤버 역할 변경 시 대상 멤버가 소유자가 아닌지 확인
  - 관리자는 멤버를 관리자로 승격만 가능, 다운그레이드 불가
  - 소유자만 관리자를 멤버로 강등 가능
  - 조직 소유자 최소 1명 유지 규칙 준수
  - 소유권 이전 시 기존 소유자 권한 변경 확인

- **외부 파트너 연동**: 
  - User Management Domain에서 사용자 정보 조회
  - Workspace Management Domain으로 워크스페이스 생성 요청 (Service 통합)
  - Notification Management Domain으로 알림 생성/조회/수정 요청 (Service 통합)
  - **QueryService 패턴**: 다른 도메인에서 OrganizationQueryService를 통해 안전하게 정보 조회

- **실패 대응 전략**: 
  - 조직 생성 실패 시 사용자에게 상태 안내 및 재시도 옵션 제공
  - 초대 생성 실패 시 사용자에게 명확한 오류 메시지 제공 및 재시도 옵션
  - 알림 생성 실패 시 백그라운드에서 재시도 후 사용자에게 상태 안내
  - 역할 변경 실패 시 명확한 오류 메시지 (권한 부족, 대상 멤버 오류 등) 제공
  - 소유권 이전 실패 시 롤백 처리

- **즐거운 사용자 경험**: 
  - 새로운 조직 생성 시 즉시 조직 목록 갱신 및 자동 컨텍스트 전환
  - 멤버 초대 시 실시간 이메일 검색 및 프로필 미리보기 제공
  - 초대 승낙/거절 시 즉시 UI 업데이트 및 조직 멤버 목록 갱신
  - 역할 변경 시 확인 다이얼로그로 명확한 권한 변경 안내 제공
  - 역할 변경 완료 시 즉시 UI 업데이트 및 멤버 목록 갱신
  - 인박스 알림에 읽지 않은 개수 배지 표시로 직관적인 알림 확인

---

## ✅ 검증 체크리스트

### 기존 구현 완료 (Scenario 1)
- [x] Organization Aggregate가 명확한 경계와 책임을 가지는가? ✅
- [x] Context 간 통합이 느슨하게 결합되어 있는가? (Integration Events 활용) ✅
- [x] Repository 패턴이 올바르게 구현되었는가? (Drizzle ORM 기반) ✅
- [x] Server Actions가 적절히 구현되었는가? (Next.js 기반) ✅
- [x] React Context가 적절히 구현되었는가? (Organization Context) ✅

### 신규 구현 필요 (Scenario 2-6)
- [ ] Invitation Aggregate가 올바르게 설계되었는가? (멤버 초대 및 초대 상태 관리) 🚧
- [ ] Notification System이 올바르게 연동되었는가? (Notification Management Domain과의 통합) 🚧
- [ ] Organization Aggregate에 멤버 관리 기능이 올바르게 추가되었는가? (멤버 추가, 역할 설정) 🚧
- [x] Organization Aggregate에 멤버 역할 변경 기능이 올바르게 설계되었는가? (Scenario 3) ✅
- [x] 멤버 역할 변경의 불변식이 올바르게 정의되었는가? (권한, 역할 제약 등) ✅
- [x] 멤버 역할 변경의 두 단계 프로세스가 올바르게 설계되었는가? (옵션 선택 → 확인 다이얼로그) ✅
- [ ] Process Model의 모든 System이 Aggregate로 적절히 매핑되었는가? (2개 System → 2개 Aggregate + 1개 External System) 🚧
- [ ] 멤버 초대 프로세스의 불변식이 올바르게 정의되었는가? (권한, 중복 방지 등) 🚧
- [ ] 조직 멤버십 관리의 불변식이 올바르게 정의되었는가? (소유자 유지, 역할 검증 등) 🚧
- [ ] Notification Management Domain과의 통합이 적절히 설계되었는가? (알림 생성 요청, 알림 상태 조회) 🚧
- [ ] 새로운 Read Models가 적절히 설계되었는가? (OrganizationMemberView, UserNotificationView) 🚧
- [ ] Cross-Aggregate 이벤트가 적절히 설계되었는가? (초대-알림-멤버십 연동) 🚧

---

## 📊 성과 측정 지표

### 기존 지표 (Scenario 1)
1. **조직 생성 성공률**: 99.5% 이상 (Default + 개인 워크스페이스 생성 포함)
2. **조직 컨텍스트 전환 시간**: 평균 200ms 이하 (캐싱 활용)
3. **조직 목록 조회 시간**: 평균 300ms 이하
4. **워크스페이스 자동 생성 성공률**: 99% 이상 (Default + 개인 워크스페이스 2개 생성)

### 신규 지표 (Scenario 2-6)
5. **멤버 초대 성공률**: 95% 이상 (초대 생성부터 알림 전달까지)
6. **초대 응답률**: 70% 이상 (초대받은 사용자의 승낙/거절 비율)
7. **개인 워크스페이스 자동 생성 성공률**: 99% 이상 (초대 승낙 시)
8. **알림 전달 지연 시간**: 평균 100ms 이하 (초대 생성부터 알림 생성까지)
9. **인박스 로딩 시간**: 평균 300ms 이하 (알림 목록 조회)
10. **멤버 목록 조회 시간**: 평균 200ms 이하 (조직별 멤버 및 초대 목록)
11. **멤버 역할 변경 성공률**: 99% 이상 (권한 검증부터 역할 업데이트까지) - Scenario 3
12. **멤버 역할 변경 처리 시간**: 평균 200ms 이하 (역할 업데이트 및 캐시 무효화) - Scenario 3
13. **소유권 이전 처리 시간**: 평균 1초 이하 (소유권 이전 및 권한 변경)
14. **조직 삭제 처리 시간**: 평균 2초 이하 (조직 삭제 및 관련 데이터 정리)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- Database Schema 문서 (추후 작성)
- Technical Specification 문서 (추후 작성)
- API Specification 문서 (추후 작성)

---

이 Software Design 문서는 Organization Management Domain의 구현을 위한 완전한 설계 지침입니다. (Scenario 1-6 기준, 조직 관리 및 멤버십 시스템)
