/**
 * Drive runtime deps for source tabs (summary, timeline, markdown).
 * Builds deps from blockData; no Canvas/React Flow context.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { isFailure } from '@/lib';

import { updateBlockContentAction } from '@/domains/block-management/actions/block/update-block-content.action';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  UpdateBlockContentRequestSchema,
  type UpdateBlockContentRequestInput,
} from '@/domains/block-management/shared/dtos/requests';

import type {
  SourceSummaryRuntimeDeps,
  SourceTimelineTabRuntimeDeps,
  TimelineTranscriptRuntimeDeps,
  MarkdownTabRuntimeDeps,
  UpdateBlockContentInput,
} from '@/domains/source-management/frontend/adapters/contracts/runtime-deps';
import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';

const noop = () => {};

export function useSourceSummarySectionDriveDeps(
  blockData: DriveBlockData | undefined
): SourceSummaryRuntimeDeps {
  const workspaceId = blockData?.workspaceId ?? '';

  return useMemo(
    () => ({
      workspaceId,
      pageId: '',
      readonly: false,
      publishToken: undefined,
      onJobCompleted: noop,
      getInitialTabLanguage: () => undefined,
      getIsExtractingFromTabOptions: () => false,
      setAutoSummaryBlockId: noop,
    }),
    [workspaceId]
  );
}

export function useSourceTimelineTabDriveDeps(
  blockData: DriveBlockData | undefined
): SourceTimelineTabRuntimeDeps {
  const workspaceId = blockData?.workspaceId ?? '';

  return useMemo(
    () => ({
      workspaceId,
      readonly: false,
      publishToken: undefined,
    }),
    [workspaceId]
  );
}

export function useTimelineTranscriptDriveDeps(
  blockData: DriveBlockData | undefined
): TimelineTranscriptRuntimeDeps {
  const updateBlockContent = useCallback(
    async (input: UpdateBlockContentInput): Promise<boolean> => {
      const data = input.blockData as DriveBlockData | undefined;
      if (!data?.workspaceId) return false;
      /** API expects 8–10 hex slug; Drive uses blockId=UUID, blockSlug=slug */
      const blockSlug = data.blockSlug ?? (data as BlockNodeData).blockId;
      if (!blockSlug) return false;

      const rawRequest: UpdateBlockContentRequestInput = {
        workspaceId: data.workspaceId,
        blockId: blockSlug,
        content: input.content,
      };

      const parseResult = UpdateBlockContentRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) return false;

      const result = await updateBlockContentAction(parseResult.data);
      return !isFailure(result);
    },
    []
  );

  return useMemo(
    () => ({
      readonly: false,
      getBlockInteractions: () => undefined,
      updateBlockContent,
    }),
    [updateBlockContent]
  );
}

export function useMarkdownTabDriveDeps(
  blockData: DriveBlockData | undefined
): MarkdownTabRuntimeDeps {
  const workspaceId = blockData?.workspaceId ?? '';
  return useMemo(
    () => ({
      workspaceId,
      readonly: false,
      publishToken: undefined,
    }),
    [workspaceId]
  );
}
