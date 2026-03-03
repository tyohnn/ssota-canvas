/**
 * Block Editor Tabs Prefetch Utility
 *
 * 블록 타입별 탭 컴포넌트를 미리 로드하여 lagging 방지
 */
import React from 'react';

export interface TabComponentProps {
  blockId: string;
  blockData: unknown;
  blockMountId?: string;
  switchToTab?: (tabId: string) => void;
}

const componentRegistry = new Map<string, React.ComponentType<TabComponentProps>>();
const prefetchCache = new Map<string, 'idle' | 'loading' | 'loaded' | 'error'>();
const prefetchPromises = new Map<string, Promise<void>>();

export async function prefetchTabComponent(
  componentPath: string
): Promise<void> {
  const status = prefetchCache.get(componentPath);
  if (status === 'loaded' || status === 'loading') {
    if (status === 'loading') {
      return prefetchPromises.get(componentPath);
    }
    return;
  }

  prefetchCache.set(componentPath, 'loading');

  const promise = import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "editor-tabs-[request]" */
    `@/domains/block-management/frontend/components/block/block-type/${componentPath}`
  )
    .then(module => {
      const Component = module.default;
      if (Component) {
        componentRegistry.set(componentPath, Component);
        prefetchCache.set(componentPath, 'loaded');
      } else {
        prefetchCache.set(componentPath, 'error');
      }
      prefetchPromises.delete(componentPath);
    })
    .catch(err => {
      console.warn(`Failed to prefetch tab component ${componentPath}:`, err);
      prefetchCache.set(componentPath, 'error');
      prefetchPromises.delete(componentPath);
    });

  prefetchPromises.set(componentPath, promise);
  return promise;
}

export async function prefetchTabComponents(
  componentPaths: string[]
): Promise<void> {
  const promises = componentPaths.map(path => prefetchTabComponent(path));
  await Promise.allSettled(promises);
}

export function getTabPrefetchStatus(componentPath: string): string {
  return prefetchCache.get(componentPath) || 'idle';
}

export function isTabComponentLoaded(componentPath: string): boolean {
  return prefetchCache.get(componentPath) === 'loaded';
}

export function getTabComponent(
  componentPath: string
): React.ComponentType<TabComponentProps> | null {
  return componentRegistry.get(componentPath) || null;
}

export function clearTabPrefetchCache(): void {
  prefetchCache.clear();
  prefetchPromises.clear();
  componentRegistry.clear();
}
