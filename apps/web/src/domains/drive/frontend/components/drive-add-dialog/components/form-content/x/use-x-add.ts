'use client';

import { useCallback, useEffect, useState } from 'react';

import { contentTitleFromText } from '@workspace/ssota-blocks/x';
import type { GetXMetadataDTO } from '@/domains/x-app-space/shared/dtos/responses/post.responses';
import { fetchXMetadataPreviewAction } from '@/domains/x-app-space/actions/post/fetch-x-metadata-preview.action';
import { getXMetadataAction } from '@/domains/x-app-space/actions/post/get-x-metadata.action';
import { useDriveCreateBlock } from '@/domains/drive/frontend/hooks/use-drive-create-block';
import { useDriveSourceJobStatusContext } from '@/domains/drive/frontend/contexts/drive-source-job-status-context';
import { useUserPreferredLanguage } from '@/domains/source-management/frontend/hooks';
import { isSuccess } from '@/lib';
import { slugFromUuid } from '../../../core/utils';

function getPostIdFromUrl(url: string): string | null {
  const match = url.match(
    /(?:x\.com|twitter\.com)\/(?:\w+\/status\/|i\/status\/)(\d{10,25})/
  );
  return match?.[1] ?? null;
}

export function useXAdd(
  orgId: string,
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>,
  onClose: () => void
) {
  const createBlock = useDriveCreateBlock(orgId);
  const userPreferredLanguage = useUserPreferredLanguage();
  const { pushSummaryJob, showStatusWindow } =
    useDriveSourceJobStatusContext();
  const [metadata, setMetadata] = useState<GetXMetadataDTO | null>(null);
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
    async (urlString: string): Promise<GetXMetadataDTO | null> => {
      const postId = getPostIdFromUrl(urlString);
      if (!postId) return null;
      const result = await fetchXMetadataPreviewAction({
        workspaceId: effectiveWorkspaceId,
        postId,
      });
      if (!isSuccess(result)) return null;
      return result.data;
    },
    [effectiveWorkspaceId]
  );

  const handlePreviewFetched = useCallback(
    (data: GetXMetadataDTO) => {
      setMetadata(data);
      const post = data.post;
      const fromText = contentTitleFromText(post.text);
      setTitle(fromText || (post.authorName ?? post.authorUsername ?? 'X Post'));
    },
    []
  );

  const submit = useCallback(async () => {
    if (!metadata || !url?.trim() || !effectiveWorkspaceId) return;
    const postId = getPostIdFromUrl(url);
    if (!postId) return;

    setIsFetching(true);
    try {
      const post = metadata.post;
      const initialProperties = {
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

      const blockTitle =
        contentTitleFromText(post.text) ||
        (post.authorName ?? post.authorUsername ?? title ?? 'X Post');

      const result = await createBlock.mutateAsync({
        organizationId: orgId,
        workspaceId: effectiveWorkspaceId,
        blockType: 'x',
        title: blockTitle,
        initialProperties,
      });

      if (result?.blockId) {
        const slug = slugFromUuid(result.blockId);
        const getMetaResult = await getXMetadataAction({
          workspaceId: effectiveWorkspaceId,
          blockId: slug,
          postId,
        });
        if (isSuccess(getMetaResult)) {
          pushSummaryJob(result.blockId, effectiveWorkspaceId, {
            resourceTitle: blockTitle,
            language: userPreferredLanguage ?? 'en',
          });
          showStatusWindow();
        }
      }

      onClose();
    } catch (err) {
      console.error('[useXAdd] submit error:', err);
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
