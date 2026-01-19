'use client';

import React from 'react';
import { PublishPageClientView } from './components/publish-page-client-view';
import type { PublishPageClientProps } from './core/types';

/**
 * PublishPageClient Component
 *
 * Container Component - 로직 담당
 */
export function PublishPageClient({
  token,
  title,
  icon,
  pageId,
  initialNodes,
  initialEdges,
}: PublishPageClientProps) {
  return (
    <PublishPageClientView
      token={token}
      title={title}
      icon={icon}
      pageId={pageId}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
    />
  );
}
