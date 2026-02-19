/**
 * organizeLayout Tool (Client-side)
 *
 * Schema + description in one place. No server execute.
 */

import { z } from 'zod';

const organizeLayoutArgsSchema = z.object({
  type: z.enum(['grid', 'flow', 'tree', 'mindmap', 'stack']),
  options: z
    .object({
      columns: z.number().min(1).max(20).optional().describe('Grid columns (grid only)'),
      direction: z.enum(['LR', 'RL', 'TB', 'BT']).optional().describe('Layout direction (flow/tree/stack)'),
      spacing: z.number().min(10).max(500).optional().describe('Gap between blocks in px (default: 60)'),
      centerBlockMountId: z.string().optional().describe('Center node for mindmap layout (required for mindmap)'),
    })
    .optional(),
  targetBlockMountIds: z
    .array(z.string())
    .optional()
    .describe('Specific blocks to organize. If omitted, all root-level blocks on the current canvas.'),
});

export const organizeLayoutTool = {
  description: `Reorganize existing blocks into a structured layout. Client-side only.

=== LAYOUT TYPES ===
- grid: Arrange blocks in rows and columns. Use "columns" option.
- stack: Arrange blocks in a single line (vertical or horizontal). Use "direction" option (TB or LR).
- flow: Directed graph layout following edge connections. Use "direction" option.
- tree: Hierarchical tree layout following edge connections. Use "direction" option.
- mindmap: Radial layout expanding from a center node outward. Requires "centerBlockMountId".

=== LAYER CONSTRAINT ===
All target blocks MUST be on the same layer (same parent).

=== EXAMPLES ===
- "Organize in 3 columns" -> type: grid, options: { columns: 3 }
- "Stack vertically" -> type: stack, options: { direction: TB }
- "Auto-layout as flowchart" -> type: flow, options: { direction: LR }

Returns { success: true, movedCount: N } or error message.`,
  inputSchema: organizeLayoutArgsSchema,
};
