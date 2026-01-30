/**
 * Canvasdown Context
 *
 * Canvasdown core를 한 번만 초기화하고 전역으로 제공하는 컨텍스트
 * parseCanvasdown을 사용하여 간소화된 구조로 렌더링을 수행합니다.
 */

'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { CanvasdownCore } from '@ssota-labs/canvasdown';
import {
  registerSSOTABlockTypes,
  registerSSOTAEdgeTypes,
} from '../../shared/services/canvasdown-registry.service';
import { useCanvasdownExecutor } from '../hooks/use-canvasdown-executor';

interface RenderCanvasdownParams {
  canvasdown: string;
  sourceBlockPosition?: { x: number; y: number };
  sourceBlockSize?: { width: number; height: number };
  sourceBlockId?: string;
  anchorBlockId?: string;
  anchorDirection?: 'right' | 'below';
}

interface CanvasdownContextValue {
  // Core instance (initialized once)
  core: CanvasdownCore;

  // Render function
  renderCanvasdown: (params: RenderCanvasdownParams) => Promise<{
    success: boolean;
    blockIdMap: Map<string, string>;
    errors: string[];
  }>;

  // Global state
  isRendering: boolean;
  blockIdMap: Map<string, string>;
}

const CanvasdownContext = createContext<CanvasdownContextValue | null>(null);

interface CanvasdownProviderProps {
  children: React.ReactNode;
  pageId: string;
}

/**
 * Canvasdown Provider
 *
 * Canvasdown core를 한 번만 초기화하고 렌더링 함수를 제공합니다.
 * parseCanvasdown을 사용하여 간소화된 구조로 렌더링을 수행합니다.
 */
export function CanvasdownProvider({ children, pageId }: CanvasdownProviderProps) {
  // Core를 한 번만 초기화
  const core = useMemo(() => {
    const canvasdownCore = new CanvasdownCore();
    registerSSOTABlockTypes(canvasdownCore);
    registerSSOTAEdgeTypes(canvasdownCore);
    return canvasdownCore;
  }, []);

  // 렌더링: executeRender에서 parseCanvasdown을 직접 호출
  const { isRendering, executeRender, blockIdMap } = useCanvasdownExecutor({
    pageId,
    core,
  });

  /**
   * Canvasdown 코드를 렌더링하는 함수
   * executeRender가 내부에서 parseCanvasdown을 호출하여 파싱 및 렌더링을 수행합니다.
   * Use sourceBlock* for first zone; use anchorBlockId + anchorDirection for subsequent zones.
   */
  const renderCanvasdown = useMemo(
    () => async (params: RenderCanvasdownParams) => {
      return executeRender(params);
    },
    [executeRender]
  );

  const value: CanvasdownContextValue = useMemo(
    () => ({
      core,
      renderCanvasdown,
      isRendering,
      blockIdMap,
    }),
    [core, renderCanvasdown, isRendering, blockIdMap]
  );

  return <CanvasdownContext.Provider value={value}>{children}</CanvasdownContext.Provider>;
}

/**
 * Hook to access Canvasdown context
 */
export function useCanvasdownContext(): CanvasdownContextValue {
  const context = useContext(CanvasdownContext);
  if (!context) {
    throw new Error('useCanvasdownContext must be used within CanvasdownProvider');
  }
  return context;
}
