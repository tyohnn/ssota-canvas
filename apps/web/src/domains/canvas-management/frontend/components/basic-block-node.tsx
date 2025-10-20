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

/**
 * Basic Block Node Component
 *
 * React Flow UI BaseNode 컴포넌트를 사용하여 구현된 shadcn basic 블럭 타입
 * 일관된 디자인과 구조를 제공하며 확장 가능한 노드 컴포넌트
 */
export const BasicBlockNode = memo(function BasicBlockNode({
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  const nodeData = data as BasicBlockNodeData;
  const {
    blockMountId,
    blockId,
    blockType,
    size = { width: 200, height: 120 },
    isOptimistic = false,
  } = nodeData;

  // 노드 크기 설정 (React Flow props 우선, 그 다음 data.size, 마지막 기본값)
  const width = nodeW || size.width;
  const height = nodeH || size.height;

  return (
    <>
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="opacity-50 w-2.5 h-2.5"
      />

      {/* BaseNode with proper styling and structure */}
      <BaseNode
        className={cn('w-auto min-w-[200px]', {
          'border-blue-500 ring-blue-200': isOptimistic,
          'ring-blue-500': selected && !isOptimistic,
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
