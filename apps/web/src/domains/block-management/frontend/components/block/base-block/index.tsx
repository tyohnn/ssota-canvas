/**
 * Base Block - Entry Point
 *
 * Container Component: Hook → Props 변환
 *
 * Compound Component Pattern을 적용한 BaseBlock 컴포넌트
 *
 * 사용법:
 *
 * 1. 기본 사용 (내부 조합):
 * ```tsx
 * <BaseBlock data={blockData} selected={true}>
 *   <MyBlockContent />
 * </BaseBlock>
 * ```
 *
 * 2. 노코드 툴 사용 (Mock 비즈니스 로직):
 * ```tsx
 * const mockBusiness = useMockBaseBlockBusiness();
 * <BaseBlock data={blockData} businessLogic={mockBusiness}>
 *   <MyBlockContent />
 * </BaseBlock>
 * ```
 */

'use client';

import { forwardRef, memo } from 'react';

import { ActionBar } from './components/action-bar';
import { BaseBlockView } from './components/base-block-view';
import { Content } from './components/content';
import { Handles } from './components/handles';
import { ResizeControl } from './components/resize-control';
import type { BaseBlockProps } from './core/types';
import type { UseBaseBlockOptions } from './core/use-base-block';
import { useBaseBlock } from './core/use-base-block';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

export interface BaseBlockComponentProps extends BaseBlockProps {
  businessLogic?: UseBaseBlockOptions['businessLogic'];
}

/**
 * Base Block Container Component
 *
 * Hook을 사용하여 데이터를 가져오고 Props로 전달
 */
const BaseBlockContainer = memo(
  forwardRef<HTMLDivElement, BaseBlockComponentProps>(
    ({ children, businessLogic, ...props }, ref) => {
      // Hook으로 데이터 가져오기
      const contextValue = useBaseBlock(props, { businessLogic });
      const { readonly } = useCanvasReadOnly();

      return (
        <BaseBlockView
          ref={ref}
          data={contextValue.data}
          width={contextValue.width}
          height={contextValue.height}
          onMouseEnter={contextValue.handleMouseEnter}
          onMouseMove={contextValue.handleMouseMove}
          onMouseLeave={contextValue.handleMouseLeave}
          showAddButtonZones={
            !readonly &&
            contextValue.isCurrentBlockSelected &&
            contextValue.isSingleSelection
          }
          setHoverDirection={contextValue.setHoverDirection}
        >
          {/* 리사이즈 핸들 */}
          <ResizeControl
            data={contextValue.data}
            selected={contextValue.selected}
            isSingleSelection={contextValue.isSingleSelection}
            handleResizeStart={contextValue.handleResizeStart}
            handleResizeEnd={contextValue.handleResizeEnd}
          />

          {/* 연결점 - readonly 모드에서도 렌더링 (edges 렌더링을 위해 필요하지만 항상 숨김) */}
          <Handles
            isConnectable={contextValue.isConnectable}
            hoverDirection={contextValue.hoverDirection}
          />

          {/* 우측 액션바 */}
          <ActionBar
            data={contextValue.data}
            selected={contextValue.selected}
            isCurrentBlockSelected={contextValue.isCurrentBlockSelected}
            isSingleSelection={contextValue.isSingleSelection}
          />

          {/* 실제 컨텐츠 */}
          <Content textColorClass={contextValue.textColorClass}>
            {children}
          </Content>
        </BaseBlockView>
      );
    }
  )
);

BaseBlockContainer.displayName = 'BaseBlock';

// Export as BaseBlock
export const BaseBlock = BaseBlockContainer;
