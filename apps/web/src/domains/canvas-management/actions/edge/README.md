# Edge Actions - HOF Security Pattern

이 디렉토리는 **Higher-Order Function (고차 함수)** 패턴을 사용하여 Server Actions의 보안 레이어를 추상화한 실험적 구현입니다.

## 🎯 목적

Server Actions의 반복되는 보안 검증 로직을 재사용 가능한 함수로 추상화하여:

- ✅ 코드 중복 제거
- ✅ 일관된 보안 정책 적용
- ✅ 유지보수성 향상
- ✅ 실수로 인한 보안 누락 방지

## 🛡️ Defense in Depth 패턴

모든 Server Actions는 다음 보안 레이어를 거칩니다:

```
┌─────────────────────────────────────────┐
│  1. Runtime Validation (Zod Schema)     │
│     ↓ unknown → Validated Type          │
├─────────────────────────────────────────┤
│  2. User Authentication (Supabase)      │
│     ↓ Verify User Session               │
├─────────────────────────────────────────┤
│  3. Resource Access (pageId-based)      │
│     ↓ Check Organization/Workspace      │
├─────────────────────────────────────────┤
│  4. Business Logic (Internal Handler)   │
│     ↓ Execute Safe Operation            │
└─────────────────────────────────────────┘
```

## 📦 구조

```
edge/
├── with-secure-action.ts          # HOF 유틸리티
├── create-edge.action.ts          # Direct pageId 추출
├── update-edge-label.action.ts    # Indirect pageId 추출 (Edge 조회)
├── update-edge-shape.action.ts    # Indirect pageId 추출
├── update-edge-style.action.ts    # Indirect pageId 추출
├── delete-edge.action.ts          # Indirect pageId 추출
└── README.md                      # 이 문서
```

## 🔧 HOF 패턴 사용법

### 1. Direct Access (pageId가 request에 있는 경우)

```typescript
// create-edge.action.ts
export const createEdgeAction = withSecureAction(
  CreateEdgeRequestSchema,
  {
    getPageId: (req) => req.pageId, // ✅ Direct
    actionName: 'createEdgeAction',
    getLogMetadata: (req) => ({ pageId: req.pageId }),
  },
  createEdgeInternal
);
```

### 2. Indirect Access (Entity 조회 후 pageId 추출)

```typescript
// update-edge-label.action.ts
export const updateEdgeLabelAction = withSecureAction(
  UpdateEdgeLabelRequestSchema,
  {
    getPageId: async (req) => {
      const edgeRepository = new DrizzleEdgeRepository();
      const edgeAggregate = await edgeRepository.findById(
        new EdgeId(req.edgeId)
      );

      if (!edgeAggregate) {
        return { pageId: '', notFoundError: 'Edge not found' };
      }

      return edgeAggregate.edge.pageId.value;
    },
    actionName: 'updateEdgeLabelAction',
    getLogMetadata: (req) => ({ edgeId: req.edgeId }),
  },
  updateEdgeLabelInternal
);
```

## 🧩 HOF 구조

### `withSecureAction<TRequest, TResponse>`

**Type Parameters:**
- `TRequest`: Validated request type (Zod schema output)
- `TResponse`: Action result type

**Parameters:**
- `schema`: Zod validation schema
- `options`:
  - `getPageId`: pageId 추출 함수 (string | Promise<string | {pageId, notFoundError}>)
  - `actionName`: 로깅용 액션 이름
  - `getLogMetadata`: 추가 로그 메타데이터 (선택)
- `handler`: 내부 비즈니스 로직 함수

**Returns:**
- Secured server action function: `(unknown) => Promise<ActionResult<TResponse>>`

## 📊 Before & After 비교

### ❌ Before: 반복적인 보안 코드

```typescript
export async function createEdgeAction(request: unknown) {
  // 1. 검증
  const parseResult = CreateEdgeRequestSchema.safeParse(request);
  if (!parseResult.success) return err(...);
  
  const validatedRequest = parseResult.data;

  // 2. 인증
  try {
    const authenticatedUser = await getAuthenticatedUser();
    
    // 3. 권한 확인
    const accessResult = await verifyAccessByPageId(
      validatedRequest.pageId,
      authenticatedUser.id
    );
    
    if (!accessResult.success) return err(...);
    
    // 4. 비즈니스 로직
    return await createEdgeInternal(validatedRequest);
  } catch (error) {
    return err(...);
  }
}
```

### ✅ After: HOF로 추상화

```typescript
export const createEdgeAction = withSecureAction(
  CreateEdgeRequestSchema,
  {
    getPageId: (req) => req.pageId,
    actionName: 'createEdgeAction',
  },
  createEdgeInternal
);
```

**결과:**
- 🎉 50+ 줄 → 6줄
- 🎯 핵심 로직에 집중
- 🛡️ 보안 정책 일관성 보장

## 🔄 Internal Handler 패턴

HOF를 통과한 후 실행되는 내부 함수는 항상:

1. **검증된 데이터만 받음** (타입 안전)
2. **비즈니스 로직만 구현**
3. **Service 레이어 호출**
4. **Error Handling**

```typescript
async function createEdgeInternal(
  safeDto: CreateEdgeRequest // ✅ 이미 검증됨
): Promise<ActionResult<EdgeView>> {
  try {
    // 1. Service 생성
    const service = new CanvasEdgeService(...);

    // 2. Service 호출
    const result = await service.createEdge(safeDto);

    if (result.isError()) {
      return err(String(result.error), { code: '...' });
    }

    // 3. DTO 변환
    return ok(result.value.toView());
  } catch (error) {
    return err('Internal server error', { code: '...' });
  }
}
```

## 💡 장점

### 1. **DRY (Don't Repeat Yourself)**
- 보안 로직을 한 곳에서 관리
- 모든 Edge Actions에 일관되게 적용

### 2. **Type Safety**
- TypeScript 제네릭으로 타입 안전성 보장
- Validated type이 handler까지 전파

### 3. **Separation of Concerns**
- 보안 로직 ↔ 비즈니스 로직 분리
- 각 레이어의 책임 명확화

### 4. **Testability**
- HOF는 한 번만 테스트
- Internal handler는 순수 함수로 테스트 용이

### 5. **Maintainability**
- 보안 정책 변경 시 HOF만 수정
- 모든 Actions에 자동 반영

## 🚨 주의사항

### 1. pageId 추출 로직

**Indirect Access의 중복 조회 이슈:**

현재 구현에서는 `getPageId`에서 Edge를 조회하고, 
내부 handler에서 다시 Edge를 조회합니다 (2번 조회).

```typescript
// ⚠️ 현재: 2번 조회
getPageId: async (req) => {
  const edge = await repository.findById(req.edgeId); // 1번 조회
  return edge.edge.pageId.value;
}

async function updateEdgeLabelInternal(safeDto) {
  const service = new Service(...);
  await service.updateEdge(safeDto); // 내부에서 다시 조회 (2번)
}
```

**개선 방향:**
- HOF에서 조회한 Entity를 handler에 전달
- 또는 pageId만 필요한 경우 최적화된 쿼리 사용

### 2. Next.js Server Actions 제약

- HOF 반환값이 Server Action으로 인식되려면 `'use server'` 지시어 필요
- `export const` 형태로 export 해야 함 (named export)

## 🔮 향후 개선 방향

### 1. Entity 캐싱
```typescript
withSecureAction(
  schema,
  {
    getPageId: async (req) => {
      const edge = await repository.findById(req.edgeId);
      return { pageId: edge.pageId.value, entity: edge }; // Entity 전달
    },
  },
  (safeDto, cachedEntity) => { // Entity 재사용
    // ...
  }
);
```

### 2. 권한 레벨 세분화
```typescript
withSecureAction(
  schema,
  {
    getPageId: (req) => req.pageId,
    requiredPermission: 'write', // 'read' | 'write' | 'admin'
  },
  handler
);
```

### 3. Rate Limiting
```typescript
withSecureAction(
  schema,
  {
    rateLimit: { maxRequests: 100, windowMs: 60000 },
  },
  handler
);
```

## 📚 관련 패턴

### 1. Middleware Pattern
- Express.js, Koa.js의 미들웨어와 유사
- 요청 → 미들웨어 체인 → 핸들러

### 2. Decorator Pattern
- TypeScript Decorators와 유사한 개념
- 함수를 감싸서 기능 추가

### 3. Chain of Responsibility
- 여러 보안 검증을 순차적으로 실행
- 하나라도 실패하면 체인 중단

## 🎓 학습 자료

- [Higher-Order Functions in TypeScript](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [Defense in Depth Security](https://owasp.org/www-community/Defense_in_Depth)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

## 🤝 기여

이 패턴은 **실험적**입니다. 개선 아이디어가 있다면:

1. 실제 사용 중 발견한 문제점
2. 성능 측정 결과
3. 더 나은 추상화 제안

위 내용을 팀과 공유해주세요!

---

**Created:** 2026-01-01  
**Pattern:** Higher-Order Function for Server Actions  
**Status:** 🧪 Experimental
