/**
 * Property Input Types (generic, package-owned)
 * Callers (apps/web) pass structurally compatible types.
 */

export type PropertyInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'email'
  | 'phone'
  | 'select'
  | 'status'
  | 'multi-select'
  | 'datetime'
  | 'color'
  | 'checkbox'
  | 'profile'
  | 'media'
  | 'image-upload'
  | 'readonly-text'
  | 'readonly-datetime'
  | 'readonly-profile';

export interface PropertyOptionLike {
  id: string;
  label: string;
  value: string;
  color?: string;
  order: number;
  disabled?: boolean;
  description?: string;
  group?: string;
}

export interface PropertyUIDefinition {
  label: string;
  inputType: PropertyInputType;
  icon?: string;
  description?: string;
  placeholder?: string;
  order: number;
  readonly?: boolean;
  options?: Array<PropertyOptionLike>;
  showIf?: (properties: Record<string, unknown>) => boolean;
  defaultDisplay?: (value: unknown) => string;
}
