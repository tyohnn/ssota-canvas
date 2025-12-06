/**
 * Image Metadata Editor Context
 *
 * Process Model: Scenario 6 - 이미지 메타데이터 편집
 */

'use client';

import { createContext, useContext } from 'react';
import type {
  ImageAsset,
  ImageCategory,
} from '@/db/schemas/image-app-space-schema';

export interface MetadataEditorState {
  title: string;
  description: string;
  tags: string[];
  category?: ImageCategory;
  errors: Record<string, string>;
  isSaving: boolean;
}

export interface MetadataEditorActions {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string[]) => void;
  setCategory: (category?: ImageCategory) => void;
  validateForm: () => boolean;
  saveMetadata: () => Promise<void>;
}

export interface MetadataEditorContextValue
  extends MetadataEditorState,
    MetadataEditorActions {}

export const MetadataEditorContext =
  createContext<MetadataEditorContextValue | null>(null);

export function useMetadataEditorContext(): MetadataEditorContextValue {
  const context = useContext(MetadataEditorContext);
  if (!context) {
    throw new Error(
      'useMetadataEditorContext must be used within MetadataEditorProvider'
    );
  }
  return context;
}
