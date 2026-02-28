'use client';

import { useCallback, useEffect, useState } from 'react';

import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties/youtube.vo';
import type { GetYoutubeMetadataDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';
import { fetchYoutubeMetadataPreviewAction } from '@/domains/youtube-app-space/actions/video/fetch-youtube-metadata-preview.action';
import { isSuccess } from '@/lib';
import { useDriveCreateBlock } from '@/domains/drive/frontend/hooks/use-drive-create-block';
import { ensureSourceAndJobAction } from '@/domains/source-management/actions/source/ensure-source-and-job.action';
import { slugFromUuid } from '../../../core/utils';

export function useYoutubeAdd(
  orgId: string,
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>,
  onClose: () => void
) {
  const createBlock = useDriveCreateBlock(orgId);
  const [metadata, setMetadata] = useState<GetYoutubeMetadataDTO | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const effectiveWorkspaceId =
    workspaceId || workspaces[0]?.workspaceId || '';

  useEffect(() => {
    if (workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0]!.workspaceId);
    }
  }, [workspaces, workspaceId]);

  const fetchMetadataForPreview = useCallback(
    async (urlString: string): Promise<GetYoutubeMetadataDTO | null> => {
      const vo = YoutubeBlockPropertiesVO.fromJSON({ url: urlString });
      const slug = vo.getVideoId();
      if (!slug) return null;
      const result = await fetchYoutubeMetadataPreviewAction({
        workspaceId: effectiveWorkspaceId,
        slug,
      });
      if (!isSuccess(result)) return null;
      return result.data;
    },
    [effectiveWorkspaceId]
  );

  const handlePreviewFetched = useCallback(
    (data: GetYoutubeMetadataDTO) => {
      setMetadata(data);
    },
    []
  );

  const submit = useCallback(async () => {
    if (!metadata || !url?.trim() || !effectiveWorkspaceId) return;
    setIsFetching(true);
    try {
      const video = metadata.video;
      const initialProperties = {
        url,
        youtubeId: video.id,
        youtubeTitle: video.title,
        youtubeDescription: video.description,
        youtubeThumbnail:
          video.thumbnailUrl || video.thumbnailHighUrl || undefined,
        channelName: metadata.channelName,
        channelThumbnail: metadata.channelThumbnail,
        youtubeChannelId: metadata.youtubeChannelId,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        publishedAt: video.publishedAt,
      };
      const result = await createBlock.mutateAsync({
        organizationId: orgId,
        workspaceId: effectiveWorkspaceId,
        blockType: 'youtube',
        title: video.title || title || 'Untitled',
        initialProperties,
      });
      if (result?.blockId && url) {
        const slug = slugFromUuid(result.blockId);
        await ensureSourceAndJobAction({
          workspaceId: effectiveWorkspaceId,
          blockId: slug,
          url,
          sourceType: 'youtube',
        });
      }
      onClose();
    } catch (err) {
      console.error('[useYoutubeAdd] submit error:', err);
    } finally {
      setIsFetching(false);
    }
  }, [orgId, metadata, url, title, effectiveWorkspaceId, createBlock, onClose]);

  const isSubmitting = createBlock.isPending || isFetching;

  return {
    metadata,
    url,
    setUrl,
    title,
    setTitle,
    workspaceId,
    setWorkspaceId,
    fetchMetadataForPreview,
    handlePreviewFetched,
    submit,
    isSubmitting,
    effectiveWorkspaceId,
  };
}
