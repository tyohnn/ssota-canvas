/**
 * Visual Summary Tool Schemas
 * 
 * Client-side tool definitions for Visual Summary generation
 */

import { z } from 'zod';

/**
 * renderCanvasdown Tool
 * 
 * Client-side tool that renders Canvasdown code on the canvas.
 * This tool takes a Canvasdown code string and creates nodes/edges on the canvas.
 */
export const renderCanvasdownTool = {
  description: `Render Canvasdown DSL code to the React Flow canvas.

Canvasdown is a DSL that converts structured text into interactive canvas nodes and edges.

=== SYNTAX ===

**Canvas:** canvas TB | LR | RL | BT

**Shape Block:**
@shape id "Label" {
  shapeType: rectangle | ellipse | triangle | diamond | hexagon | parallelogram | cylinder,
  color: red | orange | amber | green | blue | purple | pink | gray,
  borderStyle: solid | dashed | dotted,
  title: "Content",
  content: "Markdown text"
}

**Markdown Block:**
@markdown id "Label" {
  color: gray,
  title: "Title",
  content: "Markdown text"
}

**Zone (Group):**
@zone id "Label" {
  direction: TB | LR | RL | BT,
  color: red | orange | amber | green | blue | purple | pink | gray,
  title: "Zone Title",
  content: "Markdown text"
}
  @shape child_id "Child" { ... }
@end

**Edges:**
# Basic edge
source_id -> target_id

# Edge with label
source_id -> target_id : "label"

# Edge with properties
source_id -> target_id {
  label: "Connection",
  markerEnd: "arrowclosed",
  markerStart: "arrow",
  style: { stroke: "red" | "green" | "blue" | "purple" | "gray" | "orange" | "amber" | "pink", strokeWidth: 2 },
  shape: "default" | "straight" | "step" | "smoothstep" | "simplebezier"
}

=== AVAILABLE EDGE MARKERS ===

Use markerEnd (target side) and/or markerStart (source side) in edge properties.

| Value         | Description                    |
|---------------|--------------------------------|
| arrow         | Filled arrow (same as arrowclosed) |
| arrowclosed   | Filled arrow at end of edge    |
| arrow-open    | Outline arrow (no fill)        |
| circle        | Filled circle                  |
| circle-open   | Outline circle                 |
| diamond       | Filled diamond                 |
| diamond-open  | Outline diamond                |

Example:
  a -> b { markerEnd: "arrowclosed" }
  a -> b { markerStart: "arrow-open", markerEnd: "circle" }

**Patch:**
@update blockMountId { title: "New content" }
@update blockMountId { title: "X", content: "Markdown here" }
@connect blockMountId1 -> blockMountId2 : "label"

=== RULES ===

- Strings: NO apostrophes ("Do Not" NOT "Don't")
- Properties: Comma-separated

=== PATCH @update: CRITICAL (avoids parse errors) ===

- **Never use \`->\` or \`<-\`** inside @update title or content. The parser treats them as syntax and fails.
  - Use "to", "implies", "leads to", or Unicode arrow "→" (U+2192) / "←" (U+2190) instead.
  - BAD: content: "A -> B" or "Step 1 -> Step 2"
  - GOOD: content: "A leads to B" or "A → B"
- Keep **title** and **content** as **single-line**, **double-quoted** strings. Do not put actual line breaks (Enter) inside the string; use "\\n" when you need a new line in content.

=== IMPORTANT: PATCH ID MAPPING ===

When using @update or @connect patches, you MUST use the actual blockMountId from the canvas, NOT the original canvasdown ID.

1. When you create blocks, renderCanvasdown returns:
  { blockIdMap: { "your_canvasdown_id": "block-mount-abc123" } }

2. For patches, use the blockMountId value:
  CORRECT: @update block-mount-abc123 { title: "New content" }
  WRONG: @update your_canvasdown_id { title: "New content" }

The blockIdMap maps your DSL IDs to actual canvas-rendered IDs. Always reference this map when patching.

=== RESULT ===

Returns { success: true, blockIdMap: { canvasdownId: blockMountId } }
Save this blockIdMap for subsequent @update and @connect commands.`,
  inputSchema: z.object({
    canvasdown: z
      .string()
      .describe('Canvasdown DSL code to render'),
  }),
};

const renderCanvasdownAnchorSchema = {
  canvasdown: z.string().describe('Canvasdown DSL code to render'),
  anchorBlockId: z
    .string()
    .describe(
      'Block mount ID of the zone/group to place this content to the right (or below) of. Use blockMountId from previous renderCanvasdown / renderCanvasdownRight / renderCanvasdownBelow blockIdMap, NOT canvasdown IDs.'
    ),
};

/**
 * renderCanvasdownRight Tool
 *
 * Renders Canvasdown to the RIGHT of an existing zone/group block.
 * Use for the second and later zones in multi-zone templates.
 * First zone: use renderCanvasdown. Subsequent zones: use this or renderCanvasdownBelow with anchorBlockId from blockIdMap.
 */
export const renderCanvasdownRightTool = {
  description: `Render Canvasdown DSL to the RIGHT of an existing zone/group block.

Use when adding a second (or later) zone in multi-zone templates. Place the first zone with renderCanvasdown; place subsequent zones with renderCanvasdownRight or renderCanvasdownBelow so they do not overlap.

anchorBlockId MUST be the blockMountId of the zone/group block from a previous tool result (blockIdMap). Do NOT use canvasdown IDs.`,
  inputSchema: z.object(renderCanvasdownAnchorSchema),
};

/**
 * renderCanvasdownBelow Tool
 *
 * Renders Canvasdown BELOW an existing zone/group block.
 * Use for the second and later zones in multi-zone templates.
 */
export const renderCanvasdownBelowTool = {
  description: `Render Canvasdown DSL BELOW an existing zone/group block.

Use when adding a second (or later) zone in multi-zone templates. Place the first zone with renderCanvasdown; place subsequent zones with renderCanvasdownRight or renderCanvasdownBelow so they do not overlap.

anchorBlockId MUST be the blockMountId of the zone/group block from a previous tool result (blockIdMap). Do NOT use canvasdown IDs.`,
  inputSchema: z.object(renderCanvasdownAnchorSchema),
};

/**
 * planTodo Tool
 * 
 * AI가 작업 계획을 todo 리스트로 생성
 */
export const planTodoTool = {
  description: `Create a todo list based on the template structure. Use clear, short todo titles that are easy to understand.

=== WORKFLOW ===

**Single-zone templates**: Two kinds of todos. (1) One zone skeleton todo. (2) One todo per content-fill layer (see template Phase 2 for the layer list).
1. Zone skeleton — one renderCanvasdown call with zone, blocks, and all edges.
2. One todo per layer — use the layer names from the template Phase 2 (e.g. "Fill Thesis content", "Fill Claims content").

**Multi-zone templates**: Zone skeleton todos + one todo per content-fill layer (per zone or as in template Phase 2) + optional zone connections.
1. Zone Setup — first zone: renderCanvasdown; later zones: renderCanvasdownRight(anchorBlockId) or renderCanvasdownBelow(anchorBlockId). Include edges within each zone.
2. Content Fill — one todo per content-fill layer (see template Phase 2).
3. Zone Connections (if needed) — use @connect only when template has multiple zones.

=== EXAMPLE (single zone, e.g. Argument Map) ===

- id: "zone_skeleton", title: "Create zone skeleton and edges"
- id: "fill_thesis", title: "Fill Thesis content"
- id: "fill_claims", title: "Fill Claims content"
- id: "fill_evidence", title: "Fill Evidence content"
- id: "fill_counterpoints", title: "Fill Counterpoints content"
- id: "fill_action_plan", title: "Fill Action plan content"

=== EXAMPLE (multi-zone) ===

- id: "zone_thesis", title: "Create thesis zone"
- id: "zone_claims", title: "Create claims zone"
- id: "zone_evidence", title: "Create evidence zone"
- id: "fill_thesis", title: "Fill Thesis content"
- id: "fill_claims", title: "Fill Claims content"
- id: "fill_evidence", title: "Fill Evidence content"
- id: "connect_zones", title: "Connect zones with edges"`,
  inputSchema: z.object({
    todos: z
      .array(
        z.object({
          id: z.string().describe('Unique identifier for the todo'),
          title: z.string().describe('Todo title'),
          description: z.string().optional().describe('Optional description'),
        })
      )
      .describe('List of todos based on template structure'),
  }),
};

/**
 * updateTodo Tool
 * 
 * AI가 todo 상태를 업데이트
 */
export const updateTodoTool = {
  description: `Mark a todo as completed after finishing the corresponding step.`,
  inputSchema: z.object({
    id: z.string().describe('Todo ID to update'),
    status: z.enum(['pending', 'completed']).describe('New status'),
    description: z.string().optional().describe('Updated description'),
  }),
};
