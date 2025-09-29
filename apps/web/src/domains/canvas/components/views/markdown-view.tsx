'use client';

import React from 'react';
import type { ViewDefinition } from '@/domains/canvas/policy/view-policy';

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
