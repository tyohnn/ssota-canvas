---
name: Block Mount Edge Slug
overview: blocks, block_mounts, edges에 UUID 앞 8자리 slug를 추가하고, 프론트/API는 slug를 식별자로 사용. 서버 내부(VO·서비스·레포)는 UUID 유지, 액션 경계에서 slug → UUID 해석.
todos:
  - id: migration-schema
    content: "Migration + Drizzle 스키마: slug 컬럼 추가, backfill, unique"
    status: pending
  - id: resolver-repo
    content: "Resolver + 레포 메서드: findByPageIdAndSlug(block_mount, edge), findByWorkspaceIdAndSlug(block)"
    status: pending
  - id: create-slug
    content: "Create 경로: block, block_mount, edge 생성 시 slug 계산·저장"
    status: pending
  - id: query-response
    content: "조회/응답: CanvasQueryService 및 create 응답에서 slug 반환"
    status: pending
  - id: request-schema
    content: "요청 스키마: slug(8자 hex 또는 UUID) 허용으로 변경"
    status: pending
  - id: actions-resolve
    content: "액션 일괄: block-mount, edge, group-node, block-management 액션에서 resolve 적용"
    status: pending
  - id: agent-v2
    content: "Agent v2: 툴 파라미터 slug → UUID 변환"
    status: pending
  - id: tests
    content: "테스트: canvas-management.service.test, use-create-edge.test.tsx 등 반영"
    status: pending
isProject: false
---

# Block / Block Mount / Edge Slug 전환 계획

## 목표

- **DB**: `blocks`, `block_mounts`, `edges`에 8자리 `slug` 컬럼 추가 (UUID hex 앞 8자).
- **유일성**: block = `(workspace_id, slug)`, block_mount = `(page_id, slug)`, edge = `(page_id, slug)`.
- **프론트/API**: `node.id` = blockMountSlug, `node.data.blockMountId` = blockMountSlug, `node.data.blockId` = blockSlug, `edge.id` = edgeSlug, `edge.data.edgeId` = edgeSlug.
- **서버 내부**: Value Object·서비스·레포는 UUID만 사용. 액션 진입 시에만 slug → UUID 해석.

---

## 서비스·액션 규칙 (Phase 1 Block / Phase 2 Block Mount / Phase 3 Edge 공통)

- **단일 params 객체**: 서비스 인자가 3개 이상이면 반드시 단일 params 객체로 전달 (예: `SoftDeleteBlockParams`, `UpdateBlockTitleParams`). 인자 나열 대신 `params: SomeParams` 형태.
- **safe 명칭**: 권한 검증된 값은 `safe` 접두사로 구분.
  - **Phase 1 (Block)**: `safeWorkspaceId`, `safeBlockSlug` (일괄 시 `safeBlockSlugs`).
  - **Phase 2 (Block Mount)**: `safePageId`, `safeBlockMountSlug` (일괄 시 `safeBlockMountSlugs`).
  - **Phase 3 (Edge)**: `safePageId`, `safeEdgeSlug` (일괄 시 `safeEdgeSlugs`).
- **Context 전달**: 액션에서 authorize 통과 후 받은 context(`WorkspaceActionContext`, `PageActionContext` 등)의 scope ID를 서비스에 그대로 전달. 서비스는 safeDto에서 workspaceId/pageId를 재파싱하지 않음.

---

## 아키텍처 요약

- **응답**: `CanvasQueryService` / create 응답에서 `id` 대신 `slug` 반환 (필드명 유지: `blockMountId`, `blockId`, `edgeId`).
- **요청**: 클라이언트는 같은 필드명으로 slug(8자) 전송. 액션에서 Resolver로 UUID로 바꾼 뒤 기존 서비스 호출.

---

## 1. DB 및 Drizzle 스키마

- **마이그레이션**: `blocks` / `block_mounts` / `edges`에 `slug` 컬럼, UNIQUE(scope, slug), backfill = UUID hex 앞 8자.
- **스키마**: [apps/web/src/db/schemas/public/canvas-schema.ts](apps/web/src/db/schemas/public/canvas-schema.ts)에 `slug` 및 unique 제약.
- **slug 생성**: 신규 시 `slug = uuid.replace(/-/g, '').slice(0, 8)`. 충돌 시 재시도 또는 10자 확장.

---

## 2. Slug 해석 레이어 (Resolver)

- **위치**: 예) `apps/web/src/domains/canvas-management/actions/slug-resolver.ts`
- **함수**: `resolveBlockMountId(pageId, slugOrUuid)`, `resolveBlockId(workspaceId, slugOrUuid)`, `resolveEdgeId(pageId, slugOrUuid)` → UUID 문자열 반환. 이미 UUID면 그대로 반환.
- **레포**: `findIdByPageIdAndSlug`(block_mount, edge), `findIdByWorkspaceIdAndSlug`(block).

---

## 3. 저장 시 slug 설정 (Create 경로)

- Block: create-block 서비스/레포에서 id 생성 후 slug 계산해 insert.
- Block mount: [create-and-mount-block.service.ts](apps/web/src/domains/canvas-management/backend/services/block-mount/create-and-mount-block.service.ts), [drizzle-block-mount.repository.ts](apps/web/src/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository.ts) create 시 slug 포함.
- Edge: aggregate/repo create 시 slug 계산해 insert.

---

## 4. 조회/응답에서 slug 노출

- **CanvasQueryService**: blockMounts/edges 조회 시 row.slug 선택, DTO에 `blockMountId`/`blockId`/`edgeId` 값으로 slug 매핑.
- **Create 응답**: 기존 필드명 유지, 값만 slug.

---

## 5. 프론트엔드

- ACL/뷰: 백엔드가 slug를 주면 node.id / data / edge.id에 그대로 반영. 구조 변경 없음.
- Optimistic: 서버 응답의 blockMountId/blockId/edgeId(slug)로 노드·엣지 교체.

---

## 6. 서버 액션 및 요청 스키마

- **요청 스키마**: [edge.requests.ts](apps/web/src/domains/canvas-management/shared/dtos/requests/edge.requests.ts) 등에서 id 필드를 `z.union([z.uuid(), z.string().length(8).regex(/^[0-9a-f]+$/i)])` 등으로 변경.
- **액션**: block-mount, edge, group-node, block-management 액션에서 들어온 id를 resolve 후 UUID로 서비스 호출.

---

## 7. Agent V2 / Tools

- 컨텍스트는 캔버스 뷰 값 그대로 사용 → slug면 slug 주입.
- 툴 실행부: blockMountId/blockId 등 파라미터를 pageId/workspaceId와 함께 resolve 후 기존 서비스 호출.

---

## 8. 수정 지점 요약


| 구분       | 지점                                              | 변경 내용                                                                      |
| -------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| DB       | Supabase migration                              | blocks/block_mounts/edges slug 컬럼 + unique, backfill                       |
| 스키마      | canvas-schema.ts, block 스키마                     | slug 컬럼 및 unique                                                           |
| 저장       | block/mount/edge create                         | UUID 생성 후 slug 계산해 insert                                                  |
| 조회       | 레포 select, CanvasQueryService                   | slug select 후 DTO에 slug로 매핑                                                |
| Resolver | 새 파일 + 레포 3종                                    | findByPageIdAndSlug 등 + resolve 함수 3개                                      |
| 요청 스키마   | edge.requests, block-mount 요청                   | id를 uuid 또는 8자 hex 허용                                                      |
| 액션       | block-mount, edge, group-node, block-management | 요청 id resolve 후 서비스 호출. context에서 scope ID 전달, 서비스는 단일 params 객체 + safe 명칭 |
| Agent    | v2 툴 실행부                                        | slug → UUID 후 서비스 호출                                                       |
| 프론트      | (선택)                                            | 응답 slug를 node/edge id에 반영 확인                                               |


---

# 테스트 영향 분석

## 1. 변경 없음 (VO/도메인은 UUID 유지)


| 파일                                                                                       | 이유                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `block-mount-id.vo` 테스트                                                                  | BlockMountId는 UUID만 허용. slug는 액션에서 UUID로 해석 후 VO에 전달하므로 테스트 유지. |
| `edge-id.vo` 테스트                                                                         | 동일. EdgeId는 UUID만 허용.                                           |
| `block-id.vo` (block-management) 테스트                                                     | 동일. BlockId는 UUID만 허용.                                          |
| `edge.entity.test.ts`                                                                    | 엔티티 생성 시 UUID 사용. 도메인 내부는 UUID만 사용.                             |
| `block-mount.entity.test.ts`                                                             | 동일.                                                             |
| `edge.aggregate.test.ts`                                                                 | 동일.                                                             |
| `block-mount.aggregate.test.ts`                                                          | 동일.                                                             |
| `block-mount-duplication.test.ts`                                                        | 동일.                                                             |
| `block.aggregate.test.ts` (block-management)                                             | 동일.                                                             |
| `event-log.aggregate.test.ts`, `event-log.entity.test.ts`, `tool-call-result.vo.test.ts` | blockId는 이벤트/도메인 내부; UUID 유지 시 변경 없음.                           |
| `read-block-lines.service.test.ts`                                                       | 서비스는 액션에서 해석된 UUID만 받음. UUID/randomUUID() 사용 시 변경 없음.           |
| `grep-block-content.service.test.ts`, `glob-blocks.service.test.ts`                      | blockMountId mock; 서비스 입장에서는 문자열. 필요 시 UUID로 통일만 하면 됨.          |


---

## 2. 변경 필요

### 2-1. Canvas Query / View가 slug를 반환하는 경우


| 파일                                  | 변경 내용                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas-management.service.test.ts` | getCanvasView 기대값이 UUID → slug로 바뀜. mock aggregate가 blockMountId.value 대신 slug를 노출하도록 하거나, 레포 mock row에 slug를 넣고 서비스가 blockMountId에 slug를 매핑하는지 검증. |


### 2-2. 프론트: 엣지 생성 훅 (API 응답이 slug일 때)


| 파일                         | 변경 내용                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `use-create-edge.test.tsx` | mock 응답·기대값을 8자리 slug로 변경. expect(edge.id).toBe(mockEdgeView.edgeId) 등이 slug 기준이 되도록. invalid-uuid 검증은 slug 형식 검증으로 대체하거나, “8자 hex 또는 UUID” 허용 시 둘 다 테스트. |


### 2-3. Block Management 액션 (slug 입력 허용 시)


| 파일                      | 변경 내용                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `block.actions.test.ts` | 기존 UUID 케이스 유지. slug로 호출하는 케이스 추가 시 resolver mock으로 UUID가 넘어가 성공하는지 검증. 스키마가 “slug 또는 UUID”면 invalid-uuid 실패 테스트 유지 또는 slug 형식 실패 케이스 추가. |


### 2-4. Create Block 액션 (재활성화 시)


| 파일                            | 변경 내용                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `create-block.action.test.ts` | describe.skip 해제 시, 응답이 slug이므로 result.data.blockMountId / blockId 기대를 8자리 slug 형식으로 수정. mock이 slug를 반환하도록 맞추기. |


---

## 3. 레포지토리 테스트 (slug 컬럼 추가 시)


| 파일                                       | 변경 내용                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `drizzle-block-mount.repository.test.ts` | describe.skip 해제 시 create에서 insert 인자에 slug 포함 여부 검증. 스키마 mock에 slug 필드 추가.                                                            |
| `drizzle-edge.repository.test.ts`        | 동일. create 시 insert에 slug 포함 검증, 스키마 mock에 slug 추가.                                                                                    |
| (신규)                                     | Resolver용 레포 메서드 추가 시 findIdByPageIdAndSlug(block_mount), findIdByPageIdAndSlug(edge), findIdByWorkspaceIdAndSlug(block) 단위 테스트 추가 권장. |


---

## 4. Agent / 기타


| 파일                                                                 | 변경 내용                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `context-assembly.service.test.ts`, `event-search.service.test.ts` | findByBlockMountId 등 mock만 사용. 인자는 계속 (해석된) UUID라고 가정하면 됨. 필수 변경 없음. |
| `tool-execution.service.test.ts`                                   | startBlockId 등 UUID 기준이면 변경 없음.                                      |
| `route.integration.test.ts` (agent v2)                             | 툴 파라미터에 slug를 넣고 응답/DB가 기대대로인지 보는 통합 테스트가 있으면 slug 시나리오 1개 추가 권장.    |


---

## 5. 테스트 요약

- **VO/엔티티/애그리게이트/도메인 서비스 테스트**: UUID만 사용하므로 수정 불필요.
- **반드시 수정**: `canvas-management.service.test.ts` (view의 blockMountId/blockId가 slug), `use-create-edge.test.tsx` (응답 slug 시 edge.id / edge.data.edgeId).
- **선택/재활성화 시**: create-block.action.test, block.actions.test에 slug 케이스 추가, drizzle 레포 테스트에 slug insert 검증 및 resolver용 레포 메서드 테스트 추가.

