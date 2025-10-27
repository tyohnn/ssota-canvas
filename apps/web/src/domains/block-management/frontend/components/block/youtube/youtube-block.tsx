'use client';

import React, { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { YoutubeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block/base-block';
import { useBlockFieldUpdate } from '../../../hooks/use-block-field-update';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { YoutubeIcon, AlertCircle } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/types/block-properties.types';

/**
 * YouTube Block Component
 *
 * BaseBlock을 사용하여 구현된 유튜브 블럭 타입
 * 공통 기능(NodeResizer, Handle, Toolbar)을 BaseBlock에서 제공받음
 */
export const YoutubeBlock = memo(function YoutubeBlock({
  id,
  data,
  selected,
  dragging,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  const nodeData = data as YoutubeBlockNodeData;
  const {
    blockMountId,
    blockId,
    blockType,
    size = { width: 400, height: 225 },
    pageId,
    orgId,
    workspaceId,
    properties = {},
  } = nodeData;

  // 노드 크기 설정
  const width = nodeW || size.width;
  const height = nodeH || size.height;
  const youtubeBlockProperties = properties as YoutubeBlockProperties;

  const { updateField } = useBlockFieldUpdate();
  const [url, setUrl] = useState(youtubeBlockProperties?.url || '');
  const [urlError, setUrlError] = useState('');

  // Determine state based on properties content
  const isSkeleton = !url.trim();

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);

    if (
      newUrl &&
      !newUrl.includes('youtube.com') &&
      !newUrl.includes('youtu.be')
    ) {
      setUrlError('Please enter a valid YouTube URL');
    } else {
      setUrlError('');
      await updateField(blockId, 'properties.url', newUrl);
    }
  };

  const renderSkeletonState = () => (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
      <YoutubeIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        Add YouTube URL
      </h3>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        Paste a YouTube URL to embed the video
      </p>

      <div className="w-full max-w-md space-y-2">
        <Input
          type="url"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className={cn('w-full', urlError && 'border-destructive')}
        />
        {urlError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {urlError}
          </div>
        )}
      </div>
    </div>
  );

  const renderCompletedState = () => {
    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
          <YoutubeIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No video URL provided</p>
        </div>
      );
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">Invalid YouTube URL</p>
        </div>
      );
    }

    // 간단한 YouTube URL에서 video ID 추출
    const videoId = url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.includes('youtube.com/watch?v=')
        ? url.split('v=')[1]?.split('&')[0]
        : null;
    if (!videoId) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">Could not extract video ID</p>
        </div>
      );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    return (
      <div className="space-y-4">
        {/* Video Title and Description */}
        {(youtubeBlockProperties.title ||
          youtubeBlockProperties.description) && (
          <div className="space-y-2">
            {youtubeBlockProperties.title && (
              <h3 className="text-lg font-semibold">
                {youtubeBlockProperties.title}
              </h3>
            )}
            {youtubeBlockProperties.description && (
              <p className="text-sm text-muted-foreground">
                {youtubeBlockProperties.description}
              </p>
            )}
          </div>
        )}

        {/* YouTube Embed */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            aria-label="YouTube video player"
          />
        </div>

        {/* Video URL Display */}
        <div className="text-xs text-muted-foreground">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary underline"
          >
            {url}
          </a>
        </div>
      </div>
    );
  };

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
    >
      {/* YouTube Block Content */}
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-2">
          <h3 className="text-sm font-medium text-gray-700">YouTube Block</h3>
        </div>

        {/* Content */}
        <div className="flex-1">
          {isSkeleton ? renderSkeletonState() : renderCompletedState()}
        </div>
      </div>
    </BaseBlock>
  );
});
