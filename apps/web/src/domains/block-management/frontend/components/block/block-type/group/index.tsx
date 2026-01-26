'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';

import { cn } from '@workspace/ui/lib/utils';

import type { GroupBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  ColorToken,
  getGlowColor,
  getGroupColorValues,
} from '@/domains/block-management/shared/types/style-tokens.types';
import type { GroupBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Group Block Node Component
 *
 * 다른 노드들을 시각적으로 그룹화하는 컨테이너 블럭
 * React Flow의 Parent-Child 관계를 활용하여 자식 노드들을 포함
 */
export const GroupBlock = memo(function GroupBlock({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  if (!data) {
    console.error('GroupBlock: data is required');
    return null;
  }

  const nodeData = data as GroupBlockNodeData;
  const {
    size = { width: 500, height: 400 },
    properties = {},
    isCollisionTarget = false,
  } = nodeData;

  // 노드 크기 설정 (React Flow props 우선, 그 다음 data.size, 마지막 기본값)
  const width = nodeW || size.width;
  const height = nodeH || size.height;

  const groupBlockProperties = properties as GroupBlockProperties;

  // 스타일 속성 추출
  const title = groupBlockProperties.title || nodeData.title || 'Group';
  const color = groupBlockProperties.color || ColorToken.BLUE;

  // 색상 토큰에서 색상 값 가져오기
  const colors = getGroupColorValues(color);

  // Original View 렌더러
  const renderOriginalView = () => {
    // Collision 상태에 따른 시각적 피드백
    const getBoxShadow = () => {
      if (selected) {
        return `0 0 0 2px ${colors.border}, 0 0 8px ${getGlowColor(color)}`;
      }
      if (isCollisionTarget) {
        // Collision 시 강조된 glow + 내부 highlight
        return `0 0 0 3px ${colors.border}, 0 0 16px ${getGlowColor(color)}, inset 0 0 10px ${getGlowColor(color)}`;
      }
      return '0 1px 3px rgba(0, 0, 0, 0.1)';
    };

    return (
      <Box
        className={cn(
          'w-full h-full flex flex-col rounded-lg',
          'transition-all duration-200 ease-out',
          isCollisionTarget && 'scale-[1.01]' // Collision 시 약간 확대
        )}
        style={
          {
            '--glow-color': getGlowColor(color),
            backgroundColor: isCollisionTarget
              ? colors.bg.replace('0.3', '0.5') // Collision 시 더 진하게
              : colors.bg,
            borderWidth: isCollisionTarget ? '2px' : '2px',
            borderStyle: 'solid',
            borderColor: colors.border,
            boxShadow: getBoxShadow(),
          } as React.CSSProperties
        }
      >

        {/* Content Area - 자식 노드들이 여기에 렌더링됨 */}
        <Box className="flex-1 p-4 relative">
          {/* 빈 공간 표시 (자식 노드가 없을 때) */}
          <Box
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: 0.3,
              color: colors.text,
            }}
          >
            <span className="text-xs">Drag nodes here to group</span>
          </Box>
        </Box>
      </Box>
    );
  };

  // Card View 렌더러
  const renderCardView = () => {
    return <CardView data={nodeData} selected={selected} />;
  };

  return (
    <DataBlock
      data={nodeData}
      selected={selected}
      width={width}
      height={height}
      renderOriginalView={renderOriginalView}
      renderCardView={renderCardView}
    />
  );
});
