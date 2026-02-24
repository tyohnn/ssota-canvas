/**
 * canvasAction Tool (Client-side)
 *
 * Schema + description in one place. No server execute.
 */

import { z } from 'zod';

const canvasActionArgsSchema = z.object({
  action: z
    .enum(['select', 'zoomTo', 'openEditor'])
    .describe('Action: select block, zoom viewport, or open editor'),
  blockMountId: z
    .string()
    .uuid()
    .optional()
    .describe('Block mount ID. Required for select and openEditor; required for zoomTo when zoomTarget is block'),
  zoomTarget: z
    .enum(['block', 'fit'])
    .optional()
    .describe('For zoomTo only: block = center on block, fit = fit entire canvas'),
});

export const canvasActionTool = {
  description: `Control canvas UI: select a block, zoom to a block or fit all, or open the block editor panel. Use when: "select that block", "zoom to that block", "show the whole canvas", "open that block's editor".`,
  inputSchema: canvasActionArgsSchema,
};
