/**
 * Editor Panel Content Area
 */

'use client';

import { useEffect } from 'react';

import { Box } from '@/components/ui/box';

import { useEditorPanelContext } from '../../core/context';
import { BlockContentTabsSection } from './components/block-content-tabs-section';
import { prefetchTabs } from './components/block-content-tabs-section/core/block-editor-tabs-registry';
import { BlockPropertiesSection } from './components/block-properties-section';
import { CustomPropertiesSection } from './components/custom-properties-section';
import { TitleInput } from './components/title-input';

export function ContentArea() {
  const { blockId, blockData } = useEditorPanelContext();

  // Editor Panel이 열릴 때 탭 prefetch
  useEffect(() => {
    if (blockData?.blockType) {
      prefetchTabs(blockData.blockType);
    }
  }, [blockData?.blockType]);

  return (
    <Box className="flex-1 min-h-0 overflow-y-auto">
      {/* Title Section */}
      <TitleInput />

      {/* Block Properties (Schema-based) */}
      <BlockPropertiesSection blockId={blockId} blockData={blockData} />

      {/* Custom Properties Section */}
      <CustomPropertiesSection blockId={blockId} />

      {/* Block Content Tabs Section (탭이 있는 블록 타입) 또는 Block Content Section (탭이 없는 블록 타입) */}
      {blockData && (
        <BlockContentTabsSection blockId={blockId} blockData={blockData} />
      )}
    </Box>
  );
}
