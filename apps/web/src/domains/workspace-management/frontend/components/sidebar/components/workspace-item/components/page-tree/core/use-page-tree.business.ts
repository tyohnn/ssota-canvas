import { useCallback, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import {
  createPageAction,
  movePageAction,
  updatePageInfoAction,
  reorderPagesAction,
  deletePageAction,
  duplicatePageAction,
} from '@/domains/workspace-management/actions/page.actions';
import { generateTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';
import { generateKeyBetween } from 'fractional-indexing';
import {
  findLastOrderInTree,
  addPageToTree,
  replacePageIdInTree,
  findAndRemovePageFromTree,
  updatePageInfoInTree,
  updatePageOrderInTree,
  findPageInTreeHelper,
  findSiblingsInTree,
} from './tree-helpers';
import { flattenPageTree } from './utils';

export interface PageTreeBusinessLogic {
  createPage: (
    workspaceId: string,
    parentId?: string,
    title?: string,
    icon?: string,
    tempPageId?: string
  ) => Promise<string | null>;

  movePage: (
    pageId: string,
    newParentId?: string,
    insertIndex?: number,
    prevPageId?: string,
    nextPageId?: string
  ) => Promise<boolean>;

  updatePageInfo: (
    pageId: string,
    title?: string,
    icon?: string
  ) => Promise<boolean>;

  reorderPages: (
    workspaceId: string,
    parentId: string | undefined,
    orderedPageIds: string[]
  ) => Promise<boolean>;

  deletePage: (pageId: string) => Promise<boolean>;

  duplicatePage: (pageId: string) => Promise<string | null>;

  isCreating: boolean;
  isMoving: boolean;
  isUpdating: boolean;
  isReordering: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
}

/**
 * Business Logic Hook with integrated TanStack Query Mutations
 *
 * 비즈니스 로직과 mutations를 통합하여 관리
 * - 모든 Page CRUD 작업
 * - Optimistic Updates (지역 pages 상태만)
 * - Error Handling
 */
export function usePageTreeBusiness(
  workspaceId: string,
  initialPages: PageTreeNodeDTO[],
  onPagesUpdate?: (pages: PageTreeNodeDTO[]) => void
): PageTreeBusinessLogic {
  // 지역 pages 상태 관리
  const [pages, setPages] = useState<PageTreeNodeDTO[]>(initialPages);

  // initialPages가 변경되면 로컬 상태도 업데이트 (외부에서 변경된 경우)
  useEffect(() => {
    setPages(initialPages);
  }, [initialPages, workspaceId]);

  // ========================================
  // Mutation 1: Create Page
  // ========================================
  const createPageMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      parentId,
      title,
      icon,
      tempPageId,
    }: {
      workspaceId: string;
      parentId?: string;
      title?: string;
      icon?: string;
      tempPageId?: string;
    }) => {
      const result = await createPageAction({
        workspaceId,
        parentId,
        title: title || 'Untitled',
        icon: icon || 'File',
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onMutate: async ({ workspaceId, parentId, title, icon, tempPageId }) => {
      // tempPageId가 제공되지 않으면 생성
      const finalTempPageId = tempPageId || (await generateTempPageId());
      const finalTitle = title || 'Untitled';
      const finalIcon = icon || 'File';

      // Backup for rollback
      const previousPages = pages;

      // Optimistic update (지역 pages만)
      const lastOrder = findLastOrderInTree(pages, parentId);
      const newOrder = generateKeyBetween(lastOrder, null);

      const newPage: PageTreeNodeDTO = {
        id: finalTempPageId,
        title: finalTitle,
        icon: finalIcon,
        children: [],
        depth: parentId ? 1 : 0,
        isFavorite: false,
        lastModified: new Date().toISOString(),
        parentId: parentId || null,
        order: newOrder,
      };

      const updatedPages = addPageToTree(pages, newPage, parentId);
      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      return { previousPages, tempPageId: finalTempPageId, workspaceId };
    },

    onSuccess: (data, variables, context) => {
      // 임시 ID를 실제 ID로 교체 (지역 pages만)
      const updatedPages = replacePageIdInTree(
        pages,
        context.tempPageId,
        data.pageId
      );
      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      return data.pageId;
    },

    onError: (error, variables, context) => {
      if (context?.previousPages) {
        setPages(context.previousPages);
        onPagesUpdate?.(context.previousPages);
      }

      if (
        error.message === 'NOT_WORKSPACE_MEMBER' ||
        error.message === 'UNAUTHORIZED'
      ) {
        toast.error('You have no permission to create a page');
      } else {
        toast.error('Failed to create page');
      }
    },
  });

  // ========================================
  // Mutation 2: Move Page
  // ========================================
  const movePageMutation = useMutation({
    mutationFn: async ({
      pageId,
      newParentId,
      insertIndex,
      prevPageId,
      nextPageId,
    }: {
      pageId: string;
      newParentId?: string;
      insertIndex?: number;
      prevPageId?: string;
      nextPageId?: string;
    }) => {
      const result = await movePageAction({
        pageId,
        newParentId,
        insertIndex,
        prevPageId,
        nextPageId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },

    onMutate: async ({
      pageId,
      newParentId,
      insertIndex,
      prevPageId,
      nextPageId,
    }) => {
      const previousPages = pages;

      // Optimistic update
      const { tree: treeAfterRemoval, page } = findAndRemovePageFromTree(
        pages,
        pageId
      );

      if (!page) {
        return { previousPages };
      }

      // 새 위치의 형제 페이지들
      const siblings = newParentId
        ? findPageInTreeHelper(treeAfterRemoval, newParentId)?.children || []
        : treeAfterRemoval;

      // prevPageId와 nextPageId를 사용하여 order 계산
      let newOrder: string;
      if (prevPageId || nextPageId) {
        const prevPage = prevPageId
          ? findPageInTreeHelper(siblings, prevPageId)
          : null;
        const nextPage = nextPageId
          ? findPageInTreeHelper(siblings, nextPageId)
          : null;

        const prevOrder = prevPage?.order || null;
        const nextOrder = nextPage?.order || null;

        newOrder = generateKeyBetween(prevOrder, nextOrder);
      } else {
        // prev/next가 없으면 맨 뒤에 추가
        const sortedSiblings = [...siblings].sort((a, b) =>
          a.order.localeCompare(b.order)
        );
        const lastOrder =
          sortedSiblings.length > 0
            ? sortedSiblings[sortedSiblings.length - 1]!.order
            : null;
        newOrder = generateKeyBetween(lastOrder, null);
      }

      // 페이지의 order 업데이트
      const updatedPage = { ...page, order: newOrder };

      // 새 위치에 추가
      const updatedPages = addPageToTree(
        treeAfterRemoval,
        updatedPage,
        newParentId,
        insertIndex
      );

      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      return { previousPages };
    },

    onError: (error, variables, context) => {
      if (context?.previousPages) {
        setPages(context.previousPages);
        onPagesUpdate?.(context.previousPages);
      }

      if (error.message === 'CIRCULAR_REFERENCE_DETECTED') {
        toast.error('Circular reference detected');
      } else if (
        error.message === 'NOT_WORKSPACE_MEMBER' ||
        error.message === 'UNAUTHORIZED'
      ) {
        toast.error('You have no permission to move a page');
      }
    },
  });

  // ========================================
  // Mutation 3: Update Page Info
  // ========================================
  const updatePageInfoMutation = useMutation({
    mutationFn: async ({
      pageId,
      title,
      icon,
    }: {
      pageId: string;
      title?: string;
      icon?: string;
    }) => {
      const result = await updatePageInfoAction({
        pageId,
        title,
        icon,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },

    onMutate: async ({ pageId, title, icon }) => {
      const previousPages = pages;

      // Optimistic update
      const updatedPages = updatePageInfoInTree(pages, pageId, {
        title,
        icon,
      });

      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      return { previousPages };
    },

    onError: (error, variables, context) => {
      if (context?.previousPages) {
        setPages(context.previousPages);
        onPagesUpdate?.(context.previousPages);
      }
      toast.error(`Failed to update page: ${error.message}`);
    },
  });

  // ========================================
  // Mutation 4: Reorder Pages
  // ========================================
  const reorderPagesMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      parentId,
      orderedPageIds,
    }: {
      workspaceId: string;
      parentId: string | undefined;
      orderedPageIds: string[];
    }) => {
      const result = await reorderPagesAction({
        workspaceId,
        parentId,
        orderedPageIds,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },

    onMutate: async ({ workspaceId, parentId, orderedPageIds }) => {
      const previousPages = pages;

      // 각 페이지의 새 fractional index 계산
      const newOrders = new Map<string, string>();
      for (let i = 0; i < orderedPageIds.length; i++) {
        const pageId = orderedPageIds[i];
        if (!pageId) continue;

        const prevOrder =
          i > 0 ? newOrders.get(orderedPageIds[i - 1]!) || null : null;
        const newOrder = generateKeyBetween(prevOrder, null);
        newOrders.set(pageId, newOrder);
      }

      // Optimistic update
      const updatedPages = updatePageOrderInTree(
        pages,
        parentId,
        orderedPageIds,
        newOrders
      );

      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      return { previousPages };
    },

    onError: (error, variables, context) => {
      if (context?.previousPages) {
        setPages(context.previousPages);
        onPagesUpdate?.(context.previousPages);
      }

      if (
        error.message === 'NOT_WORKSPACE_MEMBER' ||
        error.message === 'UNAUTHORIZED'
      ) {
        toast.error('You have no permission to reorder pages');
      }
    },
  });

  // ========================================
  // Mutation 5: Delete Page
  // ========================================
  const deletePageMutation = useMutation({
    mutationFn: async ({ pageId }: { pageId: string }) => {
      const result = await deletePageAction({
        pageId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },

    onMutate: async ({ pageId }) => {
      const previousPages = pages;

      // Optimistic update
      const { tree: updatedTree } = findAndRemovePageFromTree(pages, pageId);

      setPages(updatedTree);
      onPagesUpdate?.(updatedTree);

      return { previousPages, pageId };
    },

    onSuccess: () => {
      toast.success('Page deleted successfully');
    },

    onError: (error, variables, context) => {
      if (context?.previousPages) {
        setPages(context.previousPages);
        onPagesUpdate?.(context.previousPages);
      }

      if (
        error.message === 'NOT_WORKSPACE_MEMBER' ||
        error.message === 'UNAUTHORIZED'
      ) {
        toast.error('You have no permission to delete this page');
      } else if (error.message === 'PAGE_NOT_FOUND') {
        toast.error('Page not found');
      } else {
        toast.error('Failed to delete this page');
      }
    },
  });

  // ========================================
  // Mutation 6: Duplicate Page
  // ========================================
  const duplicatePageMutation = useMutation({
    mutationFn: async ({ pageId }: { pageId: string }) => {
      const result = await duplicatePageAction({
        pageId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onMutate: async ({ pageId }) => {
      const tempPageId = await generateTempPageId();
      const previousPages = pages;

      // 원본 페이지 찾기
      const originalPage = findPageInTreeHelper(pages, pageId);

      if (!originalPage) {
        throw new Error('Page not found');
      }

      // 원본의 다음 형제 찾기 (같은 부모의 형제들 중)
      const siblings = findSiblingsInTree(pages, originalPage.id);
      const sortedSiblings = [...siblings, originalPage].sort((a, b) =>
        String(a.order).localeCompare(String(b.order))
      );
      const originalIndex = sortedSiblings.findIndex(
        p => p.id === originalPage.id
      );
      const nextSibling =
        originalIndex >= 0 && originalIndex < sortedSiblings.length - 1
          ? sortedSiblings[originalIndex + 1]
          : null;

      // Fractional index 생성
      const newOrder = generateKeyBetween(
        originalPage.order,
        nextSibling?.order || null
      );

      const duplicatedPage: PageTreeNodeDTO = {
        id: tempPageId,
        title: `${originalPage.title} (Copy)`,
        icon: originalPage.icon,
        children: [],
        depth: originalPage.depth,
        isFavorite: false,
        lastModified: new Date().toISOString(),
        parentId: originalPage.parentId,
        order: newOrder,
      };

      // Optimistic update
      const updatedPages = addPageToTree(
        pages,
        duplicatedPage,
        originalPage.parentId || undefined,
        undefined // 맨 끝에 추가
      );

      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      return { previousPages, tempPageId };
    },

    onSuccess: (data, variables, context) => {
      // 임시 ID를 실제 ID로 교체
      const updatedPages = replacePageIdInTree(
        pages,
        context.tempPageId,
        data.pageId
      );

      setPages(updatedPages);
      onPagesUpdate?.(updatedPages);

      toast.success('Page duplicated');
      return data.pageId;
    },

    onError: (error, variables, context) => {
      if (context?.previousPages) {
        setPages(context.previousPages);
        onPagesUpdate?.(context.previousPages);
      }

      if (
        error.message === 'NOT_WORKSPACE_MEMBER' ||
        error.message === 'UNAUTHORIZED'
      ) {
        toast.error('You do not have permission to duplicate this page');
      } else if (error.message === 'PAGE_NOT_FOUND') {
        toast.error('Page not found');
      } else {
        toast.error('Failed to duplicate page');
      }
    },
  });

  // ========================================
  // Business Logic Functions
  // ========================================

  const createPage = useCallback(
    async (
      workspaceId: string,
      parentId?: string,
      title?: string,
      icon?: string,
      tempPageId?: string
    ) => {
      try {
        const result = await createPageMutation.mutateAsync({
          workspaceId,
          parentId,
          title,
          icon,
          tempPageId,
        });
        return result?.pageId || null;
      } catch (error) {
        return null;
      }
    },
    [createPageMutation]
  );

  const movePage = useCallback(
    async (
      pageId: string,
      newParentId?: string,
      insertIndex?: number,
      prevPageId?: string,
      nextPageId?: string
    ) => {
      try {
        await movePageMutation.mutateAsync({
          pageId,
          newParentId,
          insertIndex,
          prevPageId,
          nextPageId,
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    [movePageMutation]
  );

  const updatePageInfo = useCallback(
    async (pageId: string, title?: string, icon?: string) => {
      try {
        await updatePageInfoMutation.mutateAsync({
          pageId,
          title,
          icon,
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    [updatePageInfoMutation]
  );

  const reorderPages = useCallback(
    async (
      workspaceId: string,
      parentId: string | undefined,
      orderedPageIds: string[]
    ) => {
      try {
        await reorderPagesMutation.mutateAsync({
          workspaceId,
          parentId,
          orderedPageIds,
        });
        return true;
      } catch (error) {
        return false;
      }
    },
    [reorderPagesMutation]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      try {
        await deletePageMutation.mutateAsync({ pageId });
        return true;
      } catch (error) {
        return false;
      }
    },
    [deletePageMutation]
  );

  const duplicatePage = useCallback(
    async (pageId: string) => {
      try {
        const result = await duplicatePageMutation.mutateAsync({ pageId });
        return result?.pageId || null;
      } catch (error) {
        return null;
      }
    },
    [duplicatePageMutation]
  );

  return {
    createPage,
    movePage,
    updatePageInfo,
    reorderPages,
    deletePage,
    duplicatePage,
    isCreating: createPageMutation.isPending,
    isMoving: movePageMutation.isPending,
    isUpdating: updatePageInfoMutation.isPending,
    isReordering: reorderPagesMutation.isPending,
    isDeleting: deletePageMutation.isPending,
    isDuplicating: duplicatePageMutation.isPending,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockPageTreeBusiness(): PageTreeBusinessLogic {
  const createPage = useCallback(
    async (
      workspaceId: string,
      parentId?: string,
      title?: string,
      icon?: string
    ) => {
      console.log('[Mock] Creating page:', {
        workspaceId,
        parentId,
        title,
        icon,
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      return 'mock-page-id';
    },
    []
  );

  const movePage = useCallback(
    async (
      pageId: string,
      newParentId?: string,
      insertIndex?: number,
      prevPageId?: string,
      nextPageId?: string
    ) => {
      console.log('[Mock] Moving page:', {
        pageId,
        newParentId,
        insertIndex,
        prevPageId,
        nextPageId,
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  const updatePageInfo = useCallback(
    async (pageId: string, title?: string, icon?: string) => {
      console.log('[Mock] Updating page info:', { pageId, title, icon });
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  const reorderPages = useCallback(
    async (
      workspaceId: string,
      parentId: string | undefined,
      orderedPageIds: string[]
    ) => {
      console.log('[Mock] Reordering pages:', {
        workspaceId,
        parentId,
        orderedPageIds,
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  const deletePage = useCallback(async (pageId: string) => {
    console.log('[Mock] Deleting page:', { pageId });
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }, []);

  const duplicatePage = useCallback(async (pageId: string) => {
    console.log('[Mock] Duplicating page:', { pageId });
    await new Promise(resolve => setTimeout(resolve, 300));
    return 'mock-duplicated-page-id';
  }, []);

  return {
    createPage,
    movePage,
    updatePageInfo,
    reorderPages,
    deletePage,
    duplicatePage,
    isCreating: false,
    isMoving: false,
    isUpdating: false,
    isReordering: false,
    isDeleting: false,
    isDuplicating: false,
  };
}
