import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { PageTreeItem } from './types';
import type { PageTreeBusinessLogic } from './use-page-tree.business';

/**
 * usePageTreeDnD
 *
 * Drag & Drop 로직을 전담하는 Hook입니다.
 * @headless-tree/core의 createOnDropHandler와 연동되어 동작합니다.
 */
export function usePageTreeDnD(
  business: PageTreeBusinessLogic,
  workspaceId: string,
  treeData: Record<string, PageTreeItem>,
  dragHiddenIds: RefObject<Set<string>>,
  rootPageIds: string[]
) {
  // treeData와 rootPageIds를 ref로 관리하여 handleDrop이 재생성되지 않도록 함
  const treeDataRef = useRef(treeData);
  const rootPageIdsRef = useRef(rootPageIds);

  useEffect(() => {
    treeDataRef.current = treeData;
    rootPageIdsRef.current = rootPageIds;
  }, [treeData, rootPageIds]);

  /**
   * handleDrop
   *
   * Tree에서 드롭 이벤트가 발생했을 때 호출됩니다.
   * createOnDropHandler에 의해 "결과적으로 변한 자식 목록"을 받습니다.
   *
   * @param parentItem - 드롭된 위치의 부모 아이템 (TreeItemWrapper 또는 Item)
   * @param newChildrenIds - 부모 아이템의 새로운 자식 ID 목록 (순서 포함)
   */
  const handleDrop = useCallback(
    async (parentItem: any, newChildrenIds: Iterable<string>) => {
      const currentTreeData = treeDataRef.current;
      const parentId = parentItem.getId(); // 부모 ID (Workspace Root일 수 있음)

      // Workspace ID인 경우 부모가 없는 것(null)으로 취급
      const newParentId = parentId === workspaceId ? undefined : parentId;

      const uniqueChildren = [...new Set(Array.from(newChildrenIds))];

      // 현재(변경 전) 부모의 자식 목록
      let currentChildren: string[] = [];
      if (parentId === workspaceId) {
        currentChildren = rootPageIdsRef.current || [];
      } else {
        currentChildren = currentTreeData[parentId]?.children || [];
      }

      // 추가된 ID (다른 부모에서 이동해 온 경우)
      const addedIds = uniqueChildren.filter(
        id => !currentChildren.includes(id)
      );

      // 제거된 ID (다른 부모로 이동한 경우 - 여기서는 로직 처리 안 함)
      const removedIds = currentChildren.filter(
        id => !uniqueChildren.includes(id)
      );

      // =================================================================
      // Case 1: 부모 변경 (Reparenting)
      // =================================================================
      if (addedIds.length > 0) {
        // [Phase 2] 삽입 단계 완료 -> 숨김 해제
        dragHiddenIds.current?.clear();

        const movePromises = addedIds
          .filter(id => id !== workspaceId)
          .map(async id => {
            const newIndex = uniqueChildren.indexOf(id);
            const prevPageId =
              newIndex > 0 ? uniqueChildren[newIndex - 1] : undefined;
            const nextPageId =
              newIndex < uniqueChildren.length - 1
                ? uniqueChildren[newIndex + 1]
                : undefined;

            await business.movePage(
              id,
              newParentId,
              undefined, // insertIndex (fractional indexing을 사용하므로 생략 가능하거나 비즈니스 로직 내부에서 처리)
              prevPageId,
              nextPageId
            );
          });

        await Promise.all(movePromises);
        return uniqueChildren;
      }

      // =================================================================
      // Case 2: 드래그 진행 중 (Removal)
      // =================================================================
      // 아이템이 현재 부모에서 빠져나간 경우입니다.
      // 별도의 처리가 필요 없으며, 변경된 자식 목록을 반환하여 UI에 반영합니다.
      if (addedIds.length === 0 && removedIds.length > 0) {
        // [Phase 1] 제거 단계 -> 해당 아이템을 임시로 숨김
        removedIds.forEach(id => dragHiddenIds.current?.add(id));
        return uniqueChildren;
      }

      // =================================================================
      // Case 3: 순서 변경 (Reordering)
      // =================================================================
      // 같은 부모 내에서 순서만 변경된 경우입니다.
      // addedIds와 removedIds가 모두 비어있지만, 배열의 순서가 다릅니다.
      if (addedIds.length === 0 && removedIds.length === 0) {
        // [Phase 2] 삽입(순서변경) 단계 완료 -> 숨김 해제
        // (단, Case 3는 removedIds가 비어있으므로 여기서 명시적으로 clear)
        dragHiddenIds.current?.clear();

        const isArrayChanged =
          uniqueChildren.length !== currentChildren.length ||
          uniqueChildren.some((id, index) => currentChildren[index] !== id);

        if (isArrayChanged) {
          // 변경된 아이템 찾기: 나머지 아이템들의 상대적 순서가 유지되는 아이템을 찾음
          const movedPageId = uniqueChildren.find(id => {
            const oldRest = currentChildren.filter(x => x !== id);
            const newRest = uniqueChildren.filter(x => x !== id);
            return (
              oldRest.length === newRest.length &&
              oldRest.every((val, idx) => val === newRest[idx])
            );
          });

          if (movedPageId) {
            const newIndex = uniqueChildren.indexOf(movedPageId);
            const prevPageId =
              newIndex > 0 ? uniqueChildren[newIndex - 1] : undefined;
            const nextPageId =
              newIndex < uniqueChildren.length - 1
                ? uniqueChildren[newIndex + 1]
                : undefined;

            await business.movePage(
              movedPageId,
              newParentId,
              undefined,
              prevPageId,
              nextPageId
            );
          }
          return uniqueChildren;
        }
      }

      // Case 4: 변경 없음 (제자리 드롭 등)
      // 혹시 모르니 숨김 해제
      dragHiddenIds.current?.clear();
      return currentChildren;
    },
    [business, workspaceId, dragHiddenIds]
  );

  return { handleDrop };
}
