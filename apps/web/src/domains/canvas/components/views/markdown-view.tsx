'use client';

import React from 'react';
import type { ViewDefinition } from '@/domains/canvas/policy/view-policy';

/**
 * Renders a simple markdown-like preview showing the view's name and its template.
 *
 * @param view - The view definition to display; uses `view.config?.template` if present, otherwise a default placeholder template.
 * @returns A JSX element containing the view name and the template text.
 */
export function MarkdownView({ view }: { view: ViewDefinition }) {
  const template = String(view.config?.template || '# {{name}}\n\n');

  // Minimal placeholder; real impl would render from selected page data
  return (
    <div className="h-full w-full overflow-auto p-4 prose dark:prose-invert">
      <pre className="text-xs opacity-70">{view.name}</pre>
      <pre className="mt-2 bg-muted/30 p-3 rounded border text-sm whitespace-pre-wrap">
        {template}
      </pre>
    </div>
  );
}