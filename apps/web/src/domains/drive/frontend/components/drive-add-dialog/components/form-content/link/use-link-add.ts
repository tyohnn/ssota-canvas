'use client';

import { useCallback, useEffect, useState } from 'react';

import type { OpenGraphMetadata } from '@/domains/link-app-space/shared/types/open-graph-metadata';
import { fetchLinkMetadataPreviewAction } from '@/domains/link-app-space/actions/metadata/fetch-link-metadata-preview.action';
import { ensureSourceAndJobAction } from '@/domains/source-management/actions/source/ensure-source-and-job.action';
import { useUserPreferredLanguage } from '@/domains/source-management/frontend/hooks';
import { isSuccess } from '@/lib';
import { useDriveCreateBlock } from '@/domains/drive/frontend/hooks/use-drive-create-block';
import { useDriveSourceJobStatusContext } from '@/domains/drive/frontend/contexts/drive-source-job-status-context';
import { slugFromUuid } from '../../../core/utils';

export function useLinkAdd(
  orgId: string,
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>,
  onClose: () => void
) {
  const createBlock = useDriveCreateBlock(orgId);
  const userPreferredLanguage = useUserPreferredLanguage();
  const { pushSummaryJob, showStatusWindow } =
    useDriveSourceJobStatusContext();
  const [metadata, setMetadata] = useState<OpenGraphMetadata | null>(null);
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
    async (urlString: string): Promise<OpenGraphMetadata | null> => {
      const result = await fetchLinkMetadataPreviewAction({
        workspaceId: effectiveWorkspaceId,
        url: urlString,
      });
      if (!isSuccess(result)) return null;
      return result.data;
    },
    [effectiveWorkspaceId]
  );

  const handlePreviewFetched = useCallback(
    (data: OpenGraphMetadata) => {
      setMetadata(data);
      setTitle(data.title || 'Untitled');
    },
    []
  );

  const submit = useCallback(async () => {
    if (!metadata || !url?.trim() || !effectiveWorkspaceId) return;
    setIsFetching(true);
    try {
      const initialProperties = {
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
      const result = await createBlock.mutateAsync({
        organizationId: orgId,
        workspaceId: effectiveWorkspaceId,
        blockType: 'link',
        title: metadata.title || title || url || 'Untitled',
        initialProperties,
      });
      if (result?.blockId && url) {
        const slug = slugFromUuid(result.blockId);
        const ensureResult = await ensureSourceAndJobAction({
          workspaceId: effectiveWorkspaceId,
          blockId: slug,
          url,
          sourceType: 'link',
        });
        if (isSuccess(ensureResult)) {
          pushSummaryJob(result.blockId, effectiveWorkspaceId, {
            resourceTitle: metadata.title || title || url,
            language: userPreferredLanguage ?? 'en',
          });
          showStatusWindow();
        }
      }
      onClose();
    } catch (err) {
      console.error('[useLinkAdd] submit error:', err);
    } finally {
      setIsFetching(false);
    }
  }, [
    orgId,
    metadata,
    url,
    title,
    effectiveWorkspaceId,
    createBlock,
    onClose,
    pushSummaryJob,
    showStatusWindow,
    userPreferredLanguage,
  ]);

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
  };
}
