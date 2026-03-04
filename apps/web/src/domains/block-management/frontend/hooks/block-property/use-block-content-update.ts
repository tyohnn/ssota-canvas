'use client';

import type { RefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';

import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';
import { isFailure, uuidToSlug } from '@/lib';

import { applyBlockContentStepsAction } from '../../../actions/block/apply-block-content-steps.action';
import { updateBlockContentAction } from '../../../actions/block/update-block-content.action';
import {
  type ApplyBlockContentStepsRequestInput,
  ApplyBlockContentStepsRequestSchema,
  type UpdateBlockContentRequestInput,
  UpdateBlockContentRequestSchema,
} from '../../../shared/dtos/requests';
import { BlockNodeData } from '../../../shared/types/block-data.types';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  updateNode: (nodeId: string, options: { data: BlockNodeData }) => void;
};

export type UseUpdateBlockContentParams = {
  reactFlow: ReactFlowDependencies;
  /** Step 적용 성공 시 newVersion으로 갱신 (ProseMirror step 기반 저장 시 사용) */
  contentVersionRef?: RefObject<number>;
  /** 테스트 시 mock 주입용. 미제공 시 useCanvasMetadata() 사용 */
  canvasMetadata?: CanvasMetadata;
};

export type UpdateBlockContentInput = {
  nodeId: string; // React Flow node id (blockMountId)
  content: unknown;
  blockData: BlockNodeData;
  contentRaw?: string; // Markdown text (optional, for AI context)
};

export type ApplyBlockContentStepsInput = {
  nodeId: string;
  steps: unknown[];
  baseVersion: number;
  blockData: BlockNodeData;
};

export type ApplyBlockContentStepsResult =
  | { ok: true; newVersion: number }
  | {
    ok: false;
    code?: string;
    serverVersion?: number;
    serverContent?: unknown;
  };

export type UseUpdateBlockContentResult = {
  updateBlockContent: (input: UpdateBlockContentInput) => Promise<boolean>;
  applyBlockContentSteps: (
    input: ApplyBlockContentStepsInput
  ) => Promise<ApplyBlockContentStepsResult>;
  isUpdating: boolean;
};

/**
 * 블록 콘텐츠 업데이트 도메인 훅 (TanStack Query Optimistic Update)
 *
 * - React Flow Store 즉시 업데이트 (onMutate)
 * - Server Action 백그라운드 동기화
 * - 실패 시 자동 롤백 (onError)
 * - 로딩 상태 자동 관리
 *
 * block.content JSONB 컬럼을 업데이트 (TipTap JSON, 기타 구조화된 콘텐츠)
 */
export function useUpdateBlockContent(
  params: UseUpdateBlockContentParams
): UseUpdateBlockContentResult {
  const { reactFlow, contentVersionRef, canvasMetadata: canvasMetadataOverride } = params;
  const { updateNode, getNode } = reactFlow;
  const canvasMetadata = canvasMetadataOverride ?? useCanvasMetadata();
  const { workspaceId } = canvasMetadata;

  const normalizeBlockId = (blockId: string): string =>
    blockId.length > 10 || blockId.includes('-')
      ? uuidToSlug(blockId)
      : blockId;

  const fullDocMutation = useMutation({
    mutationFn: async ({
      nodeId: _nodeId,
      content,
      blockData,
      contentRaw,
    }: UpdateBlockContentInput) => {
      if (!workspaceId) throw new Error('Workspace context required');
      const rawRequest: UpdateBlockContentRequestInput = {
        workspaceId,
        blockId: normalizeBlockId(blockData.blockId),
        content,
        contentRaw,
      };

      const parseResult = UpdateBlockContentRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid content update data');
      }
      const result = await updateBlockContentAction(parseResult.data);
      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Optimistic Update
    onMutate: async ({ nodeId, content, blockData }) => {
      const latestNode = getNode(nodeId);
      const currentData = (latestNode?.data as BlockNodeData) || blockData;

      const updatedData = { ...currentData, content };
      updateNode(nodeId, { data: updatedData });

      // 롤백을 위한 컨텍스트 반환
      return { previousData: currentData, nodeId };
    },

    // 자동 롤백
    onError: (error, variables, context) => {
      if (context?.previousData && context?.nodeId) {
        updateNode(context.nodeId, { data: context.previousData });
      }
    },
  });

  const stepsMutation = useMutation({
    mutationFn: async ({
      nodeId: _nodeId,
      steps,
      baseVersion,
      blockData,
    }: ApplyBlockContentStepsInput) => {
      if (!workspaceId) throw new Error('Workspace context required');
      const rawRequest: ApplyBlockContentStepsRequestInput = {
        workspaceId,
        blockId: normalizeBlockId(blockData.blockId),
        steps,
        baseVersion,
      };
      const parseResult =
        ApplyBlockContentStepsRequestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        throw new Error(firstError?.message || 'Invalid steps request');
      }
      const result = await applyBlockContentStepsAction(parseResult.data);
      if (isFailure(result)) {
        throw {
          code: result.code,
          serverVersion: result.meta?.serverVersion,
          serverContent: result.meta?.serverContent,
        };
      }
      return result.data;
    },
    onSuccess: data => {
      if (contentVersionRef?.current !== undefined) {
        contentVersionRef.current = data.newVersion;
      }
    },
  });

  return {
    updateBlockContent: async (
      input: UpdateBlockContentInput
    ): Promise<boolean> => {
      try {
        await fullDocMutation.mutateAsync(input);
        return true;
      } catch (error) {
        return false;
      }
    },
    applyBlockContentSteps: async (
      input: ApplyBlockContentStepsInput
    ): Promise<ApplyBlockContentStepsResult> => {
      try {
        const data = await stepsMutation.mutateAsync(input);
        return { ok: true, newVersion: data.newVersion };
      } catch (error: unknown) {
        const obj =
          error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
        return {
          ok: false,
          code: typeof obj.code === 'string' ? obj.code : undefined,
          serverVersion:
            typeof obj.serverVersion === 'number' ? obj.serverVersion : undefined,
          serverContent: obj.serverContent,
        };
      }
    },
    isUpdating: fullDocMutation.isPending || stepsMutation.isPending,
  };
}
