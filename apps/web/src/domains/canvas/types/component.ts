import type { Block } from "@/db/schema";
import type {
  DefaultMetadata,
  UserSchema,
  NodeDefinition,
  DefaultNodeUI,
  ShapeNodeUI,
  BasicTextNodeUI,
  TwitterPreviewNodeUI,
  VideoNodeUI,
} from "../policy/block-rendering-policy";

// Union type for all possible node UI types
export type NodeUI =
  | DefaultNodeUI
  | ShapeNodeUI
  | BasicTextNodeUI
  | TwitterPreviewNodeUI
  | VideoNodeUI
  | Record<string, unknown>; // Allow for extensibility

// Component Definition - template that defines the style and schema
export type ComponentDefinition = Block & {
  object: "component";
  metadata: DefaultMetadata & {
    role: "definition";
    node_ui: NodeUI; // Base style template
    schema?: UserSchema; // Data field definitions
    component_key: string; // Unique component identifier
    component_category?: string; // Optional category for organization
    description?: string; // Optional description for the component
  };
};

// Component Instance - actual usage of a component definition
export type ComponentInstance = Block & {
  object: "block"; // 일반 블록과 동일하게 유지
  metadata: DefaultMetadata & {
    role: "instance";
    component_id: string; // Reference to definition block ID
    node_ui?: Partial<NodeUI>; // Optional style overrides
    data?: Record<string, unknown>; // Instance-specific data
  };
};

// Default fallback styles
export const DEFAULT_NODE_UI: NodeUI = {
  size: { width: 200, height: 100 },
};

// Component status for instances
export type ComponentStatus =
  | "active" // Instance is using definition style
  | "overridden" // Instance has style overrides
  | "orphaned" // Definition not found
  | "invalid"; // Instance data is malformed

// Component relationship info
export type ComponentRelationship = {
  definitionId: string;
  instanceIds: string[];
  status: ComponentStatus;
};

// Type guards
export function isComponentDefinition(
  block: Block
): block is ComponentDefinition {
  const metadata = block.metadata as any;
  return block.object === "component" && metadata?.role === "definition";
}

export function isComponentInstance(block: Block): block is ComponentInstance {
  const metadata = block.metadata as any;
  return (
    block.object === "block" && // 일반 블록과 동일
    metadata?.role === "instance" &&
    typeof metadata?.component_id === "string"
  );
}

export function isComponent(
  block: Block
): block is ComponentDefinition | ComponentInstance {
  return isComponentDefinition(block) || isComponentInstance(block);
}

// Style resolution utility
export function resolveNodeStyle(
  block: Block,
  definitionsById: Record<string, ComponentDefinition>
): NodeUI {
  // For component instances, resolve style from definition + overrides
  if (isComponentInstance(block)) {
    const definition = definitionsById[block.metadata.component_id];

    if (!definition) {
      // Definition not found - return default with warning indicator
      return {
        ...DEFAULT_NODE_UI,
        __orphaned: true, // Special flag for orphaned instances
      };
    }

    const baseStyle = definition.metadata.node_ui ?? DEFAULT_NODE_UI;
    const overrideStyle = block.metadata.node_ui;

    // If there are overrides, merge them with base style
    if (overrideStyle && Object.keys(overrideStyle).length > 0) {
      return {
        ...baseStyle,
        ...overrideStyle,
        __overridden: true, // Special flag for overridden instances
      };
    }

    return baseStyle;
  }

  // For component definitions, use their own style
  if (isComponentDefinition(block)) {
    return block.metadata.node_ui ?? DEFAULT_NODE_UI;
  }

  // For regular blocks, use their metadata node_ui or default
  const metadata = block.metadata as DefaultMetadata;
  return metadata?.node_ui ?? DEFAULT_NODE_UI;
}

// Get component status
export function getComponentStatus(
  instance: ComponentInstance,
  definitionsById: Record<string, ComponentDefinition>
): ComponentStatus {
  const definition = definitionsById[instance.metadata.component_id];

  if (!definition) {
    return "orphaned";
  }

  if (
    !instance.metadata ||
    typeof instance.metadata.component_id !== "string"
  ) {
    return "invalid";
  }

  const hasOverrides =
    instance.metadata.node_ui &&
    Object.keys(instance.metadata.node_ui).length > 0;

  return hasOverrides ? "overridden" : "active";
}

// Check if a specific field is overridden in component instance
export function isFieldOverridden(
  instance: ComponentInstance,
  definition: ComponentDefinition,
  fieldPath: string[]
): boolean {
  // If instance has no node_ui, no overrides
  if (!instance.metadata.node_ui) {
    return false;
  }

  // Extract the actual field path (remove 'node_ui' prefix if present)
  const actualFieldPath =
    fieldPath[0] === "node_ui" ? fieldPath.slice(1) : fieldPath;

  // Check if the field exists in instance's node_ui
  const instanceValue = getNestedValue(
    instance.metadata.node_ui,
    actualFieldPath
  );

  // If field exists in instance's node_ui, it's overridden
  return instanceValue !== undefined;
}

// Get the effective value for a field (definition value or instance override)
export function getEffectiveFieldValue(
  instance: ComponentInstance,
  definition: ComponentDefinition,
  fieldPath: string[]
): any {
  // Extract the actual field path (remove 'node_ui' prefix if present)
  const actualFieldPath =
    fieldPath[0] === "node_ui" ? fieldPath.slice(1) : fieldPath;

  // First check if instance has an override for this field
  if (instance.metadata.node_ui) {
    const instanceValue = getNestedValue(
      instance.metadata.node_ui,
      actualFieldPath
    );
    if (instanceValue !== undefined) {
      return instanceValue;
    }
  }

  // Return definition value as fallback
  return getNestedValue(definition.metadata.node_ui, actualFieldPath);
}

// Helper function to get nested object value
function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Extract component definitions from blocks
export function extractComponentDefinitions(
  blocks: Block[]
): ComponentDefinition[] {
  return blocks.filter(isComponentDefinition);
}

// Extract component instances from blocks
export function extractComponentInstances(
  blocks: Block[]
): ComponentInstance[] {
  return blocks.filter(isComponentInstance);
}

// Group instances by their definition
export function groupInstancesByDefinition(
  instances: ComponentInstance[]
): Record<string, ComponentInstance[]> {
  return instances.reduce(
    (groups, instance) => {
      const defId = instance.metadata.component_id;
      if (!groups[defId]) {
        groups[defId] = [];
      }
      groups[defId].push(instance);
      return groups;
    },
    {} as Record<string, ComponentInstance[]>
  );
}

// Create component relationships map
export function createComponentRelationships(
  definitions: ComponentDefinition[],
  instances: ComponentInstance[]
): Record<string, ComponentRelationship> {
  const definitionsById = definitions.reduce(
    (map, def) => {
      map[def.id] = def;
      return map;
    },
    {} as Record<string, ComponentDefinition>
  );

  const instancesByDef = groupInstancesByDefinition(instances);

  const relationships: Record<string, ComponentRelationship> = {};

  // Create relationships for definitions that have instances
  definitions.forEach((def) => {
    const relatedInstances = instancesByDef[def.id] || [];

    relationships[def.id] = {
      definitionId: def.id,
      instanceIds: relatedInstances.map((inst) => inst.id),
      status: relatedInstances.length > 0 ? "active" : "active",
    };
  });

  return relationships;
}

// Validation utilities
export function validateComponentInstance(
  instance: ComponentInstance,
  definition?: ComponentDefinition
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!instance.metadata?.component_id) {
    errors.push("Instance must have a component_id");
  }

  if (instance.metadata?.role !== "instance") {
    errors.push("Instance role must be 'instance'");
  }

  if (definition) {
    if (definition.metadata?.role !== "definition") {
      errors.push("Referenced definition must have role 'definition'");
    }

    if (!definition.metadata?.component_key) {
      errors.push("Referenced definition must have a component_key");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateComponentDefinition(definition: ComponentDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!definition.metadata?.component_key) {
    errors.push("Definition must have a component_key");
  }

  if (definition.metadata?.role !== "definition") {
    errors.push("Definition role must be 'definition'");
  }

  if (!definition.metadata?.node_ui) {
    errors.push("Definition must have node_ui styling");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
