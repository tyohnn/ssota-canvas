import type { Block, BlockType } from "@/db/schema";
import {
  resolveEditorPolicy,
  computePredefinedSchemaFields,
} from "./block-editor-policy";
import {
  isComponentDefinition,
  extractComponentDefinitions,
  type ComponentDefinition,
} from "../types/component";

export type BlockOption = {
  id: string; // kind id
  kind: BlockType;
  name: string;
  description?: string;
  icon?: string; // optional lucide icon name (for consumer mapping)
  color?: string; // tailwind color hint
  isComponent?: boolean; // true if this is a component definition
  componentDefinition?: ComponentDefinition; // reference to component definition
};

export type BlockAdditionPolicyResult = {
  title: string;
  description: string;
  blocks: BlockOption[];
};

// Static components always available (baseline)
export function getStaticComponents(): BlockOption[] {
  return [
    {
      id: "basic_text",
      kind: "basic_text",
      name: "Text",
      description: "Basic text node",
      icon: "Text",
      color: "slate",
    },
    {
      id: "shape",
      kind: "shape",
      name: "Shape",
      description: "Shape node with customizable colors and forms",
      icon: "Square",
      color: "slate",
    },
    {
      id: "image",
      kind: "image",
      name: "Image",
      description: "Render an image from URL",
      icon: "Image",
      color: "blue",
    },
    {
      id: "webview",
      kind: "webview",
      name: "Webview",
      description: "Embed a website in an iframe",
      icon: "Globe",
      color: "emerald",
    },
    {
      id: "twitter_preview",
      kind: "twitter_preview",
      name: "Twitter Preview",
      description: "Preview a tweet by URL",
      icon: "Twitter",
      color: "sky",
    },
    {
      id: "video",
      kind: "video",
      name: "Video",
      description: "Embed a video by URL",
      icon: "Video",
      color: "violet",
    },
    {
      id: "math_formula",
      kind: "math_formula",
      name: "Math Formula",
      description: "Render a LaTeX math formula",
      icon: "Sigma",
      color: "amber",
    },
    {
      id: "file",
      kind: "file",
      name: "File",
      description: "Attach and preview a file",
      icon: "File",
      color: "slate",
    },
    {
      id: "youtube",
      kind: "youtube",
      name: "YouTube",
      description: "Embed a YouTube video by URL",
      icon: "Youtube",
      color: "red",
    },
  ];
}

// Get component definitions available for a page
export function getComponentDefinitionsForPage(
  pageBlock: Block | null | undefined,
  allBlocks: Block[]
): BlockOption[] {
  const componentDefinitions = extractComponentDefinitions(allBlocks);

  if (!pageBlock) {
    // If no page context, show all component definitions
    return componentDefinitions.map((def) => ({
      id: def.id,
      kind: def.block_type,
      name: def.name,
      description:
        def.metadata.description || `Component based on ${def.block_type}`,
      icon: "component",
      color: "purple",
      isComponent: true,
      componentDefinition: def,
    }));
  }

  const pageMetadata = pageBlock.metadata as any;
  const allowedComponentIds = pageMetadata?.allowed_component_ids as
    | string[]
    | undefined;

  // If page has restrictions, filter by allowed component IDs
  if (Array.isArray(allowedComponentIds)) {
    return componentDefinitions
      .filter((def) => allowedComponentIds.includes(def.id))
      .map((def) => ({
        id: def.id,
        kind: def.block_type,
        name: def.name,
        description:
          def.metadata.description || `Component based on ${def.block_type}`,
        icon: "component",
        color: "purple",
        isComponent: true,
        componentDefinition: def,
      }));
  }

  // No restrictions, show all
  return componentDefinitions.map((def) => ({
    id: def.id,
    kind: def.block_type,
    name: def.name,
    description:
      def.metadata.description || `Component based on ${def.block_type}`,
    icon: "component",
    color: "purple",
    isComponent: true,
    componentDefinition: def,
  }));
}

// Dynamic components based on current page block metadata (placeholder logic)
export function getDynamicComponentsForPage(
  pageBlock: Block | null | undefined
): BlockOption[] {
  if (!pageBlock) return [];
  const md = (pageBlock.metadata || {}) as Record<string, any>;
  const allowedKinds = (md.allowed_kinds as BlockType[] | undefined) || [];
  const base = getStaticComponents();
  if (allowedKinds.length === 0) return base;
  return base.filter((c) => allowedKinds.includes(c.kind));
}

export function getBlockAdditionPolicy(
  pageBlock: Block | null | undefined,
  allBlocks?: Block[]
): BlockAdditionPolicyResult {
  const staticBlocks = getDynamicComponentsForPage(pageBlock);

  // Add component definitions if available
  const componentBlocks = allBlocks
    ? getComponentDefinitionsForPage(pageBlock, allBlocks)
    : [];

  const blocks = [...staticBlocks, ...componentBlocks];

  return {
    title: "Add Block",
    description:
      "Choose a component to insert into the current page. You can customize it later.",
    blocks,
  };
}

// Generate schema and default data based on editor policy
export function generateSchemaAndData(kind: BlockType): {
  schema: { fields: any[] };
  data: Record<string, unknown>;
  node_ui?: Record<string, unknown>;
} {
  // Create a temporary block to get the policy
  const tempBlock = {
    id: "temp",
    block_type: kind,
    name: "temp",
    slug: "temp",
    metadata: {},
    object: "block",
    icon_name: "file",
    order: 0,
    parent_block_id: null,
    workspace_id: "temp",
    created_at: new Date(),
    updated_at: new Date(),
  } as Block;

  // Get predefined schema fields from policy
  const schemaFields = computePredefinedSchemaFields(tempBlock);

  // Generate default data values based on field type and path
  const data: Record<string, unknown> = {};
  const node_ui: Record<string, unknown> = {};

  schemaFields.forEach((field) => {
    const fieldId = field.id;
    const fieldType = field.type;
    const path = field.path || ["data", fieldId];

    // Determine default value based on field type
    let defaultValue: unknown;
    switch (fieldType) {
      case "text":
        defaultValue = null;
        break;
      case "select":
      case "shape":
        // For select fields, use the first option value or a sensible default
        if (field.options && field.options.length > 0 && field.options[0]) {
          defaultValue = field.options[0].value;
        } else if (fieldId === "shape") {
          defaultValue = "rect";
        } else {
          defaultValue = null;
        }
        break;
      case "color":
        defaultValue = "#F3F4F6";
        break;
      case "number":
        defaultValue = 0;
        break;
      case "checkbox":
        defaultValue = false;
        break;
      case "url":
        defaultValue = "";
        break;
      default:
        defaultValue = null;
    }

    // Store value in the correct location based on path
    if (path[0] === "node_ui" && path[1]) {
      // Store in node_ui object
      node_ui[path[1]] = defaultValue;
    } else {
      // Store in data object (default behavior)
      data[fieldId] = defaultValue;
    }
  });

  return {
    schema: { fields: schemaFields },
    data,
    ...(Object.keys(node_ui).length > 0 && { node_ui }),
  };
}

// Default metadata templates per component kind (client-side only)
export function getDefaultBlockTemplate(kind: BlockType): {
  block_type: string;
  name: string;
  metadata: Record<string, unknown>;
} {
  const displayName =
    kind === "basic_text"
      ? "Text"
      : kind === "shape"
        ? "Shape"
        : kind.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const metadata: any = { node_ui: { size: { width: 360, height: 320 } } };

  switch (kind) {
    case "basic_text":
      // Set smaller initial size for auto-sizing text nodes
      metadata.node_ui = { size: { width: 80, height: 40 } };
      // Generate schema and data from policy
      const basicTextResult = generateSchemaAndData(kind);
      metadata.schema = basicTextResult.schema;
      metadata.data = basicTextResult.data;
      // Merge node_ui data if it exists
      if (basicTextResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...basicTextResult.node_ui };
      }
      return { block_type: "basic_text", name: displayName, metadata };
    case "shape":
      // Generate schema and data from policy
      const { schema, data, node_ui } = generateSchemaAndData(kind);
      metadata.schema = schema;
      metadata.data = data;
      // Merge node_ui data if it exists
      if (node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...node_ui };
      }
      return { block_type: "shape", name: displayName, metadata };
    case "image":
      metadata.image = { src: "" };
      // Generate schema and data from policy
      const imageResult = generateSchemaAndData(kind);
      metadata.schema = imageResult.schema;
      metadata.data = imageResult.data;
      if (imageResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...imageResult.node_ui };
      }
      return { block_type: "image", name: displayName, metadata };
    case "webview":
      metadata.webview = { url: "" };
      // Generate schema and data from policy
      const webviewResult = generateSchemaAndData(kind);
      metadata.schema = webviewResult.schema;
      metadata.data = webviewResult.data;
      if (webviewResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...webviewResult.node_ui };
      }
      return { block_type: "webview", name: displayName, metadata };
    case "twitter_preview":
      metadata.node_ui = { size: { width: 360, height: 320 } };
      metadata.twitter = {
        url: "",
        title: "",
        description: "",
      };
      // Generate schema and data from policy
      const twitterResult = generateSchemaAndData(kind);
      metadata.schema = twitterResult.schema;
      metadata.data = twitterResult.data;
      if (twitterResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...twitterResult.node_ui };
      }
      return { block_type: "twitter_preview", name: displayName, metadata };
    case "video":
      metadata.video = { src: "" };
      metadata.node_ui = { size: { width: 320, height: 180 } };
      // Generate schema and data from policy
      const videoResult = generateSchemaAndData(kind);
      metadata.schema = videoResult.schema;
      metadata.data = videoResult.data;
      if (videoResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...videoResult.node_ui };
      }
      return { block_type: "video", name: displayName, metadata };
    case "math_formula":
      metadata.math = { latex: "" };
      // Generate schema and data from policy
      const mathResult = generateSchemaAndData(kind);
      metadata.schema = mathResult.schema;
      metadata.data = mathResult.data;
      if (mathResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...mathResult.node_ui };
      }
      return { block_type: "math_formula", name: displayName, metadata };
    case "file":
      metadata.file = { name: "Untitled", url: "" };
      // Generate schema and data from policy
      const fileResult = generateSchemaAndData(kind);
      metadata.schema = fileResult.schema;
      metadata.data = fileResult.data;
      if (fileResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...fileResult.node_ui };
      }
      return { block_type: "file", name: displayName, metadata };
    case "youtube":
      metadata.youtube = { url: "https://www.youtube.com/watch?v=5_0dVHMpJlo" };
      metadata.node_ui = { size: { width: 320, height: 180 } };
      // Generate schema and data from policy
      const youtubeResult = generateSchemaAndData(kind);
      metadata.schema = youtubeResult.schema;
      metadata.data = youtubeResult.data;
      if (youtubeResult.node_ui) {
        metadata.node_ui = { ...metadata.node_ui, ...youtubeResult.node_ui };
      }
      return { block_type: "youtube", name: displayName, metadata };
    default:
      return { block_type: "shape", name: displayName, metadata };
  }
}
