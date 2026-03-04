/**
 * Editor Panel orchestration
 *
 * Block data, deps, title/handlers, contract building.
 * Uses useEditorPanelUI for UI state.
 */

'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { useNodes, useReactFlow } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';

import {
  useCanvasModeContext,
} from '@/domains/canvas-management/frontend/hooks';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';
import { useMyProfile } from '@/domains/user-management/frontend/hooks/use-my-profile';

import { useEditorPanelContract } from '@workspace/editor-panel';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { useEditorPanelBusiness } from '@/domains/block-management/frontend/hooks/use-editor-panel-business';

import { getBlockEditorSchema } from '@/domains/block-management/frontend/registries/block-editor-schema-registry';
import { useViewportAdjustment } from '@/domains/block-management/frontend/hooks/use-viewport-adjustment';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type {
  EditorPanelBusinessLogic,
  PropertyUpdateDepsLike,
} from '@workspace/editor-panel';

import { useEditorPanelTabs } from './use-editor-panel-tabs';
import { useEditorPanelUI } from './use-editor-panel.ui';

export interface UseEditorPanelParams {
  blockId: string;
  blockMountId: string;
  isOpen: boolean;
  onClose: () => void;
  businessLogic?: EditorPanelBusinessLogic;
}

export function useEditorPanel({
  blockId,
  blockMountId,
  isOpen,
  onClose,
  businessLogic: businessLogicProp,
}: UseEditorPanelParams) {
  const nodes = useNodes();
  const { getNode, updateNode } = useReactFlow();

  const blockNode = useMemo(
    () => nodes.find(n => n.id === blockMountId),
    [nodes, blockMountId]
  );
  const blockData = blockNode?.data as BlockNodeData | undefined;

  const ui = useEditorPanelUI(isOpen);
  const {
    isExpanded,
    setIsExpanded,
    shouldRender,
    isAnimating,
    setTabSwitchCallback,
    switchToTab,
  } = ui;

  useMyProfile(isOpen);

  const canvasMode = useCanvasModeContext();
  const { readonly: canvasReadonly } = useCanvasReadOnly();
  const { upload } = useSupabaseStorage();

  const businessLogic = businessLogicProp ?? useEditorPanelBusiness(onClose);

  useEffect(() => {
    if (
      isOpen &&
      canvasMode.mode.type === 'block-editing' &&
      canvasMode.mode.blockId === blockId &&
      canvasMode.mode.initialTab?.tab
    ) {
      const tab = canvasMode.mode.initialTab.tab;
      const t = setTimeout(() => switchToTab(tab), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen, canvasMode.mode, blockId, switchToTab]);

  const handleTitleSave = useCallback(
    async (title: string) => {
      if (!blockData || !title.trim()) return;
      try {
        await businessLogic.onTitleSave({
          resourceId: blockId,
          title,
          data: blockData,
        });
      } catch {
        // View keeps local state; next initialTitle from blockData will sync
      }
    },
    [blockId, blockData, businessLogic]
  );

  const propertyUpdateDeps = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) =>
        updateNode(nodeId, options),
    },
  });

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

  const { tabsSectionNode } = useEditorPanelTabs({
    blockId,
    blockData,
    setTabSwitchCallback,
    switchToTab,
    readonly: canvasReadonly,
  });

  useViewportAdjustment(blockMountId, isOpen);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        if (isExpanded) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          setIsExpanded(false);
        } else {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler, { capture: true });
    return () =>
      document.removeEventListener('keydown', handler, { capture: true });
  }, [isExpanded, setIsExpanded, onClose]);

  const contract = useEditorPanelContract({
    headerActions: {
      onClose,
      isExpanded,
      onToggleExpand: () => setIsExpanded(!isExpanded),
    },
    titleInput: {
      initialTitle: (blockData?.title as string) ?? '',
      onTitleSave: handleTitleSave,
      readOnly: canvasReadonly,
    },
    blockProperties: {
      entityId: blockId,
      entityData: blockData!,
      propertyUpdateDeps:
        propertyUpdateDeps as PropertyUpdateDepsLike,
      deps: { getEditorSchema: getBlockEditorSchema },
      readonly: canvasReadonly,
      onImageUpload,
    },
    customProperties: {
      entityId: blockId,
      deps: {
        resolveEntityData: () => blockData,
        propertyUpdateDeps:
          propertyUpdateDeps as PropertyUpdateDepsLike,
      },
      readonly: canvasReadonly,
    },
    tabsSection: tabsSectionNode,
  });

  const frameClassName = cn(
    'absolute z-50 bg-background backdrop-blur-md border-border shadow-2xl',
    isExpanded
      ? 'inset-0 border rounded-none'
      : 'bottom-0 right-0 w-full md:w-[50%] h-full md:h-[90%] border-l border-t rounded-tl-lg',
    isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
  );

  return {
    contract,
    frameClassName,
    shouldRender,
    blockData,
  };
}
