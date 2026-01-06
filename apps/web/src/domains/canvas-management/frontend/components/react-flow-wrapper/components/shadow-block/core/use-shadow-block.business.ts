import { useCallback, useRef } from 'react';

import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';
import type { Position } from '@/domains/canvas-management/shared/types/common.types';

import type {
  DomainDependencies,
  MouseState,
  ShadowBlockBusinessLogic,
} from './types';

/**
 * Business Hook for Shadow Block
 *
 * Canvas Mode 확인 및 블록 생성 핸들러 제공
 * 이벤트 리스너 등록은 오케스트레이션 레이어에서 처리
 *
 * @param domainDependencies - 도메인 의존성 (Canvas Mode, Block Lifecycle, React Flow)
 * @param mouseState - 마우스 상태
 */
export function useShadowBlockBusiness(
  domainDependencies: DomainDependencies,
  mouseState: MouseState
): ShadowBlockBusinessLogic {
  const isCreatingRef = useRef(false);

  const isBlockCreationMode = domainDependencies.isBlockCreationMode();
  const currentMode = domainDependencies.getCurrentMode();

  // ESC 키 핸들러
  const handleEscapeKey = useCallback(() => {
    domainDependencies.exitToDefaultMode();
  }, [domainDependencies]);

  // 블록 생성 핸들러
  const handleBlockCreate = useCallback(
    (event: MouseEvent) => {
      // 이미 생성 중이면 무시 (중복 생성 방지)
      if (isCreatingRef.current) {
        return;
      }

      if (currentMode.type !== 'block-creation') return;

      const target = event.target as HTMLElement;

      // React Flow 영역 확인 (여러 방법으로 체크)
      const isReactFlowPane =
        target.classList.contains('react-flow__pane') ||
        target.classList.contains('react-flow__background');
      const isReactFlowNode = target.closest('.react-flow__node') !== null;
      const isReactFlowEdge = target.closest('.react-flow__edge') !== null;
      const isInReactFlowContainer = target.closest('.react-flow') !== null;

      const isInReactFlow =
        isReactFlowPane ||
        isReactFlowNode ||
        isReactFlowEdge ||
        isInReactFlowContainer;

      if (!isInReactFlow) {
        return;
      }

      // 특정 UI 요소는 제외 (툴바, 컨트롤 등)
      const isExcludedElement =
        target.closest('[role="dialog"]') || // 다이얼로그
        target.closest('[role="menu"]') || // 메뉴
        target.closest('.react-flow__controls') || // 컨트롤 버튼
        target.closest('.react-flow__minimap') || // 미니맵
        target.closest('[data-radix-popper-content-wrapper]') || // Radix 팝오버
        target.closest('[data-exclude-block-creation]'); // 커스텀 제외

      if (isExcludedElement) {
        return;
      }

      // 블럭 타입별 크기 가져오기
      const blockType = currentMode.blockType;
      const blockSize = BLOCK_TYPE_SIZES[blockType];

      // 마우스 위치를 React Flow 좌표로 변환
      const mouseFlowPosition =
        mouseState.position ||
        domainDependencies.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

      // 마우스 포인터가 블록의 중앙이 되도록 위치 조정
      const adjustedPosition: Position = {
        x: mouseFlowPosition.x - blockSize.width / 2,
        y: mouseFlowPosition.y - blockSize.height / 2,
      };

      // 블럭 생성
      if (currentMode.blockType) {
        // 짧은 쿨다운 시작 (200ms) - 빠른 연속 클릭 방지
        isCreatingRef.current = true;
        setTimeout(() => {
          isCreatingRef.current = false;
        }, 200);

        // 비동기로 블록 생성 (Optimistic UI로 즉시 표시됨)
        domainDependencies.createAndMountBlock(
          currentMode.blockType,
          adjustedPosition
        );

        // 즉시 모드 전환 (딜레이 없음)
        domainDependencies.exitToDefaultMode();
      }
    },
    [currentMode, mouseState, domainDependencies]
  );

  return {
    isBlockCreationMode,
    currentMode,
    handleEscapeKey,
    handleBlockCreate,
  };
}
