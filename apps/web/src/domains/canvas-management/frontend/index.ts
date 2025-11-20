// Hooks

// Utils
export {
  getViewportStateFromStorage,
  setViewportStateToStorage,
  getSelectedBlocksFromStorage,
  setSelectedBlocksToStorage,
  getSnapSettingsFromStorage,
  setSnapSettingsToStorage,
  clearCanvasStorageForPage,
  CANVAS_STORAGE_KEYS,
} from './utils/canvas-storage';

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
