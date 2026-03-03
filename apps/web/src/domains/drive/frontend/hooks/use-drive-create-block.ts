'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDriveBlockAction } from '@/domains/drive/actions/create-drive-block.action';

export interface CreateDriveBlockParams {
  organizationId: string;
  workspaceId: string;
  blockType: 'link' | 'audio' | 'markdown' | 'pdf' | 'youtube' | 'image' | 'x';
  title: string;
  initialProperties?: Record<string, unknown>;
  initialContent?: unknown;
}

export function useDriveCreateBlock(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateDriveBlockParams) => {
      const result = await createDriveBlockAction({
        organizationId: params.organizationId,
        workspaceId: params.workspaceId,
        blockType: params.blockType,
        title: params.title,
        initialProperties: params.initialProperties,
        initialContent: params.initialContent,
      });
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to create block');
      }
      return result.data;
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['drive', 'blocks', orgId] });
    },
  });
}
