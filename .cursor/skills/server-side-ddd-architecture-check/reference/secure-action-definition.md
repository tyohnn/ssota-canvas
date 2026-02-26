# Secure Action 정의 방법

Server Action 보안 레이어(검증·인증·권한)를 HOF로 일관 적용하기 위한 정의 방법.  
관련: `docs/patterns/backend/server-side-ddd-conventions.md`, `docs/patterns/backend/next-action-framework-proposal.md`.

---

## 1. 핵심 HOF: withSecureAction

**위치**: `@/lib/server-actions/with-secure-action` (또는 `@/lib/server-actions`)

**시그니처**:

```typescript
withSecureAction<TRequest, TResponse>(
  schema: z.ZodSchema<TRequest>,
  options: {
    getAuthenticatedUser: () => Promise<TAuthenticatedUser>;
    authorize: (request: TRequest, user: TAuthenticatedUser) => Promise<AuthorizeResult<TContext>>;
    actionName: string;
    getLogMetadata?: (request: TRequest) => Record<string, unknown>;
  },
  handler: (
    validatedRequest: TRequest,
    context: TContext & { authenticatedUser: TAuthenticatedUser }
  ) => Promise<ActionResult<TResponse>>
): (request: unknown) => Promise<ActionResult<TResponse>>
```

**적용 레이어**:
1. **Runtime Validation**: `schema.safeParse(request)` → 실패 시 `INVALID_REQUEST` 반환
2. **Authentication**: `options.getAuthenticatedUser()` → 실패 시 `UNAUTHORIZED`
3. **Authorization**: `options.authorize(validatedRequest, user)` → 실패 시 `ACCESS_DENIED`
4. **Handler**: 성공 시에만 `handler(validatedRequest, context)` 호출

**규칙**:
- 진입점은 항상 `(request: unknown)`.
- Handler에는 검증된 `TRequest`와 `context`만 전달 (내부에서 다시 검증하지 않음).
- `actionName`은 로깅/디버깅용으로 일관된 문자열 사용.

---

## 2. Preset Wrapper: createSecureActionBuilder

프로젝트별 인증(`getAuthenticatedUser`)을 고정하고, **Context 타입**과 **권한 로직**만 바꿔서 여러 secure action wrapper를 만들 때 사용.

**위치**: `@/lib/server-actions/create-secure-action-builder`

**패턴**:

```typescript
const builder = createSecureActionBuilder(getAuthenticatedUser);

const withXxxSecureAction = builder
  .forContext<XxxActionContext>()
  .withAuth((req: { pageId: string }, user) => authorizeByPageId(req.pageId, user.id))
  .build();
```

**`.build()` 반환 시그니처**:

```typescript
(schema, actionName, handler, options?: { getLogMetadata? }) => SecureAction<TRequest, TResponse>
```

- **schema**: Zod 스키마
- **actionName**: 로깅용 이름
- **handler**: `(req: TRequest, ctx: TContext & { authenticatedUser }) => Promise<ActionResult<TResponse>>`
- **options.getLogMetadata**: 선택, 로그용 메타데이터

---

## 3. 공통 Preset (도메인 공용)

**위치**: `@/domains/common/server-actions`

| Wrapper | 사용 조건 | Context | 권한 기준 |
|--------|-----------|---------|-----------|
| `withPageSecureAction` | 요청에 `pageId` | `PageActionContext` | `authorizeByPageId(req.pageId, user.id)` |
| `withWorkspaceSecureAction` | 요청에 `workspaceId` | `WorkspaceActionContext` | `authorizeByWorkspaceId(req.workspaceId, user.id)` |
| `withOrganizationSecureAction` | 요청에 `organizationId` | `OrganizationActionContext` | `authorizeByOrganizationId(req.organizationId, user.id)` |
| `withOrganizationOwnerSecureAction` | 조직 설정 등 소유자만 | `OrganizationActionContext` | 동일 + `requireOwner: true` |
| `withEdgeSecureAction` | `pageId` + `edgeId`(slug) | `PageActionContext` | `authorizeByPageId(req.pageId, user.id)` (Edge 조회는 handler/서비스에서) |

**사용 예**:

```typescript
import { withPageSecureAction } from '@/domains/common/server-actions';

export const createEdgeAction = withPageSecureAction(
  CreateEdgeRequestSchema,
  'createEdgeAction',
  createEdgeInternal,
  { getLogMetadata: req => ({ pageId: req.pageId }) }
);
```

---

## 4. 도메인 전용 Secure Action (Preset으로 부족할 때)

도메인에서 **리소스 조회 + 권한**을 한 번에 하고, 조회 결과를 context에 넣어 재조회를 막고 싶을 때 사용.

**위치**: 해당 도메인 `actions/` 하위 `secure-action.ts` (예: `domains/canvas-management/actions/edge/secure-action.ts`)

**패턴**:
1. 도메인 전용 Context 타입 정의 (예: `EdgeActionContext extends PageActionContext { edgeAggregate }`).
2. `authorize`에서 리소스 조회 후 권한만 통과해도 context에 리소스 포함해 반환.
3. `createSecureActionBuilder(getAuthenticatedUser).forContext<...>().withAuth(...).build()`로 `withXxxSecureAction` export.
4. 같은 도메인 actions에서만 해당 wrapper 사용.

**예: 단일 Edge (pageId + edgeSlug로 조회 후 권한)**:

```typescript
// secure-action.ts
export interface EdgeActionContext extends PageActionContext {
  edgeAggregate: EdgeAggregate;
}

async function authorizeSingleEdge(
  pageId: string,
  edgeSlug: string,
  userId: string
): Promise<AuthorizeResult<EdgeActionContext>> {
  const pageResult = await authorizeByPageId(pageId, userId);
  if (!pageResult.success || !pageResult.context) return pageResult as AuthorizeResult<EdgeActionContext>;

  const edgeRepository = new DrizzleEdgeRepository();
  const edgeAggregate = await edgeRepository.findByPageIdAndSlug(new PageId(pageId), edgeSlug);
  if (!edgeAggregate) return { success: false, error: 'Edge not found' };

  return { success: true, context: { ...pageResult.context, edgeAggregate } };
}

const edgeSecureActionBuilder = createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

export const withSingleEdgeSecureAction = edgeSecureActionBuilder
  .forContext<EdgeActionContext>()
  .withAuth((req: { pageId: string; edgeId: string }, user) =>
    authorizeSingleEdge(req.pageId, req.edgeId, user.id)
  )
  .build();
```

---

## 5. 검사 시 체크 포인트

- Action이 **wrapper 한 번 호출 + 내부 handler** 형태로만 정의되어 있는지.
- Preset 선택이 리소스와 맞는지 (page / workspace / organization / edge 등).
- 도메인 전용 wrapper는 해당 도메인 `secure-action.ts`에만 정의하고, 다른 도메인에서는 공통 preset 사용.
- Handler 시그니처: `(validatedRequest, context)` 만 받고, 내부에서 `unknown` 재검증이나 직접 인증 호출 없음.

자세한 레이어별 체크리스트는 상위 [reference.md](../reference.md) 참고.
