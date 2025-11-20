'use client';

import { UnsplashTabContext } from './core/unsplash-tab.context';
import { useUnsplashTab } from './core/use-unsplash-tab';
import { ImageGrid } from './components/image-grid';
import type { UnsplashTabProps } from './core/types';
import type { UnsplashTabBusinessLogic } from './core/types';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Unsplash Tab (Main Component)
 *
 * Provider + 서브 컴포넌트 조합
 *
 * 특징:
 * - Context 기반 상태 관리
 * - UI/Business 로직 분리
 * - Optional Business Logic Injection 지원
 */
export interface UnsplashTabComponentProps extends UnsplashTabProps {
  businessLogic?: UnsplashTabBusinessLogic;
}

export function UnsplashTab({
  className,
  businessLogic,
}: UnsplashTabComponentProps = {}) {
  const contextValue = useUnsplashTab(businessLogic);

  return (
    <UnsplashTabContext.Provider value={contextValue}>
      <Box className={`flex-1 min-h-0 overflow-y-auto ${className || ''}`}>
        <ImageGrid
          images={contextValue.images}
          onSelectImage={contextValue.onSelectImage}
        />
      </Box>
    </UnsplashTabContext.Provider>
  );
}

// Re-export types and utilities for external use
export type { UnsplashImage, UnsplashTabProps } from './types';
export { useUnsplashTabContext } from './core/unsplash-tab.context';
export {
  useUnsplashTabBusiness,
  useMockUnsplashTabBusiness,
} from './core/use-unsplash-tab.business';
export { useUnsplashTabUI } from './core/use-unsplash-tab.ui';
export { useUnsplashTab } from './core/use-unsplash-tab';
