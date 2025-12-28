import { type ReactNode, forwardRef } from 'react';

import type { TooltipContentProps } from '@radix-ui/react-tooltip';
import type { VariantProps } from 'class-variance-authority';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Toolbar Icon Button Component
 *
 * Tooltip과 Button을 조합한 재사용 가능한 컴포넌트
 * - Presentational 컴포넌트: Props만 받아서 렌더링
 * - Storybook에서 독립적으로 테스트 가능
 */
export interface ToolbarIconButtonProps extends React.ComponentPropsWithoutRef<
  typeof Button
> {
  /**
   * 아이콘 (ReactNode)
   */
  icon: ReactNode;

  /**
   * Tooltip 텍스트
   */
  tooltip: string;

  /**
   * 클릭 핸들러
   */
  onClick?: () => void;

  /**
   * 비활성화 여부
   */
  disabled?: boolean;

  /**
   * 추가 className
   */
  className?: string;

  /**
   * Button variant
   * @default "ghost"
   */
  variant?: VariantProps<typeof buttonVariants>['variant'];

  /**
   * Button size
   * @default "sm"
   */
  size?: VariantProps<typeof buttonVariants>['size'];

  /**
   * Tooltip content className (e.g. for z-index adjustments)
   */
  tooltipClassName?: string;

  /**
   * Tooltip side
   * @default "bottom"
   */
  tooltipSide?: TooltipContentProps['side'];
}

export const ToolbarIconButton = forwardRef<
  HTMLButtonElement,
  ToolbarIconButtonProps
>(
  (
    {
      icon,
      tooltip,
      onClick,
      tooltipClassName,
      disabled = false,
      className = 'h-7 w-7 p-0',
      variant = 'ghost',
      size = 'sm',
      tooltipSide = 'bottom',
      ...props
    },
    ref
  ) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            onClick={onClick}
            className={className}
            disabled={disabled}
            {...props}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className={`${tooltipClassName} select-none z-70`}
          side={tooltipSide}
          hasArrow={false}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }
);

ToolbarIconButton.displayName = 'ToolbarIconButton';
