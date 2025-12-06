/**
 * Workspace Library Context
 *
 * 내가 생성한 이미지들 관리
 */

'use client';

import { createContext, useContext } from 'react';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

/**
 * Workspace Library Context Value
 */
export interface WorkspaceLibraryContextValue {
  // State
  images: ImageAsset[];
  isLoading: boolean;
  filterType: 'all' | 'ai-generated' | 'unsplash' | 'user-upload';
  selectedImageForSettings: ImageAsset | null;

  // Actions
  setFilterType: (
    type: 'all' | 'ai-generated' | 'unsplash' | 'user-upload'
  ) => void;
  refreshImages: () => Promise<void>;
  onSelectImage: (image: ImageAsset) => void;
  deleteImage: (imageId: string) => Promise<void>;
  openImageSettings: (image: ImageAsset) => void;
  closeImageSettings: () => void;
}

/**
 * Workspace Library Context
 */
export const WorkspaceLibraryContext =
  createContext<WorkspaceLibraryContextValue | null>(null);

/**
 * Workspace Library Context Hook
 */
export function useWorkspaceLibraryContext(): WorkspaceLibraryContextValue {
  const context = useContext(WorkspaceLibraryContext);
  if (!context) {
    throw new Error(
      'useWorkspaceLibraryContext must be used within WorkspaceLibraryProvider'
    );
  }
  return context;
}
