/**
 * GitHub Branch Block Component
 *
 * GitHub 브랜치 정보를 카드 형태로 표시하는 블록
 */

'use client';

import React, { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { GithubBranchBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block';
import { cn } from '@workspace/ui/lib/utils';
import { GitBranch, GitCommit, Clock } from 'lucide-react';
import { GithubBranchBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

export const GitHubBranchBlock = memo(function GitHubBranchBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as GithubBranchBlockNodeData;
  const properties = nodeData.properties as GithubBranchBlockProperties;

  // Properties destructuring (사용자가 입력/설정하는 값)
  const { repository = 'ssota/ssota', branchName = 'feature/canvas-demo' } =
    properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 320;
  const height = typeof nodeH === 'number' ? nodeH : 180;

  // 자동 fetch 데이터 (컴포넌트 내부에서 관리)
  // TODO: GitHub API로 실제 fetch
  const lastCommit = 'Add landing page showcase';
  const commitCount = 12;
  const status = 'active';
  const updatedAt = '2 hours ago';

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <div
        className="flex flex-col h-full p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
        style={{ width, height }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-primary/10">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate">
              {repository}
            </div>
            <div className="text-sm font-semibold truncate">{branchName}</div>
          </div>
          <div
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              status === 'active'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-gray-500/10 text-gray-600'
            )}
          >
            {status}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-3" />

        {/* Last commit */}
        <div className="flex items-start gap-2 mb-2">
          <GitCommit className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground truncate">{lastCommit}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{updatedAt}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitCommit className="h-3 w-3" />
            <span>{commitCount} commits</span>
          </div>
        </div>
      </div>
    </BaseBlock>
  );
});
