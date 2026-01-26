import { useCallback, useState } from 'react';

import { Node } from '@xyflow/react';

import { getAbsoluteNodePosition } from '../group/utils/get-absolute-node-position';

export type GuidelineType =
  | 'center-vertical'
  | 'center-horizontal'
  | 'edge-vertical'
  | 'edge-horizontal';

export type GuidelinePriority = 'high' | 'medium' | 'low';

export interface Guideline {
  type: GuidelineType;
  position: number;
  priority: GuidelinePriority;
}

interface Position {
  x: number;
  y: number;
}

interface SnapResult {
  position: Position;
  guidelines: Guideline[];
}

interface SnapPoint {
  position: number; // 가이드라인이 그려질 위치
  snapPosition: number; // 드래그 블럭이 스냅될 위치 (블럭의 x 또는 y)
  type: GuidelineType;
  priority: GuidelinePriority;
  axis: 'x' | 'y';
  distance: number; // currentPosition과의 거리
}

const SNAP_THRESHOLD = 5; // 5px 임계값 (Figma 스타일)
const MAX_GUIDELINES_PER_AXIS = 3; // 축별 최대 가이드라인 개수
const MAX_SNAP_DISTANCE = 500; // 스냅 계산 최대 거리 (px, 성능 최적화)

export function useCanvasSnapGuides() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);

  /**
   * 스냅 가이드라인 계산 및 스냅된 position 반환
   *
   * Option 1 방식: 모든 스냅 포인트를 수집 → 거리 계산 → 필터링 → 정렬 → 선택
   *
   * React Flow Helper Lines 예제 참고:
   * https://reactflow.dev/examples/interaction/helper-lines
   */
  const calculateSnapGuides = useCallback(
    (
      draggedBlockId: string,
      currentPosition: Position,
      nodes: Node[]
    ): SnapResult => {
      // 드래그 중인 블럭 찾기
      const draggedNode = nodes.find(n => n.id === draggedBlockId);

      if (!draggedNode) {
        return { position: currentPosition, guidelines: [] };
      }

      // React Flow 노드의 크기: 실제 DOM에서 직접 측정 (가장 정확)
      // React Flow의 measured는 style 기반이므로 minHeight 등의 실제 렌더링 크기와 다를 수 있음
      let draggedWidth = 0;
      let draggedHeight = 0;

      // 1. DOM 요소에서 실제 크기 측정 시도
      const draggedElement = document.querySelector(
        `[data-id="${draggedBlockId}"]`
      );

      if (draggedElement) {
        // React Flow 노드 구조: .react-flow__node > Handle + Content + Handle
        // Handle을 제외하고 실제 컨텐츠 요소를 찾음
        const children = Array.from(draggedElement.children);
        const contentElement = children.find(
          child => !child.classList.contains('react-flow__handle')
        ) as HTMLElement | undefined;

        if (contentElement) {
          draggedWidth = contentElement.offsetWidth;
          draggedHeight = contentElement.offsetHeight;
        }
      }

      // 2. Fallback: React Flow의 measured → width → style
      if (!draggedWidth || !draggedHeight) {
        draggedWidth =
          draggedNode.measured?.width ||
          draggedNode.width ||
          (draggedNode.style?.width as number) ||
          0;
        draggedHeight =
          draggedNode.measured?.height ||
          draggedNode.height ||
          (draggedNode.style?.height as number) ||
          0;
      }

      if (!draggedWidth || !draggedHeight) {
        return { position: currentPosition, guidelines: [] };
      }

      // 드래그 블럭의 절대 좌표 계산 (parentId 있으면 상대->절대 변환)
      const draggedAbsPos = getAbsoluteNodePosition(draggedNode, nodes);

      // 드래그 블럭의 주요 포인트 계산 (절대 좌표 기준)
      const draggedLeft = draggedAbsPos.x;
      const draggedRight = draggedAbsPos.x + draggedWidth;
      const draggedCenterX = draggedAbsPos.x + draggedWidth / 2;
      const draggedTop = draggedAbsPos.y;
      const draggedBottom = draggedAbsPos.y + draggedHeight;
      const draggedCenterY = draggedAbsPos.y + draggedHeight / 2;

      // 1단계: 거리 기반 필터링 (성능 최적화)
      // 드래그 블럭에서 MAX_SNAP_DISTANCE 이내의 노드만 계산 (절대 좌표 기준)
      const nearbyNodes = nodes.filter(node => {
        if (node.id === draggedBlockId) return false;

        // 절대 좌표로 변환
        const nodeAbsPos = getAbsoluteNodePosition(node, nodes);

        // 맨해튼 거리로 간단히 체크 (정확한 유클리드 거리보다 빠름)
        const dx = Math.abs(nodeAbsPos.x - draggedAbsPos.x);
        const dy = Math.abs(nodeAbsPos.y - draggedAbsPos.y);

        return dx <= MAX_SNAP_DISTANCE && dy <= MAX_SNAP_DISTANCE;
      });

      // 2단계: 모든 스냅 포인트 수집 (근처 노드만)
      const allSnapPoints: SnapPoint[] = [];

      nearbyNodes.forEach(node => {
        // React Flow 노드의 크기: 실제 DOM에서 직접 측정
        let nodeWidth = 0;
        let nodeHeight = 0;

        // 1. DOM 요소에서 실제 크기 측정 시도
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`);

        if (nodeElement) {
          // Handle을 제외하고 실제 컨텐츠 요소를 찾음
          const children = Array.from(nodeElement.children);
          const contentElement = children.find(
            child => !child.classList.contains('react-flow__handle')
          ) as HTMLElement | undefined;

          if (contentElement) {
            nodeWidth = contentElement.offsetWidth;
            nodeHeight = contentElement.offsetHeight;
          }
        }

        // 2. Fallback: React Flow의 measured → width → style
        if (!nodeWidth || !nodeHeight) {
          nodeWidth =
            node.measured?.width ||
            node.width ||
            (node.style?.width as number) ||
            0;
          nodeHeight =
            node.measured?.height ||
            node.height ||
            (node.style?.height as number) ||
            0;
        }

        if (!nodeWidth || !nodeHeight) {
          return;
        }

        // 절대 좌표로 변환 (parentId 있으면 상대->절대)
        const nodeAbsPos = getAbsoluteNodePosition(node, nodes);

        const nodeLeft = nodeAbsPos.x;
        const nodeRight = nodeAbsPos.x + nodeWidth;
        const nodeCenterX = nodeAbsPos.x + nodeWidth / 2;
        const nodeTop = nodeAbsPos.y;
        const nodeBottom = nodeAbsPos.y + nodeHeight;
        const nodeCenterY = nodeAbsPos.y + nodeHeight / 2;

        // ===== X축 스냅 포인트 수집 =====

        // 1. 드래그 블럭 좌측 → 다른 블럭의 좌측/중심/우측
        allSnapPoints.push({
          position: nodeLeft,
          snapPosition: nodeLeft,
          type: 'edge-vertical',
          priority: 'low',
          axis: 'x',
          distance: Math.abs(draggedLeft - nodeLeft),
        });
        allSnapPoints.push({
          position: nodeCenterX,
          snapPosition: nodeCenterX,
          type: 'center-vertical',
          priority: 'medium',
          axis: 'x',
          distance: Math.abs(draggedLeft - nodeCenterX),
        });
        allSnapPoints.push({
          position: nodeRight,
          snapPosition: nodeRight,
          type: 'edge-vertical',
          priority: 'low',
          axis: 'x',
          distance: Math.abs(draggedLeft - nodeRight),
        });

        // 2. 드래그 블럭 중심 → 다른 블럭의 좌측/중심/우측
        allSnapPoints.push({
          position: nodeLeft,
          snapPosition: nodeLeft - draggedWidth / 2,
          type: 'center-vertical',
          priority: 'medium',
          axis: 'x',
          distance: Math.abs(draggedCenterX - nodeLeft),
        });
        allSnapPoints.push({
          position: nodeCenterX,
          snapPosition: nodeCenterX - draggedWidth / 2,
          type: 'center-vertical',
          priority: 'high',
          axis: 'x',
          distance: Math.abs(draggedCenterX - nodeCenterX),
        });
        allSnapPoints.push({
          position: nodeRight,
          snapPosition: nodeRight - draggedWidth / 2,
          type: 'center-vertical',
          priority: 'medium',
          axis: 'x',
          distance: Math.abs(draggedCenterX - nodeRight),
        });

        // 3. 드래그 블럭 우측 → 다른 블럭의 좌측/중심/우측
        allSnapPoints.push({
          position: nodeLeft,
          snapPosition: nodeLeft - draggedWidth,
          type: 'edge-vertical',
          priority: 'low',
          axis: 'x',
          distance: Math.abs(draggedRight - nodeLeft),
        });
        allSnapPoints.push({
          position: nodeCenterX,
          snapPosition: nodeCenterX - draggedWidth,
          type: 'center-vertical',
          priority: 'medium',
          axis: 'x',
          distance: Math.abs(draggedRight - nodeCenterX),
        });
        allSnapPoints.push({
          position: nodeRight,
          snapPosition: nodeRight - draggedWidth,
          type: 'edge-vertical',
          priority: 'low',
          axis: 'x',
          distance: Math.abs(draggedRight - nodeRight),
        });

        // ===== Y축 스냅 포인트 수집 =====

        // 1. 드래그 블럭 상단 → 다른 블럭의 상단/중심/하단
        allSnapPoints.push({
          position: nodeTop,
          snapPosition: nodeTop,
          type: 'edge-horizontal',
          priority: 'low',
          axis: 'y',
          distance: Math.abs(draggedTop - nodeTop),
        });
        allSnapPoints.push({
          position: nodeCenterY,
          snapPosition: nodeCenterY,
          type: 'center-horizontal',
          priority: 'medium',
          axis: 'y',
          distance: Math.abs(draggedTop - nodeCenterY),
        });
        allSnapPoints.push({
          position: nodeBottom,
          snapPosition: nodeBottom,
          type: 'edge-horizontal',
          priority: 'low',
          axis: 'y',
          distance: Math.abs(draggedTop - nodeBottom),
        });

        // 2. 드래그 블럭 중심 → 다른 블럭의 상단/중심/하단
        allSnapPoints.push({
          position: nodeTop,
          snapPosition: nodeTop - draggedHeight / 2,
          type: 'center-horizontal',
          priority: 'medium',
          axis: 'y',
          distance: Math.abs(draggedCenterY - nodeTop),
        });
        allSnapPoints.push({
          position: nodeCenterY,
          snapPosition: nodeCenterY - draggedHeight / 2,
          type: 'center-horizontal',
          priority: 'high',
          axis: 'y',
          distance: Math.abs(draggedCenterY - nodeCenterY),
        });
        allSnapPoints.push({
          position: nodeBottom,
          snapPosition: nodeBottom - draggedHeight / 2,
          type: 'center-horizontal',
          priority: 'medium',
          axis: 'y',
          distance: Math.abs(draggedCenterY - nodeBottom),
        });

        // 3. 드래그 블럭 하단 → 다른 블럭의 상단/중심/하단
        allSnapPoints.push({
          position: nodeTop,
          snapPosition: nodeTop - draggedHeight,
          type: 'edge-horizontal',
          priority: 'low',
          axis: 'y',
          distance: Math.abs(draggedBottom - nodeTop),
        });
        allSnapPoints.push({
          position: nodeCenterY,
          snapPosition: nodeCenterY - draggedHeight,
          type: 'center-horizontal',
          priority: 'medium',
          axis: 'y',
          distance: Math.abs(draggedBottom - nodeCenterY),
        });
        allSnapPoints.push({
          position: nodeBottom,
          snapPosition: nodeBottom - draggedHeight,
          type: 'edge-horizontal',
          priority: 'low',
          axis: 'y',
          distance: Math.abs(draggedBottom - nodeBottom),
        });
      });

      // 3단계: 임계값 내의 스냅 포인트만 필터링
      const nearSnapPoints = allSnapPoints.filter(
        point => point.distance <= SNAP_THRESHOLD
      );

      // 4단계: X축과 Y축을 분리
      const xSnapPoints = nearSnapPoints.filter(p => p.axis === 'x');
      const ySnapPoints = nearSnapPoints.filter(p => p.axis === 'y');

      // 5단계: 우선순위 정렬 (distance 오름차순 → priority 내림차순)
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const sortSnapPoints = (a: SnapPoint, b: SnapPoint) => {
        // 거리가 가까운 것 우선
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        // 거리가 같으면 우선순위 높은 것 우선
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      };

      xSnapPoints.sort(sortSnapPoints);
      ySnapPoints.sort(sortSnapPoints);

      // 6단계: 스냅 위치 결정 (가장 가까운 것)
      let snappedX = currentPosition.x;
      let snappedY = currentPosition.y;

      const closestXSnap = xSnapPoints[0];
      const closestYSnap = ySnapPoints[0];

      if (closestXSnap) {
        snappedX = closestXSnap.snapPosition;
      }
      if (closestYSnap) {
        snappedY = closestYSnap.snapPosition;
      }

      // 7단계: 표시할 가이드라인 수집 (축별 최대 MAX_GUIDELINES_PER_AXIS개)
      const selectedSnapPoints: SnapPoint[] = [];

      // X축에서 최대 MAX_GUIDELINES_PER_AXIS개 선택
      const selectedXSnapPoints = xSnapPoints.slice(0, MAX_GUIDELINES_PER_AXIS);
      selectedSnapPoints.push(...selectedXSnapPoints);

      // Y축에서 최대 MAX_GUIDELINES_PER_AXIS개 선택
      const selectedYSnapPoints = ySnapPoints.slice(0, MAX_GUIDELINES_PER_AXIS);
      selectedSnapPoints.push(...selectedYSnapPoints);

      // 8단계: 가이드라인 변환 (중복 제거)
      const guidelineMap = new Map<string, Guideline>();
      selectedSnapPoints.forEach(point => {
        const key = `${point.type}-${point.position}`;
        if (!guidelineMap.has(key)) {
          guidelineMap.set(key, {
            type: point.type,
            position: point.position,
            priority: point.priority,
          });
        }
      });

      const newGuidelines = Array.from(guidelineMap.values());

      // 9단계: 스냅된 위치를 올바른 좌표계로 변환
      // 드래그 노드가 parentId를 가지면 상대 좌표로 변환, 아니면 절대 좌표 그대로
      let finalPosition = { x: snappedX, y: snappedY };

      if (draggedNode.parentId) {
        const parent = nodes.find(n => n.id === draggedNode.parentId);
        if (parent) {
          const parentAbsPos = getAbsoluteNodePosition(parent, nodes);
          finalPosition = {
            x: snappedX - parentAbsPos.x,
            y: snappedY - parentAbsPos.y,
          };
        }
      }

      // 10단계: 상태 업데이트
      setGuidelines(newGuidelines);

      return {
        position: finalPosition,
        guidelines: newGuidelines,
      };
    },
    []
  );

  /**
   * 가이드라인 표시 (테스트용)
   */
  const showGuidelines = useCallback((newGuidelines: Guideline[]) => {
    setGuidelines(newGuidelines);
  }, []);

  /**
   * 가이드라인 숨김
   */
  const hideGuidelines = useCallback(() => {
    setGuidelines([]);
  }, []);

  return {
    guidelines,
    calculateSnapGuides,
    showGuidelines,
    hideGuidelines,
  };
}
