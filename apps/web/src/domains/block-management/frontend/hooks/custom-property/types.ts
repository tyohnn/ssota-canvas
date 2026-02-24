/**
 * Types used by custom-property hooks (schema field editor, use-custom-property).
 */

/** Option shape used by useSchemaFieldEditor (commitOptions) */
export interface SchemaFieldPropertyOption {
  id: string;
  label: string;
  color: string;
  order: number;
}
