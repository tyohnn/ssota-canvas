/**
 * Canvas History - Public Exports
 */

export { CanvasHistoryProvider, useCanvasHistory } from './canvas-history-context';
export type { CanvasHistoryContextType } from './canvas-history-context';
export type { 
  CanvasOperation, 
  CanvasOperationType,
  HistoryEntry,
  CanvasHistoryState,
  BlockAddOperation,
  BlockDeleteOperation,
  BlockMoveOperation,
  BlockResizeOperation,
  EdgeAddOperation,
  EdgeDeleteOperation,
} from './types';
