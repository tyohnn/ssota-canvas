import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata, 
  FormDataWithExtras, 
} from "@/domains/blocks/types/common.node";


// ============================================================================
// Math Formula Node UI Types
// ============================================================================

/**
 * Math formula node UI (uses only base properties)
 */
export type MathFormulaNodeUI = BaseNodeUI;



// ============================================================================
// Math Formula Node Data Types
// ============================================================================

/**
 * Math formula node data structure
 */
export type MathFormulaNodeData = FormDataWithExtras<{
  latex: string;
  displayMode: boolean;
}>;



// ============================================================================
// Math Formula Node Metadata Types (DB Storage)
// ============================================================================

/**
 * Math formula metadata with typed data
 */
export type MathFormulaMetadata = DefaultMetadata & {
  nodeUI: MathFormulaNodeUI;
  formData: MathFormulaNodeData;
};


// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get math formula metadata with typed data
 */
export function getMathFormulaMetadata(block: Block): MathFormulaMetadata {
  return block.metadata as MathFormulaMetadata;
}


// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example Math Formula Node Metadata:
 * 
 * {
 *   "nodeUI": {
 *     "size": { "width": 250, "height": 100 }
 *   },
 *   "formData": {
 *     "latex": "E = mc^2",
 *     "displayMode": true,
 *     "fontSize": "large"
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "latex", "type": "text", "label": "LaTeX Formula" },
 *       { "id": "displayMode", "type": "checkbox", "label": "Display Mode" }
 *     ]
 *   }
 * }
 */
