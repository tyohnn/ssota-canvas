'use client';

import { useCallback } from 'react';
import type { Block, BlockPosition } from '@/db/schema';
import { generateUUID } from '@/utils/uuid';
import { createBlock as createBlockAction } from '@/domains/canvas/actions/block.action';
import { updateBlock as updateBlockAction } from '@/domains/canvas/actions/block.action';
import { deleteBlock as deleteBlockAction } from '@/domains/canvas/actions/block.action';
import {
  listPageBlockPositions,
  type BlockWithPosition,
} from '@/domains/canvas/actions/block-position.action';
import { isFailure } from '@/lib/action-result';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import { PageBlockMetadata } from '@/domains/blocks/types/page.node';

export type CreateStatus = { ok: boolean; error?: string };
export type LoadPageDataStatus = {
  ok: boolean;
  error?: string;
  data?: { blocksWithPositions: BlockWithPosition[] };
};

/**
 * Provides page-level canvas command helpers for the given workspace.
 *
 * @param workspaceId - The workspace identifier whose pages these commands operate on.
 * @returns An object with stable command functions:
 *  - loadPageData: loads block positions for a page and returns load status.
 *  - createNewPage: creates a new page (optimistic, reconciles with server) and returns creation status.
 *  - updatePage: applies optimistic updates to a page and synchronizes changes with the server.
 *  - deletePage: removes a page optimistically and reconciles deletion with the server.
 */
export function useCanvasPageCommands(workspaceId: string) {
  const canvasData = useCanvasData();

  // Load page data when page is selected
  const loadPageData = useCallback(
    async (pageId: string): Promise<LoadPageDataStatus> => {
      try {
        const result = await listPageBlockPositions({ pageId });

        if (!result.success) {
          throw new Error(result.error || 'Failed to load page positions');
        }

        const { blocksWithPositions } = result.data || {
          blocksWithPositions: [],
        };

        return {
          ok: true,
          data: { blocksWithPositions },
        };
      } catch (error) {
        console.error('Failed to load page data:', error);
        return { ok: false, error: String(error) };
      }
    },
    []
  );

  // Create new page (optimistic → reconcile)
  const createNewPage = useCallback(async (): Promise<CreateStatus> => {
    const optimisticId = generateUUID();
    const now = new Date();

    // Store the first page before adding new page (for rollback)
    const firstPageBeforeAdd =
      canvasData.pageBlocks.length > 0 ? canvasData.pageBlocks[0] : null;

    const newPage: Block = {
      id: optimisticId,
      slug: `new-page-${Date.now()}`,
      title: '새 페이지',
      block_type: 'page',
      parent_block_id: null,
      workspace_id: workspaceId,
      object: 'page',
      icon_name: 'file',
      order: 1000,
      metadata: {
        formData: {},
        formSchema: {},
        nodeUi: {
          size: { width: 240, height: 100 },
        },
        pageData: {
          views: {
            default: 'canvas',
            definitions: [],
          },
          allowed_component_ids: [],
          allowed_edge_types: [],
        },
      },
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    // Optimistic update
    canvasData.addPageBlock(newPage);
    canvasData.selectPage(optimisticId);

    const res = await createBlockAction({
      slug: newPage.slug,
      title: newPage.title,
      workspaceId,
      parentBlockId: newPage.parent_block_id ?? undefined,
      object: newPage.object ?? 'page',
      blockType: newPage.block_type,
      metadata: newPage.metadata as PageBlockMetadata,
    });

    if (isFailure(res)) {
      // Rollback optimistic update
      canvasData.removePageBlock(optimisticId);
      // Restore original selection
      if (firstPageBeforeAdd) {
        canvasData.selectPage(firstPageBeforeAdd.id);
      } else {
        canvasData.selectPage(null);
      }
      return { ok: false, error: String(res.error) };
    }

    const dbBlock = res.data;
    // Rekey optimistic block
    canvasData.replacePageBlockId(optimisticId, dbBlock.id, {
      id: dbBlock.id,
      created_at: new Date(dbBlock.created_at),
      updated_at: new Date(dbBlock.updated_at),
      slug: dbBlock.slug,
      title: dbBlock.title,
      metadata: dbBlock.metadata as PageBlockMetadata,
      order: dbBlock.order,
      parent_block_id: dbBlock.parent_block_id,
    });
    canvasData.selectPage(dbBlock.id);
    return { ok: true };
  }, [workspaceId, canvasData]);

  // Update page (optimistic → reconcile)
  const updatePage = useCallback(
    async (pageId: string, updates: Partial<Block>): Promise<CreateStatus> => {
      // Get current page data for rollback using getPageBlockById
      const currentPage = canvasData.getPageBlockById(pageId);
      if (!currentPage) {
        return { ok: false, error: 'Page not found' };
      }

      // Optimistic update
      canvasData.updatePageBlock(pageId, {
        ...updates,
        updated_at: new Date(),
      });

      // Server synchronization
      try {
        const serverUpdates: any = {};
        if (updates.title !== undefined) serverUpdates.title = updates.title;
        if (updates.slug !== undefined) serverUpdates.slug = updates.slug;
        if (updates.metadata !== undefined)
          serverUpdates.metadata = updates.metadata;
        if (updates.object !== undefined) serverUpdates.object = updates.object;
        if (updates.parent_block_id !== undefined)
          serverUpdates.parentBlockId = updates.parent_block_id;
        if (updates.order !== undefined) serverUpdates.order = updates.order;

        const result = await updateBlockAction({
          id: pageId,
          ...serverUpdates,
        });

        if (isFailure(result)) {
          console.error('Failed to update page:', result.error);
          // Rollback optimistic update
          canvasData.updatePageBlock(pageId, currentPage);
          return { ok: false, error: String(result.error) };
        }
        return { ok: true };
      } catch (error) {
        console.error('Failed to update page in DB:', error);
        // Rollback optimistic update
        canvasData.updatePageBlock(pageId, currentPage);
        return { ok: false, error: String(error) };
      }
    },
    [canvasData]
  );

  // Delete page (optimistic → reconcile)
  const deletePage = useCallback(
    async (pageId: string): Promise<CreateStatus> => {
      // Get current page data for rollback using getPageBlockById
      const currentPage = canvasData.getPageBlockById(pageId);
      if (!currentPage) {
        return { ok: false, error: 'Page not found' };
      }

      // Find the page to select after deletion (before removing current page)
      const remainingPagesAfterDelete = canvasData.pageBlocks.filter(
        page => page.id !== pageId
      );
      const pageToSelectAfterDelete =
        remainingPagesAfterDelete.length > 0
          ? remainingPagesAfterDelete[0]
          : null;

      // Optimistic update - Remove page and select next page
      canvasData.removePageBlock(pageId);
      if (pageToSelectAfterDelete) {
        canvasData.selectPage(pageToSelectAfterDelete.id);
      } else {
        canvasData.selectPage(null);
      }

      // Server synchronization
      try {
        const result = await deleteBlockAction({ id: pageId });
        if (isFailure(result)) {
          console.error('Failed to delete page:', result.error);
          // Rollback - Add back page and restore original selection
          canvasData.addPageBlock(currentPage);
          canvasData.selectPage(pageId);
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error('Failed to delete page in DB:', error);
        // Rollback - Add back page and restore original selection
        canvasData.addPageBlock(currentPage);
        canvasData.selectPage(pageId);
        return { ok: false, error: String(error) };
      }
    },
    [canvasData]
  );

  return {
    loadPageData,
    createNewPage,
    updatePage,
    deletePage,
  } as const;
}