import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata, 
  FormDataWithExtras 
} from "@/domains/blocks/types/common.node";


// ============================================================================
// WebView Node UI Types
// ============================================================================

/**
 * WebView node UI (uses only base properties)
 */
export type WebViewNodeUI = BaseNodeUI;



// ============================================================================
// WebView Node Data Types
// ============================================================================

/**
 * WebView node data structure
 */
export type WebViewNodeData = FormDataWithExtras<{
  url: string;
}>;



// ============================================================================
// WebView Node Metadata Types (DB Storage)
// ============================================================================

/**
 * WebView metadata with typed data
 */
export type WebViewMetadata = DefaultMetadata & {
  node_ui: WebViewNodeUI;
  form_data: WebViewNodeData;
};







// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get webview metadata with typed data
 */
export function getWebViewMetadata(block: Block): WebViewMetadata {
  return block.metadata as WebViewMetadata;
}



// ============================================================================
// WebView Node Type Bundle
// ============================================================================

/**
 * All WebView node types bundled together for convenience
 */
export const WebViewNodeTypes = {
  getMetadata: getWebViewMetadata,
} as const;

// Type exports for convenience
export type WebViewNodeTypes = {
  UI: WebViewNodeUI;
  Data: WebViewNodeData;
  Metadata: WebViewMetadata;
};

// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example WebView Node Metadata:
 * 
 * {
 *   "nodeUI": {
 *     "size": { "width": 500, "height": 400 }
 *   },
 *   "formData": {
 *     "url": "https://example.com",
 *     "title": "Example Website",
 *     "allowScripts": true
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "url", "type": "url", "label": "Website URL" },
 *       { "id": "title", "type": "text", "label": "Website Title" }
 *     ]
 *   }
 * }
 */
