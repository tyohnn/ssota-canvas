// Hooks

// Utils (deprecated - use useCanvasViewport hook instead)
// These exports are kept for backward compatibility but will be removed in the future
export {
  CANVAS_STORAGE_KEYS,
  type ViewportState,
  type ViewportStateMap,
  type SnapSettings,
} from './hooks/control/use-canvas-viewport-storage';

// Types
export type {
  CanvasView,
  BlockMountView,
  EdgeView,
  ViewportView,
  InitializeCanvasRequest,
  CreateAndMountBlockRequest,
  UpdateBlockPositionRequest,
  UpdateBlockSizeRequest,
  CreateEdgeRequest,
  UpdateViewportRequest,
} from '../shared/dtos/index';
