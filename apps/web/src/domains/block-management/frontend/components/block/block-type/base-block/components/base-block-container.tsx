/**
 * Base Block Component (Refactored)
 *
 * Compound Component Pattern과 로직 분리를 적용한 리팩토링 버전
 *
 * 기능:
 * - Compound Component Pattern으로 서브 컴포넌트 조합
 * - Context를 통한 상태 공유
 * - UI/Business 로직 분리 (노코드 호환)
 *
 * 구조:
 * - BaseBlock (Provider + 기본 조합)
 * - BaseBlock.ResizeControl (리사이즈 핸들)
 * - BaseBlock.Handles (연결점)
 * - BaseBlock.Toolbar (상단 툴바)
 * - BaseBlock.ActionBar (우측 액션바)
 * - BaseBlock.Content (컨텐츠)
 */

import { memo, forwardRef } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { BaseBlockProvider } from '../core/provider';
import { ResizeControl } from './resize-control';
import { Handles } from './handles';
import { Toolbar } from './toolbar';
import { ActionBar } from './action-bar';
import { Content } from './content';
import { useBaseBlockContext } from '../core/context';
import { BaseBlockProps } from '../core/types';
import { UseBaseBlockOptions } from '../core/use-base-block';

export interface BaseBlockComponentProps extends BaseBlockProps {
  businessLogic?: UseBaseBlockOptions['businessLogic'];
}

/**
 * Base Block Root Component
 *
 * Provider + 기본 조합 (내부적으로 서브 컴포넌트들을 구성)
 */
const BaseBlockRoot = memo(
  forwardRef<HTMLDivElement, BaseBlockComponentProps>(
    ({ children, businessLogic, ...props }, ref) => {
      return (
        <BaseBlockProvider {...props} businessLogic={businessLogic}>
          <BaseBlockContainer ref={ref}>
            {/* 리사이즈 핸들 */}
            <ResizeControl />

            {/* 연결점 */}
            <Handles />

            {/* 상단 툴바 */}
            <Toolbar />

            {/* 우측 액션바 */}
            <ActionBar />

            {/* 실제 컨텐츠 */}
            <Content>{children}</Content>
          </BaseBlockContainer>
        </BaseBlockProvider>
      );
    }
  )
);

BaseBlockRoot.displayName = 'BaseBlock';

/**
 * Base Block Container
 *
 * 실제 DOM 컨테이너 (Context 소비)
 */
const BaseBlockContainer = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => {
  const {
    width,
    height,
    noBackground,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  } = useBaseBlockContext();

  return (
    <div
      ref={ref}
      className={cn('relative w-full h-full min-w-[100px] min-h-[70px]')}
      style={{
        width: width || 'auto',
        height: height || 'auto',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
});

BaseBlockContainer.displayName = 'BaseBlockContainer';

/**
 * Export as compound component
 */
export const BaseBlock = Object.assign(BaseBlockRoot, {
  ResizeControl,
  Handles,
  Toolbar,
  ActionBar,
  Content,
});

// Re-export types
export type { BaseBlockProps } from '../core/types';
