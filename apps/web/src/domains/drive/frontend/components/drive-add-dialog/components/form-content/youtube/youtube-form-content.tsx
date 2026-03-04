'use client';

import { useCallback, useId, useMemo } from 'react';

import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties/youtube.vo';
import type { GetYoutubeMetadataDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';
import { YoutubeView, useYoutubeBlock } from '@workspace/ssota-blocks/youtube';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@/components/ui/box';
export interface YoutubeFormContentProps {
  urlForView: string;
  /** properties from metadata (YoutubeView preview) - empty when no metadata yet */
  properties: Record<string, unknown>;
  onUrlChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onUrlSubmit: (urlString: string) => Promise<GetYoutubeMetadataDTO | null>;
  onMetadataFetched: (metadata: GetYoutubeMetadataDTO) => void;
}

export function YoutubeFormContent({
  urlForView,
  properties,
  onUrlChange,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
  onUrlSubmit,
  onMetadataFetched,
}: YoutubeFormContentProps) {
  const instanceId = useId();

  const handleUrlSubmit = useCallback(
    async (urlString: string) => {
      if (!workspaceId) {
        throw new Error('Please select a workspace');
      }
      onUrlChange(urlString);
      const metadata = await onUrlSubmit(urlString);
      if (metadata) {
        onMetadataFetched(metadata);
      }
    },
    [workspaceId, onUrlChange, onUrlSubmit, onMetadataFetched]
  );

  const getThumbnailUrl = useCallback(
    (props: Record<string, unknown>) => {
      const vo = YoutubeBlockPropertiesVO.fromJSON(
        props as unknown as YoutubeBlockProperties
      );
      return vo.getThumbnailUrl();
    },
    []
  );
  const getVideoId = useCallback(
    (props: Record<string, unknown>) => {
      const vo = YoutubeBlockPropertiesVO.fromJSON(
        props as unknown as YoutubeBlockProperties
      );
      return vo.getVideoId();
    },
    []
  );
  const getEmbedUrl = useCallback(
    (props: Record<string, unknown>) => {
      const vo = YoutubeBlockPropertiesVO.fromJSON(
        props as unknown as YoutubeBlockProperties
      );
      return vo.getEmbedUrl();
    },
    []
  );

  const deps = useMemo(
    () => ({
      onUrlSubmit: handleUrlSubmit,
      getThumbnailUrl,
      getVideoId,
      getEmbedUrl,
      onProvideCallbacks: undefined,
      onUnmount: undefined,
    }),
    [handleUrlSubmit, getThumbnailUrl, getVideoId, getEmbedUrl]
  );

  const hookResult = useYoutubeBlock(
    {
      url: urlForView,
      properties,
      showPlayer: true,
      isActive: true,
      instanceId,
    },
    deps
  );

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      hookResult.handleUrlChange(e);
      onUrlChange(value);
      onTitleChange(value || 'Untitled');
    },
    [hookResult, onUrlChange, onTitleChange]
  );

  return (
    <Box className="flex flex-col gap-4">
      <Box
        className={cn(
          'relative w-full aspect-410/288 min-h-0 rounded-lg border border-border overflow-hidden bg-background',
          // overflow-hidden + border-radius can leak layered content (absolute/iframe) at corners.
          // mask creates a reliable clipping boundary per https://stackoverflow.com/q/77748631
          '[-webkit-mask:linear-gradient(#000_0_0)] [mask:linear-gradient(#000_0_0)]'
        )}
      >
        <YoutubeView
          url={hookResult.url}
          isLoading={hookResult.isLoading}
          hasError={hookResult.hasError}
          draftUrl={hookResult.draftUrl}
          showPlayer={hookResult.showPlayer}
          isIframeLoading={hookResult.isIframeLoading}
          isActive={true}
          properties={properties}
          thumbnailUrl={hookResult.getThumbnailUrl()}
          videoId={hookResult.getVideoId(urlForView)}
          inputRef={hookResult.inputRef}
          onUrlChange={handleUrlChange}
          onUrlSubmit={hookResult.handleUrlSubmit}
          onUrlKeyDown={hookResult.handleUrlKeyDown}
          onPlayerReady={hookResult.handlePlayerReady}
          onImageLoad={hookResult.handleImageLoad}
          onImageError={hookResult.handleImageError}
        />
      </Box>
    </Box>
  );
}
