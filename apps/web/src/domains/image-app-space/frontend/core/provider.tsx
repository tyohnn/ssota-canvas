'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ImageSpaceContext } from './image-space.context';
import { useImageSpace } from './use-image-space';
import type { ImageSpaceBusinessLogic } from './use-image-space.business';

/**
 * Image Space Provider Props
 */
export interface ImageSpaceProviderProps {
  blockId: string;
  blockData: BlockNodeData;
  businessLogic?: ImageSpaceBusinessLogic; // Optional injection
  children: React.ReactNode;
}

/**
 * Image Space Provider
 *
 * Context를 통해 모든 서브 컴포넌트에 상태와 로직을 제공
 */
export function ImageSpaceProvider({
  blockId,
  blockData,
  businessLogic,
  children,
}: ImageSpaceProviderProps) {
  const imageSpace = useImageSpace(blockId, blockData, businessLogic);

  return (
    <ImageSpaceContext.Provider value={imageSpace}>
      {children}
    </ImageSpaceContext.Provider>
  );
}
