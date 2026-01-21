# Realtime Management Domain

Supabase Realtime 기능을 추상화하여 여러 도메인에서 재사용 가능한 공통 도메인입니다.

## 개요

이 도메인은 Supabase Realtime 구독을 쉽게 설정하고 관리할 수 있는 범용 훅을 제공합니다. 외부 서비스(Supabase)의 복잡성을 내부 도메인으로 격리하여, 각 도메인에서는 간단한 인터페이스만으로 실시간 기능을 사용할 수 있습니다.

## 주요 기능

- ✅ **범용 Realtime 훅**: 어떤 테이블, 이벤트에도 사용 가능
- ✅ **자동 사용자 필터링**: `filterByCurrentUser` 옵션으로 사용자별 데이터만 구독
- ✅ **자동 인증 확인**: 내부에서 사용자 인증 상태 확인
- ✅ **자동 클린업**: 컴포넌트 언마운트 시 자동 구독 해제
- ✅ **타입 안전성**: TypeScript로 작성되어 타입 체크 지원

## 사용 예제

### 1. 사용자별 알림 구독 (현재 사용자 전용)

```tsx
import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks';

function NotificationProvider() {
  useSupabaseRealtime({
    table: 'notifications',
    event: 'INSERT',
    filterByCurrentUser: true,  // user_id로 자동 필터링
    onEvent: (payload) => {
      console.log('New notification:', payload);
      refreshNotifications();
    }
  });
  
  // ...
}
```

### 2. 특정 페이지 구독 (협업 에디터용)

```tsx
import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks';

function CollaborativePage({ pageId }: { pageId: string }) {
  useSupabaseRealtime({
    table: 'pages',
    event: '*',  // 모든 이벤트 (INSERT, UPDATE, DELETE)
    filter: `id=eq.${pageId}`,  // 특정 페이지만
    onEvent: (payload) => {
      handlePageUpdate(payload);
    }
  });
  
  // ...
}
```

### 3. 특정 테이블의 모든 변경사항 구독

```tsx
import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks';

function AdminDashboard() {
  useSupabaseRealtime({
    table: 'users',
    event: 'UPDATE',
    onEvent: (payload) => {
      console.log('User updated:', payload);
      refreshUserList();
    }
  });
  
  // ...
}
```

### 4. 조건부 구독 활성화

```tsx
import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks';

function ConditionalSubscription({ isEnabled }: { isEnabled: boolean }) {
  useSupabaseRealtime({
    table: 'messages',
    event: 'INSERT',
    enabled: isEnabled,  // 조건에 따라 구독 활성화/비활성화
    onEvent: (payload) => {
      console.log('New message:', payload);
    }
  });
  
  // ...
}
```

## API 레퍼런스

### `useSupabaseRealtime`

Supabase Realtime 구독을 관리하는 범용 React 훅입니다.

#### Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `table` | `string` | ✅ | - | 구독할 테이블 이름 |
| `event` | `'INSERT'` \| `'UPDATE'` \| `'DELETE'` \| `'*'` | ✅ | - | 감시할 이벤트 타입 |
| `schema` | `string` | ❌ | `'public'` | 스키마 이름 |
| `filter` | `string` | ❌ | - | 필터 조건 (예: `'user_id=eq.123'`) |
| `filterByCurrentUser` | `boolean` | ❌ | `false` | 현재 사용자 ID로 자동 필터링 (`user_id` 컬럼 사용) |
| `onEvent` | `(payload: any) => void` | ✅ | - | 이벤트 발생 시 호출될 콜백 함수 |
| `enabled` | `boolean` | ❌ | `true` | 구독 활성화 여부 |
| `channelName` | `string` | ❌ | `'{table}-changes'` | 채널 이름 |

#### Returns

없음 (void)

#### Notes

- 훅 내부에서 자동으로 사용자 인증을 확인합니다
- 인증되지 않은 경우 구독을 건너뜁니다
- 컴포넌트 언마운트 시 자동으로 구독을 해제합니다
- `filterByCurrentUser`와 `filter`를 동시에 사용하면 `filterByCurrentUser`가 우선됩니다

## 아키텍처 결정

### 왜 별도 도메인으로 분리했나요?

1. **재사용성**: 알림, 협업 에디터, 채팅 등 여러 도메인에서 Realtime 기능을 사용합니다
2. **유지보수성**: Supabase 관련 로직이 한 곳에 모여 있어 나중에 기술 변경 시 수정이 용이합니다
3. **관심사의 분리**: 각 도메인은 비즈니스 로직에만 집중하고, Realtime 설정은 이 도메인에 위임합니다
4. **테스트 용이성**: Realtime 로직을 mocking하기 쉬워집니다

### Backend가 없는 이유는?

Supabase Realtime은 외부 서비스이므로 우리가 직접 서버를 운영하지 않습니다. 
따라서 Backend 레이어 없이 Frontend 훅만으로 구성되어 있습니다.

## 마이그레이션 가이드

기존에 각 도메인에서 직접 Supabase Realtime을 사용하던 코드를 이 훅으로 마이그레이션하는 방법:

### Before (기존 코드)

```tsx
// notification-context.tsx
useEffect(() => {
  const supabase = createClient();

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        refreshNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  setupRealtimeSubscription();
}, [refreshNotifications]);
```

### After (리팩토링 후)

```tsx
// notification-context.tsx
import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks';

useSupabaseRealtime({
  table: 'notifications',
  event: 'INSERT',
  filterByCurrentUser: true,
  onEvent: () => {
    refreshNotifications();
  },
});
```

## 향후 개선 사항

- [ ] Realtime 연결 상태 추적 기능 추가
- [ ] 재연결 로직 개선
- [ ] 배치 이벤트 처리 옵션 추가
- [ ] Presence 기능 지원
- [ ] Broadcast 기능 지원

## 관련 문서

- [Supabase Realtime 공식 문서](https://supabase.com/docs/guides/realtime)
- [프로젝트 아키텍처 가이드](../../../docs/architecture.md)
