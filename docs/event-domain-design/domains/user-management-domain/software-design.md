# User Management Domain - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, User Management Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Clerk**: External System으로 유지 (인증 및 조직 관리의 SSOT)
- **Anti-Corruption Layer**: Clerk API와 도메인 모델 간의 변환 계층 구현

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Clerk Webhook Handler | **User Aggregate** | 사용자 인증, 세션 관리, 기본 조직 생성 |
| Authentication Manager | **User Aggregate** | 로그인/로그아웃, 조직 선택, 컨텍스트 설정 |
| Organization Context Manager | **Organization Aggregate** | 조직 생성/관리, 소유권 이전, 조직 삭제 |
| Invitation Manager | **Membership Aggregate** | 멤버 초대, 초대 수락/거절, 초대 상태 관리 |
| Member Role Manager | **Membership Aggregate** | 멤버 역할 변경, 권한 관리 |
| Member Removal Manager | **Membership Aggregate** | 멤버 제거, 워크스페이스 이전 |
| Ownership Transfer Manager | **Organization Aggregate** | 소유권 이전, 권한 변경 |
| Organization Deletion Manager | **Organization Aggregate** | 조직 삭제, 데이터 정리 |
| User Deletion Cleanup Manager | **User Aggregate** | 사용자 삭제 처리, 조직 정리 |

---

## 📦 Aggregate 상세 정의

### 1. User Aggregate

**핵심 개념**: "플랫폼 사용자의 인증, 세션, 조직 컨텍스트를 관리하는 집합체"

#### Commands (받는 명령)
- Sync User from Clerk // Clerk Webhook으로 사용자 정보 동기화
- User Login // 사용자 로그인 처리 및 세션 생성
- User Logout // 사용자 로그아웃 및 세션 정리
- Select Organization // 사용자가 작업할 조직 선택
- Set Organization Context // 선택된 조직으로 컨텍스트 설정
- Handle User Deletion // Clerk에서 사용자 삭제 시 처리

#### Events (발생 이벤트)
- Clerk User Synced to Supabase // Clerk 사용자 정보가 Supabase에 동기화됨
- User Logged In // 사용자가 성공적으로 로그인함
- User Session Created // 새로운 사용자 세션이 생성됨
- Organization Selected by User // 사용자가 특정 조직을 선택함
- Organization Context Set // 조직 컨텍스트가 설정됨
- User Session Expired // 사용자 세션이 만료됨
- Clerk User Deleted // Clerk에서 사용자가 삭제됨
- User Deletion Warning Shown // 사용자 삭제 경고가 표시됨

#### 핵심 불변식 (Invariants)
- 사용자는 반드시 하나의 기본 조직을 가져야 함
- 로그인 상태에서는 반드시 하나의 조직 컨텍스트가 설정되어야 함
- Clerk ID와 Supabase ID는 1:1 매핑되어야 함
- 사용자 삭제 시 소유 조직이 있으면 삭제 불가

#### 속성 (Properties)
```typescript
// Aggregate 모델 (비즈니스 로직)
{
  id: UserId,                    // Supabase 내부 ID
  clerkId: string,              // Clerk 사용자 ID
  email: string,                // 사용자 이메일
  name: string,                 // 사용자 이름
  defaultOrganizationId: OrganizationId,  // 기본 조직 ID (Membership 테이블에서 조회)
  currentOrganizationId?: OrganizationId, // 현재 선택된 조직 ID (세션 상태, DB 저장 안함)
  lastLoginAt?: Date,           // 마지막 로그인 시간
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}

// DB 스키마 (영속화)
// users 테이블: id, clerk_id, email, name, last_login_at, created_at, updated_at
// memberships 테이블에서 is_default=true인 조직을 기본 조직으로 조회
// 현재 조직은 세션/메모리에만 저장
```

---

### 2. Organization Aggregate

**핵심 개념**: "사용자들이 협업하는 조직 단위와 소유권, 삭제 정책을 관리하는 집합체"

#### Commands
- Sync Organization from Clerk // Clerk Webhook으로 조직 정보 동기화
- Create Default Organization // 사용자 등록 시 기본 조직 생성
- Transfer Ownership // 조직 소유권을 다른 멤버에게 이전
- Delete Organization // 조직 삭제 (소프트 삭제)
- Restore Organization // 삭제된 조직 복구
- Handle Organization Deletion // Clerk에서 조직 삭제 시 처리

#### Events
- Clerk Organization Synced to Supabase // Clerk 조직 정보가 Supabase에 동기화됨
- Default Organization Created // 기본 조직이 생성됨
- Ownership Transfer Requested // 소유권 이전이 요청됨
- New Owner Promoted // 새 소유자가 Owner 권한으로 승격됨
- Previous Owner Demoted to Admin // 기존 소유자가 Admin 권한으로 변경됨
- Organization Deletion Requested // 조직 삭제가 요청됨
- Organization Soft Deleted // 조직이 소프트 삭제됨
- Permanent Deletion Scheduled // 완전 삭제가 예약됨

#### 핵심 불변식
- 조직은 반드시 하나의 Owner를 가져야 함
- 기본 조직은 삭제할 수 없음
- 조직 삭제 시 정확한 조직 이름 입력 필수
- 소프트 삭제 후 30일 보관 정책 준수

#### 속성
```typescript
{
  id: OrganizationId,           // Supabase 내부 ID
  clerkId: string,              // Clerk 조직 ID
  name: string,                 // 조직 이름
  ownerId: UserId,              // 조직 소유자 ID
  isDefault: boolean,           // 기본 조직 여부
  deletedAt?: Date,             // 소프트 삭제 시간
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}
```

---

### 3. Membership Aggregate

**핵심 개념**: "조직 내 멤버십, 초대, 역할 관리를 담당하는 집합체"

#### Commands
- Invite Member // 조직에 새 멤버 초대
- Accept Invitation // 초대 수락 및 조직 가입
- Reject Invitation // 초대 거절
- Change Member Role // 멤버 역할 변경 (Admin ↔ Member)
- Remove Member // 조직에서 멤버 제거
- Cancel Invitation // 대기 중인 초대 취소

#### Events
- Member Invitation Sent via Email // 이메일로 멤버 초대가 전송됨
- Clerk Invitation Link Generated // Clerk에서 초대 링크가 생성됨
- Invitation Accepted // 초대가 수락됨
- New Member Added to Organization // 새 멤버가 조직에 추가됨
- Member Role Assigned // 멤버 역할이 할당됨
- Member Promoted to Admin // 멤버가 Admin으로 승격됨
- Admin Demoted to Member // Admin이 Member로 강등됨
- Member Removed from Organization // 멤버가 조직에서 제거됨
- Invitation Expired // 초대가 만료됨

#### 핵심 불변식
- Owner와 Admin만 멤버 초대 가능
- Admin은 다른 Admin 역할 변경 불가 (Owner만 가능)
- 초대 링크는 30일간 유효
- 동일 이메일 중복 초대 방지

#### 속성
```typescript
{
  id: MembershipId,             // 멤버십 ID
  organizationId: OrganizationId, // 조직 ID
  userId: UserId,               // 사용자 ID
  role: "owner" | "admin" | "member", // 역할
  invitedBy?: UserId,           // 초대한 사용자 ID
  invitedAt?: Date,             // 초대 시간
  joinedAt?: Date,              // 가입 시간
  status: "pending" | "active" | "removed", // 상태
  createdAt: Date,              // 생성 시간
  updatedAt: Date               // 수정 시간
}
```

---

## 🔲 Bounded Context 정의

### User Management Context

**언어적 특징**:
- "User" = 플랫폼을 사용하는 개별 사용자 (Clerk ID로 식별)
- "Organization" = 사용자들이 협업하는 조직 단위 (소유권과 멤버십 관리)
- "Membership" = 사용자와 조직 간의 소속 관계 (역할과 권한 포함)
- "Owner" = 조직의 최고 권한자 (소유권 이전, 조직 삭제 가능)
- "Admin" = 조직 관리자 (멤버 초대/관리, 조직 정보 수정 가능)
- "Member" = 일반 멤버 (기본 사용 권한)
- "Invitation" = 조직에 새 멤버를 초대하는 과정 및 상태

**핵심 책임**:
- 사용자 인증 및 세션 관리
- 조직 생성, 관리, 소유권 이전
- 멤버 초대, 역할 관리, 멤버 제거
- Clerk과의 실시간 데이터 동기화
- 조직 및 사용자 삭제 정책 관리

**포함된 Aggregates**:
- User Aggregate (사용자 인증, 세션, 조직 컨텍스트 관리)
- Organization Aggregate (조직 생명주기, 소유권, 삭제 관리)
- Membership Aggregate (멤버십, 초대, 역할 관리)

**External System Integration**:
- **Clerk**: 인증 및 조직 관리 SSOT
  - Webhook을 통한 실시간 동기화 (User/Organization CRUD)
  - Clerk API를 통한 초대 링크 생성 및 관리
  - Anti-Corruption Layer로 도메인 모델과 분리

---

## 🔀 다른 Context와의 경계

### Workspace Structure Context와의 경계

**언어적 차이**:
| User Management Context | Workspace Structure Context |
|---------------------|-------------------|
| "Organization" | "Workspace Owner Organization" |
| "User" | "Workspace Creator/Member" |
| "Owner/Admin/Member" | "Workspace Permission Level" |

**통합 이벤트**:
- `Default Organization Created` → `Create Default Workspace`
- `New Member Added to Organization` → `Grant Workspace Access`
- `Member Removed from Organization` → `Revoke Workspace Access`
- `Organization Deleted` → `Delete All Organization Workspaces`
- `Ownership Transfer Completed` → `Transfer Workspace Ownership`

### Visual Canvas Context와의 경계

**언어적 차이**:
| User Management Context | Visual Canvas Context |
|---------------------|-------------------|
| "Organization Context" | "Canvas Collaboration Context" |
| "User Session" | "Canvas User Session" |
| "Member Role" | "Canvas Permission Level" |

**통합 이벤트**:
- `Organization Context Set` → `Initialize Canvas Context`
- `User Logged In` → `Restore Canvas Session`
- `Member Role Changed` → `Update Canvas Permissions`

### Component System Context와의 경계

**언어적 차이**:
| User Management Context | Component System Context |
|---------------------|-------------------|
| "Organization" | "Component Library Owner" |
| "Member" | "Component User" |
| "Permission" | "Component Access Level" |

**통합 이벤트**:
- `Organization Created` → `Initialize Component Library`
- `Member Added` → `Grant Component Access`
- `Organization Deleted` → `Archive Component Library`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│              User Management Context                    │
│                                                         │
│  ┌─────────────┐ ┌───────────────┐ ┌──────────────┐   │
│  │    User     │ │ Organization  │ │ Membership   │   │
│  │ Aggregate   │ │  Aggregate    │ │  Aggregate   │   │
│  └─────┬───────┘ └─────┬─────────┘ └──────┬───────┘   │
│        │               │                  │            │
│        └───────────────┼──────────────────┘            │
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
     │ • New Member Added to Organization    │
     │ • Member Removed from Organization    │
     │ • Organization Deleted                │
     │ • Ownership Transfer Completed        │
     │ • Organization Context Set            │
     │ • User Logged In                      │
     │ • Member Role Changed                 │
     └──────────────────────────────────────┘
          │              │              │
    ┌─────┘              │              └─────┐
    ▼                    ▼                    ▼
┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Workspace       │ │ Visual Canvas  │ │ Component System │
│ Structure       │ │ Context        │ │ Context          │
│ Context         │ │                │ │                  │
└─────────────────┘ └────────────────┘ └──────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Block System    │ │ AI Integration │ │                  │
│ Context         │ │ Context        │ │                  │
└─────────────────┘ └────────────────┘ └──────────────────┘

External System Integration:
┌─────────────────────────────────────────────────────────┐
│                    Clerk (External)                     │
│  ┌─────────────┐ ┌───────────────┐ ┌──────────────┐   │
│  │    User     │ │ Organization  │ │ Invitation   │   │
│  │    API      │ │     API       │ │     API      │   │
│  └─────────────┘ └───────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ Webhook + API Calls
                         │ (Anti-Corruption Layer)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              User Management Context                    │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. Clerk을 External System으로 유지
- **문제**: 사용자 인증과 조직 관리를 자체 구현 vs 외부 서비스 활용
- **해결**: Clerk을 SSOT로 유지하고 Anti-Corruption Layer로 분리
- **대안**: 자체 인증 시스템 구축, Auth0/Firebase 등 다른 서비스
- **결정 이유**: 빠른 개발, 보안 전문성, 조직 관리 기능 완성도

### 2. 3개 Aggregate 분리 설계
- **문제**: User, Organization, Membership을 하나의 Aggregate로 할지 분리할지
- **해결**: 각각 독립된 Aggregate로 분리하여 책임 명확화
- **대안**: User Aggregate 하나로 통합, Organization 중심 설계
- **결정 이유**: 단일 책임 원칙, 확장성, 독립적 생명주기 관리

### 3. 30일 소프트 삭제 정책
- **문제**: 조직/사용자 삭제 시 즉시 삭제 vs 유예 기간
- **해결**: 30일 소프트 삭제 후 완전 삭제
- **대안**: 즉시 삭제, 영구 보관, 다른 유예 기간
- **결정 이유**: 실수 복구 가능성, 법적 요구사항 대응, 사용자 경험

---

## 📖 Read Models (Query Side)

### UserOrganizationView
**목적**: 사용자의 조직 목록과 현재 컨텍스트 정보를 제공

```typescript
interface UserOrganizationView {
  userId: UserId;                    // 사용자 ID
  currentOrganizationId: OrganizationId; // 현재 선택된 조직
  ownedOrganizations: OrganizationSummary[]; // 소유한 조직 목록
  memberOrganizations: OrganizationSummary[]; // 멤버인 조직 목록
  lastLoginAt: Date;                 // 마지막 로그인 시간
}

interface OrganizationSummary {
  id: OrganizationId;               // 조직 ID
  name: string;                     // 조직 이름
  role: "owner" | "admin" | "member"; // 사용자 역할
  memberCount: number;              // 멤버 수
  isDefault: boolean;               // 기본 조직 여부
}
```

**Query Handler 책임**:
- 사용자별 조직 목록 조회
- 조직 전환을 위한 컨텍스트 정보 제공
- 조직별 권한 수준 확인

### OrganizationMemberView
**목적**: 조직의 멤버 목록과 초대 상태 정보를 제공

```typescript
interface OrganizationMemberView {
  organizationId: OrganizationId;    // 조직 ID
  organizationName: string;          // 조직 이름
  members: MemberDetail[];           // 멤버 목록
  pendingInvitations: InvitationDetail[]; // 대기 중인 초대
  totalMemberCount: number;          // 전체 멤버 수
}

interface MemberDetail {
  userId: UserId;                    // 사용자 ID
  email: string;                     // 이메일
  name: string;                      // 이름
  role: "owner" | "admin" | "member"; // 역할
  joinedAt: Date;                    // 가입 시간
  lastActiveAt?: Date;               // 마지막 활동 시간
}

interface InvitationDetail {
  invitationId: string;              // 초대 ID
  email: string;                     // 초대된 이메일
  role: "admin" | "member";          // 초대 역할
  invitedBy: string;                 // 초대한 사용자 이름
  invitedAt: Date;                   // 초대 시간
  expiresAt: Date;                   // 만료 시간
}
```

**최적화 포인트**:
- 조직별 멤버 목록 캐싱 (Redis) (추후)
- 페이지네이션 지원 (대규모 조직) (추후)
- 실시간 멤버 상태 업데이트 (WebSocket) (추후)

---

## 🤝 Service 레이어의 역할

Service 레이어는 여러 Aggregate와 외부 시스템을 한 자리에서 조율하는 **업무 진행 책임자**입니다.

- **업무 시나리오 연결**: 
  - 사용자 등록 시 User Aggregate에서 사용자를 생성하고, Organization Aggregate에서 기본 조직을 만든 뒤, Membership Aggregate에서 소유자 권한을 부여합니다.
  - 멤버 초대 시 Membership Aggregate에서 초대를 생성하고, Clerk API를 통해 초대 링크를 발송한 뒤, 수락 시 Organization Aggregate의 멤버 수를 업데이트합니다.

- **규칙 준수 확인**: 
  - 조직 삭제 전 기본 조직 여부 확인, 소유 워크스페이스 존재 여부 검증
  - 소유권 이전 시 대상 멤버의 조직 소속 여부 검증

- **외부 파트너 연동**: 
  - Clerk Webhook 수신 시 User/Organization Aggregate 동기화 및 실패 시 재시도 로직
  - Clerk API 호출 실패 시 사용자에게 적절한 오류 메시지 제공
  - 초대 링크 생성 실패 시 대체 초대 방법 안내

- **실패 대응 전략**: 
  - Clerk 동기화 실패 시 Queue에 재시도 작업 등록 및 사용자에게 "잠시 후 다시 시도" 안내
  - 조직 삭제 실패 시 부분 삭제 상태 복구 및 사용자에게 상태 안내
  - 멤버 초대 실패 시 기존 초대 상태 정리 및 재초대 옵션 제공

- **즐거운 사용자 경험**: 
  - 조직 전환 시 즉시 UI 업데이트 후 백그라운드에서 컨텍스트 동기화
  - 멤버 초대 시 낙관적 업데이트로 즉시 "초대 전송됨" 표시
  - 로그인 시 마지막 선택 조직으로 자동 컨텍스트 설정

---

## 🛡️ Anti-Corruption Layer Design

### Clerk 통합

#### ClerkAdapter Interface
Clerk과의 통합을 추상화하는 인터페이스:

```typescript
interface ClerkAdapter {
  syncUser(clerkUserId: string): Promise<ClerkUser>
  syncOrganization(clerkOrgId: string): Promise<ClerkOrganization>
  createInvitation(orgId: string, email: string, role: string): Promise<ClerkInvitation>
  deleteInvitation(invitationId: string): Promise<void>
}
```

#### Translation Layer
Clerk 데이터와 도메인 모델 간 변환:

```typescript
interface ClerkToDomainTranslator {
  translateClerkUser(clerkUser: ClerkUser): User
  translateClerkOrganization(clerkOrg: ClerkOrganization): Organization
  translateClerkInvitation(clerkInvite: ClerkInvitation): Membership
}

interface DomainToClerkTranslator {
  translateDomainUser(user: User): ClerkUserData
  translateDomainOrganization(org: Organization): ClerkOrganizationData
}
```

#### Benefits
1. **도메인 순수성**: Clerk API가 도메인에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: Clerk → Auth0/Firebase 전환 용이
4. **장애 격리**: Clerk 장애 시 도메인 로직 보호

---

## ✅ 검증 체크리스트

- [x] 각 Aggregate가 명확한 경계와 책임을 가지는가? (User, Organization, Membership 분리)
- [x] Process Model의 모든 System이 Aggregate로 적절히 매핑되었는가? (9개 System → 3개 Aggregate)
- [x] External System 처리가 적절한가? (Clerk을 External System으로 유지)
- [x] Context 간 통합이 느슨하게 결합되어 있는가? (Integration Events 활용)
- [x] 핵심 불변식이 올바르게 정의되었는가? (각 Aggregate별 4-5개 불변식)
- [x] Cross-Domain 이벤트가 적절히 설계되었는가? (8개 Integration Events)

---

## 📊 성과 측정 지표

1. **Clerk 동기화 성공률**: 99.9% 이상 (실패 시 재시도 포함)
2. **사용자 로그인 응답 시간**: 평균 500ms 이하 (조직 목록 포함)
3. **멤버 초대 성공률**: 95% 이상 (이메일 전송 성공 기준)
4. **조직 컨텍스트 전환 시간**: 평균 200ms 이하 (캐싱 활용)
5. **권한 검증 오류율**: 0.1% 이하 (잘못된 권한 부여/거부)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./event-storm.md)
- [Process Model 문서](./process-model.md)
- Database Schema 문서 (추후 작성)
- Technical Specification 문서 (추후 작성)
- API Specification 문서 (추후 작성)

---

이 Software Design 문서는 User Management Domain의 구현을 위한 완전한 설계 지침입니다.
