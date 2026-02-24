/**
 * edit Tool (Client-side)
 *
 * Schema + description in one place. No server execute.
 */

import { z } from 'zod';

const editArgsSchema = z.object({
  blockMountId: z.uuid().describe('Block mount ID to edit'),
  operation: z.enum(['replace', 'insert', 'delete']).describe('replace | insert | delete'),
  startLine: z.number().min(1).describe('Starting line (1-based)'),
  endLine: z.number().min(1).optional().describe('End line for replace/delete (inclusive). Omit to affect only startLine.'),
  newContent: z.string().optional().describe('New text for replace/insert. Required for replace and insert.'),
});

export const editTool = {
  description: `Edit block content by line range. Use after read or grep to modify specific lines.

- replace: Overwrite lines startLine through endLine (inclusive) with newContent. If endLine omitted, only startLine is replaced.
- insert: Insert newContent at line startLine (existing line and below shift down).
- delete: Remove lines startLine through endLine (inclusive). newContent not used.

Line numbers are 1-based. Returns success or error message.`,
  inputSchema: editArgsSchema,
};
