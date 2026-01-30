/**
 * Synthesis Board Template
 *
 * Single-zone template: nuggets (information pieces) → insights → actions.
 * All blocks and edges are defined in one zone and rendered together so layout (dagre) sees edges from the start.
 */

import { VisualTemplate, TEMPLATE_IDS } from '@/domains/ai-actions/shared/types/template.types';

export const synthesisBoardTemplate: VisualTemplate = {
  id: TEMPLATE_IDS.SYNTHESIS_BOARD,
  name: 'Synthesis Board',
  description: 'Cluster information pieces into insights/actions',
  icon: 'Lightbulb',

  promptSpec: `
=== SYNTHESIS BOARD TEMPLATE ===

Layout: canvas TB
Single zone. Nuggets (information pieces) + derived insights + actions/questions. Define all edges in the same render as the zone.

=== STRUCTURE (ONE ZONE) ===

**Single zone: synthesis_board_zone**
- One @zone containing all blocks. Use direction TB. Zone color: gray.

**Blocks inside the zone (ids, shapes, colors):**
1. **Nuggets**: 8-20 @shape (shapeType: rectangle, color: gray or by theme) — nugget_1, nugget_2, … Raw information pieces. **Use color to group by theme** (e.g. nuggets of theme A = blue, theme B = green) from red | orange | amber | green | blue | purple | pink | gray.
2. **Insights**: 3-7 @shape (shapeType: ellipse, color: amber) — insight_1, insight_2, … Derived insights from clusters.
3. **Actions**: 2 @markdown — actions, questions. Action items and open questions.

**Titles**: From source, 2-5 words. No generic labels.

**Content**: Markdown, at least one full paragraph per block; include concrete detail from the source.

**Edges (include in the SAME canvasdown as the zone):**
- Use flat stroke and strokeWidth (no nested object): stroke: "red" | "orange" | "amber" | "green" | "blue" | "purple" | "pink" | "gray", strokeWidth: number.
- nugget_1 -> nugget_2, … (label e.g. "relates to", markerEnd: "arrowclosed", shape: "default", stroke: color) for related nuggets.
- nugget_1 -> insight_1, nugget_2 -> insight_1, … (label e.g. "derives", stroke: color) — nuggets of same theme point to same insight.
- insight_1 -> insight_2, … (label e.g. "relates to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "amber")
- insight_1 -> actions or insight_1 -> questions (label e.g. "leads to", stroke: color) if relevant.

=== WORKFLOW ===

**Phase 1: Single zone skeleton + ALL edges (one renderCanvasdown call)**
1. Create @zone synthesis_board_zone with title from user message (use "Source Title - Template Name" from Source metadata). Add all blocks with **titles extracted from the source**. Use minimal content for skeleton.
2. Apply structure: nuggets as rectangles (color by theme); insights as amber ellipses; actions/questions as markdown.
3. In the SAME canvasdown, define ALL edges (nugget↔nugget, nugget→insight, insight↔insight, insight→actions/questions).
4. Call renderCanvasdown ONCE with this full canvasdown. Do NOT split zones or defer edges.

**Phase 2: Content fill (@update with blockMountId)**
Content fill layers (create one todo per layer when planning): Nuggets, Insights, Actions.
1. Complete one layer at a time; use @update for blocks in that layer only.
2. Use blockMountId from the tool result blockIdMap (NOT canvasdown ids).
3. @update blocks with title and **content** (markdown). Content must be at least one full paragraph per block; convey the source completely.

=== EXAMPLE SKELETON (edges in same block) ===

canvas TB

@zone synthesis_board_zone "<Source Title - Synthesis Board>" { direction: TB, color: gray }
  @shape nugget_1 "<extract information piece>" { shapeType: rectangle, color: blue, title: "<extract phrase>" }
  @shape nugget_2 "<extract information piece>" { shapeType: rectangle, color: blue, title: "<extract phrase>" }
  @shape nugget_3 "<extract information piece>" { shapeType: rectangle, color: green, title: "<extract phrase>" }
  @shape insight_1 "<extract insight statement>" { shapeType: ellipse, color: amber, title: "<extract insight>" }
  @shape insight_2 "<extract insight statement>" { shapeType: ellipse, color: amber, title: "<extract insight>" }
  @markdown actions "<extract actions title>" { title: "<extract actions title>" }
  @markdown questions "<extract questions title>" { title: "<extract questions title>" }
@end

nugget_1 -> nugget_2 { label: "relates to", markerEnd: "arrowclosed", shape: "default", stroke: "blue" }
nugget_1 -> insight_1 { label: "derives", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "amber" }
nugget_2 -> insight_1 { label: "derives", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "amber" }
nugget_3 -> insight_2 { label: "derives", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "amber" }
insight_1 -> insight_2 { label: "relates to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "amber" }
insight_1 -> actions { label: "leads to", markerEnd: "arrowclosed", shape: "default", stroke: "gray" }

=== LIMITS ===
- Max concepts: 20
- Max edges: 15
- Max markdown content: 6000 chars
`,

  limits: {
    maxConcepts: 20,
    maxEdges: 15,
    maxMarkdownChars: 6000,
  },
};
