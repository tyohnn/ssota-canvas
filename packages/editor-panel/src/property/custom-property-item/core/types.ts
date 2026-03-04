/**
 * Custom property item types (generic, package-owned)
 */

export type CustomPropertyType =
  | 'text'
  | 'select'
  | 'multiselect'
  | 'status'
  | 'number'
  | 'boolean'
  | 'color'
  | 'url'
  | 'email'
  | 'phone'
  | 'date'
  | 'profile';

export interface CustomPropertyDefinitionLike {
  id: string;
  name: string;
  type: CustomPropertyType;
  icon?: string | null;
  options?: Array<{
    id: string;
    label: string;
    value: string;
    color?: string;
    order: number;
    group?: string;
  }>;
  order: number;
  visible: boolean;
  defaultValue?: unknown;
  validation?: { message?: string };
}

