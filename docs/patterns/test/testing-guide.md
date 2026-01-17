# Testing Guide

이 문서는 SSOTA 프로젝트에서 사용하는 테스트 전략과 패턴을 설명합니다.

## 목차

1. [테스트 피라미드](#테스트-피라미드)
2. [테스트 종류](#테스트-종류)
3. [Mock vs 실제 Import](#mock-vs-실제-import)
4. [프론트엔드 테스트](#프론트엔드-테스트)
5. [백엔드 테스트](#백엔드-테스트)
6. [테스트 파일 구조](#테스트-파일-구조)
7. [베스트 프랙티스](#베스트-프랙티스)

---

## 테스트 피라미드

```
        /\
       /E2E\          ← 적게 (10%)
      /------\
     /Integration\    ← 중간 (20%)
    /------------\
   /   Unit Tests   \ ← 많게 (70%)
  /------------------\
```

### 비율 설명

- **Unit Tests (70%)**: 가장 많은 테스트. 빠르고 격리된 테스트
- **Integration Tests (20%)**: 여러 모듈이 함께 동작하는지 테스트
- **E2E Tests (10%)**: 전체 플로우를 사용자 관점에서 테스트

---

## 테스트 종류

### 1. 단위 테스트 (Unit Test)

**특징:**
- 가장 작은 단위(함수, 메서드, 클래스)를 독립적으로 테스트
- 빠르고 격리된 테스트
- Mock을 많이 사용

**프론트엔드 예시:**

```typescript
// React Hook 테스트
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('카운터 증가', () => {
  const { result } = renderHook(() => useCounter());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});
```

**백엔드 예시:**

```typescript
// 비즈니스 로직 테스트
import { calculateTotal } from './order.service';

test('주문 총액 계산', () => {
  const items = [
    { price: 1000, quantity: 2 },
    { price: 2000, quantity: 1 },
  ];
  
  expect(calculateTotal(items)).toBe(4000);
});
```

### 2. 통합 테스트 (Integration Test)

**특징:**
- 여러 모듈이 함께 동작하는지 테스트
- 실제 DB, API 등을 사용할 수 있음
- 단위 테스트보다 느림

**프론트엔드 예시:**

```typescript
// 여러 Hook이 함께 동작하는지 테스트
import { renderHook } from '@testing-library/react';
import { useCreateEdge } from './use-create-edge';
import { useReactFlow } from '@xyflow/react';

test('엣지 생성 통합 테스트', async () => {
  const { result: flowResult } = renderHook(() => useReactFlow());
  const { result: edgeResult } = renderHook(() => 
    useCreateEdge({ reactFlow: flowResult.current })
  );
  
  // 실제 React Flow와 통합되어 동작하는지 확인
  await edgeResult.current.createEdge({...});
  expect(flowResult.current.getEdges()).toHaveLength(1);
});
```

**백엔드 예시:**

```typescript
// Service + Repository + Database 통합 테스트
import { EdgeService } from './edge.service';
import { EdgeRepository } from './edge.repository';
import { db } from './database';

test('엣지 생성 통합 테스트', async () => {
  const repository = new EdgeRepository(db);
  const service = new EdgeService(repository);
  
  // 실제 DB에 저장되는지 확인
  const edge = await service.createEdge({...});
  const saved = await repository.findById(edge.id);
  
  expect(saved).toBeDefined();
});
```

### 3. E2E 테스트 (End-to-End Test)

**특징:**
- 사용자 관점에서 전체 플로우 테스트
- 실제 브라우저에서 실행
- 프론트엔드 + 백엔드 + DB 모두 포함
- 가장 느리고 비용이 큼

**프론트엔드 E2E 예시 (Playwright):**

```typescript
// tests/e2e/canvas/edge-creation.spec.ts
import { test, expect } from '@playwright/test';

test('엣지 생성 E2E', async ({ page }) => {
  // 1. 페이지 접속
  await page.goto('/canvas/123');
  
  // 2. 노드 선택
  await page.click('[data-testid="node-1"]');
  await page.click('[data-testid="handle-right"]');
  
  // 3. 드래그하여 다른 노드에 연결
  await page.dragAndDrop(
    '[data-testid="handle-right"]',
    '[data-testid="node-2"]'
  );
  
  // 4. 엣지가 생성되었는지 확인
  await expect(page.locator('[data-testid="edge"]')).toBeVisible();
  
  // 5. 페이지 새로고침 후에도 유지되는지 확인
  await page.reload();
  await expect(page.locator('[data-testid="edge"]')).toBeVisible();
});
```

### 4. 컴포넌트 테스트 (Component Test)

**특징:**
- React/Vue 등 UI 컴포넌트를 테스트
- 렌더링, 사용자 상호작용, Props 등을 검증
- 단위 테스트와 통합 테스트 사이

**예시 (React Testing Library):**

```typescript
// Button 컴포넌트 테스트
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('버튼 클릭', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  const button = screen.getByRole('button', { name: /click me/i });
  fireEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

```typescript
// Form 컴포넌트 테스트
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateEdgeForm } from './CreateEdgeForm';

test('폼 제출', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  render(<CreateEdgeForm onSubmit={onSubmit} />);
  
  // 입력 필드에 값 입력
  await user.type(screen.getByLabelText(/source/i), 'node-1');
  await user.type(screen.getByLabelText(/target/i), 'node-2');
  
  // 제출 버튼 클릭
  await user.click(screen.getByRole('button', { name: /create/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    source: 'node-1',
    target: 'node-2',
  });
});
```

### 5. 스냅샷 테스트 (Snapshot Test)

**특징:**
- 컴포넌트 렌더링 결과를 스냅샷으로 저장
- 변경 시 비교하여 의도치 않은 변경 감지

**예시:**

```typescript
import { render } from '@testing-library/react';
import { EdgeComponent } from './EdgeComponent';

test('엣지 컴포넌트 스냅샷', () => {
  const { container } = render(
    <EdgeComponent 
      id="edge-1"
      source="node-1"
      target="node-2"
    />
  );
  
  expect(container).toMatchSnapshot();
});
```

### 6. 성능 테스트 (Performance Test)

**프론트엔드:**

```typescript
// 렌더링 성능 테스트
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

test('대량 노드 렌더링 성능', () => {
  const start = performance.now();
  render(<Canvas nodes={Array(1000).fill(null).map((_, i) => ({ id: `node-${i}` }))} />);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(1000); // 1초 이내
});
```

**백엔드:**

```typescript
// API 응답 시간 테스트
import { performance } from 'perf_hooks';

test('엣지 생성 API 성능', async () => {
  const start = performance.now();
  await createEdge({...});
  const end = performance.now();
  
  expect(end - start).toBeLessThan(500); // 500ms 이내
});
```

### 7. 보안 테스트 (Security Test)

**백엔드 예시:**

```typescript
test('인증되지 않은 사용자 접근 거부', async () => {
  const response = await request.post('/api/edges', {
    data: { pageId: '123' }
    // Authorization 헤더 없음
  });
  
  expect(response.status()).toBe(401);
});

test('다른 사용자의 데이터 접근 거부', async () => {
  const response = await request.get('/api/edges/user-2-edge-id', {
    headers: { Authorization: `Bearer user-1-token` }
  });
  
  expect(response.status()).toBe(403);
});
```

---

## Mock vs 실제 Import

### Mock을 사용해야 하는 경우

```typescript
// ❌ 서버 액션 / API 호출
vi.mock('@/domains/canvas-management/actions/edge/create-edge.action');
// - 실제 서버가 필요함
// - 네트워크 요청이 발생함
// - 느리고 불안정할 수 있음

// ❌ 데이터베이스 접근
vi.mock('@/db');
// - 실제 DB가 필요함
// - 테스트 데이터가 필요함

// ❌ 외부 서비스
vi.mock('@/lib/analytics');
// - 실제 서비스 호출
// - 비용이 발생할 수 있음
```

### 실제 Import를 사용해야 하는 경우

```typescript
// ✅ 순수 함수 (Pure Function)
import { isFailure } from '@/lib';
// - 입력에 대해 항상 같은 출력
// - 부작용 없음
// - 외부 의존성 없음

// ✅ 유틸리티 함수
import { formatDate, calculateTotal } from '@/utils';
// - 단순한 계산/변환 로직
// - 테스트하기 쉬움
```

### Mock 선언과 Import의 관계

```typescript
// 1단계: Mock 선언 (모듈을 가짜로 대체한다고 선언)
vi.mock('@/domains/canvas-management/actions/edge/create-edge.action', () => ({
  createEdgeAction: vi.fn(), // "이 모듈을 이렇게 대체할거야"
}));

// 2단계: Import (Mock된 버전을 가져옴)
import { createEdgeAction } from '@/domains/canvas-management/actions/edge/create-edge.action';
// ↑ 이제 createEdgeAction은 vi.fn()으로 대체된 가짜 함수입니다
```

**왜 이렇게 해야 하나요?**

1. **호이스팅(Hoisting)**: `vi.mock()`은 파일 최상단으로 끌어올려집니다
2. **모듈 대체**: Mock 선언이 import보다 먼저 실행되어 모듈을 대체합니다
3. **타입 안전성**: TypeScript가 타입을 인식하려면 import가 필요합니다

**⚠️ 중요**: Mock 선언은 반드시 import보다 위에 있어야 합니다!

---

## 프론트엔드 테스트

### 테스트 도구

| 테스트 종류 | 도구 | 용도 |
|-----------|------|------|
| 단위 테스트 | Vitest, Jest | 함수, Hook 테스트 |
| 컴포넌트 테스트 | React Testing Library | UI 컴포넌트 테스트 |
| E2E 테스트 | Playwright, Cypress | 브라우저 전체 플로우 |

### Hook 테스트 예시

```typescript
// use-create-edge.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateEdge } from '../use-create-edge';

// Mock 선언 (import보다 위에!)
vi.mock('@/domains/canvas-management/actions/edge/create-edge.action', () => ({
  createEdgeAction: vi.fn(),
}));

import { createEdgeAction } from '@/domains/canvas-management/actions/edge/create-edge.action';

describe('useCreateEdge', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => ReactElement;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it('엣지를 성공적으로 생성해야 한다', async () => {
    vi.mocked(createEdgeAction).mockResolvedValue({
      success: true,
      data: mockEdgeView,
    });

    const { result } = renderHook(
      () => useCreateEdge({ pageId, reactFlow }),
      { wrapper }
    );

    const input = {
      sourceBlockMountId: 'source-1',
      targetBlockMountId: 'target-1',
      sourceHandle: 'right' as const,
      targetHandle: 'left' as const,
    };

    await act(async () => {
      await result.current.createEdge(input);
    });

    expect(createEdgeAction).toHaveBeenCalledWith({
      pageId,
      ...input,
    });
  });
});
```

### 컴포넌트 테스트 예시

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('클릭 시 onClick 핸들러가 호출되어야 한다', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태일 때 클릭되지 않아야 한다', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

---

## 백엔드 테스트

### 테스트 도구

| 테스트 종류 | 도구 | 용도 |
|-----------|------|------|
| 단위 테스트 | Vitest, Jest | 비즈니스 로직 테스트 |
| 통합 테스트 | Vitest + Test DB | DB 연동 테스트 |
| API 테스트 | Supertest, Playwright | HTTP API 테스트 |
| E2E 테스트 | Playwright | 전체 시스템 테스트 |

### Service 단위 테스트 예시

```typescript
// edge.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EdgeService } from './edge.service';
import type { EdgeRepository } from './edge.repository';

describe('EdgeService', () => {
  let service: EdgeService;
  let mockRepository: EdgeRepository;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
    } as any;

    service = new EdgeService(mockRepository);
  });

  it('엣지를 생성해야 한다', async () => {
    const command = {
      pageId: 'page-1',
      sourceBlockMountId: 'source-1',
      targetBlockMountId: 'target-1',
    };

    const result = await service.createEdge(command);

    expect(result.isSuccess()).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### Server Action 통합 테스트 예시

```typescript
// create-edge.action.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEdgeAction } from './create-edge.action';
import { db } from '@/db';

describe('createEdgeAction Integration', () => {
  beforeEach(async () => {
    // 테스트 DB 초기화
    await db.delete(edges);
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await db.delete(edges);
  });

  it('엣지를 생성하고 DB에 저장해야 한다', async () => {
    const request = {
      pageId: 'page-1',
      sourceBlockMountId: 'source-1',
      targetBlockMountId: 'target-1',
      sourceHandle: 'right',
      targetHandle: 'left',
    };

    const result = await createEdgeAction(request);

    expect(result.success).toBe(true);
    
    // 실제 DB에서 확인
    const saved = await db.query.edges.findFirst({
      where: eq(edges.id, result.data.edgeId),
    });
    
    expect(saved).toBeDefined();
  });
});
```

---

## 테스트 파일 구조

### 프로젝트 구조 예시

```
apps/web/
├── src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.tsx
│   │       └── __tests__/
│   │           └── Button.test.tsx        ← 컴포넌트 테스트
│   ├── hooks/
│   │   └── use-create-edge.ts
│   │       └── __tests__/
│   │           └── use-create-edge.test.tsx  ← 단위 테스트
│   └── domains/
│       └── canvas-management/
│           ├── actions/
│           │   └── __tests__/
│           │       └── create-edge.action.integration.test.ts  ← 통합 테스트
│           └── backend/
│               └── services/
│                   └── __tests__/
│                       └── edge.service.test.ts  ← 단위 테스트
└── tests/
    └── e2e/
        └── canvas/
            └── edge-creation.spec.ts  ← E2E 테스트
```

### 파일 명명 규칙

- **단위 테스트**: `[filename].test.ts` 또는 `[filename].test.tsx`
- **통합 테스트**: `[filename].integration.test.ts`
- **E2E 테스트**: `[filename].e2e.spec.ts` 또는 `[filename].spec.ts`

---

## 베스트 프랙티스

### 1. 테스트 격리 (Test Isolation)

각 테스트는 독립적으로 실행되어야 합니다.

```typescript
// ✅ 좋은 예: beforeEach에서 초기화
beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

// ❌ 나쁜 예: 테스트 간 상태 공유
let sharedState = {};
```

### 2. 명확한 테스트 이름

테스트 이름은 무엇을 테스트하는지 명확히 해야 합니다.

```typescript
// ✅ 좋은 예
it('엣지 생성 시 optimistic update가 적용되어야 한다', () => {});
it('서버 액션 실패 시 optimistic edge가 롤백되어야 한다', () => {});

// ❌ 나쁜 예
it('엣지 생성', () => {});
it('에러 처리', () => {});
```

### 3. AAA 패턴 (Arrange-Act-Assert)

```typescript
it('엣지 생성', async () => {
  // Arrange: 테스트 준비
  vi.mocked(createEdgeAction).mockResolvedValue({
    success: true,
    data: mockEdgeView,
  });
  const { result } = renderHook(() => useCreateEdge({ pageId, reactFlow }));

  // Act: 테스트 실행
  await act(async () => {
    await result.current.createEdge(input);
  });

  // Assert: 결과 검증
  expect(createEdgeAction).toHaveBeenCalledWith({
    pageId,
    ...input,
  });
});
```

### 4. Mock은 최소한으로

테스트할 수 있는 것은 실제로, 테스트하기 어려운 것만 Mock으로.

```typescript
// ✅ 좋은 예: 순수 함수는 실제 사용
import { isFailure, formatDate } from '@/lib';

// ✅ 좋은 예: 외부 의존성은 Mock
vi.mock('@/domains/.../create-edge.action');
```

### 5. 비동기 테스트 처리

```typescript
// ✅ 좋은 예: waitFor 사용
await waitFor(() => {
  expect(result.current.isCreating).toBe(false);
});

// ❌ 나쁜 예: setTimeout 사용
setTimeout(() => {
  expect(result.current.isCreating).toBe(false);
}, 1000);
```

### 6. 테스트 커버리지 목표

- **Unit Tests**: 80% 이상
- **Integration Tests**: 주요 플로우 커버
- **E2E Tests**: 핵심 시나리오만

---

## 요약

### 테스트 종류별 특징

| 테스트 종류 | 속도 | 격리 | Mock 사용 | 목적 |
|-----------|------|------|----------|------|
| Unit Test | 빠름 | 높음 | 많음 | 개별 로직 검증 |
| Integration Test | 보통 | 중간 | 적음 | 모듈 간 상호작용 |
| Component Test | 보통 | 높음 | 중간 | UI 컴포넌트 검증 |
| E2E Test | 느림 | 낮음 | 없음 | 전체 플로우 검증 |

### 원칙

1. **테스트할 수 있는 것은 실제로**: 순수 함수, 유틸리티는 실제 구현 사용
2. **테스트하기 어려운 것은 Mock으로**: 서버 액션, DB, 외부 API는 Mock 사용
3. **빠른 테스트 우선**: Unit Test → Integration Test → E2E Test 순서로 작성
4. **명확한 테스트 이름**: 무엇을 테스트하는지 한눈에 알 수 있게
5. **테스트 격리**: 각 테스트는 독립적으로 실행되어야 함

---

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library 공식 문서](https://testing-library.com/react)
- [Playwright 공식 문서](https://playwright.dev/)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
