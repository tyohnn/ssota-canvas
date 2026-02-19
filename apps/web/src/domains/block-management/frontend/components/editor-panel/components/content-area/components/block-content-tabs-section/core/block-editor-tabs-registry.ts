/**
 * Block Editor Tabs Registry
 *
 * 블록 타입별 에디터 탭 설정을 동적으로 로드하고 캐싱하는 Registry
 *
 * 패턴: action-prefetch.ts와 동일한 Dynamic Import + Registry 패턴
 */
import type {
  BlockEditorTab,
  BlockEditorTabsConfig,
} from '@/domains/block-management/frontend/types/block-editor-tab.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import { prefetchTabComponents } from './tabs-prefetch';

// Re-export types for convenience
export type { BlockEditorTabsConfig, BlockEditorTab };

/**
 * 탭이 있는 블록 타입만 정의
 *
 * 이 정의는 초기 번들에 포함되지만, 실제 탭 config는 동적 로드됩니다.
 */
export const BLOCKS_WITH_TABS: Record<string, boolean> = {
  youtube: true,
  link: true,
};

/**
 * Prefetch 상태 관리
 */
type PrefetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

const tabsCache = new Map<BlockType, BlockEditorTabsConfig>();
const loadingPromises = new Map<
  BlockType,
  Promise<BlockEditorTabsConfig | null>
>();

/**
 * 블록 타입에 탭이 있는지 확인
 *
 * @param blockType - 블록 타입
 * @returns 탭이 있는지 여부
 */
export function hasTabs(blockType: string): boolean {
  return BLOCKS_WITH_TABS[blockType] === true;
}

/**
 * 블록 타입의 탭 설정을 동적으로 로드
 *
 * @param blockType - 블록 타입
 * @returns 탭 설정
 */
export async function loadTabsConfig(
  blockType: string
): Promise<BlockEditorTabsConfig | null> {
  // 탭이 없는 블록 타입은 null 반환
  if (!hasTabs(blockType)) {
    return null;
  }

  // 이미 캐시에 있으면 반환
  const cached = tabsCache.get(blockType as BlockType);
  if (cached) {
    return cached;
  }

  // 이미 로딩 중이면 Promise 반환
  const loadingPromise = loadingPromises.get(blockType as BlockType);
  if (loadingPromise) {
    return loadingPromise;
  }

  // 동적 import 시작
  // 각 블록 타입은 core/config/${blockType}-editor-tabs.ts 파일을 가져야 함
  // 모든 블록이 동일한 경로 구조를 사용 (core/config/)
  const promise: Promise<BlockEditorTabsConfig | null> = import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "editor-tabs-[request]" */
    `@/domains/block-management/frontend/components/block/block-type/${blockType}/config/${blockType}-editor-tabs`
  )
    .then(async module => {
      // 탭 설정을 캐시에 저장
      const config = module.default as BlockEditorTabsConfig;
      tabsCache.set(blockType as BlockType, config);

      // 탭 컴포넌트들도 prefetch (block-action-bar 패턴)
      const componentPaths = config.tabs
        .map(tab => tab.componentPath)
        .filter((path): path is string => !!path);
      if (componentPaths.length > 0) {
        // Prefetch는 백그라운드에서 실행 (결과 기다리지 않음)
        prefetchTabComponents(componentPaths).catch(err => {
          console.warn(
            `[loadTabsConfig] Failed to prefetch tab components for ${blockType}:`,
            err
          );
        });
      }

      loadingPromises.delete(blockType as BlockType);
      return config;
    })
    .catch(err => {
      console.warn(`Failed to load tabs config for ${blockType}:`, err);
      loadingPromises.delete(blockType as BlockType);
      return null;
    });

  loadingPromises.set(blockType as BlockType, promise);
  return promise;
}

/**
 * 블록 타입의 탭 설정을 prefetch
 *
 * @param blockType - 블록 타입
 */
export function prefetchTabs(blockType: string): void {
  if (!hasTabs(blockType)) {
    return;
  }

  // 이미 로드되었거나 로딩 중이면 스킵
  if (
    tabsCache.has(blockType as BlockType) ||
    loadingPromises.has(blockType as BlockType)
  ) {
    return;
  }

  // Prefetch 시작 (결과는 무시)
  loadTabsConfig(blockType).catch(() => {
    // Prefetch 실패는 무시 (나중에 다시 시도 가능)
  });
}

/**
 * 캐시에서 탭 설정 가져오기 (동기)
 *
 * @param blockType - 블록 타입
 * @returns 탭 설정 또는 null
 */
export function getTabsConfig(blockType: string): BlockEditorTabsConfig | null {
  return tabsCache.get(blockType as BlockType) || null;
}

/**
 * Prefetch 캐시 초기화 (테스트용)
 */
export function clearTabsCache(): void {
  tabsCache.clear();
  loadingPromises.clear();
}
