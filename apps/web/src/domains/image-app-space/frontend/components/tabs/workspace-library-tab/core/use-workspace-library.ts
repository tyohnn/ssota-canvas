/**
 * Workspace Library Hook (통합)
 */

'use client';

import type { WorkspaceLibraryContextValue } from './context';
import { useWorkspaceLibraryUI } from './use-workspace-library.ui';
import { useWorkspaceLibraryBusiness } from './use-workspace-library.business';

/**
 * Workspace Library Hook
 */
export function useWorkspaceLibrary(): WorkspaceLibraryContextValue {
  const uiState = useWorkspaceLibraryUI();
  const business = useWorkspaceLibraryBusiness(uiState.filterType);

  return {
    // State
    images: business.images,
    isLoading: business.isLoading,
    filterType: uiState.filterType,
    selectedImageForSettings: uiState.selectedImageForSettings,

    // Actions
    setFilterType: uiState.setFilterType,
    refreshImages: business.refreshImages,
    onSelectImage: business.onSelectImage,
    deleteImage: business.deleteImage,
    openImageSettings: uiState.openImageSettings,
    closeImageSettings: uiState.closeImageSettings,
  };
}

