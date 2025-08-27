import type { Block } from "@/db/schema";
import { ShapeKey } from "./shape-policy";
import {
  isComponentInstance,
  isComponentDefinition,
  resolveNodeStyle,
  type ComponentDefinition,
} from "../types/component";

// User-defined schema field definition
export type EditorFieldType =
  | "text"
  | "number"
  | "select"
  | "multi-select"
  | "status"
  | "shape"
  | "color"
  | "date"
  | "checkbox"
  | "url"
  | "file"
  | "email"
  | "phone"
  | "hidden";

export type EditorValidationRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternFlags?: string;
  min?: number;
  max?: number;
};

export type SchemaField = {
  id: string;
  label: string;
  type: EditorFieldType;
  options?: { label: string; value: string; color?: string; group?: string }[];
  placeholder?: string;
  validation?: EditorValidationRules;
  default?: unknown;
  // When true, this field is part of the predefined schema (non-deletable)
  config?: {
    predefined?: boolean;
  };
  // Optional data path for predefined fields; user-defined defaults to ["data", id]
  path?: string[];
};

// User schema structure in metadata
export type UserSchema = {
  fields: SchemaField[];
};

// Backward-compat alias to avoid changing many imports at once
export type UserSchemaField = SchemaField;

// Metadata types per block rendering kind
export type DefaultNodeUI = {
  size?: { width?: number; height?: number };
};

export type ShapeNodeUI = DefaultNodeUI & {
  shape?: ShapeKey;
  color?: string;
  weight?: "normal" | "bold";
  fontSize?: "24px" | "32px" | "48px";
};

export type BasicTextNodeUI = DefaultNodeUI & {
  color?: string;
  weight?: "normal" | "bold";
  fontSize?: "24px" | "32px" | "48px";
};

export type TwitterPreviewNodeUI = DefaultNodeUI;

export type VideoNodeUI = DefaultNodeUI;

export type DefaultMetadata = {
  node_ui?: DefaultNodeUI;
  content?: string;
  schema?: UserSchema;
  data?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional properties for extensibility
};

export type ShapeMetadata = BlockMetadata<{
  node_ui?: ShapeNodeUI;
  // extend as needed, e.g., data schema fields
}>;

export type BasicTextMetadata = BlockMetadata<{
  node_ui?: BasicTextNodeUI;
  // extend as needed, e.g., data schema fields
}>;

export type TwitterPreviewMetadata = BlockMetadata<{
  node_ui?: TwitterPreviewNodeUI;
  twitter?: {
    url?: string;
    title?: string;
    description?: string;
    html?: string; // oEmbed html snippet
  };
}>;

export type TwitterPreviewNodeData = {
  label: string;
  url: string;
  title: string;
  description: string;
  html?: string;
};

export type VideoMetadata = DefaultMetadata & {
  node_ui?: VideoNodeUI;
  video?: {
    src: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
  };
};

export type VideoNodeData = {
  label: string;
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  width?: number;
  height?: number;
};

export type WebViewMetadata = DefaultMetadata & {
  url: string;
  sandbox?: boolean;
};

export type ImageMetadata = DefaultMetadata & {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
};

export type MathFormulaMetadata = DefaultMetadata & {
  latex: string; // TeX/LaTeX string
  displayMode?: boolean; // block vs inline
};

export type FileMetadata = DefaultMetadata & {
  name: string;
  mime?: string;
  sizeBytes?: number;
  url?: string;
};

// Helper type for creating new block metadata types
export type BlockMetadata<T = {}> = DefaultMetadata & T;

// Output node definition used by React Flow
export type NodeDefinition = {
  nodeType: string;
  data: Record<string, unknown>;
  width?: number;
  height?: number;
};

export interface BlockRenderingPolicy {
  supports(block: Block): boolean;
  buildNode(block: Block): NodeDefinition;
}

// Shape policy
class ShapeRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    return (block.block_type as string) === "shape";
  }

  buildNode(block: Block): NodeDefinition {
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    const md = (block.metadata || {}) as ShapeMetadata;
    const ui = md.node_ui || {};
    return {
      nodeType: "shape",
      data: {
        label,
        block,
      },
      // React Flow의 width/height props로 전달
      width: ui.size?.width,
      height: ui.size?.height,
    };
  }
}

// Basic Text policy
class BasicTextRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    return (block.block_type as string) === "basic_text";
  }

  buildNode(block: Block): NodeDefinition {
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    const md = (block.metadata || {}) as BasicTextMetadata;
    const ui = md.node_ui || {};
    return {
      nodeType: "basic_text",
      data: {
        label,
        block,
      },
      width: ui.size?.width,
      height: ui.size?.height,
    };
  }
}

// Render-kind policy based on metadata.node_ui.kind or metadata.render_kind
class ImageRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    const md = (block.metadata || {}) as Record<string, any>;
    return !!(md.image?.src || md.src || md.file?.mime?.startsWith?.("image"));
  }
  buildNode(block: Block): NodeDefinition {
    const md = (block.metadata || {}) as Record<string, any>;
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    return {
      nodeType: "image",
      data: {
        label,
        src: md.image?.src || md.src,
        alt: md.image?.alt || label,
        block,
      },
    };
  }
}

class WebViewRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    const md = (block.metadata || {}) as Record<string, any>;
    return !!(md.webview?.url || md.url);
  }
  buildNode(block: Block): NodeDefinition {
    const md = (block.metadata || {}) as Record<string, any>;
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    return {
      nodeType: "webview",
      data: {
        label,
        url: md.webview?.url || md.url,
        block,
      },
    };
  }
}

class TwitterPreviewRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    return (block.block_type as string) === "twitter_preview";
  }
  buildNode(block: Block): NodeDefinition {
    const md = (block.metadata || {}) as TwitterPreviewMetadata;
    const label = block.name || block.slug || block.id;
    const tw = md.twitter || {};
    return {
      nodeType: "twitter_preview",
      data: {
        label,
        url: tw.url,
        title: tw.title,
        description: tw.description,
        html: (tw as any)?.html,
        block,
      },
    };
  }
}

class VideoRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    return (block.block_type as string) === "video";
  }
  buildNode(block: Block): NodeDefinition {
    const md = (block.metadata || {}) as VideoMetadata;
    const vd = (md.video || {}) as Record<string, any>;
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    return {
      nodeType: "video",
      data: {
        label,
        src: vd.src || (md as any).src,
        autoplay: vd.autoplay,
        loop: vd.loop,
        muted: vd.muted,
        controls: vd.controls,
        block,
      },
    };
  }
}

class MathFormulaRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    const md = (block.metadata || {}) as Record<string, any>;
    return !!md.math?.latex;
  }
  buildNode(block: Block): NodeDefinition {
    const md = (block.metadata || {}) as Record<string, any>;
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    return {
      nodeType: "math_formula",
      data: {
        label,
        latex: md.math?.latex,
        displayMode: md.math?.displayMode,
        block,
      },
    };
  }
}

class FileRenderingPolicy implements BlockRenderingPolicy {
  supports(block: Block): boolean {
    const md = (block.metadata || {}) as Record<string, any>;
    return !!(md.file?.name || md.file?.url);
  }
  buildNode(block: Block): NodeDefinition {
    const md = (block.metadata || {}) as Record<string, any>;
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    return {
      nodeType: "file",
      data: {
        label,
        name: md.file?.name || label,
        url: md.file?.url,
        block,
      },
    };
  }
}

// Default fallback policy (renders a generic node)
class DefaultRenderingPolicy implements BlockRenderingPolicy {
  supports(_block: Block): boolean {
    return true;
  }

  buildNode(block: Block): NodeDefinition {
    const label =
      (block as any).name || (block as any).slug || (block.id as string);
    return {
      nodeType: "default",
      data: { label, block },
    };
  }
}

// Registry of policies; add new policies here
const policies: BlockRenderingPolicy[] = [
  new ShapeRenderingPolicy(),
  new BasicTextRenderingPolicy(),
  new ImageRenderingPolicy(),
  new WebViewRenderingPolicy(),
  new TwitterPreviewRenderingPolicy(),
  new VideoRenderingPolicy(),
  new MathFormulaRenderingPolicy(),
  new FileRenderingPolicy(),
  new DefaultRenderingPolicy(),
];

export function resolveRenderingPolicy(block: Block): BlockRenderingPolicy {
  return (
    policies.find((p) => p.supports(block)) || new DefaultRenderingPolicy()
  );
}

export function buildNodeDefinition(
  block: Block,
  componentDefinitionsById?: Record<string, ComponentDefinition>
): NodeDefinition {
  // For component instances, we need to enhance with style resolution
  if (isComponentInstance(block) && componentDefinitionsById) {
    const policy = resolveRenderingPolicy(block);
    const baseNode = policy.buildNode(block);

    // Resolve style from definition + overrides
    const resolvedStyle = resolveNodeStyle(block, componentDefinitionsById);

    // Apply resolved style to node data
    const enhancedData = {
      ...baseNode.data,
      // Mark as component instance
      __isComponentInstance: true,
      __componentId: block.metadata.component_id,
      __overridden: !!(resolvedStyle as any)?.__overridden,
      __orphaned: !!(resolvedStyle as any)?.__orphaned,
    };

    return {
      ...baseNode,
      data: enhancedData,
      // Apply size from resolved style
      width: (resolvedStyle as any)?.size?.width || baseNode.width,
      height: (resolvedStyle as any)?.size?.height || baseNode.height,
    };
  }

  // For component definitions, mark them as such
  if (isComponentDefinition(block)) {
    const policy = resolveRenderingPolicy(block);
    const baseNode = policy.buildNode(block);

    const enhancedData = {
      ...baseNode.data,
      __isComponentDefinition: true,
      __componentKey: block.metadata.component_key,
    };

    return {
      ...baseNode,
      data: enhancedData,
    };
  }

  // For regular blocks, use the standard policy
  return resolveRenderingPolicy(block).buildNode(block);
}
