/**
 * GitHub Commit Block Component
 *
 * GitHub 커밋 정보를 카드 형태로 표시하는 블록
 */

'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';
import { Calendar, Check, GitCommit, User, X } from 'lucide-react';

import type { GithubCommitBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { GithubCommitBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { BaseBlock } from '../../base-block';

export const GitHubCommitBlock = memo(function GitHubCommitBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as GithubCommitBlockNodeData;
  const properties = nodeData.properties as GithubCommitBlockProperties;

  // Properties destructuring (사용자가 입력/설정하는 값)
  const { repository = 'ssota/ssota', commitHash = 'a3f7c2d' } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 320;
  const height = typeof nodeH === 'number' ? nodeH : 160;

  // 자동 fetch 데이터 (컴포넌트 내부에서 관리)
  // TODO: GitHub API로 실제 fetch
  const commitMessage = 'feat: Add interactive canvas demo';
  const author = 'titanism';
  const timestamp = '3 hours ago';
  const ciStatus: 'success' | 'failure' | 'pending' = 'success';
  const filesChanged = 5;

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
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
        <div className="flex items-start gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
            <GitCommit className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs font-mono text-muted-foreground">
                {commitHash}
              </code>
              {ciStatus === 'success' ? (
                <div className="p-0.5 rounded-full bg-green-500/10">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
              ) : ciStatus === 'failure' ? (
                <div className="p-0.5 rounded-full bg-red-500/10">
                  <X className="h-3 w-3 text-red-600" />
                </div>
              ) : null}
            </div>
            <div className="text-sm font-medium text-foreground line-clamp-2">
              {commitMessage}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{timestamp}</span>
          </div>
          <div className="text-xs">{filesChanged} files</div>
        </div>
      </div>
    </BaseBlock>
  );
});
