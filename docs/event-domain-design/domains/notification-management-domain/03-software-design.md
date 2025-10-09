# Notification Management Domain - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.
(현재는 Organization Management Domain에서 사용되는 초대 알림 기능만 정의)

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Notification Management Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **User Management Domain**: 사용자 정보 참조 (알림 수신자)
- **Organization Management Domain**: 초대 알림 생성 요청 수신

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates (Organization 초대 알림 기준)

| Process Model (System) | Software Design (Aggregate) | 책임 | 구현 상태 |
|----------------------|---------------------------|------|----------|
| Notification System | **Notification Aggregate** | 알림 생성, 읽음 처리, 알림 조회 | 🚧 신규 |
| 프론트엔드 (Frontend) | **Frontend** | 인박스 UI, 알림 표시 | 🚧 신규 |

---

## 📦 Aggregate 상세 정의

### 1. Notification Aggregate

**핵심 개념**: "사용자 알림과 인박스 관리를 담당하는 집합체"

#### Commands (받는 명령)
- Create Invitation Notification // 초대 알림 생성 (Organization Management Domain 요청)
- Mark Notification as Read // 알림 읽음 처리
- Get User Notifications // 사용자 알림 목록 조회
- Archive Notification // 알림 보관처리

#### Events (발생 이벤트)
- Invitation Notification Created // 초대 알림이 생성됨
- Notification Read // 알림이 읽혀짐
- Notification Archived // 알림이 보관처리됨

#### 핵심 불변식 (Invariants)
- 알림은 반드시 수신자가 있어야 함
- 초대 알림은 해당 초대가 존재할 때만 생성 가능함
- 읽지 않은 알림 개수는 실제 알림 수와 일치해야 함
- 알림은 생성 시간 순으로 정렬되어야 함
- 읽음 처리 시 read_at이 자동으로 설정되어야 함

#### 속성 (Properties)
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

// 알림 타입 정의 (현재는 초대 알림만)
type NotificationType = 'invitation' | 'system' | 'announcement';
```

---

## 🔲 Bounded Context 정의

### Notification Management Context

**언어적 특징**:
- "Notification" = 사용자에게 전달되는 알림
- "Inbox" = 사용자의 알림 수신함
- "Read Status" = 알림 읽음 상태
- "Invitation Notification" = 조직 초대 알림 (Organization Management Domain에서 요청)

**핵심 책임** (현재 범위):
- 초대 알림 생성 및 관리 🚧 신규
- 알림 읽음 상태 처리 🚧 신규
- 사용자 인박스 조회 🚧 신규
- 읽지 않은 알림 개수 추적 🚧 신규

**포함된 Aggregates**:
- Notification Aggregate (알림 생성, 읽음 처리, 알림 조회) 🚧 신규

**External System Integration**:
- **User Management Domain**: 사용자 정보 참조 (알림 수신자)
- **Organization Management Domain**: 초대 알림 생성 요청 수신

---

## 🔀 다른 Context와의 경계

### Organization Management Context와의 경계

**언어적 차이**:
| Notification Management Context | Organization Management Context |
|-------------------|---------------------|
| "Invitation Notification" | "Member Invitation" |
| "Notification Recipient" | "Invitee" |
| "Read Status" | "Invitation Status" |

**통합 이벤트**:
- `Member Invitation Requested` → `Create Invitation Notification`
- `Invitation Accepted/Rejected` → `Update Notification Status`

### User Management Context와의 경계

**언어적 차이**:
| Notification Management Context | User Management Context |
|-------------------|---------------------|
| "Notification Recipient" | "User" |
| "User Inbox" | "User Profile" |

**통합 이벤트**:
- `User Account Deleted` → `Clean Up User Notifications`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│          Notification Management Context                │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │         Notification Aggregate                │     │
│  │                                               │     │
│  │  • Create Invitation Notification            │     │
│  │  • Mark as Read                              │     │
│  │  • Get User Notifications                    │     │
│  │  • Archive Notification                      │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Integration Events
                         ▼
     ┌──────────────────────────────────────┐
     │        Integration Events             │
     ├──────────────────────────────────────┤
     │ • Invitation Notification Created     │
     │ • Notification Read                   │
     │ • User Notifications Retrieved        │
     └──────────────────────────────────────┘
          │              │
    ┌─────┘              └─────┐
    ▼                          ▼
┌─────────────────┐ ┌──────────────────────┐
│ Organization    │ │ User Management      │
│ Management      │ │ Context              │
│ Context         │ │                      │
└─────────────────┘ └──────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. 중앙 집중식 알림 시스템
- **문제**: 각 도메인에서 알림을 독립적으로 관리할지, 중앙에서 통합 관리할지
- **해결**: Notification Management Domain에서 모든 알림을 통합 관리
- **대안**: 각 도메인에서 독립적으로 알림 관리
- **결정 이유**: 
  - 일관된 알림 UX 제공
  - 알림 상태 추적 중앙화
  - 인박스 통합 관리
  - 향후 알림 타입 추가 용이

### 2. 초대 알림에 관련 데이터 포함
- **문제**: 초대 알림에 어떤 정보를 포함할지
- **해결**: 초대 ID를 related_id로 저장, 조회 시 초대 정보 조인
- **대안**: 모든 정보를 알림 메시지에 직접 저장
- **결정 이유**: 
  - 데이터 정규화
  - 초대 정보 변경 시 알림도 자동 반영
  - 저장 공간 절약

### 3. 읽음 상태 자동 추적
- **문제**: 읽음 상태를 어떻게 관리할지
- **해결**: is_read와 read_at을 함께 관리하여 일관성 유지
- **대안**: is_read만 관리
- **결정 이유**: 
  - 읽은 시각 추적 가능
  - 데이터 일관성 보장 (CHECK 제약조건)
  - 향후 분석 용이

---

## 📖 Read Models (Query Side)

### UserNotificationView
**목적**: Organization Management Domain Scenario 2에서 "인박스 버튼 클릭" 시 알림 목록 제공

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
- **"초대 승낙/거절 버튼"** → 클라이언트에서 `invitationId`로 Organization Management Domain 액션 호출

**Query Handler 책임**:
- 사용자별 알림 목록 조회 (최신순 정렬)
- 읽지 않은 알림 개수 계산
- 초대 알림의 경우 관련 조직/초대자 정보 조인
- 알림 타입별 적절한 메시지 포맷팅

---

## 🤝 Service 레이어의 역할

Service 레이어는 Notification Aggregate와 외부 시스템을 조율하는 **업무 진행 책임자**입니다.

- **업무 시나리오 연결**: 
  - 초대 알림 생성 시 Organization Management Domain으로부터 초대 정보를 받아 Notification Aggregate에서 알림을 생성하고, 관련 초대 ID와 조직 정보를 함께 저장합니다.
  - 인박스 조회 시 Notification Aggregate에서 사용자별 알림 목록을 조회하고, 초대 알림의 경우 Organization Management Domain의 초대 정보와 조인하여 상세 정보를 제공합니다.
  - 알림 읽음 처리 시 Notification Aggregate에서 읽음 상태를 업데이트하고, read_at을 설정합니다.

- **규칙 준수 확인**: 
  - 알림 생성 시 수신자 유효성 검증 (User Management Domain에 사용자 존재 확인)
  - 초대 알림 생성 시 초대 존재 여부 확인 (Organization Management Domain에 초대 ID 검증)
  - 읽음 처리 시 사용자 권한 확인 (본인의 알림만 읽음 처리 가능)
  - 읽지 않은 알림 개수 일관성 유지

- **외부 파트너 연동**: 
  - User Management Domain에서 사용자 정보 조회
  - Organization Management Domain에서 초대 알림 생성 요청 수신
  - Organization Management Domain에 초대 정보 조회 요청

- **실패 대응 전략**: 
  - 알림 생성 실패 시 백그라운드에서 재시도
  - 초대 정보 조회 실패 시 기본 알림 메시지 표시
  - 읽음 처리 실패 시 사용자에게 재시도 옵션 제공

- **즐거운 사용자 경험**: 
  - 초대 알림 생성 즉시 인박스에 표시
  - 읽지 않은 알림 개수 실시간 업데이트
  - 초대 알림에서 조직 정보와 초대자 정보 명확히 표시
  - 읽음 처리 시 즉시 UI 업데이트

---

## ✅ 검증 체크리스트

### 현재 범위 (Organization 초대 알림)
- [ ] Notification Aggregate가 명확한 경계와 책임을 가지는가? 🚧
- [ ] Context 간 통합이 느슨하게 결합되어 있는가? (커맨드 실행 활용) 🚧
- [ ] Repository 패턴이 올바르게 구현되었는가? (Drizzle ORM 기반) 🚧
- [ ] Server Actions가 적절히 구현되었는가? (Next.js 기반) 🚧
- [ ] 초대 알림 생성 프로세스의 불변식이 올바르게 정의되었는가? 🚧
- [ ] 알림 읽음 상태 관리의 불변식이 올바르게 정의되었는가? 🚧
- [ ] Organization Management Domain과의 통합이 적절히 설계되었는가? 🚧
- [ ] UserNotificationView Read Model이 적절히 설계되었는가? 🚧

---

## 📊 성과 측정 지표

### 현재 범위 지표 (초대 알림)
1. **알림 생성 성공률**: 99% 이상 (초대 생성 → 알림 생성)
2. **알림 전달 지연 시간**: 평균 100ms 이하 (초대 생성부터 알림 생성까지)
3. **인박스 로딩 시간**: 평균 300ms 이하 (알림 목록 조회)
4. **읽음 처리 시간**: 평균 100ms 이하 (알림 읽음 상태 업데이트)
5. **읽지 않은 개수 일관성**: 100% (실제 알림 수와 정확히 일치)

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- Database Schema 문서: [06-db-schema.md](./06-db-schema.md)
- Organization Management Domain: [03-software-design.md](../organization-management-domain/03-software-design.md)

---

이 Software Design 문서는 Notification Management Domain의 초대 알림 기능을 정의하며, 향후 다른 알림 타입 추가 시 확장 가능한 구조를 제공합니다.

