/**
 * use-update-page-icon
 *
 * TanStack Query를 사용한 페이지 아이콘 업데이트 훅
 * - Optimistic update 지원 (via WorkspaceContext)
 * - 에러 시 자동 롤백
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useWorkspace } from './use-workspace';

interface UpdatePageIconParams {
  pageId: string;
  newIcon: string;
}

export function useUpdatePageIcon() {
  const { updatePageInfo } = useWorkspace();

  return useMutation({
    mutationFn: async ({ pageId, newIcon }: UpdatePageIconParams) => {
      // WorkspaceContext의 updatePageInfo를 사용 (Optimistic Update 포함)
      const success = await updatePageInfo(pageId, undefined, newIcon);

      if (!success) {
        throw new Error('아이콘 변경에 실패했습니다');
      }

      return { pageId, newIcon };
    },
    onError: (error: Error) => {
      console.error('[useUpdatePageIcon] Error:', error);
      // toast는 이미 updatePageInfo에서 처리되므로 중복 방지
    },
  });
}
