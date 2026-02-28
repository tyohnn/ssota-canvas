'use client';

import { useMemo } from 'react';

import type { OpenGraphMetadata } from '@/domains/link-app-space/shared/types/open-graph-metadata';
import { DriveAddFormLayout } from '../drive-add-form-layout';
import { LinkFormContent } from './link-form-content';
import { useLinkAdd } from './use-link-add';

export interface LinkAddSectionProps {
  orgId: string;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  onClose: () => void;
}

function metadataToProperties(
  metadata: OpenGraphMetadata,
  url: string
): Record<string, unknown> {
  return {
    url,
    ogTitle: metadata.title,
    ogDescription: metadata.description,
    ogImage: metadata.imageUrl,
    siteName: metadata.siteName,
    domain: metadata.domain,
    faviconUrl: metadata.faviconUrl,
    author: metadata.author,
    publishedAt: metadata.publishedAt,
    pageType: metadata.type,
  };
}

export function LinkAddSection({
  orgId,
  workspaces,
  isLoadingWorkspaces,
  onClose,
}: LinkAddSectionProps) {
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
  } = useLinkAdd(orgId, workspaces, onClose);

  const properties = useMemo(
    () => (metadata && url ? metadataToProperties(metadata, url) : {}),
    [metadata, url]
  );

  return (
    <DriveAddFormLayout
      header={{ title: 'Link', description: 'Save a web link with preview.' }}
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
      <LinkFormContent
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
