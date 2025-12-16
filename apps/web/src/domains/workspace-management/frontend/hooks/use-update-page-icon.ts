/**
 * use-update-page-icon
 *
 * TanStack Query를 사용한 페이지 아이콘 업데이트 훅
 * - 직접 action 호출
 * - 에러 시 자동 롤백
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import { updatePageInfoAction } from '@/domains/workspace-management/actions/page.actions';
import { useWorkspace } from './use-workspace';

interface UpdatePageIconParams {
  pageId: string;
  newIcon: string;
}

export function useUpdatePageIcon() {
  const { setWorkspaces, workspaces } = useWorkspace();

  return useMutation({
    mutationFn: async ({ pageId, newIcon }: UpdatePageIconParams) => {
      const result = await updatePageInfoAction({
        pageId,
        icon: newIcon,
      });

      if (!result.success) {
        throw new Error('아이콘 변경에 실패했습니다');
      }

      // Optimistic Update: 상태 업데이트
      setWorkspaces(prev =>
        prev.map(ws => {
          const updatePageInTree = (pages: any[]): any[] => {
            return pages.map(page => {
              if (page.id === pageId) {
                return { ...page, icon: newIcon };
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

      toast.success('아이콘이 변경되었습니다');

      return { pageId, newIcon };
    },
    onError: (error: Error) => {
      console.error('[useUpdatePageIcon] Error:', error);
      toast.error('아이콘 변경 중 오류가 발생했습니다');
    },
  });
}
