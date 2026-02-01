/**
 * use-update-page-title
 *
 * TanStack Query를 사용한 페이지 타이틀 업데이트 훅
 * - 직접 action 호출
 * - 에러 시 자동 롤백
 */

import { useMutation } from '@tanstack/react-query';
import { updatePageInfoAction } from '@/domains/workspace-management/actions/page.actions';
import { useWorkspace } from './use-workspace';

interface UpdatePageTitleParams {
  pageId: string;
  newTitle: string;
}

export function useUpdatePageTitle() {
  const { setWorkspaces } = useWorkspace();

  return useMutation({
    mutationFn: async ({ pageId, newTitle }: UpdatePageTitleParams) => {
      const result = await updatePageInfoAction({
        pageId,
        title: newTitle,
      });

      if (!result.success) {
        throw new Error('페이지명 변경에 실패했습니다');
      }

      // Optimistic Update: 상태 업데이트
      setWorkspaces(prev =>
        prev.map(ws => {
          const updatePageInTree = (pages: any[]): any[] => {
            return pages.map(page => {
              if (page.id === pageId) {
                return { ...page, title: newTitle };
              }
              if (page.children && page.children.length > 0) {
                return {
                  ...page,
                  children: updatePageInTree(page.children),
                };
              }
              return page;
            });
          };

          return {
            ...ws,
            pageTree: updatePageInTree(ws.pageTree),
          };
        })
      );

      return { pageId, newTitle };
    },
    onError: (error: Error) => {
      console.error('[useUpdatePageTitle] Error:', error);
    },
  });
}
