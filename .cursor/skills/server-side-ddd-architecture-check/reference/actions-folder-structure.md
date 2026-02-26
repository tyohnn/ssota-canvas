# Actions 폴더 구조 및 정의 규칙

도메인별로 Server Actions를 나누고, **actions에서는 wrapper를 불러와 함수 정의만** 하기 위한 구조와 규칙.

---

## 1. 폴더 구조 (도메인별 분리)

```
apps/web/src/domains/
├── common/
│   └── server-actions/
│       └── index.ts              # withPageSecureAction, withWorkspaceSecureAction 등 공통 preset
├── canvas-management/
│   └── actions/
│       ├── edge/
│       │   ├── secure-action.ts       # (선택) 도메인 전용 wrapper
│       │   ├── create-edge.action.ts
│       │   ├── update-edge-label.action.ts
│       │   └── ...
│       ├── block-mount/
│       │   ├── secure-action.ts       # (선택)
│       │   ├── create-and-mount-block.action.ts
│       │   └── ...
│       └── canvas.actions.ts          # 뷰/레거시 등 묶음 export
├── block-management/
│   └── actions/
│       ├── block/
│       │   ├── secure-action.ts
│       │   └── update-block-content.action.ts
│       └── ...
├── workspace-management/
│   └── actions/
│       └── ...
└── ...
```

**원칙**:
- **도메인별**: `domains/<domain>/actions/` 아래에 해당 도메인 전용 액션만 둠.
- **하위 도메인/기능별**: 필요 시 `actions/edge/`, `actions/block-mount/` 처럼 서브폴더로 구분.
- **공통 wrapper**: `domains/common/server-actions`에서 preset만 export; 도메인은 여기서 import해서 사용.
- **도메인 전용 wrapper**: 해당 도메인 `actions/<sub>/secure-action.ts`에 두고, 같은 서브폴더의 action 파일에서만 사용.

---

## 2. Actions 파일에서 하는 일: “불러서 함수 정의만”

**규칙**: Action 파일은 다음만 수행한다.

1. **Wrapper import**: 공통 preset(`withPageSecureAction` 등) 또는 같은/상위 도메인 `secure-action.ts`의 wrapper.
2. **Schema/타입 import**: 해당 액션의 Request 스키마, 내부 handler에서 쓰는 타입.
3. **내부 handler 정의**: `(safeDto, context) => Promise<ActionResult<...>>` 형태의 async 함수 (이름은 `xxxInternal` 등).
4. **export**: `export const xxxAction = wrapper(Schema, 'actionName', internalHandler, options?)`.

**하지 않는 것**:
- `request: unknown`을 받는 진입 함수를 직접 정의하지 않음 (wrapper가 진입점 제공).
- 파일 상단에서 검증/인증/권한 로직을 중복 구현하지 않음 (wrapper에 위임).
- 비즈니스 로직을 action 파일에 두지 않음; Service 호출 및 DTO 변환만.

---

## 3. 한 파일 안에서의 구조

```typescript
'use server';

// 1. Wrapper (공통 또는 도메인 전용)
import { withPageSecureAction } from '@/domains/common/server-actions';

// 2. Schema, 타입, Service, Repository 등
import { CreateEdgeRequestSchema, CreateEdgeRequest } from '../../shared/dtos/requests';
import { createEdge } from '../../backend/services/edge';
// ...

// 3. Export: wrapper 호출 한 번으로 액션 정의
export const createEdgeAction = withPageSecureAction(
  CreateEdgeRequestSchema,
  'createEdgeAction',
  createEdgeInternal,
  { getLogMetadata: req => ({ pageId: req.pageId }) }
);

// 4. 내부 구현: SafeDTO + context → Service 호출 → ActionResult
async function createEdgeInternal(
  safeDto: CreateEdgeRequest,
  context: PageActionContext
): Promise<ActionResult<EdgeView>> {
  // Repository 생성, createEdge(safeDto, ...) 호출, 결과를 DTO로 변환 후 ok/err 반환
}
```

- **한 파일에 한 액션**을 두는 것을 기본으로 하고, 매우 단순한 경우에만 같은 도메인/목적의 액션을 한 파일에 여러 개 두어도 됨.
- 내부 handler는 **반드시** SafeDTO + context만 받고, Command/Value Object 생성은 Service에 맡김.

---

## 4. 도메인 전용 wrapper를 쓸 때

같은 도메인의 `secure-action.ts`에서 export한 wrapper를 쓰는 경우에도, **action 파일의 역할은 동일**:

- 해당 wrapper와 Schema, internal handler만 import/정의.
- export는 `export const xxxAction = withSingleEdgeSecureAction(Schema, 'actionName', internalHandler, options?)` 형태로 한 줄.

```typescript
'use server';

import { withSingleEdgeSecureAction } from './secure-action';
import { UpdateEdgeLabelRequestSchema } from '../../shared/dtos/requests';

export const updateEdgeLabelAction = withSingleEdgeSecureAction(
  UpdateEdgeLabelRequestSchema,
  'updateEdgeLabelAction',
  updateEdgeLabelInternal,
  { getLogMetadata: req => ({ pageId: req.pageId, edgeId: req.edgeId }) }
);

async function updateEdgeLabelInternal(
  safeDto: UpdateEdgeLabelRequest,
  context: EdgeActionContext  // edgeAggregate 등 도메인 context
): Promise<ActionResult<EdgeView>> {
  // context.edgeAggregate 사용 가능, 재조회 불필요
}
```

---

## 5. 검사 시 체크 포인트

- [ ] 도메인별로 `domains/<domain>/actions/` 아래에만 해당 도메인 액션이 있는지.
- [ ] 공통 preset은 `@/domains/common/server-actions`에서만 import하는지.
- [ ] 각 action 파일이 “wrapper import + export 한 번 + internal handler 정의”만 하는지 (진입점 직접 구현·중복 검증/인증 없음).
- [ ] 도메인 전용 wrapper는 해당 도메인 `actions/.../secure-action.ts`에만 있고, 다른 도메인에서는 공통 preset을 쓰는지.

Secure Action 정의 방법은 [secure-action-definition.md](secure-action-definition.md) 참고.
