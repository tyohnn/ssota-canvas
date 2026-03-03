/**
 * Block Editor Tabs Registry
 *
 * 블록 타입별 에디터 탭 설정을 동적으로 로드하고 캐싱하는 Registry
 */
import type {
  BlockEditorTab,
  BlockEditorTabsConfig,
} from '@/domains/block-management/frontend/types/block-editor-tab.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';

import { prefetchTabComponents } from './tabs-prefetch';

export type { BlockEditorTabsConfig, BlockEditorTab };

export const BLOCKS_WITH_TABS: Record<string, boolean> = {
  youtube: true,
  link: true,
  pdf: true,
  audio: true,
};

const tabsCache = new Map<BlockType, BlockEditorTabsConfig>();
const loadingPromises = new Map<
  BlockType,
  Promise<BlockEditorTabsConfig | null>
>();

export function hasTabs(blockType: string): boolean {
  return BLOCKS_WITH_TABS[blockType] === true;
}

export async function loadTabsConfig(
  blockType: string
): Promise<BlockEditorTabsConfig | null> {
  if (!hasTabs(blockType)) {
    return null;
  }

  const cached = tabsCache.get(blockType as BlockType);
  if (cached) {
    return cached;
  }

  const loadingPromise = loadingPromises.get(blockType as BlockType);
  if (loadingPromise) {
    return loadingPromise;
  }

  const promise: Promise<BlockEditorTabsConfig | null> = import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "editor-tabs-[request]" */
    `@/domains/block-management/frontend/components/block/block-type/${blockType}/config/${blockType}-editor-tabs`
  )
    .then(async module => {
      const config = module.default as BlockEditorTabsConfig;
      tabsCache.set(blockType as BlockType, config);

      const componentPaths = config.tabs
        .map(tab => tab.componentPath)
        .filter((path): path is string => !!path);
      if (componentPaths.length > 0) {
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

export function prefetchTabs(blockType: string): void {
  if (!hasTabs(blockType)) {
    return;
  }
  if (
    tabsCache.has(blockType as BlockType) ||
    loadingPromises.has(blockType as BlockType)
  ) {
    return;
  }
  loadTabsConfig(blockType).catch(() => {});
}

export function getTabsConfig(blockType: string): BlockEditorTabsConfig | null {
  return tabsCache.get(blockType as BlockType) || null;
}

export function clearTabsCache(): void {
  tabsCache.clear();
  loadingPromises.clear();
}
