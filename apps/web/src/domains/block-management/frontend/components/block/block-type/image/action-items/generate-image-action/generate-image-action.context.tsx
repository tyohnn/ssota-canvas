/**
 * Generate Image Action Context
 *
 * Context를 통한 상태 공유 (Compound Component Pattern)
 */

'use client';

import { createContext, useContext } from 'react';
import type { UseGenerateImageResult } from './use-generate-image';

/**
 * Context Value 타입
 */
export type GenerateImageActionContextValue = UseGenerateImageResult;

/**
 * Context 생성
 */
export const GenerateImageActionContext =
  createContext<GenerateImageActionContextValue | null>(null);

/**
 * Context Hook
 *
 * 서브 컴포넌트에서 Context에 접근
 *
 * @throws Context Provider 외부에서 사용 시 에러
 */
export function useGenerateImageActionContext(): GenerateImageActionContextValue {
  const context = useContext(GenerateImageActionContext);

  if (!context) {
    throw new Error(
      'useGenerateImageActionContext must be used within GenerateImageActionProvider'
    );
  }

  return context;
}
