import { useEffect } from 'react';

import { useReactFlow } from '@xyflow/react';

import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';

import { getShadowPreview } from './shadow-block-preview-registry';
import type {
  DomainDependencies,
  ShadowBlockContainerProps,
  UseShadowBlockReturn,
} from './types';
import { useShadowBlockBusiness } from './use-shadow-block.business';
import { useShadowBlockUI } from './use-shadow-block.ui';

/**
 * 통합 Hook for Shadow Block (오케스트레이션)
 *
 * UI + Business Hook 조합, 이벤트 리스너 등록, View Props 생성
 * 모든 외부 의존성(hooks)은 여기서만 호출
 */
export function useShadowBlock(
  props: ShadowBlockContainerProps
): UseShadowBlockReturn {
  const reactFlow = useReactFlow();

  // 1. Gather External Dependencies (The only place where external hooks are called)
  const canvasMode = useCanvasMode();
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId: props.pageId,
  });

  // 2. Bundle Dependencies into semantic objects
  const domainDependencies: DomainDependencies = {
    isBlockCreationMode: () => canvasMode.isBlockCreationMode(),
    getCurrentMode: () => canvasMode.getCurrentMode(),
    exitToDefaultMode: () => canvasMode.exitToDefaultMode(),
    createAndMountBlock: async (blockType, position) => {
      await blockLifecycle.createAndMountBlock(blockType, position);
    },
    screenToFlowPosition: position => reactFlow.screenToFlowPosition(position),
  };

  // UI Hook (마우스 상태 관리)
  const uiState = useShadowBlockUI();

  // Business Hook (모드 확인 및 핸들러) - 의존성 주입
  const business = useShadowBlockBusiness(
    domainDependencies,
    uiState.mouseState
  );

  // 마우스 이동 이벤트 리스너 등록 (오케스트레이션)
  useEffect(() => {
    if (!business.isBlockCreationMode) {
      uiState.resetMouseState();
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      uiState.setMousePosition(position);
      uiState.setIsInitialized(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [business.isBlockCreationMode, reactFlow, uiState]);

  // ESC 키 이벤트 리스너 등록 (오케스트레이션)
  useEffect(() => {
    if (!business.isBlockCreationMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') business.handleEscapeKey();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [business.isBlockCreationMode, business.handleEscapeKey]);

  // 클릭 이벤트 리스너 등록 (오케스트레이션)
  useEffect(() => {
    if (!business.isBlockCreationMode) return;

    document.addEventListener('click', business.handleBlockCreate);
    return () =>
      document.removeEventListener('click', business.handleBlockCreate);
  }, [business.isBlockCreationMode, business.handleBlockCreate]);

  // 렌더링 불필요 조건
  const isVisible =
    business.isBlockCreationMode &&
    business.currentMode.type === 'block-creation' &&
    uiState.mouseState.position !== null &&
    uiState.mouseState.isInitialized;

  if (!isVisible) {
    return { isVisible: false, renderInfo: null, blockInfo: null };
  }

  // View Props 생성 (의미 단위 그룹화)
  // currentMode.type === 'block-creation'이 이미 확인되었으므로 타입 단언 가능
  if (business.currentMode.type !== 'block-creation') {
    return { isVisible: false, renderInfo: null, blockInfo: null };
  }

  const blockType = business.currentMode.blockType || 'text';
  const blockSize = BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];
  const blockWidth = (blockSize?.width ?? 200) / 2;
  const blockHeight = (blockSize?.height ?? 150) / 2;

  const renderInfo = {
    screenPosition: reactFlow.flowToScreenPosition(
      uiState.mouseState.position!
    ),
    blockWidth,
    blockHeight,
    PreviewComponent: getShadowPreview(blockType),
  };

  const blockInfo = {
    blockType,
    width: blockWidth,
    height: blockHeight,
  };

  return {
    isVisible: true,
    renderInfo,
    blockInfo,
  };
}
