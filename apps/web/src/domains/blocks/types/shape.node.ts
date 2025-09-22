import type { Block } from '@/db/schema';
import type {
  BaseNodeUI,
  DefaultMetadata,
  FormDataWithExtras,
} from './common.node';
import { ShapeKey } from '@/domains/blocks/policy/shape-policy';

// ============================================================================
// Shape Node UI Types
// ============================================================================

/**
 * Shape node UI with required properties
 */
export type ShapeNodeUI = BaseNodeUI & {
  color: string;
  shape: ShapeKey;
};

// ============================================================================
// Shape Node Data Types
// ============================================================================

/**
 * Shape node data structure
 */
export type ShapeNodeData = FormDataWithExtras<{}>;

// ============================================================================
// Shape Node Metadata Types (DB Storage)
// ============================================================================

/**
 * Shape metadata with typed data
 */
export type ShapeMetadata = DefaultMetadata & {
  nodeUI: ShapeNodeUI;
  formData: ShapeNodeData;
};

// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get shape-specific metadata with typed data
 */
export function getShapeMetadata(block: Block): ShapeMetadata {
  return block.metadata as ShapeMetadata;
}

export function getShapeNodeData(block: Block): ShapeNodeData {
  return {
    title: block.title,
    ...getShapeMetadata(block),
  };
}

// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example Shape Node Metadata:
 *
 * {
 *   "nodeUI": {
 *     "size": { "width": 100, "height": 100 },
 *     "color": "#ff6b6b",
 *     "shape": "circle"
 *   },
 *   "formData": {
 *     "customProperty": "custom value"
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "customProperty", "type": "text", "label": "Custom Property" }
 *     ]
 *   }
 * }
 */
