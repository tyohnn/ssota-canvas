/**
 * Block Editor Tabs Prefetch Utility
 *
 * 블록 타입별 탭 컴포넌트를 미리 로드하여 lagging 방지
 *
 * 전략:
 * - Config Prefetch: 탭 config 로드 시 탭 컴포넌트도 함께 prefetch
 * - Component Registry: 미리 로드한 컴포넌트를 캐싱하여 즉시 사용
 * - No Suspense: 미리 로드된 컴포넌트는 즉시 렌더링
 *
 * 패턴: action-prefetch.ts와 동일한 Registry 패턴
 */
import React from 'react';

/**
 * Prefetch 상태 관리
 * - 'idle': 아직 prefetch 시작 안함
 * - 'loading': prefetch 진행 중
 * - 'loaded': prefetch 완료 (컴포넌트 캐싱됨)
 * - 'error': prefetch 실패
 */
type PrefetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * 탭 컴포넌트 레지스트리
 * - key: componentPath (예: "youtube/components/section-tabs/script-section")
 * - value: React 컴포넌트
 */
const componentRegistry = new Map<
  string,
  React.ComponentType<{ blockId: string; blockData: any }>
>();

/**
 * Prefetch 상태 캐시
 * - key: componentPath
 * - value: PrefetchStatus
 */
const prefetchCache = new Map<string, PrefetchStatus>();

/**
 * Prefetch Promise 캐시
 * - key: componentPath
 * - value: Promise
 */
const prefetchPromises = new Map<string, Promise<void>>();

/**
 * 탭 컴포넌트를 prefetch하고 레지스트리에 저장
 *
 * @param componentPath - 컴포넌트 경로 (예: "youtube/components/section-tabs/script-section")
 * @returns Promise<void>
 */
export async function prefetchTabComponent(
  componentPath: string
): Promise<void> {
  // 이미 로드되었거나 진행 중이면 스킵
  const status = prefetchCache.get(componentPath);
  if (status === 'loaded' || status === 'loading') {
    // 진행 중인 경우 Promise를 반환하여 완료를 기다릴 수 있음
    if (status === 'loading') {
      return prefetchPromises.get(componentPath);
    }
    return;
  }

  // Prefetch 시작
  prefetchCache.set(componentPath, 'loading');

  // 블록 타입별 컴포넌트 경로를 절대 경로로 변환
  // 예: "youtube/components/section-tabs/script-section"
  //  -> "@/domains/block-management/frontend/components/block/block-type/youtube/components/section-tabs/script-section"
  const promise = import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "editor-tabs-[request]" */
    `@/domains/block-management/frontend/components/block/block-type/${componentPath}`
  )
    .then(module => {
      // 컴포넌트를 레지스트리에 저장
      const Component = module.default;

      if (Component) {
        componentRegistry.set(componentPath, Component);
        prefetchCache.set(componentPath, 'loaded');
      } else {
        console.error(
          `Component not found in ${componentPath} (expected default export)`
        );
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

/**
 * 여러 탭 컴포넌트를 동시에 prefetch
 *
 * @param componentPaths - 컴포넌트 경로 배열
 * @returns Promise<void>
 */
export async function prefetchTabComponents(
  componentPaths: string[]
): Promise<void> {
  const promises = componentPaths.map(path => prefetchTabComponent(path));
  await Promise.allSettled(promises);
}

/**
 * 탭 컴포넌트의 prefetch 상태 확인
 *
 * @param componentPath - 컴포넌트 경로
 * @returns PrefetchStatus
 */
export function getTabPrefetchStatus(componentPath: string): PrefetchStatus {
  return prefetchCache.get(componentPath) || 'idle';
}

/**
 * 탭 컴포넌트가 이미 로드되었는지 확인
 *
 * @param componentPath - 컴포넌트 경로
 * @returns boolean
 */
export function isTabComponentLoaded(componentPath: string): boolean {
  return getTabPrefetchStatus(componentPath) === 'loaded';
}

/**
 * 레지스트리에서 탭 컴포넌트 가져오기
 *
 * @param componentPath - 컴포넌트 경로
 * @returns React 컴포넌트 또는 null
 */
export function getTabComponent(
  componentPath: string
): React.ComponentType<{ blockId: string; blockData: any }> | null {
  return componentRegistry.get(componentPath) || null;
}

/**
 * Prefetch 캐시 초기화 (테스트용)
 */
export function clearTabPrefetchCache(): void {
  prefetchCache.clear();
  prefetchPromises.clear();
  componentRegistry.clear();
}
