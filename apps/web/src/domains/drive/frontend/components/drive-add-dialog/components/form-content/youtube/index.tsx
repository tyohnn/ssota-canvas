'use client';

import { useMemo } from 'react';

import type { GetYoutubeMetadataDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';
import { DriveAddFormLayout } from '../drive-add-form-layout';
import { YoutubeFormContent } from './youtube-form-content';
import { useYoutubeAdd } from './use-youtube-add';

export interface YoutubeAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

function metadataToProperties(
  metadata: GetYoutubeMetadataDTO,
  url: string
): Record<string, unknown> {
  const v = metadata.video;
  return {
    url,
    youtubeId: v?.id,
    youtubeTitle: v?.title ?? '',
    youtubeDescription: v?.description,
    youtubeThumbnail: v?.thumbnailHighUrl ?? v?.thumbnailUrl,
    channelName: metadata.channelName,
    channelThumbnail: metadata.channelThumbnail,
    youtubeChannelId: metadata.youtubeChannelId,
    viewCount: v?.viewCount ?? 0,
    likeCount: v?.likeCount ?? 0,
    commentCount: v?.commentCount ?? 0,
    publishedAt: v?.publishedAt,
  };
}

export function YoutubeAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: YoutubeAddSectionProps) {
  const {
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
  } = useYoutubeAdd(orgId, workspaces, onClose);

  const properties = useMemo(
    () => (metadata && url ? metadataToProperties(metadata, url) : {}),
    [metadata, url]
  );

  return (
    <DriveAddFormLayout
      header={{
        title: 'YouTube',
        description: 'Add a YouTube video with metadata.',
      }}
      onCancel={onClose}
      onCreate={submit}
      isCreateDisabled={!metadata || isLoadingWorkspaces}
      isSubmitting={isSubmitting}
      title={title}
      onTitleChange={setTitle}
      workspaceId={workspaceId}
      onWorkspaceIdChange={setWorkspaceId}
      workspaces={workspaces}
      isLoadingWorkspaces={isLoadingWorkspaces}
    >
      <YoutubeFormContent
          urlForView={url}
          properties={properties}
          onUrlChange={setUrl}
          title={title}
          onTitleChange={setTitle}
          workspaceId={workspaceId}
          onWorkspaceIdChange={setWorkspaceId}
          workspaces={workspaces}
          isLoadingWorkspaces={isLoadingWorkspaces}
          onUrlSubmit={fetchMetadataForPreview}
          onMetadataFetched={handlePreviewFetched}
        />
    </DriveAddFormLayout>
  );
}
