import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata, 
  FormDataWithExtras 
} from "@/domains/blocks/types/common.node";


// ============================================================================
// Image Node UI Types
// ============================================================================

/**
 * Image node UI (uses only base properties)
 */
export type ImageNodeUI = BaseNodeUI;



// ============================================================================
// Image Node Data Types
// ============================================================================

/**
 * Image node data structure
 */
export type ImageNodeData = FormDataWithExtras<{
  src: string;
  alt: string;
  caption?: string; // Optional caption
}>;



// ============================================================================
// Image Node Metadata Types (DB Storage)
// ============================================================================

/**
 * Image metadata with typed data
 */
export type ImageMetadata = DefaultMetadata & {
  nodeUI: ImageNodeUI;
  formData: ImageNodeData;
};



// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get image metadata with typed data
 */
export function getImageMetadata(block: Block): ImageMetadata {
  return block.metadata as ImageMetadata;
}


// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example Image Node Metadata:
 * 
 * {
 *   "nodeUI": {
 *     "size": { "width": 300, "height": 200 }
 *   },
 *   "formData": {
 *     "src": "https://example.com/image.jpg",
 *     "alt": "Example Image",
 *     "caption": "This is an example image",
 *     "aspectRatio": "16:9"
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "src", "type": "url", "label": "Image URL" },
 *       { "id": "alt", "type": "text", "label": "Alt Text" },
 *       { "id": "caption", "type": "text", "label": "Caption" }
 *     ]
 *   }
 * }
 */
