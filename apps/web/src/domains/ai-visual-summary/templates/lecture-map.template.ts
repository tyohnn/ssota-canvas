/**
 * Lecture Map Template
 *
 * Single-zone template for lecture/podcast flow: thesis, timeline (chapters), concepts, summaries, synthesis.
 * All blocks and edges are defined in one zone and rendered together so layout (dagre) sees edges from the start.
 */

import { VisualTemplate } from '../shared/types/template.types';
import { TEMPLATE_IDS } from '../shared/types/template.types';

export const lectureMapTemplate: VisualTemplate = {
  id: TEMPLATE_IDS.LECTURE_MAP,
  name: 'Lecture Map',
  description: 'Organize flow and concepts of lectures/podcasts',
  icon: 'Map',

  promptSpec: `
=== LECTURE MAP TEMPLATE ===

Layout: canvas TB
Single zone. Main thesis → Timeline (chapters) → Key concepts → Chapter summaries + Actions/Questions. Define all edges in the same render as the zone.

=== STRUCTURE (ONE ZONE) ===

**Single zone: lecture_map_zone**
- One @zone containing all blocks. Use direction TB. Zone color: gray.

**Blocks inside the zone (ids, shapes, colors):**
1. **Thesis**: 1 @shape (shapeType: ellipse, color: blue) — id thesis. Main thesis or central message.
2. **Timeline (chapters)**: 3-8 @shape (shapeType: rectangle, color: green) — chapter_1, chapter_2, … Chapters or sections in sequence.
3. **Concepts**: 8-15 @shape (shapeType: hexagon, color: purple) — concept_1, concept_2, … Key concepts; **use a different color per concept or by theme** from red | orange | amber | green | blue | purple | pink | gray.
4. **Chapter summary**: 1 @markdown — id chapter_summary. Detailed chapter summaries.
5. **Synthesis**: 2 @markdown — actions, questions. Action items and open questions.

**Titles**: From source, 2-5 words. No generic labels like "Chapter 1".

**Content**: Markdown, at least one full paragraph per block; include concrete detail from the source.

**Edges (include in the SAME canvasdown as the zone):**
- Use flat stroke and strokeWidth (no nested object): stroke: "red" | "orange" | "amber" | "green" | "blue" | "purple" | "pink" | "gray", strokeWidth: number.
- thesis -> chapter_1, chapter_1 -> chapter_2, … (label e.g. "leads to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: color)
- concept_1 -> concept_2, … (label e.g. "relates to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: color)
- chapter_1 -> concept_1, … (label e.g. "contains", stroke: color)
- concept_1 -> thesis (label e.g. "supports", stroke: color)

=== WORKFLOW ===

**Phase 1: Single zone skeleton + ALL edges (one renderCanvasdown call)**
1. Create @zone lecture_map_zone with title from user message (use "Source Title - Template Name" from Source metadata). Add all blocks with **titles extracted from the source**. Use minimal content for skeleton.
2. Apply structure: thesis blue ellipse; chapters green rectangles; concepts purple hexagons; markdown for summary and synthesis.
3. In the SAME canvasdown, define ALL edges (thesis→chapters, chapter→chapter, concept↔concept, chapter→concept, concept→thesis).
4. Call renderCanvasdown ONCE with this full canvasdown. Do NOT split zones or defer edges.

**Phase 2: Content fill (@update with blockMountId)**
Content fill layers (create one todo per layer when planning): Thesis, Timeline, Concepts, Chapter summary, Synthesis.
1. Complete one layer at a time; use @update for blocks in that layer only.
2. Use blockMountId from the tool result blockIdMap (NOT canvasdown ids).
3. @update blocks with title and **content** (markdown). Content must be at least one full paragraph per block; convey the source completely.

=== EXAMPLE SKELETON (edges in same block) ===

canvas TB

@zone lecture_map_zone "<Source Title - Lecture Map>" { direction: TB, color: gray }
  @shape thesis "<extract main thesis phrase>" { shapeType: ellipse, color: blue, title: "<extract main thesis>" }
  @shape chapter_1 "<extract chapter title>" { shapeType: rectangle, color: green, title: "<extract chapter title>" }
  @shape chapter_2 "<extract chapter title>" { shapeType: rectangle, color: green, title: "<extract chapter title>" }
  @shape chapter_3 "<extract chapter title>" { shapeType: rectangle, color: green, title: "<extract chapter title>" }
  @shape concept_1 "<extract concept name>" { shapeType: hexagon, color: purple, title: "<extract concept>" }
  @shape concept_2 "<extract concept name>" { shapeType: hexagon, color: purple, title: "<extract concept>" }
  @markdown chapter_summary "<extract summary title>" { title: "<extract summary title>" }
  @markdown actions "<extract actions title>" { title: "<extract actions title>" }
  @markdown questions "<extract questions title>" { title: "<extract questions title>" }
@end

thesis -> chapter_1 { label: "leads to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "blue" }
chapter_1 -> chapter_2 { label: "leads to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "green" }
chapter_2 -> chapter_3 { label: "leads to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "green" }
chapter_1 -> concept_1 { label: "contains", markerEnd: "arrowclosed", shape: "step", stroke: "purple" }
chapter_2 -> concept_2 { label: "contains", markerEnd: "arrowclosed", shape: "step", stroke: "purple" }
concept_1 -> concept_2 { label: "relates to", markerEnd: "arrowclosed", shape: "smoothstep", stroke: "purple" }
concept_1 -> thesis { label: "supports", markerEnd: "arrowclosed", shape: "default", stroke: "blue" }

=== LIMITS ===
- Max concepts: 15
- Max edges: 30
- Max markdown content: 5000 chars
`,

  limits: {
    maxConcepts: 15,
    maxEdges: 30,
    maxMarkdownChars: 5000,
  },
};
