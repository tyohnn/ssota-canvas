import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata, 
  FormDataWithExtras 
} from "@/domains/blocks/types/common.node";


// ============================================================================
// Twitter Preview Node UI Types
// ============================================================================

/**
 * Twitter preview node UI (uses only base properties)
 */
export type TwitterPreviewNodeUI = BaseNodeUI;



// ============================================================================
// Twitter Preview Node Data Types
// ============================================================================

/**
 * Twitter preview node data structure
 */
export type TwitterPreviewNodeData = FormDataWithExtras<{
  url: string;
  title: string;
  description: string;
  html?: string; // Optional HTML
}>;



// ============================================================================
// Twitter Preview Node Metadata Types (DB Storage)
// ============================================================================

/**
 * Twitter preview metadata with typed data
 */
export type TwitterPreviewMetadata = DefaultMetadata & {
  nodeUI: TwitterPreviewNodeUI;
  formData: TwitterPreviewNodeData;
  // Additional twitter-specific metadata
  url?: string;
  title?: string;
  description?: string;
  html?: string;
};


// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get twitter preview metadata with typed data
 */
export function getTwitterPreviewMetadata(block: Block): TwitterPreviewMetadata {
  return block.metadata as TwitterPreviewMetadata;
}


// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example Twitter Preview Node Metadata:
 * 
 * {
 *   "nodeUI": {
 *     "size": { "width": 350, "height": 200 }
 *   },
 *   "formData": {
 *     "url": "https://twitter.com/example/status/123456789",
 *     "title": "Example Tweet",
 *     "description": "This is an example tweet content",
 *     "html": "<div>Embedded tweet HTML</div>",
 *     "author": "@example"
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "url", "type": "url", "label": "Tweet URL" },
 *       { "id": "title", "type": "text", "label": "Tweet Title" },
 *       { "id": "description", "type": "text", "label": "Tweet Description" }
 *     ]
 *   }
 * }
 */
