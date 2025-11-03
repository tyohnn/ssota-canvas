'use client';

import React, { useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasMode } from '../../hooks/use-canvas-mode';
import { useCanvasBlockLifecycle } from '../../hooks/use-canvas-block-lifecycle';
import type { Position } from '../../../shared/types/common.types';
import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';

/**
 * 블록 타입별 기본 크기 정의
 * @deprecated 이제 block-types.ts의 BLOCK_TYPE_SIZES 사용
 */
const LEGACY_BLOCK_TYPE_SIZES: Record<string, { width: number; height: number }> = {
  basic: { width: 200, height: 150 },
  'shape-square': { width: 150, height: 150 },
  'shape-circle': { width: 150, height: 150 },
  image: { width: 300, height: 200 },
  video: { width: 400, height: 225 },
  map: { width: 350, height: 250 },
};

export interface SkeletonBlockProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
}

/**
 * SkeletonBlock Component
 *
 * @deprecated 이제 ShadowBlockContainer를 사용하세요.
 * 블럭 생성 모드에서 마우스를 따라다니는 반투명 블럭 컴포넌트
 *
 * Features:
 * - 마우스 커서를 따라다니는 반투명 블럭
 * - 선택된 blockType에 맞는 크기/모양
 * - 십자형(+) 커서 표시
 * - 캔버스 클릭 시 블럭 생성 트리거
 * - ESC 키로 모드 취소
 *
 * 렌더링 조건: isBlockCreationMode() === true
 */
export function SkeletonBlock({
  pageId,
  orgId,
  workspaceId,
}: SkeletonBlockProps) {
  const canvasMode = useCanvasMode();
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
    orgId,
    workspaceId,
  });
  const reactFlow = useReactFlow();
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 현재 모드와 선택된 블럭 타입 확인
  const isBlockCreationMode = canvasMode.isBlockCreationMode();
  const currentMode = canvasMode.getCurrentMode();

  // 모드 진입 시 초기 마우스 위치 설정 및 이벤트 리스너 등록
  useEffect(() => {
    if (!isBlockCreationMode) {
      setMousePosition(null);
      setIsInitialized(false);
      return;
    }

    // 현재 마우스 위치를 즉시 설정 (초기화 문제 해결)
    const getCurrentMousePosition = () => {
      // 마우스가 실제로 캔버스 위에 있을 때만 위치 설정
      const position = reactFlow.screenToFlowPosition({
        x: 0, // 마우스 이벤트에서 실제 위치를 받을 때까지는 null 유지
        y: 0,
      });
      setIsInitialized(false); // 첫 번째 실제 마우스 움직임까지 대기
    };

    const handleMouseMove = (event: MouseEvent) => {
      // React Flow의 screenToFlowPosition 사용
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setMousePosition(position);
      setIsInitialized(true); // 마우스가 움직였음을 표시
    };

    // 마우스 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isBlockCreationMode, reactFlow]);

  // ESC 키 핸들러
  useEffect(() => {
    if (!isBlockCreationMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        canvasMode.exitToDefaultMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBlockCreationMode, canvasMode]);

  // 캔버스 클릭 핸들러 (React Flow onPaneClick을 사용하지 않고 직접 처리)
  useEffect(() => {
    if (!isBlockCreationMode) return;

    const handleClick = (event: MouseEvent) => {
      // 캔버스 영역 클릭 확인 (React Flow 영역)
      const target = event.target as HTMLElement;
      const isCanvasArea =
        target.closest('.react-flow__pane') ||
        target.classList.contains('react-flow__pane');

      if (!isCanvasArea || currentMode.type !== 'block-creation') return;

      // 블럭 타입별 크기 가져오기
      const blockType = currentMode.blockType || 'text';
      const blockSize = BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES.text;

      // 마우스 위치를 React Flow 좌표로 변환
      const mouseFlowPosition =
        mousePosition ||
        reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

      // 마우스 포인터가 블록의 좌측상단이 되도록 위치 조정
      // 스켈레톤이 중앙에 위치하도록 조정했으므로, 블록 생성 시 반대로 조정
      const adjustedPosition: Position = {
        x: mouseFlowPosition.x - (blockSize?.width ?? 200) / 2,
        y: mouseFlowPosition.y - (blockSize?.height ?? 150) / 2,
      };

      // 블럭 생성
      if (currentMode.blockType) {
        blockLifecycle.createAndMountBlock(
          currentMode.blockType,
          adjustedPosition
        );

        // 블럭 생성 후 기본 모드로 복귀
        canvasMode.exitToDefaultMode();
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [
    isBlockCreationMode,
    currentMode,
    mousePosition,
    blockLifecycle,
    workspaceId,
    orgId,
    canvasMode,
    reactFlow,
  ]);

  // 블럭 생성 모드가 아닌 경우 렌더링하지 않음
  if (!isBlockCreationMode || currentMode.type !== 'block-creation') {
    return null;
  }

  // 마우스 위치가 아직 초기화되지 않았거나 사용자가 마우스를 움직이지 않았을 때는 숨김
  if (!mousePosition || !isInitialized) {
    return null;
  }

  const blockType = currentMode.blockType || 'text';
  const blockSize = BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];

  // React Flow 좌표를 화면 좌표로 변환
  const screenPosition = reactFlow.flowToScreenPosition(mousePosition);

  // 블럭 타입에 따른 동적 크기
  const blockWidth = blockSize?.width ?? 200;
  const blockHeight = blockSize?.height ?? 150;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: screenPosition.x - blockWidth / 2,
        top: screenPosition.y - blockHeight / 2,
        cursor: 'crosshair',
      }}
    >
      {/* 스켈레톤 블럭 */}
      <div
        className="border-2 border-blue-500 border-dashed bg-blue-100/30 rounded-lg flex items-center justify-center"
        style={{ width: blockWidth, height: blockHeight }}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">📝</div>
          <div className="text-xs font-medium text-blue-600">
            {blockType === 'text' ? 'Text Block' : blockType}
          </div>
        </div>
      </div>

      {/* 플레이스홀더 텍스트 */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 whitespace-nowrap">
        클릭하여 블럭 생성 • ESC로 취소
      </div>
    </div>
  );
}
