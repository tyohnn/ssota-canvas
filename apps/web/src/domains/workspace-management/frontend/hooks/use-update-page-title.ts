/**
 * use-update-page-title
 *
 * TanStack Query를 사용한 페이지 타이틀 업데이트 훅
 * - Optimistic update 지원 (via WorkspaceContext)
 * - 에러 시 자동 롤백
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useWorkspace } from './use-workspace';

interface UpdatePageTitleParams {
  pageId: string;
  newTitle: string;
}

export function useUpdatePageTitle() {
  const { updatePageInfo } = useWorkspace();

  return useMutation({
    mutationFn: async ({ pageId, newTitle }: UpdatePageTitleParams) => {
      // WorkspaceContext의 updatePageInfo를 사용 (Optimistic Update 포함)
      const success = await updatePageInfo(pageId, newTitle, undefined);

      if (!success) {
        throw new Error('페이지명 변경에 실패했습니다');
      }

      return { pageId, newTitle };
    },
    onError: (error: Error) => {
      console.error('[useUpdatePageTitle] Error:', error);
      // toast는 이미 updatePageInfo에서 처리되므로 중복 방지
    },
  });
}
