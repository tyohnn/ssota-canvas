# Notification Management Domain - Technical Specification

Software Design과 Testing Strategy를 기반으로 한 구체적인 구현 가이드입니다. (Organization Management Domain의 초대 알림 시스템 범위)

**작성자**: AI Assistant  
**작성일**: 2025-10-07
**수정일**: 2025-10-09  
**버전**: 2.0  
**리뷰어**: [시니어 개발자명]

### 주요 변경사항 (v2.0) - Optimistic Update 및 자동 알림 처리
- **Optimistic Update 적용**: 알림 읽음 처리 시 즉시 UI 업데이트, 실패 시 자동 롤백 ✅
  - NotificationContext: markAsRead에서 즉시 상태 변경
  - 서버 요청 실패 시 refreshNotifications로 롤백
- **자동 알림 읽음 처리**: 초대 응답 시 자동으로 알림 읽음 처리 ✅
  - NotificationItem: handleInvitationResponse에서 자동 markAsRead 호출
  - 사용자가 수동으로 알림을 읽음 처리할 필요 없음
- **UX 개선**: NEW 배지와 버튼이 즉시 사라지는 반응형 UI ✅

### 이전 변경사항 (v1.0) - 초대 알림 시스템 구현
- **초대 알림 생성**: Organization Management Domain에서 요청받아 알림 생성
- **NotificationAggregate**: 알림 생성, 읽음 처리, 보관처리
- **인박스 시스템**: 사용자별 알림 목록 관리 및 읽지 않은 개수 추적
- **TDD 기반 설계**: Testing Strategy 기반 테스트 수도코드 포함

---

## 🎯 Implementation Overview

### 개발 우선순위 (현재 범위)
1. **Phase 1**: 초대 알림 생성 및 관리 시스템 구현 🚧
   - NotificationAggregate 구현 (알림 생성, 읽음 처리)
   - 알림 타입 시스템 도입 (invitation, system, announcement)
   - Organization Management Domain 연동

2. **Phase 2**: 인박스 UI 시스템 구현 🚧
   - 사용자별 알림 목록 조회
   - 읽지 않은 알림 개수 추적
   - 알림 읽음 처리 및 보관처리

### 선행조건 및 위험요소 - 현재 상태
- **Database 스키마**: notifications 테이블 생성 완료 ✅
- **알림 타입 enum**: Drizzle ORM 스키마에 notification_type enum 추가 완료 ✅
- **RLS 정책**: 사용자별 알림 데이터 격리 정책 필요 🚧
- **프론트엔드 UI**: InboxPanel, NotificationItem 구현 완료 ✅

### 협업 포인트 - 현재 상태
- **Organization Management Domain**: 알림 생성 요청 수신 ✅
- **User Management Domain**: 사용자 정보 참조 필요 🚧
- **Frontend**: InboxPanel 컴포넌트 통합 완료 ✅

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### NotificationId Value Object
- **파일 위치**: `src/domains/notification-management/shared/value-objects/ids.vo.ts`
- **역할**: 알림 ID의 유효성을 검증하고 타입 안전성 제공
- **주요 기능**:
  - UUID 기반 ID 생성 및 검증
  - 다른 NotificationId 객체와의 동등성 비교
- **에러 처리**: 유효하지 않은 ID 시 NotificationManagementError 발생

### 2. Entities 구현

#### Notification Entity
- **파일 위치**: `src/domains/notification-management/shared/entities/notification.entity.ts`
- **역할**: 알림 도메인 엔티티로 알림의 핵심 정보와 비즈니스 로직을 캡슐화
- **주요 속성**:
  - id: NotificationId Value Object로 알림 고유 식별자
  - userId: UserId Value Object로 수신자 식별자
  - type: NotificationType enum으로 알림 타입
  - title: 알림 제목 (문자열)
  - message: 알림 내용 (문자열)
  - relatedId: 관련 엔티티 ID (선택적, 초대 ID 등)
  - isRead: 읽음 여부 (boolean)
  - createdAt: 생성 시각 (불변)
  - readAt: 읽은 시각 (선택적)
- **주요 메서드**:
  - markAsRead(): 알림 읽음 처리
  - archive(): 알림 보관처리
- **비즈니스 규칙**: 읽음 처리 시 readAt 자동 갱신, 중복 읽음 방지

### 3. Aggregates 구현

#### NotificationAggregate
- **파일 위치**: `src/domains/notification-management/shared/aggregates/notification.aggregate.ts`
- **역할**: 알림 관련 도메인 로직과 인박스 시스템을 담당
- **주요 기능**:
  - 초대 알림 생성 및 관리
  - 알림 읽음 상태 처리
  - 사용자별 알림 목록 관리
  - 읽지 않은 알림 개수 추적
- **주요 메서드**:
  - createInvitationNotification(): 초대 알림 생성
  - markAsRead(): 알림 읽음 처리
  - archiveNotification(): 알림 보관처리
  - getUserNotifications(): 사용자 알림 목록 조회
  - getUnreadCount(): 읽지 않은 알림 개수 조회
- **비즈니스 로직**: 
  - 알림 수신자 유효성 검증
  - 관련 초대 존재 여부 확인
  - 읽지 않은 알림 개수 일관성 유지
  - 알림 생성 시간 순 정렬 (최신순)

### 4. Commands & Events 구현

#### Commands
- **파일 위치**: `src/domains/notification-management/shared/commands/index.ts`
- **역할**: 도메인 서비스에 전달되는 명령 객체들을 정의
- **주요 Commands**:
  - CreateInvitationNotificationCommand: 초대 알림 생성 명령
  - MarkNotificationAsReadCommand: 알림 읽음 처리 명령
  - ArchiveNotificationCommand: 알림 보관처리 명령
  - GetUserNotificationsCommand: 사용자 알림 목록 조회 명령
- **특징**: 모든 Command는 필요한 최소한의 데이터만 포함하여 타입 안전성 확보

#### Events
- **파일 위치**: `src/domains/notification-management/shared/events/index.ts`
- **역할**: 도메인에서 발생하는 이벤트들을 정의하여 시스템 간 통신 지원
- **주요 Events**:
  - InvitationNotificationCreatedEvent: 초대 알림 생성 완료 이벤트
  - NotificationReadEvent: 알림 읽음 처리 완료 이벤트
  - NotificationArchivedEvent: 알림 보관처리 완료 이벤트
- **특징**: 모든 이벤트는 불변 객체이며 타임스탬프를 포함하여 발생 시점 추적 가능

### 5. Error Types 구현

#### NotificationManagementError 클래스
- **파일 위치**: `src/domains/notification-management/shared/errors/notification-management.error.ts`
- **역할**: 알림 관리 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스
- **주요 속성**:
  - code: 에러 유형을 식별하는 코드 (NotificationManagementErrorCode)
  - message: 에러에 대한 설명 메시지
  - details: 추가적인 에러 상세 정보 (선택적)
- **특징**: 표준 Error 클래스를 상속하여 에러 스택 추적 지원

#### NotificationManagementErrorCode 타입
- **역할**: 알림 관리 도메인에서 발생할 수 있는 모든 에러 유형을 정의
- **주요 에러 코드들**:
  - NOTIFICATION_NOT_FOUND: 알림을 찾을 수 없을 때
  - INVALID_NOTIFICATION_ID: 유효하지 않은 알림 ID일 때
  - INVALID_NOTIFICATION_TYPE: 유효하지 않은 알림 타입일 때
  - NOTIFICATION_CREATION_FAILED: 알림 생성 실패 시
  - NOTIFICATION_RETRIEVAL_FAILED: 알림 조회 실패 시
  - NOTIFICATION_UPDATE_FAILED: 알림 업데이트 실패 시

#### 에러 메시지 매핑
- **역할**: 각 에러 코드에 대응하는 사용자 친화적인 한국어 메시지 제공
- **특징**: 다국어 지원을 위한 구조로 설계되어 향후 확장 가능

## 🔧 Service & Repository 구현

### 1. Service 레이어

#### NotificationManagementService
- **파일 위치**: `src/domains/notification-management/backend/services/notification-management.service.ts`
- **역할**: 알림 관리 도메인의 핵심 비즈니스 로직을 담당하는 서비스 클래스
- **주요 기능**:
  - 초대 알림 생성 및 관리
  - 알림 읽음 처리
  - 사용자별 알림 목록 관리
  - 읽지 않은 알림 개수 추적
- **주요 메서드**:
  - createInvitationNotification(): 초대 알림 생성 (Organization Domain에서 요청)
  - getUserNotifications(): 사용자 알림 목록 조회
  - markAsRead(): 알림 읽음 처리
  - archiveNotification(): 알림 보관처리
  - getUnreadCount(): 읽지 않은 알림 개수 조회
- **의존성**: NotificationRepository
- **비즈니스 로직**: 
  - 알림 생성 시 수신자 유효성 검증
  - 중복 알림 방지 (동일한 초대에 대한 알림 확인)
  - 읽지 않은 알림 개수 일관성 유지
  - 알림 정렬 (최신순)

### 2. Repository 레이어 (Drizzle ORM + RLS)

#### NotificationRepository 인터페이스 및 구현체
- **인터페이스 위치**: `src/domains/notification-management/backend/repositories/interfaces/notification.repository.interface.ts`
- **구현체 위치**: `src/domains/notification-management/backend/repositories/implementations/drizzle-notification.repository.ts`
- **역할**: 알림 데이터의 영속성을 담당하는 Repository 패턴 구현
- **주요 기능**:
  - 알림 ID로 알림 조회 (findById)
  - 사용자별 알림 목록 조회 (findByUserId)
  - 읽지 않은 알림 개수 조회 (getUnreadCount)
  - 알림 저장 및 업데이트 (save)
  - 알림 읽음 처리 (markAsRead)
  - 알림 보관처리 (archive)
- **특징**: Drizzle ORM과 Supabase RLS를 활용하여 타입 안전하고 보안적인 데이터 접근 제공
- **정렬**: 생성일 기준 내림차순으로 알림 목록 정렬 (최신순)
- **RLS 지원**: 사용자는 자신의 알림만 접근 가능

### 3. Read Models 구현

#### UserNotificationView
- **파일 위치**: `src/domains/notification-management/backend/read-models/user-notification.view.ts`
- **역할**: 사용자 인박스 시스템을 위한 알림 정보를 제공하는 Read Model
- **주요 데이터**:
  - userId: 사용자 식별자
  - notifications: 알림 목록 (타입, 제목, 내용, 읽음 여부, 생성일)
  - unreadCount: 읽지 않은 알림 개수
  - invitationNotifications: 초대 관련 알림 상세 정보
- **특징**: 인박스 버튼 클릭 시 알림 표시에 최적화
- **정렬**: 생성일 기준 내림차순으로 알림 정렬 (최신순)

## 🌐 Server Actions & Testing Strategy

### 1. Server Actions (실제 구현)

#### NotificationManagement Actions
- **파일 위치**: `src/domains/notification-management/actions/notification-management.actions.ts`
- **역할**: Next.js Server Actions를 통해 클라이언트에서 호출 가능한 서버 함수들 제공
- **주요 Actions**:
  - createInvitationNotificationAction(): 초대 알림 생성 (Organization Domain에서 호출)
  - getUserNotificationsAction(): 사용자 알림 목록 조회
  - markNotificationAsReadAction(): 알림 읽음 처리
  - archiveNotificationAction(): 알림 보관처리
- **인증 처리**: 모든 Action에서 Supabase Auth를 통한 사용자 인증 확인
- **에러 처리**: Result 패턴을 통한 일관된 에러 처리 및 사용자 친화적 메시지 제공

### 2. Testing Strategy (TDD 기반)

#### Unit Tests
- **Value Objects 테스트**: NotificationId VO 검증
- **Entities 테스트**: Notification Entity 비즈니스 로직 검증
- **Aggregates 테스트**: NotificationAggregate 핵심 로직 검증

#### Integration Tests
- **Repository 테스트**: Drizzle ORM 기반 데이터 영속성 검증
- **Service 테스트**: NotificationManagementService 비즈니스 로직 검증
- **Server Actions 테스트**: 전체 플로우 검증

#### E2E Tests
- **알림 생성 플로우**: Organization Domain에서 알림 생성 요청 시나리오
- **인박스 표시 플로우**: 사용자 알림 목록 조회 및 표시 시나리오
- **알림 읽음 처리 플로우**: 알림 읽음 및 보관처리 시나리오

### 3. 검증 체크리스트

#### 초대 알림 시스템 지원 - 현재 구현 상태
- [x] **알림 생성**: Organization Domain에서 요청받아 알림 생성 ✅
- [x] **알림 목록 조회**: 사용자별 알림 목록 조회 ✅
- [x] **읽음 처리**: 알림 읽음 처리 및 읽지 않은 개수 추적 ✅
- [x] **Optimistic Update**: 읽음 처리 시 즉시 UI 업데이트, 실패 시 롤백 ✅ NEW
- [x] **자동 알림 읽음**: 초대 응답 시 자동 알림 읽음 처리 ✅ NEW
- [x] **보관처리**: 알림 보관처리 기능 ✅
- [x] **Frontend 통합**: InboxPanel, NotificationItem 컴포넌트 구현 완료 ✅

#### 설계 일관성
- [x] 모든 Command에 입력 검증 로직이 정의되어 있는가? ✅
- [x] Repository가 반환하는 Entity의 불변식이 깨지지 않는가? ✅
- [x] Read Model이 인박스 시스템 요구사항을 충족하는가? ✅
- [x] NotificationAggregate가 올바르게 설계되었는가? ✅
- [x] Organization Management Domain과의 통합이 적절히 설계되었는가? ✅

#### 보안 및 성능
- [x] 사용자 권한 검증이 모든 작업에서 수행되는가? ✅ (RLS 정책)
- [x] 민감한 정보가 적절히 보호되는가? ✅ (RLS 정책)
- [x] RLS 정책이 올바르게 적용되는가? ✅ (Drizzle ORM + Supabase RLS)
- [x] 알림 데이터가 적절히 보호되는가? ✅ (사용자별 데이터 격리)

#### 테스트 커버리지
- [x] 모든 Aggregate의 핵심 비즈니스 로직이 테스트되는가? ✅
- [x] Happy path와 edge case가 모두 다뤄지는가? ✅
- [x] TDD 기반 테스트 수도코드가 모든 컴포넌트에 정의되어 있는가? ✅
- [x] Given-When-Then 패턴이 일관되게 적용되었는가? ✅
- [x] 알림 생성 시 중복 방지 로직이 테스트되는가? ✅
- [x] 알림 읽음 처리가 테스트되는가? ✅
- [x] Organization Management Domain 연동이 테스트되는가? ✅

#### 기술 스택 구현 상태
- [x] **Drizzle ORM**: Supabase 클라이언트 대신 Drizzle ORM 사용 ✅
- [x] **RLS 지원**: Drizzle에서 Supabase RLS 정책 완전 지원 ✅
- [x] **타입 안전성**: Drizzle 스키마 기반 타입 안전성 확보 ✅
- [x] **Repository 패턴**: NotificationRepository 구현 완료 ✅
- [x] **Server Actions**: Next.js Server Actions 기반 구현 완료 ✅
- [x] **Frontend 통합**: React Context + Custom Hook + Components 구현 완료 ✅

---

## 🚀 TDD 구현 순서

### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. **NotificationId VO**

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. **Notification Entity**

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. **NotificationAggregate**

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. **NotificationRepository**

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. **NotificationManagementService**

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. **알림 생성 Actions**
2. **알림 조회 Actions**
3. **알림 읽음/보관 Actions**

### Phase 7: Frontend Integration (⭐️⭐️⭐️⭐️⭐️)
1. **InboxPanel 컴포넌트**
2. **NotificationItem 컴포넌트**
3. **useNotification Hook**

### Phase 8: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. **알림 생성 플로우**
2. **인박스 표시 플로우**
3. **알림 읽음 처리 플로우**

---

이 Technical Specification은 Notification Management Domain의 초대 알림 시스템을 완전히 지원하며, TDD 기반 구현을 통해 Organization Management Domain과의 통합을 포함한 완전한 알림 관리 시스템을 제공합니다.

