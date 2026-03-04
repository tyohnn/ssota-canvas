/**
 * Drive Editor Panel Hook
 *
 * Standalone editor panel contract assembly for Drive detail.
 * No React Flow / Canvas context - uses useStandaloneEditorPanelBusiness and
 * useUpdateBlockProperty({ workspaceId }).
 */

'use client';

import { useCallback } from 'react';

import {
  useEditorPanelContract,
  type PropertyUpdateDepsLike,
} from '@workspace/editor-panel';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useStandaloneEditorPanelBusiness } from '@/domains/block-management/frontend/hooks/use-editor-panel-business';
import { getBlockEditorSchema } from '@/domains/block-management/frontend/registries/block-editor-schema-registry';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { useDriveEditorPanelTabs } from './use-drive-editor-panel-tabs';

export interface UseDriveEditorPanelParams {
  blockData: DriveBlockData;
  orgId: string;
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function useDriveEditorPanel({
  blockData,
  orgId,
  onClose,
  isExpanded,
  onToggleExpand,
}: UseDriveEditorPanelParams) {
  const { tabsSectionNode } = useDriveEditorPanelTabs({
    blockId: blockData.blockId,
    blockData,
    orgId,
  });
  const { workspaceId } = blockData;
  const blockId = blockData.blockId;

  const businessLogic = useStandaloneEditorPanelBusiness(onClose, workspaceId);

  const propertyUpdateDeps = useUpdateBlockProperty({
    workspaceId,
  });

  const { upload } = useSupabaseStorage();
  const onImageUpload = useCallback(
    async (file: File) => {
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
      });
      return result.url;
    },
    [upload]
  );

  const handleTitleSave = useCallback(
    async (title: string) => {
      if (!title.trim()) return;
      try {
        await businessLogic.onTitleSave({
          resourceId: blockId,
          title,
          data: blockData,
        });
      } catch {
        // View keeps local state
      }
    },
    [blockId, blockData, businessLogic]
  );

  const contract = useEditorPanelContract({
    headerActions: {
      onClose: undefined,
      isExpanded,
      onToggleExpand,
    },
    titleInput: {
      initialTitle: (blockData.title as string) ?? '',
      onTitleSave: handleTitleSave,
      readOnly: false,
    },
    blockProperties: {
      entityId: blockId,
      entityData: blockData,
      propertyUpdateDeps:
        propertyUpdateDeps as PropertyUpdateDepsLike,
      deps: { getEditorSchema: getBlockEditorSchema },
      readonly: false,
      onImageUpload,
    },
    customProperties: {
      entityId: blockId,
      deps: {
        resolveEntityData: () => blockData,
        propertyUpdateDeps:
          propertyUpdateDeps as PropertyUpdateDepsLike,
      },
      readonly: false,
    },
    tabsSection: tabsSectionNode,
  });

  return { contract };
}
