/**
 * Showcase Page Client Component
 *
 * Client Component wrapper for dynamic import to avoid SSR issues with ReactFlow (DOMMatrix)
 */

'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with ReactFlow (DOMMatrix)
const ShowcasePageContent = dynamic(
  () =>
    import('@/domains/landing/frontend/components/showcase-page').then(
      mod => mod.ShowcasePage
    ),
  { ssr: false }
);

export function ShowcasePageClient() {
  return <ShowcasePageContent />;
}
