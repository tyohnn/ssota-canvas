/**
 * Argument Map Template
 *
 * Single-zone template for argument structure: Thesis → Claims → Evidence → Counterpoints → Action.
 * All blocks and edges are defined in one zone and rendered together so layout (dagre) sees edges from the start.
 */

import { VisualTemplate } from '../shared/types/template.types';
import { TEMPLATE_IDS } from '../shared/types/template.types';

export const argumentMapTemplate: VisualTemplate = {
  id: TEMPLATE_IDS.ARGUMENT_MAP,
  name: 'Argument Map',
  description: 'Thesis → Claims → Evidence (Argument structure)',
  icon: 'Network',

  promptSpec: `
=== ARGUMENT MAP TEMPLATE ===

Layout: canvas TB
Single zone. Thesis → Claims → Evidence → Counterpoints → Action. Define all edges in the same render as the zone.

=== STRUCTURE (ONE ZONE) ===

**Single zone: argument_map_zone**
- One @zone containing all blocks. Use direction TB. Zone color: gray.

**Blocks inside the zone (ids, shapes, colors):**
1. **Thesis**: 1 @shape (shapeType: ellipse, color: purple) — id thesis_main. Core thesis statement.
2. **Claims**: 3-7 @shape (shapeType: rectangle) — claim_1, claim_2, … Sub-claims supporting the thesis. **Use a different color per claim** (e.g. claim_1 green, claim_2 blue, claim_3 amber) from red | orange | amber | green | blue | purple | pink | gray.
3. **Evidence**: 1-3 @shape per claim (shapeType: rectangle, borderStyle: dashed) — evidence_1_1, evidence_1_2 (for claim_1), evidence_2_1 (for claim_2), … **Use the same color as the claim it supports** (e.g. evidence_1_1, evidence_1_2 same color as claim_1).
4. **Counterpoints (optional)**: 0-3 @shape (shapeType: diamond, color: red) — counterpoint_1, … Counterarguments or limitations.
5. **Action plan**: 1 @markdown — id action_plan. Markdown-formatted next steps.

**Titles**: Keyword-based only from the source (e.g. 2-5 words). No generic labels like "Claim 1", "Evidence".

**Content**: Always use markdown for content. Include as much concrete detail from the source as possible; do not omit important information.

**Edges (include in the SAME canvasdown as the zone):**
- thesis_main -> claim_1, thesis_main -> claim_2, … (label e.g. "supports", markerEnd: "arrowclosed", shape: "smoothstep" or "default" | "straight" | "step" | "smoothstep" | "simplebezier")
- claim_1 -> evidence_1_1, claim_1 -> evidence_1_2, … (label e.g. "based on")
- counterpoint_1 -> thesis_main, … (label e.g. "contradicts")
- Optional: claim_1 -> action_plan or thesis_main -> action_plan if relevant.

=== WORKFLOW ===

**Phase 1: Single zone skeleton + ALL edges (one renderCanvasdown call)**
1. Create @zone argument_map_zone with a title extracted from the source. Add all blocks with **titles extracted from the source** (short phrases from the content), not generic labels like "Claim 1". Use minimal content for skeleton.
2. Apply structure: thesis purple; each claim a different color; evidence same color as its claim, dashed.
3. In the SAME canvasdown, define ALL edges (thesis→claims, claims→evidence, counterpoints→thesis, etc.).
4. Call renderCanvasdown ONCE with this full canvasdown. Do NOT split zones or defer edges.

**Phase 2: Content fill (@update with blockMountId)**
Content fill layers (create one todo per layer when planning): Thesis, Claims, Evidence, Counterpoints, Action plan.
1. Complete one layer at a time; use @update for blocks in that layer only.
2. Use blockMountId from the tool result blockIdMap (NOT canvasdown ids).
3. @update blocks with title and **content** (markdown). Content must convey the source as completely as possible; include concrete details and do not omit important information.
4. Patch rules: no \`->\` or \`<-\` in title/content (use "to", "→"); single-line quoted strings; use "\\n" for new lines.

=== EXAMPLE SKELETON (edges in same block) ===

canvas TB

@zone argument_map_zone "<extract short title from source>" { direction: TB, color: gray }
  @shape thesis_main "<extract main thesis phrase>" { shapeType: ellipse, color: purple, title: "<extract main thesis phrase>" }
  @shape claim_1 "<extract first claim phrase from source>" { shapeType: rectangle, color: green, title: "<extract first claim phrase>" }
  @shape claim_2 "<extract second claim phrase from source>" { shapeType: rectangle, color: blue, title: "<extract second claim phrase>" }
  @shape claim_3 "<extract third claim phrase from source>" { shapeType: rectangle, color: amber, title: "<extract third claim phrase>" }
  @shape evidence_1_1 "<extract evidence phrase for claim 1>" { shapeType: rectangle, color: green, borderStyle: dashed, title: "<extract evidence phrase>" }
  @shape evidence_1_2 "<extract second evidence phrase for claim 1>" { shapeType: rectangle, color: green, borderStyle: dashed, title: "<extract evidence phrase>" }
  @shape evidence_2_1 "<extract evidence phrase for claim 2>" { shapeType: rectangle, color: blue, borderStyle: dashed, title: "<extract evidence phrase>" }
  @shape counterpoint_1 "<extract counterargument phrase>" { shapeType: diamond, color: red, title: "<extract counterargument phrase>" }
  @markdown action_plan "<extract action plan title>" { title: "<extract action plan title>" }
@end

thesis_main -> claim_1 { label: "supports", markerEnd: "arrowclosed", shape: "smoothstep" }
thesis_main -> claim_2 { label: "supports", markerEnd: "arrowclosed", shape: "smoothstep" }
thesis_main -> claim_3 { label: "supports", markerEnd: "arrowclosed", shape: "smoothstep" }
claim_1 -> evidence_1_1 { label: "based on", markerEnd: "arrowclosed", shape: "smoothstep" }
claim_1 -> evidence_1_2 { label: "based on", markerEnd: "arrowclosed", shape: "smoothstep" }
claim_2 -> evidence_2_1 { label: "based on", markerEnd: "arrowclosed", shape: "smoothstep" }
counterpoint_1 -> thesis_main { label: "contradicts", markerEnd: "arrowclosed", shape: "default" }

=== LIMITS ===
- Max concepts: 12
- Max edges: 25
- Max markdown content: 3000 chars
`,

  limits: {
    maxConcepts: 12,
    maxEdges: 25,
    maxMarkdownChars: 3000,
  },
};
