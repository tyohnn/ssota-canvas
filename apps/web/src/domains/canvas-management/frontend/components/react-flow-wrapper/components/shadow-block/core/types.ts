import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { CanvasMode } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';

// 외부 Props
// =============================================================================
// 1. Public Entry Point (Props)
// =============================================================================
export interface ShadowPreviewProps {
  blockType: BlockType;
  width: number;
  height: number;
}

// 마우스 상태
export interface MouseState {
  position: { x: number; y: number } | null;
  isInitialized: boolean;
}

// 블록 정보
export interface BlockInfo {
  blockType: BlockType;
  width: number;
  height: number;
}

// 렌더링 정보
export interface RenderInfo {
  screenPosition: { x: number; y: number };
  blockWidth: number;
  blockHeight: number;
  PreviewComponent: React.ComponentType<ShadowPreviewProps>;
}

// View Props (그룹화)
export interface ShadowBlockViewProps {
  renderInfo: RenderInfo;
  blockInfo: BlockInfo;
}

// Hook 반환 타입
export interface UseShadowBlockReturn {
  isVisible: boolean;
  renderInfo: RenderInfo | null;
  blockInfo: BlockInfo | null;
}

// UI Hook 반환 타입
export interface ShadowBlockUIState {
  mouseState: MouseState;
  setMousePosition: (pos: { x: number; y: number } | null) => void;
  setIsInitialized: (initialized: boolean) => void;
  resetMouseState: () => void;
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * Domain logic dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface DomainDependencies {
  // Canvas Mode
  isBlockCreationMode: () => boolean;
  getCurrentMode: () => CanvasMode;
  exitToDefaultMode: () => void;

  // Block Lifecycle
  createAndMountBlock: (
    blockType: BlockType,
    position: { x: number; y: number }
  ) => Promise<void>;

  // React Flow
  screenToFlowPosition: (position: { x: number; y: number }) => {
    x: number;
    y: number;
  };
}

// Business Hook 반환 타입
export interface ShadowBlockBusinessLogic {
  isBlockCreationMode: boolean;
  currentMode: CanvasMode;
  handleEscapeKey: () => void;
  handleBlockCreate: (clickEvent: MouseEvent) => void;
}
