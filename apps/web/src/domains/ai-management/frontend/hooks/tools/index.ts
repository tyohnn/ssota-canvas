/**
 * Client-side tool hooks for Agent v2.
 * Each hook returns a handler(toolCallId, args) used from use-chat-v2 onToolCall.
 */

export { useRenderCanvasdownTool } from './use-render-canvasdown-tool';
export type { AddToolOutput, RenderCanvasdownFromContext } from './use-render-canvasdown-tool';

export { usePatchCanvasdownTool } from './use-patch-canvasdown-tool';

export { useEditTool } from './use-edit-tool';

export { useCreateTodosTool } from './use-create-todos-tool';

export { useCanvasActionTool } from './use-canvas-action-tool';

export { useOrganizeLayoutTool } from './use-organize-layout-tool';
