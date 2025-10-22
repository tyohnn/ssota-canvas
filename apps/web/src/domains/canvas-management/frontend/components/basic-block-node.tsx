'use client';

import React, { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import type { BasicBlockNodeData } from '../acl/react-flow.acl';
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from '@workspace/ui/components/base-node';
import { cn } from '@workspace/ui/lib/utils';

// Canvas Management Components
import { BlockMountToolbar } from './block-mount-toolbar';

/**
 * Basic Block Node Component
 *
 * React Flow UI BaseNode 컴포넌트를 사용하여 구현된 shadcn basic 블럭 타입
 * 일관된 디자인과 구조를 제공하며 확장 가능한 노드 컴포넌트
 */
export const BasicBlockNode = memo(function BasicBlockNode({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  const nodeData = data as BasicBlockNodeData & {
    pageId?: string;
    orgId?: string;
    workspaceId?: string;
  };
  const {
    blockMountId,
    blockId,
    blockType,
    size = { width: 200, height: 120 },
    isOptimistic = false,
    pageId,
    orgId,
    workspaceId,
  } = nodeData;

  // 노드 크기 설정 (React Flow props 우선, 그 다음 data.size, 마지막 기본값)
  const width = nodeW || size.width;
  const height = nodeH || size.height;

  return (
    <>
      {/* 상단 툴바 - BlockMountToolbar 컴포넌트 (내부에 NodeToolbar 포함) */}
      {/* 드래그 중에는 툴바 숨김 */}
      {pageId && workspaceId && selected && !dragging && (
        <BlockMountToolbar
          pageId={pageId}
          orgId={orgId}
          workspaceId={workspaceId}
        />
      )}

      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-50 w-2.5 h-2.5"
      />

      {/* BaseNode with proper styling and structure */}
      <BaseNode
        className={cn('w-auto min-w-[200px] transition-all duration-200', {
          // Optimistic 상태 (생성 중)
          'border-blue-500 ring-2 ring-blue-200 shadow-md': isOptimistic,
          // 선택됨 (input focus 스타일: 파란색 ring-2 + shadow)
          '!border-blue-500 !ring-2 !ring-blue-500 !shadow-lg':
            selected && !isOptimistic,
          // 선택됨 + 호버 (ring 유지, shadow만 더 강하게)
          'hover:!shadow-xl hover:!ring-2 hover:!ring-blue-500':
            selected && !isOptimistic,
          // 선택 안됨 (기본 상태: BaseNode 기본 스타일 제거)
          'ring-0': !selected && !isOptimistic,
          // 선택 안됨 + 호버 (회색 ring + 크기 확대 + 살짝 회전)
          'hover:!border-gray-400 hover:!ring-2 hover:!ring-gray-200 hover:!shadow-lg hover:scale-[1.02] hover:rotate-[0.5deg]':
            !selected && !isOptimistic,
        })}
        style={{ width, minHeight: height }}
      >
        {/* Node Header */}
        <BaseNodeHeader className="border-b">
          <BaseNodeHeaderTitle className="text-sm">
            {blockType === 'basic' ? 'Basic Block' : blockType}
          </BaseNodeHeaderTitle>
          {isOptimistic && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              Creating...
            </div>
          )}
        </BaseNodeHeader>

        {/* Node Content */}
        <BaseNodeContent className="flex-1">
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {blockType === 'basic' ? '📝' : '⚡'}
              </div>
              <p className="text-sm text-muted-foreground">
                Basic block content
              </p>
              {blockMountId && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  ID: {blockMountId.slice(-8)}
                </p>
              )}
            </div>
          </div>
        </BaseNodeContent>
      </BaseNode>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-50 w-2.5 h-2.5"
      />
    </>
  );
});
