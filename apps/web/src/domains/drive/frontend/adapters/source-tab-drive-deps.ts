/**
 * Drive runtime deps for source tabs (summary, timeline, markdown).
 * Builds deps from blockData; no Canvas/React Flow context.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const updateBlockContent = useCallback(
    async (input: UpdateBlockContentInput): Promise<boolean> => {
      const data = input.blockData as DriveBlockData | undefined;
      if (!data?.workspaceId) {
        throw new Error('Drive add-quote: missing workspaceId');
      }
      /** API expects 8–10 hex slug; Drive uses blockId=UUID, blockSlug=slug */
      const blockSlug = data.blockSlug ?? (data as BlockNodeData).blockId;
      if (!blockSlug) {
        throw new Error('Drive add-quote: missing blockSlug');
      }

      const rawRequest: UpdateBlockContentRequestInput = {
        workspaceId: data.workspaceId,
        blockId: blockSlug,
        content: input.content,
      };

      const parseResult = UpdateBlockContentRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const msg = parseResult.error.issues
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        throw new Error(`Drive add-quote validation: ${msg}`);
      }

      const result = await updateBlockContentAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error ?? 'Drive add-quote: update failed');
      }

      await queryClient.invalidateQueries({ queryKey: ['drive', 'block'] });
      return true;
    },
    [queryClient]
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
