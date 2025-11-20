import { createContext, useContext } from 'react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { ImageSpaceUIState } from './use-image-space.ui';
import type { ImageSpaceBusinessLogic } from './use-image-space.business';
import type { SelectImageParams } from './types';

/**
 * Image Space Context Value
 */
export interface ImageSpaceContextValue extends ImageSpaceUIState {
  blockId: string;
  blockData: BlockNodeData;
  onSelectImage: (params: SelectImageParams) => Promise<void>;
  businessLogic: ImageSpaceBusinessLogic;
}

/**
 * Image Space Context
 */
export const ImageSpaceContext = createContext<ImageSpaceContextValue | null>(
  null
);

/**
 * useImageSpaceContext Hook
 *
 * 서브 컴포넌트에서 Context에 접근할 때 사용
 * Provider 없이 사용 시 에러 발생
 */
export function useImageSpaceContext(): ImageSpaceContextValue {
  const context = useContext(ImageSpaceContext);
  if (!context) {
    throw new Error(
      'useImageSpaceContext must be used within ImageSpaceProvider'
    );
  }
  return context;
}
