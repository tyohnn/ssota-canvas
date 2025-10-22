import { useCallback } from 'react';
import { useReactFlow, Node } from '@xyflow/react';
import {
  updateBlockPositionAction,
  updateBlockSizeAction,
  updateMultipleBlockPositionsAction,
} from '@/domains/canvas-management/actions/block.actions';

export type AlignmentType =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center'
  | 'middle';
export type DistributionDirection = 'horizontal' | 'vertical';

interface UseCanvasBlockTransformProps {
  pageId: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export function useCanvasBlockTransform({
  pageId,
}: UseCanvasBlockTransformProps) {
  const { setNodes, getNodes } = useReactFlow();

  /**
   * 프로그램적 제어: React Flow Store 직접 업데이트 (서버 호출 X)
   */
  const setBlockPosition = useCallback(
    (blockId: string, position: Position) => {
      setNodes(nodes =>
        nodes.map(node => (node.id === blockId ? { ...node, position } : node))
      );
    },
    [setNodes]
  );

  const setBlockSize = useCallback(
    (blockId: string, size: Size) => {
      setNodes(nodes =>
        nodes.map(node =>
          node.id === blockId
            ? {
                ...node,
                data: { ...node.data, size },
                width: size.width,
                height: size.height,
              }
            : node
        )
      );
    },
    [setNodes]
  );

  /**
   * 서버 연동: React Flow 콜백용, 영구 저장
   */
  const saveBlockPosition = useCallback(
    async (blockId: string, position: Position) => {
      try {
        // 1. blockMountId 조회 (노드 데이터에서)
        const nodes = getNodes();
        const node = nodes.find(n => n.id === blockId);

        if (!node || !node.data?.blockMountId) {
          console.error('Block mount ID not found for block:', blockId);
          return;
        }

        const blockMountId = node.data.blockMountId as string;

        // 2. Server Action 호출
        const result = await updateBlockPositionAction({
          blockMountId,
          newPosition: position,
        });

        if (!result.success) {
          console.error('❌ Failed to save position:', result.error);
          // 실패 시 롤백은 상위 컴포넌트에서 처리
        }
      } catch (error) {
        console.error('Error saving block position:', error);
      }
    },
    [getNodes]
  );

  const saveBlockSize = useCallback(
    async (blockId: string, size: Size) => {
      try {
        // 1. blockMountId 조회 (노드 데이터에서)
        const nodes = getNodes();
        const node = nodes.find(n => n.id === blockId);

        if (!node || !node.data?.blockMountId) {
          console.error('Block mount ID not found for block:', blockId);
          return;
        }

        const blockMountId = node.data.blockMountId as string;

        // 2. Server Action 호출
        const result = await updateBlockSizeAction({
          blockMountId,
          newSize: size,
        });

        if (result.success) {
          console.log('✅ Size saved to server:', result.data);
        } else {
          console.error('❌ Failed to save size:', result.error);
        }
      } catch (error) {
        console.error('Error saving block size:', error);
      }
    },
    [getNodes]
  );

  /**
   * 블럭 정렬: 프론트엔드 계산 + 서버 저장
   */
  const alignBlocks = useCallback(
    async (blockIds: string[], alignmentType: AlignmentType) => {
      try {
        // 1. 선택된 블럭들의 현재 위치 조회
        const nodes = getNodes();
        const selectedNodes = nodes.filter(node => blockIds.includes(node.id));

        if (selectedNodes.length === 0) {
          console.warn('No nodes found for alignment');
          return;
        }

        // 2. 정렬 알고리즘 실행
        let newPositions: Array<{ blockId: string; position: Position }> = [];

        switch (alignmentType) {
          case 'left': {
            // 모든 블럭의 x를 최소 x로 설정
            const minX = Math.min(...selectedNodes.map(n => n.position.x));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: minX, y: n.position.y },
            }));
            break;
          }
          case 'right': {
            // 모든 블럭의 x를 최대 x로 설정
            const maxX = Math.max(...selectedNodes.map(n => n.position.x));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: maxX, y: n.position.y },
            }));
            break;
          }
          case 'top': {
            // 모든 블럭의 y를 최소 y로 설정
            const minY = Math.min(...selectedNodes.map(n => n.position.y));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: n.position.x, y: minY },
            }));
            break;
          }
          case 'bottom': {
            // 모든 블럭의 y를 최대 y로 설정
            const maxY = Math.max(...selectedNodes.map(n => n.position.y));
            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: { x: n.position.x, y: maxY },
            }));
            break;
          }
          case 'center': {
            // 모든 블럭의 중심 x를 평균 중심 x로 설정 (좌우 중앙 정렬)
            const centerX =
              selectedNodes.reduce(
                (sum, n) => sum + n.position.x + (n.width || 0) / 2,
                0
              ) / selectedNodes.length;

            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: {
                x: centerX - (n.width || 0) / 2,
                y: n.position.y,
              },
            }));
            break;
          }
          case 'middle': {
            // 모든 블럭의 중심 y를 평균 중심 y로 설정 (상하 중앙 정렬)
            const centerY =
              selectedNodes.reduce(
                (sum, n) => sum + n.position.y + (n.height || 0) / 2,
                0
              ) / selectedNodes.length;

            newPositions = selectedNodes.map(n => ({
              blockId: n.id,
              position: {
                x: n.position.x,
                y: centerY - (n.height || 0) / 2,
              },
            }));
            break;
          }
        }

        // 3. React Flow Store에 즉시 반영
        setNodes(nodes =>
          nodes.map(node => {
            const newPos = newPositions.find(np => np.blockId === node.id);
            return newPos ? { ...node, position: newPos.position } : node;
          })
        );

        // 4. Server Action 호출 (blockMountId 필요)
        const blockPositions = newPositions.map(np => {
          const node = selectedNodes.find(n => n.id === np.blockId);
          return {
            blockMountId: node?.data?.blockMountId as string,
            position: np.position,
          };
        });

        const result = await updateMultipleBlockPositionsAction({
          blockPositions,
        });

        if (result.success) {
          console.log('✅ Alignment saved to server:', result.data);
        } else {
          console.error('❌ Failed to save alignment:', result.error);
          // 실패 시 롤백 로직 필요
        }
      } catch (error) {
        console.error('Error aligning blocks:', error);
      }
    },
    [getNodes, setNodes]
  );

  /**
   * 블럭 균등 분포: 프론트엔드 계산 + 서버 저장
   */
  const distributeBlocks = useCallback(
    async (blockIds: string[], direction: DistributionDirection) => {
      try {
        // 1. 선택된 블럭들의 현재 위치 조회
        const nodes = getNodes();
        const selectedNodes = nodes.filter(node => blockIds.includes(node.id));

        if (selectedNodes.length < 2) {
          console.warn('Need at least 2 blocks for distribution');
          return;
        }

        // 2. 분포 알고리즘 실행
        let newPositions: Array<{ blockId: string; position: Position }> = [];

        if (direction === 'horizontal') {
          // 수평 분포: 블럭들을 x축 기준으로 동일 간격 배치
          const sorted = [...selectedNodes].sort(
            (a, b) => a.position.x - b.position.x
          );
          const totalWidth =
            sorted[sorted.length - 1]!.position.x - sorted[0]!.position.x;
          const gap = totalWidth / (sorted.length - 1);

          newPositions = sorted.map((n, i) => ({
            blockId: n.id,
            position: {
              x: sorted[0]!.position.x + gap * i,
              y: n.position.y,
            },
          }));
        } else {
          // 수직 분포: 블럭들을 y축 기준으로 동일 간격 배치
          const sorted = [...selectedNodes].sort(
            (a, b) => a.position.y - b.position.y
          );
          const totalHeight =
            sorted[sorted.length - 1]!.position.y - sorted[0]!.position.y;
          const gap = totalHeight / (sorted.length - 1);

          newPositions = sorted.map((n, i) => ({
            blockId: n.id,
            position: {
              x: n.position.x,
              y: sorted[0]!.position.y + gap * i,
            },
          }));
        }

        // 3. React Flow Store에 즉시 반영
        setNodes(nodes =>
          nodes.map(node => {
            const newPos = newPositions.find(np => np.blockId === node.id);
            return newPos ? { ...node, position: newPos.position } : node;
          })
        );

        // 4. Server Action 호출
        const blockPositions = newPositions.map(np => {
          const node = selectedNodes.find(n => n.id === np.blockId);
          return {
            blockMountId: node?.data?.blockMountId as string,
            position: np.position,
          };
        });

        const result = await updateMultipleBlockPositionsAction({
          blockPositions,
        });

        if (result.success) {
          console.log('✅ Distribution saved to server:', result.data);
        } else {
          console.error('❌ Failed to save distribution:', result.error);
        }
      } catch (error) {
        console.error('Error distributing blocks:', error);
      }
    },
    [getNodes, setNodes]
  );

  /**
   * 여러 블럭의 위치를 배치로 서버에 저장
   */
  const saveMultipleBlockPositions = useCallback(
    async (blockPositions: Array<{ blockId: string; position: Position }>) => {
      try {
        // 1. React Flow Store의 노드에서 blockMountId 찾기
        const nodes = getNodes();
        const blockMountPositions = blockPositions.map(bp => {
          const node = nodes.find(n => n.id === bp.blockId);
          return {
            blockMountId: node?.data?.blockMountId as string,
            position: bp.position,
          };
        });

        // 2. Server Action 호출
        const result = await updateMultipleBlockPositionsAction({
          blockPositions: blockMountPositions,
        });

        if (result.success) {
          console.log('✅ Multiple positions saved to server:', result.data);
        } else {
          console.error('❌ Failed to save multiple positions:', result.error);
        }

        return result;
      } catch (error) {
        console.error('Error saving multiple block positions:', error);
        throw error;
      }
    },
    [getNodes]
  );

  return {
    setBlockPosition,
    setBlockSize,
    saveBlockPosition,
    saveBlockSize,
    saveMultipleBlockPositions,
    alignBlocks,
    distributeBlocks,
  };
}
