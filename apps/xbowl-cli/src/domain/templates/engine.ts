export interface RenderContext {
  [key: string]: any;
}

const IF_START = /\{\{#if\s+([\w.]+)\}\}/g;
const IF_END = /\{\{\/if\}\}/g;
const EACH_START = /\{\{#each\s+([\w.]+)\}\}/g;
const EACH_END = /\{\{\/each\}\}/g;
const VAR = /\{\{\s*([\w.]+)\s*\}\}/g;

function get(ctx: RenderContext, path: string): any {
  return path
    .split(".")
    .reduce((acc: any, k: string) => (acc ? acc[k] : undefined), ctx);
}

export function renderTemplate(input: string, ctx: RenderContext): string {
  // Handle each blocks
  let output = input;
  while (true) {
    const start = output.match(EACH_START);
    if (!start) break;
    output = output.replace(
      /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/,
      (_m, arrPath, inner) => {
        const arr = get(ctx, arrPath);
        if (!Array.isArray(arr) || arr.length === 0) return "";
        return arr
          .map((item) => renderTemplate(inner, { ...ctx, this: item }))
          .join("");
      }
    );
  }

  // Handle if blocks
  while (true) {
    const start = output.match(IF_START);
    if (!start) break;
    output = output.replace(
      /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/,
      (_m, condPath, inner) => {
        const val = get(ctx, condPath);
        if (!val) return "";
        return renderTemplate(inner, ctx);
      }
    );
  }

  // Handle variables
  output = output.replace(VAR, (_m, varPath) => {
    const val = get(ctx, varPath);
    return val === undefined || val === null ? "" : String(val);
  });

  return output;
}

export function listPlaceholders(input: string): string[] {
  const names: string[] = [];
  input.replace(VAR, (_m, varPath) => {
    names.push(String(varPath));
    return "";
  });
  input.replace(IF_START, (_m, varPath) => {
    names.push(String(varPath));
    return "";
  });
  input.replace(EACH_START, (_m, varPath) => {
    names.push(String(varPath));
    return "";
  });
  return Array.from(new Set(names));
}

export function findMissingPlaceholders(
  input: string,
  ctx: RenderContext,
  optional: string[] = []
): string[] {
  const names = listPlaceholders(input);
  const missing: string[] = [];
  for (const n of names) {
    if (optional.includes(n)) continue;
    const val = get(ctx, n);
    if (val === undefined || val === null || val === "") missing.push(n);
  }
  return missing;
}

export function renderTemplateStrict(
  input: string,
  ctx: RenderContext,
  optional: string[] = []
): string {
  const missing = findMissingPlaceholders(input, ctx, optional);
  if (missing.length > 0) {
    throw new Error(`Template variables missing: ${missing.join(", ")}`);
  }
  return renderTemplate(input, ctx);
}
