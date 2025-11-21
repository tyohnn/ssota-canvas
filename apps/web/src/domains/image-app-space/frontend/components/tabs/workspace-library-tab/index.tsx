/**
 * Workspace Library Tab
 *
 * 내가 생성/추가한 이미지들
 *
 * Frontend Specification 참조: 04-frontend-specification.md
 */

'use client';

import { WorkspaceLibraryContext } from './core/workspace-library.context';
import { useWorkspaceLibrary } from './core/use-workspace-library';
import { WorkspaceFilterBar } from './components/filter-bar';
import { WorkspaceLibraryImageGrid } from './components/image-grid';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Workspace Library Tab
 */
export function WorkspaceLibraryTab() {
  const contextValue = useWorkspaceLibrary();

  return (
    <WorkspaceLibraryContext.Provider value={contextValue}>
      <Box className="flex-1 min-h-0 flex flex-col">
        <WorkspaceFilterBar />
        <div className="flex-1 overflow-y-auto">
          <WorkspaceLibraryImageGrid />
        </div>
      </Box>
    </WorkspaceLibraryContext.Provider>
  );
}
