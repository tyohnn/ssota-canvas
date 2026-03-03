/**
 * Block Content Tabs Section
 *
 * Generic tabs section with deps-driven API (no domain imports in package)
 */

'use client';

import type { BlockContentTabsSectionDeps } from '../types';

import { BlockContentTabsSectionView } from './components/block-content-tabs-section.view';

export interface BlockContentTabsSectionProps {
  blockId: string;
  blockData: unknown;
  deps: BlockContentTabsSectionDeps;
}

export function BlockContentTabsSection({
  blockId,
  blockData,
  deps,
}: BlockContentTabsSectionProps) {
  const blockType = (blockData as { blockType?: string })?.blockType;

  if (!blockType) {
    return null;
  }

  return (
    <BlockContentTabsSectionView
      blockId={blockId}
      blockData={blockData}
      blockType={blockType}
      deps={deps}
    />
  );
}
