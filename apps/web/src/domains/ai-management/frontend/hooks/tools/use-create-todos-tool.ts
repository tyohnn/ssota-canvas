'use client';

import { useCallback } from 'react';
import type { AddToolOutput } from './use-render-canvasdown-tool';

export function useCreateTodosTool() {
  return useCallback(
    (
      addToolOutput: AddToolOutput,
      toolCallId: string,
      args: { todos?: Array<{ title: string; description?: string }> }
    ) => {
      try {
        const todosInput = args.todos as Array<{ title: string; description?: string }>;
        if (!Array.isArray(todosInput) || todosInput.length === 0) {
          addToolOutput({
            tool: 'createTodos',
            toolCallId,
            state: 'output-error',
            errorText: 'todos array is required and must not be empty',
          });
          return;
        }
        const todos = todosInput.map((t, i) => ({
          id: `todo-${i}-${Date.now()}`,
          title: t.title ?? '',
          description: t.description,
          status: 'pending' as const,
        }));
        addToolOutput({
          tool: 'createTodos',
          toolCallId,
          output: { todos },
        });
      } catch (error) {
        console.error('[useCreateTodosTool] error:', error);
        addToolOutput({
          tool: 'createTodos',
          toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    []
  );
}
