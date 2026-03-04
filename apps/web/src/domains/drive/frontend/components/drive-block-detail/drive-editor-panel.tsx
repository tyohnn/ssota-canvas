/**
 * Drive Editor Panel
 *
 * Standalone editor panel for Drive detail. No animation, no border radius.
 * Renders inside ResizablePanel - frame is minimal (border-l, bg-background).
 */

'use client';

import { Box } from '@workspace/ui/components/ui/box';
import { EditorPanelView } from '@workspace/editor-panel';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { useDriveEditorPanel } from './use-drive-editor-panel';

export interface DriveEditorPanelProps {
  blockData: DriveBlockData;
  orgId: string;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function DriveEditorPanel({
  blockData,
  orgId,
  onClose,
  isExpanded,
  onToggleExpand,
}: DriveEditorPanelProps) {
  const { contract } = useDriveEditorPanel({
    blockData,
    orgId,
    onClose,
    isExpanded,
    onToggleExpand,
  });

  return (
    <Box
      className="h-full flex flex-col border-l bg-background overflow-hidden"
      role="complementary"
      aria-label="Block editor"
    >
      <EditorPanelView {...contract} />
    </Box>
  );
}
