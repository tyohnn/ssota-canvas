'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { useReactFlow } from '@xyflow/react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { getToolbarComponent, isToolbarLoaded } from '../toolbar-prefetch';

interface BlockToolbarMapperProps {
  blockId: string;
  blockType: string;
  blockData: BlockNodeData;
  disabled?: boolean;
  width?: number;
  height?: number;
  zoom?: number;
  readonly?: boolean;
}

/**
 * Block Toolbar Items Registry
 * 런타임에 동적으로 import할 경로만 정의
 */
const BLOCK_TOOLBAR_MODULES: Record<string, boolean> = {
  text: true,
  markdown: true,
  shape: true,
  group: true,
  youtube: true,
  pdf: true,
  image: true,
  link: true,
  audio: true,
  python: false, // 툴바 없음
  basic: false, // 툴바 없음
};

/**
 * 블럭 타입별 툴바 아이템 매핑 컴포넌트 (Registry 기반)
 *
 * 성능 최적화:
 * - Prefetch: base-block에서 미리 로드하여 컴포넌트 레지스트리에 저장
 * - Lazy Loading 제거: 레지스트리에서 직접 가져와 즉시 렌더링
 * - No Suspense: 미리 로드된 컴포넌트는 즉시 렌더링 (no lag!)
 *
 * 확장성:
 * - 100개 블럭 × 평균 4개 toolbar items = 400개 컴포넌트
 * - Component Registry로 모두 처리 가능
 */
export function BlockToolbarMapper({
  blockId,
  blockType,
  blockData,
  disabled = false,
  width,
  height,
  zoom = 1,
  readonly = false,
}: BlockToolbarMapperProps) {
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const [, forceUpdate] = useState(0);

  // 속성 업데이트 핸들러 (단일 속성)
  const handlePropertyUpdate = useCallback(
    async <T,>(propertyPath: string, value: T) => {
      if (!blockData) {
        console.warn('Block data not available for property update');
        return;
      }
      await updateProperty<T>(blockId, propertyPath, value, blockData);
    },
    [blockId, blockData, updateProperty]
  );

  // 속성 업데이트 핸들러 (여러 속성)
  const onPropertiesUpdate = useCallback(
    async (properties: Record<string, any>) => {
      if (!blockData) {
        console.warn('Block data not available for properties update');
        return;
      }
      await updateProperties(blockId, properties, blockData);
    },
    [blockId, blockData, updateProperties]
  );

  // 컴포넌트가 로드될 때까지 polling (prefetch 완료 대기)
  useEffect(() => {
    if (!BLOCK_TOOLBAR_MODULES[blockType]) {
      return;
    }

    // 이미 로드됨
    if (isToolbarLoaded(blockType)) {
      return;
    }

    // 로드될 때까지 polling
    const interval = setInterval(() => {
      if (isToolbarLoaded(blockType)) {
        forceUpdate(prev => prev + 1);
        clearInterval(interval);
      }
    }, 50); // 50ms마다 체크

    return () => clearInterval(interval);
  }, [blockType]);

  // 툴바가 없는 블럭
  if (!BLOCK_TOOLBAR_MODULES[blockType]) {
    return null;
  }

  // 레지스트리에서 컴포넌트 가져오기
  const ToolbarItemsComponent = getToolbarComponent(blockType);

  // 아직 로드되지 않음 (fallback)
  if (!ToolbarItemsComponent) {
    return <Skeleton className="h-7 w-7 rounded-sm" />;
  }

  // 컴포넌트 즉시 렌더링 (no Suspense!)
  return (
    <ToolbarItemsComponent
      blockId={blockId}
      blockMountId={blockData.blockMountId}
      blockData={blockData}
      disabled={disabled}
      onPropertyUpdate={handlePropertyUpdate}
      onPropertiesUpdate={onPropertiesUpdate}
      width={width}
      height={height}
      zoom={zoom}
      readonly={readonly}
    />
  );
}
