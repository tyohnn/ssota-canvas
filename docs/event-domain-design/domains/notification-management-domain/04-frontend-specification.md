# Notification Management Domain - Frontend Specification

이 문서는 **Notification Management Domain**의 프론트엔드 명세서입니다.
(현재는 Organization Management Domain에서 사용되는 초대 알림 기능만 정의)
**08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션을 준수하여 작성되었습니다.

### 주요 변경사항 (v2.0) - Optimistic Update 및 자동화
- **Optimistic Update**: 알림 읽음 처리 시 즉시 UI 업데이트, 실패 시 자동 롤백 ✅
- **자동 알림 읽음**: 초대 응답 시 자동으로 알림 읽음 처리 ✅
- **반응형 UX**: NEW 배지와 버튼이 즉시 사라지는 사용자 경험 개선 ✅

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: Notification Management (알림 생성, 표시, 읽음 처리)
- **현재 범위**: Organization Management Domain의 초대 알림 시스템
- **주요 기능**: 초대 알림 생성, 인박스 표시, 알림 읽음 처리
- **UI 컴포넌트**: 인박스 패널, 알림 아이템

### 현재 구현 상태
- ✅ **Phase 1**: DTO 타입 정의 완료
- ✅ **Phase 2**: React Context 구현 완료
- ✅ **Phase 3**: Server Actions 구현 완료
- ✅ **Phase 4**: Custom Hook 구현 완료
- ✅ **Phase 5**: UI 컴포넌트 구현 완료 (Organization에서 사용)

---

## 📋 1. DTO 타입 정의 (08-code-conventions.md 준수)

### 1.1 DTO 직렬화 컨벤션

**파일 위치**: `src/domains/notification-management/shared/dtos/index.ts`

#### Next.js Server Actions 직렬화 제약 준수
- **Plain Object만 사용**: 클래스, 함수, Date 객체 등 직렬화 불가능한 타입 금지
- **ISO 문자열 사용**: Date → string 변환 (예: `createdAt: string`)
- **Value Object 직렬화**: Domain Value Object → string 변환 (예: `NotificationId` → `string`)

#### 실제 구현된 DTO 타입들

##### UserNotificationView DTO
```typescript
export interface UserNotificationView {
  userId: string; // Serialized from UserId
  notifications: NotificationSummary[];
  unreadCount: number;
}

export interface NotificationSummary {
  id: string; // Serialized from NotificationId
  type: 'invitation' | 'system' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO 8601 string (serialized from Date)
  relatedData?: InvitationNotificationData;
}

export interface InvitationNotificationData {
  invitationId: string; // Serialized from InvitationId
  organizationName: string;
  inviterName: string;
  role: 'owner' | 'admin' | 'member';
}
```

##### MarkNotificationAsReadRequest DTO
```typescript
export interface MarkNotificationAsReadRequest {
  notificationId: string; // Serialized from NotificationId
}
```

##### ArchiveNotificationRequest DTO
```typescript
export interface ArchiveNotificationRequest {
  notificationId: string; // Serialized from NotificationId
}
```

### 1.2 CQRS Read/Write 분리

#### Write Side (Domain Objects)
- **Value Objects**: `NotificationId` (클래스)
- **Entities**: `Notification` (클래스)
- **Aggregates**: `NotificationAggregate` (클래스)
- **비즈니스 로직 & 불변식 검증**

#### Read Side (DTOs)
- **Read Models**: `UserNotificationView`, `NotificationSummary` (interface, plain object)
- **데이터 투영 & 최적화된 조회**

#### Next.js Server Actions Boundary
- **DTO 직렬화**: 클래스 → plain object 변환
- **Date → ISO string 변환**
- **클라이언트 전달용 타입 보장**

---

## 🎛️ 2. React Context 구현 (08-code-conventions.md 준수)

### 2.1 Context 타입 정의

**파일 위치**: `src/domains/notification-management/frontend/contexts/notification-context.tsx`

#### Context State 인터페이스
```typescript
interface NotificationContextType {
  // 상태
  notifications: NotificationSummary[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // 액션
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
}
```

#### Context Provider Props
```typescript
interface NotificationProviderProps {
  children: ReactNode;
  initialNotifications?: NotificationSummary[];
  initialUnreadCount?: number;
}
```

#### Context 설계 원칙 (08-code-conventions.md)
- **단일 책임**: 알림 상태 관리
- **상태 분리**: 로컬 상태와 전역 상태 구분
- **액션 제공**: 알림 CRUD 작업을 위한 메소드
- **에러 처리**: 사용자 친화적 에러 메시지
- **성능 최적화**: useCallback, useMemo 활용

### 2.2 Provider 구현

**파일 위치**: `src/domains/notification-management/frontend/contexts/notification-context.tsx`

#### 주요 기능
- **상태 관리**: useState를 사용한 notifications, unreadCount, isLoading, error 상태 관리
- **초기 데이터 로드**: Provider 마운트 시 알림 목록 자동 조회
- **에러 처리**: API 호출 실패 시 에러 상태 설정

#### 핵심 로직
- **refreshNotifications**: Server Action을 호출하여 알림 목록 조회 및 상태 업데이트
- **markAsRead**: 알림 읽음 처리 및 읽지 않은 개수 업데이트 ✅ IMPROVED
  - Optimistic update: 즉시 UI 상태 변경 (isRead: true, unreadCount 감소)
  - 서버 요청 후 실패 시 refreshNotifications로 롤백
  - 사용자가 즉각적인 피드백을 받을 수 있음
- **archiveNotification**: 알림 보관처리

---

## ⚡ 3. Server Actions 구현 (08-code-conventions.md 준수)

### 3.1 Server Actions 구조

**파일 위치**: `src/domains/notification-management/actions/notification-management.actions.ts`

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
    const notificationRepository = new DrizzleNotificationRepository();
    const service = new NotificationManagementService(notificationRepository);

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

##### getUserNotificationsAction
- **역할**: 사용자 알림 목록을 조회하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 사용자 알림 목록 조회, 읽지 않은 개수 계산, 초대 관련 데이터 조인
- **반환**: UserNotificationView DTO
- **입력**: 없음 (현재 사용자 기준)

##### markNotificationAsReadAction
- **역할**: 알림을 읽음 처리하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 알림 읽음 상태 업데이트, 읽은 시간 기록
- **반환**: void (성공/실패만 반환)
- **입력**: notificationId (string)

##### archiveNotificationAction
- **역할**: 알림을 보관처리하는 Server Action
- **인증**: Supabase Auth를 통한 사용자 인증 확인
- **로직**: 알림 보관 상태 업데이트 또는 삭제
- **반환**: void (성공/실패만 반환)
- **입력**: notificationId (string)

#### 핵심 원칙 (08-code-conventions.md)
- **DTO 반환**: Domain Objects를 직렬화하여 반환
- **Command 객체**: Software Design의 Command를 그대로 활용
- **Service Layer**: 비즈니스 로직은 Service에서 처리
- **에러 전파**: try-catch로 에러를 catch하고 throw로 전파
- **revalidatePath**: 데이터 변경 시 관련 페이지 재검증

### 3.2 에러 처리 (08-code-conventions.md 준수)

**파일 위치**: `src/domains/notification-management/shared/errors/notification-management.error.ts`

#### 에러 처리 원칙
- **도메인 에러**: 비즈니스 규칙 위반 + 사용자 친화적 메시지
- **시스템 에러**: 인프라/외부 서비스 문제
- **검증 에러**: 입력 데이터 유효성 검사 실패
- **에러 분류**: 타입별로 적절한 처리 방식 적용

#### 실제 구현된 에러 클래스
- **NotificationManagementError**: 알림 관리 도메인의 기본 에러 클래스
- **NotificationManagementErrorCode**: 에러 코드 열거형
- **ERROR_MESSAGES**: 에러 메시지 매핑 (한국어 지원)

---

## 🎣 4. Custom Hook 구현 (08-code-conventions.md 준수)

### 4.1 Hook 구조

**파일 위치**: `src/domains/notification-management/frontend/hooks/use-notification.ts`

#### Hook 설계 원칙 (08-code-conventions.md)
- **Context 확장**: 기존 Context 기능을 활용
- **비즈니스 로직**: 알림 필터링, 상태 계산 등
- **액션 래퍼**: Context 액션 + 로컬 상태 업데이트
- **에러 처리**: 로컬 에러와 전역 에러 구분
- **성능 최적화**: useMemo, useCallback 활용

#### 실제 구현된 useNotification Hook

##### 주요 기능
- **Context 연동**: NotificationContext를 사용하여 알림 관련 상태와 액션에 접근
- **상태 제공**: notifications, unreadCount, isLoading, error 상태 제공
- **액션 제공**: refreshNotifications, markAsRead, archiveNotification 액션 제공
- **유틸리티 함수**: 알림 관련 편의 함수들 제공

##### 제공하는 상태
- **notifications**: NotificationSummary[] - 알림 목록
- **unreadCount**: number - 읽지 않은 알림 개수
- **isLoading**: boolean - 로딩 상태
- **error**: string | null - 에러 상태

##### 제공하는 액션
- **refreshNotifications**: 알림 목록 조회
- **markAsRead**: 알림 읽음 처리
- **archiveNotification**: 알림 보관처리

##### 유틸리티 함수
- **getInvitationNotifications**: 초대 알림만 필터링
- **getUnreadNotifications**: 읽지 않은 알림만 필터링
- **hasUnreadNotifications**: 읽지 않은 알림 존재 여부

---

## 🧩 5. React Components 구현 (08-code-conventions.md 준수)

### 5.1 컴포넌트 구조

**파일 위치**: `src/domains/notification-management/frontend/components/`

#### 컴포넌트 설계 원칙 (08-code-conventions.md)
- **단일 책임**: 하나의 UI 기능만 담당
- **Props 인터페이스**: 명확한 타입 정의
- **상태 관리**: Custom Hook 활용
- **에러 처리**: 사용자 친화적 에러 표시
- **로딩 상태**: 적절한 로딩 인디케이터
- **접근성**: ARIA 속성 및 키보드 네비게이션
- **반응형**: 모바일 및 데스크톱 대응

#### 실제 구현된 컴포넌트들

##### InboxPanel
- **위치**: `src/domains/notification-management/frontend/components/inbox-panel.tsx`
- **역할**: 인박스 알림 패널 (사이드바 우측에 absolute로 표시)
- **기능**: 
  - 사이드바 우측 위치로 표시
  - 알림 목록 표시 (생성 시간 역순)
  - 읽지 않은 알림 개수 배지 표시
  - 알림별 읽음 처리, 보관처리 버튼 (호버 시 표시)
  - 초대 알림의 경우 Organization Management Domain의 응답 액션 연동
- **사용 Hook**: useNotification Hook 사용
- **UI**: shadcn/ui의 Sheet, ScrollArea, Badge, Button 컴포넌트 사용
- **Props**:
  ```typescript
  interface InboxPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvitationRespond?: (invitationId: string, accept: boolean) => Promise<void>;
  }
  ```

##### NotificationItem
- **위치**: `src/domains/notification-management/frontend/components/notification-item.tsx`
- **역할**: 개별 알림 아이템 컴포넌트
- **기능**: 
  - 알림 타입별 다른 표시 (초대 알림, 시스템 알림 등)
  - 마우스 호버 시 읽음 처리, 보관처리 버튼 표시
  - 초대 알림의 경우 조직 정보와 초대자 정보 표시
  - 읽음/읽지 않음 상태 표시
  - **자동 알림 읽음**: 초대 응답 후 자동으로 markAsRead 호출 ✅ NEW
    - handleInvitationResponse에서 초대 응답 성공 후 자동 읽음 처리
    - NEW 배지와 버튼이 즉시 사라지는 UX
- **사용 Hook**: useNotification Hook 사용
- **UI**: shadcn/ui의 Card, Button, Badge 컴포넌트 사용
- **Props**:
  ```typescript
  interface NotificationItemProps {
    notification: NotificationSummary;
    onMarkAsRead: (notificationId: string) => Promise<void>;
    onArchive: (notificationId: string) => Promise<void>;
    onInvitationRespond?: (invitationId: string, accept: boolean) => Promise<void>;
  }
  ```

##### InboxButton
- **위치**: `src/domains/notification-management/frontend/components/inbox-button.tsx`
- **역할**: 사이드바 인박스 버튼 컴포넌트
- **기능**: 
  - 읽지 않은 알림 개수 배지 표시
  - 클릭 시 InboxPanel 열기
  - 실시간 알림 개수 업데이트
- **사용 Hook**: useNotification Hook 사용
- **UI**: shadcn/ui의 Button, Badge 컴포넌트 사용

### 5.2 Hook 사용 패턴

#### Hook 사용 원칙 (08-code-conventions.md)
- **컴포넌트에서 직접 Context 접근 금지**: 반드시 Custom Hook을 통해 접근
- **DTO 데이터 기반 UI 렌더링**: 직렬화된 데이터를 기반으로 UI 구성
- **에러 상태 활용**: Hook에서 제공하는 에러 상태를 사용자 친화적으로 표시
- **로딩 상태 처리**: Hook에서 제공하는 로딩 상태를 적절히 처리

#### 실제 구현 예시
```typescript
// InboxPanel에서 useNotification Hook 사용
export function InboxPanel({ open, onOpenChange, onInvitationRespond }: InboxPanelProps) {
  const { notifications, unreadCount, markAsRead, archiveNotification } = useNotification();
  
  // Hook에서 제공하는 상태와 액션을 직접 사용
  // Context에 직접 접근하지 않음
}

// NotificationItem에서 useNotification Hook 사용 (v2.0 개선)
export function NotificationItem({ notification, onMarkAsRead, onInvitationRespond }: NotificationItemProps) {
  const handleInvitationResponse = async (accept: boolean) => {
    if (!notification.relatedId || !onInvitationRespond) return;

    setIsProcessing(true);
    try {
      // 1. 초대 응답 처리
      await onInvitationRespond(notification.relatedId, accept);
      
      // 2. 알림을 자동으로 읽음 처리 (Optimistic) ✅ NEW
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 초대 알림의 경우 onInvitationRespond 콜백 사용 (Organization Domain에서 전달)
  // 응답 후 자동으로 알림 읽음 처리
}
```

### 5.3 Organization Management Domain과의 통합

#### 초대 응답 처리 (v2.0 개선)
- **NotificationItem**: 초대 알림의 승낙/거절 버튼 클릭 시 `onInvitationRespond` 콜백 호출
- **자동 알림 읽음**: 초대 응답 후 자동으로 `markAsRead` 호출 ✅ NEW
- **Organization Domain**: `respondToInvitationAction` Server Action 제공
- **통합**: InboxPanel의 props로 Organization Domain의 액션 전달

```typescript
// Organization Management Domain에서 InboxPanel 사용
import { InboxPanel } from '@/domains/notification-management/frontend/components/inbox-panel';

export function SidebarHeaderGroup() {
  const handleInvitationRespond = async (invitationId: string, accept: boolean) => {
    // Organization Management Domain의 respondToInvitationAction 호출
    await respondToInvitationAction({ invitationId, accept });
  };

  return (
    <InboxPanel 
      open={inboxOpen} 
      onOpenChange={setInboxOpen}
      onInvitationRespond={handleInvitationRespond}
    />
  );
}
```

---

## 🔗 6. 앱 레벨 통합 (08-code-conventions.md 준수)

### 6.1 Provider 통합 설계

**파일 위치**: `src/app/layout.tsx`

#### Provider 중첩 순서 (08-code-conventions.md)
- **의존성이 적은 도메인부터 상위에 배치**
- **Notification Provider는 독립적으로 동작**
- **각 도메인 Provider는 독립적으로 동작**

#### 실제 구현된 Provider 구조
- **NotificationProvider**: 알림 관련 상태 관리를 위한 Provider
- **Organization/User Provider와 독립적**: 다른 Provider와 의존성 없음

#### 초기 데이터 전달 (08-code-conventions.md)
- **Server Components에서 Server Actions 호출**
- **초기 데이터를 Provider에 props로 전달**
- **클라이언트에서 추가 로딩 최소화**

---

## 📊 7. 구현 완료 체크리스트 (08-code-conventions.md 기준)

### 7.1 DTO 타입 정의 완료 확인
- [x] **DTO 인터페이스**: Plain Object로 정의 완료
- [x] **Date 직렬화**: ISO 문자열로 변환 완료
- [x] **Value Object 직렬화**: string으로 변환 완료
- [x] **Next.js Server Actions 직렬화 제약 준수**: 완료
- [x] **UserNotificationView**: 알림 시스템용 DTO 추가 완료
- [x] **NotificationSummary**: 알림 아이템용 DTO 추가 완료
- [x] **InvitationNotificationData**: 초대 알림 상세용 DTO 추가 완료

### 7.2 Context 구현 완료 확인
- [x] **도메인별 독립적인 Context**: NotificationContext 구현 완료
- [x] **알림 목록 상태 관리**: 완료
- [x] **읽지 않은 개수 추적**: 완료
- [x] **초기 데이터 로드 로직**: Provider 마운트 시 자동 조회 구현 완료

### 7.3 Server Actions 구현 완료 확인
- [x] **Supabase Auth 인증 확인**: 모든 액션에서 구현 완료
- [x] **의존성 주입 패턴**: Service Layer 사용 완료
- [x] **Command 객체 활용**: 입력 구조화 완료
- [x] **DTO 직렬화**: Service Layer에서 DTO 반환 완료
- [x] **revalidatePath**: 관련 페이지 재검증 완료
- [x] **알림 조회**: getUserNotificationsAction 구현 완료
- [x] **알림 읽음 처리**: markNotificationAsReadAction 구현 완료
- [x] **알림 보관**: archiveNotificationAction 구현 완료

### 7.4 Hook 구현 완료 확인
- [x] **Context 추상화**: useNotification Hook 구현 완료
- [x] **비즈니스 로직 메서드**: 알림 관련 편의 함수들 구현 완료
- [x] **유틸리티 함수**: 알림 필터링, 읽지 않은 알림 확인 등 구현 완료
- [x] **에러 상태 처리**: 적절히 처리 완료

### 7.5 컴포넌트 연동 완료 확인
- [x] **Hook 사용**: 컴포넌트에서 useNotification Hook 사용
- [x] **인박스 패널**: InboxPanel 구현 완료
- [x] **알림 아이템**: NotificationItem 구현 완료
- [x] **인박스 버튼**: InboxButton 구현 완료
- [x] **로딩 상태와 에러 상태 처리**: 적절히 처리 완료
- [x] **Organization Domain 통합**: 초대 응답 콜백 통합 완료

### 7.6 앱 통합 완료 확인
- [x] **Provider 중첩 순서**: 적절한 순서로 배치 완료
- [x] **초기 데이터**: Server Components에서 전달 완료
- [x] **페이지별 Hook 사용**: 필요한 Hook만 선택적으로 사용 완료
- [x] **NotificationProvider**: 알림 상태 Provider 통합 완료
- [x] **Organization Domain 통합**: InboxPanel을 Organization에서 사용

---

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

- **Software Design 문서**: `./03-software-design.md` ✅
  - Notification Aggregate 정의 확인 완료
  - 비즈니스 규칙 및 정책 참조 완료
  - Read Models 확인 완료

### 8.2 기술 스택 참조 (실제 구현)
- **Next.js 14**: App Router, Server Actions ✅
- **React 18**: Context API, useState, useEffect ✅
- **TypeScript**: DTO 인터페이스, Value Objects, Entity 클래스 ✅
- **UI 라이브러리**: shadcn/ui 컴포넌트 (Sheet, Card, Badge 등) ✅
- **상태 관리**: React Context + Custom Hooks 패턴 ✅
- **인증**: Supabase Auth ✅
- **ORM**: Drizzle ORM + Supabase ✅

### 8.3 실제 폴더 구조 (08-code-conventions.md 준수)
```
src/
├── domains/notification-management/
│   ├── shared/                     # 공유 도메인 객체들
│   │   ├── entities/               # Entity 클래스들
│   │   │   └── notification.entity.ts
│   │   ├── value-objects/          # Value Objects
│   │   │   └── ids.vo.ts
│   │   ├── aggregates/             # Aggregate 클래스들
│   │   │   └── notification.aggregate.ts
│   │   ├── dtos/                   # DTO 타입들 (직렬화 가능)
│   │   │   └── index.ts
│   │   ├── commands/               # Command 인터페이스들
│   │   │   └── index.ts
│   │   ├── events/                 # Event 클래스들
│   │   │   └── index.ts
│   │   ├── errors/                 # 에러 타입
│   │   │   └── notification-management.error.ts
│   │   └── types/                  # 공통 타입들
│   │       └── index.ts
│   ├── backend/                    # 백엔드 레이어
│   │   ├── services/               # 서비스 클래스들
│   │   ├── repositories/           # 리포지토리 구현체들
│   │   └── read-models/            # Read Model 클래스들
│   ├── actions/                    # Server Actions
│   │   └── notification-management.actions.ts
│   └── frontend/                   # 프론트엔드 레이어
│       ├── contexts/               # React Context
│       │   └── notification-context.tsx
│       ├── hooks/                  # Custom Hooks
│       │   └── use-notification.ts
│       └── components/             # UI 컴포넌트
│           ├── inbox-panel.tsx
│           ├── notification-item.tsx
│           └── inbox-button.tsx
```

### 8.4 현재 구현 상태 (08-code-conventions.md 기준)
1. ✅ **DTO 직렬화**: Plain Object, ISO 문자열, Value Object 직렬화 완료
2. ✅ **React Context**: NotificationContext 구현 완료
   - **Optimistic Update 적용** ✅ v2.0
3. ✅ **Server Actions**: 표준 패턴 준수, DTO 반환 완료
4. ✅ **Custom Hook**: useNotification Hook 구현 완료
5. ✅ **React Components**: InboxPanel, NotificationItem, InboxButton 구현 완료
   - **자동 알림 읽음 처리** ✅ v2.0
6. ✅ **앱 통합**: Provider 설정 완료
7. ✅ **Organization Domain 통합**: 초대 알림 시스템 완전 통합
   - **조직 목록 자동 새로고침** ✅ v2.0

### 8.5 다음 단계 우선순위
1. **완료**: 초대 알림 시스템 구현 완료
2. **다음 스프린트**: 시스템 알림 추가
3. **다음 스프린트**: 공지사항 알림 추가
4. **다음 스프린트**: 알림 설정 기능 추가

---

## 🎯 초대 알림 시스템 구현 상세

### 9.1 UI/UX 요구사항 구현

#### 인박스 시스템
- **위치**: 사이드바에 인박스 버튼, 클릭 시 사이드바 우측에 absolute 위치로 패널 표시
- **기능**: 
  - 읽지 않은 알림 개수 배지 표시
  - 알림 타입별 다른 표시 (현재는 조직 초대 알림만)
  - 마우스 호버 시 읽음 처리, 보관처리 버튼 표시
  - 초대 알림의 경우 승낙/거절 버튼 제공 (Organization Domain 액션 사용)

#### 초대 알림 표시
- **알림 제목**: "[초대자 이름]님이 조직에 초대했습니다"
- **알림 내용**: "[조직 이름] 조직의 [역할]로 초대되었습니다"
- **액션 버튼**: 승낙, 거절 (Organization Management Domain의 respondToInvitationAction 호출)

### 9.2 컴포넌트 상호작용 플로우

#### 알림 조회 플로우
1. **인박스 버튼 클릭** → InboxPanel 열기
2. **알림 목록 로드** → getUserNotificationsAction 호출
3. **알림 표시** → NotificationItem 컴포넌트 렌더링

#### 알림 읽음 처리 플로우
1. **알림 호버** → 읽음 처리 버튼 표시
2. **읽음 버튼 클릭** → markNotificationAsReadAction 호출
3. **상태 업데이트** → 읽지 않은 개수 감소, UI 업데이트

#### 초대 응답 플로우
1. **초대 알림 확인** → 조직 정보, 초대자 정보 표시
2. **승낙/거절 선택** → Organization Domain의 respondToInvitationAction 호출
3. **알림 정리** → 알림 목록 갱신

### 9.3 성능 최적화

#### 알림 조회 최적화
- **인덱싱**: user_id, is_read, created_at 복합 인덱스
- **정렬**: 생성 시간 역순 (최신 알림 우선)
- **제한**: 최근 50개 알림만 로드

#### 상태 업데이트 (v2.0 개선)
- **Optimistic Update 적용**: 읽음 처리 시 즉시 UI 업데이트 ✅
  - markAsRead 호출 시 즉시 isRead: true로 변경
  - unreadCount 즉시 감소
  - 서버 요청 완료 전 사용자가 즉각적인 피드백 받음
- **자동 에러 롤백**: 실패 시 refreshNotifications로 서버 상태 복원 ✅
- **자동 알림 읽음**: 초대 응답 시 자동으로 markAsRead 호출 ✅
  - 사용자가 수동으로 읽음 처리할 필요 없음
  - NEW 배지와 버튼이 즉시 사라지는 UX

---

이 Frontend Specification은 **Notification Management Domain**의 현재 구현 상태를 **08-code-conventions.md**와 **06-frontend-specification-guide.md**의 컨벤션에 맞춰 정확히 반영한 문서입니다. (현재는 Organization Management Domain의 초대 알림 시스템만 지원)


