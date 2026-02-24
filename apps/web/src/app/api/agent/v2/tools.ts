/**
 * Agent V2 Tool Definitions
 *
 * Re-exports all tools from their consolidated folders.
 * Schema + execution live together in each tool's folder.
 */

// ============================================================================
// External Search
// ============================================================================
export { xaiSearchTool } from '@/domains/ai-management/backend/services/tools/external-search/xaiSearch';

// ============================================================================
// Canvasdown (Client-side)
// ============================================================================
export { renderCanvasdownTool } from '@/domains/ai-management/backend/services/tools/canvasdown/renderCanvasdown';
export { patchCanvasdownTool } from '@/domains/ai-management/backend/services/tools/canvasdown/patchCanvasdown';

// ============================================================================
// Internal Search (Server-side, use createXxxTool in route)
// ============================================================================
export {
  createGrepBlockContentTool,
  createGlobBlocksTool,
  createReadBlockLinesTool,
  createHopSearchTool,
  createSearchGroupTool,
  createSearchBySemanticTool,
} from '@/domains/ai-management/backend/services/tools/internal-search';

// ============================================================================
// Events (Server-side, use createXxxTool in route)
// ============================================================================
export { createGetPageEventsTool } from '@/domains/ai-management/backend/services/tools/events/getPageEvents';
export { createGrepEventsTool } from '@/domains/ai-management/backend/services/tools/events/grepEvents';

// ============================================================================
// Write, Layout, Todos, Canvas Action (Client-side)
// ============================================================================
export { editTool } from '@/domains/ai-management/backend/services/tools/write/edit';
export { organizeLayoutTool } from '@/domains/ai-management/backend/services/tools/layout/organizeLayout';
export { createTodosTool } from '@/domains/ai-management/backend/services/tools/todos/createTodos';
export { canvasActionTool } from '@/domains/ai-management/backend/services/tools/canvas-action/canvasAction';

// ============================================================================
// Type Exports
// ============================================================================
export type V2ToolName =
  | 'webSearch'
  | 'renderCanvasdown'
  | 'patchCanvasdown'
  | 'read'
  | 'edit'
  | 'glob'
  | 'grep'
  | 'hop'
  | 'group'
  | 'semantic'
  | 'getEvents'
  | 'grepEvents'
  | 'createTodos'
  | 'canvasAction'
  | 'organizeLayout';

export interface V2ToolCall {
  toolName: V2ToolName;
  args?: unknown;
}

export type V2ToolArgs = Record<string, unknown>;
