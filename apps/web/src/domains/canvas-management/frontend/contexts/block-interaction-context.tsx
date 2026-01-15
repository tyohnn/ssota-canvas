'use client';

import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

/**
 * Block Interactions Type
 *
 * 블록 타입별 동적 인터랙션을 정의하는 타입
 * 각 블록 타입은 필요한 인터랙션만 구현하면 됩니다.
 * 완전히 동적이므로 새 블록 추가 시 이 타입 변경 불필요
 */
export type BlockInteractions = Record<
  string,
  (...args: any[]) => void | Promise<void>
>;

/**
 * Block Interaction Context Value
 */
export interface BlockInteractionContextValue {
  // blockId를 키로 하는 인터랙션 맵 (내부 상태)
  // 외부에서 직접 접근하지 않고 getBlockInteractions 사용
  // blockInteractions: Map<string, BlockInteractions>; // 내부 구현용

  // 인터랙션 등록/해제
  registerBlockInteractions: (
    blockId: string,
    interactions: BlockInteractions
  ) => void;
  unregisterBlockInteractions: (blockId: string) => void;

  // 인터랙션 가져오기
  getBlockInteractions: (blockId: string) => BlockInteractions | undefined;
}

const BlockInteractionContext =
  createContext<BlockInteractionContextValue | null>(null);

interface BlockInteractionProviderProps {
  children: ReactNode;
}

/**
 * Block Interaction Provider
 *
 * 블록 타입별 동적 인터랙션을 관리하는 Context Provider
 * - 블록이 선택되거나 편집 모드일 때 인터랙션을 등록
 * - 에디터 패널 등에서 블록을 조작할 수 있도록 함
 */
export function BlockInteractionProvider({
  children,
}: BlockInteractionProviderProps) {
  // Map을 state로 관리 (React의 반응성을 위해)
  const [blockInteractionsMap, setBlockInteractionsMap] = useState<
    Map<string, BlockInteractions>
  >(() => new Map());

  // 인터랙션 등록
  const registerBlockInteractions = useCallback(
    (blockId: string, interactions: BlockInteractions) => {
      setBlockInteractionsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(blockId, interactions);
        return newMap;
      });
    },
    []
  );

  // 인터랙션 해제
  const unregisterBlockInteractions = useCallback((blockId: string) => {
    setBlockInteractionsMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(blockId);
      return newMap;
    });
  }, []);

  // 인터랙션 가져오기
  const getBlockInteractions = useCallback(
    (blockId: string): BlockInteractions | undefined => {
      return blockInteractionsMap.get(blockId);
    },
    [blockInteractionsMap]
  );

  const value: BlockInteractionContextValue = useMemo(
    () => ({
      registerBlockInteractions,
      unregisterBlockInteractions,
      getBlockInteractions,
    }),
    [
      registerBlockInteractions,
      unregisterBlockInteractions,
      getBlockInteractions,
    ]
  );

  return (
    <BlockInteractionContext.Provider value={value}>
      {children}
    </BlockInteractionContext.Provider>
  );
}

/**
 * Hook to access Block Interaction Context
 *
 * @returns BlockInteractionContextValue
 * @throws Error if used outside BlockInteractionProvider
 */
export function useBlockInteraction(): BlockInteractionContextValue {
  const context = useContext(BlockInteractionContext);
  if (!context) {
    throw new Error(
      'useBlockInteraction must be used within BlockInteractionProvider'
    );
  }
  return context;
}

/**
 * Load Block Interactions Dynamically
 *
 * Convention-based dynamic import for block interactions
 * - Path: block-type/{blockType}/config/{blockType}-block-interactions.ts
 * - Export: {BlockType}BlockInteractions (e.g., YoutubeBlockInteractions)
 *
 * @param blockType - 블록 타입 (e.g., 'youtube', 'audio')
 * @returns Promise<BlockInteractions> - 로드된 인터랙션 함수들
 *
 * @example
 * ```typescript
 * const interactions = await loadBlockInteractions('youtube');
 * // interactions.seekTo(playerRef, seconds)
 * ```
 */
export async function loadBlockInteractions(
  blockType: string
): Promise<BlockInteractions> {
  try {
    // Convention-based dynamic import
    const module = await import(
      /* webpackChunkName: "block-interactions-[request]" */
      `@/domains/block-management/frontend/components/block/block-type/${blockType}/config/${blockType}-block-interactions`
    );

    // Capitalize first letter for component name
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const componentName = `${capitalize(blockType)}BlockInteractions`;

    const interactions = module[componentName];

    if (!interactions) {
      throw new Error(
        `Block interactions not found: ${componentName} in ${blockType}-block-interactions.ts`
      );
    }

    return interactions as BlockInteractions;
  } catch (error) {
    console.warn(`Failed to load block interactions for ${blockType}:`, error);
    // 인터랙션이 없는 블록은 빈 객체 반환
    return {};
  }
}
