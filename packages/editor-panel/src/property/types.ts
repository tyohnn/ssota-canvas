/**
 * Property-related types (generic, no domain dependency)
 */

export interface PropertyGroupDefinition {
  id: string;
  label: string;
  description?: string;
  defaultCollapsed?: boolean;
  order: number;
  properties: string[];
}
