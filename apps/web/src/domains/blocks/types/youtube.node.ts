import type { Block } from "@/db/schema";
import type { 
  BaseNodeUI, 
  DefaultMetadata,
  FormDataWithExtras, 
  ReactFlowNodeData,
} from "./common.node";

// ============================================================================
// YouTube Node UI Types
// ============================================================================

/**
 * YouTube node UI with required properties
 */
export type YouTubeNodeUI = BaseNodeUI & { 
  // YouTube 노드는 기본 UI 속성만 사용 (size)
};

// ============================================================================
// YouTube Node Data Types
// ============================================================================

/**
 * YouTube node data structure
 */
export type YouTubeFormData = FormDataWithExtras<{
  url: string;
}>;

// ============================================================================
// YouTube Node Metadata Types (DB Storage)
// ============================================================================

/**
 * YouTube metadata with typed data
 */
export type YouTubeMetadata = DefaultMetadata & {
  nodeUI: YouTubeNodeUI;
  formData: YouTubeFormData;
};

// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get YouTube metadata with typed data
 */
export function getYouTubeMetadata(block: Block): YouTubeMetadata {
  return block.metadata as YouTubeMetadata;
}

export type ReactFlowYouTubeNode = Node & {
  data: ReactFlowYouTubeNodeData;
}

export type ReactFlowYouTubeNodeData = ReactFlowNodeData & {
  nodeUI: YouTubeNodeUI;
  formData: YouTubeFormData;
}
