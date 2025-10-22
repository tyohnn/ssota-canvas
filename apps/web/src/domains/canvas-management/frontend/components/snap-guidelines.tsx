'use client';

import { memo } from 'react';
import { useViewport } from '@xyflow/react';
import { Guideline } from '../hooks/use-canvas-snap-guides';

interface SnapGuidelinesProps {
  guidelines: Guideline[];
}

/**
 * SnapGuidelines 컴포넌트
 *
 * 렌더링 조건: guidelines.length > 0 (가이드라인이 있을 때만 표시)
 * 드래그 중 스냅 가이드라인을 렌더링
 *
 * Note: React Flow의 viewport 변환을 적용하여 플로우 좌표를 화면 좌표로 변환
 */
export const SnapGuidelines = memo(function SnapGuidelines({
  guidelines,
}: SnapGuidelinesProps) {
  const viewport = useViewport();

  // 가이드라인이 없으면 렌더링하지 않음 (단순하고 명확한 조건)
  if (guidelines.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    >
      <g
        transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
      >
        {guidelines.map((guideline, index) => {
          const isVertical = guideline.type.includes('vertical');

          // 타입별 스타일 지정
          // center (중앙): 파란색 점선
          // edge (테두리): 파란색 실선
          let strokeColor: string;
          let strokeDasharray: string;
          let strokeWidth: number;

          const isCenterLine =
            guideline.type === 'center-vertical' ||
            guideline.type === 'center-horizontal';

          if (isCenterLine) {
            // 중앙 라인: 파란색 점선
            strokeColor = 'rgb(59, 130, 246)';
            strokeDasharray = '5 5';
            strokeWidth = 2 / viewport.zoom;
          } else {
            // 테두리 라인: 파란색 실선
            strokeColor = 'rgb(59, 130, 246)';
            strokeDasharray = '0';
            strokeWidth = 1.5 / viewport.zoom;
          }

          if (isVertical) {
            return (
              <line
                key={`${guideline.type}-${index}`}
                x1={guideline.position}
                y1={-10000} // 충분히 긴 선
                x2={guideline.position}
                y2={10000}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                className="transition-opacity duration-200"
              />
            );
          } else {
            return (
              <line
                key={`${guideline.type}-${index}`}
                x1={-10000}
                y1={guideline.position}
                x2={10000}
                y2={guideline.position}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                className="transition-opacity duration-200"
              />
            );
          }
        })}
      </g>
    </svg>
  );
});
