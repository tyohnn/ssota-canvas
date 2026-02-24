/**
 * patchCanvasdown Tool (Client-side)
 *
 * Schema + description in one place. No server execute.
 */

import { z } from 'zod';

const patchCanvasdownArgsSchema = z.object({
  dsl: z.string().describe('Canvasdown Patch DSL (@update, @delete, @connect, @move, @resize)'),
});

export const patchCanvasdownTool = {
  description: `Modify existing blocks using Patch DSL.

=== WHEN TO USE ===
- Updating existing block content or properties
- Connecting blocks with new edges
- Moving or resizing blocks
- Deleting blocks

=== SYNTAX ===

**Update Block**:
@update blockMountId { title: "New content" }
@update blockMountId { title: "X", content: "Markdown here" }

**Connect Blocks**:
@connect blockMountId1 -> blockMountId2
@connect blockMountId1 -> blockMountId2 : "label"

**Move Block**:
@move blockMountId { x: 100, y: 200 }

**Delete Block**:
@delete blockMountId

=== CRITICAL RULES ===
- Never use -> or <- inside @update title or content. Use "to", "implies", "→" instead.
- Keep title and content as single-line double-quoted strings
- Use \\n for line breaks inside strings

=== BLOCK MOUNT ID MAPPING ===
Use actual blockMountId from previous renderCanvasdown results, NOT the original canvasdown ID.`,
  inputSchema: patchCanvasdownArgsSchema,
};
