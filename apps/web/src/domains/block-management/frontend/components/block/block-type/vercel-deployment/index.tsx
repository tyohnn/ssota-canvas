/**
 * Vercel Deployment Block Component
 *
 * Vercel 배포 정보를 카드 형태로 표시하는 블록
 */

'use client';

import React, { memo } from 'react';

import type { NodeProps } from '@xyflow/react';
import {
  AlertCircle,
  Check,
  Clock,
  ExternalLink,
  GitBranch,
  Rocket,
} from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';

import type { VercelDeploymentBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { VercelDeploymentBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { BaseBlock } from '../../base-block';

export const VercelDeploymentBlock = memo(function VercelDeploymentBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as VercelDeploymentBlockNodeData;
  const properties = nodeData.properties as VercelDeploymentBlockProperties;

  // Properties destructuring (사용자가 입력/설정하는 값)
  const {
    projectName = 'ssota-web',
    deploymentUrl = 'ssota-git-feat-canvas-abc123.vercel.app',
  } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 350;
  const height = typeof nodeH === 'number' ? nodeH : 200;

  // 자동 fetch 데이터 (컴포넌트 내부에서 관리)
  // TODO: Vercel API로 실제 fetch
  const status = 'ready'; // 'ready' | 'building' | 'error'
  const branch = 'feat/canvas-demo';
  const commitMessage = 'Add landing page showcase';
  const deployedAt = '5 minutes ago';
  const buildTime = '45s';

  const statusConfig = {
    ready: {
      icon: Check,
      text: 'Ready',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-600',
    },
    building: {
      icon: Clock,
      text: 'Building',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      iconColor: 'text-yellow-600',
    },
    error: {
      icon: AlertCircle,
      text: 'Error',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-600',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
      width={width}
      height={height}
    >
      <div
        className="flex flex-col h-full p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
        style={{ width, height }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-black dark:bg-white">
            <Rocket className="h-4 w-4 text-white dark:text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{projectName}</div>
            <a
              href={`https://${deploymentUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
              onClick={e => e.stopPropagation()}
            >
              <span className="truncate">{deploymentUrl}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
          <div
            className={cn(
              'px-2 py-1 rounded-md flex items-center gap-1.5',
              currentStatus.bgColor,
              currentStatus.textColor
            )}
          >
            <StatusIcon
              className={cn('h-3.5 w-3.5', currentStatus.iconColor)}
            />
            <span className="text-xs font-medium">{currentStatus.text}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-3" />

        {/* Commit info */}
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{branch}</span>
        </div>

        <div className="text-sm text-foreground truncate mb-3">
          {commitMessage}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{deployedAt}</span>
          </div>
          {status === 'ready' && (
            <div className="flex items-center gap-1">
              <span>Built in {buildTime}</span>
            </div>
          )}
        </div>
      </div>
    </BaseBlock>
  );
});
