import type { Block } from "@/db/schema";

export type ViewType = "canvas" | "table" | "kanban" | "markdown";

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

function isViewDefinition(value: any): value is ViewDefinition {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.type === "string"
  );
}

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
    .map((v) => ({ ...v }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const result: PageViewsMetadata = {
    default: typeof views?.default === "string" ? views.default : undefined,
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

export function resolveInitialViewId(
  pageBlock: Block | null | undefined
): string {
  const { default: def, definitions } = extractPageViewsMetadata(pageBlock);
  const defs = definitions ?? [];
  if (defs.length > 0) {
    if (def && defs.some((v) => v.id === def)) {
      return def;
    }
    return defs[0]?.id || "canvas";
  }
  // No definitions → default to canvas
  return "canvas";
}

export function findViewDefinition(
  pageBlock: Block | null | undefined,
  viewId: string
): ViewDefinition | null {
  if (!pageBlock) return null;
  const defs = getAvailableViews(pageBlock);
  const def = defs.find((d) => d.id === viewId);
  return def || null;
}
