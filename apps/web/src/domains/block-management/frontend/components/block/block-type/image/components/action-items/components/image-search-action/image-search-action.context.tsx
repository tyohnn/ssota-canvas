/**
 * Image Search Action Context
 *
 * Context를 통한 상태 공유 (Compound Component Pattern)
 */

'use client';

import { createContext, useContext } from 'react';
import type { UseImageSearchResult } from './use-image-search';

/**
 * Context Value 타입
 */
export type ImageSearchActionContextValue = UseImageSearchResult;

/**
 * Context 생성
 */
export const ImageSearchActionContext =
  createContext<ImageSearchActionContextValue | null>(null);

/**
 * Context Hook
 *
 * 서브 컴포넌트에서 Context에 접근
 *
 * @throws Context Provider 외부에서 사용 시 에러
 */
export function useImageSearchActionContext(): ImageSearchActionContextValue {
  const context = useContext(ImageSearchActionContext);

  if (!context) {
    throw new Error(
      'useImageSearchActionContext must be used within ImageSearchActionProvider'
    );
  }

  return context;
}
