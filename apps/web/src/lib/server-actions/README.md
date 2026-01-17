# Server Actions Utilities

Server Actions를 위한 보안 및 미들웨어 유틸리티 모음입니다.

## 구조

```
server-actions/
├── with-secure-action.ts    # HOF: Defense in Depth 보안 레이어
├── types.ts                  # 타입 정의
├── middlewares/             # 미들웨어 모음
│   ├── rate-limit.ts        # Rate limiting
│   └── index.ts
└── index.ts                 # Barrel export
```

## 사용법

### withSecureActionå

Defense in Depth 보안 레이어를 자동으로 적용하는 Higher-Order Function입니다.

```typescript
import { withSecureAction } from '@/lib/server-actions';
import { CreateEdgeRequestSchema } from './schemas';

export const createEdgeAction = withSecureAction(
  CreateEdgeRequestSchema,
  {
    getPageId: req => req.pageId,
    actionName: 'createEdgeAction',
    getLogMetadata: req => ({ pageId: req.pageId }),
  },
  createEdgeInternal
);
```

### 적용되는 보안 레이어

1. **Runtime Validation**: Zod 스키마 검증
2. **User Authentication**: Supabase Auth 확인
3. **Access Control**: Page-based 권한 확인

### pageId 추출 방식

#### Direct Access
```typescript
{
  getPageId: req => req.pageId,  // request에서 직접 추출
}
```

#### Indirect Access
```typescript
{
  getPageId: async req => {
    // Entity 조회 후 pageId 추출
    const entity = await repository.findById(req.entityId);
    if (!entity) {
      return { pageId: '', notFoundError: 'Entity not found' };
    }
    return entity.pageId;
  },
}
```

## 미들웨어

### Rate Limiting

```typescript
import { rateLimit } from '@/lib/server-actions/middlewares';

if (!rateLimit(userId, 10, 60000)) {
  return err('Rate limit exceeded', { code: 'RATE_LIMIT_EXCEEDED' });
}
```

## 타입

모든 타입은 `@/lib/server-actions`에서 import할 수 있습니다:

```typescript
import type {
  SecureActionOptions,
  PageIdExtractor,
  RateLimitConfig,
} from '@/lib/server-actions';
```

## 마이그레이션 가이드

### 기존 코드

```typescript
// Before
import { withSecureAction } from './with-secure-action';
import { ActionResult } from '@/lib';
```

### 새 코드

```typescript
// After
import { withSecureAction } from '@/lib/server-actions';
import { ActionResult } from '@/lib/result';
```

## 참고

- [Server-Side DDD 컨벤션](../../../docs/patterns/server-side-ddd-conventions.md)
- [Next.js Server Actions Framework 제안](../../../docs/patterns/next-action-framework-proposal.md)
