---
name: Block Mount Edge Slug
overview: Resolver 제거 후, Create 시 (workspace/page + slug) 유일성 보장·재시도 처리하고, 생성 이후에는 모든 조회를 (workspaceId/pageId + slug) 기반 레포 메서드로 통일. Block / Block Mount / Edge 3개 phase로 나누어 검토·구현을 순차 진행한다.
todos: []
isProject: false
---

# Block / Block Mount / Edge Slug 전환 계획 (수정안)

## 설계 원칙

- **Create 시점**: block = (workspace_id, slug) 유일, block_mount / edge = (page_id, slug) 유일. 생성 시 ID·slug 충돌 모두 3회 재시도, 에러 캐치에 slug 유일 위반 포함.
- **생성 이후**: Resolver 없음. 서비스에서 데이터를 불러올 때 **id가 아닌 (scope + slug)** 로만 조회.
  - Block: `findByWorkspaceIdAndSlug(workspaceId, slug)` (workspaceId는 safeDto에서)
  - Block mount / Edge: `findByPageIdAndSlug(pageId, slug)` (pageId는 safeDto에서)
- **요청**: 모든 create/soft delete/변경/복제는 **slug**로 식별자 전달. DTO는 **slug만** 수용 (UUID 허용하지 않음, 예: 8자 hex). workspace/page는 secure action의 **safeDto에서 넘어오는 safe data**로 사용.
- **레포**: `findById` / `findByIds` 제거, `findBy[Scope]AndSlug` / `findBy[Scope]AndSlugs` 로 대체.
- **프론트/API**: `node.id` = blockMountSlug, `node.data.blockMountId` = blockMountSlug, `node.data.blockId` = blockSlug, `edge.id` = edgeSlug, `edge.data.edgeId` = edgeSlug.

### 서비스·액션 규칙 (Phase 1·2·3 공통)

- **단일 params 객체**: 서비스 인자가 3개 이상이면 반드시 단일 params 객체로 전달 (예: `SoftDeleteBlockParams`, `UpdateBlockTitleParams`). 인자 나열 대신 `params: SomeParams` 형태.
- **safe 명칭**: 권한 검증된 값은 `safe` 접두사로 구분.
  - **Phase 1 (Block)**: `safeWorkspaceId`, `safeBlockSlug` (일괄 시 `safeBlockSlugs`).
  - **Phase 2 (Block Mount)**: `safePageId`, `safeBlockMountSlug` (일괄 시 `safeBlockMountSlugs`).
  - **Phase 3 (Edge)**: `safePageId`, `safeEdgeSlug` (일괄 시 `safeEdgeSlugs`).
- **Context 전달**: 액션에서 authorize 통과 후 받은 context(`WorkspaceActionContext`, `PageActionContext` 등)의 scope ID를 서비스에 그대로 전달. 서비스는 safeDto에서 workspaceId/pageId를 재파싱하지 않음.

#### Aggregate 조회·전달 패턴 (Secure Action → Service)

- **원칙**: “주체가 되는” 엔티티(Block / BlockMount / Edge 등)는 **secure action에서 한 번만 조회**하고, **context에 aggregate로 담아 handler에 넘긴다**. 서비스는 **전달받은 aggregate를 params로만 사용**하며, **내부에서 `findBy...AndSlug`(또는 `findById`)를 다시 호출하지 않는다**.
- **적용 방법**:
  1. **Secure action**: (scope + slug)로 권한 검증 후, 레포 `findBy[Scope]AndSlug(scopeId, slug)` 호출 → aggregate 획득 → **전용 context 타입**에 담아 반환 (예: `BlockActionContext`, `BlockMountActionContext`, `AddNodeToGroupActionContext`).
  2. **전용 wrapper**: 해당 context를 쓰는 **전용 secure action wrapper**를 둔다 (예: `withBlockAggregateSecureAction`, `withSingleBlockMountSecureAction`, `withAddNodeToGroupSecureAction`). request에는 `workspaceId`/`pageId` + `blockId`/`blockMountId` 등 식별자(slug) 필수.
  3. **Action handler**: context에서 aggregate를 꺼내 서비스 **params 객체**에 넣어 호출 (예: `safeBlockAggregate: context.blockAggregate`, `safeChildAggregate: context.childBlockMountAggregate`).
  4. **Service**: params에 `safeBlockAggregate` / `safeBlockMountAggregate` 등 **aggregate를 받는 필드**만 사용. **서비스 내부에서는 `findBy...AndSlug` 호출 금지** (이미 액션에서 조회·검증됨).
- **효과**: 조회 중복 제거, 권한·존재 검증이 액션 레이어에 한곳으로 모임, 서비스는 “검증된 aggregate + 기타 인자”만 받는 단순한 시그니처 유지.
- **참고 구현**: Block `withBlockAggregateSecureAction` + `BlockActionContext.blockAggregate`, Block Mount `withSingleBlockMountSecureAction` + `BlockMountActionContext.blockMountAggregate`, Group Node `withAddNodeToGroupSecureAction` + `AddNodeToGroupActionContext.childBlockMountAggregate` / `parentBlockMountAggregate`.

---

## Phase 1: Blocks

### 1.1 DB·스키마 (Blocks)

- 마이그레이션: `blocks`에 `slug` 컬럼 추가, `UNIQUE(workspace_id, slug)`, backfill = UUID hex 앞 8자.
- [apps/web/src/db/schemas/public/canvas-schema.ts](apps/web/src/db/schemas/public/canvas-schema.ts) (또는 block 스키마 위치)에 `slug` 및 unique 제약 반영.

### 1.2 Create 시 유일성 (Blocks)

- Block create 경로: [drizzle-block.repository.ts](apps/web/src/domains/block-management/backend/repositories/implementations/drizzle-block.repository.ts) `create` / `createMany`에서:
  - insert 시 `slug` 포함 (생성 규칙: `uuid.replace(/-/g,'').slice(0,8)` 등, 충돌 시 10자 확장 가능).
  - catch에서 `23505` 시 **ID 충돌(pkey) 또는 slug 유일 위반** 모두 3회 재시도. 조건문은 **OR**로 처리 (예: `constraint === 'blocks_pkey' || constraint === 'blocks_workspace_id_slug_key'`). 재시도 시 **id와 slug 둘 다 새로 생성**하여 3회까지 시도.
- 현재 로직은 `blocks_pkey`만 처리함. slug unique 제약 추가 후 해당 constraint를 OR 조건에 포함.

### 1.3 Block 레포 조회 방식

- [block.repository.interface.ts](apps/web/src/domains/block-management/backend/repositories/interfaces/block.repository.interface.ts): `findById` 제거, 다음 추가:
  - `findByWorkspaceIdAndSlug(workspaceId: WorkspaceId, slug: string): Promise<Block | null>`
  - `findByWorkspaceIdAndSlugs(workspaceId: WorkspaceId, slugs: string[]): Promise<(Block | null)[]>` (순서 보장)
- [drizzle-block.repository.ts](apps/web/src/domains/block-management/backend/repositories/implementations/drizzle-block.repository.ts): 위 시그니처 구현. `**findById` / `findByIds` Phase 1에서 바로 제거 (유지하지 않음).

### 1.4 Block 요청 DTO (slug + workspaceId)

- [block-management/shared/dtos/requests/block.requests.ts](apps/web/src/domains/block-management/shared/dtos/requests/block.requests.ts):
  - 식별자 필드(blockId 등): **slug로 통일**. UUID는 허용하지 않음. 예: `z.string().length(8).regex(/^[0-9a-f]+$/i)`.
  - **workspaceId가 없는 요청** (UpdateBlockTitle, UpdateBlockProperty, UpdateBlockProperties, UpdateBlockContent, ApplyBlockContentSteps, LogBlockUpdatedAudit): **workspaceId 필드 스키마에 포함** (safeDto에서 scope로 사용). **관련 훅에서 workspaceId 전달하도록 수정** (프론트 호출부에서 해당 액션 호출 시 workspaceId 넘기기).

### 1.5 Block Secure Action 및 서비스

- [block/secure-action.ts](apps/web/src/domains/block-management/actions/block/secure-action.ts):
  - 권한: blockId(slug) 단일 조회 대신, **safeDto.workspaceId**로 `authorizeByWorkspaceId` 사용. (이미 workspaceId 있는 요청은 그대로, 새로 workspaceId 추가된 요청은 safeDto.workspaceId 검증.)
  - Block 조회가 필요한 단일 block 조작 액션(update-property, update-properties, update-content, apply-content-steps 등)은 **위 “Aggregate 조회·전달 패턴” 적용**: secure action에서 `findByWorkspaceIdAndSlug`로 조회 후 **BlockActionContext.blockAggregate**로 넘기고, 서비스는 **safeBlockAggregate** params만 사용(서비스 내부에서 재조회 없음).
  - 그 외 Block 조회가 필요한 경우: **레포** `findByWorkspaceIdAndSlug(safeDto.workspaceId, safeDto.blockId)` 호출 (blockId는 slug로 통일).
- Block 서비스들 (create-block, soft-delete, restore, duplicate, update-block-title, update-block-property, update-block-properties, update-block-content, apply-block-content-steps 등):
  - **인자**: 단일 params 객체 사용 (3개 이상 시). **safeWorkspaceId**, **safeBlockSlug** 또는 패턴 적용 시 **safeBlockAggregate** 명칭. 액션은 **WorkspaceActionContext** 또는 **BlockActionContext**에서 전달, 서비스는 safeDto 재파싱 없이 전달받은 값 사용.
  - **레포 호출**: 패턴 미적용 경로만 `findById` → `findByWorkspaceIdAndSlug(workspaceId, slug)` 로 변경. `findByIds` → `findByWorkspaceIdAndSlugs(workspaceId, slugs)` 로 변경.
- duplicate-block.service 등에서 `findByIds` 사용처를 `findByWorkspaceIdAndSlugs`로 교체.

### 1.6 Block 조회·응답

- CanvasQueryService 등 block을 노출하는 조회: 응답에 **slug** 포함 (id 대신 slug 노출 정책에 따라 필드명 유지 여부 결정).
- Create block 응답: blockId 값을 **slug**로 반환.

### 1.7 Phase 1 검토 포인트

- Create 시 ID + slug 유일 위반을 **OR 조건**으로 잡아 3회 재시도되는지.
- 모든 block 서비스가 (workspaceId + slug) 기반 조회만 사용하는지, **findById(s) 제거 완료** 여부.
- safeDto에 workspaceId가 필요한 요청에 workspaceId가 **스키마에 포함**되어 있고, **관련 훅에서 전달**하는지.
- Block 관련 테스트: **모두 반영**. block-management.service.test, create-block.action 등 slug/workspaceId 반영.

---

## Phase 2: Block Mounts

### 2.1 DB·스키마 (Block Mounts)

- 마이그레이션: `block_mounts`에 `slug` 컬럼 추가, `UNIQUE(page_id, slug)`, backfill = UUID hex 앞 8자.
- 스키마 파일에 `slug` 및 unique 제약 반영.

### 2.2 Create 시 유일성 (Block Mounts)

- [drizzle-block-mount.repository.ts](apps/web/src/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository.ts) `create` / `createMany`:
  - insert 시 `slug` 포함.
  - `23505` catch에서 **pkey**와 **(page_id, slug) unique constraint** 구분, slug 충돌 시에도 id+slug 재생성 후 최대 3회 재시도.

### 2.3 Block Mount 레포 조회 방식

- [block-mount.repository.interface.ts](apps/web/src/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface.ts): `findById` / `findByIds` 제거, 추가:
  - `findByPageIdAndSlug(pageId: PageId, slug: string): Promise<BlockMountAggregate | null>`
  - `findByPageIdAndSlugs(pageId: PageId, slugs: string[]): Promise<(BlockMountAggregate | null)[]>` (순서 보장)
- [drizzle-block-mount.repository.ts](apps/web/src/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository.ts): 위 구현. 기존 findById(s) 제거.

### 2.4 Block Mount 요청 DTO (slug + pageId)

- [canvas-management/shared/dtos/requests/block.requests.ts](apps/web/src/domains/canvas-management/shared/dtos/requests/block.requests.ts):
  - blockMountId 등: **slug만 허용** (UUID 허용하지 않음).
  - **pageId가 없는 요청** (DuplicateBlockAndMount, DuplicateBlocksAndMount, UpdateBlockSize, UpdateBlockMountViewMode, MoveBlockToPage 등): 해당 액션이 페이지 스코프라면 **pageId를 safeDto에 포함** (이미 있는 요청은 유지). Duplicate 계열은 현재 “blockMountId만” 받고 있어서, slug 전환 시 **pageId를 스키마에 추가**해 safeDto에서 pageId + blockMountSlug로 조회하도록 변경.

### 2.5 Block Mount Secure Action 및 서비스

- [block-mount/secure-action.ts](apps/web/src/domains/canvas-management/actions/block-mount/secure-action.ts):
  - 권한: page 스코프 액션은 **safeDto.pageId**로 `authorizeByPageId` 사용.
  - 단일/복수 blockMount 조작 액션은 **위 “Aggregate 조회·전달 패턴” 적용**: secure action에서 `findByPageIdAndSlug` / `findByPageIdAndSlugs`로 조회 후 **BlockMountActionContext.blockMountAggregate** 또는 **MultipleBlockMountsActionContext.blockMountAggregates**로 넘기고, 서비스는 **safeBlockMountAggregate** 등 params만 사용(서비스 내부에서 재조회 없음).
  - blockMount 조회만 필요한 경우(패턴 미적용): **레포** `findByPageIdAndSlug(safeDto.pageId, safeDto.blockMountId)` 사용 (Resolver 제거).
- 서비스: duplicate-block-and-mount, soft-delete-block-mount, update-block-size, update-block-view-mode, move-block-to-page, update-block-position, create-edge (source/target blockMount 조회) 등:
  - **레포 호출**: 패턴 미적용 경로만 `findById` → `findByPageIdAndSlug(pageId, slug)`, `findByIds` → `findByPageIdAndSlugs(pageId, slugs)`.
  - **규칙 적용**: 인자 3개 이상이면 단일 params 객체 사용. scope·식별자는 **safePageId**, **safeBlockMountSlug** 또는 패턴 적용 시 **safeBlockMountAggregate** 등. 액션은 **PageActionContext** 또는 **BlockMountActionContext**에서 전달, 서비스는 safeDto 재파싱 없이 전달받은 값 사용.
- [duplicate-block-and-mount.service.ts](apps/web/src/domains/canvas-management/backend/services/block-mount/duplicate-block-and-mount.service.ts) 등 `findByIds` 사용처를 `findByPageIdAndSlugs`로 교체.

### 2.6 Block Mount 조회·응답

- CanvasQueryService: blockMount 조회 시 slug 선택, 응답에 blockMountId 등으로 **slug** 노출.
- Create block mount 응답: blockMountId 값을 **slug**로 반환.

### 2.7 Phase 2 검토 포인트

- Create 시 (page_id, slug) 유일 위반 재시도 동작.
- 모든 block mount 관련 서비스·액션이 (pageId + slug) 조회만 사용하는지.
- group-node 서비스 등 blockMount를 조회하는 곳이 pageId + slug 기반으로 변경되었는지.
- 테스트: canvas-management.service.test, drizzle-block-mount.repository 등.

---

## Phase 3: Edges

### 3.1 DB·스키마 (Edges)

- 마이그레이션: `edges`에 `slug` 컬럼 추가, `UNIQUE(page_id, slug)`, backfill = UUID hex 앞 8자.
- 스키마에 `slug` 및 unique 제약 반영.

### 3.2 Create 시 유일성 (Edges)

- [drizzle-edge.repository.ts](apps/web/src/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository.ts) `create`:
  - insert 시 `slug` 포함.
  - `23505` catch에서 **pkey**와 **(page_id, slug) unique** 구분, slug 충돌 시 id+slug 재생성 후 최대 3회 재시도.

### 3.3 Edge 레포 조회 방식

- [edge.repository.interface.ts](apps/web/src/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface.ts): `findById` 제거, 추가:
  - `findByPageIdAndSlug(pageId: PageId, slug: string): Promise<EdgeAggregate | null>`
- [drizzle-edge.repository.ts](apps/web/src/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository.ts): 위 구현, `findById` 제거.

### 3.4 Edge 요청 DTO (slug + pageId)

- [edge.requests.ts](apps/web/src/domains/canvas-management/shared/dtos/requests/edge.requests.ts):
  - edgeId: **slug만 허용** (UUID 허용하지 않음).
  - **pageId**를 모든 edge 액션 요청에 포함 (삭제/스타일/라벨/마커/shape 등). safeDto에서 (pageId, edgeId(slug))로 조회.

### 3.5 Edge Secure Action 및 서비스

- Edge 액션: **safeDto.pageId**로 권한 검증. 단일 edge 조작 시 **“Aggregate 조회·전달 패턴” 적용 권장**: secure action에서 `findByPageIdAndSlug`로 조회 후 **EdgeActionContext.edgeAggregate**로 넘기고, 서비스는 **safeEdgeAggregate** params만 사용. 미적용 시 레포 `findByPageIdAndSlug(safeDto.pageId, safeDto.edgeId)` 로 조회 (Resolver 없음).
- delete-edge, update-edge-style, update-edge-label, update-edge-markers, update-edge-shape 등:
  - `findById(edgeId)` → `findByPageIdAndSlug(pageId, slug)` 로 변경 (또는 패턴 적용 시 서비스 내부 재조회 없음).
  - **규칙 적용**: 인자 3개 이상이면 단일 params 객체 사용. scope·식별자는 **safePageId**, **safeEdgeSlug** 또는 **safeEdgeAggregate** 명칭. 액션은 **PageActionContext** 또는 **EdgeActionContext**에서 전달, 서비스는 safeDto 재파싱 없이 전달받은 값 사용.

### 3.6 Edge 조회·응답

- CanvasQueryService: edge 조회 시 slug 선택, 응답에 edgeId를 **slug**로 노출.
- Create edge 응답: edgeId 값을 **slug**로 반환.

### 3.7 Phase 3 검토 포인트

- Create 시 (page_id, slug) 유일 위반 재시도.
- 모든 edge 서비스가 (pageId + slug) 조회만 사용하는지.
- 테스트: use-create-edge.test.tsx, edge 관련 액션/서비스 테스트.

---

## 공통·후속

- **Agent V2 / Tools**: 툴 파라미터가 slug일 때, (workspaceId 또는 pageId) + slug로 서비스/레포 호출. Resolver 제거 후에는 별도 해석 레이어 없이 safeDto의 scope + slug만 사용.
- **테스트 요약**: VO/엔티티/애그리게이트는 계속 UUID만 사용해도 되며, 액션·서비스·레포 테스트는 slug 전달 및 findBy[Scope]AndSlug(s) 호출 검증으로 정리.

---

## Phase별 실행 순서

1. **Phase 1 (Blocks)**: 계획 검토 → 구현 → Phase 1 검토 → 완료 후 Phase 2 진행.
2. **Phase 2 (Block Mounts)**: 계획 검토 → 구현 → Phase 2 검토 → 완료 후 Phase 3 진행.
3. **Phase 3 (Edges)**: 계획 검토 → 구현 → Phase 3 검토 → 공통(Agent V2 등) 정리.

각 phase는 “검토 → 구현 → 검토 → 다음”으로 나누어 진행한다.