/**
 * createTodos Tool (Client-side)
 *
 * Schema + description in one place. No server execute.
 */

import { z } from 'zod';

const createTodosArgsSchema = z.object({
  todos: z
    .array(
      z.object({
        title: z.string().describe('Short task title'),
        description: z.string().optional().describe('Optional detail'),
      })
    )
    .describe('List of tasks'),
});

export const createTodosTool = {
  description: `Create a todo list for the current complex task. Use when the user request has multiple clear steps (e.g. "organize these 5 blocks and add a summary block"). Returns the list to the model for reference.`,
  inputSchema: createTodosArgsSchema,
};
