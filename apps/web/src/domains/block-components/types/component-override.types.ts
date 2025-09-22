// Override flags for component instances
export type OverrideFlags = {
  nodeUI: string[]; // Overridden node_ui fields
  formData: string[]; // Overridden data fields
  formSchema: string[]; // Overridden schema fields
};

// Override data structure
export type OverrideData = {
  nodeUI?: Partial<Record<string, unknown>>;
  formData?: Partial<Record<string, unknown>>;
  formSchema?: Partial<Record<string, unknown>>;
};

// Field path for override operations
export type OverrideFieldPath = [string, ...string[]]; // [category, field, ...nested]

// Override operation types
export type OverrideOperation = 
  | "apply"    // Apply override
  | "clear"    // Clear override
  | "toggle";  // Toggle override
