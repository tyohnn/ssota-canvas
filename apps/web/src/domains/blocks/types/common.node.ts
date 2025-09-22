import type { Block, BlockType } from '@/db/schema';
import type { PageBlockData } from '@/domains/blocks/types/page.node';
import {
  ComponentDefinitionData,
  ComponentInstanceData,
} from '@/domains/block-components/types/component.types';
import { ShapeKey } from '@/domains/blocks/policy/shape-policy';

export { BlockType };

// ============================================================================
// User Schema Types
// ============================================================================
export const styleSchemaType = [
  'shape',
  'color',
  'font',
  'background',
  'border',
  'shadow',
  'animation',
  'transition',
  'other',
] as const;

export type StyleSchemaType = (typeof styleSchemaType)[number];

export type SchemaFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'status'
  | 'shape'
  | 'color'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'file'
  | 'email'
  | 'phone'
  | 'hidden';

export type SchemaValidationRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternFlags?: string;
  min?: number;
  max?: number;
};

export type SchemaFieldOption = {
  label: string;
  value: string;
  color?: string;
  group?: string;
};

export type SchemaField = {
  id: string;
  path: string[];
  label: string;
  type: SchemaFieldType;
  options?: SchemaFieldOption[];
  placeholder?: string;
  validation?: SchemaValidationRules;
  default?: unknown;
  config?: {
    predefined?: boolean;
    readonly?: boolean;
  };
};

export type FormSchema = {
  fields: SchemaField[];
};

// ============================================================================
// Base Types
// ============================================================================

/**
 * Base Node UI with minimal common properties
 */
export type BaseNodeUI = {
  size: { width: number; height?: number };
};

export type NodeUI = {
  size: { width: number; height?: number };
  [key: string]: unknown;
};

/**
 * Base metadata structure
 */
export type DefaultMetadata = {
  nodeUI: NodeUI;
  formSchema: FormSchema;
  formData: Record<string, unknown>;
  role: 'definition' | 'instance';
  instanceData?: ComponentInstanceData;
  componentData?: ComponentDefinitionData;
  pageData?: PageBlockData;
  content?: string;
  [key: string]: unknown;
};

/**
 * Comprehensive NodeUI type that includes all possible UI properties
 * This is for documentation purposes only - not used in actual code
 * All properties are required to show the complete set of available options
 */
export type AllNodeUIProperties = {
  // Common properties
  size: { width: number; height?: number };

  // Visual styling properties
  color: string;
  shape: ShapeKey;
  fontSize: '24px' | '32px' | '48px';
  weight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  richStyle: boolean;

  // Additional UI properties that might be added in the future
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  zIndex?: number;
  rotation?: number;
  scale?: number;
  shadow?: {
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: 'horizontal' | 'vertical' | 'diagonal';
  };
  animation?: {
    type: 'fade' | 'slide' | 'bounce' | 'rotate';
    duration: number;
    delay?: number;
    easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
};

export type ReactFlowNodeData = {
  title: string;
  slug: string;
  workspace_id: string;
  parent_block_id: string;
  order: number;
  icon_name: string;
  object: 'block' | 'page' | 'component';
  created_at: string;
  updated_at: string;
  // metadata at db
  formData: Record<string, unknown>;
  formSchema: FormSchema;
  nodeUI: NodeUI;
  role: 'definition' | 'instance';
  instanceData?: ComponentInstanceData;
  componentData?: ComponentDefinitionData;
  pageData?: PageBlockData;
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic type for node-specific data with additional user-defined fields
 */
export type FormDataWithExtras<T> = T & {
  [key: string]: unknown; // Allow additional user-defined fields
};

// ============================================================================
// Type-Safe Access Functions
// ============================================================================

/**
 * Get typed metadata based on block type
 */
export function getTypedMetadata(block: Block): DefaultMetadata {
  return block.metadata as DefaultMetadata;
}
