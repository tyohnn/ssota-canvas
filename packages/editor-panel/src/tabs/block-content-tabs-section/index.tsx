/**
 * Block Content Tabs Section
 *
 * Generic tabs section with deps-driven API (no domain imports in package)
 */

'use client';

import type { BlockContentTabsSectionDeps } from '../types';

import { BlockContentTabsSectionView } from './components/block-content-tabs-section.view';

export interface BlockContentTabsSectionProps {
  /** Block/resource identifier. */
  resourceId: string;
  /** Block payload (e.g. node data). Used for tab config and instanceId derivation. */
  data: unknown;
  deps: BlockContentTabsSectionDeps;
}

export function BlockContentTabsSection({
  resourceId,
  data,
  deps,
}: BlockContentTabsSectionProps) {
  const blockType = (data as { blockType?: string })?.blockType;

  if (!blockType) {
    return null;
  }

  return (
    <BlockContentTabsSectionView
      resourceId={resourceId}
      data={data}
      blockType={blockType}
      deps={deps}
    />
  );
}
