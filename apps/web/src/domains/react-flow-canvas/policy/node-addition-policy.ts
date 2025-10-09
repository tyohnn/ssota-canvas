import type { Block, BlockType } from '@/db/schema';
import {
  type ComponentDefinition,
  type ComponentDefinitionMetadata,
} from '@/domains/block-components';
import type { FormSchema, NodeUI } from '@/domains/blocks/types/common.node';
import type { PageBlockMetadata } from '@/domains/blocks/types/page.node';
import { generateDefaultFormSchemaByType } from './node-form-schema-policy';

export type BlockOption = {
  id: string; // kind id
  kind: BlockType;
  title: string;
  icon_name: string;
  description?: string;
  color?: string; // tailwind color hint
  isComponent?: boolean; // true if this is a component definition
};

// Static components always available (baseline)
export function getStaticComponents(): BlockOption[] {
  return [
    {
      id: 'text',
      kind: 'text',
      title: 'Text',
      description: 'Basic text node',
      icon_name: 'text',
      color: 'slate',
    },
    {
      id: 'shape',
      kind: 'shape',
      title: 'Shape',
      description: 'Shape node with customizable colors and forms',
      icon_name: 'square',
      color: 'slate',
    },
    {
      id: 'image',
      kind: 'image',
      title: 'Image',
      description: 'Render an image from URL',
      icon_name: 'image',
      color: 'blue',
    },
    {
      id: 'webview',
      kind: 'webview',
      title: 'Webview',
      description: 'Embed a website in an iframe',
      icon_name: 'globe',
      color: 'emerald',
    },
    {
      id: 'twitter_preview',
      kind: 'twitter_preview',
      title: 'Twitter Preview',
      description: 'Preview a tweet by URL',
      icon_name: 'twitter',
      color: 'sky',
    },
    {
      id: 'video',
      kind: 'video',
      title: 'Video',
      description: 'Embed a video by URL',
      icon_name: 'video',
      color: 'violet',
    },
    {
      id: 'math_formula',
      kind: 'math_formula',
      title: 'Math Formula',
      description: 'Render a LaTeX math formula',
      icon_name: 'sigma',
      color: 'amber',
    },
    {
      id: 'file',
      kind: 'file',
      title: 'File',
      description: 'Attach and preview a file',
      icon_name: 'file',
      color: 'slate',
    },
    {
      id: 'youtube',
      kind: 'youtube',
      title: 'YouTube',
      description: 'Embed a YouTube video by URL',
      icon_name: 'youtube',
      color: 'red',
    },
  ];
}

// Get component definitions available for a page
export function getComponentDefinitionsForPage(
  pageBlock: Block | null | undefined,
  componentBlocks: ComponentDefinition[]
): BlockOption[] {
  const componentDefinitions = componentBlocks.map(block => ({
    ...block,
    metadata: block.metadata as ComponentDefinitionMetadata,
  }));

  if (!pageBlock) {
    // If no page context, show all component definitions
    return componentDefinitions.map(def => ({
      id: def.id,
      kind: def.block_type,
      title: def.title,
      description: def.metadata.componentData.description,
      icon_name: 'component',
      color: 'purple',
      isComponent: true,
    }));
  }

  const pageMetadata = pageBlock.metadata as PageBlockMetadata;
  const allowedComponentIds = pageMetadata.pageData.allowed_component_ids;

  // If page has restrictions, filter by allowed component IDs
  if (Array.isArray(allowedComponentIds)) {
    return componentBlocks
      .filter(def => allowedComponentIds.includes(def.id))
      .map(def => ({
        id: def.id,
        kind: def.block_type,
        title: def.title,
        description: def.metadata.componentData.description,
        icon_name: 'component',
        color: 'purple',
        isComponent: true,
      }));
  }

  // No restrictions, show all
  return componentDefinitions.map(def => ({
    id: def.id,
    kind: def.block_type,
    title: def.title,
    description: def.metadata.componentData.description,
    icon_name: 'component',
    color: 'purple',
    isComponent: true,
  }));
}

export function getBlockAdditionPolicy(
  pageBlock: Block | null | undefined,
  allComponentBlocks?: ComponentDefinition[]
): BlockOption[] {
  const staticBlocks = getStaticComponents();

  // Add component definitions if available
  const componentBlocks = allComponentBlocks
    ? getComponentDefinitionsForPage(pageBlock, allComponentBlocks)
    : [];

  const blocks = [...staticBlocks, ...componentBlocks];

  return blocks;
}

// New function to generate initial metadata for each node type
export function generateInitialNodeMetadata(nodeType: BlockType): {
  icon_name: string;
  formData: Record<string, unknown>;
  formSchema: FormSchema;
  nodeUI: NodeUI;
} {
  const baseNodeUI = {
    size: {
      width: 200,
      // height: 100,
    },
    fontSize: '32px',
    weight: 'bold',
  };

  switch (nodeType) {
    case 'text':
      return {
        icon_name: 'type',
        formData: {},
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          size: { width: 200 },
          // height: Math.max(48, (32 * 1.2) + 16) }, // 최소 48px 보장
          color: 'gray',
          textAlign: 'center',
          richStyle: false,
        },
      };

    case 'shape':
      return {
        icon_name: 'square',
        formData: {},
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          shape: 'rect',
          color: 'gray',
        },
      };

    case 'image':
      return {
        icon_name: 'image',
        formData: {
          src: '',
          alt: '',
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          size: { width: 200 },
          // height: 150 },
        },
      };

    case 'webview':
      return {
        icon_name: 'globe',
        formData: {
          url: '',
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          size: { width: 400 },
          // height: 300 },
        },
      };

    case 'twitter_preview':
      return {
        icon_name: 'twitter',
        formData: {
          url: '',
          title: '',
          description: '',
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          size: { width: 360 },
          // height: 320 },
        },
      };

    case 'video':
      return {
        icon_name: 'square-play',
        formData: {
          src: '',
          autoplay: false,
          loop: false,
          muted: false,
          controls: true,
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          size: { width: 320 },
          // height: 180 },
        },
      };

    case 'math_formula':
      return {
        icon_name: 'sigma',
        formData: {
          latex: '',
          displayMode: false,
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: baseNodeUI,
      };

    case 'file':
      return {
        icon_name: 'paperclip',
        formData: {
          name: '',
          url: '',
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: baseNodeUI,
      };

    case 'youtube':
      return {
        icon_name: 'youtube',
        formData: {
          url: '',
        },
        formSchema: generateDefaultFormSchemaByType(nodeType),
        nodeUI: {
          ...baseNodeUI,
          size: { width: 320 },
          // height: 180 },
        },
      };

    default:
      return {
        icon_name: 'blocks',
        formData: {},
        formSchema: { fields: [] },
        nodeUI: baseNodeUI,
      };
  }
}
