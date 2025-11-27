/**
 * Base Block Provider
 *
 * BaseBlock의 Context Provider
 */

'use client';

import { BaseBlockContext } from './context';
import { useBaseBlock, type UseBaseBlockOptions } from './use-base-block';
import type { BaseBlockProps } from './types';

export interface BaseBlockProviderProps extends BaseBlockProps {
  children: React.ReactNode;
  businessLogic?: UseBaseBlockOptions['businessLogic'];
}

export function BaseBlockProvider({
  children,
  businessLogic,
  ...props
}: BaseBlockProviderProps) {
  const contextValue = useBaseBlock(props, { businessLogic });

  return (
    <BaseBlockContext.Provider value={contextValue}>
      {children}
    </BaseBlockContext.Provider>
  );
}
