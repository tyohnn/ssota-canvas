import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata, 
  FormDataWithExtras 
} from "@/domains/blocks/types/common.node";


// ============================================================================
// Video Node UI Types
// ============================================================================

/**
 * Video node UI (uses only base properties)
 */
export type VideoNodeUI = BaseNodeUI;



// ============================================================================
// Video Node Data Types
// ============================================================================

/**
 * Video node data structure
 */
export type VideoNodeData = FormDataWithExtras<{
  src: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  caption?: string; // Optional caption
}>;


// ============================================================================
// Video Node Metadata Types (DB Storage)
// ============================================================================

/**
 * Video metadata with typed data
 */
export type VideoMetadata = DefaultMetadata & {
  nodeUI: VideoNodeUI;
  formData: VideoNodeData;
};


// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get video metadata with typed data
 */
export function getVideoMetadata(block: Block): VideoMetadata {
  return block.metadata as VideoMetadata;
}


// ============================================================================
// Example Metadata
// ============================================================================

/**
 * Example Video Node Metadata:
 * 
 * {
 *   "nodeUI": {
 *     "size": { "width": 400, "height": 225 }
 *   },
 *   "formData": {
 *     "src": "https://example.com/video.mp4",
 *     "autoplay": false,
 *     "loop": true,
 *     "muted": true,
 *     "controls": true,
 *     "caption": "Example Video",
 *     "quality": "1080p"
 *   },
 *   "formSchema": {
 *     "fields": [
 *       { "id": "src", "type": "url", "label": "Video URL" },
 *       { "id": "autoplay", "type": "checkbox", "label": "Autoplay" },
 *       { "id": "controls", "type": "checkbox", "label": "Show Controls" },
 *       { "id": "caption", "type": "text", "label": "Caption" }
 *     ]
 *   }
 * }
 */
