import { useCallback } from 'react';

import type {
  DomainDependencies,
  MoreMenuBusinessLogic,
  MoreMenuToolbarItemProps,
} from './types';

function getAbsolutePosition(
  node: { parentId?: string; position: { x: number; y: number } },
  getNode: DomainDependencies['reactFlow']['getNode']
): { x: number; y: number } {
  if (!node.parentId) return node.position;
  const parent = getNode(node.parentId);
  if (!parent) return node.position;
  const pAbs = getAbsolutePosition(parent, getNode);
  return {
    x: node.position.x + pAbs.x,
    y: node.position.y + pAbs.y,
  };
}

/**
 * Production business logic
 * Makes actual API calls and updates domain state
 */
export function useMoreMenuBusiness(
  props: MoreMenuToolbarItemProps,
  dependencies: DomainDependencies
): MoreMenuBusinessLogic {
  const { blockLifecycle, canvasMode, reactFlow } = dependencies;

  const handleEdit = useCallback(() => {
    canvasMode.enterBlockEditingMode(props.blockId, props.blockMountId);
  }, [canvasMode, props.blockId, props.blockMountId]);

  const handleDuplicate = useCallback(async () => {
    try {
      // 블럭 복제 실행 (블럭 너비 + 50px 오프셋)
      const blockWidth = props.width || 200; // 기본 너비 200px
      const offsetX = blockWidth + 50;
      const offsetY = 20; // Y축은 기본 20px

      await blockLifecycle.duplicateBlockAndMount(
        props.blockMountId,
        offsetX,
        offsetY
      );
    } catch (error) {
      console.error('Block duplication failed:', error);
    }
  }, [blockLifecycle, props.blockMountId, props.width]);

  const handleCreateComponent = useCallback(() => {
    // TODO: 컴포넌트 생성 구현 (추후 구현 예정)
  }, []);

  const handleDelete = useCallback(async () => {
    // 1. React Flow에서 즉시 제거 (Optimistic UI)
    // React Flow의 노드 ID는 blockMountId여야 함 (block_mounts.id)
    reactFlow.deleteElements({ nodes: [{ id: props.blockMountId }] });

    // 2. 기본 모드로 복귀
    canvasMode.exitToDefaultMode();

    // 3. 서버 액션은 onNodesDelete 콜백에서 처리됨
  }, [canvasMode, reactFlow, props.blockMountId]);

  const handleUngroup = useCallback(() => {
    const parentId = props.parentBlockMountId;
    if (!parentId) return;

    const child = reactFlow.getNode(props.blockMountId);
    const parent = reactFlow.getNode(parentId);
    if (!child || !parent) return;

    const parentPosition = getAbsolutePosition(parent, reactFlow.getNode);
    const childRelativePosition = child.position;

    return blockLifecycle.removeNodeFromGroup({
      childBlockMountId: props.blockMountId,
      parentPosition,
      childRelativePosition,
    });
  }, [
    blockLifecycle,
    props.blockMountId,
    props.parentBlockMountId,
    reactFlow,
  ]);

  return {
    handleEdit,
    handleDuplicate,
    handleCreateComponent,
    handleDelete,
    handleUngroup: props.parentBlockMountId ? handleUngroup : undefined,
  };
}
