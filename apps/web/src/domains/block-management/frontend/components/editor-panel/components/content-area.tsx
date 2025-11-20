/**
 * Editor Panel Content Area
 */

'use client';

import { useEditorPanelContext } from '../core/context';
import { BlockPropertiesSection } from './block-properties-section';
import { CustomPropertiesSection } from './custom-properties-section';
import { BlockContentSection } from './markdown-content-section';
import { TitleInput } from './title-input';

export function ContentArea() {
  const { blockId, blockData } = useEditorPanelContext();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Title Section */}
      <TitleInput />

      {/* Block Properties (Schema-based) */}
      <BlockPropertiesSection blockId={blockId} blockData={blockData} />

      {/* Custom Properties Section */}
      <CustomPropertiesSection blockId={blockId} />

      {/* Block Content Section (모든 블록 타입) */}
      {blockData && (
        <BlockContentSection blockId={blockId} blockData={blockData as any} />
      )}
    </div>
  );
}
