import type { Block } from '@/db/schema';

export type ViewType = 'canvas' | 'table' | 'kanban' | 'markdown';

export type ViewConfig = {
  // table
  columns?: string[];
  // kanban
  groupBy?: string;
  // markdown
  template?: string;
  // future: layout, sorting, filters, etc.
  [key: string]: unknown;
};

export type ViewDefinition = {
  id: string;
  name: string;
  type: ViewType;
  componentFilter?: string; // simple V1 filter by component type/name
  config: ViewConfig;
  sortOrder?: number;
};

export type PageViewsMetadata = {
  default?: string; // default view id or the string "canvas"
  definitions?: ViewDefinition[];
};

/**
 * Determines whether a value conforms to the ViewDefinition shape and narrows its type.
 *
 * @param value - The value to test.
 * @returns `true` if `value` has `id`, `name`, and `type` properties of type `string`, `false` otherwise.
 */
function isViewDefinition(value: any): value is ViewDefinition {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string'
  );
}

/**
 * Build PageViewsMetadata from a page block's metadata, extracting and normalizing view definitions.
 *
 * Reads `pageBlock.metadata.views`, filters entries that conform to `ViewDefinition`, shallow-copies them,
 * sorts by `sortOrder` (ascending, default 0), and returns the resulting definitions plus a validated `default` view id.
 *
 * @param pageBlock - The page block whose metadata may contain a `views` object
 * @returns An object with an optional `default` view id and a sorted array of `definitions` (empty array if none)
 */
export function extractPageViewsMetadata(
  pageBlock: Block | null | undefined
): PageViewsMetadata {
  const md: any = pageBlock?.metadata || {};
  const views = md?.views || {};
  const definitionsRaw: any[] = Array.isArray(views?.definitions)
    ? views.definitions
    : [];

  const definitions: ViewDefinition[] = definitionsRaw
    .filter(isViewDefinition)
    .map(v => ({ ...v }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const result: PageViewsMetadata = {
    default: typeof views?.default === 'string' ? views.default : undefined,
    definitions,
  };
  return result;
}

export function getAvailableViews(
  pageBlock: Block | null | undefined
): ViewDefinition[] {
  const { definitions } = extractPageViewsMetadata(pageBlock);
  return definitions || [];
}

/**
 * Determine the initial view id for a page block.
 *
 * @param pageBlock - The page block whose metadata may define available views
 * @returns The default view id from the block's metadata if it matches an available definition; otherwise the first available definition's id; if no definitions are present, returns 'canvas'
 */
export function resolveInitialViewId(
  pageBlock: Block | null | undefined
): string {
  const { default: def, definitions } = extractPageViewsMetadata(pageBlock);
  const defs = definitions ?? [];
  if (defs.length > 0) {
    if (def && defs.some(v => v.id === def)) {
      return def;
    }
    return defs[0]?.id || 'canvas';
  }
  // No definitions → default to canvas
  return 'canvas';
}

/**
 * Locate a view definition with the given id inside a page block.
 *
 * @param pageBlock - The page block whose view definitions will be searched; may be null or undefined
 * @param viewId - The id of the view definition to find
 * @returns The `ViewDefinition` whose `id` matches `viewId`, or `null` if not found or if `pageBlock` is missing
 */
export function findViewDefinition(
  pageBlock: Block | null | undefined,
  viewId: string
): ViewDefinition | null {
  if (!pageBlock) return null;
  const defs = getAvailableViews(pageBlock);
  const def = defs.find(d => d.id === viewId);
  return def || null;
}