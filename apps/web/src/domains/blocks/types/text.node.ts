import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata,
  FormDataWithExtras, 
  ReactFlowNodeData,
} from "./common.node";


// ============================================================================
// Text Node UI Types
// ============================================================================

/**
 * Text node UI with required properties
 */
export type TextNodeUI = BaseNodeUI & { 
  color: string;
  fontSize: string;
  weight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  richStyle: boolean;
};



// ============================================================================
// Text Node Data Types
// ============================================================================

/**
 * Text node data structure
 */
export type TextFormData = FormDataWithExtras<{}>;



// ============================================================================
// Text Node Metadata Types (DB Storage)
// ============================================================================

/**
 * Text metadata with typed data
 */
export type TextMetadata = DefaultMetadata & {
  nodeUI: TextNodeUI;
  formData: TextFormData;
};



// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get text metadata with typed data
 */
export function getTextMetadata(block: Block): TextMetadata {
  return block.metadata as TextMetadata;
}


export type ReactFlowTextNode = Node & {
  data: ReactFlowTextNodeData;
}
export type ReactFlowTextNodeData = ReactFlowNodeData & {
  nodeUI: TextNodeUI;
  formData: TextFormData;
}