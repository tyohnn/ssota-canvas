'use client';

import { type ReactNode, createContext, useContext } from 'react';

export interface CanvasMetadata {
  pageId: string;
  orgId: string;
  workspaceId: string;
}

const CanvasMetadataContext = createContext<CanvasMetadata | null>(null);

interface CanvasMetadataProviderProps {
  children: ReactNode;
  value: CanvasMetadata;
}

export function CanvasMetadataProvider({
  children,
  value,
}: CanvasMetadataProviderProps) {
  return (
    <CanvasMetadataContext.Provider value={value}>
      {children}
    </CanvasMetadataContext.Provider>
  );
}

/**
 * Hook to access canvas metadata (pageId, orgId, workspaceId)
 *
 * Supports optional override for testing/Storybook:
 * - Production: Uses Context value automatically
 * - Test/Storybook: Pass override to avoid Provider setup
 *
 * @param override - Optional metadata override (for testing/Storybook)
 * @returns CanvasMetadata
 *
 * @example
 * ```tsx
 * // Production usage (Context)
 * const { pageId } = useCanvasMetadata();
 *
 * // Test usage (Override)
 * const { pageId } = useCanvasMetadata({
 *   pageId: 'test-page',
 *   orgId: 'test-org',
 *   workspaceId: 'test-workspace'
 * });
 * ```
 */
export function useCanvasMetadata(override?: CanvasMetadata): CanvasMetadata {
  const context = useContext(CanvasMetadataContext);

  // Props로 전달된 값이 있으면 우선 사용
  if (override) {
    return override;
  }

  // Context 값 사용
  if (!context) {
    throw new Error(
      'useCanvasMetadata must be used within CanvasMetadataProvider or provide override'
    );
  }

  return context;
}
