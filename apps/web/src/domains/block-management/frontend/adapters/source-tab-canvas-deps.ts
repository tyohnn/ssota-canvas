/**
 * Canvas runtime deps for source tabs (summary, timeline, markdown).
 * Builds deps from Canvas context so source-management hooks stay context-free.
 */

'use client';

import { useCallback, useMemo } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';

import type {
  SourceSummaryRuntimeDeps,
  SourceTimelineTabRuntimeDeps,
  TimelineTranscriptRuntimeDeps,
  MarkdownTabRuntimeDeps,
} from '@/domains/source-management/frontend/adapters/contracts/runtime-deps';

export function useSourceSummarySectionCanvasDeps(): SourceSummaryRuntimeDeps {
  const { workspaceId, pageId } = useCanvasMetadata();
  const { readonly, publishToken } = useCanvasReadOnly();
  const canvasMode = useCanvasModeContext();
  const { setAutoSummaryBlockId } = useAIActionContext();

  const onJobCompleted = useCallback(() => {
    if (canvasMode.mode.type !== 'block-editing') return;
    canvasMode.updateBlockEditingTabOptions(
      { isExtracting: false },
      { blockId: canvasMode.mode.blockId, blockMountId: canvasMode.mode.blockMountId }
    );
  }, [canvasMode]);

  const getInitialTabLanguage = useCallback(
    (blockSlug: string) => {
      if (canvasMode.mode.type !== 'block-editing') return undefined;
      if (canvasMode.mode.blockId !== blockSlug) return undefined;
      const lang = canvasMode.mode.initialTab?.tabOptions?.language;
      return typeof lang === 'string' ? lang : undefined;
    },
    [canvasMode]
  );

  const getIsExtractingFromTabOptions = useCallback(
    (blockSlug: string) => {
      if (canvasMode.mode.type !== 'block-editing') return false;
      if (canvasMode.mode.blockId !== blockSlug) return false;
      if (canvasMode.mode.initialTab?.tab !== 'summary') return false;
      return canvasMode.mode.initialTab?.tabOptions?.isExtracting === true;
    },
    [canvasMode]
  );

  return useMemo(
    () => ({
      workspaceId,
      pageId,
      readonly,
      publishToken,
      onJobCompleted,
      getInitialTabLanguage,
      getIsExtractingFromTabOptions,
      setAutoSummaryBlockId,
    }),
    [
      workspaceId,
      pageId,
      readonly,
      publishToken,
      onJobCompleted,
      getInitialTabLanguage,
      getIsExtractingFromTabOptions,
      setAutoSummaryBlockId,
    ]
  );
}

export function useSourceTimelineTabCanvasDeps(): SourceTimelineTabRuntimeDeps {
  const { workspaceId } = useCanvasMetadata();
  const { readonly, publishToken } = useCanvasReadOnly();
  return useMemo(
    () => ({ workspaceId, readonly, publishToken }),
    [workspaceId, readonly, publishToken]
  );
}

export function useTimelineTranscriptCanvasDeps(): TimelineTranscriptRuntimeDeps {
  const { readonly } = useCanvasReadOnly();
  const { getBlockInteractions } = useBlockInteraction();
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: { getNode, updateNode },
  });
  return useMemo(
    () => ({
      readonly,
      getBlockInteractions,
      updateBlockContent,
    }),
    [readonly, getBlockInteractions, updateBlockContent]
  );
}

export function useMarkdownTabCanvasDeps(): MarkdownTabRuntimeDeps {
  const { workspaceId } = useCanvasMetadata();
  const { readonly, publishToken } = useCanvasReadOnly();
  return useMemo(
    () => ({ workspaceId, readonly, publishToken }),
    [workspaceId, readonly, publishToken]
  );
}
