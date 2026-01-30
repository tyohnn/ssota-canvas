/**
 * Framework Canvas Template
 *
 * Single-zone template: framework at center with definitions, examples, risks, and actions.
 * All blocks and edges are defined in one zone and rendered together so layout (dagre) sees edges from the start.
 */

import { VisualTemplate, TEMPLATE_IDS } from '@/domains/ai-actions/shared/types/template.types';

export const frameworkCanvasTemplate: VisualTemplate = {
  id: TEMPLATE_IDS.FRAMEWORK_CANVAS,
  name: 'Framework Canvas',
  description: 'Place models/frameworks at center with definitions, examples, risks, and actions around',
  icon: 'LayoutGrid',

  promptSpec: `
=== FRAMEWORK CANVAS TEMPLATE ===

Layout: canvas LR
Single zone. Framework components (center) + definitions, examples, risks, action guide. Define all edges in the same render as the zone.

=== STRUCTURE (ONE ZONE) ===

**Single zone: framework_canvas_zone**
- One @zone containing all blocks. Use direction LR. Zone color: gray.

**Blocks inside the zone (ids, shapes, colors):**
1. **Framework core**: 4-12 @shape (shapeType: ellipse or rectangle, color: orange) — component_1, component_2, … Main framework components.
2. **Definitions**: 2-5 @markdown — definition_1, definition_2, … Term definitions and explanations.
3. **Examples**: 1-3 @markdown — example_1, example_2, … Concrete examples and use cases.
4. **Risks**: 1-3 @shape (shapeType: diamond, color: red) — risk_1, risk_2, … Risks, limitations, tradeoffs.
5. **Action guide**: 1 @markdown — id action_guide. How to apply the framework.

**Titles**: From source, 2-5 words. No generic labels.

**Content**: Markdown, at least one full paragraph per block; include concrete detail from the source.

**Edges (include in the SAME canvasdown as the zone):**
- Use flat stroke and strokeWidth (no nested object): stroke: "red" | "orange" | "amber" | "green" | "blue" | "purple" | "pink" | "gray", strokeWidth: number.
- component_1 -> component_2, … (label e.g. "connects to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: color)
- definition_1 -> component_1, … (label e.g. "defines", stroke: color)
- component_2 -> example_1, … (label e.g. "illustrates", stroke: color)
- risk_1 -> component_3, … (label e.g. "warns", stroke: "red")

=== WORKFLOW ===

**Phase 1: Single zone skeleton + ALL edges (one renderCanvasdown call)**
1. Create @zone framework_canvas_zone with title from user message (use "Source Title - Template Name" from Source metadata). Add all blocks with **titles extracted from the source**. Use minimal content for skeleton.
2. Apply structure: components orange ellipse/rectangle; risks red diamond; definitions/examples/action_guide as markdown.
3. In the SAME canvasdown, define ALL edges (component↔component, definition→component, component→example, risk→component).
4. Call renderCanvasdown ONCE with this full canvasdown. Do NOT split zones or defer edges.

**Phase 2: Content fill (@update with blockMountId)**
Content fill layers (create one todo per layer when planning): Framework core, Definitions, Examples, Risks, Action guide.
1. Complete one layer at a time; use @update for blocks in that layer only.
2. Use blockMountId from the tool result blockIdMap (NOT canvasdown ids).
3. @update blocks with title and **content** (markdown). Content must be at least one full paragraph per block; convey the source completely.

=== EXAMPLE SKELETON (edges in same block) ===

canvas LR

@zone framework_canvas_zone "<Source Title - Framework Canvas>" { direction: LR, color: gray }
  @shape component_1 "<extract component name>" { shapeType: ellipse, color: orange, title: "<extract component name>" }
  @shape component_2 "<extract component name>" { shapeType: ellipse, color: orange, title: "<extract component name>" }
  @shape component_3 "<extract component name>" { shapeType: rectangle, color: orange, title: "<extract component name>" }
  @markdown definition_1 "<extract definition title>" { title: "<extract definition title>" }
  @markdown example_1 "<extract example title>" { title: "<extract example title>" }
  @shape risk_1 "<extract risk description>" { shapeType: diamond, color: red, title: "<extract risk>" }
  @markdown action_guide "<extract action guide title>" { title: "<extract action guide title>" }
@end

component_1 -> component_2 { label: "connects to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "orange" }
component_2 -> component_3 { label: "connects to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "orange" }
definition_1 -> component_1 { label: "defines", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "gray" }
component_2 -> example_1 { label: "illustrates", markerEnd: "arrowclosed", shape: "step", stroke: "blue" }
risk_1 -> component_3 { label: "warns", markerEnd: "arrowclosed", shape: "default", stroke: "red" }

=== LIMITS ===
- Max concepts: 12
- Max edges: 20
- Max markdown content: 4000 chars
`,

  limits: {
    maxConcepts: 12,
    maxEdges: 20,
    maxMarkdownChars: 4000,
  },
};
