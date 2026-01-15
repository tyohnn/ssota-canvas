/**
 * Block Editor Tab Types
 *
 * 블록 에디터 패널의 동적 탭 시스템을 위한 타입 정의
 */

import type { React.ComponentType } from 'react';

/**
 * Block Editor Tab 정의
 *
 * 각 탭의 메타데이터와 컴포넌트를 정의
 */
export interface BlockEditorTab {
  /** 탭 ID (고유 식별자) */
  id: string;
  /** 탭 라벨 (표시될 텍스트) */
  label: string;
  /** 탭 컴포넌트 경로 (동적 import용, block-content-tabs-section/core/tabs-prefetch.ts에서 사용) */
  componentPath: string;
  /** 탭 컴포넌트 (레거시, deprecated - componentPath 사용 권장) */
  component?: React.ComponentType<any>;
  /** 기본 탭 여부 */
  isDefault?: boolean;
}

/**
 * Block Editor Tabs Config
 *
 * 블록 타입별 탭 설정
 */
export interface BlockEditorTabsConfig {
  /** 블록 타입 */
  blockType: string;
  /** 탭 목록 */
  tabs: BlockEditorTab[];
  /** 기본 탭 ID (없으면 첫 번째 탭) */
  defaultTabId?: string;
}
