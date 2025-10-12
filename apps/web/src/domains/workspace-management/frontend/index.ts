/**
 * Workspace Management Frontend Domain
 *
 * Public API for frontend components, hooks, and contexts
 */

// Context & Hooks
export {
  WorkspaceProvider,
  useWorkspaceContext,
} from './contexts/workspace-context';
export { useWorkspace } from './hooks/use-workspace';

// Components
export * from './components';
