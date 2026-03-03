/**
 * Custom property add popover types (generic, package-owned)
 */

export type PropertyTypeLike =
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

export interface CustomPropertyAddPopoverDeps {
  onSubmit: (params: {
    name: string;
    type: PropertyTypeLike;
    icon: string;
  }) => Promise<string | void>;
  onSuccess?: (propertyId?: string) => void;
  validate?: (name: string) => string | null;
}
