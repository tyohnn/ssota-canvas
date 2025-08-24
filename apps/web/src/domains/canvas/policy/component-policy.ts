import type { Block, BlockType } from "@/db/schema";
import type {
  ComponentDefinition,
  ComponentInstance,
  NodeUI,
  ComponentStatus,
} from "../types/component";
import {
  isComponentDefinition,
  isComponentInstance,
  resolveNodeStyle,
  getComponentStatus,
  DEFAULT_NODE_UI,
} from "../types/component";
import type { DefaultMetadata, UserSchema } from "./block-rendering-policy";
import {
  generateSchemaAndData,
  getDefaultBlockTemplate,
} from "./block-addition-policy";

// Component creation policies
export interface ComponentCreationPolicy {
  /**
   * Check if a block can be promoted to a component definition
   */
  canPromoteToDefinition(block: Block): boolean;

  /**
   * Check if blocks can be linked to an existing definition
   */
  canLinkToDefinition(
    blocks: Block[],
    definition: ComponentDefinition
  ): boolean;

  /**
   * Generate component key for a new definition
   */
  generateComponentKey(block: Block): string;

  /**
   * Generate component name for a new definition
   */
  generateComponentName(block: Block): string;
}

// Component style policies
export interface ComponentStylePolicy {
  /**
   * Check if style overrides are allowed for this component type
   */
  allowStyleOverrides(definition: ComponentDefinition): boolean;

  /**
   * Get allowed override fields for a component
   */
  getAllowedOverrideFields(definition: ComponentDefinition): string[];

  /**
   * Validate style override values
   */
  validateStyleOverride(
    definition: ComponentDefinition,
    overrides: Partial<NodeUI>
  ): { valid: boolean; errors: string[] };
}

// Component instance policies
export interface ComponentInstancePolicy {
  /**
   * Check if an instance can be created in the given page context
   */
  canCreateInstance(
    definition: ComponentDefinition,
    pageBlock: Block | null
  ): boolean;

  /**
   * Generate default instance data
   */
  generateInstanceData(
    definition: ComponentDefinition
  ): Record<string, unknown>;

  /**
   * Validate instance data
   */
  validateInstanceData(
    definition: ComponentDefinition,
    data: Record<string, unknown>
  ): { valid: boolean; errors: string[] };
}

// Default implementation of component creation policy
class DefaultComponentCreationPolicy implements ComponentCreationPolicy {
  canPromoteToDefinition(block: Block): boolean {
    // Can't promote existing components
    if (isComponentDefinition(block) || isComponentInstance(block)) {
      return false;
    }

    // Must have some visual representation (node_ui or supported block type)
    const metadata = block.metadata as DefaultMetadata;
    const hasNodeUI = !!metadata?.node_ui;
    const isSupportedType = this.isSupportedBlockType(block.block_type);

    return hasNodeUI || isSupportedType;
  }

  canLinkToDefinition(
    blocks: Block[],
    definition: ComponentDefinition
  ): boolean {
    if (!isComponentDefinition(definition)) {
      return false;
    }

    // All blocks must be linkable and of compatible type
    return blocks.every((block) => {
      // Can't link existing components
      if (isComponentDefinition(block) || isComponentInstance(block)) {
        return false;
      }

      // Must be compatible with definition's base type
      return this.isCompatibleWithDefinition(block, definition);
    });
  }

  generateComponentKey(block: Block): string {
    const baseName = block.name || block.slug || block.block_type;
    const sanitized = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${sanitized}_${timestamp}`;
  }

  generateComponentName(block: Block): string {
    const baseName = block.name || block.slug || block.block_type;
    return `${baseName} Component`;
  }

  private isSupportedBlockType(blockType: BlockType): boolean {
    const supportedTypes: BlockType[] = [
      "basic_text",
      "shape",
      "image",
      "webview",
      "twitter_preview",
      "video",
      "math_formula",
      "file",
      "youtube",
    ];
    return supportedTypes.includes(blockType);
  }

  private isCompatibleWithDefinition(
    block: Block,
    definition: ComponentDefinition
  ): boolean {
    // For now, allow any block to be linked to any definition
    // In the future, this could check for schema compatibility
    return true;
  }
}

// Default implementation of component style policy
class DefaultComponentStylePolicy implements ComponentStylePolicy {
  allowStyleOverrides(definition: ComponentDefinition): boolean {
    // Allow overrides for most component types
    const restrictedTypes = ["file"]; // File components might have fixed layouts
    const defMetadata = definition.metadata as any;
    const componentType = defMetadata?.component_type || definition.block_type;

    return !restrictedTypes.includes(componentType);
  }

  getAllowedOverrideFields(definition: ComponentDefinition): string[] {
    // Common style fields that can be overridden
    const baseFields = ["size", "color"];

    const defMetadata = definition.metadata as any;
    const componentType = defMetadata?.component_type || definition.block_type;

    switch (componentType) {
      case "shape":
        return [...baseFields, "shape", "weight", "fontSize"];
      case "basic_text":
        return [...baseFields, "weight", "fontSize"];
      case "image":
      case "video":
      case "webview":
        return [...baseFields];
      default:
        return baseFields;
    }
  }

  validateStyleOverride(
    definition: ComponentDefinition,
    overrides: Partial<NodeUI>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowedFields = this.getAllowedOverrideFields(definition);

    // Check if all override fields are allowed
    Object.keys(overrides).forEach((field) => {
      if (!allowedFields.includes(field) && !field.startsWith("__")) {
        errors.push(
          `Style field '${field}' is not allowed for this component type`
        );
      }
    });

    // Validate specific field values
    if (overrides.size) {
      const size = overrides.size as any;
      if (size.width && (size.width < 10 || size.width > 2000)) {
        errors.push("Width must be between 10 and 2000 pixels");
      }
      if (size.height && (size.height < 10 || size.height > 2000)) {
        errors.push("Height must be between 10 and 2000 pixels");
      }
    }

    if ((overrides as any).color) {
      const color = (overrides as any).color as string;
      if (color && !/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
        errors.push("Color must be a valid hex color code");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Default implementation of component instance policy
class DefaultComponentInstancePolicy implements ComponentInstancePolicy {
  canCreateInstance(
    definition: ComponentDefinition,
    pageBlock: Block | null
  ): boolean {
    if (!isComponentDefinition(definition)) {
      return false;
    }

    if (!pageBlock) {
      return true; // Allow if no page context
    }

    // Check if page allows this component type
    const pageMetadata = pageBlock.metadata as any;
    const allowedComponentIds = pageMetadata?.allowed_component_ids;

    if (Array.isArray(allowedComponentIds)) {
      return allowedComponentIds.includes(definition.id);
    }

    // If no restrictions, allow all
    return true;
  }

  generateInstanceData(
    definition: ComponentDefinition
  ): Record<string, unknown> {
    const defMetadata = definition.metadata;

    if (defMetadata.schema?.fields) {
      // Generate data based on schema fields
      const data: Record<string, unknown> = {};

      defMetadata.schema.fields.forEach((field) => {
        const defaultValue = this.getFieldDefaultValue(
          field.type,
          field.default
        );
        data[field.id] = defaultValue;
      });

      return data;
    }

    // Fallback to empty data
    return {};
  }

  validateInstanceData(
    definition: ComponentDefinition,
    data: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schema = definition.metadata.schema;

    if (!schema?.fields) {
      return { valid: true, errors: [] };
    }

    // Validate each schema field
    schema.fields.forEach((field) => {
      const value = data[field.id];
      const validation = field.validation;

      if (
        validation?.required &&
        (value === null || value === undefined || value === "")
      ) {
        errors.push(`Field '${field.label}' is required`);
      }

      if (
        value &&
        validation?.minLength &&
        typeof value === "string" &&
        value.length < validation.minLength
      ) {
        errors.push(
          `Field '${field.label}' must be at least ${validation.minLength} characters`
        );
      }

      if (
        value &&
        validation?.maxLength &&
        typeof value === "string" &&
        value.length > validation.maxLength
      ) {
        errors.push(
          `Field '${field.label}' must be at most ${validation.maxLength} characters`
        );
      }

      if (value && validation?.pattern && typeof value === "string") {
        const regex = new RegExp(validation.pattern, validation.patternFlags);
        if (!regex.test(value)) {
          errors.push(
            `Field '${field.label}' does not match the required pattern`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getFieldDefaultValue(type: string, defaultValue?: unknown): unknown {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    switch (type) {
      case "text":
      case "url":
      case "email":
      case "phone":
        return "";
      case "number":
        return 0;
      case "checkbox":
        return false;
      case "select":
      case "multi-select":
      case "status":
      case "color":
      case "shape":
        return null;
      case "date":
        return null;
      case "file":
        return null;
      case "hidden":
        return null;
      default:
        return null;
    }
  }
}

// Component policy registry
export class ComponentPolicyRegistry {
  private creationPolicy: ComponentCreationPolicy =
    new DefaultComponentCreationPolicy();
  private stylePolicy: ComponentStylePolicy = new DefaultComponentStylePolicy();
  private instancePolicy: ComponentInstancePolicy =
    new DefaultComponentInstancePolicy();

  setCreationPolicy(policy: ComponentCreationPolicy) {
    this.creationPolicy = policy;
  }

  setStylePolicy(policy: ComponentStylePolicy) {
    this.stylePolicy = policy;
  }

  setInstancePolicy(policy: ComponentInstancePolicy) {
    this.instancePolicy = policy;
  }

  getCreationPolicy(): ComponentCreationPolicy {
    return this.creationPolicy;
  }

  getStylePolicy(): ComponentStylePolicy {
    return this.stylePolicy;
  }

  getInstancePolicy(): ComponentInstancePolicy {
    return this.instancePolicy;
  }
}

// Global policy registry instance
export const componentPolicyRegistry = new ComponentPolicyRegistry();

// Convenience functions using the global registry
export function canPromoteBlockToComponent(block: Block): boolean {
  return componentPolicyRegistry
    .getCreationPolicy()
    .canPromoteToDefinition(block);
}

export function canLinkBlocksToComponent(
  blocks: Block[],
  definition: ComponentDefinition
): boolean {
  return componentPolicyRegistry
    .getCreationPolicy()
    .canLinkToDefinition(blocks, definition);
}

export function canCreateComponentInstance(
  definition: ComponentDefinition,
  pageBlock: Block | null
): boolean {
  return componentPolicyRegistry
    .getInstancePolicy()
    .canCreateInstance(definition, pageBlock);
}

export function allowsStyleOverrides(definition: ComponentDefinition): boolean {
  return componentPolicyRegistry
    .getStylePolicy()
    .allowStyleOverrides(definition);
}

export function getAllowedStyleOverrideFields(
  definition: ComponentDefinition
): string[] {
  return componentPolicyRegistry
    .getStylePolicy()
    .getAllowedOverrideFields(definition);
}

export function validateComponentStyleOverride(
  definition: ComponentDefinition,
  overrides: Partial<NodeUI>
): { valid: boolean; errors: string[] } {
  return componentPolicyRegistry
    .getStylePolicy()
    .validateStyleOverride(definition, overrides);
}

export function generateComponentInstanceData(
  definition: ComponentDefinition
): Record<string, unknown> {
  return componentPolicyRegistry
    .getInstancePolicy()
    .generateInstanceData(definition);
}

export function validateComponentInstanceData(
  definition: ComponentDefinition,
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  return componentPolicyRegistry
    .getInstancePolicy()
    .validateInstanceData(definition, data);
}

// Component-specific block template generation
export function generateComponentDefinitionTemplate(
  sourceBlock: Block,
  componentKey?: string,
  componentName?: string
): {
  block_type: BlockType;
  name: string;
  metadata: Record<string, unknown>;
} {
  const creationPolicy = componentPolicyRegistry.getCreationPolicy();
  const key = componentKey || creationPolicy.generateComponentKey(sourceBlock);
  const name =
    componentName || creationPolicy.generateComponentName(sourceBlock);

  const sourceMetadata = sourceBlock.metadata as DefaultMetadata;
  const baseTemplate = getDefaultBlockTemplate(sourceBlock.block_type);

  // ✅ 컴포넌트 정의용 데이터와 인스턴스용 데이터 구분
  const instanceData = sourceMetadata?.data || {};
  const definitionData = { ...instanceData };

  // ✅ Description은 컴포넌트 정의의 속성이므로 제거
  delete definitionData.description;

  // Create component definition metadata
  const metadata = {
    ...baseTemplate.metadata,
    role: "definition",
    component_key: key,
    component_category: "custom",
    description: `Component based on ${sourceBlock.name || sourceBlock.block_type}`,
    // Preserve original node_ui if exists
    node_ui: sourceMetadata?.node_ui || baseTemplate.metadata.node_ui,
    // Preserve original schema if exists
    schema: sourceMetadata?.schema || baseTemplate.metadata.schema,
    // ✅ 인스턴스용 데이터만 template_data로 설정
    template_data: definitionData,
  };

  return {
    block_type: sourceBlock.block_type,
    name,
    metadata,
  };
}

export function generateComponentInstanceTemplate(
  definition: ComponentDefinition,
  instanceName?: string
): {
  block_type: BlockType;
  name: string;
  metadata: Record<string, unknown>;
} {
  const instancePolicy = componentPolicyRegistry.getInstancePolicy();
  const name = instanceName || `${definition.name} Instance`;

  const metadata = {
    role: "instance",
    component_id: definition.id,
    data: instancePolicy.generateInstanceData(definition),
    // ✅ 스키마 제거 - 정의에서 실시간으로 가져옴
    // ✅ node_ui는 레이아웃 속성만 보존 (width, height, fontSize)
  };

  return {
    block_type: definition.block_type,
    name,
    metadata,
  };
}
