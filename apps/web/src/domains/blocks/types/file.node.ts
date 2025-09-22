import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata, 
  FormDataWithExtras, 
} from "@/domains/blocks/types/common.node";


// ============================================================================
// File Node UI Types
// ============================================================================

/**
 * File node UI (uses only base properties)
 */
export type FileNodeUI = BaseNodeUI;



// ============================================================================
// File Node Data Types
// ============================================================================

/**
 * File node data structure
 */
export type FileNodeData = FormDataWithExtras<{
  name: string;
  url: string;
  size?: number; // Optional size
}>;



// ============================================================================
// File Node Metadata Types (DB Storage)
// ============================================================================

/**
 * File metadata with typed data
 */
export type FileMetadata = DefaultMetadata & {
  nodeUI: FileNodeUI;
  formData: FileNodeData;
};


// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get file metadata with typed data
 */
export function getFileMetadata(block: Block): FileMetadata {
  return block.metadata as FileMetadata;
}


// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example File Node Metadata:
 * 
 * {
 *   "nodeUI": {
 *     "size": { "width": 300, "height": 150 }
 *   },
 *   "formData": {
 *     "name": "document.pdf",
 *     "url": "https://example.com/files/document.pdf", 
 *     "size": 1024000,
 *     "fileType": "pdf"
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "name", "type": "text", "label": "File Name" },
 *       { "id": "url", "type": "url", "label": "File URL" },
 *       { "id": "size", "type": "number", "label": "File Size" }
 *     ]
 *   }
 * }
 */
