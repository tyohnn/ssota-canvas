/**
 * Concept Graph Template
 *
 * Single-zone template for concept relationship network (definitions + relationships + notes).
 * All blocks and edges are defined in one zone and rendered together so layout (dagre) sees edges from the start.
 */

import { VisualTemplate, TEMPLATE_IDS } from '@/domains/ai-actions/shared/types/template.types';

export const conceptGraphTemplate: VisualTemplate = {
  id: TEMPLATE_IDS.CONCEPT_GRAPH,
  name: 'Concept Graph',
  description: 'Concept relationship network (definition/relationship focused)',
  icon: 'GitBranch',

  promptSpec: `
=== CONCEPT GRAPH TEMPLATE ===

Layout: canvas TB
Single zone. Key concepts (hexagons) + relationship edges + notes (markdown). Define all edges in the same render as the zone.

=== STRUCTURE (ONE ZONE) ===

**Single zone: concept_graph_zone**
- One @zone containing all blocks. Use direction TB. Zone color: gray.

**Blocks inside the zone (ids, shapes, colors):**
1. **Concepts**: 10-20 @shape (shapeType: hexagon) — concept_1, concept_2, … **Use a different color per concept or by theme** from red | orange | amber | green | blue | purple | pink | gray.
2. **Notes**: 2-6 @markdown — note_1, note_2, … Additional context and examples.

**Titles**: From source, 2-5 words. No generic labels like "Concept 1".

**Content**: Markdown, at least one full paragraph per block; include concrete detail from the source.

**Edges (include in the SAME canvasdown as the zone):**
- Use flat stroke and strokeWidth (no nested object): stroke: "red" | "orange" | "amber" | "green" | "blue" | "purple" | "pink" | "gray", strokeWidth: number.
- concept_1 -> concept_2, concept_2 -> concept_3, … (label e.g. "relates to", "part of", "explains"; markerEnd: "arrowclosed", shape: "smoothstep", stroke: color)
- concept_1 -> note_1, … (label e.g. "detailed in", stroke: color)
- 15-40 edges total for relationship network.

=== WORKFLOW ===

**Phase 1: Single zone skeleton + ALL edges (one renderCanvasdown call)**
1. Create @zone concept_graph_zone with title from user message (use "Source Title - Template Name" from Source metadata). Add all blocks with **titles extracted from the source** (short phrases from the content), not generic labels like "Concept 1". Use minimal content for skeleton.
2. Apply structure: concepts as hexagons with chosen colors; notes as markdown.
3. In the SAME canvasdown, define ALL edges (concept↔concept, concept→note).
4. Call renderCanvasdown ONCE with this full canvasdown. Do NOT split zones or defer edges.

**Phase 2: Content fill (@update with blockMountId)**
Content fill layers (create one todo per layer when planning): Concepts, Notes.
1. Complete one layer at a time; use @update for blocks in that layer only.
2. Use blockMountId from the tool result blockIdMap (NOT canvasdown ids).
3. @update blocks with title and **content** (markdown). Content must be at least one full paragraph per block; convey the source completely and include concrete details.

=== EXAMPLE SKELETON (edges in same block) ===

canvas TB

@zone concept_graph_zone "<Source Title - Concept Graph>" { direction: TB, color: gray }
  @shape concept_1 "<extract first concept phrase>" { shapeType: hexagon, color: purple, title: "<extract concept phrase>" }
  @shape concept_2 "<extract second concept phrase>" { shapeType: hexagon, color: blue, title: "<extract concept phrase>" }
  @shape concept_3 "<extract third concept phrase>" { shapeType: hexagon, color: green, title: "<extract concept phrase>" }
  @shape concept_4 "<extract fourth concept phrase>" { shapeType: hexagon, color: amber, title: "<extract concept phrase>" }
  @markdown note_1 "<extract note title>" { title: "<extract note title>" }
  @markdown note_2 "<extract note title>" { title: "<extract note title>" }
@end

concept_1 -> concept_2 { label: "relates to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "purple" }
concept_1 -> concept_3 { label: "part of", markerEnd: "arrowclosed", shape: "default", stroke: "blue" }
concept_2 -> concept_4 { label: "explains", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "green" }
concept_1 -> note_1 { label: "detailed in", markerEnd: "arrowclosed", shape: "step", stroke: "gray" }
concept_3 -> note_2 { label: "detailed in", markerEnd: "arrowclosed", shape: "step", stroke: "gray" }

=== LIMITS ===
- Max concepts: 20
- Max edges: 40
- Max markdown content: 3000 chars
`,

  limits: {
    maxConcepts: 20,
    maxEdges: 40,
    maxMarkdownChars: 3000,
  },
};
