/**
 * Block Toolbar Prefetch Utility
 *
 * 블록 타입별 toolbar 컴포넌트를 미리 로드하여 lagging 방지
 *
 * 전략:
 * - Hover Prefetch: 블록 hover 시 prefetch
 * - Component Registry: 미리 로드한 컴포넌트를 캐싱하여 즉시 사용
 */

import React from 'react';
import { type BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * Toolbar가 있는 블록 타입만 정의
 */
const BLOCK_TOOLBAR_MODULES: Record<string, boolean> = {
  text: true,
  markdown: true,
  shape: true,
  youtube: true,
  pdf: true,
  image: true,
  link: true,
  audio: true,
  python: false, // 툴바 없음
  basic: false, // 툴바 없음
};

/**
 * Prefetch 상태 관리
 * - 'idle': 아직 prefetch 시작 안함
 * - 'loading': prefetch 진행 중
 * - 'loaded': prefetch 완료 (컴포넌트 캐싱됨)
 * - 'error': prefetch 실패
 */
type PrefetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

const prefetchCache = new Map<BlockType, PrefetchStatus>();
const prefetchPromises = new Map<BlockType, Promise<any>>();

/**
 * 실제 컴포넌트 캐시
 * - key: blockType
 * - value: React 컴포넌트
 */
const componentRegistry = new Map<BlockType, React.ComponentType<any>>();

/**
 * 블록 타입의 컴포넌트 이름 생성
 */
function getComponentName(blockType: string): string {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(blockType)}ToolbarItems`;
}

/**
 * 블록 타입의 toolbar를 prefetch하고 컴포넌트를 레지스트리에 저장
 *
 * @param blockType - 블록 타입
 * @returns Promise<void>
 */
export async function prefetchToolbar(blockType: string): Promise<void> {
  // 툴바가 없는 블록은 스킵
  if (!BLOCK_TOOLBAR_MODULES[blockType]) {
    return;
  }

  // 이미 로드되었거나 진행 중이면 스킵
  const status = prefetchCache.get(blockType as BlockType);
  if (status === 'loaded' || status === 'loading') {
    // 진행 중인 경우 Promise를 반환하여 완료를 기다릴 수 있음
    if (status === 'loading') {
      return prefetchPromises.get(blockType as BlockType);
    }
    return;
  }

  // Prefetch 시작
  prefetchCache.set(blockType as BlockType, 'loading');

  const promise = import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "toolbar-items-[request]" */
    `../block-type/${blockType}/toolbar-items`
  )
    .then(module => {
      // 컴포넌트를 레지스트리에 저장
      const componentName = getComponentName(blockType);
      const Component = module[componentName];

      if (Component) {
        componentRegistry.set(blockType as BlockType, Component);
        prefetchCache.set(blockType as BlockType, 'loaded');
      } else {
        console.error(
          `Component ${componentName} not found in ${blockType}/toolbar-items`
        );
        prefetchCache.set(blockType as BlockType, 'error');
      }

      prefetchPromises.delete(blockType as BlockType);
    })
    .catch(err => {
      console.warn(`Failed to prefetch toolbar for ${blockType}:`, err);
      prefetchCache.set(blockType as BlockType, 'error');
      prefetchPromises.delete(blockType as BlockType);
    });

  prefetchPromises.set(blockType as BlockType, promise);
  return promise;
}

/**
 * 여러 블록 타입의 toolbar를 동시에 prefetch
 *
 * @param blockTypes - 블록 타입 배열
 * @returns Promise<void>
 */
export async function prefetchToolbars(blockTypes: string[]): Promise<void> {
  const promises = blockTypes.map(type => prefetchToolbar(type));
  await Promise.allSettled(promises);
}

/**
 * 블록 타입의 prefetch 상태 확인
 *
 * @param blockType - 블록 타입
 * @returns PrefetchStatus
 */
export function getPrefetchStatus(blockType: string): PrefetchStatus {
  return prefetchCache.get(blockType as BlockType) || 'idle';
}

/**
 * 블록 타입이 이미 로드되었는지 확인
 *
 * @param blockType - 블록 타입
 * @returns boolean
 */
export function isToolbarLoaded(blockType: string): boolean {
  return getPrefetchStatus(blockType) === 'loaded';
}

/**
 * 레지스트리에서 컴포넌트 가져오기
 *
 * @param blockType - 블록 타입
 * @returns React 컴포넌트 또는 null
 */
export function getToolbarComponent(
  blockType: string
): React.ComponentType<any> | null {
  return componentRegistry.get(blockType as BlockType) || null;
}

/**
 * Prefetch 캐시 초기화 (테스트용)
 */
export function clearPrefetchCache(): void {
  prefetchCache.clear();
  prefetchPromises.clear();
  componentRegistry.clear();
}
