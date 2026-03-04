'use client';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { DriveBlockPreviewPanel } from './drive-block-preview-panel';
import { DriveEditorPanel } from './drive-editor-panel';

interface DriveBlockDetailContentProps {
  orgId: string;
  blockData: DriveBlockData;
  slot: 'left' | 'right';
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * Renders left preview or right editor panel based on slot.
 */
export function DriveBlockDetailContent({
  orgId,
  blockData,
  slot,
  onClose,
  isExpanded = false,
  onToggleExpand = () => {},
}: DriveBlockDetailContentProps) {
  if (slot === 'left') {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <DriveBlockPreviewPanel block={blockData} />
      </div>
    );
  }

  return (
    <DriveEditorPanel
      blockData={blockData}
      orgId={orgId}
      onClose={onClose}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    />
  );
}
