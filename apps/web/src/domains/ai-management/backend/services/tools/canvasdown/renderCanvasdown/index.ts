/**
 * renderCanvasdown Tool (Client-side)
 *
 * Schema + description in one place. No server execute.
 */

import { z } from 'zod';

const renderCanvasdownArgsSchema = z.object({
  dsl: z.string().describe('Canvasdown Full DSL code'),
  anchorBlockMountId: z.string().optional().describe('Optional anchor block to position relative to'),
  position: z.enum(['right', 'below']).default('right').optional().describe('Position relative to anchor'),
});

export const renderCanvasdownTool = {
  description: `Render Canvasdown DSL code to create new blocks on the canvas.

Canvasdown is a DSL that converts structured text into interactive canvas nodes and edges.

=== WHEN TO USE ===
- Creating NEW blocks (markdown, shape, zone/group)
- Adding edges between blocks
- Setting up initial layout

=== SYNTAX ===

**Canvas Direction**: canvas TB | LR | RL | BT

**Shape Block**:
@shape id "Label" {
  shapeType: rectangle | ellipse | triangle | diamond | hexagon | parallelogram | cylinder,
  color: red | orange | amber | green | blue | purple | pink | gray,
  borderStyle: solid | dashed | dotted,
  title: "Content",
  content: "Markdown text"
}

**Markdown Block**:
@markdown id "Label" {
  color: gray,
  title: "Title",
  content: "Markdown text"
}

**Zone (Group)**:
@zone id "Label" {
  direction: TB | LR | RL | BT,
  color: red | orange | amber | green | blue | purple | pink | gray,
  title: "Zone Title",
  content: "Markdown text"
}
  @shape child_id "Child" { ... }
@end

**Edges**:
source_id -> target_id
source_id -> target_id : "label"
source_id -> target_id { label: "Connection", markerEnd: "arrowclosed", markerStart: "arrow" }

=== EDGE MARKERS ===
arrow, arrowclosed, arrow-open, circle, circle-open, diamond, diamond-open

=== RULES ===
- Strings: NO apostrophes ("Do Not" NOT "Don't")
- Properties: Comma-separated
- @zone property block MUST be closed with } BEFORE child blocks

=== RESULT ===
Returns { success: true, blockIdMap: { canvasdownId: blockMountId } }`,
  inputSchema: renderCanvasdownArgsSchema,
};
