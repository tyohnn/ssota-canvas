/**
 * Workspace Library Tab
 *
 * 내가 생성/추가한 이미지들
 *
 * Frontend Specification 참조: 04-frontend-specification.md
 */

'use client';

import { WorkspaceLibraryProvider } from './core/provider';
import { useWorkspaceLibraryContext } from './core/context';
import { WorkspaceFilterBar } from './components/filter-bar';
import { WorkspaceLibraryImageGrid } from './components/image-grid';
import { ImageSettingsDialog } from './components/image-settings-dialog';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Workspace Library Tab Content
 */
function WorkspaceLibraryTabContent() {
  const { selectedImageForSettings, closeImageSettings, refreshImages } =
    useWorkspaceLibraryContext();

  return (
    <>
      <Box className="flex-1 min-h-0 flex flex-col">
        <WorkspaceFilterBar />
        <WorkspaceLibraryImageGrid />
      </Box>

      {/* Settings Dialog */}
      {selectedImageForSettings && (
        <ImageSettingsDialog
          image={selectedImageForSettings}
          open={!!selectedImageForSettings}
          onOpenChange={open => {
            if (!open) {
              closeImageSettings();
            }
          }}
          onSuccess={() => {
            refreshImages();
            closeImageSettings();
          }}
        />
      )}
    </>
  );
}

/**
 * Workspace Library Tab
 */
export function WorkspaceLibraryTab() {
  return (
    <WorkspaceLibraryProvider>
      <WorkspaceLibraryTabContent />
    </WorkspaceLibraryProvider>
  );
}
