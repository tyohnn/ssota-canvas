'use client';

import { useMemo } from 'react';

import type { GetXMetadataDTO } from '@/domains/x-app-space/shared/dtos/responses/post.responses';
import { DriveAddFormLayout } from '../drive-add-form-layout';
import { XFormContent } from './x-form-content';
import { useXAdd } from './use-x-add';

export interface XAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

function metadataToProperties(
  metadata: GetXMetadataDTO,
  url: string
): Record<string, unknown> {
  const post = metadata.post;
  return {
    url,
    xPostId: post.postId,
    xText: post.text,
    xAuthorUsername: post.authorUsername,
    xAuthorName: post.authorName,
    xAuthorProfileImageUrl: post.authorProfileImageUrl,
    xPostedAt: post.postedAt,
    xLikeCount: post.likeCount,
    xRetweetCount: post.retweetCount,
    xReplyCount: post.replyCount,
  };
}

export function XAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: XAddSectionProps) {
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
  } = useXAdd(orgId, workspaces, onClose);

  const properties = useMemo(
    () => (metadata && url ? metadataToProperties(metadata, url) : {}),
    [metadata, url]
  );

  return (
    <DriveAddFormLayout
      header={{
        title: 'X',
        description: 'Add an X (Twitter) post with metadata.',
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
      <XFormContent
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
