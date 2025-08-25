## Revised Phases (v2, based on latest architecture decisions)

### Phase 0 (Done): Architecture alignment

- Docs aligned to: soft-migration for block_type/edge_type, parent_block_id hierarchy, object enum with `component` + `metadata.role` (no separate component_definitions table), no column_definition, dynamic policies, page block identification via metadata.

### Phase 1: DB migration (soft)

- block_type enum: add `text_block`.
- edge_type enum: add `arrow`.
- Add `object` enum column on `blocks` with values: `page` | `component` | `block`; use `metadata.role` to distinguish `definition` vs `instance` when `object = "component"`.
- No page_type; use `parent_block_id` only for hierarchy.

- References:
  - `xbowl/apps/web/src/db/schema.ts`
  - `xbowl/apps/web/drizzle/*.sql`
- Pseudocode example (SQL):
  ```sql
  -- add enums and object column
  ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'text_block';
  ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'arrow';
  ALTER TABLE blocks ADD COLUMN IF NOT EXISTS object TEXT CHECK (object IN ('page','component','block'));
  CREATE INDEX IF NOT EXISTS idx_blocks_object ON blocks(object);
  ```
- Tasks:
  - Add `text_block` and `basic` to enums
  - Add `blocks.object` column with check + index
  - Verify RLS/indexes remain correct; update snapshots

### Phase 2: Actions/Repository

- Implement CRUD for `blocks` where `object = "component"`: list definitions (`metadata.role = "definition"`) and instances; filter by workspace/ids.
- Add page-metadata validator (views/allowed_component_ids/allowed_edge_types required for page).

- References:
  - `xbowl/apps/web/src/domains/workflow-canvas/actions/block.action.ts`
  - `xbowl/apps/web/src/domains/workflow-canvas/actions/edge.action.ts`
- Pseudocode example (TS):
  ```ts
  export async function listComponentDefinitions(workspaceId: string) {
    return db.rls((tx) =>
      tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, workspaceId),
            eq(blocks.object, "component"),
            sql`(metadata->>'role') = 'definition'`
          )
        )
    );
  }
  export function validatePageMetadata(block: Block) {
    const m = block.metadata || {};
    if (!m.views || !m.allowed_component_ids || !m.allowed_edge_types)
      throw new Error("invalid page metadata");
  }
  ```
- Tasks:
  - Implement `listComponentDefinitions`, `listComponentInstancesByDefinitionIds`
  - Add page metadata validator utility and call sites
  - Keep existing CRUD endpoints; add `object/role` filters as needed

### Phase 3: State layer

- Add `useDbCanvasState` (single source CRUD) and wire to `CanvasContext`.
- Load/cache component definitions from `blocks` (`object = "component"`, `metadata.role = "definition"`) into context (map by id).
- Keep `useReactFlowCanvasState` as derived display state only.

- References:
  - `xbowl/apps/web/src/domains/workflow-canvas/contexts/CanvasContext.tsx`
  - `xbowl/apps/web/src/domains/workflow-canvas/hooks/state/useCanvasState.tsx`
  - `xbowl/apps/web/src/domains/workflow-canvas/hooks/state/useReactFlowCanvasState.tsx`
  - `xbowl/apps/web/src/domains/workflow-canvas/hooks/component/useCanvasHandler.tsx`
- Pseudocode example (TS):
  ```ts
  const componentDefinitionMap = useMemo(
    () => new Map(defs.map((d) => [d.id, d])),
    [defs]
  );
  ```
- Tasks:
  - Load component definitions on init; memoize `Map<string, DbBlock>`
  - Optionally expose in `CanvasContext` for policies/adapters
  - Preserve pure DB state vs derived display state separation

### Phase 4: Explorer (parent_block_id)

- Build tree from `parent_block_id`.
- Page detection by required metadata keys; folders are blocks without page metadata.
- Selection opens page and triggers display recalculation.
- Group navigation folders by `parent_block_id`

- References:
  - `xbowl/apps/web/src/domains/workflow-canvas/hooks/component/usePageBlockExplorerHandler.tsx`
  - `xbowl/apps/web/src/domains/workflow-canvas/components/block-control/page-block-explorer.tsx`
- Pseudocode example (TS):
  ```ts
  const isPage = (b: DbBlock) =>
    !!(
      b.metadata?.views &&
      b.metadata?.allowed_component_ids &&
      b.metadata?.allowed_edge_types
    );
  const folders = groupBy(
    dbBlocks,
    (b) => b.metadata?.page_kind ?? "uncategorized"
  );
  const tree = buildTree(dbBlocks, (b) => b.parent_block_id);
  ```
- Tasks:
  - Add `parent_block_id` grouping in explorer
  - Construct tree using `parent_block_id`
  - Use `handlePageBlockSelect` to drive canvas recalculation

### Phase 5: PageRenderingPolicy (dynamic)

- Single dynamic policy:

  - Nodes: instances with `metadata.component_id` ∈ page.allowed_component_ids and have positions in page context.
  - Edges: filter by page.allowed_edge_types.
  - Render: merge `definition.node_ui` + `instance.metadata.overrides.node_ui`.

- References:
  - `xbowl/apps/web/src/domains/workflow-canvas/policy/page-rendering-policy.ts`
- Pseudocode example (TS):
  ```ts
  class DynamicPageRenderingPolicy {
    getBlocksAndEdges(pageId, blocks, edges, positions) {
      const page = blocks.find((b) => b.id === pageId);
      const meta = page?.metadata ?? {};
      const allowed = new Set(meta.allowed_component_ids ?? []);
      const allowedEdge = new Set(meta.allowed_edge_types ?? []);
      const instances = blocks.filter(
        (b) => b.metadata?.component_id && allowed.has(b.metadata.component_id)
      );
      const positioned = instances.filter((b) =>
        positions.some(
          (p) => p.block_id === b.id && p.context_block_id === pageId
        )
      );
      const displayBlocks = positioned.map(
        makeReactFlowNodeByMergingDefAndOverrides
      );
      const displayEdges = edges.filter((e) => allowedEdge.has(e.edge_type));
      return { blocks: displayBlocks, edges: displayEdges };
    }
  }
  ```
- Tasks:
  - Replace per-type strategies with a dynamic metadata-driven policy
  - Merge definition `node_ui` and instance `overrides.node_ui`
  - Apply edge filtering by `allowed_edge_types`

### Phase 6: Block/Edge addition (dynamic)

- Block: show definitions from page.allowed_component_ids plus basic blocks (e.g., `text_block`).
- Edge: keep existing types; allow `basic` default.

- References:
  - `xbowl/apps/web/src/domains/workflow-canvas/policy/block-addition-policy.ts`
  - `xbowl/apps/web/src/domains/workflow-canvas/policy/edge-addition-policy.ts`
  - `xbowl/apps/web/src/domains/workflow-canvas/hooks/component/useCanvasHandler.tsx`
- Pseudocode example (TS):
  ```ts
  class DynamicBlockAdditionPolicy {
    getGroupsWithItems(page, dbBlocks) {
      const defs = (page.metadata.allowed_component_ids ?? [])
        .map((id) => defMap.get(id))
        .filter(Boolean);
      return {
        staticBlocks: [{ id: "text_block", type: "text_block" }],
        dynamicGroups: toGroups(defs),
      };
    }
  }
  class DynamicEdgeAdditionPolicy {
    getEdgesToCreate(page, target) {
      /* generate only within allowed_edge_types; fallback 'basic' */
    }
  }
  ```
- Tasks:
  - Drive block addition from page metadata allowlist + include `text_block`
  - Constrain edge creation to `allowed_edge_types`; default to `basic` when unspecified

### Phase 7: Layout policy (TBD)

- Keep current policies; schedule dedicated design session for page-agnostic rules and batches.

- References: `xbowl/apps/web/src/domains/workflow-canvas/policy/block-layout-policy.ts`
- Tasks:
  - Keep existing policies; collect requirements for parameterization
  - Prepare test scaffolding for future rules

### Phase 8: Editor

- Dynamic form from definition.schema with instance overrides.
- Page editor for `views`, `allowed_component_ids`, `allowed_edge_types` (Notion-like view config).
- Ensure no column_definition usage.

- References:
  - `xbowl/apps/web/src/domains/workflow-canvas/policy/editor-rendering-policy.ts`
  - `xbowl/apps/web/src/domains/workflow-canvas/components/editor-panel/*`
- Pseudocode example (TS):
  ```ts
  function buildEditor(defBlock, instanceBlock) {
    const schema = defBlock.metadata?.schema;
    const overrides = instanceBlock.metadata?.overrides ?? {};
    return renderFormFromSchema(schema, overrides);
  }
  ```
- Tasks:
  - Convert component definition schema → form groups/fields
  - Apply instance overrides to defaults
  - Add page editor for `views`/allowlists

### Phase 9: Multi-view adapters

- Implement `views/{canvas|table|kanban|markdown}`; drive table/kanban from page metadata.

- References:
  - Create: `xbowl/apps/web/src/domains/workflow-canvas/components/views/{canvas,table,kanban,markdown}/index.tsx`
  - `xbowl/apps/web/src/domains/workflow-canvas/components/canvas-page.tsx`
- Pseudocode example (TS):
  ```ts
  export interface ViewAdapter {
    render(props: { dbBlocks; dbEdges; page; defMap }): React.ReactNode;
  }
  export const TableViewAdapter: ViewAdapter = {
    render: ({ dbBlocks, page }) => {
      /* columns from page.metadata.views.table */
    },
  };
  ```
- Tasks:
  - Implement adapters for Canvas/Table/Kanban/Markdown
  - Select adapter in `CanvasPage` based on active view
  - Use DB as single source; no per-view DB writes except intended metadata updates

### Phase 10: Routing

- Support `?view=table|kanban|md` on `/canvas/[workspaceId]`.

- References:
  - `xbowl/apps/web/src/app/(dashboard)/canvas/[workspaceId]/page.tsx`
  - `xbowl/apps/web/src/domains/workflow-canvas/components/canvas-page.tsx`
- Pseudocode example (TSX):
  ```tsx
  export default function Page({ params, searchParams }) {
    const initialView = searchParams.view ?? "canvas";
    return (
      <CanvasPage workspaceId={params.workspaceId} initialView={initialView} />
    );
  }
  ```
- Tasks:
  - Read `view` from searchParams and initialize UI state
  - Keep toolbar and URL in sync on view changes

### Phase 11: Tests

- Unit/integration for dynamic policies, explorer hierarchy, component definition load, page detection, and view switching.

- References:
  - `xbowl/apps/web/src/__tests__/integration/canvas-layout-to-workflow-designer.test.tsx`
  - `xbowl/apps/web/src/__tests__/unit/**`
- Pseudocode example (Jest):
  ```ts
  it("filters nodes/edges by page metadata allowlists", () => {
    // seed page.metadata.allowed_* and positions
    // run DynamicPageRenderingPolicy
    // expect displayBlocks/Edges to match
  });
  ```
- Tasks:
  - Add unit tests for Dynamic PageRendering/Block/Edge policies
  - Test explorer hierarchy and page detection
  - Test definition load/cache and multi-view routing
