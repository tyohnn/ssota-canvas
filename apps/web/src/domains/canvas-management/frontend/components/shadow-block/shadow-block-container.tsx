'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasMode } from '../../hooks/use-canvas-mode';
import { useCanvasBlockLifecycle } from '../../hooks/use-canvas-block-lifecycle';
import type { Position } from '../../../shared/types/common.types';
import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';
import { getShadowPreview } from './shadow-block-preview-registry';

export interface ShadowBlockContainerProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
}

/**
 * ShadowBlockContainer Component
 *
 * 블럭 생성 모드에서 마우스를 따라다니는 Shadow Block 컴포넌트
 *
 * Features:
 * - 마우스 커서를 따라다니는 반투명 블럭
 * - 블록 타입별 커스텀 Preview 렌더링
 * - 십자형(+) 커서 표시
 * - 캔버스 클릭 시 블럭 생성 트리거
 * - ESC 키로 모드 취소
 *
 * 렌더링 조건: isBlockCreationMode() === true
 */
export function ShadowBlockContainer({
  pageId,
  orgId,
  workspaceId,
}: ShadowBlockContainerProps) {
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

  // 🔒 블록 생성 중 플래그 (중복 생성 방지)
  const isCreatingRef = useRef(false);

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

  // 캔버스 클릭 핸들러
  useEffect(() => {
    if (!isBlockCreationMode) return;

    const handleClick = (event: MouseEvent) => {
      // ⚠️ 이미 생성 중이면 무시 (중복 생성 방지 - 짧은 디바운스)
      if (isCreatingRef.current) {
        console.log(
          '[ShadowBlock] Block creation cooldown active, ignoring click'
        );
        return;
      }

      if (currentMode.type !== 'block-creation') return;

      const target = event.target as HTMLElement;

      // ✅ React Flow 영역 확인 (여러 방법으로 체크)
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

      console.log('[ShadowBlock] Click detected:', {
        targetElement: target.className,
        isPane: isReactFlowPane,
        isNode: isReactFlowNode,
        isEdge: isReactFlowEdge,
        isContainer: isInReactFlowContainer,
        isInReactFlow,
      });

      if (!isInReactFlow) {
        console.log('[ShadowBlock] Click outside React Flow, ignoring');
        return;
      }

      // ❌ 특정 UI 요소는 제외 (툴바, 컨트롤 등)
      const isExcludedElement =
        target.closest('[role="dialog"]') || // 다이얼로그
        target.closest('[role="menu"]') || // 메뉴
        target.closest('.react-flow__controls') || // 컨트롤 버튼
        target.closest('.react-flow__minimap') || // 미니맵
        target.closest('[data-radix-popper-content-wrapper]') || // Radix 팝오버
        target.closest('[data-exclude-block-creation]'); // 커스텀 제외

      if (isExcludedElement) {
        console.log('[ShadowBlock] Excluded UI element clicked, ignoring');
        return;
      }

      console.log('[ShadowBlock] ✅ Valid click, creating block...');

      // 블럭 타입별 크기 가져오기
      const blockType = currentMode.blockType || 'text';
      const blockSize = BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];

      // 마우스 위치를 React Flow 좌표로 변환
      const mouseFlowPosition =
        mousePosition ||
        reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

      // 마우스 포인터가 블록의 중앙이 되도록 위치 조정
      const adjustedPosition: Position = {
        x: mouseFlowPosition.x - (blockSize?.width ?? 200) / 2,
        y: mouseFlowPosition.y - (blockSize?.height ?? 150) / 2,
      };

      // 블럭 생성
      if (currentMode.blockType) {
        // 🔒 짧은 쿨다운 시작 (200ms) - 빠른 연속 클릭 방지
        isCreatingRef.current = true;
        setTimeout(() => {
          isCreatingRef.current = false;
        }, 200);

        // ✅ 비동기로 블록 생성 (Optimistic UI로 즉시 표시됨)
        blockLifecycle.createAndMountBlock(
          currentMode.blockType,
          adjustedPosition
        );

        // ✅ 즉시 모드 전환 (딜레이 없음)
        canvasMode.exitToDefaultMode();
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      // 컴포넌트 언마운트 시 플래그 초기화
      isCreatingRef.current = false;
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

  // 블록 타입별 Preview 컴포넌트 가져오기
  const PreviewComponent = getShadowPreview(blockType);

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: screenPosition.x - blockWidth / 2,
        top: screenPosition.y - blockHeight / 2,
        cursor: 'crosshair',
      }}
    >
      {/* Shadow Block Preview */}
      <PreviewComponent
        blockType={blockType}
        width={blockWidth}
        height={blockHeight}
      />

      {/* 플레이스홀더 텍스트 */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 whitespace-nowrap">
        클릭하여 블럭 생성 • ESC로 취소
      </div>
    </div>
  );
}
